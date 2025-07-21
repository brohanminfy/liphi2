import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
 
const firebaseConfig = {
  apiKey: "AIzaSyD8plunUHwPtyMhPWrE3cv6DmtoUoCV50A",
  authDomain: "liphi-9cf05.firebaseapp.com",
  projectId: "liphi-9cf05",
  storageBucket: "liphi-9cf05.appspot.com",
  messagingSenderId: "497000637818",
  appId: "1:497000637818:web:785778b4361a2ef26f22c3",
  measurementId: "G-2NSD1GWXE0",
};
 
const app = initializeApp(firebaseConfig);
 
export const auth = getAuth(app);
export const db = getFirestore(app);
 
export default app;