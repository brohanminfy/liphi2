import admin, { db } from '../FirebaseAdmin/fireadmin.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET; // ideally store this in .env

const Signup = async (req, res) => {
    const { uid, username, email } = req.body;
    console.log('Received signup request:', { uid, username, email });

    if (!uid || !username || !email) {
        return res.status(400).json({
            error: 'Missing required fields',
            details: 'uid, username, and email are required'
        });
    }

    try {
        const userRecord = await admin.auth().getUser(uid);
        console.log('Found existing user:', userRecord.uid);

        // Update user profile in Firebase Auth
        await admin.auth().updateUser(uid, {
            displayName: username,
            email: email,
        });

        // Store user data in Firestore
        const userData = {
            uid: uid,
            username: username,
            email: email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection('users').doc(uid).set(userData, { merge: true });

        // ✅ Create JWT token
        const token = jwt.sign(
            {
                uid,
                username,
                email,
            },
            JWT_SECRET,
            { expiresIn: '7d' } // optional: token expires in 7 days
        );

        return res.status(200).json({
            message: 'User updated successfully',
            token,
            user: {
                uid,
                email,
                username,
                profileCompleted: true
            }
        });
    } catch (error) {
        console.error('Error in signup:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message,
            code: error.code
        });
    }
};

export default Signup;
