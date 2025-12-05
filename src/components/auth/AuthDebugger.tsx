import React, { useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const AuthDebugger: React.FC = () => {
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('test123456');
  const [logs, setLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFirebaseConnection = async () => {
    setTesting(true);
    setLogs([]);
    addLog('🔍 Starting Firebase diagnostics...');

    try {
      // Test 1: Check Firebase initialization
      addLog('✅ Firebase SDK loaded');
      addLog(`   Auth instance: ${auth ? 'OK' : 'FAILED'}`);
      addLog(`   DB instance: ${db ? 'OK' : 'FAILED'}`);
      addLog(`   Project: ${auth.app.options.projectId}`);

      // Test 2: Try to sign up
      addLog('📝 Attempting sign up...');
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        addLog(`✅ Sign up successful! User ID: ${userCredential.user.uid}`);

        // Test 3: Create profile in Firestore
        addLog('📝 Creating Firestore profile...');
        await setDoc(doc(db, 'profiles', userCredential.user.uid), {
          email: testEmail,
          displayName: 'Test User',
          createdAt: new Date()
        });
        addLog('✅ Firestore profile created');

        // Test 4: Read profile back
        addLog('📖 Reading profile back...');
        const profileDoc = await getDoc(doc(db, 'profiles', userCredential.user.uid));
        if (profileDoc.exists()) {
          addLog('✅ Profile read successful');
        } else {
          addLog('❌ Profile not found');
        }

        // Clean up - delete the test user
        addLog('🧹 Cleaning up test user...');
        await userCredential.user.delete();
        addLog('✅ Test user deleted');

      } catch (signUpError: any) {
        if (signUpError.code === 'auth/email-already-in-use') {
          addLog('ℹ️ Email already exists, trying sign in instead...');

          // Test sign in
          try {
            const signInCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
            addLog(`✅ Sign in successful! User ID: ${signInCredential.user.uid}`);

            // Sign out after test
            await auth.signOut();
            addLog('✅ Signed out successfully');
          } catch (signInError: any) {
            addLog(`❌ Sign in failed: ${signInError.code} - ${signInError.message}`);
          }
        } else {
          addLog(`❌ Sign up failed: ${signUpError.code} - ${signUpError.message}`);
        }
      }

      addLog('🎉 Diagnostics complete!');
    } catch (error: any) {
      addLog(`❌ Critical error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="glass-panel rounded-2xl p-4 border border-white/20 shadow-2xl">
        <h3 className="text-white font-bold mb-3 text-sm">Auth Debugger</h3>

        <div className="space-y-2 mb-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full px-3 py-2 glass-panel border border-white/20 rounded-lg text-white text-xs"
            placeholder="Test email"
          />
          <input
            type="password"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            className="w-full px-3 py-2 glass-panel border border-white/20 rounded-lg text-white text-xs"
            placeholder="Test password"
          />
        </div>

        <button
          onClick={testFirebaseConnection}
          disabled={testing}
          className="w-full bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Run Diagnostics'}
        </button>

        {logs.length > 0 && (
          <div className="mt-3 max-h-60 overflow-y-auto space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className="text-xs font-mono text-white/70 break-words">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
