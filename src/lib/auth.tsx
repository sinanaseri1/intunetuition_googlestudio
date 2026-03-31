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
            
            if (userDoc.exists()) {
              const data = userDoc.data() as UserProfile;
              // Auto-upgrade the designated admin email if they aren't already an admin
              if (firebaseUser.email === 'naseri.sina007@gmail.com' && data.role !== 'admin') {
                data.role = 'admin';
                transaction.set(userDocRef, { role: 'admin' }, { merge: true });
              }
              return data;
            } else {
              // Create a new profile, assigning admin role if it's the designated admin email
              const role = firebaseUser.email === 'naseri.sina007@gmail.com' ? 'admin' : 'student';
              const newProfile: UserProfile = {
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'New User',
                role: role,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              transaction.set(userDocRef, newProfile);
              
              // Also create the student record for everyone (even admins might want to take lessons)
              const studentDocRef = doc(db, 'students', firebaseUser.uid);
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
    
    // We explicitly write the full document here to ensure it passes Firestore security rules
    // regardless of whether onAuthStateChanged has already created the document or not.
    // The transaction in onAuthStateChanged will handle concurrent writes safely.
    const role = email === 'naseri.sina007@gmail.com' ? 'admin' : 'student';
    const now = new Date().toISOString();
    const newProfile: UserProfile = {
      email: email,
      name: name,
      role: role,
      createdAt: now,
      updatedAt: now,
    };
    
    await setDoc(doc(db, 'users', userCredential.user.uid), newProfile);
    await setDoc(doc(db, 'students', userCredential.user.uid), {
      userId: userCredential.user.uid,
      creditsRemaining: 0,
      packageHistory: []
    }, { merge: true });
    
    // Update the local profile state so the UI reflects the correct name immediately
    setProfile(newProfile);
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
