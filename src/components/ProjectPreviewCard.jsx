import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function ProjectPreviewCard({ onClickWork }) {
  const cardRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animId;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e) => {
      // Normalized coordinates from center of screen (-1 to 1)
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      // Subtle parallax shift range (-8px to +8px)
      targetX = normX * 8;
      targetY = normY * 8;
    };

    const loop = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      setOffset({ x: currentX, y: currentY });
      animId = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="project-preview-card"
      onClick={onClickWork}
      style={{
        transform: `perspective(900px) rotateY(-4deg) rotateX(3deg) translate3d(${offset.x}px, ${offset.y}px, 0)`
      }}
      role="button"
      tabIndex={0}
      aria-label="View Featured Project: Creative Web Experience"
    >
      {/* 1. Mini Browser Window Header */}
      <div className="mini-browser-header">
        <div className="window-dots">
          <span className="dot dot-close" />
          <span className="dot dot-minimize" />
          <span className="dot dot-expand" />
        </div>
        <div className="mini-url-bar">
          <span>experience.shivam.dev</span>
        </div>
      </div>

      {/* 2. Miniature Polished Web Project Canvas / Mockup */}
      <div className="mini-project-viewport">
        <div className="mini-project-screen">
          <div className="screen-header">
            <span className="screen-logo" />
            <div className="screen-nav-lines">
              <span />
              <span />
            </div>
          </div>
          <div className="screen-content">
            <div className="screen-hero-badge">3D & Canvas</div>
            <div className="screen-hero-title">Hyper Responsive</div>
            <div className="screen-graphic">
              <div className="graphic-glow" />
              <div className="graphic-bar-1" />
              <div className="graphic-bar-2" />
              <div className="graphic-bar-3" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Card Bottom Info Bar */}
      <div className="card-info-bar">
        <div className="card-info-text">
          <span className="card-label">FEATURED PROJECT</span>
          <h3 className="card-title">Creative Web Experience</h3>
        </div>
        <div className="card-arrow-wrap">
          <ArrowUpRight size={15} className="card-arrow-icon" />
        </div>
      </div>
    </div>
  );
}
