// ─── Hintonn PM Data Store (Integrated with Firebase Cloud Firestore) ───
const Store = {
  // Escape user-controlled text before it is embedded in activity /
  // notification HTML (Utils lives in app.js and loads after this file).
  _esc(s) {
    if (s == null) return '';
    if (typeof Utils !== 'undefined' && typeof Utils.escapeHtml === 'function') {
      return Utils.escapeHtml(s);
    }
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  },
  _data: null,
  _listeners: [],
  _db: null,
  _firestoreInitialized: false,

  init() {
    // One-time clear of local storage for fresh application (v6: purge legacy billing/BG/seed data)
    if (!localStorage.getItem('hintonn_cleared_v6')) {
      try {
        localStorage.removeItem('hintonn-pm');
        localStorage.removeItem('hintonn-users-db');
        localStorage.removeItem('hintonn-auth-version');
        localStorage.setItem('hintonn_cleared_v6', 'true');
      } catch (e) { /* storage unavailable or quota — skip one-time purge */ }
    }

    const defaultMembers = [];

    const saved = localStorage.getItem('hintonn-pm');
    if (saved) {
      this._data = JSON.parse(saved);
      // Ensure all keys exist
      ['projects','tasks','members','milestones','issues','comments','notifications','activities','settings','invoices','dlpRecords','retentionRecords','bankGuarantees','companies','teams','admins','super_admins']
        .forEach(k => { if (!this._data[k]) this._data[k] = []; });
      
      // Ensure default members are loaded if array is empty
      if (this._data.members.length === 0) {
        this._data.members = defaultMembers;
      }
      if (!this._data.companies || this._data.companies.length === 0) {
        this._data.companies = [
          { id: 'comp_hintonn', name: 'Hintonn PMO (HQ)', code: 'HIN', adminEmails: ['mohithintonn@gmail.com', 'admin@hintonn.com'], status: 'active', createdAt: new Date().toISOString() },
          { id: 'comp_lnt', name: 'Larsen & Toubro PMO', code: 'LNT', adminEmails: ['lnt.admin@hintonn.com'], status: 'active', createdAt: new Date().toISOString() },
          { id: 'comp_tata', name: 'Tata Projects PMO', code: 'TATA', adminEmails: ['tata.admin@hintonn.com'], status: 'active', createdAt: new Date().toISOString() }
        ];
      }
      if (!this._data.teams || this._data.teams.length === 0) {
        this._data.teams = [
          { id: 'team_ai', companyId: 'comp_hintonn', name: 'AI & Software Engineering', leadId: 'm2', memberIds: ['m2', 'm4', 'm_1790601440429'], description: 'Antigravity AI PMO, ML agents, and full-stack delivery' },
          { id: 'team_civil', companyId: 'comp_hintonn', name: 'Civil & EPC Site Operations', leadId: 'm1', memberIds: ['m1'], description: 'Site works, execution, and subcontractor delivery' },
          { id: 'team_finance', companyId: 'comp_hintonn', name: 'Commercial & Financial Control', leadId: 'm3', memberIds: ['m3'], description: 'Invoicing, bank guarantees, DLP, and cash flow' }
        ];
      }
      if (!this._data.settings) this._data.settings = {};
      this._data.settings.currentUser = 'm2';

      // Ensure tasks have start dates, valid assignees, companyId, and subtasks array
      if (this._data.tasks) {
        this._data.tasks.forEach(t => {
          if (t.assigneeId === 'm5' || t.assigneeId === 'm1') t.assigneeId = 'm3';
          if (!t.startDate) {
            t.startDate = t.createdAt ? t.createdAt.split('T')[0] : (t.dueDate || '2026-08-01');
          }
          if (!Array.isArray(t.subtasks)) {
            t.subtasks = [];
          }
          if (!Array.isArray(t.assigneeIds)) {
            t.assigneeIds = t.assigneeId ? [t.assigneeId] : [];
          }
          if (!t.companyId) {
            t.companyId = 'comp_hintonn';
          }
        });
      }
      if (this._data.projects) {
        this._data.projects.forEach(p => {
          if (!p.companyId) p.companyId = 'comp_hintonn';
        });
      }
    } else {
      this._data = this._seedData();
    }
    // Recalculate all project progress from actual task data
    this._data.projects.forEach(p => this._recalcProgress(p.id));
    this._save();

    // ⚡ Connect and sync with Firebase Cloud Firestore in background
    this._initFirestoreSync();
  },

  _save() {
    try {
      localStorage.setItem('hintonn-pm', JSON.stringify(this._data));
    } catch (e) {
      // Quota exceeded or storage disabled — keep the in-memory session
      // working instead of crashing every mutation. Warn once.
      if (!this._storageWarned) {
        this._storageWarned = true;
        console.warn('[Hintonn] Local storage save failed (quota or disabled):', (e && e.message) || e);
      }
    }
  },

  // Debounced save for Firestore realtime snapshots to prevent repeated
  // full-collection JSON stringify operations during burst events.
  _scheduleSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this._save();
      this._saveTimer = null;
    }, 150);
  },
  _notify() { this._listeners.forEach(fn => fn()); },
  subscribe(fn) { this._listeners.push(fn); },

  // ─── Firebase Cloud Firestore Backend Real-time Sync ───
  _initFirestoreSync() {
    if (this._firestoreInitialized) return;
    if (typeof firebase === 'undefined' || !firebase.firestore) {
      setTimeout(() => this._initFirestoreSync(), 500);
      return;
    }

    try {
      this._db = firebase.firestore();

      const startSync = () => {
        if (this._firestoreInitialized) return;
        this._firestoreInitialized = true;
        this._listenersFailed = false;
        console.log('⚡ [Hintonn Cloud Sync] Connected to Cloud Firestore backend (Project: hintonn-pmo)');
        this._startFirestoreListeners();
      };

      // Start Firestore synchronization immediately
      startSync();

      const auth = (firebase.auth && typeof firebase.auth === 'function') ? firebase.auth() : null;
      if (auth) {
        auth.onAuthStateChanged(user => {
          if (user) {
            console.log('⚡ [Hintonn Cloud Sync] Auth state active:', user.email || user.uid);
            // Rules require an authenticated session: listeners attached
            // BEFORE sign-in fail with permission-denied. Re-attach them
            // now that a session exists — otherwise live sync stays dead
            // for the entire tab session.
            if (this._listenersFailed) {
              this._detachFirestoreListeners();
              this._firestoreInitialized = false;
            }
            startSync();
          }
        });
      }

    } catch (err) {
      console.warn('[Hintonn Cloud Sync] Unable to initialize Firestore listeners:', err);
    }
  },

  _detachFirestoreListeners() {
    (this._unsubFirestore || []).forEach(fn => { try { fn(); } catch (e) {} });
    this._unsubFirestore = [];
  },

  _startFirestoreListeners() {
    if (!this._db) return;
    this._unsubFirestore = [];

    const syncCollections = ['projects', 'tasks', 'milestones', 'issues', 'comments', 'activities', 'members', 'invoices', 'bankGuarantees', 'dlpRecords', 'retentionRecords', 'companies', 'teams', 'admins', 'super_admins', 'notifications'];

    syncCollections.forEach(colName => {
      const unsub = this._db.collection(colName).onSnapshot(snapshot => {
        if (!snapshot) return;

        // If collection is completely empty on remote, update only if local previously had items
        if (snapshot.empty) {
          if (Array.isArray(this._data[colName]) && this._data[colName].length > 0) {
            this._data[colName] = [];
            this._scheduleSave();
            this._notify();
          }
          return;
        }

        // Ingest remote changes from Firestore
        const remoteItems = [];
        snapshot.forEach(doc => {
          const d = doc.data();
          if (d) {
            if (!d.id) d.id = doc.id;
            remoteItems.push(d);
          }
        });

        if (remoteItems.length > 0) {
          if (colName === 'tasks') {
            remoteItems.forEach(t => {
              if (!Array.isArray(t.subtasks)) t.subtasks = [];
              if (!Array.isArray(t.assigneeIds)) t.assigneeIds = t.assigneeId ? [t.assigneeId] : [];
            });
            remoteItems.sort((a, b) => (a.order || 0) - (b.order || 0));
          } else if (colName === 'activities' || colName === 'comments') {
            remoteItems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          }

          this._data[colName] = remoteItems;

          // Normalize array fields that may be missing on remote Firestore docs
          if (colName === 'projects') {
            remoteItems.forEach(p => {
              if (!Array.isArray(p.memberIds)) p.memberIds = [];
              if (!Array.isArray(p.taskIds)) p.taskIds = [];
              if (!Array.isArray(p.milestoneIds)) p.milestoneIds = [];
              if (!Array.isArray(p.issueIds)) p.issueIds = [];
              if (!Array.isArray(p.tags)) p.tags = [];
              if (p.progress == null) p.progress = 0;
            });
          }

          if (colName === 'tasks' || colName === 'projects') {
            this._data.projects.forEach(p => this._recalcProgress(p.id));
          }

          this._scheduleSave();
          this._notify();
        }
      }, err => {
        this._listenersFailed = true;
        console.warn(`[Hintonn Cloud Sync] Realtime listener notice for '${colName}':`, err.message || err);
      });
      if (typeof unsub === 'function') this._unsubFirestore.push(unsub);
    });

    // Settings synchronization
    const unsubSettings = this._db.collection('settings').doc('workspace_settings').onSnapshot(doc => {
      if (doc && doc.exists) {
        const remoteSettings = doc.data();
        if (remoteSettings) {
          this._data.settings = Object.assign({}, this._data.settings, remoteSettings);
          this._save();
          this._notify();
        }
      } else if (this._data.settings) {
        this._db.collection('settings').doc('workspace_settings').set(this._sanitizeForFirestore(this._data.settings)).catch(() => {});
      }
    }, () => { this._listenersFailed = true; });
    if (typeof unsubSettings === 'function') this._unsubFirestore.push(unsubSettings);
  },

  _sanitizeForFirestore(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) {
      return obj
        .filter(item => item !== undefined)
        .map(item => this._sanitizeForFirestore(item));
    }
    const clean = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        clean[key] = (val && typeof val === 'object') ? this._sanitizeForFirestore(val) : val;
      }
    }
    return clean;
  },

  _syncToFirestore(collection, id, data) {
    if (!this._db) return Promise.resolve();
    try {
      const cleanData = this._sanitizeForFirestore(data);
      return this._db.collection(collection).doc(String(id)).set(cleanData, { merge: true })
        .then(() => {
          console.log(`⚡ [Hintonn Cloud Sync] Synced ${collection}/${id}`);
        })
        .catch(err => {
          console.error(`❌ [Hintonn Cloud Sync] Failed to sync ${collection}/${id}:`, err);
        });
    } catch (e) {
      console.error(`❌ [Hintonn Cloud Sync] Error syncing ${collection}/${id}:`, e);
      return Promise.resolve();
    }
  },

  _deleteFromFirestore(collection, id) {
    if (!this._db) return Promise.resolve();
    try {
      return this._db.collection(collection).doc(String(id)).delete()
        .then(() => {
          console.log(`⚡ [Hintonn Cloud Sync] Deleted ${collection}/${id}`);
        })
        .catch(err => {
          console.error(`❌ [Hintonn Cloud Sync] Failed to delete ${collection}/${id}:`, err);
        });
    } catch (e) {
      console.error(`❌ [Hintonn Cloud Sync] Error deleting ${collection}/${id}:`, e);
      return Promise.resolve();
    }
  },

  // ─── CRUD helpers ───
  _genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },

  // ─── Multi-Tenant Isolation & Scoping ───
  _activeCompanyId: 'all',
  getActiveCompanyId() {
    if (typeof Auth !== 'undefined' && Auth.getCurrentUser && Auth.getCurrentUser()) {
      if (Auth.isSuperAdmin && Auth.isSuperAdmin()) {
        return this._activeCompanyId || 'all';
      }
      return (Auth.getCompanyId && Auth.getCompanyId()) || 'comp_hintonn';
    }
    return this._activeCompanyId || 'all';
  },
  setActiveCompanyId(companyId) {
    if (typeof Auth !== 'undefined' && Auth.isSuperAdmin && !Auth.isSuperAdmin()) {
      return false; // Company admins and developers are locked to their own company
    }
    this._activeCompanyId = companyId || 'all';
    this._save();
    this._notify();
    return true;
  },
  isCompanyIsolated() {
    return this.getActiveCompanyId() !== 'all';
  },

  // Projects
  getProjects(companyId) {
    const list = (this._data && this._data.projects) || [];
    const targetComp = companyId || (this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : null);
    if (!targetComp) return list;
    return list.filter(p => p.companyId === targetComp || (!p.companyId && targetComp === 'comp_hintonn'));
  },
  getProject(id) { return ((this._data && this._data.projects) || []).find(p => p.id === id); },
  createProject(d) {
    const activeComp = this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : 'comp_hintonn';
    const compId = d.companyId || activeComp;
    const p = { id: this._genId(), name: d.name, description: d.description||'', type: d.type||'Business',
      companyId: compId, teamId: d.teamId || '',
      status: 'planning', priority: d.priority||'medium', progress: 0,
      startDate: d.startDate||'', endDate: d.endDate||'', memberIds: d.memberIds||[],
      taskIds: [], milestoneIds: [], issueIds: [], tags: d.tags||[],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data.projects.unshift(p);
    this._addActivity('project', `Created project <strong>${this._esc(p.name)}</strong>`);
    this._addNotification('project', `New project created: ${this._esc(p.name)}`);
    this._save(); this._notify();
    this._syncToFirestore('projects', p.id, p);
    return p;
  },
  updateProject(id, d) {
    const p = this.getProject(id); if (!p) return null;
    Object.assign(p, d, { updatedAt: new Date().toISOString() });
    this._addActivity('project', `Updated project <strong>${this._esc(p.name)}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('projects', p.id, p);
    return p;
  },
  deleteProject(id) {
    const p = this.getProject(id); if (!p) return;
    this._data.projects = this._data.projects.filter(x => x.id !== id);
    // Remove associated tasks, issues, milestones
    const delTasks = this._data.tasks.filter(t => t.projectId === id);
    const delIssues = this._data.issues.filter(i => i.projectId === id);
    const delMilestones = this._data.milestones.filter(m => m.projectId === id);
    this._data.tasks = this._data.tasks.filter(t => t.projectId !== id);
    this._data.issues = this._data.issues.filter(i => i.projectId !== id);
    this._data.milestones = this._data.milestones.filter(m => m.projectId !== id);
    this._addActivity('project', `Deleted project <strong>${this._esc(p.name)}</strong>`);
    this._save(); this._notify();
    this._deleteFromFirestore('projects', id);
    delTasks.forEach(t => this._deleteFromFirestore('tasks', t.id));
    delIssues.forEach(i => this._deleteFromFirestore('issues', i.id));
    delMilestones.forEach(m => this._deleteFromFirestore('milestones', m.id));
  },

  // Tasks
  getTasks(projectId, companyId, teamId) {
    let tasks = (this._data && this._data.tasks) || [];
    if (projectId) {
      tasks = tasks.filter(t => t.projectId === projectId && !t.isPersonal);
    }
    const targetComp = companyId || (this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : null);
    if (targetComp) {
      tasks = tasks.filter(t => {
        if (t.companyId) return t.companyId === targetComp;
        const p = this.getProject(t.projectId);
        return (p && p.companyId) ? p.companyId === targetComp : (targetComp === 'comp_hintonn');
      });
    }
    if (teamId) {
      tasks = tasks.filter(t => t.teamId === teamId);
    }
    return tasks;
  },
  getTask(id) { return ((this._data && this._data.tasks) || []).find(t => t.id === id); },
  createTask(d) {
    let assigneeIds = [];
    if (Array.isArray(d.assigneeIds)) {
      assigneeIds = d.assigneeIds.slice();
    } else if (d.assigneeId) {
      assigneeIds = [d.assigneeId];
    }
    // Ayush Desai (Admin) can never be assigned a task
    assigneeIds = assigneeIds.filter(id => id && id !== 'm1' && this.getMember(id)?.role !== 'Admin');
    assigneeIds = [...new Set(assigneeIds)];
    const assigneeId = assigneeIds[0] || '';

    const isPersonal = Boolean(d.isPersonal || d.type === 'personal' || !d.projectId);
    const completed = Boolean(d.completed || d.status === 'done');
    const subtasks = Array.isArray(d.subtasks)
      ? d.subtasks.map((st, idx) => ({
          id: st.id || ('st-' + Date.now().toString(36) + '-' + idx),
          title: typeof st === 'string' ? st : (st.title || ''),
          completed: Boolean(st.completed)
        }))
      : [];

    const authUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const creatorId = d.creatorId || (authUser ? (authUser.id || authUser.memberId || '') : '');
    const createdBy = d.createdBy || (authUser ? (authUser.name || '') : '');
    const userId = d.userId || (authUser ? authUser.id : '') || creatorId;

    const proj = d.projectId ? this.getProject(d.projectId) : null;
    const activeComp = this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : 'comp_hintonn';
    const taskCompanyId = d.companyId || (proj ? (proj.companyId || activeComp) : activeComp);
    const taskTeamId = d.teamId || (proj ? (proj.teamId || '') : '');

    const t = { id: this._genId(), projectId: d.projectId || '', title: d.title, description: d.description||'',
      companyId: taskCompanyId,
      teamId: taskTeamId,
      isPersonal: isPersonal,
      completed: completed,
      status: d.status || (completed ? 'done' : 'todo'), priority: d.priority||'medium',
      assigneeId: assigneeId,
      assigneeIds: assigneeIds,
      userId: userId,
      creatorId: creatorId,
      createdBy: createdBy,
      subtasks: subtasks,
      startDate: d.startDate || new Date().toISOString().split('T')[0],
      dueDate: d.dueDate||'', tags: d.tags||[], order: this._data.tasks.filter(x=>x.projectId===d.projectId).length,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data.tasks.push(t);
    if (t.projectId) {
      const proj = this.getProject(t.projectId);
      if (proj) {
        if (!Array.isArray(proj.taskIds)) proj.taskIds = [];
        proj.taskIds.push(t.id);
        this._recalcProgress(t.projectId);
        this._syncToFirestore('projects', proj.id, proj);
      }
    }
    this._addActivity('task', `Created ${isPersonal ? 'personal ' : ''}task <strong>${this._esc(t.title)}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('tasks', t.id, t);
    return t;
  },
  updateTask(id, d) {
    const t = this.getTask(id); if (!t) return null;
    const oldStatus = t.status;
    const updateData = { ...d };

    // Multi-assignee synchronization
    if (updateData.assigneeIds !== undefined || updateData.assigneeId !== undefined) {
      let rawAssignees = [];
      if (Array.isArray(updateData.assigneeIds)) {
        rawAssignees = updateData.assigneeIds.slice();
      } else if (updateData.assigneeId) {
        rawAssignees = [updateData.assigneeId];
      }
      let cleanedAssignees = rawAssignees.filter(mid => mid && mid !== 'm1' && this.getMember(mid)?.role !== 'Admin');
      cleanedAssignees = [...new Set(cleanedAssignees)];
      updateData.assigneeIds = cleanedAssignees;
      updateData.assigneeId = cleanedAssignees[0] || '';
    }

    if (updateData.completed !== undefined) {
      updateData.completed = Boolean(updateData.completed);
      if (t.isPersonal && !updateData.status) {
        updateData.status = updateData.completed ? 'done' : 'todo';
      }
    }
    if (Array.isArray(updateData.subtasks)) {
      updateData.subtasks = updateData.subtasks.map((st, idx) => ({
        id: st.id || ('st-' + Date.now().toString(36) + '-' + idx),
        title: typeof st === 'string' ? st : (st.title || ''),
        completed: Boolean(st.completed)
      }));
    }
    Object.assign(t, updateData, { updatedAt: new Date().toISOString() });
    if (d.status && d.status !== oldStatus) {
      this._addActivity('task', `Moved <strong>${this._esc(t.title)}</strong> to ${d.status.replace('-',' ')}`);
    }
    if (t.projectId) {
      this._recalcProgress(t.projectId);
      const proj = this.getProject(t.projectId);
      if (proj) this._syncToFirestore('projects', proj.id, proj);
    }
    this._save(); this._notify();
    this._syncToFirestore('tasks', t.id, t);
    return t;
  },
  toggleSubtask(taskId, subtaskId, completed) {
    const t = this.getTask(taskId);
    if (!t) return null;
    if (!Array.isArray(t.subtasks)) t.subtasks = [];
    const st = t.subtasks.find(s => s.id === subtaskId);
    if (st) {
      st.completed = completed !== undefined ? Boolean(completed) : !st.completed;
      t.updatedAt = new Date().toISOString();
      this._save();
      this._notify();
      this._syncToFirestore('tasks', t.id, t);
    }
    return t;
  },
  addSubtask(taskId, title) {
    const t = this.getTask(taskId);
    if (!t) return null;
    if (!Array.isArray(t.subtasks)) t.subtasks = [];
    const newSt = {
      id: 'st-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      title: (title || '').trim(),
      completed: false
    };
    t.subtasks.push(newSt);
    t.updatedAt = new Date().toISOString();
    this._save();
    this._notify();
    this._syncToFirestore('tasks', t.id, t);
    return newSt;
  },
  deleteSubtask(taskId, subtaskId) {
    const t = this.getTask(taskId);
    if (!t) return null;
    if (!Array.isArray(t.subtasks)) t.subtasks = [];
    t.subtasks = t.subtasks.filter(s => s.id !== subtaskId);
    t.updatedAt = new Date().toISOString();
    this._save();
    this._notify();
    this._syncToFirestore('tasks', t.id, t);
    return t;
  },
  deleteTask(id) {
    const t = this.getTask(id); if (!t) return;
    this._data.tasks = this._data.tasks.filter(x => x.id !== id);
    const proj = this.getProject(t.projectId);
    if (proj) {
      proj.taskIds = proj.taskIds.filter(x => x !== id);
      this._recalcProgress(t.projectId);
      this._syncToFirestore('projects', proj.id, proj);
    }
    this._addActivity('task', `Deleted task <strong>${this._esc(t.title)}</strong>`);
    this._save(); this._notify();
    this._deleteFromFirestore('tasks', id);
  },
  getMyTasks(memberId) {
    const m = this.getMember(memberId);
    if (m && m.role === 'Admin') return [];
    return this._data.tasks.filter(t => t.assigneeId === memberId && t.status !== 'done');
  },

  // Members
  getMembers(companyId) {
    const list = (this._data && this._data.members) || [];
    const targetComp = companyId || (this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : null);
    if (!targetComp) return list;
    return list.filter(m => m.companyId === targetComp || (!m.companyId && targetComp === 'comp_hintonn'));
  },
  getAssignees(companyId) { return this.getMembers(companyId).filter(m => m.role !== 'Admin' && m.id !== 'm1'); },
  getMember(id) {
    if (!id) return null;
    return ((this._data && this._data.members) || []).find(m =>
      m.id === id ||
      (m.id === 'm1' && (id === 'ayush' || id === 'AD')) ||
      (m.id === 'm2' && id === 'preet') ||
      (m.id === 'm3' && id === 'mohit') ||
      (m.id === 'm4' && id === 'hirvi')
    );
  },
  getMemberInitials(id) { const m = this.getMember(id); return m ? (m.initials || m.name.split(' ').map(w=>w[0]).join('').slice(0,2)) : '??'; },
  getMemberColor(id) { const m = this.getMember(id); return m ? m.color : '#94A3B8'; },

  // Member CRUD
  createMember(d) {
    const activeComp = this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : 'comp_hintonn';
    const m = { id: d.id || this._genId(), name: d.name, role: d.role || 'AI Developer',
      designation: d.designation || d.role || 'AI Developer', email: d.email || '',
      companyId: d.companyId || activeComp,
      teamId: d.teamId || '',
      initials: d.initials || '', color: d.color || '#2563EB' };
    this._data.members.push(m);
    this._addActivity('member', `Added team member <strong>${this._esc(m.name)}</strong> as ${m.designation}`);
    this._addNotification('member', `New team member: ${this._esc(m.name)}`);
    this._save(); this._notify();
    this._syncToFirestore('members', m.id, m);
    return m;
  },
  updateMember(id, d) {
    const m = this.getMember(id); if (!m) return null;
    Object.assign(m, d, { updatedAt: new Date().toISOString() });
    this._addActivity('member', `Updated member <strong>${this._esc(m.name)}</strong> — ${Object.keys(d).join(', ')}`);
    this._save(); this._notify();
    this._syncToFirestore('members', m.id, m);
    return m;
  },
  deleteMember(id) {
    const m = this.getMember(id); if (!m) return;
    // Unassign all tasks from this member
    this._data.tasks.forEach(t => {
      if (t.assigneeId === id) {
        t.assigneeId = '';
        this._syncToFirestore('tasks', t.id, t);
      }
    });
    this._data.members = this._data.members.filter(x => x.id !== id);
    this._addActivity('member', `Removed team member <strong>${this._esc(m.name)}</strong>`);
    this._save(); this._notify();
    this._deleteFromFirestore('members', id);
    return m;
  },

  // ─── Companies (client directory — created via Billing, never seeded) ───
  getCompanies() { return (this._data && this._data.companies) || []; },
  getCompany(id) { return (this._data.companies || []).find(c => c.id === id); },
  createCompany(d) {
    const c = { id: d.id || this._genId(), name: d.name, contactPerson: d.contactPerson || '',
      totalContractValue: d.totalContractValue || '', activePackage: d.activePackage || '',
      totalBilledFormatted: d.totalBilledFormatted || '', totalPendingFormatted: d.totalPendingFormatted || '',
      paymentStatus: d.paymentStatus || '', paymentStatusBadge: d.paymentStatusBadge || '',
      billsCountText: d.billsCountText || '', hasRevisions: d.hasRevisions || false,
      addressLine1: d.addressLine1 || '', addressLine2: d.addressLine2 || '',
      stateCountry: d.stateCountry || '', gstin: d.gstin || '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data.companies.push(c);
    this._addActivity('company', `Added company <strong>${this._esc(c.name)}</strong>`);
    this._addNotification('company', `New company added: ${this._esc(c.name)}`);
    this._save(); this._notify();
    this._syncToFirestore('companies', c.id, c);
    return c;
  },
  updateCompany(id, d) {
    const c = this.getCompany(id); if (!c) return null;
    Object.assign(c, d, { updatedAt: new Date().toISOString() });
    this._addActivity('company', `Updated company <strong>${this._esc(c.name)}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('companies', c.id, c);
    return c;
  },
  deleteCompany(id) {
    const c = this.getCompany(id); if (!c) return;
    this._data.companies = this._data.companies.filter(x => x.id !== id);
    this._addActivity('company', `Deleted company <strong>${this._esc(c.name)}</strong>`);
    this._save(); this._notify();
    this._deleteFromFirestore('companies', id);
    return c;
  },

  // ─── Invoices (Billing) ───
  // No seed data: invoices only exist when created through the Billing
  // screen or generated from real projects via the engine below.
  getInvoices(companyId) {
    const list = (this._data && this._data.invoices) || [];
    const targetComp = companyId || (this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : null);
    if (!targetComp) return list;
    return list.filter(i => i.companyId === targetComp || (!i.companyId && targetComp === 'comp_hintonn'));
  },
  getInvoice(id) { return (this._data.invoices || []).find(i => i.id === id); },
  createInvoice(d) {
    // Project-based fill: derive display fields from the linked project
    if (d.projectId && !d.projectName) {
      const proj = this.getProject(d.projectId);
      if (proj) d.projectName = proj.name;
    }
    const proj = d.projectId ? this.getProject(d.projectId) : null;
    const activeComp = this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : 'comp_hintonn';
    const invCompanyId = d.companyId || (proj ? (proj.companyId || activeComp) : activeComp);

    const inv = {
      id: d.id || d.billNumber || this._genId(),
      companyId: invCompanyId,
      version: 'v1.0', isRevised: false,
      items: [], versionHistory: [],
      ...d,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    if (!inv.billNumber) inv.billNumber = inv.id;
    if (!Array.isArray(inv.items)) inv.items = [];
    if (!Array.isArray(inv.versionHistory) || inv.versionHistory.length === 0) {
      inv.versionHistory = [{
        version: inv.version || 'v1.0',
        label: 'Initial Invoice Issuance',
        date: inv.issueDate || new Date().toISOString().split('T')[0],
        baseAmount: inv.amountDue || '₹0',
        tax: inv.taxAmount || '₹0',
        deductions: inv.deductions || '₹0',
        netPayable: inv.netPayable || '₹0',
        editor: 'Commercial Operations',
        changeReason: 'Original invoice generated.',
        modifiedFields: ['Invoice Generated'],
        isCurrent: true
      }];
    }
    this._data.invoices.push(inv);
    this._addActivity('invoice', `Created invoice <strong>${inv.billNumber || inv.id}</strong> for ${inv.projectName || inv.companyName || ''}`);
    // Notify admins only (billing is admin-only)
    const adminIds = (this._data.members || []).filter(m => m.role === 'Admin').map(m => m.id);
    this.addNotification({
      type: 'invoice',
      text: `New invoice created: ${inv.billNumber || inv.id} for ${inv.projectName || inv.companyName || 'client'}`,
      targetMemberIds: adminIds.length ? adminIds : null,
      invoiceId: inv.id
    });
    this._save(); this._notify();
    this._syncToFirestore('invoices', inv.id, inv);
    return inv;
  },
  updateInvoice(id, d) {
    const inv = this.getInvoice(id); if (!inv) return null;
    Object.assign(inv, d, { updatedAt: new Date().toISOString() });
    this._addActivity('invoice', `Updated invoice <strong>${this._esc(inv.id)}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('invoices', inv.id, inv);
    return inv;
  },
  deleteInvoice(id) {
    const inv = this.getInvoice(id); if (!inv) return;
    this._data.invoices = this._data.invoices.filter(x => x.id !== id);
    this._addActivity('invoice', `Deleted invoice <strong>${this._esc(inv.id)}</strong>`);
    this._save(); this._notify();
    this._deleteFromFirestore('invoices', id);
  },

  // ─── Invoice Generation Engine (project-based — no seed data) ───
  // Parse "₹1,25,00,000" / "$1,234" / 123456 → number
  _parseAmt(v) {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    const str = String(v).replace(/[^0-9.-]/g, '');
    const n = parseFloat(str);
    return isFinite(n) ? n : 0;
  },
  // Number → "₹1,25,00,000" (Indian digit grouping)
  _fmtINR(n) {
    n = Math.round(Number(n) || 0);
    if (n === 0) return '₹0';
    const neg = n < 0;
    const s = Math.abs(n).toString();
    let result = '';
    if (s.length <= 3) result = s;
    else {
      result = s.slice(-3);
      let rem = s.slice(0, -3);
      while (rem.length > 2) { result = rem.slice(-2) + ',' + result; rem = rem.slice(0, -2); }
      if (rem.length) result = rem + ',' + result;
    }
    return (neg ? '–₹' : '₹') + result;
  },
  // 'MMRDA (Mumbai...)' / 'Acme AI Pvt Ltd' → 'MMRDA' / 'ACME'
  _clientCode(name) {
    const words = String(name || '').replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'CLIENT';
    // Prefer the brand's first word (MMRDA → MMRDA, Acme AI → ACME); cap at 6 chars
    const first = words[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (first.length >= 2) return first.slice(0, 6);
    // Very short first word → initials of first two words
    return (words.slice(0, 2).map(w => w[0]).join('') + (words[1] || '')).toUpperCase().slice(0, 6) || 'CLIENT';
  },
  // Indian financial year label for a date, e.g. 2026-09-30 → '2026-27'
  _fiscalYear(date) {
    const d = date ? new Date(date) : new Date();
    const y = d.getFullYear();
    const startYear = d.getMonth() >= 3 ? y : y - 1; // FY starts in April
    return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
  },
  // Sequential per-client bill number: HIN-PI-<CODE>-<YYYY>-<seq>
  generateBillNumber(companyName, date) {
    const d = date ? new Date(date) : new Date();
    const code = this._clientCode(companyName);
    const year = d.getFullYear();
    const prefix = `HIN-PI-${code}-${year}-`;
    const seq = (this.getInvoices().filter(i => String(i.id || '').startsWith(prefix) || String(i.billNumber || '').startsWith(prefix)).length) + 1;
    return prefix + String(seq).padStart(3, '0');
  },
  // Sequential per-client quotation ref: HIN-CL-<CODE>-<YYYY>-<seq>
  generateQuotationRef(companyName, date) {
    const d = date ? new Date(date) : new Date();
    const code = this._clientCode(companyName);
    const year = d.getFullYear();
    const prefix = `HIN-CL-${code}-${year}-`;
    const seq = (this.getInvoices().filter(i => String(i.quotationRef || '').startsWith(prefix)).length) + 1;
    return prefix + String(seq).padStart(3, '0');
  },
  // Shared commercial math: discount → taxable → GST → TDS → net payable
  _computeInvoiceTotals(items, opts = {}) {
    const gstRate = opts.gstRate != null ? opts.gstRate : 18;
    const tdsRate = opts.tdsRate != null ? opts.tdsRate : 10;
    let totalGross = 0, totalDiscount = 0, totalTaxable = 0, totalGst = 0, totalPayable = 0;
    const parsedItems = (items || []).map(it => {
      const g = this._parseAmt(it.gross);
      const dPct = it.discountPct != null ? Number(it.discountPct) : 0;
      const dAmt = Math.round(g * (dPct / 100));
      const tax = g - dAmt;
      const gst = Math.round(tax * (gstRate / 100));
      const amt = tax + gst;
      totalGross += g; totalDiscount += dAmt; totalTaxable += tax; totalGst += gst; totalPayable += amt;
      return {
        name: it.name || 'Professional Services',
        desc: it.desc || 'As per agreed scope of work',
        gross: g, discountPct: dPct, discountAmount: dAmt,
        taxable: tax, gstRate: gstRate, gstAmount: gst, amount: amt
      };
    });
    const tdsAmount = Math.round(totalTaxable * (tdsRate / 100));
    const netPayable = totalPayable - tdsAmount;
    return { parsedItems, totalGross, totalDiscount, totalTaxable, totalGst, totalPayable, tdsAmount, netPayable, gstRate, tdsRate };
  },
  // Find-or-create client company from billing form details
  ensureCompany(client) {
    const name = (client && client.legalName ? client.legalName : '').trim();
    if (!name) return '';
    const existing = this.getCompanies().find(c =>
      c.id === (client.companyId || '') || (c.name || '').toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;
    return this.createCompany({
      name: name,
      contactPerson: client.contactPerson || (name.split(' ')[0] + ' Accounts Team'),
      addressLine1: client.addressLine1 || '',
      addressLine2: client.addressLine2 || '',
      stateCountry: client.stateCountry || '',
      gstin: client.gstin || '',
      paymentStatus: 'Pending',
      paymentStatusBadge: 'badge-high'
    }).id;
  },
  /**
   * Proper invoice generation — based on an EXISTING project (never seed data).
   * @param {string|null} projectId - real project id from Store.getProjects(); null → general invoice
   * @param {object} opts - { companyName, clientDetails:{legalName,addressLine1,addressLine2,stateCountry,gstin},
   *   milestoneId, items:[{name,desc,gross,discountPct}], modulesTag, invoiceDate, validDays,
   *   gstRate, tdsRate, includeRecurring, recurringItem:{module,desc,basis,freq,amount}, notes }
   * @returns {object|null} the persisted invoice, or null when validation fails
   */
  generateInvoice(projectId, opts = {}) {
    const proj = projectId ? this.getProject(projectId) : null;
    if (projectId && !proj) { console.warn('[InvoiceEngine] Project not found:', projectId); return null; }

    const items = (opts.items && opts.items.length)
      ? opts.items
      : [{ name: (proj ? proj.name : 'Professional Services'), desc: 'As per agreed scope of work', gross: 0, discountPct: 0 }];
    const t = this._computeInvoiceTotals(items, opts);
    if (t.totalGross <= 0) return null;

    const issueDate = opts.invoiceDate || new Date().toISOString().split('T')[0];
    const validDays = opts.validDays != null ? opts.validDays : 15;
    const dueDate = new Date(new Date(issueDate).getTime() + validDays * 86400000).toISOString().split('T')[0];
    const client = opts.clientDetails || {};
    const companyName = (client.legalName || opts.companyName || '').trim();
    const companyId = this.ensureCompany({ ...client, legalName: companyName, companyId: opts.companyId });

    // Milestone — from the real project milestone list when given
    let milestoneName = opts.milestone || '';
    if (!milestoneName && opts.milestoneId) {
      const ms = (this._data.milestones || []).find(m => m.id === opts.milestoneId);
      if (ms) milestoneName = ms.name;
    }
    const modulesTag = opts.modulesTag || '[R1 • R2 • R3]';
    const milestoneText = milestoneName
      ? `${milestoneName} ${modulesTag}`
      : `Deployment of Modules ${modulesTag}`;

    const billNumber = opts.billNumber || this.generateBillNumber(companyName, issueDate);
    const quotationRef = opts.quotationRef || this.generateQuotationRef(companyName, issueDate);
    const code = this._clientCode(companyName);

    const m1 = Math.round(t.totalPayable * 0.4);
    const m2 = Math.round(t.totalPayable * 0.4);
    const m3 = t.totalPayable - (m1 + m2);

    const invoiceObj = {
      id: billNumber,
      billNumber: billNumber,
      companyId: companyId,
      companyName: companyName,
      projectId: proj ? proj.id : '',
      projectName: proj ? proj.name : (companyName || 'General Engagement'),
      packageCode: proj ? (proj.tags && proj.tags[0] ? String(proj.tags[0]).toUpperCase() : `PKG-${code.toUpperCase()}`) : quotationRef,
      quotationRef: quotationRef,
      milestone: milestoneText,
      milestoneId: opts.milestoneId || '',
      modulesTag: modulesTag,
      issueDate: issueDate,
      dueDate: dueDate,
      currency: 'INR (₹)',
      amountDue: this._fmtINR(t.totalGross),
      taxAmount: this._fmtINR(t.totalGst),
      deductions: this._fmtINR(t.totalDiscount),
      totalPayable: this._fmtINR(t.totalPayable),
      netPayable: this._fmtINR(t.netPayable),
      taxableValue: this._fmtINR(t.totalTaxable),
      tdsAmount: this._fmtINR(t.tdsAmount),
      totals: {
        gross: t.totalGross, discount: t.totalDiscount, taxable: t.totalTaxable,
        gst: t.totalGst, gstRate: t.gstRate, tds: t.tdsAmount, tdsRate: t.tdsRate,
        payable: t.totalPayable, netPayable: t.netPayable
      },
      status: 'pending-client',
      statusLabel: 'Pending Approval',
      badgeClass: 'badge-high',
      version: 'v1.0',
      versionBadgeClass: 'version-pill-v1',
      isRevised: false,
      clientDetails: {
        legalName: companyName,
        addressLine1: client.addressLine1 || '',
        addressLine2: client.addressLine2 || '',
        stateCountry: client.stateCountry || '',
        gstin: client.gstin || '—'
      },
      items: t.parsedItems,
      paymentSchedule: [
        { milestone: 'M1', stage: 'Advance — on signing of agreement / receipt of PO', percent: 40, amount: m1 },
        { milestone: 'M2', stage: 'Demo — on demonstration of built modules', percent: 40, amount: m2 },
        { milestone: 'M3', stage: 'Deployment — after production deployment & go-live', percent: 20, amount: m3 }
      ],
      recurringCharges: opts.includeRecurring && opts.recurringItem ? [{
        module: opts.recurringItem.module || 'Annual Maintenance & Support',
        component: opts.recurringItem.desc || 'Annual Maintenance, Security Patches & Cloud Ops',
        basis: opts.recurringItem.basis || 'Flat annual package',
        freq: opts.recurringItem.freq || 'Annual',
        amount: this._parseAmt(opts.recurringItem.amount)
      }] : [],
      notes: opts.notes || '',
      versionHistory: [{
        version: 'v1.0',
        label: 'Initial Invoice Generation',
        date: issueDate,
        baseAmount: this._fmtINR(t.totalGross),
        tax: this._fmtINR(t.totalGst),
        deductions: this._fmtINR(t.totalDiscount),
        netPayable: this._fmtINR(t.netPayable),
        editor: 'Commercial Operations',
        changeReason: proj
          ? `Invoice generated from project "${proj.name}"${milestoneName ? ` — milestone "${milestoneName}"` : ''}.`
          : 'General invoice generated for client approval and milestone advance.',
        modifiedFields: ['Invoice Generated'],
        isCurrent: true
      }]
    };

    return this.createInvoice(invoiceObj);
  },
  // Convenience wrapper: minimal project-based generation (programmatic use)
  generateInvoiceFromProject(projectId, opts = {}) {
    const proj = this.getProject(projectId);
    if (!proj) return null;
    return this.generateInvoice(projectId, {
      companyName: opts.companyName || proj.name,
      clientDetails: opts.clientDetails || { legalName: opts.companyName || proj.name },
      items: opts.items || [{ name: `${proj.name} — Service Delivery`, desc: 'As per agreed scope of work', gross: opts.gross || 0, discountPct: opts.discountPct || 0 }],
      ...opts
    });
  },

  // ─── Bank Guarantees ───
  getBankGuarantees(companyId) {
    const list = this._data.bankGuarantees || [];
    const targetComp = companyId || (this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : null);
    if (!targetComp) return list;
    return list.filter(b => b.companyId === targetComp || (!b.companyId && targetComp === 'comp_hintonn'));
  },
  getBankGuarantee(id) { return (this._data.bankGuarantees || []).find(b => b.id === id || b.ref === id); },
  createBankGuarantee(d) {
    const activeComp = this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : 'comp_hintonn';
    const bg = { id: d.id || d.ref || this._genId(), companyId: d.companyId || activeComp, ...d, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data.bankGuarantees.push(bg);
    this._addActivity('bankGuarantee', `Registered BG <strong>${this._esc(bg.ref)}</strong> — ${bg.projectName || ''}`);
    this._save(); this._notify();
    this._syncToFirestore('bankGuarantees', bg.id || bg.ref, bg);
    return bg;
  },
  updateBankGuarantee(id, d) {
    const bg = this.getBankGuarantee(id); if (!bg) return null;
    Object.assign(bg, d, { updatedAt: new Date().toISOString() });
    this._addActivity('bankGuarantee', `Updated BG <strong>${this._esc(bg.ref)}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('bankGuarantees', bg.id || bg.ref, bg);
    return bg;
  },
  deleteBankGuarantee(id) {
    const bg = this.getBankGuarantee(id); if (!bg) return;
    this._data.bankGuarantees = this._data.bankGuarantees.filter(x => x.id !== id && x.ref !== id);
    this._addActivity('bankGuarantee', `Deleted BG <strong>${this._esc(bg.ref)}</strong>`);
    this._save(); this._notify();
    this._deleteFromFirestore('bankGuarantees', bg.id || bg.ref);
  },

  // ─── DLP Records ───
  getDlpRecords(companyId) {
    const list = this._data.dlpRecords || [];
    const targetComp = companyId || (this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : null);
    if (!targetComp) return list;
    return list.filter(r => r.companyId === targetComp || (!r.companyId && targetComp === 'comp_hintonn'));
  },
  getDlpRecord(id) { return (this._data.dlpRecords || []).find(r => r.id === id); },
  createDlpRecord(d) {
    const activeComp = this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : 'comp_hintonn';
    const r = { id: d.id || this._genId(), companyId: d.companyId || activeComp, ...d, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data.dlpRecords.push(r);
    this._addActivity('dlpRecord', `Created DLP record for <strong>${r.projectName || ''}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('dlpRecords', r.id, r);
    return r;
  },
  updateDlpRecord(id, d) {
    const r = this.getDlpRecord(id); if (!r) return null;
    Object.assign(r, d, { updatedAt: new Date().toISOString() });
    this._addActivity('dlpRecord', `Updated DLP record for <strong>${r.projectName || ''}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('dlpRecords', r.id, r);
    return r;
  },
  deleteDlpRecord(id) {
    const r = this.getDlpRecord(id); if (!r) return;
    this._data.dlpRecords = this._data.dlpRecords.filter(x => x.id !== id);
    this._addActivity('dlpRecord', `Deleted DLP record for <strong>${r.projectName || ''}</strong>`);
    this._save(); this._notify();
    this._deleteFromFirestore('dlpRecords', id);
  },

  // ─── Retention Records ───
  getRetentionRecords(companyId) {
    const list = this._data.retentionRecords || [];
    const targetComp = companyId || (this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : null);
    if (!targetComp) return list;
    return list.filter(r => r.companyId === targetComp || (!r.companyId && targetComp === 'comp_hintonn'));
  },
  getRetentionRecord(id) { return (this._data.retentionRecords || []).find(r => r.id === id); },
  createRetentionRecord(d) {
    const activeComp = this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : 'comp_hintonn';
    const r = { id: d.id || this._genId(), companyId: d.companyId || activeComp, ...d, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data.retentionRecords.push(r);
    this._addActivity('retentionRecord', `Created retention record for <strong>${r.projectName || ''}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('retentionRecords', r.id, r);
    return r;
  },
  updateRetentionRecord(id, d) {
    const r = this.getRetentionRecord(id); if (!r) return null;
    Object.assign(r, d, { updatedAt: new Date().toISOString() });
    this._addActivity('retentionRecord', `Updated retention record for <strong>${r.projectName || ''}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('retentionRecords', r.id, r);
    return r;
  },
  deleteRetentionRecord(id) {
    const r = this.getRetentionRecord(id); if (!r) return;
    this._data.retentionRecords = this._data.retentionRecords.filter(x => x.id !== id);
    this._addActivity('retentionRecord', `Deleted retention record for <strong>${r.projectName || ''}</strong>`);
    this._save(); this._notify();
    this._deleteFromFirestore('retentionRecords', id);
  },

  // ─── Teams (within Companies) ───
  getTeams(companyId) {
    const list = (this._data && this._data.teams) || [];
    const target = companyId || (this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : null);
    return target ? list.filter(t => t.companyId === target) : list;
  },
  getTeam(id) {
    return ((this._data && this._data.teams) || []).find(t => t.id === id);
  },
  createTeam(d) {
    const targetComp = d.companyId || (this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : 'comp_hintonn');
    const team = {
      id: d.id || ('team_' + Date.now().toString(36)),
      companyId: targetComp,
      name: d.name || 'New Team',
      leadId: d.leadId || '',
      memberIds: Array.isArray(d.memberIds) ? d.memberIds : [],
      description: d.description || '',
      createdAt: new Date().toISOString()
    };
    if (!Array.isArray(this._data.teams)) this._data.teams = [];
    this._data.teams.push(team);
    this._addActivity('team', `Created team <strong>${this._esc(team.name)}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('teams', team.id, team);
    return team;
  },
  updateTeam(id, d) {
    const team = this.getTeam(id); if (!team) return null;
    Object.assign(team, d, { updatedAt: new Date().toISOString() });
    this._save(); this._notify();
    this._syncToFirestore('teams', team.id, team);
    return team;
  },
  deleteTeam(id) {
    const team = this.getTeam(id); if (!team) return;
    this._data.teams = (this._data.teams || []).filter(t => t.id !== id);
    this._save(); this._notify();
    this._deleteFromFirestore('teams', id);
  },

  // ─── Company Admins & SuperAdmins ───
  getAdmins(companyId) {
    const list = (this._data && this._data.admins) || [];
    const target = companyId || (this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : null);
    return target ? list.filter(a => a.companyId === target) : list;
  },
  getSuperAdmins() {
    return (this._data && this._data.super_admins) || [];
  },
  assignCompanyAdmin(email, companyId, name) {
    const comp = this.getCompany ? this.getCompany(companyId) : null;
    const admin = {
      id: 'admin_' + Date.now().toString(36),
      email: email.trim().toLowerCase(),
      name: name || email.split('@')[0],
      role: 'Admin',
      companyId: companyId,
      companyName: comp ? comp.name : 'PMO Workspace',
      isActive: true,
      assignedAt: new Date().toISOString()
    };
    if (!Array.isArray(this._data.admins)) this._data.admins = [];
    this._data.admins.push(admin);
    if (comp && !comp.adminEmails.includes(admin.email)) {
      comp.adminEmails.push(admin.email);
      this._syncToFirestore('companies', comp.id, comp);
    }
    this._save(); this._notify();
    this._syncToFirestore('admins', admin.id, admin);
    return admin;
  },
  revokeCompanyAdmin(adminId) {
    const admin = ((this._data && this._data.admins) || []).find(a => a.id === adminId || a.email === adminId);
    if (!admin) return;
    this._data.admins = (this._data.admins || []).filter(a => a.id !== admin.id);
    const comp = this.getCompany ? this.getCompany(admin.companyId) : null;
    if (comp) {
      comp.adminEmails = comp.adminEmails.filter(e => e.toLowerCase() !== admin.email.toLowerCase());
      this._syncToFirestore('companies', comp.id, comp);
    }
    this._save(); this._notify();
    this._deleteFromFirestore('admins', admin.id);
  },

  // Milestones
  getMilestones(projectId) {
    const list = (this._data && this._data.milestones) || [];
    return projectId ? list.filter(m => m.projectId === projectId) : list;
  },
  createMilestone(d) {
    const m = { id: this._genId(), projectId: d.projectId, name: d.name, dueDate: d.dueDate||'',
      status: d.status||'pending', taskIds: d.taskIds||[],
      createdAt: new Date().toISOString() };
    this._data.milestones.push(m);
    const proj = this.getProject(m.projectId);
    if (proj) {
      proj.milestoneIds.push(m.id);
      this._syncToFirestore('projects', proj.id, proj);
    }
    this._addActivity('milestone', `Created milestone <strong>${this._esc(m.name)}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('milestones', m.id, m);
    return m;
  },
  updateMilestone(id, d) {
    const m = this._data.milestones.find(x => x.id === id); if (!m) return null;
    Object.assign(m, d);
    this._addActivity('milestone', `Updated milestone <strong>${this._esc(m.name)}</strong>`);
    const proj = this.getProject(m.projectId);
    if (proj) this._syncToFirestore('projects', proj.id, proj);
    this._save(); this._notify();
    this._syncToFirestore('milestones', m.id, m);
    return m;
  },
  deleteMilestone(id) {
    const m = this._data.milestones.find(x => x.id === id); if (!m) return;
    this._data.milestones = this._data.milestones.filter(x => x.id !== id);
    const proj = this.getProject(m.projectId);
    if (proj) {
      proj.milestoneIds = proj.milestoneIds.filter(x => x !== id);
      this._syncToFirestore('projects', proj.id, proj);
    }
    this._save(); this._notify();
    this._deleteFromFirestore('milestones', id);
  },

  // Issues
  getIssues(projectId) {
    const list = (this._data && this._data.issues) || [];
    return projectId ? list.filter(i => i.projectId === projectId) : list;
  },
  createIssue(d) {
    const i = { id: this._genId(), projectId: d.projectId, title: d.title, description: d.description||'',
      status: d.status||'open', priority: d.priority||'medium', assigneeId: d.assigneeId||'',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data.issues.push(i);
    const proj = this.getProject(i.projectId);
    if (proj) {
      proj.issueIds.push(i.id);
      this._syncToFirestore('projects', proj.id, proj);
    }
    this._addActivity('issue', `Created issue <strong>${this._esc(i.title)}</strong>${proj ? ` in ${this._esc(proj.name)}` : ''}`);
    this._addNotification('issue', `New issue: ${this._esc(i.title)}`);
    this._save(); this._notify();
    this._syncToFirestore('issues', i.id, i);
    return i;
  },
  updateIssue(id, d) {
    const i = this._data.issues.find(x => x.id === id); if (!i) return null;
    Object.assign(i, d, { updatedAt: new Date().toISOString() });
    const proj = this.getProject(i.projectId);
    if (proj) this._syncToFirestore('projects', proj.id, proj);
    this._save(); this._notify();
    this._syncToFirestore('issues', i.id, i);
    return i;
  },
  deleteIssue(id) {
    const i = this._data.issues.find(x => x.id === id); if (!i) return;
    this._data.issues = this._data.issues.filter(x => x.id !== id);
    const proj = this.getProject(i.projectId);
    if (proj) {
      proj.issueIds = proj.issueIds.filter(x => x !== id);
      this._syncToFirestore('projects', proj.id, proj);
    }
    this._save(); this._notify();
    this._deleteFromFirestore('issues', id);
  },

  // Comments
  getComments(taskId) { return this._data.comments.filter(c => c.taskId === taskId).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); },
  addComment(taskId, authorId, text) {
    const c = { id: this._genId(), taskId, authorId, text, createdAt: new Date().toISOString() };
    this._data.comments.push(c);
    const t = this.getTask(taskId);
    this._addActivity('comment', `Commented on <strong>${t ? t.title : 'a task'}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('comments', c.id, c);
    return c;
  },
  createComment(taskId, authorId, text) {
    return this.addComment(taskId, authorId, text);
  },

  // Notifications
  getNotifications() {
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    let notifs = this._data.notifications.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    const isAdmin = user && user.role === 'Admin';

    // Admin-only notification types — non-admin users should never see these
    if (user && !isAdmin) {
      const adminOnlyTypes = ['user-approval'];
      notifs = notifs.filter(n => !adminOnlyTypes.includes(n.type));
    }

    if (user && user.role === 'AI Developer') {
      const userMemberId = user.memberId || (user.id === 'preet' ? 'm2' : user.id === 'mohit' ? 'm3' : user.id === 'hirvi' ? 'm4' : '');
      const myTasks = this.getTasks().filter(t => {
        const ids = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
        return ids.some(id =>
          id === user.id ||
          (userMemberId && id === userMemberId) ||
          (user.id === 'preet' && id === 'm2') ||
          (user.id === 'mohit' && id === 'm3') ||
          (user.id === 'hirvi' && id === 'm4') ||
          (user.memberId === 'm2' && id === 'preet') ||
          (user.memberId === 'm3' && id === 'mohit') ||
          (user.memberId === 'm4' && id === 'hirvi')
        );
      });
      const myTaskTitles = new Set(myTasks.map(t => t.title.toLowerCase()));

      const myIssues = this.getIssues().filter(i => 
        i.assigneeId === user.id ||
        (userMemberId && i.assigneeId === userMemberId) ||
        (user.id === 'preet' && i.assigneeId === 'm2') ||
        (user.id === 'mohit' && i.assigneeId === 'm3') ||
        (user.id === 'hirvi' && i.assigneeId === 'm4') ||
        (user.memberId === 'm2' && i.assigneeId === 'preet') ||
        (user.memberId === 'm3' && i.assigneeId === 'mohit') ||
        (user.memberId === 'm4' && i.assigneeId === 'hirvi')
      );
      const myIssueTitles = new Set(myIssues.map(i => i.title.toLowerCase()));

      const myProjectIds = new Set(myTasks.map(t => t.projectId));
      const myMilestones = this.getMilestones().filter(m => myProjectIds.has(m.projectId));
      const myMilestoneNames = new Set(myMilestones.map(m => m.name.toLowerCase()));

      notifs = notifs.filter(n => {
        // Direct target match by member or user ID
        if (n.targetMemberId && (n.targetMemberId === userMemberId || n.targetMemberId === user.id)) return true;
        if (Array.isArray(n.targetMemberIds)) {
          if (n.targetMemberIds.some(mid => mid === userMemberId || mid === user.id || (user.id === 'preet' && mid === 'm2') || (user.id === 'mohit' && mid === 'm3') || (user.id === 'hirvi' && mid === 'm4'))) {
            return true;
          }
        }
        if (n.targetUserId && (n.targetUserId === user.id || n.targetUserId === userMemberId)) return true;

        const text = n.text.toLowerCase();
        // If explicitly assigned to other developer, exclude
        const otherDevs = ['mohit', 'preet', 'hirvi'].filter(name => name !== user.id.toLowerCase());
        for (const other of otherDevs) {
          if (text.includes(`assigned to ${other}`) || text.includes(`to ${other}`)) {
            return false;
          }
        }
        // Match user name or user id
        if (text.includes(user.name.toLowerCase()) || text.includes(user.id.toLowerCase())) return true;
        // Match user task
        for (const title of myTaskTitles) {
          if (text.includes(title)) return true;
        }
        // Match user issue
        for (const title of myIssueTitles) {
          if (text.includes(title)) return true;
        }
        // Match user milestone
        for (const name of myMilestoneNames) {
          if (text.includes(name)) return true;
        }
        return false;
      });
    }
    return notifs;
  },
  getUnreadCount() { return this.getNotifications().filter(n => !n.read).length; },
  markRead(id) { const n = this._data.notifications.find(x=>x.id===id); if(n) n.read=true; this._save(); this._notify(); },
  markAllRead() { this._data.notifications.forEach(n => n.read = true); this._save(); this._notify(); },
  _addNotification(type, text, extra = {}) {
    return this.addNotification({ type, text, ...extra });
  },

  // Activities
  getActivities(limit) { return this._data.activities.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit||50); },
  _addActivity(type, html) {
    const act = { id: this._genId(), type, html, createdAt: new Date().toISOString() };
    this._data.activities.unshift(act);
    if (this._data.activities.length > 200) this._data.activities = this._data.activities.slice(0, 200);
    this._syncToFirestore('activities', act.id, act);
  },

  // Settings
  getSettings() { return this._data.settings; },
  updateSettings(d) {
    Object.assign(this._data.settings, d);
    this._save(); this._notify();
    this._syncToFirestore('settings', 'workspace_settings', this._data.settings);
  },

  // ─── Notification Preferences & Public API ───
  getNotificationPrefs() {
    if (!this._data.settings.notificationPrefs) {
      this._data.settings.notificationPrefs = {
        pushEnabled: false,
        bgExpiryAlerts: true,
        invoiceNotifications: true,
        dlpAlerts: true,
        healthScoreAlerts: true,
        taskUpdates: true,
        milestoneUpdates: true
      };
    }
    return this._data.settings.notificationPrefs;
  },

  saveNotificationPrefs(prefs) {
    this._data.settings.notificationPrefs = { ...this.getNotificationPrefs(), ...prefs };
    this._save();
    this._notify();
    this._syncToFirestore('settings', 'workspace_settings', this._data.settings);
  },

  addNotification(notification) {
    const n = {
      id: this._genId(),
      type: notification.type || 'system',
      text: notification.text || '',
      read: notification.read || false,
      targetMemberIds: notification.targetMemberIds || null,
      targetMemberId: notification.targetMemberId || null,
      targetUserId: notification.targetUserId || null,
      taskId: notification.taskId || null,
      projectId: notification.projectId || null,
      reviewNotes: notification.reviewNotes || null,
      createdAt: new Date().toISOString()
    };
    this._data.notifications.unshift(n);
    if (this._data.notifications.length > 100) {
      this._data.notifications = this._data.notifications.slice(0, 100);
    }
    this._save();
    this._notify();
    if (this._db) {
      this._syncToFirestore('notifications', n.id, n);
    }
    return n;
  },

  // Stats
  getStats(companyId) {
    const projects = this.getProjects(companyId);
    const targetComp = companyId || (this.getActiveCompanyId() !== 'all' ? this.getActiveCompanyId() : null);
    const tasks = targetComp ? this.getTasks(null, targetComp) : (this._data.tasks || []);
    const issues = targetComp ? (this._data.issues || []).filter(i => {
      const p = this.getProject(i.projectId);
      return p ? p.companyId === targetComp : (targetComp === 'comp_hintonn');
    }) : (this._data.issues || []);
    const milestones = targetComp ? (this._data.milestones || []).filter(m => {
      const p = this.getProject(m.projectId);
      return p ? p.companyId === targetComp : (targetComp === 'comp_hintonn');
    }) : (this._data.milestones || []);
    const now = new Date();
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length,
      overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
      openIssues: issues.filter(i => i.status === 'open').length,
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter(m => m.status === 'completed').length,
    };
  },

  // Progress calc
  _recalcProgress(projectId) {
    const proj = this.getProject(projectId); if (!proj) return;
    const tasks = this.getTasks(projectId).filter(t => !t.isPersonal);
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

  // ─── Universal Search Engine & Entity Indexer ───
  search(query) {
    const rawQuery = (query || '').trim();
    const q = rawQuery.toLowerCase();
    if (!q) {
      return { pages: [], projects: [], tasks: [], issues: [], milestones: [], commercial: { bGs: [], invoices: [] } };
    }

    // Synonym & Term Mapping Dictionary
    const SYNONYMS = {
      'milestone': ['milestones', 'target', 'deliverable', 'deliverables', 'due dates'],
      'milestones': ['milestone', 'target', 'deliverable', 'deliverables', 'due dates'],
      'issue': ['issues', 'bug', 'bugs', 'defect', 'defects', 'blocker', 'blockers', 'ticket', 'tickets'],
      'issues': ['issue', 'bug', 'bugs', 'defect', 'defects', 'blocker', 'blockers', 'ticket', 'tickets'],
      'bug': ['bugs', 'issue', 'issues', 'defect', 'defects'],
      'bugs': ['bug', 'issue', 'issues', 'defect', 'defects'],
      'defect': ['defects', 'issue', 'issues', 'bug', 'bugs'],
      'defects': ['defect', 'issue', 'issues', 'bug', 'bugs'],
      'project': ['projects', 'portfolio', 'initiatives', 'workstreams'],
      'projects': ['project', 'portfolio', 'initiatives', 'workstreams'],
      'portfolio': ['projects', 'project'],
      'task': ['tasks', 'todo', 'todos', 'item', 'items', 'work', 'kanban', 'board', 'list'],
      'tasks': ['task', 'todo', 'todos', 'item', 'items', 'work', 'kanban', 'board', 'list'],
      'todo': ['todos', 'task', 'tasks'],
      'todos': ['todo', 'task', 'tasks'],
      'kanban': ['tasks', 'task', 'board'],
      'board': ['tasks', 'kanban'],
      'calendar': ['schedule', 'schedules', 'events', 'deadlines', 'dates', 'agenda'],
      'schedule': ['calendar', 'schedules', 'events', 'deadlines', 'dates'],
      'schedules': ['calendar', 'schedule', 'events', 'deadlines', 'dates'],
      'event': ['events', 'calendar', 'schedule'],
      'events': ['event', 'calendar', 'schedule'],
      'deadline': ['deadlines', 'calendar', 'schedule', 'milestones'],
      'deadlines': ['deadline', 'calendar', 'schedule', 'milestones'],
      'team': ['members', 'member', 'developer', 'developers', 'users', 'user', 'people', 'staff', 'workload'],
      'members': ['team', 'member', 'developer', 'developers', 'users', 'user', 'people'],
      'member': ['team', 'members', 'developer', 'developers', 'users', 'user'],
      'developer': ['developers', 'team', 'members', 'users', 'user', 'preet', 'mohit', 'hirvi'],
      'developers': ['developer', 'team', 'members', 'users', 'user', 'preet', 'mohit', 'hirvi'],
      'user': ['users', 'team', 'members', 'developer', 'developers'],
      'users': ['user', 'team', 'members', 'developer', 'developers'],
      'report': ['reports', 'analytics', 'chart', 'charts', 'metric', 'metrics', 'stats', 'statistics'],
      'reports': ['report', 'analytics', 'chart', 'charts', 'metric', 'metrics', 'stats', 'statistics'],
      'analytics': ['reports', 'report', 'charts', 'metrics', 'stats'],
      'charts': ['analytics', 'reports', 'report'],
      'metrics': ['analytics', 'reports', 'report', 'kpi'],
      'timeline': ['gantt', 'roadmap', 'schedule', 'horizon', 'macro'],
      'gantt': ['timeline', 'roadmap', 'schedule', 'horizon', 'macro'],
      'roadmap': ['timeline', 'gantt', 'schedule'],
      'retention': ['retention summary', 'money', 'holdback', 'pbg', 'contract'],
      'bg': ['bank guarantee', 'bank guarantees', 'guarantee', 'guarantees', 'pbg', 'abg', 'mbg', 'security'],
      'bank guarantee': ['bg', 'guarantee', 'guarantees', 'pbg', 'abg', 'mbg', 'security'],
      'bank guarantees': ['bg', 'bank guarantee', 'guarantee', 'guarantees', 'pbg', 'abg', 'mbg'],
      'guarantee': ['bg', 'bank guarantee', 'bank guarantees', 'pbg', 'abg', 'mbg'],
      'guarantees': ['bg', 'bank guarantee', 'bank guarantees', 'pbg', 'abg', 'mbg'],
      'pbg': ['bg', 'bank guarantee', 'guarantee'],
      'abg': ['bg', 'bank guarantee', 'guarantee'],
      'mbg': ['bg', 'bank guarantee', 'guarantee'],
      'dlp': ['dlp timelines', 'warranty', 'warranties', 'defect liability', 'liability'],
      'warranty': ['dlp', 'dlp timelines', 'defect liability', 'liability'],
      'warranties': ['dlp', 'warranty', 'defect liability'],
      'defect liability': ['dlp', 'warranty'],
      'billing': ['bill', 'bills', 'invoice', 'invoices', 'payment', 'payments', 'financial', 'finance'],
      'bill': ['billing', 'bills', 'invoice', 'invoices', 'payment'],
      'bills': ['billing', 'bill', 'invoice', 'invoices', 'payment'],
      'invoice': ['invoices', 'billing', 'bill', 'bills', 'payment', 'payments'],
      'invoices': ['invoice', 'billing', 'bill', 'bills', 'payment', 'payments'],
      'payment': ['payments', 'billing', 'invoice', 'invoices'],
      'payments': ['payment', 'billing', 'invoice', 'invoices'],
      'dashboard': ['home', 'overview', 'summary', 'kpi'],
      'home': ['dashboard', 'overview'],
      'overview': ['dashboard', 'home', 'summary'],
      'kpi': ['dashboard', 'reports', 'metrics'],
      'ai': ['ai assistant', 'copilot', 'assistant', 'chat', 'bot', 'intelligence'],
      'ai assistant': ['ai', 'copilot', 'assistant', 'chat', 'bot'],
      'copilot': ['ai', 'ai assistant', 'assistant', 'chat', 'bot'],
      'assistant': ['ai', 'ai assistant', 'copilot', 'chat', 'bot'],
      'chat': ['ai assistant', 'copilot', 'assistant', 'ai'],
      'settings': ['setting', 'config', 'configuration', 'profile', 'account', 'preferences'],
      'setting': ['settings', 'config', 'profile'],
      'config': ['settings', 'configuration'],
      'profile': ['settings', 'account'],
      'notifications': ['notification', 'alert', 'alerts', 'activity', 'activities', 'feed'],
      'notification': ['notifications', 'alert', 'alerts', 'activity', 'activities', 'feed'],
      'alert': ['alerts', 'notifications', 'notification', 'activity'],
      'alerts': ['alert', 'notifications', 'notification', 'activity'],
      'activity': ['activities', 'notifications', 'feed'],
      'activities': ['activity', 'notifications', 'feed']
    };

    // Build expansion tokens
    const queryTokens = q.split(/\s+/).filter(Boolean);
    const expandedTerms = new Set([q, ...queryTokens]);
    
    // Add singular/plural derivations
    queryTokens.forEach(token => {
      if (token.endsWith('es') && token.length > 3) expandedTerms.add(token.slice(0, -2));
      if (token.endsWith('s') && token.length > 2) expandedTerms.add(token.slice(0, -1));
      if (!token.endsWith('s')) {
        expandedTerms.add(token + 's');
        expandedTerms.add(token + 'es');
      }
    });

    // Add mapped synonyms
    [...expandedTerms].forEach(term => {
      if (SYNONYMS[term]) {
        SYNONYMS[term].forEach(syn => expandedTerms.add(syn));
      }
    });

    const isMatch = (targetStr) => {
      if (!targetStr) return false;
      const target = String(targetStr).toLowerCase();
      if (target.includes(q)) return true;
      for (const term of expandedTerms) {
        if (target.includes(term)) return true;
      }
      return false;
    };

    const isDirectMatch = (targetStr) => {
      if (!targetStr) return false;
      const target = String(targetStr).toLowerCase();
      if (target.includes(q)) return true;
      for (const token of queryTokens) {
        if (target.includes(token)) return true;
      }
      return false;
    };

    const navPages = [
      { name: 'Projects', route: 'projects', icon: 'folder', description: 'Projects and portfolio overview', keywords: ['projects', 'project', 'portfolio', 'initiatives', 'work'] },
      { name: 'Tasks', route: 'tasks', icon: 'checkSquare', description: 'Task tracking and Kanban boards', keywords: ['tasks', 'task', 'todo', 'todos', 'kanban', 'board', 'list', 'items'] },
      { name: 'Calendar', route: 'calendar', icon: 'calendar', description: 'Schedule and upcoming deadlines', keywords: ['calendar', 'schedule', 'schedules', 'events', 'deadlines', 'dates', 'agenda'] },
      { name: 'Issues', route: 'issues', icon: 'alertCircle', description: 'Issue tracker and defect reports', keywords: ['issues', 'issue', 'bug', 'bugs', 'defect', 'defects', 'blocker', 'blockers', 'ticket', 'tickets'] },
      { name: 'Milestones', route: 'milestones', icon: 'flag', description: 'Project milestones and target dates', keywords: ['milestones', 'milestone', 'target', 'targets', 'deliverable', 'deliverables', 'due dates'] },
      { name: 'Reports & Analytics', route: 'reports', icon: 'barChart', description: 'Analytics and performance reports', keywords: ['reports', 'report', 'analytics', 'charts', 'chart', 'metrics', 'stats', 'kpi'] },
      { name: 'Executive Dashboard', route: 'dashboard', icon: 'home', description: 'Executive summary and KPIs', keywords: ['dashboard', 'home', 'overview', 'summary', 'kpi'] },
      { name: 'AI Assistant', route: 'ai-assistant', icon: 'assistant', description: 'Hintonn AI Copilot chat', keywords: ['ai', 'ai assistant', 'copilot', 'assistant', 'chat', 'bot', 'intelligence'] },
      { name: 'Team & Workload', route: 'team', icon: 'users', description: 'AI Developers workload and metrics', keywords: ['team', 'members', 'member', 'developer', 'developers', 'users', 'user', 'staff', 'workload'] },
      { name: 'Timeline & Executive Gantt', route: 'timeline', icon: 'timeline', description: 'Executive timeline & Gantt chart', keywords: ['timeline', 'gantt', 'roadmap', 'schedule', 'horizon', 'macro'], adminOnly: true },
      { name: 'Billing & Invoices', route: 'billing', icon: 'creditCard', description: 'Commercial invoices & billing', keywords: ['billing', 'bill', 'bills', 'invoice', 'invoices', 'payment', 'payments', 'financial'], adminOnly: true },
      { name: 'Retention Summary', route: 'retention', icon: 'lock', description: 'Retention money tracking', keywords: ['retention', 'retentions', 'retention summary', 'holdback', 'money'], adminOnly: true },
      { name: 'Bank Guarantees (BG)', route: 'bg', icon: 'shield', description: 'Bank guarantees & tracking', keywords: ['bg', 'bank guarantee', 'bank guarantees', 'guarantee', 'guarantees', 'pbg', 'abg', 'mbg', 'security'], adminOnly: true },
      { name: 'DLP Timelines', route: 'dlp', icon: 'clock', description: 'Defect liability periods', keywords: ['dlp', 'dlp timelines', 'warranty', 'warranties', 'defect liability', 'liability'], adminOnly: true },
      { name: 'Settings', route: 'settings', icon: 'settings', description: 'Profile & workspace settings', keywords: ['settings', 'setting', 'config', 'configuration', 'profile', 'account', 'preferences'], adminOnly: true },
      { name: 'Connectors', route: 'connectors', icon: 'plug', description: 'Integrations, webhooks, and data sources', keywords: ['connectors', 'integrations', 'jira', 'slack', 'webhooks', 'data sources', 'api'], adminOnly: true },
      { name: 'User Approvals', route: 'user-approvals', icon: 'users', description: 'Approve or reject pending user access requests', keywords: ['approvals', 'users', 'pending', 'approve', 'reject', 'access', 'user approvals'], adminOnly: true },
      { name: 'Notifications', route: 'notifications', icon: 'bell', description: 'Activity feed and system alerts', keywords: ['notifications', 'notification', 'alert', 'alerts', 'activity', 'activities', 'feed'] }
    ];

    const projectsMap = new Map(this._data.projects.map(p => [p.id, p]));
    const membersMap = new Map(this._data.members.map(m => [m.id, m]));

    // Match Pages
    const matchedPages = navPages.filter(p => {
      if (isMatch(p.name) || isMatch(p.route) || isMatch(p.description)) return true;
      if (p.keywords && p.keywords.some(k => isMatch(k))) return true;
      return false;
    });

    // Check if query specifically targets entity types
    const queryMatchesProjects = expandedTerms.has('project') || expandedTerms.has('projects') || expandedTerms.has('portfolio');
    const queryMatchesTasks = expandedTerms.has('task') || expandedTerms.has('tasks') || expandedTerms.has('todo') || expandedTerms.has('todos');
    const queryMatchesIssues = expandedTerms.has('issue') || expandedTerms.has('issues') || expandedTerms.has('bug') || expandedTerms.has('bugs') || expandedTerms.has('defect') || expandedTerms.has('defects');
    const queryMatchesMilestones = expandedTerms.has('milestone') || expandedTerms.has('milestones') || expandedTerms.has('target') || expandedTerms.has('deliverable') || expandedTerms.has('deliverables');

    // Match Projects
    const matchedProjects = this._data.projects.filter(p => {
      if (queryMatchesProjects) return true;
      return (
        isDirectMatch(p.name) || 
        isDirectMatch(p.description) ||
        isDirectMatch(p.type) ||
        isDirectMatch(p.status) ||
        (p.tags && p.tags.some(tag => isDirectMatch(tag)))
      );
    });

    // Match Tasks
    const matchedTasks = this._data.tasks.filter(t => {
      if (queryMatchesTasks) return true;
      const proj = projectsMap.get(t.projectId);
      const m = membersMap.get(t.assigneeId);
      const projName = proj ? proj.name : '';
      const assigneeName = m ? m.name : '';
      return (
        isDirectMatch(t.title) ||
        isDirectMatch(t.description) ||
        isDirectMatch(t.status) ||
        isDirectMatch(t.priority) ||
        (t.tags && t.tags.some(tag => isDirectMatch(tag))) ||
        isDirectMatch(projName) ||
        isDirectMatch(assigneeName)
      );
    });

    // Match Issues
    const matchedIssues = this._data.issues.filter(i => {
      if (queryMatchesIssues) return true;
      const proj = projectsMap.get(i.projectId);
      const m = membersMap.get(i.assigneeId);
      const projName = proj ? proj.name : '';
      const assigneeName = m ? m.name : '';
      return (
        isDirectMatch(i.title) ||
        isDirectMatch(i.description) ||
        isDirectMatch(i.priority) ||
        isDirectMatch(i.status) ||
        isDirectMatch(projName) ||
        isDirectMatch(assigneeName)
      );
    });

    // Match Milestones
    const matchedMilestones = this._data.milestones.filter(m => {
      if (queryMatchesMilestones) return true;
      const proj = projectsMap.get(m.projectId);
      const projName = proj ? proj.name : '';
      return (
        isDirectMatch(m.name) ||
        isDirectMatch(m.description) ||
        isDirectMatch(m.status) ||
        isDirectMatch(projName)
      );
    });

    // Commercial entities — always real Store data (no samples, no seeds)
    const queryMatchesBGs = expandedTerms.has('bg') || expandedTerms.has('bank guarantee') || expandedTerms.has('guarantee') || expandedTerms.has('pbg') || expandedTerms.has('abg') || expandedTerms.has('mbg');
    const queryMatchesBilling = expandedTerms.has('billing') || expandedTerms.has('invoice') || expandedTerms.has('invoices') || expandedTerms.has('bill') || expandedTerms.has('payment');

    const sampleBGs = (this._data && this._data.bankGuarantees) || [];

    const sampleInvoices = (this._data && this._data.invoices) || [];

    const matchedBGs = sampleBGs.filter(bg => {
      if (queryMatchesBGs) return true;
      return isDirectMatch(bg.ref) || isDirectMatch(bg.projectName) || isDirectMatch(bg.type) || isDirectMatch(bg.amount);
    });

    const matchedInvoices = sampleInvoices.filter(inv => {
      if (queryMatchesBilling) return true;
      return isDirectMatch(inv.id) || isDirectMatch(inv.projectName) || isDirectMatch(inv.milestone) || isDirectMatch(inv.amountDue) || isDirectMatch(inv.status);
    });

    return {
      pages: matchedPages,
      projects: matchedProjects,
      tasks: matchedTasks,
      issues: matchedIssues,
      milestones: matchedMilestones,
      commercial: {
        bGs: matchedBGs,
        invoices: matchedInvoices
      }
    };
  },

  // ─── Seed Data ───
  _seedData() {
    const companies = [
      { id: 'comp_hintonn', name: 'Hintonn PMO (HQ)', code: 'HIN', adminEmails: ['mohithintonn@gmail.com', 'admin@hintonn.com'], status: 'active', createdAt: new Date().toISOString() },
      { id: 'comp_lnt', name: 'Larsen & Toubro PMO', code: 'LNT', adminEmails: ['lnt.admin@hintonn.com'], status: 'active', createdAt: new Date().toISOString() },
      { id: 'comp_tata', name: 'Tata Projects PMO', code: 'TATA', adminEmails: ['tata.admin@hintonn.com'], status: 'active', createdAt: new Date().toISOString() }
    ];

    const teams = [
      { id: 'team_ai', companyId: 'comp_hintonn', name: 'AI & Software Engineering', leadId: 'm2', memberIds: ['m2', 'm4', 'm_1790601440429'], description: 'Antigravity AI PMO, ML agents, and full-stack delivery' },
      { id: 'team_civil', companyId: 'comp_hintonn', name: 'Civil & EPC Site Operations', leadId: 'm1', memberIds: ['m1'], description: 'Site works, execution, and subcontractor delivery' },
      { id: 'team_finance', companyId: 'comp_hintonn', name: 'Commercial & Financial Control', leadId: 'm3', memberIds: ['m3'], description: 'Invoicing, bank guarantees, DLP, and cash flow' }
    ];

    const admins = [
      { id: 'admin_1', userId: 'mohit', email: 'mohithintonn@gmail.com', name: 'Mohit Jain', role: 'SuperAdmin', companyId: 'comp_hintonn', companyName: 'Hintonn PMO', isActive: true },
      { id: 'admin_2', userId: 'admin_hintonn', email: 'admin@hintonn.com', name: 'Mohit Jain', role: 'SuperAdmin', companyId: 'comp_hintonn', companyName: 'Hintonn PMO', isActive: true }
    ];

    const super_admins = [
      { id: 'super_1', email: 'mohithintonn@gmail.com', name: 'Mohit Jain', role: 'SuperAdmin', isActive: true },
      { id: 'super_2', email: 'admin@hintonn.com', name: 'Mohit Jain', role: 'SuperAdmin', isActive: true }
    ];

    const members = [
      { id: 'm3', name: 'Mohit Jain', role: 'Admin', designation: 'Executive PMO & Lead', color: '#4F46E5', email: 'mohithintonn@gmail.com', initials: 'MJ', companyId: 'comp_hintonn', companyName: 'Hintonn PMO', teamId: 'team_finance', activeTasks: 0, completedTasks: 0, hoursLogged: 0 }
    ];

    const projects = [];
    const tasks = [];
    const milestones = [];
    const issues = [];
    const comments = [];
    const activities = [];
    const notifications = [];
    const invoices = [];
    const bankGuarantees = [];
    const dlpRecords = [];
    const retentionRecords = [];

    return { projects, tasks, members, milestones, issues, comments, notifications, activities,
      invoices, bankGuarantees, dlpRecords, retentionRecords, companies, teams, admins, super_admins,
      settings: { workspaceName: 'Hintonn AI', currentUser: 'm3' } };
  }
};

// ─── Shared Dynamic State Management (appState.tasks) ───
if (typeof globalThis !== 'undefined') {
  globalThis.appState = {
    get tasks() {
      return (typeof Store !== 'undefined' && Store._data && Array.isArray(Store._data.tasks)) ? Store._data.tasks : [];
    },
    set tasks(val) {
      if (typeof Store !== 'undefined' && Store._data) {
        Store._data.tasks = Array.isArray(val) ? val : [];
        Store._save();
        Store._notify();
      }
    }
  };
}
