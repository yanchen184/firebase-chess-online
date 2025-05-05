import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../hooks/useGame';
import ChessBoard from './ChessBoard';
import { getPlayerColor, isPlayerTurn } from '../utils/chessUtils';

/**
 * Game component that displays the current chess game.
 * Handles game state and player interactions.
 */
const Game = () => {
  const { gameId } = useParams();
  const { currentUser } = useAuth();
  const { 
    currentGame, 
    loading, 
    error, 
    makeMove, 
    joinGame, 
    listenToGame,
    resignGame,
    offerDraw,
    respondToDraw
  } = useGame();
  
  const [gameError, setGameError] = useState('');
  const [gameLoading, setGameLoading] = useState(false);
  const navigate = useNavigate();
  
  // Listen to game updates
  useEffect(() => {
    const unsubscribe = listenToGame(gameId);
    return () => unsubscribe();
  }, [gameId, listenToGame]);
  
  // Handle moving a piece
  const handleMove = async (from, to, piece) => {
    try {
      setGameLoading(true);
      setGameError('');
      await makeMove(gameId, from, to, piece);
    } catch (error) {
      setGameError(error.message);
    } finally {
      setGameLoading(false);
    }
  };
  
  // Handle joining a game
  const handleJoinGame = async () => {
    try {
      setGameLoading(true);
      setGameError('');
      await joinGame(gameId);
    } catch (error) {
      setGameError(error.message);
    } finally {
      setGameLoading(false);
    }
  };
  
  // Handle resign
  const handleResign = async () => {
    if (window.confirm('Are you sure you want to resign? You will lose the game.')) {
      try {
        setGameLoading(true);
        setGameError('');
        await resignGame(gameId);
      } catch (error) {
        setGameError(error.message);
      } finally {
        setGameLoading(false);
      }
    }
  };
  
  // Handle offer draw
  const handleOfferDraw = async () => {
    try {
      setGameLoading(true);
      setGameError('');
      await offerDraw(gameId);
    } catch (error) {
      setGameError(error.message);
    } finally {
      setGameLoading(false);
    }
  };
  
  // Handle draw response
  const handleDrawResponse = async (accept) => {
    try {
      setGameLoading(true);
      setGameError('');
      await respondToDraw(gameId, accept);
    } catch (error) {
      setGameError(error.message);
    } finally {
      setGameLoading(false);
    }
  };
  
  // Handle going back to dashboard
  const handleBackToDashboard = () => {
    navigate('/');
  };
  
  // Loading state
  if (loading && !currentGame) {
    return <div className="text-center py-8">Loading game...</div>;
  }
  
  // Error state
  if (error || !currentGame) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p className="text-red-600 mb-4">{error || 'Game not found'}</p>
        <button
          onClick={handleBackToDashboard}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  const playerColor = getPlayerColor(currentUser.uid, currentGame);
  const isMyTurn = isPlayerTurn(currentUser.uid, currentGame);
  const isPending = currentGame.status === 'pending';
  const isPlayer = playerColor !== null;
  const isCompleted = currentGame.status === 'completed';
  const isActive = currentGame.status === 'active';
  
  // Check if there's a pending draw offer
  const hasPendingDrawOffer = currentGame.drawOffer && 
    currentGame.drawOffer.status === 'pending' &&
    currentGame.drawOffer.to === playerColor;
  
  // Pending invitation that belongs to the current user
  const isPendingInvitation = isPending && currentGame.blackPlayer.email === currentUser.email;
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Chess Game</h1>
        <button
          onClick={handleBackToDashboard}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm"
        >
          Back to Dashboard
        </button>
      </div>
      
      {/* Game status section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="font-bold">Status:</span>{' '}
            <span className="capitalize">{currentGame.status}</span>
          </div>
          <div>
            <span className="font-bold">Current Turn:</span>{' '}
            <span className="capitalize">{currentGame.currentTurn}</span>
            {isMyTurn && !isCompleted && (
              <span className="ml-2 text-green-600 font-bold">(Your turn!)</span>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <span className="font-bold">White:</span>{' '}
            {currentGame.whitePlayer.displayName || currentGame.whitePlayer.email}
          </div>
          <div>
            <span className="font-bold">Black:</span>{' '}
            {currentGame.blackPlayer.displayName || currentGame.blackPlayer.email || 'Waiting for opponent'}
          </div>
        </div>
        
        {isCompleted && currentGame.winner && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
            <h3 className="text-lg font-bold text-yellow-800">
              Game Over! {currentGame.winner.charAt(0).toUpperCase() + currentGame.winner.slice(1)} wins!
            </h3>
            <p className="text-yellow-700">{currentGame.winReason}</p>
          </div>
        )}
        
        {hasPendingDrawOffer && (
          <div className="mt-4 p-4 bg-blue-100 border border-blue-400 rounded">
            <p className="text-blue-800 mb-2">Your opponent has offered a draw.</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDrawResponse(true)}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
                disabled={gameLoading}
              >
                Accept Draw
              </button>
              <button
                onClick={() => handleDrawResponse(false)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                disabled={gameLoading}
              >
                Decline Draw
              </button>
            </div>
          </div>
        )}
        
        {isPendingInvitation && (
          <div className="mt-4">
            <p className="mb-2">You've been invited to play this game!</p>
            <button
              onClick={handleJoinGame}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={gameLoading}
            >
              {gameLoading ? 'Joining game...' : 'Join Game'}
            </button>
          </div>
        )}
        
        {isActive && isPlayer && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleResign}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              disabled={gameLoading}
            >
              Resign
            </button>
            <button
              onClick={handleOfferDraw}
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
              disabled={gameLoading || (currentGame.drawOffer && currentGame.drawOffer.status === 'pending')}
            >
              {currentGame.drawOffer && currentGame.drawOffer.status === 'pending' 
                ? 'Draw Offered' 
                : 'Offer Draw'}
            </button>
          </div>
        )}
        
        {gameError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mt-3">
            {gameError}
          </div>
        )}
      </div>
      
      {/* Game board section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {isPending && !isPendingInvitation ? (
          <div className="text-center py-4">
            <p className="mb-3">Waiting for your opponent to join...</p>
            <p className="text-sm">
              Send this game ID to your opponent: <strong>{gameId}</strong>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-lg">
              <ChessBoard
                board={currentGame.board}
                currentTurn={currentGame.currentTurn}
                onMove={handleMove}
                userId={currentUser.uid}
                game={currentGame}
              />
            </div>
            
            {!isPlayer && (
              <div className="mt-4 text-center">
                <p>You are viewing this game as a spectator.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Move history section */}
      {currentGame.moves && currentGame.moves.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Move History</h2>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Player</th>
                  <th className="px-4 py-2">From</th>
                  <th className="px-4 py-2">To</th>
                  <th className="px-4 py-2">Piece</th>
                  <th className="px-4 py-2">Captured</th>
                </tr>
              </thead>
              <tbody>
                {currentGame.moves.map((move, index) => {
                  const playerInfo = 
                    move.player === currentGame.whitePlayer.uid
                      ? currentGame.whitePlayer
                      : currentGame.blackPlayer;
                  
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="border px-4 py-2 text-center">{index + 1}</td>
                      <td className="border px-4 py-2">
                        {playerInfo.displayName || playerInfo.email}
                      </td>
                      <td className="border px-4 py-2 text-center">{move.from}</td>
                      <td className="border px-4 py-2 text-center">{move.to}</td>
                      <td className="border px-4 py-2 text-center">{move.piece?.type}</td>
                      <td className="border px-4 py-2 text-center">
                        {move.capturedPiece ? move.capturedPiece.type : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;