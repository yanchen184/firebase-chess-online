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
          piece = { type: 'rook', color, hasMoved: false };
        } else if (col === 1 || col === 6) {
          piece = { type: 'knight', color };
        } else if (col === 2 || col === 5) {
          piece = { type: 'bishop', color };
        } else if (col === 3) {
          piece = { type: 'queen', color };
        } else if (col === 4) {
          piece = { type: 'king', color, hasMoved: false };
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
 * Finds the king's position for a given color.
 * @param {Array} board - The board array
 * @param {string} color - The color to check ('white' or 'black')
 * @returns {string|null} The position of the king or null if not found
 */
export const findKingPosition = (board, color) => {
  const kingCell = board.find(cell => 
    cell.piece && cell.piece.type === 'king' && cell.piece.color === color
  );
  return kingCell ? kingCell.position : null;
};

/**
 * Checks if a position is under attack by the opponent.
 * @param {Array} board - The board array
 * @param {string} position - The position to check
 * @param {string} byColor - The attacking color
 * @returns {boolean} True if the position is under attack
 */
export const isPositionUnderAttack = (board, position, byColor) => {
  // Get all pieces of the attacking color
  const attackingPieces = board.filter(cell => 
    cell.piece && cell.piece.color === byColor
  );

  // Check if any attacking piece can move to the target position
  for (const cell of attackingPieces) {
    const moves = calculatePieceMoves(board, cell.position, cell.piece, null, true);
    if (moves.includes(position)) {
      return true;
    }
  }

  return false;
};

/**
 * Calculates all possible moves for a piece.
 * @param {Array} board - The board array
 * @param {string} position - The position of the piece
 * @param {Object} piece - The piece object
 * @param {Object} lastMove - The last move made (for en passant)
 * @param {boolean} forAttackCheck - If true, excludes special moves like castling
 * @returns {Array} Array of possible positions
 */
export const calculatePieceMoves = (board, position, piece, lastMove = null, forAttackCheck = false) => {
  const [row, col] = positionToIndices(position);
  const moves = [];

  switch (piece.type) {
    case 'pawn':
      moves.push(...calculatePawnMoves(board, row, col, piece.color, lastMove, forAttackCheck));
      break;
    case 'rook':
      moves.push(...calculateRookMoves(board, row, col, piece.color));
      break;
    case 'knight':
      moves.push(...calculateKnightMoves(board, row, col, piece.color));
      break;
    case 'bishop':
      moves.push(...calculateBishopMoves(board, row, col, piece.color));
      break;
    case 'queen':
      moves.push(...calculateQueenMoves(board, row, col, piece.color));
      break;
    case 'king':
      moves.push(...calculateKingMoves(board, row, col, piece.color, forAttackCheck));
      break;
  }

  return moves;
};

/**
 * Calculates pawn moves including en passant.
 * @param {Array} board - The board array
 * @param {number} row - Current row
 * @param {number} col - Current column
 * @param {string} color - Piece color
 * @param {Object} lastMove - Last move made (for en passant)
 * @param {boolean} forAttackCheck - If true, only return attack squares
 * @returns {Array} Array of possible positions
 */
const calculatePawnMoves = (board, row, col, color, lastMove = null, forAttackCheck = false) => {
  const moves = [];
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;
  
  // Diagonal captures (always calculated for attack checks)
  for (const offset of [-1, 1]) {
    const captureRow = row + direction;
    const captureCol = col + offset;
    
    if (isValidSquare(captureRow, captureCol)) {
      const capturePos = indicesToPosition(captureRow, captureCol);
      
      if (forAttackCheck) {
        // For attack checks, include all diagonal squares
        moves.push(capturePos);
      } else {
        const targetPiece = getPieceAtPosition(board, capturePos);
        
        if (targetPiece && targetPiece.color !== color) {
          moves.push(capturePos);
        }
        
        // En passant check
        if (lastMove) {
          const enPassantRow = color === 'white' ? 3 : 4;
          if (row === enPassantRow) {
            const lastMovePiece = getPieceAtPosition(board, lastMove.to);
            const [lastFromRow, lastFromCol] = positionToIndices(lastMove.from);
            const [lastToRow, lastToCol] = positionToIndices(lastMove.to);
            
            if (lastMovePiece && 
                lastMovePiece.type === 'pawn' && 
                lastMovePiece.color !== color &&
                Math.abs(lastFromRow - lastToRow) === 2 &&
                lastToRow === row &&
                lastToCol === captureCol) {
              moves.push(capturePos);
            }
          }
        }
      }
    }
  }
  
  // Return early if only checking attack squares
  if (forAttackCheck) {
    return moves;
  }
  
  // Move forward one square
  const forwardRow = row + direction;
  if (isValidSquare(forwardRow, col)) {
    const forwardPos = indicesToPosition(forwardRow, col);
    if (!getPieceAtPosition(board, forwardPos)) {
      moves.push(forwardPos);
      
      // Move forward two squares from starting position
      if (row === startRow) {
        const twoForwardRow = row + 2 * direction;
        const twoForwardPos = indicesToPosition(twoForwardRow, col);
        if (!getPieceAtPosition(board, twoForwardPos)) {
          moves.push(twoForwardPos);
        }
      }
    }
  }
  
  return moves;
};

/**
 * Calculates rook moves.
 */
const calculateRookMoves = (board, row, col, color) => {
  const moves = [];
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // right, left, down, up
  
  for (const [dRow, dCol] of directions) {
    let currentRow = row + dRow;
    let currentCol = col + dCol;
    
    while (isValidSquare(currentRow, currentCol)) {
      const pos = indicesToPosition(currentRow, currentCol);
      const piece = getPieceAtPosition(board, pos);
      
      if (!piece) {
        moves.push(pos);
      } else {
        if (piece.color !== color) {
          moves.push(pos);
        }
        break;
      }
      
      currentRow += dRow;
      currentCol += dCol;
    }
  }
  
  return moves;
};

/**
 * Calculates knight moves.
 */
const calculateKnightMoves = (board, row, col, color) => {
  const moves = [];
  const offsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  for (const [dRow, dCol] of offsets) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    
    if (isValidSquare(newRow, newCol)) {
      const pos = indicesToPosition(newRow, newCol);
      const piece = getPieceAtPosition(board, pos);
      
      if (!piece || piece.color !== color) {
        moves.push(pos);
      }
    }
  }
  
  return moves;
};

