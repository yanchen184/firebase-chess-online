import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * PrivateRoute component protects routes that require authentication.
 * Redirects to login page if user is not authenticated.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 */
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  // Show loading state while auth state is being checked
  if (loading) {
    return <div className="flex justify-center items-center p-8">Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // Render children if authenticated
  return children;
};

export default PrivateRoute;
