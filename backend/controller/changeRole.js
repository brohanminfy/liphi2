import express from 'express';
import admin, { db } from '../FirebaseAdmin/fireadmin.js';

const changeRole = async (req, res) => {
  try {
    const { documentId, userEmail, newRole } = req.body;
    const currentUserId = req.user.uid; // set from verifyJWT middleware

    if (!currentUserId) {
      return res.status(403).json({ error: 'Unauthorized: No user ID in token' });
    }

    if (!documentId || !userEmail || !newRole) {
      return res.status(400).json({ error: 'Missing required fields: documentId, userEmail, newRole' });
    }

    if (!['editor', 'viewer'].includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role. Must be "editor" or "viewer"' });
    }

    // Get the document to check permissions
    const docRef = db.collection('documents').doc(documentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = docSnap.data();

    // Check if current user is admin of the document
    if (!document.roles?.admins?.includes(currentUserId)) {
      return res.status(403).json({ error: 'Unauthorized: Only admins can change roles' });
    }

    // Find the user by email
    const userQuery = await db.collection('users').where('email', '==', userEmail).get();
    
    if (userQuery.empty) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    const userDoc = userQuery.docs[0];
    const targetUserId = userDoc.id;

    // Check if user is already an admin (can't change admin roles)
    if (document.roles?.admins?.includes(targetUserId)) {
      return res.status(400).json({ error: 'Cannot change admin roles' });
    }

    // Determine current role and remove from it
    const updateData = {};
    let currentRole = null;

    if (document.roles?.editors?.includes(targetUserId)) {
      currentRole = 'editor';
      updateData['roles.editors'] = admin.firestore.FieldValue.arrayRemove(targetUserId);
    } else if (document.roles?.viewers?.includes(targetUserId)) {
      currentRole = 'viewer';
      updateData['roles.viewers'] = admin.firestore.FieldValue.arrayRemove(targetUserId);
    } else {
      return res.status(400).json({ error: 'User is not a collaborator of this document' });
    }

    // Add to new role
    if (newRole === 'editor') {
      updateData['roles.editors'] = admin.firestore.FieldValue.arrayUnion(targetUserId);
    } else if (newRole === 'viewer') {
      updateData['roles.viewers'] = admin.firestore.FieldValue.arrayUnion(targetUserId);
    }

    updateData.updatedAt = new Date();

    await docRef.update(updateData);

    // Get updated document
    const updatedDocSnap = await docRef.get();
    const updatedDocument = updatedDocSnap.data();

    res.status(200).json({ 
      message: `Successfully changed ${userEmail} from ${currentRole} to ${newRole}`,
      document: {
        id: docRef.id,
        ...updatedDocument
      }
    });

  } catch (err) {
    console.error('Error changing role:', err);
    res.status(500).json({ error: 'Failed to change role' });
  }
};

export default changeRole; 