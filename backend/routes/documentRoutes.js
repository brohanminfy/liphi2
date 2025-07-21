import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getAllDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getPermissions,
  shareDocument,
  removeUserAccess,
  getUserDetails
} from '../controllers/documentController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Document routes
router.get('/notes', getAllDocuments);
router.post('/notes', createDocument);

// Routes for a specific document
router.get('/note/:id', getDocument);
router.put('/note/:id', updateDocument);
router.delete('/note/:id', deleteDocument);

// Sharing routes
router.get('/note/:id/access', getPermissions);
router.post('/note/:id/invite', shareDocument);
router.post('/note/:id/remove_user', removeUserAccess);
router.post('/members/info', getUserDetails);

export default router;