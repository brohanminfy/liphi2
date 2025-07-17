
import admin, { db } from '../FirebaseAdmin/fireadmin.js';

const Signup = async (req, res) => {   
    const { uid, username, email } = req.body;
    console.log('Received signup request:', { uid, username, email });
    
    // Validate input
    if (!uid || !username || !email) {
        return res.status(400).json({
            error: 'Missing required fields',
            details: 'uid, username, and email are required'
        });
    }

    try {
        console.log('Processing signup request for:', { uid, username, email });
        
        // Verify the user exists in Firebase Auth
        try {
            const userRecord = await admin.auth().getUser(uid);
            console.log('Found existing user:', userRecord.uid);
            
            // Update user profile in Firebase Auth
            await admin.auth().updateUser(uid, {
                displayName: username,
                email: email,
            });
            
            // Create/Update user document in Firestore
            const userData = {
                uid: uid,
                username: username,
                email: email,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                profileCompleted: true,
                // Add any additional fields you want to store
                photoURL: userRecord.photoURL || null,
                lastLogin: admin.firestore.FieldValue.serverTimestamp()
            };

            // Using uid as the document ID for easy querying
            await db.collection('users').doc(uid).set(userData, { merge: true });
            
            console.log('Successfully updated user in Auth and Firestore');
            return res.status(200).json({ 
                message: 'User updated successfully',
                user: {
                    uid: userRecord.uid,
                    email: email,
                    username: username,
                    profileCompleted: true
                }
            });
        } catch (firebaseError) {
            console.error('Firebase error:', firebaseError);
            if (firebaseError.code === 'auth/user-not-found') {
                return res.status(404).json({
                    error: 'User not found',
                    details: 'The user does not exist in Firebase Auth'
                });
            }
            throw firebaseError;
        }
    } catch (error) {
        console.error('Error in signup:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message,
            code: error.code
        });
    }
}
export default Signup;