/**
 * Calculates bishop moves.
 */
const calculateBishopMoves = (board, row, col, color) => {
  const moves = [];
  const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]]; // diagonals
  
  for (const [dRow, dCol] of directions) {
    let currentRow = row + dRow;
    let currentCol = col + dCol;
    
    while (isValidSquare(currentRow, currentCol)) {
      const pos = indicesToPosition(currentRow, currentCol);
      const piece = getPieceAtPosition(board, pos);
      
      if (!piece) {
        moves.push(pos);
      } else {
        if (piece.color !== color) {
          moves.push(pos);
        }
        break;
      }
      
      currentRow += dRow;
      currentCol += dCol;
    }
  }
  
  return moves;
};

/**
 * Calculates queen moves (combination of rook and bishop).
 */
const calculateQueenMoves = (board, row, col, color) => {
  return [
    ...calculateRookMoves(board, row, col, color),
    ...calculateBishopMoves(board, row, col, color)
  ];
};

/**
 * Calculates king moves including castling.
 */
const calculateKingMoves = (board, row, col, color, forAttackCheck = false) => {
  const moves = [];
  const offsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];
  
  for (const [dRow, dCol] of offsets) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    
    if (isValidSquare(newRow, newCol)) {
      const pos = indicesToPosition(newRow, newCol);
      const piece = getPieceAtPosition(board, pos);
      
      if (!piece || piece.color !== color) {
        moves.push(pos);
      }
    }
  }
  
  // Add castling moves (only if not checking for attacks)
  if (!forAttackCheck) {
    const kingPos = indicesToPosition(row, col);
    const king = getPieceAtPosition(board, kingPos);
    
    if (king && !king.hasMoved && !isInCheck(board, color)) {
      // Check kingside castling
      const kingsideRookPos = indicesToPosition(row, 7);
      const kingsideRook = getPieceAtPosition(board, kingsideRookPos);
      
      if (kingsideRook && kingsideRook.type === 'rook' && !kingsideRook.hasMoved && kingsideRook.color === color) {
        // Check if squares between king and rook are empty
        let canCastle = true;
        for (let c = col + 1; c < 7; c++) {
          const pos = indicesToPosition(row, c);
          if (getPieceAtPosition(board, pos)) {
            canCastle = false;
            break;
          }
        }
        
        // Check if king doesn't pass through or end on attacked square
        if (canCastle) {
          const passThroughPos = indicesToPosition(row, col + 1);
          const destinationPos = indicesToPosition(row, col + 2);
          const opponentColor = color === 'white' ? 'black' : 'white';
          
          if (!isPositionUnderAttack(board, passThroughPos, opponentColor) &&
              !isPositionUnderAttack(board, destinationPos, opponentColor)) {
            moves.push(destinationPos);
          }
        }
      }
      
      // Check queenside castling
      const queensideRookPos = indicesToPosition(row, 0);
      const queensideRook = getPieceAtPosition(board, queensideRookPos);
      
      if (queensideRook && queensideRook.type === 'rook' && !queensideRook.hasMoved && queensideRook.color === color) {
        // Check if squares between king and rook are empty
        let canCastle = true;
        for (let c = col - 1; c > 0; c--) {
          const pos = indicesToPosition(row, c);
          if (getPieceAtPosition(board, pos)) {
            canCastle = false;
            break;
          }
        }
        
        // Check if king doesn't pass through or end on attacked square
        if (canCastle) {
          const passThroughPos = indicesToPosition(row, col - 1);
          const destinationPos = indicesToPosition(row, col - 2);
          const opponentColor = color === 'white' ? 'black' : 'white';
          
          if (!isPositionUnderAttack(board, passThroughPos, opponentColor) &&
              !isPositionUnderAttack(board, destinationPos, opponentColor)) {
            moves.push(destinationPos);
          }
        }
      }
    }
  }
  
  return moves;
};

