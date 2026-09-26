import React from 'react';

export default function Navbar({ activeSection, onNavigate }) {
  const handleNavClick = (sectionId, e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(sectionId);
    }
  };

  return (
    <header className="header-container fixed-nav-header">
      <nav className="nav-pill" aria-label="Main Navigation">
        <a
          href="#work"
          className={`nav-link ${activeSection === 'work' ? 'active' : ''}`}
          onClick={(e) => handleNavClick('work', e)}
          aria-label="Navigate to Work section"
        >
          Work
        </a>

        <a
          href="#about"
          className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
          onClick={(e) => handleNavClick('about', e)}
          aria-label="Navigate to About section"
        >
          About
        </a>

        <a
          href="#contact"
          className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}
          onClick={(e) => handleNavClick('contact', e)}
          aria-label="Navigate to Contact section"
        >
          Contact
        </a>

        <div className="status-badge" title="Status: Accepting select engineering inquiries">
          <span className="status-dot"></span>
          <span>Open for Roles</span>
        </div>
      </nav>
    </header>
  );
}
