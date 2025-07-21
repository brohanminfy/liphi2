import { db, auth } from '../config/firebase.js';

export const removeUserAccess = async (req, res) => {
    try {
        const docId = req.params.id;
        const { userIdToRemove } = req.body;
        const currentUserId = req.user.uid;

        const docRef = db.collection('docs').doc(docId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        const docData = doc.data();
        if (docData.roles[currentUserId] !== 'admin') {
            return res.status(403).json({ error: 'Only admins can remove users' });
        }

        if (docData.roles[userIdToRemove] === 'admin') {
            return res.status(400).json({ error: 'Cannot remove the document owner' });
        }

        const newRoles = { ...docData.roles };
        delete newRoles[userIdToRemove];
        const newMembers = Object.keys(newRoles);

        await docRef.update({
            roles: newRoles,
            members: newMembers
        });

        res.json({ message: 'User access removed successfully' });
    } catch (error) {
        console.error('Error removing user access:', error);
        res.status(500).json({ error: 'Failed to remove user access' });
    }
};