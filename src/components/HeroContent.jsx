import React from 'react';
import { ArrowUpRight, MessageSquareCode } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext.jsx';

export default function HeroContent({ name = "Shivam Verma", onNavigate }) {
  const { portfolioData } = usePortfolio();
  const resumeUrl = portfolioData?.resume?.activeResumeUrl || '/resume.pdf';
  const resumeFilename = portfolioData?.resume?.filename || 'Shivam_Verma_Resume.pdf';

  const handleTalkClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('contact');
    }
  };

  return (
    <section className="hero-content" aria-label="Hero Introduction">
      <div className="greeting-label">
        <span>Hi, I'm</span>
        <div className="greeting-line" />
      </div>

      <h1 className="name-heading">
        {name}
      </h1>

      <p className="bio-paragraph">
        Full Stack Engineer crafting bespoke digital interfaces, high-throughput backend architectures, and fluid interactive web experiences.
      </p>

      <div className="cta-group">
        <a
          href={resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={resumeFilename}
          className="btn-pill-solid"
          aria-label="Download Resume"
        >
          <span>Resume</span>
          <ArrowUpRight className="arrow-icon" size={16} />
        </a>

        <a
          href="#contact"
          onClick={handleTalkClick}
          className="btn-pill-glass"
          aria-label="Scroll to Contact"
        >
          <MessageSquareCode size={16} />
          <span>Let's Talk</span>
        </a>
      </div>
    </section>
  );
}
