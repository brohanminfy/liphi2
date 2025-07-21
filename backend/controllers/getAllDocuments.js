import { db, auth } from '../config/firebase.js';

export const getAllDocuments = async (req, res) => {
  try {
    const userId = req.user.uid;
    const docsRef = db.collection('docs');
    
    const snapshot = await docsRef
      .where('members', 'array-contains', userId)
      .orderBy('updatedAt', 'desc')
      .get();
    
    const documents = [];
    snapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      });
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};
