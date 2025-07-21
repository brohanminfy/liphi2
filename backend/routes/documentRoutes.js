import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

import { getAllDocuments } from '../controllers/getAllDocuments.js';
import { getDocument } from '../controllers/getDocument.js';
import { createDocument } from '../controllers/createDocument.js';
import { updateDocument } from '../controllers/updateDocument.js';
import { deleteDocument } from '../controllers/deleteDocument.js';
import { sharePermissions } from '../controllers/getPermission.js';
import { shareDocument } from '../controllers/shareDocument.js';
import { removeUserAccess } from '../controllers/removeUserAccess.js';
import { getUserDetails } from '../controllers/getUserDetails.js';

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
router.get('/note/:id/access', sharePermissions);
router.post('/note/:id/invite', shareDocument);
router.post('/note/:id/remove_user', removeUserAccess);
router.post('/members/info', getUserDetails);

export default router;