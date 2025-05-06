import React, { useState, useEffect, useRef } from 'react';
import { onSnapshot, collection, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import '../styles/GameChat.css';

/**
 * Game chat component allows players and spectators to chat during a game
 * @param {Object} props - Component props
 * @param {string} props.gameId - The ID of the current game
 * @param {Object} props.game - The game object
 */
const GameChat = ({ gameId, game }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const bottomRef = useRef(null);
  
  const isWhitePlayer = currentUser && game.whitePlayer.uid === currentUser.uid;
  const isBlackPlayer = currentUser && game.blackPlayer.uid === currentUser.uid;
  const isPlayer = isWhitePlayer || isBlackPlayer;
  const isSpectator = currentUser && !isPlayer;
  const playerStatus = isWhitePlayer ? 'white' : isBlackPlayer ? 'black' : 'spectator';
  
  // Fetch messages from Firestore
  useEffect(() => {
    if (!gameId) return;
    
    const messagesQuery = query(
      collection(db, 'games', gameId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messageList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messageList);
        setLoading(false);
      },
      (err) => {
        console.error('Error getting chat messages:', err);
        setError('無法載入聊天訊息');
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [gameId]);
  
  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!currentUser || !newMessage.trim()) return;
    
    try {
      await addDoc(collection(db, 'games', gameId, 'messages'), {
        text: newMessage.trim(),
        uid: currentUser.uid,
        displayName: currentUser.displayName || '匿名用戶',
        photoURL: currentUser.photoURL || null,
        playerStatus,
        timestamp: serverTimestamp()
      });
      
      // Clear the input field
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('無法發送訊息');
    }
  };
  
  // Generate system messages for game events
  const getSystemMessage = (message) => {
    // Check if it's a system message
    if (message.isSystem) {
      if (message.type === 'move') {
        const { player, move } = message;
        return (
          <div className="system-message">
            <span className="player-name">{player}</span> 移動了棋子: <span className="move">{move}</span>
          </div>
        );
      }
      
      if (message.type === 'game-result') {
        const { result, reason } = message;
        return (
          <div className="system-message result-message">
            遊戲結束: <span className="result">{result}</span> - {reason}
          </div>
        );
      }
      
      if (message.type === 'draw-offer') {
        const { player } = message;
        return (
          <div className="system-message">
            <span className="player-name">{player}</span> 提出了和棋
          </div>
        );
      }
      
      return <div className="system-message">{message.text}</div>;
    }
    
    return null;
  };
  
  // Loading state
  if (loading) {
    return <div className="game-chat loading">載入聊天中...</div>;
  }
  
  return (
    <div className="game-chat">
      <div className="chat-header">
        <h3>遊戲聊天</h3>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            還沒有訊息。開始聊天吧！
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const systemMessage = getSystemMessage(message);
              
              if (systemMessage) {
                return <div key={message.id}>{systemMessage}</div>;
              }
              
              const isCurrentUser = message.uid === currentUser?.uid;
              let playerClass = '';
              
              if (message.playerStatus === 'white') {
                playerClass = 'white-player';
              } else if (message.playerStatus === 'black') {
                playerClass = 'black-player';
              } else {
                playerClass = 'spectator';
              }
              
              return (
                <div 
                  key={message.id} 
                  className={`message ${isCurrentUser ? 'own-message' : 'other-message'}`}
                >
                  <div className="message-header">
                    <span className={`username ${playerClass}`}>
                      {message.displayName}
                      {message.playerStatus === 'white' && ' (白方)'}
                      {message.playerStatus === 'black' && ' (黑方)'}
                      {message.playerStatus === 'spectator' && ' (觀眾)'}
                    </span>
                  </div>
                  <div className="message-content">
                    {message.text}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>
      
      <form className="message-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="輸入訊息..."
          className="message-input"
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!newMessage.trim()}
        >
          發送
        </button>
      </form>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default GameChat;