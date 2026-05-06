import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            const isAdminEmail = currentUser.email === "musirkepulysamat@gmail.com";
            const newProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || 'New Scholar',
              email: currentUser.email,
              imageUrl: currentUser.photoURL,
              role: isAdminEmail ? 'admin' : 'student',
              university: '',
              bio: '',
              subjects: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              isVerified: isAdminEmail
            };
            await setDoc(userDocRef, newProfile).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}`));
            setProfile(newProfile);
            setIsAdmin(isAdminEmail);
          } else {
            const data = userDoc.data();
            // Auto-upgrade to admin if email matches
            if (currentUser.email === "musirkepulysamat@gmail.com" && data.role !== 'admin') {
              await updateDoc(userDocRef, { role: 'admin', isVerified: true });
              setProfile({ ...data, role: 'admin', isVerified: true });
              setIsAdmin(true);
            } else {
              setProfile(data);
              setIsAdmin(data.role === 'admin');
            }
          }
        } catch (error) {
          console.error("Error syncing profile:", error);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
