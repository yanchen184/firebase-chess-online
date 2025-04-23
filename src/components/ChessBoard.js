import React, { useState, useEffect } from 'react';
import { getPieceSymbol, positionToIndices, indicesToPosition, isPlayerTurn, getPlayerColor } from '../utils/chessUtils';

/**
 * ChessBoard component displays the chess board and handles piece movement.
 * @param {Object} props - Component props
 * @param {Array} props.board - 2D array representing the current board state
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
  const canPlay = isPlayerTurn(userId, game);
  
  // Determine if board should be flipped based on player color
  useEffect(() => {
    setFlipped(playerColor === 'black');
  }, [playerColor]);
  
  // Reset selection when turn changes
  useEffect(() => {
    setSelectedSquare(null);
    setValidMoves([]);
  }, [currentTurn]);
  
  // When a square is clicked
  const handleSquareClick = (row, col) => {
    // Don't allow moves if it's not the player's turn
    if (!canPlay) return;
    
    const position = indicesToPosition(row, col);
    const piece = board[row][col];
    
    // If a piece is already selected
    if (selectedSquare) {
      const [selectedRow, selectedCol] = positionToIndices(selectedSquare);
      const selectedPiece = board[selectedRow][selectedCol];
      
      // If the clicked square is one of the valid moves, make the move
      if (validMoves.includes(position)) {
        onMove(selectedSquare, position, selectedPiece);
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }
      
      // If clicking on another own piece, select that piece instead
      if (piece && piece.color === playerColor) {
        setSelectedSquare(position);
        calculateValidMoves(row, col, piece);
        return;
      }
      
      // Otherwise, deselect the piece
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }
    
    // If no piece is selected and the clicked square has a piece of the player's color
    if (piece && piece.color === playerColor) {
      setSelectedSquare(position);
      calculateValidMoves(row, col, piece);
    }
  };
  
  // Simple implementation of valid move calculation
  // In a real app, this would need to be more sophisticated
  const calculateValidMoves = (row, col, piece) => {
    // This is a simplified version that doesn't check for check, checkmate, etc.
    // A real chess implementation would need much more complex move logic
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
    
    setValidMoves(moves);
  };
  
  // Calculate valid moves for each piece type
  const calculatePawnMoves = (row, col, color, moves) => {
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    
    // Move forward one square
    if (isValidSquare(row + direction, col) && !board[row + direction][col]) {
      moves.push(indicesToPosition(row + direction, col));
      
      // Move forward two squares from starting position
      if (row === startRow && isValidSquare(row + 2 * direction, col) && !board[row + 2 * direction][col]) {
        moves.push(indicesToPosition(row + 2 * direction, col));
      }
    }
    
    // Capture diagonally
    for (const offset of [-1, 1]) {
      const newRow = row + direction;
      const newCol = col + offset;
      
      if (isValidSquare(newRow, newCol) && board[newRow][newCol] && board[newRow][newCol].color !== color) {
        moves.push(indicesToPosition(newRow, newCol));
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
        const targetPiece = board[newRow][newCol];
        
        if (!targetPiece) {
          // Empty square - valid move
          moves.push(indicesToPosition(newRow, newCol));
        } else if (targetPiece.color !== color) {
          // Opponent's piece - valid move (capture)
          moves.push(indicesToPosition(newRow, newCol));
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
        const targetPiece = board[newRow][newCol];
        
        if (!targetPiece || targetPiece.color !== color) {
          moves.push(indicesToPosition(newRow, newCol));
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
        const targetPiece = board[newRow][newCol];
        
        if (!targetPiece) {
          // Empty square - valid move
          moves.push(indicesToPosition(newRow, newCol));
        } else if (targetPiece.color !== color) {
          // Opponent's piece - valid move (capture)
          moves.push(indicesToPosition(newRow, newCol));
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
        const targetPiece = board[newRow][newCol];
        
        if (!targetPiece || targetPiece.color !== color) {
          moves.push(indicesToPosition(newRow, newCol));
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
        const piece = board[actualRow][actualCol];
        
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
              ${isValidMove ? 'valid-move' : ''}
              ${isValidCapture ? 'valid-capture' : ''}
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