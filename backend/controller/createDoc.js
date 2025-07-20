import express from 'express';
import admin, { db } from '../FirebaseAdmin/fireadmin.js';

const createDoc = async (req, res) => {
  try {
    const { title, content, createdAt } = req.body;
    const userId = req.user.uid; // set from verifyJWT middleware

    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized: No user ID in token' });
    }

    const docRef = await db.collection('documents').add({
      title: title || 'Untitled Document',
      content: content || [],
      createdAt: createdAt || new Date().toISOString(),
      createdBy: userId,
      roles: {
        admins: [userId],     // Creator is admin
        editors: [],          // Can be updated later
        viewers: []           // Can be updated later
      }
    });

    const newDoc = await docRef.get();
    const documentData = { _id: docRef.id, ...newDoc.data() };

    res.status(201).json({ document: documentData });
  } catch (err) {
    console.error('Error creating document:', err);
    res.status(500).json({ error: 'Failed to create document' });
  }
};

export default createDoc;
