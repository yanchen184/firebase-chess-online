/**
 * Helper function to check if a square is on the board.
 * @param {number} row - Row index (0-7)
 * @param {number} col - Column index (0-7)
 * @returns {boolean} True if the square is valid
 */
export const isValidSquare = (row, col) => {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
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