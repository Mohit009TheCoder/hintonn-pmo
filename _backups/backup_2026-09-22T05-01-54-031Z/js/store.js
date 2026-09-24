// ─── Hintonn PM Data Store ───
const Store = {
  _data: null,
  _listeners: [],

  init() {
    const saved = localStorage.getItem('hintonn-pm');
    if (saved) {
      this._data = JSON.parse(saved);
      // Ensure all keys exist
      ['projects','tasks','members','milestones','issues','comments','notifications','activities','settings']
        .forEach(k => { if (!this._data[k]) this._data[k] = []; });
      
      // Ensure tasks have start dates for Timeline Gantt
      if (this._data.tasks) {
        this._data.tasks.forEach(t => {
          if (!t.startDate) {
            t.startDate = t.createdAt ? t.createdAt.split('T')[0] : (t.dueDate || '2026-08-01');
          }
        });
      }

      // Normalize member colors to Blue/Purple theme
      const themeColors = {
        m1: '#2563EB', // Blue
        m2: '#9333EA', // Purple
        m3: '#4F46E5', // Indigo
        m4: '#7C3AED', // Deep Violet
        m5: '#1D4ED8', // Royal Blue
      };
      if (this._data.members) {
        this._data.members.forEach(m => {
          if (themeColors[m.id]) m.color = themeColors[m.id];
        });
      }
    } else {
      this._data = this._seedData();
    }
    // Recalculate all project progress from actual task data
    this._data.projects.forEach(p => this._recalcProgress(p.id));
    this._save();
  },

  _save() { localStorage.setItem('hintonn-pm', JSON.stringify(this._data)); },
  _notify() { this._listeners.forEach(fn => fn()); },
  subscribe(fn) { this._listeners.push(fn); },

  // ─── CRUD helpers ───
  _genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },

  // Projects
  getProjects() { return this._data.projects; },
  getProject(id) { return this._data.projects.find(p => p.id === id); },
  createProject(d) {
    const p = { id: this._genId(), name: d.name, description: d.description||'', type: d.type||'Business',
      status: 'planning', priority: d.priority||'medium', progress: 0,
      startDate: d.startDate||'', endDate: d.endDate||'', memberIds: d.memberIds||[],
      taskIds: [], milestoneIds: [], issueIds: [], tags: d.tags||[],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data.projects.unshift(p);
    this._addActivity('project', `Created project <strong>${p.name}</strong>`);
    this._addNotification('project', `New project created: ${p.name}`);
    this._save(); this._notify(); return p;
  },
  updateProject(id, d) {
    const p = this.getProject(id); if (!p) return null;
    Object.assign(p, d, { updatedAt: new Date().toISOString() });
    this._addActivity('project', `Updated project <strong>${p.name}</strong>`);
    this._save(); this._notify(); return p;
  },
  deleteProject(id) {
    const p = this.getProject(id); if (!p) return;
    this._data.projects = this._data.projects.filter(x => x.id !== id);
    // Remove associated tasks, issues, milestones
    this._data.tasks = this._data.tasks.filter(t => t.projectId !== id);
    this._data.issues = this._data.issues.filter(i => i.projectId !== id);
    this._data.milestones = this._data.milestones.filter(m => m.projectId !== id);
    this._addActivity('project', `Deleted project <strong>${p.name}</strong>`);
    this._save(); this._notify();
  },

  // Tasks
  getTasks(projectId) { return projectId ? this._data.tasks.filter(t => t.projectId === projectId) : this._data.tasks; },
  getTask(id) { return this._data.tasks.find(t => t.id === id); },
  createTask(d) {
    const t = { id: this._genId(), projectId: d.projectId, title: d.title, description: d.description||'',
      status: d.status||'todo', priority: d.priority||'medium', assigneeId: d.assigneeId||'',
      startDate: d.startDate || new Date().toISOString().split('T')[0],
      dueDate: d.dueDate||'', tags: d.tags||[], order: this._data.tasks.filter(x=>x.projectId===d.projectId).length,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data.tasks.push(t);
    const proj = this.getProject(t.projectId);
    if (proj) { proj.taskIds.push(t.id); this._recalcProgress(t.projectId); }
    this._addActivity('task', `Created task <strong>${t.title}</strong>${proj ? ` in ${proj.name}` : ''}`);
    this._save(); this._notify(); return t;
  },
  updateTask(id, d) {
    const t = this.getTask(id); if (!t) return null;
    const oldStatus = t.status;
    Object.assign(t, d, { updatedAt: new Date().toISOString() });
    if (d.status && d.status !== oldStatus) {
      this._addActivity('task', `Moved <strong>${t.title}</strong> to ${d.status.replace('-',' ')}`);
    }
    if (t.projectId) this._recalcProgress(t.projectId);
    this._save(); this._notify(); return t;
  },
  deleteTask(id) {
    const t = this.getTask(id); if (!t) return;
    this._data.tasks = this._data.tasks.filter(x => x.id !== id);
    const proj = this.getProject(t.projectId);
    if (proj) { proj.taskIds = proj.taskIds.filter(x => x !== id); this._recalcProgress(t.projectId); }
    this._addActivity('task', `Deleted task <strong>${t.title}</strong>`);
    this._save(); this._notify();
  },
  getMyTasks(memberId) { return this._data.tasks.filter(t => t.assigneeId === memberId && t.status !== 'done'); },

  // Members
  getMembers() { return this._data.members; },
  getMember(id) { return this._data.members.find(m => m.id === id); },
  getMemberInitials(id) { const m = this.getMember(id); return m ? m.name.split(' ').map(w=>w[0]).join('').slice(0,2) : '??'; },
  getMemberColor(id) { const m = this.getMember(id); return m ? m.color : '#94A3B8'; },

  // Milestones
  getMilestones(projectId) { return projectId ? this._data.milestones.filter(m => m.projectId === projectId) : this._data.milestones; },
  createMilestone(d) {
    const m = { id: this._genId(), projectId: d.projectId, name: d.name, dueDate: d.dueDate||'',
      status: d.status||'pending', taskIds: d.taskIds||[],
      createdAt: new Date().toISOString() };
    this._data.milestones.push(m);
    const proj = this.getProject(m.projectId);
    if (proj) proj.milestoneIds.push(m.id);
    this._addActivity('milestone', `Created milestone <strong>${m.name}</strong>`);
    this._save(); this._notify(); return m;
  },
  updateMilestone(id, d) {
    const m = this._data.milestones.find(x => x.id === id); if (!m) return null;
    Object.assign(m, d);
    this._addActivity('milestone', `Updated milestone <strong>${m.name}</strong>`);
    this._save(); this._notify(); return m;
  },
  deleteMilestone(id) {
    const m = this._data.milestones.find(x => x.id === id); if (!m) return;
    this._data.milestones = this._data.milestones.filter(x => x.id !== id);
    const proj = this.getProject(m.projectId);
    if (proj) proj.milestoneIds = proj.milestoneIds.filter(x => x !== id);
    this._save(); this._notify();
  },

  // Issues
  getIssues(projectId) { return projectId ? this._data.issues.filter(i => i.projectId === projectId) : this._data.issues; },
  createIssue(d) {
    const i = { id: this._genId(), projectId: d.projectId, title: d.title, description: d.description||'',
      status: d.status||'open', priority: d.priority||'medium', assigneeId: d.assigneeId||'',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data.issues.push(i);
    const proj = this.getProject(i.projectId);
    if (proj) proj.issueIds.push(i.id);
    this._addActivity('issue', `Created issue <strong>${i.title}</strong>${proj ? ` in ${proj.name}` : ''}`);
    this._addNotification('issue', `New issue: ${i.title}`);
    this._save(); this._notify(); return i;
  },
  updateIssue(id, d) {
    const i = this._data.issues.find(x => x.id === id); if (!i) return null;
    Object.assign(i, d, { updatedAt: new Date().toISOString() });
    this._save(); this._notify(); return i;
  },
  deleteIssue(id) {
    const i = this._data.issues.find(x => x.id === id); if (!i) return;
    this._data.issues = this._data.issues.filter(x => x.id !== id);
    const proj = this.getProject(i.projectId);
    if (proj) proj.issueIds = proj.issueIds.filter(x => x !== id);
    this._save(); this._notify();
  },

  // Comments
  getComments(taskId) { return this._data.comments.filter(c => c.taskId === taskId).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); },
  addComment(taskId, authorId, text) {
    const c = { id: this._genId(), taskId, authorId, text, createdAt: new Date().toISOString() };
    this._data.comments.push(c);
    const t = this.getTask(taskId);
    this._addActivity('comment', `Commented on <strong>${t ? t.title : 'a task'}</strong>`);
    this._save(); this._notify(); return c;
  },

  // Notifications
  getNotifications() { return this._data.notifications.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); },
  getUnreadCount() { return this._data.notifications.filter(n => !n.read).length; },
  markRead(id) { const n = this._data.notifications.find(x=>x.id===id); if(n) n.read=true; this._save(); this._notify(); },
  markAllRead() { this._data.notifications.forEach(n => n.read = true); this._save(); this._notify(); },
  _addNotification(type, text) {
    this._data.notifications.unshift({ id: this._genId(), type, text, read: false, createdAt: new Date().toISOString() });
    if (this._data.notifications.length > 100) this._data.notifications = this._data.notifications.slice(0, 100);
  },

  // Activities
  getActivities(limit) { return this._data.activities.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit||50); },
  _addActivity(type, html) {
    this._data.activities.unshift({ id: this._genId(), type, html, createdAt: new Date().toISOString() });
    if (this._data.activities.length > 200) this._data.activities = this._data.activities.slice(0, 200);
  },

  // Settings
  getSettings() { return this._data.settings; },
  updateSettings(d) { Object.assign(this._data.settings, d); this._save(); this._notify(); },

  // Stats
  getStats() {
    const projects = this._data.projects;
    const tasks = this._data.tasks;
    const issues = this._data.issues;
    const now = new Date();
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length,
      overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
      openIssues: issues.filter(i => i.status === 'open').length,
      totalMilestones: this._data.milestones.length,
      completedMilestones: this._data.milestones.filter(m => m.status === 'completed').length,
    };
  },

  // Progress calc
  _recalcProgress(projectId) {
    const proj = this.getProject(projectId); if (!proj) return;
    const tasks = this.getTasks(projectId);
    if (tasks.length === 0) { proj.progress = 0; return; }
    proj.progress = Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100);
  },

  // Export/Import
  exportData() { return JSON.stringify(this._data, null, 2); },
  importData(json) {
    try { this._data = JSON.parse(json); this._save(); this._notify(); return true; }
    catch(e) { return false; }
  },
  clearAll() {
    this._data = this._seedData(); this._save(); this._notify();
  },

  // Search
  search(query) {
    const q = query.toLowerCase();
    const results = { projects: [], tasks: [], issues: [], milestones: [] };
    results.projects = this._data.projects.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    results.tasks = this._data.tasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    results.issues = this._data.issues.filter(i => i.title.toLowerCase().includes(q));
    results.milestones = this._data.milestones.filter(m => m.name.toLowerCase().includes(q));
    return results;
  },

  // ─── Seed Data ───
  _seedData() {
    const members = [
      { id: 'm1', name: 'Ayush Sharma', role: 'Project Lead', color: '#2563EB', email: 'ayush@hintonn.com' },
      { id: 'm2', name: 'Priya Patel', role: 'AI Engineer', color: '#9333EA', email: 'priya@hintonn.com' },
      { id: 'm3', name: 'Rahul Verma', role: 'Developer', color: '#4F46E5', email: 'rahul@hintonn.com' },
      { id: 'm4', name: 'Neha Gupta', role: 'Designer', color: '#7C3AED', email: 'neha@hintonn.com' },
      { id: 'm5', name: 'Vikram Singh', role: 'Marketing Lead', color: '#1D4ED8', email: 'vikram@hintonn.com' },
    ];

    const projects = [
      { id: 'p1', name: 'Hintonn AI Platform', description: 'Core AI platform with automation, agent management, and intelligent workflows for enterprise clients.', type: 'AI/ML', status: 'active', priority: 'high', progress: 68, startDate: '2026-07-01', endDate: '2026-12-31', memberIds: ['m1','m2','m3','m4'], taskIds: [], milestoneIds: [], issueIds: [], tags: ['AI','Platform','Enterprise'], createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      { id: 'p2', name: 'Client Onboarding Portal', description: 'Self-service onboarding system for new clients to configure their AI agents and workflows.', type: 'Software', status: 'active', priority: 'medium', progress: 42, startDate: '2026-08-15', endDate: '2026-11-30', memberIds: ['m3','m4'], taskIds: [], milestoneIds: [], issueIds: [], tags: ['Client','Portal','UX'], createdAt: '2026-08-15T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      { id: 'p3', name: 'Marketing Campaign Q4', description: 'Q4 marketing push including content strategy, social media, and paid campaigns for lead generation.', type: 'Marketing', status: 'planning', priority: 'medium', progress: 15, startDate: '2026-09-20', endDate: '2026-12-31', memberIds: ['m5','m4'], taskIds: [], milestoneIds: [], issueIds: [], tags: ['Marketing','Q4','Campaign'], createdAt: '2026-09-10T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      { id: 'p4', name: 'Research: LLM Fine-tuning', description: 'Internal research on fine-tuning large language models for domain-specific task automation.', type: 'Research', status: 'active', priority: 'low', progress: 30, startDate: '2026-08-01', endDate: '2027-02-28', memberIds: ['m2'], taskIds: [], milestoneIds: [], issueIds: [], tags: ['Research','LLM','Fine-tuning'], createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      { id: 'p5', name: 'Website Redesign', description: 'Complete redesign of hintonn.com with new brand guidelines and conversion optimization.', type: 'Business', status: 'completed', priority: 'medium', progress: 100, startDate: '2026-05-01', endDate: '2026-08-30', memberIds: ['m4','m5'], taskIds: [], milestoneIds: [], issueIds: [], tags: ['Website','Design','Brand'], createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-08-30T00:00:00Z' },
    ];

    const tasks = [
      { id: 't1', projectId: 'p1', title: 'Implement agent orchestration engine', description: 'Build the core agent orchestration system for managing multiple AI agents.', status: 'done', priority: 'high', assigneeId: 'm2', startDate: '2026-07-15', dueDate: '2026-09-15', tags: ['Backend','AI'], order: 0, createdAt: '2026-07-10T00:00:00Z', updatedAt: '2026-09-14T00:00:00Z' },
      { id: 't2', projectId: 'p1', title: 'Design conversation UI components', description: 'Create reusable UI components for the AI conversation interface.', status: 'done', priority: 'high', assigneeId: 'm4', startDate: '2026-08-01', dueDate: '2026-09-20', tags: ['Design','UI'], order: 1, createdAt: '2026-07-15T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      { id: 't3', projectId: 'p1', title: 'Build automation workflow builder', description: 'Implement the visual automation builder with drag-and-drop node system.', status: 'in-progress', priority: 'high', assigneeId: 'm3', startDate: '2026-08-15', dueDate: '2026-10-15', tags: ['Frontend','Automation'], order: 2, createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      { id: 't4', projectId: 'p1', title: 'Integrate WhatsApp Business API', description: 'Connect WhatsApp Business API for messaging automation and lead communication.', status: 'in-progress', priority: 'medium', assigneeId: 'm2', startDate: '2026-09-01', dueDate: '2026-10-30', tags: ['Integration','API'], order: 3, createdAt: '2026-08-10T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      { id: 't5', projectId: 'p1', title: 'Build analytics dashboard', description: 'Create analytics dashboard with charts, KPIs, and performance metrics.', status: 'todo', priority: 'medium', assigneeId: 'm3', startDate: '2026-09-20', dueDate: '2026-11-01', tags: ['Frontend','Analytics'], order: 4, createdAt: '2026-08-15T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      { id: 't6', projectId: 'p1', title: 'Implement lead scoring AI model', description: 'Train and deploy ML model for automated lead scoring and qualification.', status: 'review', priority: 'high', assigneeId: 'm2', startDate: '2026-08-25', dueDate: '2026-09-25', tags: ['AI','ML'], order: 5, createdAt: '2026-08-20T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      { id: 't7', projectId: 'p1', title: 'Set up CI/CD pipeline', description: 'Configure automated testing and deployment pipeline for all environments.', status: 'done', priority: 'medium', assigneeId: 'm3', startDate: '2026-07-20', dueDate: '2026-09-10', tags: ['DevOps'], order: 6, createdAt: '2026-07-20T00:00:00Z', updatedAt: '2026-09-10T00:00:00Z' },
      { id: 't8', projectId: 'p2', title: 'Design onboarding flow wireframes', description: 'Create wireframes for the 5-step onboarding wizard.', status: 'done', priority: 'high', assigneeId: 'm4', startDate: '2026-08-20', dueDate: '2026-09-10', tags: ['Design','UX'], order: 0, createdAt: '2026-08-20T00:00:00Z', updatedAt: '2026-09-10T00:00:00Z' },
      { id: 't9', projectId: 'p2', title: 'Build onboarding wizard UI', description: 'Implement the multi-step onboarding form with validation.', status: 'in-progress', priority: 'high', assigneeId: 'm3', startDate: '2026-09-01', dueDate: '2026-10-01', tags: ['Frontend','Forms'], order: 1, createdAt: '2026-08-25T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      { id: 't10', projectId: 'p2', title: 'Create client configuration API', description: 'Build API endpoints for client workspace configuration.', status: 'todo', priority: 'medium', assigneeId: 'm3', startDate: '2026-09-15', dueDate: '2026-10-15', tags: ['Backend','API'], order: 2, createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      { id: 't11', projectId: 'p3', title: 'Create Q4 content calendar', description: 'Plan and schedule all content pieces for Q4 across channels.', status: 'todo', priority: 'high', assigneeId: 'm5', startDate: '2026-09-10', dueDate: '2026-09-25', tags: ['Content','Planning'], order: 0, createdAt: '2026-09-10T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      { id: 't12', projectId: 'p3', title: 'Design campaign landing pages', description: 'Create landing page designs for each Q4 campaign.', status: 'todo', priority: 'medium', assigneeId: 'm4', startDate: '2026-09-15', dueDate: '2026-10-05', tags: ['Design','Landing'], order: 1, createdAt: '2026-09-12T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      { id: 't13', projectId: 'p4', title: 'Literature review: LoRA techniques', description: 'Review latest LoRA and QLoRA papers for domain adaptation.', status: 'done', priority: 'medium', assigneeId: 'm2', startDate: '2026-08-05', dueDate: '2026-09-01', tags: ['Research','LoRA'], order: 0, createdAt: '2026-08-05T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z' },
      { id: 't14', projectId: 'p4', title: 'Set up training infrastructure', description: 'Configure GPU cluster for fine-tuning experiments.', status: 'done', priority: 'high', assigneeId: 'm2', startDate: '2026-08-10', dueDate: '2026-09-10', tags: ['Infrastructure','GPU'], order: 1, createdAt: '2026-08-10T00:00:00Z', updatedAt: '2026-09-10T00:00:00Z' },
      { id: 't15', projectId: 'p4', title: 'First fine-tuning experiment', description: 'Run initial fine-tuning on domain dataset and evaluate results.', status: 'in-progress', priority: 'high', assigneeId: 'm2', startDate: '2026-09-05', dueDate: '2026-10-15', tags: ['Research','Experiment'], order: 2, createdAt: '2026-09-15T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      { id: 't16', projectId: 'p5', title: 'Finalize brand guidelines', description: 'Complete brand style guide and asset library.', status: 'done', priority: 'high', assigneeId: 'm4', startDate: '2026-05-05', dueDate: '2026-06-01', tags: ['Brand'], order: 0, createdAt: '2026-05-05T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
      { id: 't17', projectId: 'p5', title: 'Build new website', description: 'Implement redesigned website with new brand and content.', status: 'done', priority: 'high', assigneeId: 'm3', startDate: '2026-06-15', dueDate: '2026-08-15', tags: ['Website','Frontend'], order: 1, createdAt: '2026-06-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
    ];

    // Link tasks to projects
    tasks.forEach(t => { const p = projects.find(x=>x.id===t.projectId); if(p) p.taskIds.push(t.id); });

    const milestones = [
      { id: 'ms1', projectId: 'p1', name: 'Alpha Release', dueDate: '2026-10-15', status: 'pending', taskIds: ['t3','t4'], createdAt: '2026-07-01T00:00:00Z' },
      { id: 'ms2', projectId: 'p1', name: 'Beta Launch', dueDate: '2026-12-01', status: 'pending', taskIds: ['t5','t6'], createdAt: '2026-07-01T00:00:00Z' },
      { id: 'ms3', projectId: 'p2', name: 'Onboarding MVP', dueDate: '2026-10-01', status: 'pending', taskIds: ['t9','t10'], createdAt: '2026-08-15T00:00:00Z' },
      { id: 'ms4', projectId: 'p5', name: 'Website Launch', dueDate: '2026-08-30', status: 'completed', taskIds: ['t16','t17'], createdAt: '2026-05-01T00:00:00Z' },
    ];
    milestones.forEach(m => { const p = projects.find(x=>x.id===m.projectId); if(p) p.milestoneIds.push(m.id); });

    const issues = [
      { id: 'i1', projectId: 'p1', title: 'Agent memory leak in long conversations', description: 'Agents accumulate context without pruning, causing memory issues after 50+ messages.', status: 'open', priority: 'high', assigneeId: 'm2', createdAt: '2026-09-15T00:00:00Z', updatedAt: '2026-09-15T00:00:00Z' },
      { id: 'i2', projectId: 'p1', title: 'WhatsApp API rate limiting', description: 'Getting 429 errors during peak hours. Need to implement backoff strategy.', status: 'open', priority: 'medium', assigneeId: 'm2', createdAt: '2026-09-16T00:00:00Z', updatedAt: '2026-09-16T00:00:00Z' },
      { id: 'i3', projectId: 'p2', title: 'Form validation bug on step 3', description: 'Email validation regex fails for certain corporate email domains.', status: 'open', priority: 'low', assigneeId: 'm3', createdAt: '2026-09-17T00:00:00Z', updatedAt: '2026-09-17T00:00:00Z' },
      { id: 'i4', projectId: 'p4', title: 'GPU memory overflow on 7B model', description: 'Fine-tuning 7B model exceeds 24GB VRAM. Need quantization strategy.', status: 'open', priority: 'high', assigneeId: 'm2', createdAt: '2026-09-18T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
    ];
    issues.forEach(i => { const p = projects.find(x=>x.id===i.projectId); if(p) p.issueIds.push(i.id); });

    const comments = [
      { id: 'c1', taskId: 't3', authorId: 'm3', text: 'Started implementing the node-based canvas. Using SVG for connections.', createdAt: '2026-09-10T10:00:00Z' },
      { id: 'c2', taskId: 't3', authorId: 'm1', text: 'Looks good! Make sure to add undo/redo support early.', createdAt: '2026-09-10T11:30:00Z' },
      { id: 'c3', taskId: 't3', authorId: 'm3', text: 'Added undo/redo with command pattern. Moving to node configuration panels next.', createdAt: '2026-09-12T09:00:00Z' },
      { id: 'c4', taskId: 't4', authorId: 'm2', text: 'Got basic message sending working. Still need webhook setup for incoming messages.', createdAt: '2026-09-14T14:00:00Z' },
      { id: 'c5', taskId: 't6', authorId: 'm2', text: 'First model iteration shows 87% accuracy on validation set. Need more training data.', createdAt: '2026-09-16T16:00:00Z' },
      { id: 'c6', taskId: 't9', authorId: 'm3', text: 'Wizard steps 1-3 complete with form validation. Working on step 4 (channel setup).', createdAt: '2026-09-15T11:00:00Z' },
    ];

    const activities = [
      { id: 'a1', type: 'task', html: '<strong>Ayush</strong> created project <strong>Hintonn AI Platform</strong>', createdAt: '2026-07-01T00:00:00Z' },
      { id: 'a2', type: 'task', html: '<strong>Priya</strong> completed task <strong>Implement agent orchestration engine</strong>', createdAt: '2026-09-14T10:00:00Z' },
      { id: 'a3', type: 'task', html: '<strong>Neha</strong> completed task <strong>Design conversation UI components</strong>', createdAt: '2026-09-18T09:00:00Z' },
      { id: 'a4', type: 'task', html: '<strong>Rahul</strong> moved <strong>Build automation workflow builder</strong> to in-progress', createdAt: '2026-09-12T11:00:00Z' },
      { id: 'a5', type: 'issue', html: '<strong>Priya</strong> reported issue <strong>Agent memory leak in long conversations</strong>', createdAt: '2026-09-15T14:00:00Z' },
      { id: 'a6', type: 'comment', html: '<strong>Priya</strong> commented on <strong>Implement lead scoring AI model</strong>', createdAt: '2026-09-16T16:00:00Z' },
      { id: 'a7', type: 'task', html: '<strong>Rahul</strong> completed task <strong>Set up CI/CD pipeline</strong>', createdAt: '2026-09-10T17:00:00Z' },
      { id: 'a8', type: 'milestone', html: '<strong>Website Launch</strong> milestone marked as completed', createdAt: '2026-08-30T18:00:00Z' },
      { id: 'a9', type: 'task', html: '<strong>Ayush</strong> assigned <strong>Build analytics dashboard</strong> to Rahul', createdAt: '2026-09-18T10:00:00Z' },
      { id: 'a10', type: 'project', html: 'Project <strong>Marketing Campaign Q4</strong> moved to planning', createdAt: '2026-09-10T09:00:00Z' },
    ];

    const notifications = [
      { id: 'n1', type: 'issue', text: 'New issue: Agent memory leak in long conversations', read: false, createdAt: '2026-09-15T14:00:00Z' },
      { id: 'n2', type: 'task', text: 'Task assigned to you: Build analytics dashboard', read: false, createdAt: '2026-09-18T10:00:00Z' },
      { id: 'n3', type: 'comment', text: 'Priya commented on Implement lead scoring AI model', read: false, createdAt: '2026-09-16T16:00:00Z' },
      { id: 'n4', type: 'task', text: 'Task overdue: Create Q4 content calendar', read: true, createdAt: '2026-09-17T08:00:00Z' },
      { id: 'n5', type: 'milestone', text: 'Milestone approaching: Alpha Release due in 27 days', read: true, createdAt: '2026-09-18T08:00:00Z' },
    ];

    return { projects, tasks, members, milestones, issues, comments, notifications, activities,
      settings: { workspaceName: 'Hintonn AI', currentUser: 'm1' } };
  }
};
