/**
 * En passant related functions
 */

import { positionToIndices, indicesToPosition } from '../utils';
import { getPieceAtPosition, setPieceAtPosition } from '../board';

/**
 * Checks if an en passant capture is possible at a given position.
 * @param {Array} board - The board array
 * @param {string} position - Position of the pawn
 * @param {Object} lastMove - The last move made 
 * @returns {Array} Array of possible en passant capture positions
 */
export const getEnPassantMoves = (board, position, lastMove) => {
  if (!lastMove) return [];
  
  const moves = [];
  const piece = getPieceAtPosition(board, position);
  
  if (!piece || piece.type !== 'pawn') return moves;
  
  const [row, col] = positionToIndices(position);
  const color = piece.color;
  const direction = color === 'white' ? -1 : 1;
  
  // En passant is only possible on rank 5 for white and rank 4 for black
  const enPassantRow = color === 'white' ? 3 : 4;
  
  if (row !== enPassantRow) return moves;
  
  // Check if the last move was a two-square pawn move by the opponent
  const lastMovePiece = getPieceAtPosition(board, lastMove.to);
  const [lastFromRow, lastFromCol] = positionToIndices(lastMove.from);
  const [lastToRow, lastToCol] = positionToIndices(lastMove.to);
  
  if (lastMovePiece && 
      lastMovePiece.type === 'pawn' && 
      lastMovePiece.color !== color &&
      Math.abs(lastFromRow - lastToRow) === 2 &&
      lastToRow === row) {
    
    // Check if the opponent's pawn is adjacent
    if (Math.abs(lastToCol - col) === 1) {
      const capturePos = indicesToPosition(row + direction, lastToCol);
      moves.push(capturePos);
    }
  }
  
  return moves;
};

/**
 * Determines if a move is an en passant capture.
 * @param {Array} board - The board array
 * @param {string} from - Starting position
 * @param {string} to - Ending position
 * @param {Object} lastMove - The last move made
 * @returns {boolean} True if the move is an en passant capture
 */
export const isEnPassantMove = (board, from, to, lastMove) => {
  if (!lastMove) return false;
  
  const piece = getPieceAtPosition(board, from);
  
  if (!piece || piece.type !== 'pawn') return false;
  
  const [fromRow, fromCol] = positionToIndices(from);
  const [toRow, toCol] = positionToIndices(to);
  
  // Pawn moves diagonally
  if (Math.abs(fromCol - toCol) === 1) {
    // Check if the target square is empty (not a regular capture)
    if (!getPieceAtPosition(board, to)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Applies an en passant capture.
 * @param {Array} board - The board array
 * @param {string} from - Starting position
 * @param {string} to - Ending position
 * @param {Object} lastMove - The last move made
 * @returns {Array} New board after en passant capture
 */
export const applyEnPassant = (board, from, to, lastMove) => {
  const piece = getPieceAtPosition(board, from);
  
  if (!piece) return board;
  
  const [fromRow, fromCol] = positionToIndices(from);
  const [toRow, toCol] = positionToIndices(to);
  
  // Remove the captured pawn
  const capturedPos = indicesToPosition(fromRow, toCol);
  
  // Apply the move
  let newBoard = setPieceAtPosition(board, from, null);
  newBoard = setPieceAtPosition(newBoard, capturedPos, null);
  newBoard = setPieceAtPosition(newBoard, to, piece);
  
  return newBoard;
};