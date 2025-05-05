import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { onSnapshot, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import GameChat from '../components/GameChat';
import SpectatorsList from '../components/SpectatorsList';
import { 
  isValidGuess, 
  formatGuessResult, 
  generateHint, 
  calculateScore 
} from '../utils/1a2b';
import { make1A2BGuess } from '../services/GameService';
import '../styles/Game1A2B.css';

const Game1A2B = () => {
  const { gameId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guess, setGuess] = useState('');
  const [guessError, setGuessError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [hint, setHint] = useState('');
  
  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return;
    
    const unsubscribe = onSnapshot(
      doc(db, 'games', gameId),
      (doc) => {
        if (doc.exists()) {
          const gameData = { id: doc.id, ...doc.data() };
          
          // Check if game is the correct type
          if (gameData.gameType !== '1a2b') {
            setError('這不是一個1A2B遊戲');
            setLoading(false);
            return;
          }
          
          setGame(gameData);
          setLoading(false);
          
          // Generate hint
          if (gameData.guesses && gameData.guesses.length > 0) {
            const newHint = generateHint(gameData.guesses, gameData.secretNumber);
            setHint(newHint);
          } else {
            setHint('猜一個4位數字，每個數字都不相同');
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
  
  // Handle guess submission
  const handleSubmitGuess = async (e) => {
    e.preventDefault();
    
    if (!currentUser || !game) return;
    
    // Validate guess
    if (!isValidGuess(guess)) {
      setGuessError('請輸入4位不同的數字');
      return;
    }
    
    setGuessError('');
    
    try {
      // Make the guess
      const result = await make1A2BGuess(gameId, guess, currentUser.uid);
      
      // Add system message to chat
      await addSystemMessage('guess', {
        player: currentUser.displayName,
        guess,
        result: `${result.a}A${result.b}B`
      });
      
      // Check for win
      if (result.isWin) {
        await addSystemMessage('game-result', {
          result: `${currentUser.displayName} 獲勝`,
          reason: '猜出正確數字'
        });
      } else if (result.isGameOver) {
        // Game over but not win
        await addSystemMessage('game-result', {
          result: '遊戲結束',
          reason: '剩餘猜測次數用完'
        });
      }
      
      // Clear guess input
      setGuess('');
    } catch (err) {
      console.error('Error making guess:', err);
      setGuessError(err.message);
    }
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
  
  // Handle guess input change
  const handleGuessChange = (e) => {
    const input = e.target.value;
    
    // Only allow numeric input
    if (/^\d*$/.test(input) && input.length <= 4) {
      setGuess(input);
      setGuessError('');
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
  const isPlayer1 = currentUser && game.player1.uid === currentUser.uid;
  const isPlayer2 = currentUser && game.player2.uid === currentUser.uid;
  const isPlayer = isPlayer1 || isPlayer2;
  const isCreator = isPlayer1;
  const isGuesser = isPlayer2;
  const isSpectator = currentUser && !isPlayer;
  const isCurrentPlayerTurn = 
    (isPlayer1 && game.currentTurn === 'player1') ||
    (isPlayer2 && game.currentTurn === 'player2');
  
  // Get player names for display
  const player1Name = game.player1.displayName || '玩家1';
  const player2Name = game.player2 ? (game.player2.displayName || '玩家2') : '等待玩家加入...';
  
  return (
    <div className="game-page">
      <div className="game-header">
        <button className="back-button" onClick={handleBack}>
          ← 返回
        </button>
        <h2>1A2B - {player1Name} vs {player2Name}</h2>
        {game.status === 'completed' && (
          <div className="game-result">
            {game.winner === 'draw' ? (
              <span>和局 - {game.winReason}</span>
            ) : (
              <span>
                {game.winner === 'player1' ? player1Name : player2Name} 獲勝 - {game.winReason}
              </span>
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
        <div className="main-content">
          <div className="left-column">
            <SpectatorsList gameId={gameId} game={game} />
            
            <div className="game-board-1a2b">
              <div className="game-status">
                {game.status === 'waiting' ? (
                  <div className="waiting-status">
                    等待對手加入...
                  </div>
                ) : game.status === 'completed' ? (
                  <div className="completed-status">
                    遊戲結束
                    {isCreator && (
                      <div className="secret-number">
                        秘密數字: <span>{game.secretNumber}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="active-status">
                    <div className="current-turn">
                      {game.currentTurn === 'player1' ? player1Name : player2Name} 的回合
                      {isCurrentPlayerTurn && <span className="your-turn"> (你的回合)</span>}
                    </div>
                    <div className="remaining-guesses">
                      剩餘猜測次數: <span>{game.remainingGuesses}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="game-area">
                <div className="guess-history">
                  <h3>猜測歷史</h3>
                  <div className="guesses-list">
                    {game.guesses && game.guesses.length > 0 ? (
                      <table className="guesses-table">
                        <thead>
                          <tr>
                            <th>玩家</th>
                            <th>猜測</th>
                            <th>結果</th>
                          </tr>
                        </thead>
                        <tbody>
                          {game.guesses.map((guessItem, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'even' : 'odd'}>
                              <td>{guessItem.playerName}</td>
                              <td>{guessItem.guess}</td>
                              <td className="result">{guessItem.a}A{guessItem.b}B</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="no-guesses">還沒有猜測記錄</div>
                    )}
                  </div>
                </div>
                
                <div className="game-controls">
                  {game.status === 'active' && (isPlayer2 || (isPlayer1 && game.currentTurn === 'player1')) && (
                    <div className="guess-input-container">
                      <form onSubmit={handleSubmitGuess}>
                        <div className="guess-input-group">
                          <input
                            type="text"
                            value={guess}
                            onChange={handleGuessChange}
                            placeholder="輸入4位不同的數字"
                            disabled={!isCurrentPlayerTurn || game.status !== 'active'}
                            className="guess-input"
                            maxLength={4}
                          />
                          <button 
                            type="submit"
                            disabled={!isCurrentPlayerTurn || guess.length !== 4 || game.status !== 'active'}
                            className="guess-button"
                          >
                            提交
                          </button>
                        </div>
                        {guessError && <div className="guess-error">{guessError}</div>}
                      </form>
                    </div>
                  )}
                  
                  {isCreator && game.status === 'active' && (
                    <div className="creator-message">
                      你已設定好秘密數字，請等待對手猜測
                    </div>
                  )}
                  
                  {hint && (
                    <div className="hint-box">
                      <div className="hint-title">提示:</div>
                      <div className="hint-content">{hint}</div>
                    </div>
                  )}
                  
                  {isCreator && game.status === 'completed' && (
                    <div className="game-completed">
                      <div className="secret-number">
                        秘密數字: <span>{game.secretNumber}</span>
                      </div>
                      <div className="game-summary">
                        {game.winner === 'player2' ? (
                          <>對手猜出了你的數字！</>
                        ) : game.winner === 'draw' ? (
                          <>對手用完了所有猜測機會，沒能猜出你的數字！</>
                        ) : (
                          <>你贏了！</>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {isGuesser && game.status === 'completed' && (
                    <div className="game-completed">
                      <div className="secret-number">
                        秘密數字: <span>{game.secretNumber}</span>
                      </div>
                      <div className="game-summary">
                        {game.winner === 'player2' ? (
                          <>恭喜！你猜出了正確的數字！</>
                        ) : game.winner === 'draw' ? (
                          <>很遺憾，你用完了所有猜測機會，沒能猜出正確數字。</>
                        ) : (
                          <>對手獲勝！</>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="game-rules">
                <h3>遊戲規則</h3>
                <div className="rules-content">
                  <p>
                    <strong>1A2B</strong> 是一個猜數字遊戲。一方設定一個4位不同數字的組合，另一方嘗試猜出這個數字。
                  </p>
                  <ul>
                    <li><strong>A</strong> 表示數字正確且位置也正確</li>
                    <li><strong>B</strong> 表示數字正確但位置錯誤</li>
                  </ul>
                  <p>例如: 秘密數字是 1234，猜 1567 得到 1A0B (第一位正確)</p>
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

export default Game1A2B;