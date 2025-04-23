import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  where, 
  onSnapshot,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { initialBoardSetup } from '../utils/chessUtils';

// Create game context
export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [userGames, setUserGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create a new game
  const createGame = async (opponentEmail) => {
    try {
      setLoading(true);
      setError('');

      if (!currentUser) {
        throw new Error('You must be logged in to create a game');
      }

      // Create initial board state
      const initialBoard = initialBoardSetup();

      // Create a new game document
      const gameRef = await addDoc(collection(db, 'games'), {
        whitePlayer: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || 'Player 1'
        },
        blackPlayer: {
          email: opponentEmail,
          displayName: 'Player 2'
        },
        status: 'pending',
        currentTurn: 'white',
        board: initialBoard,
        moves: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return gameRef.id;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Join a game
  const joinGame = async (gameId) => {
    try {
      setLoading(true);
      setError('');

      if (!currentUser) {
        throw new Error('You must be logged in to join a game');
      }

      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameSnap.data();

      // Check if this is the invited player
      if (gameData.blackPlayer.email !== currentUser.email) {
        throw new Error('You were not invited to this game');
      }

      // Update the game with the black player's info
      await updateDoc(gameRef, {
        'blackPlayer.uid': currentUser.uid,
        'blackPlayer.displayName': currentUser.displayName || 'Player 2',
        status: 'active',
        updatedAt: serverTimestamp()
      });

      return gameId;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Make a move
  const makeMove = async (gameId, from, to, piece) => {
    try {
      setLoading(true);
      setError('');

      if (!currentUser) {
        throw new Error('You must be logged in to make a move');
      }

      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameSnap.data();

      // Verify it's the player's turn
      const isWhitePlayer = gameData.whitePlayer.uid === currentUser.uid;
      const isBlackPlayer = gameData.blackPlayer.uid === currentUser.uid;
      
      if ((!isWhitePlayer && !isBlackPlayer) || 
          (isWhitePlayer && gameData.currentTurn !== 'white') || 
          (isBlackPlayer && gameData.currentTurn !== 'black')) {
        throw new Error('Not your turn');
      }

      // Create move record
      const move = {
        player: currentUser.uid,
        from,
        to,
        piece,
        timestamp: serverTimestamp()
      };

      // Update the board
      const newBoard = [...gameData.board];
      
      // Move piece logic - simplified for now
      // In a real app, would need to validate move is legal
      const fromRow = parseInt(from.charAt(1)) - 1;
      const fromCol = from.charCodeAt(0) - 97;
      const toRow = parseInt(to.charAt(1)) - 1;
      const toCol = to.charCodeAt(0) - 97;

      // Update board
      newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
      newBoard[fromRow][fromCol] = null;

      // Update game
      await updateDoc(gameRef, {
        board: newBoard,
        moves: arrayUnion(move),
        currentTurn: gameData.currentTurn === 'white' ? 'black' : 'white',
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's games
  const fetchUserGames = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Query where user is either white or black player
      const q1 = query(
        collection(db, 'games'),
        where('whitePlayer.uid', '==', currentUser.uid)
      );
      
      const q2 = query(
        collection(db, 'games'),
        where('blackPlayer.uid', '==', currentUser.uid)
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      const games1 = snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const games2 = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Combine and deduplicate
      const allGames = [...games1, ...games2];
      const uniqueGames = allGames.filter((game, index, self) =>
        index === self.findIndex(g => g.id === game.id)
      );

      setUserGames(uniqueGames);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Listen to a specific game
  const listenToGame = useCallback((gameId) => {
    if (!gameId) return () => {};

    const gameRef = doc(db, 'games', gameId);
    
    return onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        setCurrentGame({ id: doc.id, ...doc.data() });
      } else {
        setCurrentGame(null);
        setError('Game not found');
      }
    }, (error) => {
      setError(error.message);
    });
  }, []);

  // Fetch user games on mount and when user changes
  useEffect(() => {
    if (currentUser) {
      fetchUserGames();
    } else {
      setUserGames([]);
    }
  }, [currentUser, fetchUserGames]);

  const value = {
    userGames,
    currentGame,
    loading,
    error,
    createGame,
    joinGame,
    makeMove,
    fetchUserGames,
    listenToGame
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};