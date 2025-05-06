import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../services/firebase';

// Create auth context
export const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Register function
  const register = async (email, password, username) => {
    try {
      setError('');
      // Add console logs for debugging
      console.log('Attempting to register with:', { email, username });
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User registered successfully:', userCredential.user);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: username
      });
      console.log('User profile updated with username:', username);
      
      return userCredential.user;
    } catch (error) {
      console.error('Registration error:', error.code, error.message);
      // Provide more user-friendly error messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please log in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check your email format.';
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Authentication service is not properly configured. Please try again later.';
        console.error('Firebase configuration issue detected. Please check your Firebase settings.');
      }
      
      setError(errorMessage);
      throw error;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setError('');
      console.log('Attempting to login with email:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in successfully:', userCredential.user);
      
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error.code, error.message);
      // Provide more user-friendly error messages
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Authentication service is not properly configured. Please try again later.';
        console.error('Firebase configuration issue detected. Please check your Firebase settings.');
      }
      
      setError(errorMessage);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    console.log('Logging out user');
    return signOut(auth);
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid} logged in` : 'User logged out');
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    register,
    logout,
    error,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};