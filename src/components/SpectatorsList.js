import React, { useState, useEffect } from 'react';
import { 
  onSnapshot, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import '../styles/SpectatorsList.css';

/**
 * SpectatorsList component displays all current spectators of a game
 * @param {Object} props - Component props
 * @param {string} props.gameId - The ID of the current game
 * @param {Object} props.game - The game object
 */
const SpectatorsList = ({ gameId, game }) => {
  const [spectators, setSpectators] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  
  // Fetch active spectators from Firestore
  useEffect(() => {
    if (!gameId) return;
    
    const spectatorsQuery = query(
      collection(db, 'games', gameId, 'spectators'),
      where('active', '==', true)
    );
    
    const unsubscribe = onSnapshot(
      spectatorsQuery,
      (snapshot) => {
        const spectatorsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSpectators(spectatorsList);
        setLoading(false);
      },
      (err) => {
        console.error('Error getting spectators:', err);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [gameId]);
  
  // Register current user as spectator if they're not a player
  useEffect(() => {
    if (!gameId || !currentUser || !game) return;
    
    // Check if the user is a player
    const isWhitePlayer = game.whitePlayer.uid === currentUser.uid;
    const isBlackPlayer = game.blackPlayer.uid === currentUser.uid;
    
    // If the user is a player, they don't need to be registered as a spectator
    if (isWhitePlayer || isBlackPlayer) return;
    
    // Register as spectator
    const spectatorRef = doc(db, 'games', gameId, 'spectators', currentUser.uid);
    
    const registerSpectator = async () => {
      try {
        await setDoc(spectatorRef, {
          uid: currentUser.uid,
          displayName: currentUser.displayName || '匿名用戶',
          photoURL: currentUser.photoURL || null,
          active: true,
          joinedAt: serverTimestamp(),
          lastActive: serverTimestamp()
        });
        
        // Set up heartbeat to keep spectator status active
        const heartbeatInterval = setInterval(async () => {
          try {
            await setDoc(spectatorRef, { lastActive: serverTimestamp() }, { merge: true });
          } catch (error) {
            console.error('Error updating spectator heartbeat:', error);
          }
        }, 30000); // Update every 30 seconds
        
        // Clean up function to remove spectator when leaving
        return () => {
          clearInterval(heartbeatInterval);
          
          // Mark as inactive when leaving
          deleteDoc(spectatorRef).catch(err => {
            console.error('Error removing spectator:', err);
          });
        };
      } catch (error) {
        console.error('Error registering as spectator:', error);
      }
    };
    
    const cleanup = registerSpectator();
    return () => {
      if (cleanup) cleanup();
    };
  }, [gameId, currentUser, game]);
  
  // Toggle expanded view
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  if (loading) {
    return <div className="spectators-list loading">載入觀眾列表...</div>;
  }
  
  return (
    <div className="spectators-list">
      <div className="spectators-header" onClick={toggleExpanded}>
        <h3>觀眾 ({spectators.length})</h3>
        <span className={`toggle-icon ${expanded ? 'expanded' : ''}`}>▼</span>
      </div>
      
      {expanded && (
        <div className="spectators-content">
          {spectators.length === 0 ? (
            <div className="no-spectators">目前沒有觀眾</div>
          ) : (
            <ul className="spectators-items">
              {spectators.map(spectator => (
                <li key={spectator.id} className="spectator-item">
                  {spectator.photoURL && (
                    <img 
                      src={spectator.photoURL} 
                      alt={spectator.displayName} 
                      className="spectator-avatar"
                    />
                  )}
                  <span className="spectator-name">
                    {spectator.displayName}
                    {spectator.uid === currentUser?.uid && ' (你)'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SpectatorsList;