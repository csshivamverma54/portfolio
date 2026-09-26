import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-glow" />

      <div className="admin-login-card">
        {/* Brand Header */}
        <div className="admin-login-header">
          <div className="admin-shield-icon">
            <ShieldCheck size={28} />
          </div>
          <h1 className="admin-title">Portfolio CMS</h1>
          <p className="admin-subtitle">Private Content Management System</p>
        </div>

        {error && (
          <div className="admin-error-banner" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-field-group">
            <label className="admin-label" htmlFor="admin-email">Admin Email</label>
            <div className="admin-input-wrap">
              <Mail size={16} className="admin-input-icon" />
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                placeholder="your-admin-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="admin-input"
              />
            </div>
          </div>

          <div className="admin-field-group">
            <label className="admin-label" htmlFor="admin-password">Password</label>
            <div className="admin-input-wrap">
              <Lock size={16} className="admin-input-icon" />
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="admin-submit-btn"
          >
            {loading ? (
              <span className="admin-btn-spinner" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <span className="secure-badge">● 256-Bit Encrypted Session</span>
        </div>
      </div>
    </div>
  );
}
