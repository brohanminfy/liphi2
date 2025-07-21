import { db, auth } from '../config/firebase.js';

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