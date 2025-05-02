/**
 * Creates and returns the initial chess board setup.
 * Board is represented as a flat array where each cell contains position and piece information.
 * Each piece is an object with type and color properties.
 * @returns {Array} Array of 64 positions with pieces
 */
export const initialBoardSetup = () => {
  // Create flat board representation
  const board = [];
  
  // Initialize all positions
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const position = indicesToPosition(row, col);
      let piece = null;
      
      // Add pawns
      if (row === 1) {
        piece = { type: 'pawn', color: 'black' };
      } else if (row === 6) {
        piece = { type: 'pawn', color: 'white' };
      }
      
      // Add back rank pieces
      if (row === 0 || row === 7) {
        const color = row === 0 ? 'black' : 'white';
        if (col === 0 || col === 7) {
          piece = { type: 'rook', color };
        } else if (col === 1 || col === 6) {
          piece = { type: 'knight', color };
        } else if (col === 2 || col === 5) {
          piece = { type: 'bishop', color };
        } else if (col === 3) {
          piece = { type: 'queen', color };
        } else if (col === 4) {
          piece = { type: 'king', color };
        }
      }
      
      board.push({
        position,
        piece
      });
    }
  }
  
  return board;
};

/**
 * Gets a piece at a specific position from the board.
 * @param {Array} board - The board array
 * @param {string} position - Chess notation position (e.g., "e4")
 * @returns {Object|null} The piece at the position or null
 */
export const getPieceAtPosition = (board, position) => {
  const cell = board.find(cell => cell.position === position);
  return cell ? cell.piece : null;
};

/**
 * Sets a piece at a specific position on the board.
 * @param {Array} board - The board array
 * @param {string} position - Chess notation position (e.g., "e4")
 * @param {Object|null} piece - The piece to set or null to clear
 * @returns {Array} New board with the updated position
 */
export const setPieceAtPosition = (board, position, piece) => {
  return board.map(cell => 
    cell.position === position ? { ...cell, piece } : cell
  );
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