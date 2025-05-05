import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Games from './pages/Games';
import Game from './pages/Game';
import Game1A2B from './pages/Game1A2B';
import GameSelection from './pages/GameSelection';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Styles
import './App.css';

const App = () => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Do any additional setup after authentication
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Redirect to correct game page based on game type
  const GameTypeRouter = ({ gameId }) => {
    const [redirect, setRedirect] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      const checkGameType = async () => {
        try {
          const gameDoc = await getDoc(doc(db, 'games', gameId));
          
          if (gameDoc.exists()) {
            const gameData = gameDoc.data();
            const gameType = gameData.gameType || 'chess';
            
            if (gameType === '1a2b') {
              setRedirect(`/1a2b/${gameId}`);
            } else {
              setRedirect(`/chess/${gameId}`);
            }
          } else {
            setRedirect('/games');
          }
        } catch (error) {
          console.error('Error getting game:', error);
          setRedirect('/games');
        } finally {
          setLoading(false);
        }
      };
      
      checkGameType();
    }, [gameId]);
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    return <Navigate to={redirect} />;
  };
  
  if (loading) {
    return <div className="app-loading">載入中...</div>;
  }
  
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
          
          <main className="app-content">
            <Routes>
              <Route path="/" element={<PrivateRoute><Games /></PrivateRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/games" element={<PrivateRoute><Games /></PrivateRoute>} />
              <Route path="/games/new" element={<PrivateRoute><GameSelection /></PrivateRoute>} />
              <Route path="/games/:gameId" element={<PrivateRoute><GameTypeRouter /></PrivateRoute>} />
              <Route path="/chess/:gameId" element={<PrivateRoute><Game /></PrivateRoute>} />
              <Route path="/1a2b/:gameId" element={<PrivateRoute><Game1A2B /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;