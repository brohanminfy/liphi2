import { db, auth } from '../config/firebase.js';

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