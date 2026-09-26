import React, { useState } from 'react';
import { Mail, Github, Linkedin, Twitter, ArrowUpRight, Check, Send } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext.jsx';

export default function ContactSection() {
  const { portfolioData } = usePortfolio();
  const settings = portfolioData?.settings || {};

  const email = settings.email || 'contact@portfolio.dev';
  const github = settings.github || 'https://github.com/developer';
  const linkedin = settings.linkedin || 'https://linkedin.com/in/developer';
  const twitter = settings.twitter;
  const availStatus = settings.availabilityStatus || 'Available for Q4 Projects';
  const availLocation = settings.availabilityLocation || 'Remote Worldwide • Contract or Full-Time';

  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 4500);
  };

  return (
    <section id="contact" className="portfolio-section contact-section">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-block">
          <div className="section-tag">
            <span className="tag-dot" />
            <span>CONTACT / 03</span>
          </div>
          <h2 className="section-heading">Let's Build Something Exceptional</h2>
          <p className="section-subtext">
            Have a project in mind, looking for a senior full-stack engineer, or want to discuss an interactive web experience? Let's connect.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="contact-grid">
          {/* Left Column: Direct Links & Info */}
          <div className="contact-info-card">
            <h3 className="contact-card-title">Direct Inquiries</h3>
            <p className="contact-desc">
              I am currently accepting select contract roles, advisory inquiries, and high-impact engineering leadership opportunities.
            </p>

            <div className="contact-methods-list">
              <a href={`mailto:${email}`} className="contact-method-item">
                <div className="method-icon-box">
                  <Mail size={18} />
                </div>
                <div className="method-text">
                  <span className="method-label">Email</span>
                  <span className="method-val">{email}</span>
                </div>
                <ArrowUpRight size={16} className="method-arrow" />
              </a>

              {github && (
                <a href={github} target="_blank" rel="noreferrer" className="contact-method-item">
                  <div className="method-icon-box">
                    <Github size={18} />
                  </div>
                  <div className="method-text">
                    <span className="method-label">GitHub</span>
                    <span className="method-val">{github.replace('https://', '')}</span>
                  </div>
                  <ArrowUpRight size={16} className="method-arrow" />
                </a>
              )}

              {linkedin && (
                <a href={linkedin} target="_blank" rel="noreferrer" className="contact-method-item">
                  <div className="method-icon-box">
                    <Linkedin size={18} />
                  </div>
                  <div className="method-text">
                    <span className="method-label">LinkedIn</span>
                    <span className="method-val">{linkedin.replace('https://', '')}</span>
                  </div>
                  <ArrowUpRight size={16} className="method-arrow" />
                </a>
              )}

              {twitter && (
                <a href={twitter} target="_blank" rel="noreferrer" className="contact-method-item">
                  <div className="method-icon-box">
                    <Twitter size={18} />
                  </div>
                  <div className="method-text">
                    <span className="method-label">Twitter / X</span>
                    <span className="method-val">{twitter.replace('https://', '')}</span>
                  </div>
                  <ArrowUpRight size={16} className="method-arrow" />
                </a>
              )}
            </div>

            <div className="status-availability-banner">
              <span className="avail-pulse" />
              <div>
                <div className="avail-title">{availStatus}</div>
                <div className="avail-sub">{availLocation}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="contact-form-card">
            <h3 className="contact-card-title">Send a Direct Message</h3>

            {isSubmitted ? (
              <div className="form-success-banner">
                <Check size={22} className="success-icon" />
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>Message Transmitted</h4>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.2rem' }}>
                    Thank you for reaching out. I'll review your note and respond within 24 hours.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="contact-name" className="form-label">Your Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-email" className="form-label">Email Address</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="jane@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-message" className="form-label">Project Details or Message</label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    placeholder="Tell me about your product vision, timeline, and tech stack requirements..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="form-textarea"
                  />
                </div>

                <button type="submit" className="form-submit-btn">
                  <span>Send Message</span>
                  <Send size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
