import React from 'react';
import { ArrowUpRight, Code2, Server, Layout, Sparkles, Database, ExternalLink, Github } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext.jsx';

const defaultProjects = [
  {
    id: 'canvas-engine',
    title: 'Zero-Lag Canvas Interaction Engine',
    category: 'Creative Web & Canvas Engine',
    description: 'A bespoke 60 FPS angular cursor tracking engine with zero ghosting and shortest-path circular interpolation. Pre-extracts 64 synchronized WebP frames for instantaneous 35ms response time.',
    tags: ['React', 'HTML5 Canvas', 'OpenCV', 'WebP', 'Math / Trigonometry'],
    previewType: 'canvas',
    link: '#',
    status: 'Live on this page',
    featured: true
  },
  {
    id: 'cloud-pipeline',
    title: 'Distributed Event Streaming Pipeline',
    category: 'Backend Architecture',
    description: 'High-throughput event streaming infrastructure processing over 10M+ daily telemetry events with sub-10ms edge caching and automated fault-tolerant failovers.',
    tags: ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'Docker', 'AWS'],
    previewType: 'cloud',
    link: '#',
    status: 'Production Architecture',
    featured: true
  },
  {
    id: 'nexus-design',
    title: 'Nexus Enterprise Design System',
    category: 'Design Systems & Frontend',
    description: 'An enterprise-grade component library featuring glassmorphic depth, spring physics animations, WCAG AAA accessibility, and automated token synchronization.',
    tags: ['TypeScript', 'React', 'Tailwind CSS', 'Framer Motion', 'Storybook'],
    previewType: 'ui',
    link: '#',
    status: 'Open Source',
    featured: false
  },
  {
    id: 'omnisearch-ai',
    title: 'OmniSearch Semantic Vector Index',
    category: 'Full Stack & AI Systems',
    description: 'Multi-modal search engine combining dense vector embeddings with inverted indexes to deliver sub-second semantic retrieval across vast documentation repositories.',
    tags: ['Python', 'FastAPI', 'FAISS', 'Embeddings', 'Next.js', 'Tailwind'],
    previewType: 'search',
    link: '#',
    status: 'Case Study',
    featured: false
  }
];

export default function WorkSection() {
  const { portfolioData } = usePortfolio();
  const projects = (portfolioData?.projects && portfolioData.projects.length > 0)
    ? portfolioData.projects
    : defaultProjects;

  return (
    <section id="work" className="portfolio-section work-section">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-block">
          <div className="section-tag">
            <span className="tag-dot" />
            <span>PORTFOLIO / 01</span>
          </div>
          <h2 className="section-heading">Featured Works & Systems</h2>
          <p className="section-subtext">
            A curated selection of production applications, high-performance canvas interfaces, and distributed backends built for scale.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              {/* Visual Preview Area */}
              <div className="project-visual-area">
                <div className="project-visual-inner">
                  {project.previewType === 'canvas' && (
                    <div className="visual-canvas-mockup">
                      <div className="mockup-circle-glow" />
                      <div className="mockup-compass-ring">
                        <span className="ring-dot dot-n">N</span>
                        <span className="ring-dot dot-e">E</span>
                        <span className="ring-dot dot-s">S</span>
                        <span className="ring-dot dot-w">W</span>
                        <div className="ring-needle" />
                      </div>
                      <div className="mockup-pill-badge">60 FPS • 0 Ghosting</div>
                    </div>
                  )}

                  {project.previewType === 'cloud' && (
                    <div className="visual-cloud-mockup">
                      <div className="cloud-node-cluster">
                        <div className="node-box node-primary">
                          <Server size={18} />
                          <span>Gateway</span>
                        </div>
                        <div className="node-connector" />
                        <div className="node-split">
                          <div className="node-box node-sub">
                            <Database size={14} />
                            <span>Postgres</span>
                          </div>
                          <div className="node-box node-sub">
                            <Sparkles size={14} />
                            <span>Redis</span>
                          </div>
                        </div>
                      </div>
                      <div className="mockup-pill-badge">10M+ Events / Day</div>
                    </div>
                  )}

                  {project.previewType === 'ui' && (
                    <div className="visual-ui-mockup">
                      <div className="ui-elements-stack">
                        <div className="ui-glass-btn">Button.Pill</div>
                        <div className="ui-toggle-row">
                          <div className="ui-toggle-pill active" />
                          <div className="ui-toggle-pill" />
                        </div>
                        <div className="ui-metric-bar">
                          <div className="bar-fill" />
                        </div>
                      </div>
                      <div className="mockup-pill-badge">WCAG AAA Accessible</div>
                    </div>
                  )}

                  {project.previewType === 'search' && (
                    <div className="visual-search-mockup">
                      <div className="search-bar-mock">
                        <Code2 size={14} />
                        <span>vector_query("semantic context")</span>
                      </div>
                      <div className="search-results-mock">
                        <div className="res-item" style={{ width: '85%' }} />
                        <div className="res-item" style={{ width: '65%' }} />
                      </div>
                      <div className="mockup-pill-badge">Latency &lt; 10ms</div>
                    </div>
                  )}

                  {(!project.previewType || !['canvas', 'cloud', 'ui', 'search'].includes(project.previewType)) && (
                    <div className="visual-canvas-mockup">
                      <div className="mockup-circle-glow" />
                      <div className="mockup-pill-badge">{project.status || 'Active'}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="project-content-area">
                <div className="project-top-row">
                  <span className="project-category">{project.category}</span>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    {project.featured && (
                      <span className="featured-pill">Featured</span>
                    )}
                    <span className="project-status">{project.status || 'Active'}</span>
                  </div>
                </div>

                <h3 className="project-title">{project.title}</h3>
                <p className="project-desc">{project.description}</p>

                {/* Tech Tags */}
                <div className="project-tags">
                  {(Array.isArray(project.tags) ? project.tags : []).map((tag) => (
                    <span key={tag} className="tech-tag">{tag}</span>
                  ))}
                </div>

                {/* Action Row */}
                <div className="project-action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a
                    href={project.link && project.link !== '#' ? project.link : '#contact'}
                    target={project.link && project.link !== '#' ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="project-action-btn"
                    aria-label={`View ${project.title}`}
                  >
                    <span>View Project</span>
                    <ArrowUpRight size={16} className="action-arrow" />
                  </a>

                  {project.github && project.github !== '#' && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-github-btn"
                      aria-label={`GitHub for ${project.title}`}
                    >
                      <Github size={15} />
                      <span>Code</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
