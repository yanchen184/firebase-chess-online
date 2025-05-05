/**
 * Castling related functions
 */

import { getPieceAtPosition, setPieceAtPosition } from '../board';
import { positionToIndices, indicesToPosition } from '../utils';
import { isInCheck, isPositionUnderAttack } from './check';

/**
 * Checks if castling is possible in a given direction.
 * @param {Array} board - The board array
 * @param {string} kingPosition - Position of the king
 * @param {string} direction - 'kingside' or 'queenside'
 * @returns {boolean} True if castling is possible
 */
export const canCastle = (board, kingPosition, direction) => {
  const [kingRow, kingCol] = positionToIndices(kingPosition);
  const king = getPieceAtPosition(board, kingPosition);
  
  // Basic checks
  if (!king || king.type !== 'king' || king.hasMoved) {
    return false;
  }
  
  const color = king.color;
  
  // Check if king is in check
  if (isInCheck(board, color)) {
    return false;
  }
  
  // Determine rook position and squares to check
  const rookCol = direction === 'kingside' ? 7 : 0;
  const rookPosition = indicesToPosition(kingRow, rookCol);
  const rook = getPieceAtPosition(board, rookPosition);
  
  // Check if rook exists and has not moved
  if (!rook || rook.type !== 'rook' || rook.color !== color || rook.hasMoved) {
    return false;
  }
  
  // Check if squares between king and rook are empty
  const step = direction === 'kingside' ? 1 : -1;
  const limit = direction === 'kingside' ? rookCol - 1 : rookCol + 1;
  
  for (let col = kingCol + step; direction === 'kingside' ? col <= limit : col >= limit; col += step) {
    const pos = indicesToPosition(kingRow, col);
    if (getPieceAtPosition(board, pos)) {
      return false;
    }
  }
  
  // Check if king passes through or ends on an attacked square
  const opponentColor = color === 'white' ? 'black' : 'white';
  
  // King moves 2 squares during castling
  for (let step = 1; step <= 2; step++) {
    const col = kingCol + (direction === 'kingside' ? step : -step);
    const pos = indicesToPosition(kingRow, col);
    
    if (isPositionUnderAttack(board, pos, opponentColor)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Applies a castling move.
 * @param {Array} board - The board array
 * @param {string} kingPosition - Position of the king
 * @param {string} direction - 'kingside' or 'queenside'
 * @returns {Array} New board after castling
 */
export const applyCastling = (board, kingPosition, direction) => {
  const [kingRow, kingCol] = positionToIndices(kingPosition);
  const king = getPieceAtPosition(board, kingPosition);
  
  if (!king) return board;
  
  // Determine new positions
  const rookCol = direction === 'kingside' ? 7 : 0;
  const rookPosition = indicesToPosition(kingRow, rookCol);
  const rook = getPieceAtPosition(board, rookPosition);
  
  const newKingCol = kingCol + (direction === 'kingside' ? 2 : -2);
  const newKingPosition = indicesToPosition(kingRow, newKingCol);
  
  const newRookCol = direction === 'kingside' ? newKingCol - 1 : newKingCol + 1;
  const newRookPosition = indicesToPosition(kingRow, newRookCol);
  
  // Apply the move
  let newBoard = setPieceAtPosition(board, kingPosition, null);
  newBoard = setPieceAtPosition(newBoard, rookPosition, null);
  
  newBoard = setPieceAtPosition(newBoard, newKingPosition, { ...king, hasMoved: true });
  newBoard = setPieceAtPosition(newBoard, newRookPosition, { ...rook, hasMoved: true });
  
  return newBoard;
};

/**
 * Determines if a move is a castling move.
 * @param {string} from - Starting position
 * @param {string} to - Ending position
 * @param {Object} piece - The piece being moved
 * @returns {Object|null} Castling info or null if not castling
 */
export const isCastlingMove = (from, to, piece) => {
  if (!piece || piece.type !== 'king') return null;
  
  const [fromRow, fromCol] = positionToIndices(from);
  const [toRow, toCol] = positionToIndices(to);
  
  // King moves 2 squares horizontally
  if (fromRow === toRow && Math.abs(fromCol - toCol) === 2) {
    const direction = toCol > fromCol ? 'kingside' : 'queenside';
    return { direction };
  }
  
  return null;
};