/**
 * Checks if a move would put the player's own king in check.
 * @param {Array} board - The board array
 * @param {string} from - Starting position
 * @param {string} to - Ending position
 * @param {string} color - Color of the moving piece
 * @returns {boolean} True if the move would result in check
 */
export const wouldMoveResultInCheck = (board, from, to, color) => {
  // Create a temporary board with the move applied
  const tempBoard = [...board];
  const piece = getPieceAtPosition(tempBoard, from);
  
  if (!piece) return true; // Should not happen
  
  // Apply the move
  const newBoard = setPieceAtPosition(tempBoard, from, null);
  const finalBoard = setPieceAtPosition(newBoard, to, piece);
  
  // Find king position after the move
  const kingPosition = findKingPosition(finalBoard, color);
  
  if (!kingPosition) return true; // King not found, invalid state
  
  // Check if king would be under attack
  const opponentColor = color === 'white' ? 'black' : 'white';
  return isPositionUnderAttack(finalBoard, kingPosition, opponentColor);
};

/**
 * Applies a move and handles special moves (castling, en passant, promotion).
 * @param {Array} board - The board array
 * @param {string} from - Starting position
 * @param {string} to - Ending position
 * @param {Object} lastMove - The last move made
 * @param {string} promotionPiece - The piece to promote to (if pawn promotion)
 * @returns {Object} Object containing new board and special move information
 */
