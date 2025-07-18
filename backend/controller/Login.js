import admin, { db } from '../FirebaseAdmin/fireadmin.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET; // make sure to set this in your .env

const Login = async (req, res) => {
    const { uid, email } = req.body;
    console.log('Received login request:', { uid, email });

    
    if (!uid || !email) {
        return res.status(400).json({
            error: 'Missing required fields',
            details: 'uid and email are required'
        });
    }

    try {
        // 1. Verify user in Firebase Auth
        const userRecord = await admin.auth().getUser(uid);
        console.log('Found user in Firebase Auth:', userRecord.uid);

        // 2. Check Firestore for user data
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'User not found',
                details: 'User is not registered in the system. Please sign up first.'
            });
        }

        const userData = userDoc.data();

        // 3. Update last login timestamp
        try {
            await db.collection('users').doc(uid).set({
                lastLogin: admin.firestore.FieldValue.serverTimestamp(),
                lastLoginEmail: email,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log('Last login updated.');
        } catch (updateError) {
            console.error('Failed to update last login:', updateError);
            // Proceed anyway
        }

        // 4. ✅ Generate JWT
        const token = jwt.sign({
            uid: userRecord.uid,
            username: userData.username,
            email
        }, JWT_SECRET, {
            expiresIn: '7d'
        });

        // 5. Respond with token and user data
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                uid: userRecord.uid,
                email,
                username: userData.username,
                profileCompleted: userData.profileCompleted,
                photoURL: userData.photoURL || null
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({
                error: 'User not found',
                details: 'The user does not exist in Firebase Auth'
            });
        }
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message,
            code: error.code
        });
    }
};

export default Login;