import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const [portfolioData, setPortfolioData] = useState({
    projects: [],
    about: null,
    settings: null,
    resume: { activeResumeUrl: '/resume.pdf' }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setPortfolioData(data);
      setError(null);
    } catch (err) {
      console.warn('Could not fetch portfolio API, using offline fallback:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const value = {
    portfolioData,
    setPortfolioData,
    refetchPortfolio: fetchPortfolio,
    loading,
    error
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
