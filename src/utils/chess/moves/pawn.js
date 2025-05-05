/**
 * Pawn movement logic
 */

import { isValidSquare, indicesToPosition, positionToIndices } from '../utils';
import { getPieceAtPosition } from '../board';

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
export const calculatePawnMoves = (board, row, col, color, lastMove = null, forAttackCheck = false) => {
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