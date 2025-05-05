/**
 * Board related functions
 */

import { indicesToPosition } from './utils';

/**
 * Creates and returns the initial chess board setup.
 * Board is represented as a flat array where each cell contains position and piece information.
 * Each piece is an object with type and color properties.
 * @returns {Array} Array of 64 positions with pieces
 */
export const initialBoardSetup = () => {
  // Create flat board representation
  const board = [];
  
  // Initialize all positions
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const position = indicesToPosition(row, col);
      let piece = null;
      
      // Add pawns
      if (row === 1) {
        piece = { type: 'pawn', color: 'black' };
      } else if (row === 6) {
        piece = { type: 'pawn', color: 'white' };
      }
      
      // Add back rank pieces
      if (row === 0 || row === 7) {
        const color = row === 0 ? 'black' : 'white';
        if (col === 0 || col === 7) {
          piece = { type: 'rook', color, hasMoved: false };
        } else if (col === 1 || col === 6) {
          piece = { type: 'knight', color };
        } else if (col === 2 || col === 5) {
          piece = { type: 'bishop', color };
        } else if (col === 3) {
          piece = { type: 'queen', color };
        } else if (col === 4) {
          piece = { type: 'king', color, hasMoved: false };
        }
      }
      
      board.push({
        position,
        piece
      });
    }
  }
  
  return board;
};

/**
 * Gets a piece at a specific position from the board.
 * @param {Array} board - The board array
 * @param {string} position - Chess notation position (e.g., "e4")
 * @returns {Object|null} The piece at the position or null
 */
export const getPieceAtPosition = (board, position) => {
  const cell = board.find(cell => cell.position === position);
  return cell ? cell.piece : null;
};

/**
 * Sets a piece at a specific position on the board.
 * @param {Array} board - The board array
 * @param {string} position - Chess notation position (e.g., "e4")
 * @param {Object|null} piece - The piece to set or null to clear
 * @returns {Array} New board with the updated position
 */
export const setPieceAtPosition = (board, position, piece) => {
  return board.map(cell => 
    cell.position === position ? { ...cell, piece } : cell
  );
};

/**
 * Finds the king's position for a given color.
 * @param {Array} board - The board array
 * @param {string} color - The color to check ('white' or 'black')
 * @returns {string|null} The position of the king or null if not found
 */
export const findKingPosition = (board, color) => {
  const kingCell = board.find(cell => 
    cell.piece && cell.piece.type === 'king' && cell.piece.color === color
  );
  return kingCell ? kingCell.position : null;
};