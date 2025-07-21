import { db, auth } from '../config/firebase.js';

export const sharePermissions = async (req, res) => {
    try {
      const docId = req.params.id;
      const docRef = db.collection('docs').doc(docId);
      const doc = await docRef.get();
  
      if (!doc.exists) {
        return res.status(404).json({ error: 'Document not found' });
      }
  
      const roles = doc.data().roles || {};
      const userIds = Object.keys(roles);
      
      const userPromises = userIds.map(async (uid) => {
        try {
          const userRecord = await auth.getUser(uid);
          return {
              userId: uid,
              email: userRecord.email,
              name: userRecord.displayName || 'Unnamed User',
              role: roles[uid]
          };
        } catch (error) {
          console.error(`Could not fetch user data for UID: ${uid}`, error);
          return null;
        }
      });
  
      const users = (await Promise.all(userPromises)).filter(Boolean);
  
      const owner = users.find(user => user.role === 'admin');
      const permissions = users.filter(user => user.role !== 'admin');
  
      res.json({ owner, permissions });
  
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({ error: 'Failed to fetch permissions' });
    }
};