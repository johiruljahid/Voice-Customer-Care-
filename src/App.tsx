import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import VoiceAssistant from './pages/VoiceAssistant';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<VoiceAssistant />} />
        {/* Reusing AdminDashboard component as User Dashboard */}
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;