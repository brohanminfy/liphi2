import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../Firebase/firebase';
import axios from 'axios';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

 const signup = async (username, email, password) => {
  try {
    setError('');
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: username });

    const response = await axios.post('http://localhost:5000/api/auth/signup', {
      uid: user.uid,
      username,
      email,
    });

    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    setCurrentUser(user);
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);

    if (auth.currentUser) {
      await auth.currentUser.delete();
    }

    setError(error.message);
    throw error;
  }
};


  // Login function
  const login = async (email, password) => {
    try {
      setError('');
      // 1. Firebase Authentication

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Backend Authentication
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        uid: user.uid,
        email:email,
      });

      // 3. Store user data and token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setCurrentUser(user);

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // 1. Sign out from Firebase
      await signOut(auth);
      
      // 2. Clear all local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 3. Clear any document-related data
      localStorage.removeItem('documents');
      localStorage.removeItem('currentDocId');
      
      // 4. Reset state
      setCurrentUser(null);
      setError('');
      
      // 5. Force page reload to clear any cached state
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Get user data from localStorage
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  const value = {
    currentUser,
    userData: getUserData(),
    loading,
    error,
    signup,
    login,
    logout,
    getUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
