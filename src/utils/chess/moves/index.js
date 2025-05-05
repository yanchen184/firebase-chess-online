/**
 * Main module for piece movement logic
 */

import { positionToIndices } from '../utils';
import { calculatePawnMoves } from './pawn';
import { calculateRookMoves } from './rook';
import { calculateKnightMoves } from './knight';
import { calculateBishopMoves } from './bishop';
import { calculateQueenMoves } from './queen';
import { calculateKingMoves } from './king';

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

// Export individual piece move functions
export { calculatePawnMoves } from './pawn';
export { calculateRookMoves } from './rook';
export { calculateKnightMoves } from './knight';
export { calculateBishopMoves } from './bishop';
export { calculateQueenMoves } from './queen';
export { calculateKingMoves } from './king';