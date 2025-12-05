import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAgD7C055XQLjZZCLaiCKfsZYz8r5XDqEQ",
  authDomain: "kosmio-ai.firebaseapp.com",
  projectId: "kosmio-ai",
  storageBucket: "kosmio-ai.firebasestorage.app",
  messagingSenderId: "171097290073",
  appId: "1:171097290073:web:7135cd156467ffff63c848",
  measurementId: "G-B24HV8XE06"
};

console.log('🔥 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('✅ Firebase initialized successfully');
console.log('   Project:', firebaseConfig.projectId);
