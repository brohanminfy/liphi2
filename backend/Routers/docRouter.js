import express from 'express';
import admin from '../FirebaseAdmin/fireadmin.js';
import createDoc from '../controller/createDoc.js';
import { verifyJWT } from '../jwtAuth/jwtauth.js';
import getDoc from '../controller/getDoc.js'; // Assuming you have a getDoc controller  
import shareDoc from '../controller/shareDoc.js';
import getADoc from '../controller/getADoc.js';
import removeCollaborator from '../controller/removeCollaborator.js';
import changeRole from '../controller/changeRole.js';
import updateDoc from '../controller/updateDoc.js';

const docrouter = express.Router();

docrouter.post('/create', verifyJWT, createDoc);
docrouter.get('/', verifyJWT, getDoc);
docrouter.post('/share', verifyJWT, shareDoc);
docrouter.post('/remove-collaborator', verifyJWT, removeCollaborator);
docrouter.post('/change-role', verifyJWT, changeRole);
docrouter.get('/:id', verifyJWT, getADoc);
docrouter.put('/:id', verifyJWT, updateDoc);

export default docrouter;