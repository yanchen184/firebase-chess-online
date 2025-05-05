/**
 * King movement logic
 */

import { isValidSquare, indicesToPosition } from '../utils';
import { getPieceAtPosition } from '../board';
import { isInCheck, isPositionUnderAttack } from '../rules/check';

/**
 * Calculates king moves including castling.
 * @param {Array} board - The board array
 * @param {number} row - Current row
 * @param {number} col - Current column
 * @param {string} color - Piece color
 * @param {boolean} forAttackCheck - If true, excludes castling
 * @returns {Array} Array of possible positions
 */
export const calculateKingMoves = (board, row, col, color, forAttackCheck = false) => {
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