export const applyMove = (board, from, to, lastMove = null, promotionPiece = 'queen') => {
  let newBoard = [...board];
  const piece = getPieceAtPosition(newBoard, from);
  
  if (!piece) return { board: newBoard };
  
  const [fromRow, fromCol] = positionToIndices(from);
  const [toRow, toCol] = positionToIndices(to);
  
  // Regular move
  newBoard = setPieceAtPosition(newBoard, from, null);
  let movedPiece = { ...piece, hasMoved: true };
  
  // Check for pawn promotion
  if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
    movedPiece = { type: promotionPiece, color: piece.color };
  }
  
  newBoard = setPieceAtPosition(newBoard, to, movedPiece);
  
  // Check for castling
  if (piece.type === 'king' && Math.abs(fromCol - toCol) === 2) {
    // King moved 2 squares, this is castling
    const rookFromCol = toCol > fromCol ? 7 : 0;
    const rookToCol = toCol > fromCol ? toCol - 1 : toCol + 1;
    const rookFromPos = indicesToPosition(fromRow, rookFromCol);
    const rookToPos = indicesToPosition(fromRow, rookToCol);
    
    const rook = getPieceAtPosition(newBoard, rookFromPos);
    if (rook) {
      newBoard = setPieceAtPosition(newBoard, rookFromPos, null);
      newBoard = setPieceAtPosition(newBoard, rookToPos, { ...rook, hasMoved: true });
    }
  }
  
  // Check for en passant
  if (piece.type === 'pawn' && Math.abs(fromCol - toCol) === 1 && !getPieceAtPosition(board, to)) {
    // Pawn moved diagonally to empty square, must be en passant
    const capturedPawnPos = indicesToPosition(fromRow, toCol);
    newBoard = setPieceAtPosition(newBoard, capturedPawnPos, null);
  }
  
  return { board: newBoard };
};

/**
 * Checks if a player is in check.
 * @param {Array} board - The board array
 * @param {string} color - The color to check
 * @returns {boolean} True if the player is in check
 */
export const isInCheck = (board, color) => {
  const kingPosition = findKingPosition(board, color);
  if (!kingPosition) return false;
  
  const opponentColor = color === 'white' ? 'black' : 'white';
  return isPositionUnderAttack(board, kingPosition, opponentColor);
};

/**
 * Checks if a player has any legal moves.
 * @param {Array} board - The board array
 * @param {string} color - The color to check
 * @param {Object} lastMove - The last move made
 * @returns {boolean} True if the player has legal moves
 */
export const hasLegalMoves = (board, color, lastMove = null) => {
  const pieces = board.filter(cell => 
    cell.piece && cell.piece.color === color
  );
  
  for (const cell of pieces) {
    const moves = calculatePieceMoves(board, cell.position, cell.piece, lastMove);
    
    // Check each move to see if it's legal (doesn't put own king in check)
    for (const move of moves) {
      if (!wouldMoveResultInCheck(board, cell.position, move, color)) {
        return true; // Found at least one legal move
      }
    }
  }
  
  return false; // No legal moves found
};

/**
 * Checks for insufficient material to mate.
 * @param {Array} board - The board array
 * @returns {boolean} True if insufficient material
 */
