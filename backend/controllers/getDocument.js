import { db, auth } from '../config/firebase.js';

export const getDocument = async (req, res) => {
  try {
    const userId = req.user.uid;
    const docId = req.params.id;
    const docRef = db.collection('docs').doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const data = doc.data();
    
    if (!data.roles?.[userId]) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};