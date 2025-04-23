import React from 'react';
import { Link } from 'react-router-dom';

/**
 * NotFound component displayed when a user navigates to a non-existent route.
 * Provides a friendly error message and a link back to the home page.
 */
const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Oops! Page not found.</p>
      <Link
        to="/"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Go back to dashboard
      </Link>
    </div>
  );
};

export default NotFound;