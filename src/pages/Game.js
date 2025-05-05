import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import ChessBoard from '../components/ChessBoard';
import { 
  initialBoardSetup, 
  checkGameOutcome,
  isInCheck
} from '../utils/chess';
import '../styles/Game.css';

const Game = () => {
  const { gameId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [moveNotation, setMoveNotation] = useState([]);
  const [boardPositions, setBoardPositions] = useState([]);
  
  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return;
    
    const unsubscribe = onSnapshot(
      doc(db, 'games', gameId),
      (doc) => {
        if (doc.exists()) {
          const gameData = doc.data();
          setGame(gameData);
          setLoading(false);
          
          // Set move history
          if (gameData.moves) {
            setMoveHistory(gameData.moves);
          }
          
          // Set move notation
          if (gameData.notation) {
            setMoveNotation(gameData.notation);
          }
          
          // Set board positions history
          if (gameData.boardPositions) {
            setBoardPositions(gameData.boardPositions);
          }
        } else {
          setError('Game not found');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error getting game:', err);
        setError('Failed to load game');
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [gameId]);
  
  // Handle player move
  const handleMove = async (from, to, piece, newBoard, moveInfo) => {
    if (!game || !currentUser) return;
    
    try {
      // Create a move object
      const move = {
        from,
        to,
        piece: { type: piece.type, color: piece.color },
        timestamp: new Date().toISOString(),
        playerId: currentUser.uid,
        ...moveInfo
      };
      
      // Get the last move position
      const lastPosition = boardPositions.length > 0 
        ? boardPositions[boardPositions.length - 1] 
        : { board: game.board, enPassantTarget: null };
      
      // Create a new position object
      const newPosition = {
        board: newBoard,
        enPassantTarget: piece.type === 'pawn' && Math.abs(positionToIndices(from)[0] - positionToIndices(to)[0]) === 2 
          ? to 
          : null
      };
      
      // Check for game outcome
      const nextTurn = game.currentTurn === 'white' ? 'black' : 'white';
      const outcome = checkGameOutcome(
        newBoard, 
        nextTurn, 
        move, 
        moveHistory, 
        boardPositions
      );
      
      // Update game status if there's an outcome
      let status = game.status;
      let winner = game.winner;
      let winReason = game.winReason;
      
      if (outcome) {
        status = 'completed';
        winner = outcome.winner;
        winReason = outcome.reason;
      }
      
      // Generate algebraic notation for the move
      const notation = generateMoveNotation(from, to, piece, moveInfo, newBoard, nextTurn);
      
      // Update game in Firestore
      await updateDoc(doc(db, 'games', gameId), {
        board: newBoard,
        currentTurn: nextTurn,
        lastMove: move,
        moves: [...game.moves, move],
        notation: [...(game.notation || []), notation],
        boardPositions: [...(game.boardPositions || []), newPosition],
        status,
        winner,
        winReason,
        updatedAt: new Date().toISOString()
      });
      
    } catch (err) {
      console.error('Error updating game:', err);
      setError('Failed to update game');
    }
  };
  
  // Generate algebraic notation for a move
  const generateMoveNotation = (from, to, piece, moveInfo, board, nextTurn) => {
    const pieceSymbols = {
      king: 'K',
      queen: 'Q',
      rook: 'R',
      bishop: 'B',
      knight: 'N',
      pawn: ''
    };
    
    // Special moves
    if (moveInfo.isCastling) {
      return moveInfo.castlingDirection === 'kingside' ? 'O-O' : 'O-O-O';
    }
    
    let notation = '';
    
    // Add piece symbol
    notation += pieceSymbols[piece.type];
    
    // Add from position if needed for disambiguation
    // (simplified here, would need more logic for full disambiguation)
    
    // Add capture symbol
    if (moveInfo.capturedPiece || moveInfo.isEnPassant) {
      // If pawn makes a capture, include the file it moved from
      if (piece.type === 'pawn') {
        notation += from.charAt(0);
      }
      notation += 'x';
    }
    
    // Add destination square
    notation += to;
    
    // Add promotion piece
    if (moveInfo.isPromotion) {
      notation += '=' + pieceSymbols[moveInfo.promotionPiece].toUpperCase();
    }
    
    // Add check or checkmate symbol
    if (isInCheck(board, nextTurn)) {
      // Check for checkmate
      const hasMoves = moveInfo.isCheckmate ? false : true;
      notation += hasMoves ? '+' : '#';
    }
    
    return notation;
  };
  
  // Allow players to resign
  const handleResign = async () => {
    if (!game || !currentUser) return;
    
    // Make sure the user is a player in this game
    const isWhitePlayer = game.whitePlayer.uid === currentUser.uid;
    const isBlackPlayer = game.blackPlayer.uid === currentUser.uid;
    
    if (!isWhitePlayer && !isBlackPlayer) return;
    
    try {
      const winner = isWhitePlayer ? 'black' : 'white';
      
      await updateDoc(doc(db, 'games', gameId), {
        status: 'completed',
        winner,
        winReason: 'Resignation',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error resigning game:', err);
      setError('Failed to resign game');
    }
  };
  
  // Allow players to offer or accept a draw
  const handleDrawOffer = async () => {
    if (!game || !currentUser) return;
    
    // Make sure the user is a player in this game
    const isWhitePlayer = game.whitePlayer.uid === currentUser.uid;
    const isBlackPlayer = game.blackPlayer.uid === currentUser.uid;
    
    if (!isWhitePlayer && !isBlackPlayer) return;
    
    try {
      // If there's already a draw offer from the opponent, accept it
      if (
        (isWhitePlayer && game.drawOfferBy === 'black') ||
        (isBlackPlayer && game.drawOfferBy === 'white')
      ) {
        await updateDoc(doc(db, 'games', gameId), {
          status: 'completed',
          winner: 'draw',
          winReason: 'Agreement',
          drawOfferBy: null,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Otherwise, offer a draw
        await updateDoc(doc(db, 'games', gameId), {
          drawOfferBy: isWhitePlayer ? 'white' : 'black',
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error with draw offer:', err);
      setError('Failed to handle draw offer');
    }
  };
  
  // Decline a draw offer
  const handleDeclineDraw = async () => {
    if (!game || !currentUser) return;
    
    try {
      await updateDoc(doc(db, 'games', gameId), {
        drawOfferBy: null,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error declining draw:', err);
      setError('Failed to decline draw offer');
    }
  };
  
  // Go back to games list
  const handleBack = () => {
    navigate('/games');
  };
  
  // Loading state
  if (loading) {
    return <div className="loading">載入中...</div>;
  }
  
  // Error state
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  // No game found
  if (!game) {
    return <div className="error">找不到遊戲</div>;
  }
  
  // Determine current player status
  const isWhitePlayer = currentUser && game.whitePlayer.uid === currentUser.uid;
  const isBlackPlayer = currentUser && game.blackPlayer.uid === currentUser.uid;
  const isPlayer = isWhitePlayer || isBlackPlayer;
  const isSpectator = !isPlayer;
  
  // Check if there's a draw offer and if it's to the current player
  const hasDrawOffer = game.drawOfferBy && (
    (isWhitePlayer && game.drawOfferBy === 'black') ||
    (isBlackPlayer && game.drawOfferBy === 'white')
  );
  
  // Determine if the current player offered a draw
  const offeredDraw = game.drawOfferBy && (
    (isWhitePlayer && game.drawOfferBy === 'white') ||
    (isBlackPlayer && game.drawOfferBy === 'black')
  );
  
  return (
    <div className="game-page">
      <div className="game-header">
        <button className="back-button" onClick={handleBack}>
          ← 返回
        </button>
        <h2>{game.white} vs {game.black}</h2>
        {game.status === 'completed' && (
          <div className="game-result">
            {game.winner === 'draw' ? (
              <span>和棋 - {game.winReason}</span>
            ) : (
              <span>{game.winner === 'white' ? game.white : game.black} 獲勝 - {game.winReason}</span>
            )}
          </div>
        )}
      </div>
      
      <div className="game-container">
        <div className="game-info">
          <div className="player-info white-player">
            <div className="player-name">
              {game.white}
              {isWhitePlayer && <span className="you-indicator">(你)</span>}
            </div>
            <div className="player-pieces">
              ♙♘♗♖♕♔
            </div>
          </div>
          
          <div className="game-status">
            {game.status === 'active' ? (
              <div className="current-turn">
                {game.currentTurn === 'white' ? game.white : game.black} 的回合
                {((isWhitePlayer && game.currentTurn === 'white') || 
                  (isBlackPlayer && game.currentTurn === 'black')) && 
                  <span className="your-turn"> (你的回合)</span>}
              </div>
            ) : (
              <div className="game-over">遊戲結束</div>
            )}
            
            {game.status === 'active' && isPlayer && (
              <div className="game-actions">
                <button 
                  className="resign-button" 
                  onClick={handleResign}
                  disabled={offeredDraw}
                >
                  投降
                </button>
                
                {hasDrawOffer ? (
                  <div className="draw-offer-actions">
                    <div className="draw-offer-message">
                      對手提出和棋要求
                    </div>
                    <button className="accept-draw-button" onClick={handleDrawOffer}>
                      接受
                    </button>
                    <button className="decline-draw-button" onClick={handleDeclineDraw}>
                      拒絕
                    </button>
                  </div>
                ) : (
                  <button 
                    className="offer-draw-button" 
                    onClick={handleDrawOffer}
                    disabled={offeredDraw}
                  >
                    {offeredDraw ? '已提出和棋' : '提出和棋'}
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="player-info black-player">
            <div className="player-name">
              {game.black}
              {isBlackPlayer && <span className="you-indicator">(你)</span>}
            </div>
            <div className="player-pieces">
              ♟♞♝♜♛♚
            </div>
          </div>
        </div>
        
        <div className="board-with-notation">
          <ChessBoard 
            board={game.board} 
            currentTurn={game.currentTurn}
            onMove={handleMove}
            userId={currentUser?.uid}
            game={game}
            lastMove={game.lastMove}
            moveHistory={moveHistory}
          />
          
          <div className="move-history">
            <h3>着法記錄</h3>
            <div className="notation-list">
              {moveNotation.map((notation, index) => (
                <div key={index} className="notation-item">
                  {index % 2 === 0 && <span className="move-number">{Math.floor(index / 2) + 1}.</span>}
                  <span className="move-notation">{notation}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;