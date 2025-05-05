import React, { useState, useEffect } from 'react';
import { 
  getPieceSymbol, 
  positionToIndices, 
  indicesToPosition, 
  isPlayerTurn, 
  getPlayerColor,
  getPieceAtPosition,
  setPieceAtPosition
} from '../utils/chessUtils';

/**
 * ChessBoard component displays the chess board and handles piece movement.
 * @param {Object} props - Component props
 * @param {Array} props.board - Array of objects representing the board state
 * @param {string} props.currentTurn - Current turn ('white' or 'black')
 * @param {Function} props.onMove - Callback function when a move is made
 * @param {string} props.userId - Current user ID
 * @param {Object} props.game - Current game object
 */
const ChessBoard = ({ board, currentTurn, onMove, userId, game }) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [flipped, setFlipped] = useState(false);
  
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
    
    const position = indicesToPosition(row, col);
    const piece = getPieceAtPosition(board, position);
    
    console.log(`Position: ${position}, Piece:`, piece);
    
    // If a piece is already selected
    if (selectedSquare) {
      const selectedPiece = getPieceAtPosition(board, selectedSquare);
      
      // If the clicked square is one of the valid moves, make the move
      if (validMoves.includes(position)) {
        console.log(`Making move from ${selectedSquare} to ${position}`);
        onMove(selectedSquare, position, selectedPiece);
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }
      
      // If clicking on another own piece, select that piece instead
      if (piece && piece.color === playerColor) {
        console.log(`Selecting new piece at ${position}`);
        setSelectedSquare(position);
        calculateValidMoves(row, col, piece);
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
      calculateValidMoves(row, col, piece);
    }
  };
  
  // Simple implementation of valid move calculation
  // In a real app, this would need to be more sophisticated
  const calculateValidMoves = (row, col, piece) => {
    console.log(`Calculating valid moves for ${piece.type} at ${row}, ${col}`);
    const moves = [];
    
    switch (piece.type) {
      case 'pawn':
        calculatePawnMoves(row, col, piece.color, moves);
        break;
      case 'rook':
        calculateRookMoves(row, col, piece.color, moves);
        break;
      case 'knight':
        calculateKnightMoves(row, col, piece.color, moves);
        break;
      case 'bishop':
        calculateBishopMoves(row, col, piece.color, moves);
        break;
      case 'queen':
        calculateRookMoves(row, col, piece.color, moves);
        calculateBishopMoves(row, col, piece.color, moves);
        break;
      case 'king':
        calculateKingMoves(row, col, piece.color, moves);
        break;
      default:
        break;
    }
    
    console.log(`Valid moves:`, moves);
    setValidMoves(moves);
  };
  
  // Calculate valid moves for each piece type
  const calculatePawnMoves = (row, col, color, moves) => {
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    
    // Move forward one square
    const forwardPos = indicesToPosition(row + direction, col);
    if (isValidSquare(row + direction, col) && !getPieceAtPosition(board, forwardPos)) {
      moves.push(forwardPos);
      
      // Move forward two squares from starting position
      const twoForwardPos = indicesToPosition(row + 2 * direction, col);
      if (row === startRow && isValidSquare(row + 2 * direction, col) && 
          !getPieceAtPosition(board, twoForwardPos)) {
        moves.push(twoForwardPos);
      }
    }
    
    // Capture diagonally
    for (const offset of [-1, 1]) {
      const newRow = row + direction;
      const newCol = col + offset;
      
      if (isValidSquare(newRow, newCol)) {
        const diagPos = indicesToPosition(newRow, newCol);
        const targetPiece = getPieceAtPosition(board, diagPos);
        
        if (targetPiece && targetPiece.color !== color) {
          moves.push(diagPos);
        }
      }
    }
  };
  
  const calculateRookMoves = (row, col, color, moves) => {
    // Directions: up, right, down, left
    const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    
    for (const [dx, dy] of directions) {
      let newRow = row + dx;
      let newCol = col + dy;
      
      while (isValidSquare(newRow, newCol)) {
        const position = indicesToPosition(newRow, newCol);
        const targetPiece = getPieceAtPosition(board, position);
        
        if (!targetPiece) {
          // Empty square - valid move
          moves.push(position);
        } else if (targetPiece.color !== color) {
          // Opponent's piece - valid move (capture)
          moves.push(position);
          break;
        } else {
          // Own piece - can't move past it
          break;
        }
        
        newRow += dx;
        newCol += dy;
      }
    }
  };
  
  const calculateKnightMoves = (row, col, color, moves) => {
    // All possible knight moves
    const knightMoves = [
      [-2, -1], [-2, 1], [2, -1], [2, 1],
      [-1, -2], [-1, 2], [1, -2], [1, 2]
    ];
    
    for (const [dx, dy] of knightMoves) {
      const newRow = row + dx;
      const newCol = col + dy;
      
      if (isValidSquare(newRow, newCol)) {
        const position = indicesToPosition(newRow, newCol);
        const targetPiece = getPieceAtPosition(board, position);
        
        if (!targetPiece || targetPiece.color !== color) {
          moves.push(position);
        }
      }
    }
  };
  
  const calculateBishopMoves = (row, col, color, moves) => {
    // Directions: up-left, up-right, down-right, down-left
    const directions = [[-1, -1], [-1, 1], [1, 1], [1, -1]];
    
    for (const [dx, dy] of directions) {
      let newRow = row + dx;
      let newCol = col + dy;
      
      while (isValidSquare(newRow, newCol)) {
        const position = indicesToPosition(newRow, newCol);
        const targetPiece = getPieceAtPosition(board, position);
        
        if (!targetPiece) {
          // Empty square - valid move
          moves.push(position);
        } else if (targetPiece.color !== color) {
          // Opponent's piece - valid move (capture)
          moves.push(position);
          break;
        } else {
          // Own piece - can't move past it
          break;
        }
        
        newRow += dx;
        newCol += dy;
      }
    }
  };
  
  const calculateKingMoves = (row, col, color, moves) => {
    // All possible king moves
    const kingMoves = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dx, dy] of kingMoves) {
      const newRow = row + dx;
      const newCol = col + dy;
      
      if (isValidSquare(newRow, newCol)) {
        const position = indicesToPosition(newRow, newCol);
        const targetPiece = getPieceAtPosition(board, position);
        
        if (!targetPiece || targetPiece.color !== color) {
          moves.push(position);
        }
      }
    }
  };
  
  // Helper function to check if a square is on the board
  const isValidSquare = (row, col) => {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
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
  
  return (
    <div className="chess-board">
      {renderBoard()}
    </div>
  );
};

export default ChessBoard;