import admin, { db } from '../FirebaseAdmin/fireadmin.js';

const Login = async (req, res) => {
    const { uid, email } = req.body;
    console.log('Received login request:', { uid, email });

    // Validate input
    if (!uid || !email) {
        return res.status(400).json({
            error: 'Missing required fields',
            details: 'uid and email are required'
        });
    }

    try {
        // First verify the user exists in Firebase Auth
        const userRecord = await admin.auth().getUser(uid);
        console.log('Found user in Firebase Auth:', userRecord.uid);

        // Then check if user exists in Firestore
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'User not found',
                details: 'User is not registered in the system. Please sign up first.'
            });
        }

        // Get the existing user data
        const userData = userDoc.data();

        // Update last login time
        const updateData = {
            lastLogin: admin.firestore.FieldValue.serverTimestamp(),
            lastLoginEmail: email
        };
        
        try {
            await db.collection('users').doc(uid).set(updateData, { merge: true });
            console.log('Successfully updated last login time');
        } catch (updateError) {
            console.error('Error updating last login:', updateError);
            // Continue with login even if update fails
        }

        console.log('Login successful, sending user data');
        return res.status(200).json({
            message: 'Login successful',
            user: {
                uid: userRecord.uid,
                email: email,
                username: userData.username,
                profileCompleted: userData.profileCompleted,
                photoURL: userData.photoURL
            }
        });

    } catch (error) {
        console.error('Error in login:', error);
        
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
}

export default Login;