const hasInsufficientMaterial = (board) => {
  const pieces = board.filter(cell => cell.piece);
  
  // Count pieces by color and type
  const pieceCounts = {
    white: { total: 0, bishops: 0, knights: 0 },
    black: { total: 0, bishops: 0, knights: 0 }
  };
  
  for (const cell of pieces) {
    const { type, color } = cell.piece;
    pieceCounts[color].total++;
    
    if (type === 'bishop') pieceCounts[color].bishops++;
    if (type === 'knight') pieceCounts[color].knights++;
  }
  
  // King vs King
  if (pieceCounts.white.total === 1 && pieceCounts.black.total === 1) {
    return true;
  }
  
  // King and Bishop vs King
  if ((pieceCounts.white.total === 2 && pieceCounts.white.bishops === 1 && pieceCounts.black.total === 1) ||
      (pieceCounts.black.total === 2 && pieceCounts.black.bishops === 1 && pieceCounts.white.total === 1)) {
    return true;
  }
  
  // King and Knight vs King
  if ((pieceCounts.white.total === 2 && pieceCounts.white.knights === 1 && pieceCounts.black.total === 1) ||
      (pieceCounts.black.total === 2 && pieceCounts.black.knights === 1 && pieceCounts.white.total === 1)) {
    return true;
  }
  
  // King and Bishop vs King and Bishop (same color bishops)
  if (pieceCounts.white.total === 2 && pieceCounts.white.bishops === 1 &&
      pieceCounts.black.total === 2 && pieceCounts.black.bishops === 1) {
    // This is a simplification - should check if bishops are on same color squares
    return true;
  }
  
  return false;
};

/**
 * Counts moves without pawn moves or captures for the fifty-move rule.
 * @param {Array} moveHistory - Array of moves made
 * @returns {number} Count of moves without progress
 */
const countMovesWithoutProgress = (moveHistory) => {
  let count = 0;
  
  for (let i = moveHistory.length - 1; i >= 0; i--) {
    const move = moveHistory[i];
    if (move.capturedPiece || move.piece.type === 'pawn') {
      break;
    }
    count++;
  }
  
  return count;
};

/**
 * Checks for threefold repetition.
 * @param {Array} positionHistory - Array of board positions
 * @returns {boolean} True if threefold repetition occurred
 */
const hasThreefoldRepetition = (positionHistory) => {
  const positionCounts = {};
  
  for (const position of positionHistory) {
    // Create a string representation of the position
    const positionString = JSON.stringify(position);
    positionCounts[positionString] = (positionCounts[positionString] || 0) + 1;
    
    if (positionCounts[positionString] >= 3) {
      return true;
    }
  }
  
  return false;
};

/**
 * Determines the game outcome based on the board state and game history.
 * @param {Array} board - The board array
 * @param {string} currentTurn - The current player's turn
 * @param {Object} lastMove - The last move made
 * @param {Array} moveHistory - History of all moves made
 * @param {Array} positionHistory - History of all board positions
 * @returns {Object|null} Game outcome {winner, reason} or null if game continues
 */
export const checkGameOutcome = (board, currentTurn, lastMove = null, moveHistory = [], positionHistory = []) => {
  // Check if current player is in check
  const inCheck = isInCheck(board, currentTurn);
  
  // Check if current player has any legal moves
  const hasLegalMove = hasLegalMoves(board, currentTurn, lastMove);
  
  if (!hasLegalMove) {
    if (inCheck) {
      // Checkmate
      const winner = currentTurn === 'white' ? 'black' : 'white';
      return { winner, reason: 'Checkmate' };
    } else {
      // Stalemate
      return { winner: 'draw', reason: 'Stalemate' };
    }
  }
  
  // Check for insufficient material
  if (hasInsufficientMaterial(board)) {
    return { winner: 'draw', reason: 'Insufficient material' };
  }
  
  // Check for fifty-move rule
  if (moveHistory.length >= 100) { // 50 moves for each player
    const movesWithoutProgress = countMovesWithoutProgress(moveHistory);
    if (movesWithoutProgress >= 100) {
      return { winner: 'draw', reason: 'Fifty-move rule' };
    }
  }
  
  // Check for threefold repetition
  if (positionHistory.length >= 9) { // Minimum needed for threefold repetition
    if (hasThreefoldRepetition(positionHistory)) {
      return { winner: 'draw', reason: 'Threefold repetition' };
    }
  }
  
  return null; // Game continues
};

/**
 * Helper function to check if a square is on the board.
 */
const isValidSquare = (row, col) => {
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