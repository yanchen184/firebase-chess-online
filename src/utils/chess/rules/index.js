/**
 * Main module for chess rules
 */

import { isInCheck, isPositionUnderAttack, hasLegalMoves, wouldMoveResultInCheck } from './check';
import { canCastle, applyCastling, isCastlingMove } from './castling';
import { getEnPassantMoves, isEnPassantMove, applyEnPassant } from './enPassant';
import { canPromote, isPromotionMove, applyPromotion } from './promotion';
import { 
  hasInsufficientMaterial, 
  isStalemate, 
  countMovesWithoutProgress, 
  isFiftyMoveRule, 
  isThreefoldRepetition 
} from './draw';
import { getPieceAtPosition, setPieceAtPosition } from '../board';
import { positionToIndices } from '../utils';

/**
 * Applies a move and handles special moves (castling, en passant, promotion).
 * @param {Array} board - The board array
 * @param {string} from - Starting position
 * @param {string} to - Ending position
 * @param {Object} lastMove - The last move made
 * @param {string} promotionPiece - The piece to promote to (if pawn promotion)
 * @returns {Object} Object containing new board and move information
 */
export const applyMove = (board, from, to, lastMove = null, promotionPiece = 'queen') => {
  let newBoard = [...board];
  const piece = getPieceAtPosition(newBoard, from);
  const capturedPiece = getPieceAtPosition(newBoard, to);
  
  if (!piece) return { board: newBoard };
  
  // Check for special moves
  const moveInfo = {
    from,
    to,
    piece,
    capturedPiece,
    isCheck: false,
    isCheckmate: false,
    isPromotion: false,
    isCastling: false,
    isEnPassant: false,
    drawType: null
  };
  
  // Check for castling
  const castlingInfo = isCastlingMove(from, to, piece);
  if (castlingInfo) {
    moveInfo.isCastling = true;
    moveInfo.castlingDirection = castlingInfo.direction;
    newBoard = applyCastling(newBoard, from, castlingInfo.direction);
    return { board: newBoard, moveInfo };
  }
  
  // Check for en passant
  if (isEnPassantMove(newBoard, from, to, lastMove)) {
    moveInfo.isEnPassant = true;
    newBoard = applyEnPassant(newBoard, from, to, lastMove);
    return { board: newBoard, moveInfo };
  }
  
  // Regular move
  newBoard = setPieceAtPosition(newBoard, from, null);
  let movedPiece = { ...piece, hasMoved: true };
  
  // Check for promotion
  if (isPromotionMove(from, to, piece)) {
    moveInfo.isPromotion = true;
    moveInfo.promotionPiece = promotionPiece;
    movedPiece = {
      type: promotionPiece,
      color: piece.color,
      ...(promotionPiece === 'rook' && { hasMoved: true })
    };
  }
  
  newBoard = setPieceAtPosition(newBoard, to, movedPiece);
  
  return { board: newBoard, moveInfo };
};

/**
 * Determines the game outcome based on the board state and game history.
 * @param {Array} board - The board array
 * @param {string} currentTurn - The current player's turn
 * @param {Object} lastMove - The last move made
 * @param {Array} moveHistory - History of all moves made
 * @param {Array} positionHistory - History of all board positions
 * @returns {Object|null} Game outcome {winner, reason} or null if game continues
 */
export const checkGameOutcome = (board, currentTurn, lastMove = null, moveHistory = [], positionHistory = []) => {
  // Check if current player is in check
  const inCheck = isInCheck(board, currentTurn);
  
  // Check if current player has any legal moves
  const hasLegalMove = hasLegalMoves(board, currentTurn, lastMove);
  
  if (!hasLegalMove) {
    if (inCheck) {
      // Checkmate
      const winner = currentTurn === 'white' ? 'black' : 'white';
      return { winner, reason: 'Checkmate' };
    } else {
      // Stalemate
      return { winner: 'draw', reason: 'Stalemate' };
    }
  }
  
  // Check for insufficient material
  if (hasInsufficientMaterial(board)) {
    return { winner: 'draw', reason: 'Insufficient material' };
  }
  
  // Check for fifty-move rule
  if (moveHistory.length >= 100 && isFiftyMoveRule(moveHistory)) {
    return { winner: 'draw', reason: 'Fifty-move rule' };
  }
  
  // Check for threefold repetition
  if (positionHistory.length >= 9 && isThreefoldRepetition(positionHistory)) {
    return { winner: 'draw', reason: 'Threefold repetition' };
  }
  
  return null; // Game continues
};

// Export all rule functions
export {
  // Check and checkmate
  isInCheck,
  isPositionUnderAttack,
  hasLegalMoves,
  wouldMoveResultInCheck,
  
  // Castling
  canCastle,
  applyCastling,
  isCastlingMove,
  
  // En passant
  getEnPassantMoves,
  isEnPassantMove,
  applyEnPassant,
  
  // Promotion
  canPromote,
  isPromotionMove,
  applyPromotion,
  
  // Draw conditions
  hasInsufficientMaterial,
  isStalemate,
  countMovesWithoutProgress,
  isFiftyMoveRule,
  isThreefoldRepetition
};