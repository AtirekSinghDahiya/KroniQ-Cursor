import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "kosmio-ai.firebaseapp.com",
  projectId: "kosmio-ai",
  storageBucket: "kosmio-ai.firebasestorage.app",
  messagingSenderId: "171097290073",
  appId: "1:171097290073:web:7135cd156467ffff63c848",
  measurementId: "G-B24HV8XE06"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
