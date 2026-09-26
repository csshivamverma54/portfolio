import React, { useState, useEffect, useCallback } from 'react';
import CharacterCanvas from '../components/CharacterCanvas.jsx';
import Navbar from '../components/Navbar.jsx';
import HeroContent from '../components/HeroContent.jsx';
import CustomCursor from '../components/CustomCursor.jsx';
import ProjectPreviewCard from '../components/ProjectPreviewCard.jsx';
import HeroTransition from '../components/HeroTransition.jsx';
import WorkSection from '../components/WorkSection.jsx';
import AboutSection from '../components/AboutSection.jsx';
import ContactSection from '../components/ContactSection.jsx';
import Footer from '../components/Footer.jsx';

export default function PublicPortfolio() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [name] = useState("Shivam Verma");

  const handleLoaded = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const scrollToSection = useCallback((sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', `#${sectionId}`);
      setActiveSection(sectionId);
    }
  }, []);

  // Handle direct hash navigation e.g. website.com/#work
  useEffect(() => {
    const handleInitialHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['work', 'about', 'contact', 'hero'].includes(hash)) {
        setTimeout(() => {
          scrollToSection(hash);
        }, 300);
      }
    };

    handleInitialHash();
    window.addEventListener('hashchange', handleInitialHash);
    return () => window.removeEventListener('hashchange', handleInitialHash);
  }, [scrollToSection]);

  // Scroll spy to dynamically highlight the active navbar link
  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '-30% 0px -50% 0px',
      threshold: 0.1
    });

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((sec) => observer.observe(sec));

    return () => observer.disconnect();
  }, [isLoaded]);

  return (
    <div className="portfolio-wrapper">
      {/* Floating Frosted Glass Header Nav */}
      <Navbar activeSection={activeSection} onNavigate={scrollToSection} />

      {/* 1. Hero Section with Realtime Zero-Lag Character Canvas */}
      <section id="hero" className="hero-section">
        <CharacterCanvas onLoaded={handleLoaded} />

        <div className="ui-overlay hero-overlay">
          <HeroContent name={name} onNavigate={scrollToSection} />
        </div>

        {/* Floating Mini Project Preview Card */}
        <ProjectPreviewCard onClickWork={() => scrollToSection('work')} />

        {/* Refined Hero to Work Transition & Scroll Indicator */}
        <HeroTransition onScrollDown={() => scrollToSection('work')} />
      </section>

      {/* 2. Real Dedicated Content Section: WORK */}
      <WorkSection />

      {/* 3. Real Dedicated Content Section: ABOUT */}
      <AboutSection />

      {/* 4. Real Dedicated Content Section: CONTACT */}
      <ContactSection />

      {/* 5. Minimalist Luxury Footer */}
      <Footer />

      {/* 6. Luxury Preloader Screen */}
      <div className={`preloader-overlay ${isLoaded ? 'loaded' : ''}`}>
        <div style={{ fontFamily: 'var(--font-script)', fontSize: '2.5rem', color: '#ffffff' }}>
          Portfolio
        </div>
        <div className="preloader-bar-bg">
          <div
            className="preloader-bar-fill"
            style={{ width: isLoaded ? '100%' : '60%' }}
          />
        </div>
        <div className="preloader-text">Loading 60 FPS Experience</div>
      </div>

      {/* 7. Custom Magnetic Glowing Cursor */}
      <CustomCursor />
    </div>
  );
}
