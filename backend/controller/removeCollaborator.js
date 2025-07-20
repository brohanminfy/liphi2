import express from 'express';
import admin, { db } from '../FirebaseAdmin/fireadmin.js';

const removeCollaborator = async (req, res) => {
  try {
    const { documentId, userEmail, role } = req.body;
    const currentUserId = req.user.uid; // set from verifyJWT middleware

    if (!currentUserId) {
      return res.status(403).json({ error: 'Unauthorized: No user ID in token' });
    }

    if (!documentId || !userEmail || !role) {
      return res.status(400).json({ error: 'Missing required fields: documentId, userEmail, role' });
    }

    if (!['editor', 'viewer'].includes(role)) {
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
      return res.status(403).json({ error: 'Unauthorized: Only admins can remove collaborators' });
    }

    // Find the user by email
    const userQuery = await db.collection('users').where('email', '==', userEmail).get();
    
    if (userQuery.empty) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    const userDoc = userQuery.docs[0];
    const targetUserId = userDoc.id;

    // Check if user is actually in the specified role
    const roleArray = role === 'editor' ? 'editors' : 'viewers';
    if (!document.roles?.[roleArray]?.includes(targetUserId)) {
      return res.status(400).json({ error: `User is not a ${role} of this document` });
    }

    // Remove user from the role
    const updateData = {};
    if (role === 'editor') {
      updateData['roles.editors'] = admin.firestore.FieldValue.arrayRemove(targetUserId);
    } else if (role === 'viewer') {
      updateData['roles.viewers'] = admin.firestore.FieldValue.arrayRemove(targetUserId);
    }

    updateData.updatedAt = new Date();

    await docRef.update(updateData);

    // Get updated document
    const updatedDocSnap = await docRef.get();
    const updatedDocument = updatedDocSnap.data();

    res.status(200).json({ 
      message: `Successfully removed ${userEmail} as ${role}`,
      document: {
        id: docRef.id,
        ...updatedDocument
      }
    });

  } catch (err) {
    console.error('Error removing collaborator:', err);
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
};

export default removeCollaborator; 