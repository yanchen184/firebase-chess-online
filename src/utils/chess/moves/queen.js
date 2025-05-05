/**
 * Queen movement logic
 */

import { calculateRookMoves } from './rook';
import { calculateBishopMoves } from './bishop';

/**
 * Calculates queen moves (combination of rook and bishop).
 * @param {Array} board - The board array
 * @param {number} row - Current row
 * @param {number} col - Current column
 * @param {string} color - Piece color
 * @returns {Array} Array of possible positions
 */
export const calculateQueenMoves = (board, row, col, color) => {
  return [
    ...calculateRookMoves(board, row, col, color),
    ...calculateBishopMoves(board, row, col, color)
  ];
};