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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const finalProfile = await runTransaction(db, async (transaction) => {
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
          setProfile(finalProfile);
        } catch (error) {
          // Never leave a signed-in user stuck with profile=null (e.g. Firestore
          // rules not yet deployed, a transient network error, or a genuinely
          // corrupt document) — fall back to a usable in-memory student profile
          // so redirect logic elsewhere always has something to act on.
          console.error("Error fetching/creating user profile, using fallback:", error);
          setProfile(fallbackProfile(firebaseUser));
        }
      } else {
        setProfile(null);
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
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });

    // onAuthStateChanged creates the users and students documents, and may fire
    // before updateProfile completes (leaving 'New User' as the name). Write the
    // correct profile directly with all fields required by firestore.rules
    // (isValidUser), so the write is permitted whether it lands as a create or
    // an update; onAuthStateChanged's sync heals any lost race.
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
    // creditsRemaining/packageHistory are included unconditionally because
    // isValidStudent() in firestore.rules requires them on every write to this
    // document, including if this write races ahead of onAuthStateChanged's
    // own students/{uid} scaffold (Firestore transactions retry on conflict,
    // so this can't get clobbered by that scaffold write either way).
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
