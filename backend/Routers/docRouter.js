import express from 'express';
import admin from '../FirebaseAdmin/fireadmin.js';
import createDoc from '../controller/createDoc.js';
import { verifyJWT } from '../jwtAuth/jwtauth.js';
import getDoc from '../controller/getDoc.js'; // Assuming you have a getDoc controller  
const docrouter = express.Router();

docrouter.post('/create', verifyJWT, createDoc);
docrouter.get('/', verifyJWT, getDoc);
// docrouter.get('/:id', verifyJWT, getADoc);

export default docrouter;