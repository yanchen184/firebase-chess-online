import React, { useState, useEffect } from 'react';
import { 
  getPieceSymbol, 
  isPlayerTurn, 
  getPlayerColor,
  getPieceAtPosition,
  isValidSquare,
  positionToIndices,
  indicesToPosition,
  calculatePieceMoves,
  applyMove,
  isInCheck,
  wouldMoveResultInCheck,
  isPromotionMove
} from '../utils/chess';
import '../styles/ChessBoard.css';

/**
 * ChessBoard component displays the chess board and handles piece movement.
 * @param {Object} props - Component props
 * @param {Array} props.board - Array of objects representing the board state
 * @param {string} props.currentTurn - Current turn ('white' or 'black')
 * @param {Function} props.onMove - Callback function when a move is made
 * @param {string} props.userId - Current user ID
 * @param {Object} props.game - Current game object
 * @param {Object} props.lastMove - The last move that was made (for en passant)
 * @param {Array} props.moveHistory - History of all moves made
 */
const ChessBoard = ({ 
  board, 
  currentTurn, 
  onMove, 
  userId, 
  game, 
  lastMove = null,
  moveHistory = [] 
}) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [promotionPending, setPromotionPending] = useState(null);
  
  const playerColor = getPlayerColor(userId, game);
  const canPlay = isPlayerTurn(userId, game) && game.status === 'active';
  
  // Debug information
  useEffect(() => {
    console.log("Current game state:", {
      canPlay,
      playerColor,
      currentTurn,
      selectedSquare,
      validMoves,
      gameStatus: game.status
    });
  }, [canPlay, playerColor, currentTurn, selectedSquare, validMoves, game.status]);
  
  // Determine if board should be flipped based on player color
  useEffect(() => {
    setFlipped(playerColor === 'black');
  }, [playerColor]);
  
  // Reset selection when turn changes or game ends
  useEffect(() => {
    setSelectedSquare(null);
    setValidMoves([]);
  }, [currentTurn, game.status]);
  
  // When a square is clicked
  const handleSquareClick = (row, col) => {
    console.log(`Square clicked: ${row}, ${col}`);
    console.log(`Can play: ${canPlay}, Game status: ${game.status}`);
    
    // Don't allow moves if it's not the player's turn or game is completed
    if (!canPlay) {
      console.log("Cannot move - not player's turn or game is completed");
      return;
    }
    
    // If there's a promotion pending, don't allow clicking on squares
    if (promotionPending) {
      return;
    }
    
    const position = indicesToPosition(row, col);
    const piece = getPieceAtPosition(board, position);
    
    console.log(`Position: ${position}, Piece:`, piece);
    
    // If a piece is already selected
    if (selectedSquare) {
      const selectedPiece = getPieceAtPosition(board, selectedSquare);
      
      // If the clicked square is one of the valid moves, make the move
      if (validMoves.includes(position)) {
        console.log(`Making move from ${selectedSquare} to ${position}`);
        
        // Check if this is a pawn promotion move
        if (selectedPiece.type === 'pawn' && isPromotionMove(selectedSquare, position, selectedPiece)) {
          // Set promotion pending to show the promotion selection UI
          setPromotionPending({ from: selectedSquare, to: position });
          return;
        }
        
        // Otherwise, make the regular move
        makeMove(selectedSquare, position);
        return;
      }
      
      // If clicking on another own piece, select that piece instead
      if (piece && piece.color === playerColor) {
        console.log(`Selecting new piece at ${position}`);
        setSelectedSquare(position);
        calculateValidMoves(position, piece);
        return;
      }
      
      // Otherwise, deselect the piece
      console.log("Deselecting piece");
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }
    
    // If no piece is selected and the clicked square has a piece of the player's color
    if (piece && piece.color === playerColor) {
      console.log(`Selecting piece at ${position}`);
      setSelectedSquare(position);
      calculateValidMoves(position, piece);
    }
  };
  
  // Calculate valid moves for a piece
  const calculateValidMoves = (position, piece) => {
    console.log(`Calculating valid moves for ${piece.type} at ${position}`);
    
    // Get all potential moves for the piece
    const potentialMoves = calculatePieceMoves(board, position, piece, lastMove);
    
    // Filter out moves that would result in check
    const legalMoves = potentialMoves.filter(move => 
      !wouldMoveResultInCheck(board, position, move, piece.color)
    );
    
    console.log(`Valid moves:`, legalMoves);
    setValidMoves(legalMoves);
  };
  
  // Make a move
  const makeMove = (from, to, promotionPiece = null) => {
    const piece = getPieceAtPosition(board, from);
    
    if (!piece) return;
    
    // Apply the move and get new board state
    const { board: newBoard, moveInfo } = applyMove(board, from, to, lastMove, promotionPiece);
    
    // Update check status
    const opponentColor = piece.color === 'white' ? 'black' : 'white';
    moveInfo.isCheck = isInCheck(newBoard, opponentColor);
    
    // Pass the move to the parent component
    onMove(from, to, piece, newBoard, moveInfo);
    
    // Reset selection
    setSelectedSquare(null);
    setValidMoves([]);
    setPromotionPending(null);
  };
  
  // Handle promotion selection
  const handlePromotion = (pieceType) => {
    if (!promotionPending) return;
    
    makeMove(promotionPending.from, promotionPending.to, pieceType);
  };
  
  // Render promotion selection UI
  const renderPromotionOptions = () => {
    if (!promotionPending) return null;
    
    const promotionPiece = getPieceAtPosition(board, promotionPending.from);
    const color = promotionPiece.color;
    const pieceTypes = ['queen', 'rook', 'bishop', 'knight'];
    
    return (
      <div className="promotion-overlay">
        <div className="promotion-modal">
          <div className="promotion-title">選擇升變棋子</div>
          <div className="promotion-options">
            {pieceTypes.map(type => (
              <div 
                key={type} 
                className="promotion-option"
                onClick={() => handlePromotion(type)}
              >
                {getPieceSymbol(type, color)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Render the board
  const renderBoard = () => {
    const rows = [];
    
    for (let row = 0; row < 8; row++) {
      const squares = [];
      
      for (let col = 0; col < 8; col++) {
        const actualRow = flipped ? 7 - row : row;
        const actualCol = flipped ? 7 - col : col;
        
        const position = indicesToPosition(actualRow, actualCol);
        const piece = getPieceAtPosition(board, position);
        
        const isSelected = selectedSquare === position;
        const isValidMove = validMoves.includes(position);
        const isValidCapture = isValidMove && piece;
        
        // Check if this square is the last move's from or to position
        const isLastMoveFrom = lastMove && lastMove.from === position;
        const isLastMoveTo = lastMove && lastMove.to === position;
        
        // Determine square color
        const isLightSquare = (row + col) % 2 === 0;
        const squareClass = isLightSquare ? 'light' : 'dark';
        
        squares.push(
          <div
            key={`${row}-${col}`}
            className={`
              chess-square ${squareClass}
              ${isSelected ? 'selected' : ''}
              ${isValidMove && !isValidCapture ? 'valid-move' : ''}
              ${isValidCapture ? 'valid-capture' : ''}
              ${isLastMoveFrom ? 'last-move-from' : ''}
              ${isLastMoveTo ? 'last-move-to' : ''}
              ${game.status === 'completed' ? 'cursor-not-allowed' : ''}
            `}
            onClick={() => handleSquareClick(actualRow, actualCol)}
          >
            {piece && (
              <div className={`chess-piece piece-${piece.color}`}>
                {getPieceSymbol(piece.type, piece.color)}
              </div>
            )}
          </div>
        );
      }
      
      rows.push(
        <div key={row} className="row">
          {squares}
        </div>
      );
    }
    
    return rows;
  };
  
  // Render rank and file labels
  const renderLabels = () => {
    const files = [];
    const ranks = [];
    
    // File labels (a-h)
    for (let i = 0; i < 8; i++) {
      const file = String.fromCharCode(97 + (flipped ? 7 - i : i));
      files.push(
        <div key={file} className="file-label">
          {file}
        </div>
      );
    }
    
    // Rank labels (1-8)
    for (let i = 0; i < 8; i++) {
      const rank = (flipped ? i + 1 : 8 - i).toString();
      ranks.push(
        <div key={rank} className="rank-label">
          {rank}
        </div>
      );
    }
    
    return (
      <>
        <div className="file-labels">{files}</div>
        <div className="rank-labels">{ranks}</div>
      </>
    );
  };
  
  return (
    <div className="chess-board-container">
      <div className="chess-board">
        {renderBoard()}
        {renderLabels()}
      </div>
      {promotionPending && renderPromotionOptions()}
    </div>
  );
};

export default ChessBoard;