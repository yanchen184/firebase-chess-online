/**
 * Game service for handling Firebase operations related to chess games
 */
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { initialBoardSetup } from '../utils/chess';

/**
 * Create a new game with specified players
 * @param {Object} whitePlayer - White player data (uid, displayName)
 * @param {Object} blackPlayer - Black player data (uid, displayName)
 * @returns {Promise<string>} The new game ID
 */
export const createGame = async (whitePlayer, blackPlayer) => {
  try {
    // Create initial game data
    const gameData = {
      white: whitePlayer.displayName,
      black: blackPlayer.displayName,
      whitePlayer: {
        uid: whitePlayer.uid,
        displayName: whitePlayer.displayName
      },
      blackPlayer: {
        uid: blackPlayer.uid,
        displayName: blackPlayer.displayName
      },
      board: initialBoardSetup(),
      currentTurn: 'white',
      status: 'active', // 'active', 'completed'
      winner: null, // 'white', 'black', 'draw'
      winReason: null, // 'Checkmate', 'Resignation', etc.
      drawOfferBy: null, // 'white', 'black'
      moves: [],
      notation: [],
      boardPositions: [
        { board: initialBoardSetup(), enPassantTarget: null }
      ],
      lastMove: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Add to Firestore
    const gameRef = await addDoc(collection(db, 'games'), gameData);
    return gameRef.id;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

/**
 * Get a game by ID
 * @param {string} gameId - The game ID
 * @returns {Promise<Object>} The game data
 */
export const getGame = async (gameId) => {
  try {
    const gameDoc = await getDoc(doc(db, 'games', gameId));
    
    if (gameDoc.exists()) {
      return { id: gameDoc.id, ...gameDoc.data() };
    } else {
      throw new Error('Game not found');
    }
  } catch (error) {
    console.error('Error getting game:', error);
    throw error;
  }
};

/**
 * Get active games for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of active games
 */
export const getActiveGamesForUser = async (userId) => {
  try {
    // Query games where the user is either white or black player and game is active
    const whiteGamesQuery = query(
      collection(db, 'games'),
      where('whitePlayer.uid', '==', userId),
      where('status', '==', 'active'),
      orderBy('updatedAt', 'desc')
    );
    
    const blackGamesQuery = query(
      collection(db, 'games'),
      where('blackPlayer.uid', '==', userId),
      where('status', '==', 'active'),
      orderBy('updatedAt', 'desc')
    );
    
    // Get both query results
    const [whiteGamesSnapshot, blackGamesSnapshot] = await Promise.all([
      getDocs(whiteGamesQuery),
      getDocs(blackGamesQuery)
    ]);
    
    // Combine results
    const whiteGames = whiteGamesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      playerColor: 'white'
    }));
    
    const blackGames = blackGamesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      playerColor: 'black'
    }));
    
    // Sort by updatedAt
    return [...whiteGames, ...blackGames].sort((a, b) => {
      const dateA = a.updatedAt?.toDate?.() || new Date(0);
      const dateB = b.updatedAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting active games:', error);
    throw error;
  }
};

/**
 * Get completed games for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of completed games
 */
export const getCompletedGamesForUser = async (userId) => {
  try {
    // Query games where the user is either white or black player and game is completed
    const whiteGamesQuery = query(
      collection(db, 'games'),
      where('whitePlayer.uid', '==', userId),
      where('status', '==', 'completed'),
      orderBy('updatedAt', 'desc')
    );
    
    const blackGamesQuery = query(
      collection(db, 'games'),
      where('blackPlayer.uid', '==', userId),
      where('status', '==', 'completed'),
      orderBy('updatedAt', 'desc')
    );
    
    // Get both query results
    const [whiteGamesSnapshot, blackGamesSnapshot] = await Promise.all([
      getDocs(whiteGamesQuery),
      getDocs(blackGamesQuery)
    ]);
    
    // Combine results
    const whiteGames = whiteGamesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      playerColor: 'white'
    }));
    
    const blackGames = blackGamesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      playerColor: 'black'
    }));
    
    // Sort by updatedAt
    return [...whiteGames, ...blackGames].sort((a, b) => {
      const dateA = a.updatedAt?.toDate?.() || new Date(0);
      const dateB = b.updatedAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting completed games:', error);
    throw error;
  }
};

