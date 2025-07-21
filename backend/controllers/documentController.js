import { db, auth } from '../config/firebase.js';

// Get all documents a user is a member of
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

// Get a specific document if the user has any role
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

// Create a new document, assigning the creator as admin
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

// Update a document based on user's role
export const updateDocument = async (req, res) => {
  try {
    const userId = req.user.uid;
    const docId = req.params.id;
    const { title, content, roles, comments, suggestions } = req.body;
    
    const docRef = db.collection('docs').doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const docData = doc.data();
    const userRole = docData.roles?.[userId];

    if (!userRole) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updateData = {
      updatedAt: new Date(),
    };
    
    // Role updates are restricted to admins
    if (roles) {
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Only admins can change roles.' });
      }
      updateData.roles = roles;
      updateData.members = Object.keys(roles);
    }
    
    // Content/Title updates restricted to admins/editors
    if (title !== undefined || content !== undefined) {
      if (userRole === 'viewer') {
        return res.status(403).json({ error: 'Viewers cannot edit the document.' });
      }
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
    }
    
    // Comments/Suggestions can be updated by any member
    if (comments !== undefined) {
        updateData.comments = comments;
    }
    if (suggestions !== undefined) {
        updateData.suggestions = suggestions;
    }

    await docRef.update(updateData);

    res.json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

// Delete a document, only if the user is an admin
export const deleteDocument = async (req, res) => {
  try {
    const userId = req.user.uid;
    const docId = req.params.id;
    
    const docRef = db.collection('docs').doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const userRole = doc.data().roles?.[userId];
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete this document' });
    }
    
    await docRef.delete();
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

// Get user details for mentions (new endpoint)
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

// Get all users and their roles for a document
export const getPermissions = async (req, res) => {
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
  
// Share a document with another user
export const shareDocument = async (req, res) => {
    try {
        const docId = req.params.id;
        const { email, role } = req.body;
        const currentUserId = req.user.uid;

        const userToAdd = await auth.getUserByEmail(email);
        if (!userToAdd) {
            return res.status(404).json({ error: 'User not found' });
        }

        const docRef = db.collection('docs').doc(docId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const docData = doc.data();
        
        const existingRole = docData.roles[userToAdd.uid];
        if (existingRole && existingRole === role) {
            return res.json({ message: "User already has this role." });
        }

        const newRoles = { ...docData.roles, [userToAdd.uid]: role };
        const newMembers = Object.keys(newRoles);

        await docRef.update({
            roles: newRoles,
            members: newMembers
        });

        const successMessage = existingRole
            ? `Updated ${email}'s role to ${role}`
            : `Document shared with ${email} as ${role}`;
        
        res.json({ message: successMessage });
       
    } catch (error) {
        console.error('Error sharing document:', error);
        res.status(500).json({ error: 'Failed to share document' });
    }
};

// Remove a user's access to a document
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