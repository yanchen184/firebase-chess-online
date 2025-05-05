/**
 * Check and checkmate related functions
 */

import { findKingPosition, getPieceAtPosition, setPieceAtPosition } from '../board';
import { calculatePieceMoves } from '../moves';

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
  const finalBoard = setPieceAtPosition(newBoard, to, { ...piece, hasMoved: true });
  
  // Find king position after the move
  const kingPosition = findKingPosition(finalBoard, color);
  
  if (!kingPosition) return true; // King not found, invalid state
  
  // Check if king would be under attack
  const opponentColor = color === 'white' ? 'black' : 'white';
  return isPositionUnderAttack(finalBoard, kingPosition, opponentColor);
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