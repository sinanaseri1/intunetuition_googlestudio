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
              return data;
            } else {
              // Create a new profile, assigning admin role if it's the designated admin email
          const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
              const role: UserRole = firebaseUser.email === adminEmail ? 'admin' : 'student';
              const newProfile: UserProfile = {
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'New User',
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
    
    // onAuthStateChanged creates the users and students documents.
    // We update the users document with the correct name here since onAuthStateChanged
    // fires before updateProfile completes, so it gets 'New User' initially.
    await new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser && firebaseUser.uid === userCredential.user.uid) {
          unsubscribe();
          resolve();
        }
      });
    });
    
    // Update the name that onAuthStateChanged set to 'New User'
    await setDoc(doc(db, 'users', userCredential.user.uid), { name }, { merge: true });
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
