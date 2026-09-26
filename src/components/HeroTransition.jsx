import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function HeroTransition({ onScrollDown }) {
  return (
    <div className="hero-transition-zone">
      {/* 1. Subtle Ambient Gradient Fade */}
      <div className="hero-gradient-fade" />

      {/* 2. Horizontal Hairline Glow Divider */}
      <div className="hero-divider-line">
        <div className="divider-glow-center" />
      </div>

      {/* 3. Centered "SCROLL TO EXPLORE" Indicator */}
      <button
        type="button"
        onClick={onScrollDown}
        className="scroll-explore-btn"
        aria-label="Scroll to featured works"
      >
        <div className="mouse-pill">
          <span className="mouse-wheel-dot" />
        </div>
        <div className="explore-label-row">
          <span className="explore-text">Scroll to Explore</span>
          <ChevronDown size={11} className="explore-chevron" />
        </div>
      </button>
    </div>
  );
}
