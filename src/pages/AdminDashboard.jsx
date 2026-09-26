import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  User,
  FileText,
  Settings,
  LogOut,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  Check,
  AlertTriangle,
  Upload,
  Sparkles,
  Save,
  X,
  Search,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const { portfolioData, refetchPortfolio } = usePortfolio();

  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);

  // Projects state
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // About form state
  const [aboutForm, setAboutForm] = useState(null);

  // Technical Arsenal state
  const [skillCategories, setSkillCategories] = useState([]);
  const [newSkillInputs, setNewSkillInputs] = useState({});

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(null);

  // Resume upload state
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Sync state with portfolioData
  useEffect(() => {
    if (portfolioData) {
      if (portfolioData.projects) setProjects(portfolioData.projects);
      if (portfolioData.about) {
        setAboutForm(portfolioData.about);
        if (portfolioData.about.skillCategories) {
          setSkillCategories(portfolioData.about.skillCategories);
        }
      }
      if (portfolioData.settings) setSettingsForm(portfolioData.settings);
    }
  }, [portfolioData]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ==========================================
  // PROJECT MANAGEMENT HANDLERS
  // ==========================================
  const handleOpenAddProject = () => {
    setEditingProject({
      id: '',
      title: '',
      category: 'Web Development',
      description: '',
      tags: '',
      previewType: 'canvas',
      link: '',
      github: '',
      status: 'Active',
      featured: false
    });
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj) => {
    setEditingProject({
      ...proj,
      tags: Array.isArray(proj.tags) ? proj.tags.join(', ') : (proj.tags || '')
    });
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!editingProject.title) return;

    try {
      const isNew = !editingProject.id;
      const url = isNew ? '/api/portfolio/projects' : `/api/portfolio/projects/${editingProject.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingProject)
      });

      if (!res.ok) throw new Error('Failed to save project');

      await refetchPortfolio();
      setIsProjectModalOpen(false);
      setEditingProject(null);
      showToast(isNew ? 'Project created successfully!' : 'Project updated successfully!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      const res = await fetch(`/api/portfolio/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete project');

      await refetchPortfolio();
      setProjectToDelete(null);
      showToast('Project deleted.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleMoveProject = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= projects.length) return;

    const reordered = [...projects];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    setProjects(reordered);

    try {
      const res = await fetch('/api/portfolio/projects-reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderedIds: reordered.map(p => p.id) })
      });
      if (!res.ok) throw new Error('Failed to save order');
      await refetchPortfolio();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // ABOUT SECTION HANDLERS
  // ==========================================
  const handleSaveAbout = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/portfolio/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...aboutForm,
          skillCategories
        })
      });

      if (!res.ok) throw new Error('Failed to update About section');
      await refetchPortfolio();
      showToast('About section updated successfully!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // TECHNICAL ARSENAL / SKILLS HANDLERS
  // ==========================================
  const handleAddCategory = () => {
    const newCat = {
      category: `Domain / Category ${skillCategories.length + 1}`,
      skills: []
    };
    setSkillCategories([...skillCategories, newCat]);
  };

  const handleDeleteCategory = (catIndex) => {
    const updated = skillCategories.filter((_, idx) => idx !== catIndex);
    setSkillCategories(updated);
  };

  const handleMoveCategory = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= skillCategories.length) return;
    const reordered = [...skillCategories];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    setSkillCategories(reordered);
  };

  const handleCategoryNameChange = (catIndex, newName) => {
    const updated = [...skillCategories];
    updated[catIndex] = { ...updated[catIndex], category: newName };
    setSkillCategories(updated);
  };

  const handleAddSkillToCategory = (catIndex) => {
    const inputVal = (newSkillInputs[catIndex] || '').trim();
    if (!inputVal) return;

    const newSkillsToAdd = inputVal.split(',').map(s => s.trim()).filter(Boolean);
    if (newSkillsToAdd.length === 0) return;

    const updated = [...skillCategories];
    const existingSkills = updated[catIndex].skills || [];
    const combined = [...existingSkills];
    for (const skill of newSkillsToAdd) {
      if (!combined.includes(skill)) {
        combined.push(skill);
      }
    }
    updated[catIndex] = { ...updated[catIndex], skills: combined };
    setSkillCategories(updated);
    setNewSkillInputs({ ...newSkillInputs, [catIndex]: '' });
  };

  const handleRemoveSkill = (catIndex, skillIndex) => {
    const updated = [...skillCategories];
    updated[catIndex] = {
      ...updated[catIndex],
      skills: updated[catIndex].skills.filter((_, idx) => idx !== skillIndex)
    };
    setSkillCategories(updated);
  };

  const handleSaveSkills = async (e) => {
    if (e) e.preventDefault();
    try {
      let res = await fetch('/api/portfolio/skills', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skillCategories })
      });

      if (!res.ok && res.status === 404) {
        res = await fetch('/api/portfolio/about', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...(aboutForm || {}),
            skillCategories
          })
        });
      }

      if (!res.ok) throw new Error('Failed to update Technical Arsenal');
      await refetchPortfolio();
      showToast('Technical Arsenal updated successfully!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // SETTINGS & CONTACT HANDLERS
  // ==========================================
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/portfolio/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsForm)
      });

      if (!res.ok) throw new Error('Failed to update settings');
      await refetchPortfolio();
      showToast('Settings saved successfully!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // RESUME MANAGEMENT HANDLERS
  // ==========================================
  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!resumeFile) return;

    setUploadingResume(true);
    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      const res = await fetch('/api/portfolio/resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload resume');
      }

      await refetchPortfolio();
      setResumeFile(null);
      showToast('New resume uploaded and activated!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleResetResume = async () => {
    try {
      const res = await fetch('/api/portfolio/resume', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to reset resume');
      await refetchPortfolio();
      showToast('Resume reset to default.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredProjects = projects.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-layout">
      {/* Toast Notification */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {projectToDelete && (
        <div className="cms-modal-backdrop">
          <div className="cms-confirm-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Delete Project?</h3>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong>{projectToDelete.title}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
              <button
                className="cms-btn-secondary"
                onClick={() => setProjectToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="cms-btn-danger"
                onClick={() => handleDeleteProject(projectToDelete.id)}
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {isProjectModalOpen && editingProject && (
        <div className="cms-modal-backdrop">
          <div className="cms-editor-modal">
            <div className="cms-modal-header">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                {editingProject.id ? 'Edit Project' : 'Add New Project'}
              </h2>
              <button className="cms-close-btn" onClick={() => setIsProjectModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="cms-form">
              <div className="cms-form-grid">
                <div className="cms-input-group">
                  <label className="cms-label">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={editingProject.title}
                    onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                    className="cms-input"
                    placeholder="e.g. Real-Time Canvas Engine"
                  />
                </div>

                <div className="cms-input-group">
                  <label className="cms-label">Category</label>
                  <input
                    type="text"
                    value={editingProject.category}
                    onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                    className="cms-input"
                    placeholder="e.g. Creative Web / Backend"
                  />
                </div>

                <div className="cms-input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="cms-label">Short Description</label>
                  <textarea
                    rows={3}
                    value={editingProject.description}
                    onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                    className="cms-textarea"
                    placeholder="Provide a clear, engaging overview of this project..."
                  />
                </div>

                <div className="cms-input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="cms-label">Technologies / Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editingProject.tags}
                    onChange={(e) => setEditingProject({ ...editingProject, tags: e.target.value })}
                    className="cms-input"
                    placeholder="React, TypeScript, Node.js, WebGL"
                  />
                </div>

                <div className="cms-input-group">
                  <label className="cms-label">Visual Preview Mockup Type</label>
                  <select
                    value={editingProject.previewType}
                    onChange={(e) => setEditingProject({ ...editingProject, previewType: e.target.value })}
                    className="cms-select"
                  >
                    <option value="canvas">Canvas / Compass Graphic</option>
                    <option value="cloud">Cloud / Distributed Nodes</option>
                    <option value="ui">UI Design System Stack</option>
                    <option value="search">Semantic Search Box</option>
                  </select>
                </div>

                <div className="cms-input-group">
                  <label className="cms-label">Status Label</label>
                  <input
                    type="text"
                    value={editingProject.status}
                    onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value })}
                    className="cms-input"
                    placeholder="e.g. Production / Case Study"
                  />
                </div>

                <div className="cms-input-group">
                  <label className="cms-label">Live Project URL</label>
                  <input
                    type="url"
                    value={editingProject.link}
                    onChange={(e) => setEditingProject({ ...editingProject, link: e.target.value })}
                    className="cms-input"
                    placeholder="https://myproject.com"
                  />
                </div>

                <div className="cms-input-group">
                  <label className="cms-label">GitHub Repository URL</label>
                  <input
                    type="url"
                    value={editingProject.github}
                    onChange={(e) => setEditingProject({ ...editingProject, github: e.target.value })}
                    className="cms-input"
                    placeholder="https://github.com/..."
                  />
                </div>

                <div className="cms-input-group" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <input
                    type="checkbox"
                    id="featured-checkbox"
                    checked={editingProject.featured}
                    onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="featured-checkbox" className="cms-label" style={{ cursor: 'pointer', marginBottom: 0 }}>
                    Highlight as Featured Project
                  </label>
                </div>
              </div>

              <div className="cms-modal-actions">
                <button type="button" className="cms-btn-secondary" onClick={() => setIsProjectModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="cms-btn-primary">
                  <Save size={16} />
                  <span>Save Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-dot" />
          <span className="brand-name">Portfolio CMS</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <FolderGit2 size={18} />
            <span>Projects ({projects.length})</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            <Cpu size={18} />
            <span>Technical Arsenal</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <User size={18} />
            <span>About Bio</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => setActiveTab('resume')}
          >
            <FileText size={18} />
            <span>Resume</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            <span>Contact &amp; Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-user-info">
            <span className="user-email">{user?.email || 'Admin'}</span>
            <span className="user-role">Superadmin</span>
          </div>
          <button onClick={logout} className="logout-btn" title="Sign Out">
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Top Bar */}
        <header className="admin-topbar">
          <div className="topbar-title">
            <h2>{activeTab === 'skills' ? 'TECHNICAL ARSENAL' : activeTab.toUpperCase()}</h2>
          </div>
          <div className="topbar-actions">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="view-site-btn"
            >
              <span>View Public Portfolio</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </header>

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="tab-pane">
            <div className="stats-cards-grid">
              <div className="stat-card">
                <span className="stat-label">Total Projects</span>
                <span className="stat-val">{projects.length}</span>
                <span className="stat-sub">Active in public portfolio</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Technical Arsenal</span>
                <span className="stat-val">{skillCategories.reduce((acc, cat) => acc + (cat.skills?.length || 0), 0)}</span>
                <span className="stat-sub">{skillCategories.length} categories active</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Resume Status</span>
                <span className="stat-val" style={{ fontSize: '1.2rem', color: '#4ade80' }}>Active (.PDF)</span>
                <span className="stat-sub">{portfolioData?.resume?.filename || 'Default Resume'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Contact Status</span>
                <span className="stat-val" style={{ fontSize: '1.2rem', color: '#60a5fa' }}>Live &amp; Connected</span>
                <span className="stat-sub">{portfolioData?.settings?.email || 'contact@portfolio.dev'}</span>
              </div>
            </div>

            <div className="cms-card" style={{ marginTop: '2rem' }}>
              <h3 className="cms-card-heading">Quick Actions</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button className="cms-btn-primary" onClick={() => { setActiveTab('projects'); handleOpenAddProject(); }}>
                  <Plus size={16} />
                  <span>Add New Project</span>
                </button>
                <button className="cms-btn-secondary" onClick={() => setActiveTab('skills')}>
                  <Cpu size={16} />
                  <span>Edit Technical Arsenal</span>
                </button>
                <button className="cms-btn-secondary" onClick={() => setActiveTab('resume')}>
                  <Upload size={16} />
                  <span>Update Resume</span>
                </button>
                <button className="cms-btn-secondary" onClick={() => setActiveTab('about')}>
                  <User size={16} />
                  <span>Edit Bio &amp; Story</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="tab-pane">
            <div className="pane-header-row">
              <div className="cms-search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Filter projects by title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <button className="cms-btn-primary" onClick={handleOpenAddProject}>
                <Plus size={16} />
                <span>Add Project</span>
              </button>
            </div>

            <div className="projects-table-wrap">
              <table className="cms-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Order</th>
                    <th>Project</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((p, idx) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveProject(idx, -1)}
                            className="order-btn"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            disabled={idx === filteredProjects.length - 1}
                            onClick={() => handleMoveProject(idx, 1)}
                            className="order-btn"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{p.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.description}
                        </div>
                      </td>
                      <td>
                        <span className="cms-category-badge">{p.category}</span>
                      </td>
                      <td>
                        <span className="cms-status-badge">{p.status || 'Active'}</span>
                      </td>
                      <td>
                        {p.featured ? (
                          <span style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 600 }}>★ Featured</span>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Standard</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            className="cms-icon-btn edit"
                            onClick={() => handleOpenEditProject(p)}
                            title="Edit Project"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            className="cms-icon-btn delete"
                            onClick={() => setProjectToDelete(p)}
                            title="Delete Project"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>
                        No projects found matching "{searchQuery}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: TECHNICAL ARSENAL (SKILLS) */}
        {activeTab === 'skills' && (
          <div className="tab-pane">
            <div className="pane-header-row">
              <div>
                <h3 className="cms-card-heading">Technical Arsenal Matrix</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                  Configure skill categories and technology tags displayed in the public portfolio's Technical Arsenal.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="cms-btn-secondary"
                >
                  <Plus size={16} />
                  <span>Add Category</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveSkills}
                  className="cms-btn-primary"
                >
                  <Save size={16} />
                  <span>Save Technical Arsenal</span>
                </button>
              </div>
            </div>

            <div className="skills-admin-list">
              {skillCategories.map((cat, catIdx) => (
                <div key={catIdx} className="skills-category-editor-card">
                  <div className="category-editor-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexGrow: 1 }}>
                      <span className="cat-order-badge">#{catIdx + 1}</span>
                      <input
                        type="text"
                        value={cat.category}
                        onChange={(e) => handleCategoryNameChange(catIdx, e.target.value)}
                        placeholder="Category Name (e.g. Frontend & Creative)"
                        className="category-title-input"
                      />
                    </div>
                    <div className="category-header-actions">
                      <button
                        type="button"
                        disabled={catIdx === 0}
                        onClick={() => handleMoveCategory(catIdx, -1)}
                        className="order-btn"
                        title="Move Category Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={catIdx === skillCategories.length - 1}
                        onClick={() => handleMoveCategory(catIdx, 1)}
                        className="order-btn"
                        title="Move Category Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(catIdx)}
                        className="cms-icon-btn delete"
                        title="Delete Category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Chips list */}
                  <div className="skills-chips-editor">
                    {(cat.skills || []).map((skill, sIdx) => (
                      <span key={sIdx} className="admin-skill-chip">
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(catIdx, sIdx)}
                          className="chip-remove-btn"
                          title={`Remove ${skill}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {(!cat.skills || cat.skills.length === 0) && (
                      <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', padding: '0.3rem 0' }}>
                        No skills added yet in this category. Use the input below to add skills.
                      </span>
                    )}
                  </div>

                  {/* Inline Add Skill */}
                  <div className="add-skill-inline-wrap">
                    <input
                      type="text"
                      placeholder="Type skill or comma-separated list (e.g. React, Next.js, WebGL) and press Enter"
                      value={newSkillInputs[catIdx] || ''}
                      onChange={(e) => setNewSkillInputs({ ...newSkillInputs, [catIdx]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkillToCategory(catIdx);
                        }
                      }}
                      className="cms-input"
                      style={{ fontSize: '0.85rem', padding: '0.65rem 0.9rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSkillToCategory(catIdx)}
                      className="cms-btn-secondary"
                      style={{ padding: '0.65rem 1.1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))}

              {skillCategories.length === 0 && (
                <div className="cms-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.25rem' }}>No skill categories defined yet.</p>
                  <button type="button" onClick={handleAddCategory} className="cms-btn-primary">
                    <Plus size={16} />
                    <span>Create First Category</span>
                  </button>
                </div>
              )}
            </div>

            {skillCategories.length > 0 && (
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={handleSaveSkills}
                  className="cms-btn-primary"
                >
                  <Save size={16} />
                  <span>Save Technical Arsenal</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: ABOUT */}
        {activeTab === 'about' && aboutForm && (
          <div className="tab-pane">
            <form onSubmit={handleSaveAbout} className="cms-card">
              <h3 className="cms-card-heading">About Section Content</h3>

              <div className="cms-form-grid" style={{ marginTop: '1.5rem' }}>
                <div className="cms-input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="cms-label">Main Heading</label>
                  <input
                    type="text"
                    value={aboutForm.heading || ''}
                    onChange={(e) => setAboutForm({ ...aboutForm, heading: e.target.value })}
                    className="cms-input"
                  />
                </div>

                <div className="cms-input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="cms-label">Subheading</label>
                  <input
                    type="text"
                    value={aboutForm.subheading || ''}
                    onChange={(e) => setAboutForm({ ...aboutForm, subheading: e.target.value })}
                    className="cms-input"
                  />
                </div>

                <div className="cms-input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="cms-label">Bio Title</label>
                  <input
                    type="text"
                    value={aboutForm.bioTitle || ''}
                    onChange={(e) => setAboutForm({ ...aboutForm, bioTitle: e.target.value })}
                    className="cms-input"
                  />
                </div>

                <div className="cms-input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="cms-label">Bio Paragraph 1</label>
                  <textarea
                    rows={3}
                    value={aboutForm.bioParagraph1 || ''}
                    onChange={(e) => setAboutForm({ ...aboutForm, bioParagraph1: e.target.value })}
                    className="cms-textarea"
                  />
                </div>

                <div className="cms-input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="cms-label">Bio Paragraph 2</label>
                  <textarea
                    rows={3}
                    value={aboutForm.bioParagraph2 || ''}
                    onChange={(e) => setAboutForm({ ...aboutForm, bioParagraph2: e.target.value })}
                    className="cms-textarea"
                  />
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="cms-btn-primary">
                  <Save size={16} />
                  <span>Save About Content</span>
                </button>
              </div>
            </form>

            {/* Shortcut to Technical Arsenal */}
            <div className="skills-shortcut-banner">
              <div>
                <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.95rem' }}>Technical Arsenal &amp; Domain Skills</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                  Manage skill categories, frameworks, and chips displayed in the Technical Arsenal matrix.
                </div>
              </div>
              <button
                type="button"
                className="cms-btn-secondary"
                onClick={() => setActiveTab('skills')}
              >
                <Cpu size={15} />
                <span>Configure Technical Arsenal ({skillCategories.reduce((acc, cat) => acc + (cat.skills?.length || 0), 0)} skills) →</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: RESUME */}
        {activeTab === 'resume' && (
          <div className="tab-pane">
            <div className="cms-card">
              <h3 className="cms-card-heading">Active Resume Management</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginTop: '0.35rem', marginBottom: '1.5rem' }}>
                Upload a new PDF to dynamically replace the resume linked across the public site.
              </p>

              <div className="active-resume-box">
                <div>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>
                    Current File
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginTop: '0.2rem' }}>
                    {portfolioData?.resume?.filename || 'Shivam_Verma_Resume.pdf'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                    URL: {portfolioData?.resume?.activeResumeUrl || '/resume.pdf'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <a
                    href={portfolioData?.resume?.activeResumeUrl || '/resume.pdf'}
                    target="_blank"
                    rel="noreferrer"
                    className="cms-btn-secondary"
                  >
                    <span>View / Download</span>
                    <ExternalLink size={14} />
                  </a>
                  <button onClick={handleResetResume} className="cms-btn-danger">
                    <span>Reset Default</span>
                  </button>
                </div>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleUploadResume} style={{ marginTop: '2rem' }}>
                <label className="cms-label">Upload Replacement Resume (.PDF)</label>
                <div className="file-upload-dropzone">
                  <Upload size={28} style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }} />
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setResumeFile(e.target.files[0])}
                    className="file-input-element"
                  />
                  <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 500 }}>
                    {resumeFile ? resumeFile.name : 'Click or drag a new resume PDF here'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                    Maximum file size: 15MB (.pdf only)
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!resumeFile || uploadingResume}
                  className="cms-btn-primary"
                  style={{ marginTop: '1.25rem' }}
                >
                  {uploadingResume ? <span className="admin-btn-spinner" /> : <Upload size={16} />}
                  <span>{uploadingResume ? 'Uploading...' : 'Publish New Resume'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 5: CONTACT & SETTINGS */}
        {activeTab === 'settings' && settingsForm && (
          <div className="tab-pane">
            <form onSubmit={handleSaveSettings} className="cms-card">
              <h3 className="cms-card-heading">Contact Information &amp; Social Channels</h3>

              <div className="cms-form-grid" style={{ marginTop: '1.5rem' }}>
                <div className="cms-input-group">
                  <label className="cms-label">Public Contact Email</label>
                  <input
                    type="email"
                    value={settingsForm.email || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="cms-input"
                  />
                </div>

                <div className="cms-input-group">
                  <label className="cms-label">GitHub Profile URL</label>
                  <input
                    type="url"
                    value={settingsForm.github || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, github: e.target.value })}
                    className="cms-input"
                  />
                </div>

                <div className="cms-input-group">
                  <label className="cms-label">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    value={settingsForm.linkedin || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, linkedin: e.target.value })}
                    className="cms-input"
                  />
                </div>

                <div className="cms-input-group">
                  <label className="cms-label">Twitter / X Profile URL</label>
                  <input
                    type="url"
                    value={settingsForm.twitter || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, twitter: e.target.value })}
                    className="cms-input"
                  />
                </div>

                <div className="cms-input-group">
                  <label className="cms-label">Availability Status</label>
                  <input
                    type="text"
                    value={settingsForm.availabilityStatus || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, availabilityStatus: e.target.value })}
                    className="cms-input"
                    placeholder="e.g. Available for Q4 Projects"
                  />
                </div>

                <div className="cms-input-group">
                  <label className="cms-label">Availability Location / Format</label>
                  <input
                    type="text"
                    value={settingsForm.availabilityLocation || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, availabilityLocation: e.target.value })}
                    className="cms-input"
                    placeholder="e.g. Remote Worldwide • Contract or Full-Time"
                  />
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="cms-btn-primary">
                  <Save size={16} />
                  <span>Save Contact Settings</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
