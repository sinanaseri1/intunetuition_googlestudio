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

export interface UserProfile {
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
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
              const data = userDoc.data() as UserProfile;
              // Ensure students document exists for every user
              if (!studentDoc.exists()) {
                transaction.set(studentDocRef, {
                  userId: firebaseUser.uid,
                  creditsRemaining: 0,
                  packageHistory: []
                });
              }
              // Heal placeholder/missing names from the sign-up race so the
              // stored profile always matches the user's actual name.
              const storedName = (data.name || '').trim();
              if (storedName === '' || storedName === 'New User') {
                const updatedAt = new Date().toISOString();
                transaction.update(userDocRef, { name: derivedName, updatedAt });
                return { ...data, name: derivedName, updatedAt };
              }
              return data;
            } else {
              // Create a new profile, assigning admin role if it's the designated admin email
              const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
              const role: UserRole = firebaseUser.email === adminEmail ? 'admin' : 'student';
              const newProfile: UserProfile = {
                email: firebaseUser.email || '',
                name: derivedName,
                role: role,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              transaction.set(userDocRef, newProfile);
              transaction.set(studentDocRef, {
                userId: firebaseUser.uid,
                creditsRemaining: 0,
                packageHistory: []
              });

              return newProfile;
            }
          });
          setProfile(finalProfile);
        } catch (error) {
          console.error("Error fetching/creating user profile:", error);
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

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });

    // onAuthStateChanged creates the users and students documents, and may fire
    // before updateProfile completes (leaving 'New User' as the name). Write the
    // correct profile directly with all fields required by firestore.rules
    // (isValidUser), so the write is permitted whether it lands as a create or
    // an update; onAuthStateChanged's sync heals any lost race.
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
    const now = new Date().toISOString();
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: userCredential.user.email || '',
      name,
      role: userCredential.user.email === adminEmail ? 'admin' : 'student',
      createdAt: now,
      updatedAt: now,
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
