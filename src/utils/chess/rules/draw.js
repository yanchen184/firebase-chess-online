/**
 * Draw condition functions
 */

import { hasLegalMoves, isInCheck } from './check';

/**
 * Checks for insufficient material to mate.
 * @param {Array} board - The board array
 * @returns {boolean} True if insufficient material
 */
export const hasInsufficientMaterial = (board) => {
  const pieces = board.filter(cell => cell.piece);
  
  // Count pieces by color and type
  const pieceCounts = {
    white: { total: 0, bishops: 0, knights: 0 },
    black: { total: 0, bishops: 0, knights: 0 }
  };
  
  // Bishop square colors (light=0, dark=1)
  const bishopSquares = {
    white: [],
    black: []
  };
  
  for (const cell of pieces) {
    const { type, color } = cell.piece;
    pieceCounts[color].total++;
    
    if (type === 'bishop') {
      pieceCounts[color].bishops++;
      
      // Determine bishop's square color (light or dark)
      const [row, col] = cell.position.split('');
      const fileIndex = col.charCodeAt(0) - 'a'.charCodeAt(0);
      const rankIndex = 8 - parseInt(row);
      const squareColor = (fileIndex + rankIndex) % 2;
      bishopSquares[color].push(squareColor);
    }
    
    if (type === 'knight') {
      pieceCounts[color].knights++;
    }
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
    
    // Check if bishops are on same color squares
    const whiteBishopSquare = bishopSquares.white[0];
    const blackBishopSquare = bishopSquares.black[0];
    
    if (whiteBishopSquare === blackBishopSquare) {
      return true;
    }
  }
  
  return false;
};

/**
 * Checks for stalemate.
 * @param {Array} board - The board array
 * @param {string} color - The color to check
 * @param {Object} lastMove - The last move made
 * @returns {boolean} True if stalemate
 */
export const isStalemate = (board, color, lastMove = null) => {
  return !isInCheck(board, color) && !hasLegalMoves(board, color, lastMove);
};

/**
 * Counts moves without pawn moves or captures for the fifty-move rule.
 * @param {Array} moveHistory - Array of moves made
 * @returns {number} Count of moves without progress
 */
export const countMovesWithoutProgress = (moveHistory) => {
  let count = 0;
  
  for (let i = moveHistory.length - 1; i >= 0; i--) {
    const move = moveHistory[i];
    
    // Break the count if a pawn moved or a piece was captured
    if (move.piece && move.piece.type === 'pawn' || move.capturedPiece) {
      break;
    }
    
    count++;
  }
  
  return count;
};

/**
 * Checks for fifty-move rule.
 * @param {Array} moveHistory - Array of moves made
 * @returns {boolean} True if fifty-move rule applies
 */
export const isFiftyMoveRule = (moveHistory) => {
  return countMovesWithoutProgress(moveHistory) >= 100; // 50 moves = 100 half-moves
};

/**
 * Checks for threefold repetition.
 * @param {Array} positionHistory - Array of board positions
 * @returns {boolean} True if threefold repetition occurred
 */
export const isThreefoldRepetition = (positionHistory) => {
  const positionCounts = {};
  
  for (const positionRecord of positionHistory) {
    // We need to consider:
    // 1. Board position
    // 2. Castling rights
    // 3. En passant possibilities
    
    // Create a string representation of the position and state
    const positionString = JSON.stringify({
      board: positionRecord.board.map(cell => ({
        position: cell.position,
        piece: cell.piece ? {
          type: cell.piece.type,
          color: cell.piece.color,
          hasMoved: cell.piece.hasMoved
        } : null
      })),
      enPassantTarget: positionRecord.enPassantTarget
    });
    
    positionCounts[positionString] = (positionCounts[positionString] || 0) + 1;
    
    if (positionCounts[positionString] >= 3) {
      return true;
    }
  }
  
  return false;
};