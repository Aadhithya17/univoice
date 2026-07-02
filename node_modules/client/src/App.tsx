import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Auth from './pages/Auth';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

export const App: React.FC = () => {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              {/* Public Feed Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/profile/:username" element={<Profile />} />

              {/* Authentication Routes */}
              <Route path="/auth" element={<Auth />} />

              {/* Protected Student Routes */}
              <Route
                path="/create-post"
                element={
                  <ProtectedRoute>
                    <CreatePost />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin/Moderator Dashboard */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute moderatorOrAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Redirect any bad paths to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;
