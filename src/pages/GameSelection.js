import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createGame } from '../services/GameService';
import '../styles/GameSelection.css';

/**
 * GameSelection component for selecting game type and creating a new game
 */
const GameSelection = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [selectedGame, setSelectedGame] = useState('chess');
  const [opponentEmail, setOpponentEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Available game types
  const gameTypes = [
    { 
      id: 'chess', 
      name: '西洋棋', 
      description: '經典的國際象棋遊戲，完整實現所有規則包括王車易位、吃過路兵等。',
      icon: '♞'
    },
    { 
      id: '1a2b', 
      name: '1A2B 猜數字', 
      description: '猜測對手選擇的4位數字，A表示數字和位置都對，B表示數字對但位置錯。',
      icon: '🔢'
    }
  ];
  
  const handleSelectGame = (gameId) => {
    setSelectedGame(gameId);
  };
  
  const handleCreateGame = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('請先登入');
      return;
    }
    
    if (!opponentEmail || !opponentEmail.includes('@')) {
      setError('請輸入有效的對手郵箱');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a game with specified type
      const gameId = await createGame(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || '玩家1',
          email: currentUser.email
        },
        {
          email: opponentEmail,
          displayName: '玩家2'
        },
        selectedGame
      );
      
      // Navigate to the created game
      navigate(`/games/${gameId}`);
    } catch (err) {
      console.error('Error creating game:', err);
      setError('創建遊戲失敗');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/games');
  };
  
  return (
    <div className="game-selection-page">
      <h2>選擇遊戲類型</h2>
      
      <div className="game-types-grid">
        {gameTypes.map(game => (
          <div 
            key={game.id}
            className={`game-type-card ${selectedGame === game.id ? 'selected' : ''}`}
            onClick={() => handleSelectGame(game.id)}
          >
            <div className="game-icon">{game.icon}</div>
            <div className="game-info">
              <h3>{game.name}</h3>
              <p>{game.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="create-game-form">
        <h3>邀請對手</h3>
        <form onSubmit={handleCreateGame}>
          <div className="form-group">
            <label htmlFor="opponent-email">對手郵箱</label>
            <input
              id="opponent-email"
              type="email"
              value={opponentEmail}
              onChange={(e) => setOpponentEmail(e.target.value)}
              placeholder="輸入對手的郵箱地址"
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={handleCancel}
            >
              取消
            </button>
            
            <button 
              type="submit" 
              className="create-button"
              disabled={loading}
            >
              {loading ? '創建中...' : '創建遊戲'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameSelection;