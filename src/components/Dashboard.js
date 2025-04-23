import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../hooks/useGame';

/**
 * Dashboard component displays the user's games and allows creating new games.
 * Shows active, pending, and completed games.
 */
const Dashboard = () => {
  const { currentUser } = useAuth();
  const { userGames, loading, error, createGame, fetchUserGames } = useGame();
  
  const [opponentEmail, setOpponentEmail] = useState('');
  const [createGameLoading, setCreateGameLoading] = useState(false);
  const [createGameError, setCreateGameError] = useState('');
  const [createGameSuccess, setCreateGameSuccess] = useState('');

  // Refresh games when component mounts
  useEffect(() => {
    fetchUserGames();
  }, [fetchUserGames]);

  // Filter games by status
  const activeGames = userGames.filter(game => game.status === 'active');
  const pendingGames = userGames.filter(game => game.status === 'pending');
  const completedGames = userGames.filter(game => game.status === 'completed');

  const handleCreateGame = async (e) => {
    e.preventDefault();
    
    if (!opponentEmail) {
      setCreateGameError('Please enter an opponent email');
      return;
    }
    
    try {
      setCreateGameLoading(true);
      setCreateGameError('');
      setCreateGameSuccess('');
      
      const gameId = await createGame(opponentEmail);
      
      setOpponentEmail('');
      setCreateGameSuccess(`Game created! Share this ID with your opponent: ${gameId}`);
      
      // Refresh games list
      fetchUserGames();
    } catch (error) {
      setCreateGameError(error.message);
    } finally {
      setCreateGameLoading(false);
    }
  };

  if (loading && userGames.length === 0) {
    return <div className="text-center">Loading your games...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Chess Games</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Create new game form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Create New Game</h2>
        
        {createGameError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <span className="block sm:inline">{createGameError}</span>
          </div>
        )}
        
        {createGameSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
            <span className="block sm:inline">{createGameSuccess}</span>
          </div>
        )}
        
        <form onSubmit={handleCreateGame} className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Opponent's email"
              value={opponentEmail}
              onChange={(e) => setOpponentEmail(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
            disabled={createGameLoading}
          >
            {createGameLoading ? 'Creating...' : 'Create Game'}
          </button>
        </form>
      </div>
      
      {/* Active games */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Active Games</h2>
        
        {activeGames.length === 0 ? (
          <p className="text-gray-600">You don't have any active games.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGames.map(game => (
              <GameCard 
                key={game.id} 
                game={game} 
                currentUser={currentUser} 
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Pending games */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Pending Games</h2>
        
        {pendingGames.length === 0 ? (
          <p className="text-gray-600">You don't have any pending games.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingGames.map(game => (
              <GameCard 
                key={game.id} 
                game={game} 
                currentUser={currentUser} 
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Completed games */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Completed Games</h2>
        
        {completedGames.length === 0 ? (
          <p className="text-gray-600">You don't have any completed games.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGames.map(game => (
              <GameCard 
                key={game.id} 
                game={game} 
                currentUser={currentUser} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * GameCard component represents a single game in the dashboard.
 * @param {Object} props - Component props
 * @param {Object} props.game - Game data
 * @param {Object} props.currentUser - Current user data
 */
const GameCard = ({ game, currentUser }) => {
  const isWhitePlayer = game.whitePlayer.uid === currentUser.uid;
  const opponent = isWhitePlayer ? game.blackPlayer : game.whitePlayer;
  
  // Format creation date
  const createdAt = game.createdAt?.toDate 
    ? new Date(game.createdAt.toDate()).toLocaleDateString()
    : 'Unknown date';
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold">
            Game vs {opponent.displayName || opponent.email || 'Waiting for opponent'}
          </h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
          </span>
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          <p>Created: {createdAt}</p>
          <p>Your Color: {isWhitePlayer ? 'White' : 'Black'}</p>
          <p>Current Turn: {game.currentTurn.charAt(0).toUpperCase() + game.currentTurn.slice(1)}</p>
        </div>
        
        <Link 
          to={`/game/${game.id}`} 
          className="inline-block bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded"
        >
          {game.status === 'pending' ? 'View Game' : 'Play Game'}
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;