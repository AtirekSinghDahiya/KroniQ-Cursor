/**
 * useAuth Hook
 * Uses Firebase Auth instead of Supabase
 * 
 * Note: This is a compatibility hook. For most cases, use the AuthContext directly:
 * import { useAuth } from '../contexts/AuthContext';
 */

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth changes using Firebase
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return {
    user,
    loading,
    signOut,
  };
}