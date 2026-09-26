import React from 'react';
import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="portfolio-footer">
      <div className="footer-container">
        <div className="footer-left">
          <div className="footer-logo">Shivam Verma</div>
          <p className="footer-copy">
            © {new Date().getFullYear()} Shivam Verma. Designed &amp; engineered with zero compromises.
          </p>
        </div>

        <div className="footer-right">
          <button onClick={scrollToTop} className="back-to-top-btn" aria-label="Back to top">
            <span>Back to Top</span>
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
}
