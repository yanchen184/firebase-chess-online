/**
 * Knight movement logic
 */

import { isValidSquare, indicesToPosition } from '../utils';
import { getPieceAtPosition } from '../board';

/**
 * Calculates knight moves.
 * @param {Array} board - The board array
 * @param {number} row - Current row
 * @param {number} col - Current column
 * @param {string} color - Piece color
 * @returns {Array} Array of possible positions
 */
export const calculateKnightMoves = (board, row, col, color) => {
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