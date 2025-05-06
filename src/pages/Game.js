import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { onSnapshot, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import ChessBoard from '../components/ChessBoard';
import GameChat from '../components/GameChat';
import SpectatorsList from '../components/SpectatorsList';
import { 
  checkGameOutcome,
  isInCheck,
  positionToIndices,
} from '../utils/chess';
import { 
  makeChessMove,
  resignChessGame,
  offerDraw,
  acceptDraw,
  declineDraw,
  completeGame
} from '../services/GameService';
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
  const [showChat, setShowChat] = useState(false);
  
  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return;
    
    const unsubscribe = onSnapshot(
      doc(db, 'games', gameId),
      (doc) => {
        if (doc.exists()) {
          const gameData = { id: doc.id, ...doc.data() };
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
          setError('找不到遊戲');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error getting game:', err);
        setError('無法載入遊戲');
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
      
      // Generate algebraic notation for the move
      const notation = generateMoveNotation(from, to, piece, moveInfo, newBoard, nextTurn);
      
      // Add system message to the chat
      await addSystemMessage('move', {
        player: piece.color === 'white' ? game.white : game.black,
        move: notation
      });
      
      // Update Firebase with the move
      await makeChessMove(gameId, from, to, piece, newBoard, moveInfo);
      
      // If there's a game outcome, update game status
      if (outcome) {
        // Add game result message to chat
        await addSystemMessage('game-result', {
          result: outcome.winner === 'draw' ? '和棋' : `${outcome.winner === 'white' ? game.white : game.black} 獲勝`,
          reason: outcome.reason
        });
        
        await completeGame(gameId, outcome.winner, outcome.reason);
      }
      
    } catch (err) {
      console.error('Error making move:', err);
      setError('無法更新遊戲');
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
  
  // Add system message to chat
  const addSystemMessage = async (type, data) => {
    try {
      await addDoc(collection(db, 'games', gameId, 'messages'), {
        isSystem: true,
        type,
        ...data,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('Error adding system message:', err);
    }
  };
  
  // Allow players to resign
  const handleResign = async () => {
    if (!game || !currentUser) return;
    
    // Make sure the user is a player in this game
    const isWhitePlayer = game.whitePlayer.uid === currentUser.uid;
    const isBlackPlayer = game.blackPlayer.uid === currentUser.uid;
    
    if (!isWhitePlayer && !isBlackPlayer) return;
    
    try {
      const resigningColor = isWhitePlayer ? 'white' : 'black';
      const resigningPlayer = isWhitePlayer ? game.white : game.black;
      
      // Add system message for resignation
      await addSystemMessage('resignation', {
        player: resigningPlayer
      });
      
      await resignChessGame(gameId, resigningColor);
    } catch (err) {
      console.error('Error resigning game:', err);
      setError('無法投降');
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
        // Add system message for draw agreement
        await addSystemMessage('draw-accepted', {
          player: isWhitePlayer ? game.white : game.black
        });
        
        await acceptDraw(gameId);
      } else {
        // Otherwise, offer a draw
        const offeringColor = isWhitePlayer ? 'white' : 'black';
        
        // Add system message for draw offer
        await addSystemMessage('draw-offer', {
          player: isWhitePlayer ? game.white : game.black
        });
        
        await offerDraw(gameId, offeringColor);
      }
    } catch (err) {
      console.error('Error with draw offer:', err);
      setError('無法處理和棋要求');
    }
  };
  
  // Decline a draw offer
  const handleDeclineDraw = async () => {
    if (!game || !currentUser) return;
    
    try {
      // Add system message for declining draw
      const decliningPlayer = game.whitePlayer.uid === currentUser.uid ? game.white : game.black;
      
      await addSystemMessage('draw-declined', {
        player: decliningPlayer
      });
      
      await declineDraw(gameId);
    } catch (err) {
      console.error('Error declining draw:', err);
      setError('無法拒絕和棋要求');
    }
  };
  
  // Toggle chat visibility on mobile
  const toggleChat = () => {
    setShowChat(!showChat);
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
  const isSpectator = currentUser && !isPlayer;
  
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
        <button 
          className={`toggle-chat-button ${showChat ? 'active' : ''}`} 
          onClick={toggleChat}
        >
          聊天
        </button>
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
        
        <div className="main-content">
          <div className="left-column">
            <SpectatorsList gameId={gameId} game={game} />
          
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
          
          <div className={`right-column ${showChat ? 'show' : ''}`}>
            <GameChat gameId={gameId} game={game} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;