import express from 'express';
import admin, { db } from '../FirebaseAdmin/fireadmin.js';

const getADoc = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid; // set from verifyJWT middleware

    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized: No user ID in token' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    const docRef = db.collection('documents').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = docSnap.data();
    const documentId = docSnap.id;

    // Check if user has access to this document
    const userRoles = document.roles || {};
    const hasAccess = 
      userRoles.admins?.includes(userId) ||
      userRoles.editors?.includes(userId) ||
      userRoles.viewers?.includes(userId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized: No access to this document' });
    }

    // Get user details for collaborators
    const getCollaboratorDetails = async (userIds) => {
      if (!userIds || userIds.length === 0) return [];
      
      const userDetails = [];
      for (const uid of userIds) {
        try {
          const userDoc = await db.collection('users').doc(uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userDetails.push({
              uid,
              email: userData.email,
              username: userData.username
            });
          }
        } catch (error) {
          console.error(`Error fetching user ${uid}:`, error);
        }
      }
      return userDetails;
    };

    // Get collaborator details
    const [adminDetails, editorDetails, viewerDetails] = await Promise.all([
      getCollaboratorDetails(userRoles.admins || []),
      getCollaboratorDetails(userRoles.editors || []),
      getCollaboratorDetails(userRoles.viewers || [])
    ]);

    // Format response
    const response = {
      id: documentId,
      title: document.title,
      content: document.content,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      createdBy: document.createdBy,
      roles: {
        admins: adminDetails.map(user => user.email),
        editors: editorDetails.map(user => user.email),
        viewers: viewerDetails.map(user => user.email)
      },
      userRole: userRoles.admins?.includes(userId) ? 'admin' : 
                userRoles.editors?.includes(userId) ? 'editor' : 'viewer'
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

export default getADoc; 