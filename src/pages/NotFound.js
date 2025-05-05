import React from 'react';
import NotFound from '../components/NotFound';

/**
 * NotFound page component that renders the NotFound component.
 * This page is displayed when a user navigates to a non-existent route.
 */
const NotFoundPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <NotFound />
    </div>
  );
};

export default NotFoundPage;
