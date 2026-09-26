import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { PortfolioProvider } from './context/PortfolioContext.jsx';
import PublicPortfolio from './pages/PublicPortfolio.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PortfolioProvider>
          <Routes>
            {/* Public Portfolio (Hero → Transition → Work → About → Contact) */}
            <Route path="/" element={<PublicPortfolio />} />

            {/* Private Admin Login */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Private Admin Dashboard */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all: Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PortfolioProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
