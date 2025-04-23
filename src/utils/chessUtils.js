/**
 * Creates and returns the initial chess board setup.
 * Board is represented as a 2D array where each cell can be null or contain a piece.
 * Each piece is an object with type and color properties.
 * @returns {Array} 8x8 array representing the initial chess board
 */
export const initialBoardSetup = () => {
  // Create empty 8x8 board
  const board = Array(8).fill().map(() => Array(8).fill(null));
  
  // Set up pawns
  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: 'pawn', color: 'black' };
    board[6][i] = { type: 'pawn', color: 'white' };
  }
  
  // Set up back rank pieces
  const backRankPieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  for (let i = 0; i < 8; i++) {
    board[0][i] = { type: backRankPieces[i], color: 'black' };
    board[7][i] = { type: backRankPieces[i], color: 'white' };
  }
  
  return board;
};

/**
 * Converts a board position (e.g., "e4") to array indices [row, col].
 * @param {string} position - Chess notation position (e.g., "e4")
 * @returns {Array} Array with [row, col] indices
 */
export const positionToIndices = (position) => {
  const col = position.charCodeAt(0) - 97; // 'a' is 97 in ASCII
  const row = 8 - parseInt(position.charAt(1));
  return [row, col];
};

/**
 * Converts array indices [row, col] to a board position (e.g., "e4").
 * @param {number} row - Row index (0-7)
 * @param {number} col - Column index (0-7)
 * @returns {string} Chess notation position
 */
export const indicesToPosition = (row, col) => {
  const file = String.fromCharCode(97 + col); // 'a' is 97 in ASCII
  const rank = 8 - row;
  return file + rank;
};

/**
 * Gets the unicode character for a chess piece.
 * @param {string} type - The type of piece (e.g., 'pawn', 'king')
 * @param {string} color - The color of the piece ('white' or 'black')
 * @returns {string} Unicode character for the piece
 */
export const getPieceSymbol = (type, color) => {
  const symbols = {
    white: {
      king: '♔',
      queen: '♕',
      rook: '♖',
      bishop: '♗',
      knight: '♘',
      pawn: '♙'
    },
    black: {
      king: '♚',
      queen: '♛',
      rook: '♜',
      bishop: '♝',
      knight: '♞',
      pawn: '♟'
    }
  };
  
  return symbols[color][type] || '';
};

/**
 * Determines if it's a player's turn based on their user ID and current game state.
 * @param {string} userId - The user's ID
 * @param {Object} game - The current game object
 * @returns {boolean} True if it's the player's turn
 */
export const isPlayerTurn = (userId, game) => {
  if (!game || !userId) return false;
  
  const isWhitePlayer = game.whitePlayer.uid === userId;
  const isBlackPlayer = game.blackPlayer.uid === userId;
  
  return (isWhitePlayer && game.currentTurn === 'white') || 
         (isBlackPlayer && game.currentTurn === 'black');
};

/**
 * Determines which pieces a player can move based on their user ID.
 * @param {string} userId - The user's ID
 * @param {Object} game - The current game object
 * @returns {string|null} 'white', 'black', or null if not a player
 */
export const getPlayerColor = (userId, game) => {
  if (!game || !userId) return null;
  
  if (game.whitePlayer.uid === userId) return 'white';
  if (game.blackPlayer.uid === userId) return 'black';
  
  return null;
};