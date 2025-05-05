import React from 'react';
import Register from '../components/Register';

/**
 * Register page component that renders the Register component.
 * This page is accessible to unauthenticated users.
 */
const RegisterPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Register />
    </div>
  );
};

export default RegisterPage;
