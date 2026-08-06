import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export type UserRole = 'student' | 'teacher' | 'admin';
const VALID_ROLES: UserRole[] = ['student', 'teacher', 'admin'];

export interface UserProfile {
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// The fields captured by the sign-up form and stored on students/{uid}
// alongside the scaffold fields (userId/creditsRemaining/packageHistory)
// that firestore.rules' isValidStudent() requires on every write.
export interface StudentSignUpDetails {
  phone: string;
  childName: string;
  yearGroup: string;
  school: string;
}

export interface PackageHistoryEntry {
  packageId: string;
  location: string;
  planName: string;
  credits: number;
  purchasedAt: string;
  sessionId: string;
  amountTotal: number | null;
}

export interface StudentProfileData {
  userId: string;
  creditsRemaining: number;
  packageHistory: PackageHistoryEntry[];
  childName?: string;
  yearGroup?: string;
  school?: string;
  phone?: string;
  gdprConsentGiven?: boolean;
  gdprConsentDate?: string;
  gdprConsentVersion?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  /**
   * Set when the profile could not be read from Firestore and `profile` is a
   * least-privilege placeholder rather than the real record. Surfaced in the UI
   * so a privileged user sees "we couldn't load your account" instead of being
   * silently treated as a student.
   */
  profileError: string | null;
  reloadProfile: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, studentDetails: StudentSignUpDetails) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function deriveDisplayName(firebaseUser: FirebaseUser): string {
  const displayName = firebaseUser.displayName?.trim();
  if (displayName) {
    return displayName;
  }
  const emailLocalPart = firebaseUser.email?.split('@')[0]?.trim();
  if (emailLocalPart) {
    return emailLocalPart;
  }
  return 'New User';
}

// Coerces whatever is stored under `role` to a known UserRole without ever
// writing back to Firestore — a legacy/malformed doc (missing role, or a
// role outside the enum) should never block sign-in, it should just be
// treated as the least-privileged role until an admin fixes it explicitly.
function coerceRole(role: unknown): UserRole {
  return VALID_ROLES.includes(role as UserRole) ? (role as UserRole) : 'student';
}

// Used ONLY when users/{uid} itself cannot be read — i.e. we genuinely do not
// know the role. It deliberately assumes the least-privileged role, and callers
// must pair it with `profileError` so the degraded state is visible rather than
// looking like a real demotion.
function fallbackProfile(firebaseUser: FirebaseUser): UserProfile {
  const now = new Date().toISOString();
  return {
    email: firebaseUser.email || '',
    name: deriveDisplayName(firebaseUser),
    role: 'student',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Best-effort creation of the students/{uid} scaffold.
 *
 * Deliberately separate from profile resolution and deliberately non-fatal.
 * These two concerns used to share one transaction, which meant a failure to
 * write this document rolled back the whole thing and pushed the caller onto
 * fallbackProfile() — silently demoting an admin to 'student'. Role lives in
 * users/{uid} and must never depend on any other document existing.
 *
 * Only students get one: admins and teachers have no use for a credits/package
 * record, so creating one for them is pure downside.
 */
async function ensureStudentRecord(uid: string, role: UserRole): Promise<void> {
  if (role !== 'student') return;
  try {
    const studentDocRef = doc(db, 'students', uid);
    if (!(await getDoc(studentDocRef)).exists()) {
      await setDoc(studentDocRef, {
        userId: uid,
        creditsRemaining: 0,
        packageHistory: [],
      }, { merge: true });
    }
  } catch (error) {
    // Never rethrow: the user is signed in with a valid role either way, and
    // the pages that need this document create it on demand.
    console.warn('Could not ensure students record (non-fatal):', error);
  }
}

// Held while signUpWithEmail is writing its profile documents.
//
// onAuthStateChanged fires the instant the account exists — before those writes
// land — so the profile sync would otherwise run concurrently, snapshot the
// documents as missing, and commit with an `exists: false` precondition that is
// no longer true by the time it lands. That surfaces as a spurious
// permission-denied on every single sign-up. Awaiting this serialises the two,
// so the sync sees the finished documents and makes no conflicting writes.
let signUpInFlight: Promise<void> | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  /**
   * Resolves the signed-in user's profile from users/{uid} — the single source
   * of truth for `role`.
   *
   * Reads only. The one write it can make (creating a brand-new profile) is for
   * users who have no document at all. Nothing about an admin's or teacher's
   * role can be changed by the state of any other collection, so deleting
   * students/ or teachers/ can never demote anyone.
   */
  const resolveProfile = React.useCallback(async (firebaseUser: FirebaseUser): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const snapshot = await getDoc(userDocRef);
    const derivedName = deriveDisplayName(firebaseUser);

    if (snapshot.exists()) {
      const data = snapshot.data() as Partial<UserProfile>;
      const role = coerceRole(data.role);
      const storedName = (data.name || '').trim();

      const resolved: UserProfile = {
        email: data.email || firebaseUser.email || '',
        name: storedName || derivedName,
        role,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };

      // Heal placeholder names left by the sign-up race. Non-fatal by design:
      // a rejected cosmetic write must never cost the user their real role.
      // Skipped when the stored role is malformed, since firestore.rules only
      // lets an owner update their own document when the role is unchanged.
      const nameNeedsHealing = storedName === '' || storedName === 'New User';
      if (nameNeedsHealing && role === data.role) {
        try {
          const updatedAt = new Date().toISOString();
          await updateDoc(userDocRef, { name: derivedName, updatedAt });
          resolved.name = derivedName;
          resolved.updatedAt = updatedAt;
        } catch (error) {
          console.warn('Could not heal display name (non-fatal):', error);
        }
      }

      return resolved;
    }

    // No document at all — a genuinely new account. New accounts always start
    // as students; admin/teacher access is granted afterwards by an existing
    // admin, backed by the isAdmin() check in firestore.rules.
    const now = new Date().toISOString();
    const newProfile: UserProfile = {
      email: firebaseUser.email || '',
      name: derivedName,
      role: 'student',
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(userDocRef, newProfile, { merge: true });
    return newProfile;
  }, []);

  const applyProfile = React.useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const resolved = await resolveProfile(firebaseUser);
      setProfile(resolved);
      setProfileError(null);
      // Fire-and-forget: cannot affect the role that was just resolved.
      void ensureStudentRecord(firebaseUser.uid, resolved.role);
    } catch (error) {
      console.error('Could not read user profile, retrying once:', error);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const resolved = await resolveProfile(firebaseUser);
        setProfile(resolved);
        setProfileError(null);
        void ensureStudentRecord(firebaseUser.uid, resolved.role);
      } catch (retryError) {
        // users/{uid} itself is unreadable, so the role is genuinely unknown.
        // Keep the app navigable with a least-privilege placeholder, but flag
        // it loudly — this is the only path that can make an admin look like a
        // student, and it must never pass for a real role change.
        console.error('Could not read user profile, using placeholder:', retryError);
        setProfile(fallbackProfile(firebaseUser));
        setProfileError(
          retryError instanceof Error && /permission/i.test(retryError.message)
            ? 'We could not load your account permissions. Some areas may be hidden.'
            : 'We could not load your account details. Some areas may be hidden.'
        );
      }
    }
  }, [resolveProfile]);

  const reloadProfile = React.useCallback(async () => {
    const current = auth.currentUser;
    if (current) await applyProfile(current);
  }, [applyProfile]);

  useEffect(() => {
    // Hangs off onAuthStateChanged rather than any single sign-in call, so no
    // provider (email/password or Google OAuth) can bypass profile creation.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setProfileError(null);
        setLoading(false);
        return;
      }

      // Let an in-progress sign-up finish writing before resolving, so the two
      // don't race each other over the same document.
      if (signUpInFlight) {
        await signUpInFlight.catch(() => {});
      }

      await applyProfile(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [applyProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string, studentDetails: StudentSignUpDetails) => {
    // Claim the flag *before* creating the account: onAuthStateChanged fires as
    // soon as createUserWithEmailAndPassword resolves, so anything set after
    // that point is already too late to prevent the race.
    let releaseSignUp: () => void = () => {};
    signUpInFlight = new Promise<void>((resolve) => { releaseSignUp = resolve; });

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });

      // Written here rather than left to onAuthStateChanged so the real name is
      // stored (that listener can only derive a placeholder before updateProfile
      // completes). All fields required by firestore.rules' isValidUser are
      // included so the write is permitted as either a create or an update.
      const now = new Date().toISOString();
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email || '',
        name,
        role: 'student',
        createdAt: now,
        updatedAt: now,
      }, { merge: true });

      // Capture the child/parent details and GDPR consent directly at sign-up so
      // email/password users land straight on /dashboard instead of being routed
      // through the separate /student-profile and /consent steps (those remain
      // as a fallback for Google sign-in, which can't collect this data itself).
      // creditsRemaining/packageHistory are required by isValidStudent() on
      // create; writing 0/[] also satisfies startsWithNoCredits(), which stops a
      // client seeding itself paid credits.
      await setDoc(doc(db, 'students', userCredential.user.uid), {
        userId: userCredential.user.uid,
        phone: studentDetails.phone.trim(),
        childName: studentDetails.childName.trim(),
        yearGroup: studentDetails.yearGroup.trim(),
        school: studentDetails.school.trim(),
        gdprConsentGiven: true,
        gdprConsentDate: now,
        gdprConsentVersion: '1.0',
        creditsRemaining: 0,
        packageHistory: [],
      }, { merge: true });

      setProfile((prev) => prev ? { ...prev, name } : prev);
    } finally {
      // Release even on failure, so a failed sign-up can't wedge the listener.
      releaseSignUp();
      signUpInFlight = null;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileError, reloadProfile, signInWithEmail, signUpWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
