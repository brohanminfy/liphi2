import { db, auth } from '../config/firebase.js';


export const createDocument = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { title, content } = req.body;
    
    const docData = {
      title: title || 'Untitled Document',
      comments: [],
      suggestions: [],
      roles: {
        [userId]: 'admin',
      },
      members: [userId],
      createdByName: req.user.name || req.user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('docs').add(docData);
    
    res.status(201).json({
      id: docRef.id,
      ...docData,
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};