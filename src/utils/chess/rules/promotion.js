/**
 * Pawn promotion related functions
 */

import { positionToIndices } from '../utils';
import { getPieceAtPosition, setPieceAtPosition } from '../board';

/**
 * Checks if a pawn can be promoted.
 * @param {string} position - Position of the pawn
 * @param {Object} piece - The pawn piece
 * @returns {boolean} True if promotion is possible
 */
export const canPromote = (position, piece) => {
  if (!piece || piece.type !== 'pawn') return false;
  
  const [row, _] = positionToIndices(position);
  const color = piece.color;
  
  // Promotion happens on the last rank (0 for white, 7 for black)
  return (color === 'white' && row === 0) || (color === 'black' && row === 7);
};

/**
 * Checks if a move would result in pawn promotion.
 * @param {string} from - Starting position
 * @param {string} to - Ending position
 * @param {Object} piece - The piece being moved
 * @returns {boolean} True if the move would result in promotion
 */
export const isPromotionMove = (from, to, piece) => {
  if (!piece || piece.type !== 'pawn') return false;
  
  const [_, fromCol] = positionToIndices(from);
  const [toRow, toCol] = positionToIndices(to);
  const color = piece.color;
  
  // Check if pawn reaches the last rank
  return (color === 'white' && toRow === 0) || (color === 'black' && toRow === 7);
};

/**
 * Applies pawn promotion.
 * @param {Array} board - The board array
 * @param {string} position - Position of the pawn
 * @param {string} promotionPiece - Piece type to promote to ('queen', 'rook', 'bishop', 'knight')
 * @returns {Array} New board after promotion
 */
export const applyPromotion = (board, position, promotionPiece = 'queen') => {
  const piece = getPieceAtPosition(board, position);
  
  if (!piece || piece.type !== 'pawn') return board;
  
  // Valid promotion pieces
  const validPromotionPieces = ['queen', 'rook', 'bishop', 'knight'];
  const promotion = validPromotionPieces.includes(promotionPiece) ? promotionPiece : 'queen';
  
  // Create the promoted piece
  const promotedPiece = {
    type: promotion,
    color: piece.color,
    // Keep hasMoved property if promoting to rook
    ...(promotion === 'rook' && { hasMoved: true })
  };
  
  // Apply promotion
  return setPieceAtPosition(board, position, promotedPiece);
};