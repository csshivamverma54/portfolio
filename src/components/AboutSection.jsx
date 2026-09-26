import React from 'react';
import { Zap, Database, Award, CheckCircle2 } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext.jsx';

const defaultAbout = {
  heading: "Full Stack Engineer & Creative Technologist",
  subheading: "Blending deep systems engineering with world-class interactive design to craft unforgettable digital experiences.",
  bioTitle: "Crafting Fast, Resilient Software",
  bioParagraph1: "I am a Full Stack Developer driven by the union of architectural precision and interactive artistry. Whether optimizing real-time canvas trigonometry for zero-lag cursor physics or building distributed data pipelines handling millions of daily events, I treat code as both engineering and craft.",
  bioParagraph2: "My approach focuses on eliminating friction: zero-ghosting animations, millisecond-fast response times, and clean modular codebases designed to withstand production pressures.",
  metrics: [
    { num: "5+", label: "Years of Craft" },
    { num: "10M+", label: "Daily Events" },
    { num: "60", label: "FPS Guarantee" }
  ],
  highlights: [
    {
      title: "60 FPS Ultra-Fluid Web Performance",
      desc: "Obsessed with sub-frame render times, memory optimization, and physics-driven interactive web craft."
    },
    {
      title: "Resilient Cloud & Distributed Architecture",
      desc: "Proven experience designing fault-tolerant backend microservices and streaming millions of events."
    },
    {
      title: "Pixel-Perfect Luxury Interface Design",
      desc: "Harmonizing sleek typography, tactile micro-interactions, and accessible glassmorphism standards."
    }
  ],
  skillCategories: [
    {
      category: "Frontend & Creative",
      skills: ["React", "Next.js", "TypeScript", "HTML5 Canvas API", "WebGL & Three.js", "Tailwind CSS", "CSS Architecture"]
    },
    {
      category: "Backend & Systems",
      skills: ["Node.js", "Python", "Go", "PostgreSQL", "Redis", "GraphQL", "RESTful APIs", "Microservices"]
    },
    {
      category: "DevOps & Tooling",
      skills: ["Docker", "AWS / Cloudflare", "CI/CD Pipelines", "OpenCV / Media Processing", "Vite / Webpack", "Git"]
    }
  ]
};

export default function AboutSection() {
  const { portfolioData } = usePortfolio();
  const about = portfolioData?.about || defaultAbout;

  const icons = [
    <Zap size={20} className="hl-icon" />,
    <Database size={20} className="hl-icon" />,
    <Award size={20} className="hl-icon" />
  ];

  return (
    <section id="about" className="portfolio-section about-section">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-block">
          <div className="section-tag">
            <span className="tag-dot" />
            <span>ABOUT / 02</span>
          </div>
          <h2 className="section-heading">{about.heading || defaultAbout.heading}</h2>
          <p className="section-subtext">
            {about.subheading || defaultAbout.subheading}
          </p>
        </div>

        {/* About Grid */}
        <div className="about-grid">
          {/* Left Column: Story & Philosophy */}
          <div className="about-bio-card">
            <h3 className="about-card-title">{about.bioTitle || defaultAbout.bioTitle}</h3>
            <p className="about-paragraph">
              {about.bioParagraph1 || defaultAbout.bioParagraph1}
            </p>
            <p className="about-paragraph">
              {about.bioParagraph2 || defaultAbout.bioParagraph2}
            </p>

            {/* Quick Metrics */}
            <div className="about-metrics-row">
              {(about.metrics || defaultAbout.metrics).map((m, idx) => (
                <div key={idx} className="metric-pill">
                  <span className="metric-num">{m.num}</span>
                  <span className="metric-label">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Key Highlights */}
          <div className="about-highlights-card">
            <h3 className="about-card-title">Core Engineering Principles</h3>
            <div className="highlights-list">
              {(about.highlights || defaultAbout.highlights).map((hl, i) => (
                <div key={i} className="highlight-item">
                  <div className="highlight-icon-box">
                    {icons[i % icons.length]}
                  </div>
                  <div>
                    <h4 className="highlight-title">{hl.title}</h4>
                    <p className="highlight-desc">{hl.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skills & Technologies Matrix */}
        <div className="skills-matrix">
          <h3 className="skills-heading">Technical Arsenal</h3>
          <div className="skills-grid">
            {(about.skillCategories || defaultAbout.skillCategories).map((cat, idx) => (
              <div key={idx} className="skill-category-card">
                <h4 className="category-title">{cat.category}</h4>
                <div className="skill-chips-wrap">
                  {(cat.skills || []).map((skill) => (
                    <span key={skill} className="skill-chip">
                      <CheckCircle2 size={12} className="chip-check" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
