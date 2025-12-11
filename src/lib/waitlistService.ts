/**
 * Waitlist Firebase Service
 * Separate Firebase instance for storing waitlist entries
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// Waitlist Firebase configuration (separate from main app)
// Note: Firebase API keys are safe to expose in client-side code.
// Security is enforced via Firebase Console security rules, not by hiding the key.
const waitlistFirebaseConfig = {
    apiKey: "AIzaSyCK2Gj5g-lFT2vlsk81pk1_PTEGavjboF8",
    authDomain: "coming-soon-be1cd.firebaseapp.com",
    projectId: "coming-soon-be1cd",
    storageBucket: "coming-soon-be1cd.firebasestorage.app",
    messagingSenderId: "999915948548",
    appId: "1:999915948548:web:af8d3d54a61889b6c08351",
    measurementId: "G-JPQ9F9ZQXW"
};

// Initialize the waitlist Firebase app with a unique name to avoid conflicts
const WAITLIST_APP_NAME = 'waitlist-app';

const getWaitlistApp = () => {
    const existingApp = getApps().find(app => app.name === WAITLIST_APP_NAME);
    if (existingApp) {
        return existingApp;
    }
    return initializeApp(waitlistFirebaseConfig, WAITLIST_APP_NAME);
};

const waitlistApp = getWaitlistApp();
const waitlistDb = getFirestore(waitlistApp);
const waitlistAuth = getAuth(waitlistApp);

interface WaitlistEntry {
    email: string;
    displayName?: string;
    photoURL?: string;
    uid: string;
    joinedAt: any;
    source: string;
}

/**
 * Check if an email is already on the waitlist
 */
export const isEmailOnWaitlist = async (email: string): Promise<boolean> => {
    try {
        const waitlistRef = collection(waitlistDb, 'kroniq_waitlist');
        const q = query(waitlistRef, where('email', '==', email));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking waitlist:', error);
        return false;
    }
};

/**
 * Add an email to the waitlist
 */
export const addToWaitlist = async (entry: Omit<WaitlistEntry, 'joinedAt'>): Promise<{ success: boolean; message: string }> => {
    try {
        // Check if already on waitlist
        const alreadyJoined = await isEmailOnWaitlist(entry.email);
        if (alreadyJoined) {
            return { success: false, message: "You're already on the waitlist!" };
        }

        // Add to waitlist
        const waitlistRef = collection(waitlistDb, 'kroniq_waitlist');
        await addDoc(waitlistRef, {
            ...entry,
            joinedAt: serverTimestamp(),
        });
        return { success: true, message: "Successfully joined the waitlist! 🎉" };
    } catch (error) {
        console.error('Error adding to waitlist:', error);
        return { success: false, message: "Failed to join waitlist. Please try again." };
    }
};

/**
 * Sign in with Google and add to waitlist
 * Also signs user into the main app after successful waitlist join
 */
export const joinWaitlistWithGoogle = async (): Promise<{ success: boolean; message: string; email?: string; shouldRedirect?: boolean }> => {
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        const result = await signInWithPopup(waitlistAuth, provider);
        const user = result.user;

        if (!user.email) {
            return { success: false, message: "Could not get email from Google account." };
        }

        // Add to waitlist
        const addResult = await addToWaitlist({
            email: user.email,
            displayName: user.displayName || undefined,
            photoURL: user.photoURL || undefined,
            uid: user.uid,
            source: 'early_bird_offer'
        });

        // Sign out from waitlist app (doesn't affect main app auth)
        await waitlistAuth.signOut();

        // Return result - the component will handle main app sign-in
        return { ...addResult, email: user.email, shouldRedirect: addResult.success };
    } catch (error: any) {
        console.error('Waitlist Google sign in error:', error);

        if (error.code === 'auth/popup-closed-by-user') {
            return { success: false, message: "Sign in cancelled. Please try again." };
        } else if (error.code === 'auth/popup-blocked') {
            return { success: false, message: "Popup blocked. Please allow popups for this site." };
        }

        return { success: false, message: "Failed to sign in. Please try again." };
    }
};

/**
 * Get waitlist count
 */
export const getWaitlistCount = async (): Promise<number> => {
    try {
        const waitlistRef = collection(waitlistDb, 'kroniq_waitlist');
        const snapshot = await getDocs(waitlistRef);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting waitlist count:', error);
        return 0;
    }
};

/**
 * Get remaining spots (out of first 100)
 */
export const getRemainingSpots = async (): Promise<number> => {
    const count = await getWaitlistCount();
    return Math.max(0, 100 - count);
};
