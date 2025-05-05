/**
 * Rook movement logic
 */

import { isValidSquare, indicesToPosition } from '../utils';
import { getPieceAtPosition } from '../board';

/**
 * Calculates rook moves.
 * @param {Array} board - The board array
 * @param {number} row - Current row
 * @param {number} col - Current column
 * @param {string} color - Piece color
 * @returns {Array} Array of possible positions
 */
export const calculateRookMoves = (board, row, col, color) => {
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