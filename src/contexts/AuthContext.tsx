import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  User
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile as updateFirestoreProfile,
  type UserProfile
} from '../lib/firestoreService';
import { clearUnifiedCache } from '../lib/unifiedPremiumAccess';

interface UserData {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  birthday?: string;
  location?: string;
  phone?: string;
  plan?: string;
  tokensUsed?: number;
  tokensLimit?: number;
  aiPersonality?: string;
  aiCreativityLevel?: number;
  aiResponseLength?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastTokenResetAt?: Date; // Tracks when tokens were last reset/renewed
}

interface AuthContextType {
  currentUser: User | null;
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  earlyAdopterBonus: number | null; // Set when user just got early adopter bonus
  clearEarlyAdopterBonus: () => void;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserData>) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const SESSION_KEY = 'kroniq_session_timestamp';

// Token bonus configuration
// First 106 users get 300k tokens (100k base + 200k early adopter bonus)
// Users after 106 get 100k tokens
const EARLY_ADOPTER_LIMIT = 106;
const EARLY_ADOPTER_TOKENS = 300000; // 300k for first 106 users
const BASE_TOKENS = 100000;          // 100k for everyone after 106

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [earlyAdopterBonus, setEarlyAdopterBonus] = useState<number | null>(null);

  const clearEarlyAdopterBonus = () => setEarlyAdopterBonus(null);

  const updateSessionTimestamp = () => {
    localStorage.setItem(SESSION_KEY, Date.now().toString());
  };

  const checkSessionValidity = (): boolean => {
    const timestamp = localStorage.getItem(SESSION_KEY);
    if (!timestamp) return false;

    const elapsed = Date.now() - parseInt(timestamp, 10);
    return elapsed < SESSION_TIMEOUT_MS;
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
  };

  // Convert Firestore profile to UserData
  const profileToUserData = (profile: UserProfile): UserData => ({
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName || undefined,
    photoURL: profile.photoURL || undefined,
    plan: profile.plan,
    tokensUsed: profile.tokensUsed,
    tokensLimit: profile.tokensLimit,
    aiPersonality: profile.aiPersonality,
    aiCreativityLevel: profile.aiCreativityLevel,
    aiResponseLength: profile.aiResponseLength,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  });

  // Calculate tokens for new user based on signup order
  const calculateInitialTokens = (userCount: number): number => {
    if (userCount < EARLY_ADOPTER_LIMIT) {
      return EARLY_ADOPTER_TOKENS;
    } else {
      return BASE_TOKENS;
    }
  };

  const createProfile = async (userId: string, email: string, displayName?: string) => {
    try {
      // Check if profile already exists in Firestore
      const existingProfile = await getUserProfile(userId);
      if (existingProfile) {
        setUserData(profileToUserData(existingProfile));
        return;
      }

      // Also check Supabase for existing profile (for migrated users)
      // This prevents showing early adopter modal for users with existing accounts
      let hasExistingSupabaseProfile = false;
      try {
        const { supabase } = await import('../lib/supabaseClient');
        const { data: supabaseProfile } = await supabase
          .from('profiles')
          .select('id, tokens_balance, paid_tokens_balance')
          .eq('id', userId)
          .maybeSingle();

        if (supabaseProfile) {
          hasExistingSupabaseProfile = true;
          // If user has significant tokens in Supabase, they're definitely not new
          const existingTokens = (supabaseProfile.tokens_balance || 0) + (supabaseProfile.paid_tokens_balance || 0);
          if (existingTokens > EARLY_ADOPTER_TOKENS) {
            // User already has more tokens than early adopter bonus - don't show modal
            const profile = await createUserProfile(
              userId,
              email,
              displayName || null,
              null,
              existingTokens // Use their existing token count
            );
            setUserData(profileToUserData(profile));
            return; // Don't show early adopter modal
          }
        }
      } catch (supabaseError) {
        // Supabase check failed, continue with normal flow
      }

      // Creating new profile for user

      // Query current user count from Firebase to determine token allocation
      let currentUserCount = 0;
      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        currentUserCount = usersSnapshot.size;
      } catch (countError) {
        console.error('⚠️ Error counting users, defaulting to base tokens:', countError);
      }

      // Calculate tokens based on user count (first 106 get 300k, rest get 100k)
      const initialTokens = calculateInitialTokens(currentUserCount);
      const isEarlyAdopter = currentUserCount < EARLY_ADOPTER_LIMIT && !hasExistingSupabaseProfile;

      const profile = await createUserProfile(
        userId,
        email,
        displayName || null,
        null,
        initialTokens
      );

      setUserData(profileToUserData(profile));

      // Trigger early adopter welcome modal ONLY for truly new users
      if (isEarlyAdopter && !hasExistingSupabaseProfile) {
        setEarlyAdopterBonus(initialTokens);
      }
    } catch (error) {
      console.error('❌ Error creating profile:', error);
      throw error;
    }
  };

  const fetchUserData = async (userId: string, email: string) => {
    try {
      const profile = await getUserProfile(userId);

      if (profile) {
        // Check for monthly token reset
        try {
          const { checkAndResetTokens } = await import('../lib/tokenResetService');
          const resetResult = await checkAndResetTokens(userId);

          if (resetResult?.wasReset && !resetResult.isPaidUser) {
            // Tokens were reset for free user
            // Refetch profile to get updated token values
            const updatedProfile = await getUserProfile(userId);
            if (updatedProfile) {
              setUserData(profileToUserData(updatedProfile));
              return;
            }
          }
        } catch (resetError) {
          console.error('⚠️ [Auth] Token reset check failed:', resetError);
          // Continue with original profile data even if reset check fails
        }

        setUserData(profileToUserData(profile));
      } else {
        await createProfile(userId, email);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(null);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password should be at least 6 characters');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      clearUnifiedCache(userCredential.user.uid);
      await createProfile(userCredential.user.uid, email, displayName);
      updateSessionTimestamp();
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in instead.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password sign up is not enabled. Please contact support.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Google sign in successful
      updateSessionTimestamp();
      clearUnifiedCache(user.uid);

      // Check if profile exists, create if not
      const existingProfile = await getUserProfile(user.uid);

      if (!existingProfile) {
        // Creating profile for Google user
        await createProfile(user.uid, user.email!, user.displayName || undefined);
      } else {
        setUserData(profileToUserData(existingProfile));
      }
    } catch (error: any) {
      console.error('❌ Google sign in error:', error);

      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with this email using a different sign-in method.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      }

      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      updateSessionTimestamp();
      clearUnifiedCache(userCredential.user.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled. Please contact support.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please try again.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      clearSession();
      setUserData(null);
      clearUnifiedCache();
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<UserData>) => {
    if (!currentUser) {
      throw new Error('No user logged in. Please sign in first.');
    }

    try {
      const firestoreUpdates: Partial<UserProfile> = {};
      if (data.displayName !== undefined) firestoreUpdates.displayName = data.displayName || null;
      if (data.photoURL !== undefined) firestoreUpdates.photoURL = data.photoURL || null;
      if (data.aiPersonality !== undefined) firestoreUpdates.aiPersonality = data.aiPersonality;
      if (data.aiCreativityLevel !== undefined) firestoreUpdates.aiCreativityLevel = data.aiCreativityLevel;
      if (data.aiResponseLength !== undefined) firestoreUpdates.aiResponseLength = data.aiResponseLength;

      await updateFirestoreProfile(currentUser.uid, firestoreUpdates);
      setUserData(prev => prev ? { ...prev, ...data } : null);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const refreshUserData = async () => {
    if (currentUser) {
      await fetchUserData(currentUser.uid, currentUser.email || '');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        updateSessionTimestamp();
        setCurrentUser(user);
        clearUnifiedCache(user.uid);
        await fetchUserData(user.uid, user.email || '');
      } else {
        setCurrentUser(null);
        setUserData(null);
        clearSession();
        clearUnifiedCache();
      }

      setLoading(false);
    });

    const activityHandler = () => {
      if (currentUser && checkSessionValidity()) {
        updateSessionTimestamp();
      }
    };

    window.addEventListener('click', activityHandler);
    window.addEventListener('keydown', activityHandler);
    window.addEventListener('scroll', activityHandler);

    const sessionCheck = setInterval(() => {
      if (currentUser && !checkSessionValidity()) {
        firebaseSignOut(auth);
      }
    }, 60000);

    return () => {
      unsubscribe();
      window.removeEventListener('click', activityHandler);
      window.removeEventListener('keydown', activityHandler);
      window.removeEventListener('scroll', activityHandler);
      clearInterval(sessionCheck);
    };
  }, [currentUser]);

  const value: AuthContextType = {
    currentUser,
    user: currentUser,
    userData,
    loading,
    earlyAdopterBonus,
    clearEarlyAdopterBonus,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateUserProfile,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
