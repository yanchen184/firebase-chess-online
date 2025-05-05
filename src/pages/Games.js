import React from 'react';
import Dashboard from '../components/Dashboard';

/**
 * Games page component that renders the Dashboard component.
 * This page displays the user's games and allows creating new games.
 * It is protected and requires authentication.
 */
const GamesPage = () => {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <Dashboard />
    </div>
  );
};

export default GamesPage;