/**
 * Make a move in a game
 * @param {string} gameId - Game ID
 * @param {string} from - Starting position
 * @param {string} to - Ending position
 * @param {Object} piece - The piece being moved
 * @param {Array} newBoard - New board state after the move
 * @param {Object} moveInfo - Additional information about the move
 * @returns {Promise<void>}
 */
export const makeMove = async (gameId, from, to, piece, newBoard, moveInfo) => {
  try {
    // Get the current game state
    const gameDoc = await getDoc(doc(db, 'games', gameId));
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const game = gameDoc.data();
    
    // Create move object
    const move = {
      from,
      to,
      piece: { type: piece.type, color: piece.color },
      timestamp: new Date().toISOString(),
      ...moveInfo
    };
    
    // Create new position object
    const newPosition = {
      board: newBoard,
      enPassantTarget: piece.type === 'pawn' && Math.abs(from[1] - to[1]) === 2 ? to : null
    };
    
    // Update game
    const nextTurn = game.currentTurn === 'white' ? 'black' : 'white';
    
    await updateDoc(doc(db, 'games', gameId), {
      board: newBoard,
      currentTurn: nextTurn,
      lastMove: move,
      moves: [...game.moves, move],
      boardPositions: [...(game.boardPositions || []), newPosition],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error making move:', error);
    throw error;
  }
};

/**
 * Resign a game
 * @param {string} gameId - Game ID
 * @param {string} resigningColor - Color of the player resigning ('white' or 'black')
 * @returns {Promise<void>}
 */
export const resignGame = async (gameId, resigningColor) => {
  try {
    const winner = resigningColor === 'white' ? 'black' : 'white';
    
    await updateDoc(doc(db, 'games', gameId), {
      status: 'completed',
      winner,
      winReason: 'Resignation',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error resigning game:', error);
    throw error;
  }
};

/**
 * Offer a draw
 * @param {string} gameId - Game ID
 * @param {string} offeringColor - Color of the player offering the draw ('white' or 'black')
 * @returns {Promise<void>}
 */
export const offerDraw = async (gameId, offeringColor) => {
  try {
    await updateDoc(doc(db, 'games', gameId), {
      drawOfferBy: offeringColor,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error offering draw:', error);
    throw error;
  }
};

/**
 * Accept a draw offer
 * @param {string} gameId - Game ID
 * @returns {Promise<void>}
 */
export const acceptDraw = async (gameId) => {
  try {
    await updateDoc(doc(db, 'games', gameId), {
      status: 'completed',
      winner: 'draw',
      winReason: 'Agreement',
      drawOfferBy: null,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error accepting draw:', error);
    throw error;
  }
};

/**
 * Decline a draw offer
 * @param {string} gameId - Game ID
 * @returns {Promise<void>}
 */
export const declineDraw = async (gameId) => {
  try {
    await updateDoc(doc(db, 'games', gameId), {
      drawOfferBy: null,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error declining draw:', error);
    throw error;
  }
};

/**
 * Complete a game with an outcome
 * @param {string} gameId - Game ID
 * @param {string} winner - Winner ('white', 'black', or 'draw')
 * @param {string} reason - Reason for game completion (e.g., 'Checkmate', 'Stalemate')
 * @returns {Promise<void>}
 */
export const completeGame = async (gameId, winner, reason) => {
  try {
    await updateDoc(doc(db, 'games', gameId), {
      status: 'completed',
      winner,
      winReason: reason,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error completing game:', error);
    throw error;
  }
};