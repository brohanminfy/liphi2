// backend/firebaseAdmin.js
import admin from 'firebase-admin';
import serviceAccount from '../adminkey/firebaseadmin.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
