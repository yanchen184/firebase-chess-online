/**
 * Game service for handling Firebase operations related to games
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
import { generateNumberFor1A2B } from '../utils/1a2b';

/**
 * Create a new game with specified players and game type
 * @param {Object} player1 - First player data (uid, displayName)
 * @param {Object} player2 - Second player data (uid, displayName)
 * @param {string} gameType - Type of game ('chess' or '1a2b')
 * @returns {Promise<string>} The new game ID
 */
export const createGame = async (player1, player2, gameType = 'chess') => {
  try {
    // Create initial game data based on game type
    let gameData = {
      gameType,
      player1: {
        uid: player1.uid,
        displayName: player1.displayName
      },
      player2: {
        email: player2.email,
        displayName: player2.displayName,
        uid: null // Will be filled when player2 joins
      },
      status: 'waiting', // 'waiting', 'active', 'completed'
      winner: null, // 'player1', 'player2', 'draw'
      winReason: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Add game-specific data
    if (gameType === 'chess') {
      gameData = {
        ...gameData,
        white: player1.displayName,
        black: player2.displayName,
        whitePlayer: {
          uid: player1.uid,
          displayName: player1.displayName
        },
        blackPlayer: {
          uid: null, // Will be filled when player2 joins
          displayName: player2.displayName
        },
        board: initialBoardSetup(),
        currentTurn: 'white',
        drawOfferBy: null, // 'white', 'black'
        moves: [],
        notation: [],
        boardPositions: [
          { board: initialBoardSetup(), enPassantTarget: null }
        ],
        lastMove: null
      };
    } else if (gameType === '1a2b') {
      gameData = {
        ...gameData,
        secretNumber: generateNumberFor1A2B(), // Generate a 4-digit secret number
        currentTurn: 'player2', // Player 1 creates the game, Player 2 guesses first
        guesses: [],
        maxGuesses: 10, // Maximum number of guesses allowed
        remainingGuesses: 10
      };
    }

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
    // Query games for chess
    const chessWhiteGamesQuery = query(
      collection(db, 'games'),
      where('whitePlayer.uid', '==', userId),
      where('status', 'in', ['active', 'waiting']),
      where('gameType', '==', 'chess'),
      orderBy('updatedAt', 'desc')
    );
    
    const chessBlackGamesQuery = query(
      collection(db, 'games'),
      where('blackPlayer.uid', '==', userId),
      where('status', 'in', ['active', 'waiting']),
      where('gameType', '==', 'chess'),
      orderBy('updatedAt', 'desc')
    );
    
    // Query games for 1A2B
    const player1GamesQuery = query(
      collection(db, 'games'),
      where('player1.uid', '==', userId),
      where('status', 'in', ['active', 'waiting']),
      where('gameType', '==', '1a2b'),
      orderBy('updatedAt', 'desc')
    );
    
    const player2GamesQuery = query(
      collection(db, 'games'),
      where('player2.uid', '==', userId),
      where('status', 'in', ['active', 'waiting']),
      where('gameType', '==', '1a2b'),
      orderBy('updatedAt', 'desc')
    );
    
    // Get all query results
    const [chessWhiteSnapshot, chessBlackSnapshot, player1Snapshot, player2Snapshot] = await Promise.all([
      getDocs(chessWhiteGamesQuery),
      getDocs(chessBlackGamesQuery),
      getDocs(player1GamesQuery),
      getDocs(player2GamesQuery)
    ]);
    
    // Combine results
    const chessWhiteGames = chessWhiteSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      playerRole: 'white'
    }));
    
    const chessBlackGames = chessBlackSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      playerRole: 'black'
    }));
    
    const player1Games = player1Snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      playerRole: 'player1'
    }));
    
    const player2Games = player2Snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      playerRole: 'player2'
    }));
    
    // Sort by updatedAt
    return [...chessWhiteGames, ...chessBlackGames, ...player1Games, ...player2Games].sort((a, b) => {
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
    // Query completed chess games
    const chessWhiteGamesQuery = query(
      collection(db, 'games'),
      where('whitePlayer.uid', '==', userId),
      where('status', '==', 'completed'),
      where('gameType', '==', 'chess'),
      orderBy('updatedAt', 'desc')
    );
    
    const chessBlackGamesQuery = query(
      collection(db, 'games'),
      where('blackPlayer.uid', '==', userId),
      where('status', '==', 'completed'),
      where('gameType', '==', 'chess'),
      orderBy('updatedAt', 'desc')
    );
    
    // Query completed 1A2B games
    const player1GamesQuery = query(
      collection(db, 'games'),
      where('player1.uid', '==', userId),
      where('status', '==', 'completed'),
      where('gameType', '==', '1a2b'),
      orderBy('updatedAt', 'desc')
    );
    
    const player2GamesQuery = query(
      collection(db, 'games'),
      where('player2.uid', '==', userId),
      where('status', '==', 'completed'),
      where('gameType', '==', '1a2b'),
      orderBy('updatedAt', 'desc')
    );
    
    // Get all query results
    const [chessWhiteSnapshot, chessBlackSnapshot, player1Snapshot, player2Snapshot] = await Promise.all([
      getDocs(chessWhiteGamesQuery),
      getDocs(chessBlackGamesQuery),
      getDocs(player1GamesQuery),
      getDocs(player2GamesQuery)
    ]);
    
    // Combine results
    const chessWhiteGames = chessWhiteSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      playerRole: 'white'
    }));
    
    const chessBlackGames = chessBlackSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      playerRole: 'black'
    }));
    
    const player1Games = player1Snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      playerRole: 'player1'
    }));
    
    const player2Games = player2Snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      playerRole: 'player2'
    }));
    
    // Sort by updatedAt
    return [...chessWhiteGames, ...chessBlackGames, ...player1Games, ...player2Games].sort((a, b) => {
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
 * Join a game as the second player
 * @param {string} gameId - Game ID
 * @param {Object} player - Player data (uid, displayName)
 * @returns {Promise<void>}
 */
export const joinGame = async (gameId, player) => {
  try {
    const gameDoc = await getDoc(doc(db, 'games', gameId));
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const game = gameDoc.data();
    
    if (game.status !== 'waiting') {
      throw new Error('Game already started or completed');
    }
    
    const updates = {
      status: 'active',
      updatedAt: serverTimestamp()
    };
    
    // Add game-specific updates
    if (game.gameType === 'chess') {
      updates.blackPlayer = {
        uid: player.uid,
        displayName: player.displayName
      };
    } else if (game.gameType === '1a2b') {
      updates.player2 = {
        uid: player.uid,
        displayName: player.displayName
      };
    }
    
    await updateDoc(doc(db, 'games', gameId), updates);
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
};

/**
 * Make a chess move
 * @param {string} gameId - Game ID
 * @param {string} from - Starting position
 * @param {string} to - Ending position
 * @param {Object} piece - The piece being moved
 * @param {Array} newBoard - New board state after the move
 * @param {Object} moveInfo - Additional information about the move
 * @returns {Promise<void>}
 */
export const makeChessMove = async (gameId, from, to, piece, newBoard, moveInfo) => {
  try {
    // Get the current game state
    const gameDoc = await getDoc(doc(db, 'games', gameId));
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const game = gameDoc.data();
    
    if (game.gameType !== 'chess') {
      throw new Error('Not a chess game');
    }
    
    if (game.status !== 'active') {
      throw new Error('Game not active');
    }
    
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
    console.error('Error making chess move:', error);
    throw error;
  }
};

/**
 * Make a guess in a 1A2B game
 * @param {string} gameId - Game ID
 * @param {string} guess - The 4-digit guess
 * @param {string} playerId - ID of the player making the guess
 * @returns {Promise<Object>} Result of the guess with A and B counts
 */
export const make1A2BGuess = async (gameId, guess, playerId) => {
  try {
    // Get the current game state
    const gameDoc = await getDoc(doc(db, 'games', gameId));
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const game = gameDoc.data();
    
    if (game.gameType !== '1a2b') {
      throw new Error('Not a 1A2B game');
    }
    
    if (game.status !== 'active') {
      throw new Error('Game not active');
    }
    
    // Check if it's the player's turn
    const isPlayer1 = game.player1.uid === playerId;
    const isPlayer2 = game.player2.uid === playerId;
    const isPlayersTurn = 
      (isPlayer1 && game.currentTurn === 'player1') || 
      (isPlayer2 && game.currentTurn === 'player2');
    
    if (!isPlayersTurn) {
      throw new Error('Not your turn');
    }
    
    // Validate guess format (4 unique digits)
    if (!/^\d{4}$/.test(guess) || new Set(guess).size !== 4) {
      throw new Error('Invalid guess. Must be 4 unique digits.');
    }
    
    // Calculate A and B
    const secretNumber = game.secretNumber;
    let a = 0; // Correct digit and position
    let b = 0; // Correct digit but wrong position
    
    for (let i = 0; i < 4; i++) {
      if (guess[i] === secretNumber[i]) {
        a++;
      } else if (secretNumber.includes(guess[i])) {
        b++;
      }
    }
    
    // Create guess result
    const guessResult = {
      guess,
      a,
      b,
      player: isPlayer1 ? 'player1' : 'player2',
      playerName: isPlayer1 ? game.player1.displayName : game.player2.displayName,
      timestamp: new Date().toISOString()
    };
    
    // Check for win (4A0B)
    const isWin = a === 4;
    const remainingGuesses = game.remainingGuesses - 1;
    const isGameOver = isWin || remainingGuesses === 0;
    
    // Update game state
    const updates = {
      guesses: [...(game.guesses || []), guessResult],
      remainingGuesses,
      currentTurn: game.currentTurn === 'player1' ? 'player2' : 'player1',
      updatedAt: serverTimestamp()
    };
    
    if (isGameOver) {
      updates.status = 'completed';
      
      if (isWin) {
        updates.winner = isPlayer1 ? 'player1' : 'player2';
        updates.winReason = 'Guessed the number';
      } else {
        updates.winner = 'draw';
        updates.winReason = 'Ran out of guesses';
      }
    }
    
    await updateDoc(doc(db, 'games', gameId), updates);
    
    return { a, b, isWin, isGameOver };
  } catch (error) {
    console.error('Error making 1A2B guess:', error);
    throw error;
  }
};

/**
 * Resign a chess game
 * @param {string} gameId - Game ID
 * @param {string} resigningColor - Color of the player resigning ('white' or 'black')
 * @returns {Promise<void>}
 */
export const resignChessGame = async (gameId, resigningColor) => {
  try {
    const winner = resigningColor === 'white' ? 'black' : 'white';
    
    await updateDoc(doc(db, 'games', gameId), {
      status: 'completed',
      winner,
      winReason: 'Resignation',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error resigning chess game:', error);
    throw error;
  }
};

/**
 * Offer a draw in a chess game
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
 * Accept a draw offer in a chess game
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
 * Decline a draw offer in a chess game
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
 * @param {string} winner - Winner ('white', 'black', 'player1', 'player2', or 'draw')
 * @param {string} reason - Reason for game completion
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