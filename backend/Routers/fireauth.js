// backend/routes/auth.js
import express from 'express';
import admin from '../FirebaseAdmin/fireadmin.js';
import { verifyToken } from '../controller/token.js';
import Signup from '../controller/Signup.js';
import Login from '../controller/Login.js';
const router = express.Router();

router.post('/verify-token', verifyToken);
router.post('/signup', Signup);
router.post('/login', Login);

export default router;
