/**
 * Delete all Firebase Auth users except specified email
 * 
 * SETUP:
 * 1. Go to Firebase Console > Project Settings > Service Accounts
 * 2. Click "Generate new private key" and download the JSON file
 * 3. Save it as "serviceAccountKey.json" in this scripts folder
 * 4. Run: node scripts/deleteFirebaseUsers.js
 */

const admin = require('firebase-admin');

// Initialize with service account
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const KEEP_EMAIL = 'aistearunica@gmail.com';

async function deleteAllUsersExcept(keepEmail) {
    console.log(`\n🔥 Firebase User Cleanup Script`);
    console.log(`📧 Keeping: ${keepEmail}`);
    console.log(`${'='.repeat(50)}\n`);

    let usersDeleted = 0;
    let usersKept = 0;
    let nextPageToken;

    do {
        // List users in batches of 1000
        const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);

        for (const userRecord of listUsersResult.users) {
            if (userRecord.email === keepEmail) {
                console.log(`✅ KEEPING: ${userRecord.email} (${userRecord.uid})`);
                usersKept++;
            } else {
                try {
                    await admin.auth().deleteUser(userRecord.uid);
                    console.log(`🗑️  DELETED: ${userRecord.email || 'no-email'} (${userRecord.uid})`);
                    usersDeleted++;
                } catch (error) {
                    console.error(`❌ FAILED to delete ${userRecord.email}: ${error.message}`);
                }
            }
        }

        nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 Summary:`);
    console.log(`   Users deleted: ${usersDeleted}`);
    console.log(`   Users kept: ${usersKept}`);
    console.log(`\n✅ Done!`);

    process.exit(0);
}

// Run the script
deleteAllUsersExcept(KEEP_EMAIL);
