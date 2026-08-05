import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';

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
  signInWithGoogle: () => Promise<void>;
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

  useEffect(() => {
    // Creates (or heals) the Firestore profile for whoever just signed in.
    // Runs for *every* registration path — email/password and Google OAuth
    // alike — because it hangs off onAuthStateChanged rather than off any one
    // sign-in call, so no provider can bypass profile creation.
    const syncUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile> =>
      runTransaction(db, async (transaction) => {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await transaction.get(userDocRef);
            const studentDocRef = doc(db, 'students', firebaseUser.uid);
            const studentDoc = await transaction.get(studentDocRef);

            const derivedName = deriveDisplayName(firebaseUser);

            if (userDoc.exists()) {
              const data = userDoc.data() as Partial<UserProfile>;
              // Ensure students document exists for every user
              if (!studentDoc.exists()) {
                transaction.set(studentDocRef, {
                  userId: firebaseUser.uid,
                  creditsRemaining: 0,
                  packageHistory: []
                }, { merge: true });
              }

              const role = coerceRole(data.role);
              const storedName = (data.name || '').trim();
              const nameNeedsHealing = storedName === '' || storedName === 'New User';

              // Heal placeholder/missing names from the sign-up race so the
              // stored profile always matches the user's actual name. We only
              // write back when the role itself is already valid — if the role
              // is missing/malformed we still return a usable in-memory profile
              // below, but we don't attempt a Firestore write for it, since
              // firestore.rules only allows an owner to update their own role
              // when the new value matches the existing one (an admin has to
              // fix a genuinely broken role via the Admin Dashboard).
              if (nameNeedsHealing && role === data.role) {
                const updatedAt = new Date().toISOString();
                transaction.update(userDocRef, { name: derivedName, updatedAt });
                return { ...data, name: derivedName, role, updatedAt } as UserProfile;
              }

              return {
                email: data.email || firebaseUser.email || '',
                name: storedName || derivedName,
                role,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
              };
            } else {
              // New accounts always start as students. Admin/teacher access is granted
              // afterwards by an existing admin via the Admin Dashboard's role picker,
              // which is backed by the isAdmin() role check in firestore.rules.
              const newProfile: UserProfile = {
                email: firebaseUser.email || '',
                name: derivedName,
                role: 'student',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              transaction.set(userDocRef, newProfile);
              transaction.set(studentDocRef, {
                userId: firebaseUser.uid,
                creditsRemaining: 0,
                packageHistory: []
              }, { merge: true });

              return newProfile;
            }
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Let an in-progress sign-up finish writing before syncing, so the two
      // don't race each other over the same documents.
      if (signUpInFlight) {
        await signUpInFlight.catch(() => {});
      }

      try {
        setProfile(await syncUserProfile(firebaseUser));
      } catch (error) {
        // A failed profile write leaves an account that can sign in but is
        // invisible to the admin User Management list, so retry once for
        // transient failures (network blip, contention) before giving up.
        console.error('Error creating user profile, retrying once:', error);
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setProfile(await syncUserProfile(firebaseUser));
        } catch (retryError) {
          // Never leave a signed-in user stuck with profile=null (e.g. Firestore
          // rules not yet deployed, or a genuinely corrupt document) — fall back
          // to a usable in-memory student profile so redirect logic elsewhere
          // always has something to act on. The account still shows up in admin
          // User Management (sourced from Firebase Auth) flagged "No profile".
          console.error('Error fetching/creating user profile, using fallback:', retryError);
          setProfile(fallbackProfile(firebaseUser));
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

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
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout }}>
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
