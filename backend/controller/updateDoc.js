import admin, { db } from '../FirebaseAdmin/fireadmin.js';

const updateDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.uid;

    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized: No user ID in token' });
    }

    // Check if document exists and user has permission
    const docRef = db.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const docData = doc.data();
    
    // Check if user has admin or editor access
    const hasAdminAccess = docData.roles?.admins?.includes(userId);
    const hasEditorAccess = docData.roles?.editors?.includes(userId);
    
    if (!hasAdminAccess && !hasEditorAccess) {
      return res.status(403).json({ error: 'Insufficient permissions to edit this document' });
    }

    // Prepare update data
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId
    };

    if (title !== undefined) {
      updateData.title = title;
    }

    if (content !== undefined) {
      updateData.content = content;
    }

    // Update the document
    await docRef.update(updateData);

    // Get the updated document
    const updatedDoc = await docRef.get();
    const updatedData = { _id: updatedDoc.id, ...updatedDoc.data() };

    res.status(200).json({ document: updatedData });
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

export default updateDoc;
