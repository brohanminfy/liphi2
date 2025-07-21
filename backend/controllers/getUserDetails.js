import { db, auth } from '../config/firebase.js';

export const getUserDetails = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    const userPromises = userIds.map(async (uid) => {
      try {
        const userRecord = await auth.getUser(uid);
        return {
          id: uid,
          name: userRecord.displayName || userRecord.email?.split('@')[0] || `User ${uid.slice(-4)}`,
          email: userRecord.email || '',
          avatarUrl: userRecord.photoURL || '',
        };
      } catch (error) {
        console.error(`Could not fetch user data for UID: ${uid}`, error);
        return {
          id: uid,
          name: `User ${uid.slice(-4)}`,
          email: '',
          avatarUrl: '',
        };
      }
    });

    const users = await Promise.all(userPromises);
    res.json(users);

  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};