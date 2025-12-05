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
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabaseClient';
import { clearUnifiedCache } from '../lib/unifiedPremiumAccess';
import { PromoService } from '../lib/promoService';

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
}

interface AuthContextType {
  currentUser: User | null;
  user: User | null;
  userData: UserData | null;
  loading: boolean;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const ensureTokenBalance = async (userId: string) => {
    try {
      // Check if profile exists and has tokens
      const { data: profile } = await supabase
        .from('profiles')
        .select('tokens_balance, free_tokens_balance, paid_tokens_balance, current_tier')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        // Only log token status, database trigger handles initialization
        console.log('✅ User token status:', {
          userId,
          total: profile.tokens_balance,
          free: profile.free_tokens_balance,
          paid: profile.paid_tokens_balance,
          tier: profile.current_tier
        });
      }
    } catch (error) {
      console.error('Error checking token balance:', error);
    }
  };

  const createSupabaseProfile = async (userId: string, email: string, displayName?: string) => {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, tokens_balance, free_tokens_balance, paid_tokens_balance')
        .eq('id', userId)
        .maybeSingle();

      if (existingProfile) {
        console.log('✅ Profile already exists for user:', userId);
        await ensureTokenBalance(userId);
        return;
      }

      console.log('🆕 Creating new profile for user:', userId);
      console.log('ℹ️ Database trigger will handle token initialization (150k base + first 101 bonus if applicable)');

      // Create profile with minimal data - database trigger handles all token initialization
      const result = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          display_name: displayName || email.split('@')[0],
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (result.error) {
        console.error('❌ Error creating profile:', result.error);
        throw result.error;
      }

      console.log('✅ Profile created successfully');

      // Check token allocation immediately (trigger runs synchronously)
      await ensureTokenBalance(userId);

      // Automatically try to redeem FIRST100 promo for new users (separate from first 101 bonus)
      setTimeout(async () => {
        try {
          console.log('🎁 Checking FIRST100 promo eligibility for new user:', userId);

          const campaignStatus = await PromoService.checkCampaignStatus('FIRST100');
          console.log('📊 FIRST100 campaign status:', campaignStatus);

          if (campaignStatus.isValid && campaignStatus.remainingSlots > 0) {
            const redemption = await PromoService.redeemPromoCode(userId, 'FIRST100', email);
            console.log('🎁 FIRST100 redemption result:', redemption);

            if (redemption.success) {
              console.log(`✅ SUCCESS! Awarded ${redemption.tokensAwarded.toLocaleString()} tokens from FIRST100 promo!`);
            } else {
              console.log(`ℹ️ FIRST100 promo: ${redemption.message}`);
            }
          } else {
            console.log(`ℹ️ FIRST100 campaign not available: ${campaignStatus.message}`);
          }
        } catch (promoError) {
          console.error('❌ Error auto-redeeming FIRST100 promo:', promoError);
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Error in createSupabaseProfile:', error);
      throw error;
    }
  };

  const createDefaultProfile = async (userId: string, email: string, displayName?: string) => {
    const profileData: UserData = {
      id: userId,
      email,
      displayName: displayName || '',
      photoURL: '',
      bio: '',
      location: '',
      phone: '',
      plan: 'starter',
      tokensUsed: 0,
      tokensLimit: 10000,
      aiPersonality: 'balanced',
      aiCreativityLevel: 5,
      aiResponseLength: 'medium',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await createSupabaseProfile(userId, email, displayName);
      setUserData(profileData);
    } catch (error) {
      throw error;
    }
  };

  const fetchUserData = async (userId: string, email: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        setUserData({
          id: profile.id,
          email: profile.email,
          displayName: profile.display_name,
          photoURL: profile.photo_url,
          bio: profile.bio,
          birthday: profile.birthday,
          location: profile.location,
          phone: profile.phone,
          plan: profile.current_tier,
        });
      } else {
        await createDefaultProfile(userId, email);
      }
    } catch (error) {
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
      await createDefaultProfile(userCredential.user.uid, email, displayName);
    } catch (error: any) {

      // Translate Firebase error codes to user-friendly messages
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
      console.log('🔵 Starting Google sign in...');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      console.log('✅ Google sign in successful:', user.email);
      updateSessionTimestamp();
      clearUnifiedCache(user.uid);

      // Check if profile exists, create if not
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.uid)
        .maybeSingle();

      if (!existingProfile) {
        console.log('📝 Creating profile for Google user...');
        await createDefaultProfile(user.uid, user.email!, user.displayName || undefined);
      }

      await fetchUserData(user.uid, user.email!);
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

      // Translate Firebase error codes to user-friendly messages
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
      const supabaseData: any = {};
      if (data.displayName) supabaseData.display_name = data.displayName;
      if (data.photoURL) supabaseData.photo_url = data.photoURL;
      if (data.bio) supabaseData.bio = data.bio;
      if (data.birthday) supabaseData.birthday = data.birthday;
      if (data.location) supabaseData.location = data.location;
      if (data.phone) supabaseData.phone = data.phone;

      supabaseData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .update(supabaseData)
        .eq('id', currentUser.uid);

      if (error) throw error;

      setUserData(prev => prev ? { ...prev, ...data } : null);
    } catch (error: any) {

      if (error.code === 'PGRST116') {
        throw new Error('Profile not found. Please contact support.');
      } else if (error.code === 'unavailable') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.code === 'not-found') {
        throw new Error('Profile not found. Try signing out and back in.');
      } else {
        throw new Error(error.message || 'Failed to update profile. Please try again.');
      }
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
