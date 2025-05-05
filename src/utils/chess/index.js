/**
 * Main entry point for the chess module.
 * 
 * This file exports all chess functionality from the various submodules,
 * making it easy to import all needed functions from a single place.
 */

// Board related
export {
  initialBoardSetup,
  getPieceAtPosition,
  setPieceAtPosition,
  findKingPosition
} from './board';

// Move calculations
export {
  calculatePieceMoves,
  calculatePawnMoves,
  calculateRookMoves,
  calculateKnightMoves,
  calculateBishopMoves,
  calculateQueenMoves,
  calculateKingMoves
} from './moves';

// Chess rules
export {
  // Game state checking
  checkGameOutcome,
  isInCheck,
  isPositionUnderAttack,
  hasLegalMoves,
  wouldMoveResultInCheck,
  
  // Move application
  applyMove,
  
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
} from './rules';

// Utility functions
export {
  isValidSquare,
  positionToIndices,
  indicesToPosition,
  getPieceSymbol,
  isPlayerTurn,
  getPlayerColor
} from './utils';