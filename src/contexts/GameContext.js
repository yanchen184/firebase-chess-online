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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  initialBoardSetup, 
  getPieceAtPosition, 
  setPieceAtPosition,
  checkGameOutcome,
  wouldMoveResultInCheck,
  isInCheck
} from '../utils/chessUtils';

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
        gameStates: [],  // Track game states for threefold repetition
        halfMoveClock: 0,  // Track moves for fifty-move rule
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

      // Check if game is already completed
      if (gameData.status === 'completed') {
        throw new Error('Game is already completed');
      }

      // Verify it's the player's turn
      const isWhitePlayer = gameData.whitePlayer.uid === currentUser.uid;
      const isBlackPlayer = gameData.blackPlayer.uid === currentUser.uid;
      
      if ((!isWhitePlayer && !isBlackPlayer) || 
          (isWhitePlayer && gameData.currentTurn !== 'white') || 
          (isBlackPlayer && gameData.currentTurn !== 'black')) {
        throw new Error('Not your turn');
      }

      // Check if move would leave king in check
      if (wouldMoveResultInCheck(gameData.board, from, to, gameData.currentTurn)) {
        throw new Error('Move would leave your king in check');
      }

      // Get the captured piece (if any)
      const capturedPiece = getPieceAtPosition(gameData.board, to);

      // Create move record with client timestamp
      const move = {
        player: currentUser.uid,
        from,
        to,
        piece,
        capturedPiece: capturedPiece || null,
        timestamp: Timestamp.now()
      };

      // Update the board using the new flat structure
      let newBoard = [...gameData.board];
      
      // Handle special moves (castling, en passant, pawn promotion)
      // TODO: Implement special moves logic
      
      // Regular move
      newBoard = setPieceAtPosition(newBoard, from, null);
      newBoard = setPieceAtPosition(newBoard, to, piece);

      // Update piece's hasMoved property for rooks and kings (for castling)
      if ((piece.type === 'king' || piece.type === 'rook') && !piece.hasMoved) {
        const updatedPiece = { ...piece, hasMoved: true };
        newBoard = setPieceAtPosition(newBoard, to, updatedPiece);
      }

      // Update half-move clock for fifty-move rule
      let newHalfMoveClock = gameData.halfMoveClock || 0;
      if (piece.type === 'pawn' || capturedPiece) {
        newHalfMoveClock = 0;  // Reset on pawn move or capture
      } else {
        newHalfMoveClock++;  // Increment otherwise
      }

      // Record current game state for threefold repetition
      const gameState = JSON.stringify(newBoard);
      const gameStates = [...(gameData.gameStates || []), gameState];

      // Check for game outcome
      const nextTurn = gameData.currentTurn === 'white' ? 'black' : 'white';
      const gameOutcome = checkGameOutcome(newBoard, nextTurn);
      
      // Prepare update data
      const updateData = {
        board: newBoard,
        moves: arrayUnion(move),
        currentTurn: nextTurn,
        halfMoveClock: newHalfMoveClock,
        gameStates: gameStates,
        updatedAt: serverTimestamp()
      };

      // Add check status
      if (isInCheck(newBoard, nextTurn)) {
        updateData.inCheck = nextTurn;
      } else {
        updateData.inCheck = null;
      }

      // If game is over, update status and add winner information
      if (gameOutcome) {
        updateData.status = 'completed';
        updateData.winner = gameOutcome.winner;
        updateData.winReason = gameOutcome.reason;
      }

      // Check for draw conditions
      if (newHalfMoveClock >= 100) {
        // Fifty-move rule (100 half-moves = 50 full moves)
        updateData.status = 'completed';
        updateData.winner = 'draw';
        updateData.winReason = 'Fifty-move rule';
      } else if (gameStates.filter(state => state === gameState).length >= 3) {
        // Threefold repetition
        updateData.status = 'completed';
        updateData.winner = 'draw';
        updateData.winReason = 'Threefold repetition';
      }

      // Update game
      await updateDoc(gameRef, updateData);

    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Resign from game
  const resignGame = async (gameId) => {
    try {
      setLoading(true);
      setError('');

      if (!currentUser) {
        throw new Error('You must be logged in to resign');
      }

      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameSnap.data();

      // Check if user is a player in this game
      const isWhitePlayer = gameData.whitePlayer.uid === currentUser.uid;
      const isBlackPlayer = gameData.blackPlayer.uid === currentUser.uid;

      if (!isWhitePlayer && !isBlackPlayer) {
        throw new Error('You are not a player in this game');
      }

      // Determine winner (opponent of the resigning player)
      const winner = isWhitePlayer ? 'black' : 'white';

      // Update game
      await updateDoc(gameRef, {
        status: 'completed',
        winner: winner,
        winReason: `${isWhitePlayer ? 'White' : 'Black'} resigned`,
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Offer draw
  const offerDraw = async (gameId) => {
    try {
      setLoading(true);
      setError('');

      if (!currentUser) {
        throw new Error('You must be logged in to offer a draw');
      }

      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameSnap.data();

      // Check if user is a player in this game
      const isWhitePlayer = gameData.whitePlayer.uid === currentUser.uid;
      const isBlackPlayer = gameData.blackPlayer.uid === currentUser.uid;

      if (!isWhitePlayer && !isBlackPlayer) {
        throw new Error('You are not a player in this game');
      }

      const playerColor = isWhitePlayer ? 'white' : 'black';
      const opponentColor = isWhitePlayer ? 'black' : 'white';

      // Update game with draw offer
      await updateDoc(gameRef, {
        drawOffer: {
          from: playerColor,
          to: opponentColor,
          status: 'pending',
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Respond to draw offer
  const respondToDraw = async (gameId, accept) => {
    try {
      setLoading(true);
      setError('');

      if (!currentUser) {
        throw new Error('You must be logged in to respond to a draw offer');
      }

      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameSnap.data();

      // Check if there's a pending draw offer
      if (!gameData.drawOffer || gameData.drawOffer.status !== 'pending') {
        throw new Error('No pending draw offer');
      }

      // Check if user is the recipient of the draw offer
      const isWhitePlayer = gameData.whitePlayer.uid === currentUser.uid;
      const isBlackPlayer = gameData.blackPlayer.uid === currentUser.uid;
      const playerColor = isWhitePlayer ? 'white' : 'black';

      if (gameData.drawOffer.to !== playerColor) {
        throw new Error('This draw offer is not for you');
      }

      if (accept) {
        // Accept draw - game ends in draw
        await updateDoc(gameRef, {
          status: 'completed',
          winner: 'draw',
          winReason: 'Draw by agreement',
          drawOffer: {
            ...gameData.drawOffer,
            status: 'accepted',
            responseTimestamp: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        });
      } else {
        // Decline draw - game continues
        await updateDoc(gameRef, {
          drawOffer: {
            ...gameData.drawOffer,
            status: 'declined',
            responseTimestamp: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        });
      }

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

      // Query where user is white player (by uid)
      const q1 = query(
        collection(db, 'games'),
        where('whitePlayer.uid', '==', currentUser.uid)
      );
      
      // Query where user is black player (by uid) - for active/completed games
      const q2 = query(
        collection(db, 'games'),
        where('blackPlayer.uid', '==', currentUser.uid)
      );
      
      // Query where user is black player (by email) - for pending invitations
      const q3 = query(
        collection(db, 'games'),
        where('blackPlayer.email', '==', currentUser.email)
      );

      const [snapshot1, snapshot2, snapshot3] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
        getDocs(q3)
      ]);

      const games1 = snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const games2 = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const games3 = snapshot3.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Combine and deduplicate
      const allGames = [...games1, ...games2, ...games3];
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
    listenToGame,
    resignGame,
    offerDraw,
    respondToDraw
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};