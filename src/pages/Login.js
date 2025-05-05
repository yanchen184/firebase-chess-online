import React from 'react';
import Login from '../components/Login';

/**
 * Login page component that renders the Login component.
 * This page is accessible to unauthenticated users.
 */
const LoginPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Login />
    </div>
  );
};

export default LoginPage;
