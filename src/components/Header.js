import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Header component for the application.
 * Displays the app title, navigation links, and user authentication status.
 * @param {Object} props - Component props
 * @param {string} props.version - Current app version to display
 */
const Header = ({ version }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold">
            Chess Game
          </Link>
          <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">{version}</span>
        </div>
        
        <nav>
          <ul className="flex space-x-4">
            {currentUser ? (
              <>
                <li className="px-2">
                  <span className="text-gray-300">
                    {currentUser.displayName || currentUser.email}
                  </span>
                </li>
                <li>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-300 hover:text-white"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="text-gray-300 hover:text-white">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-gray-300 hover:text-white">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;