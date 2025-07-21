import { db, auth } from '../config/firebase.js';

export const shareDocument = async (req, res) => {
    try {
        const docId = req.params.id;
        const { email, role } = req.body;
        const currentUserId = req.user.uid;

        const userToAdd = await auth.getUserByEmail(email);
        if (!userToAdd) {
            return res.status(404).json({ error: 'User not found' });
        }

        const docRef = db.collection('docs').doc(docId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const docData = doc.data();
        
        const existingRole = docData.roles[userToAdd.uid];
        if (existingRole && existingRole === role) {
            return res.json({ message: "User already has this role." });
        }

        const newRoles = { ...docData.roles, [userToAdd.uid]: role };
        const newMembers = Object.keys(newRoles);

        await docRef.update({
            roles: newRoles,
            members: newMembers
        });

        const successMessage = existingRole
            ? `Updated ${email}'s role to ${role}`
            : `Document shared with ${email} as ${role}`;
        
        res.json({ message: successMessage });
       
    } catch (error) {
        console.error('Error sharing document:', error);
        res.status(500).json({ error: 'Failed to share document' });
    }
};