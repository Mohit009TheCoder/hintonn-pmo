// ─── Hintonn PM Data Store (Integrated with Firebase Cloud Firestore) ───
const Store = {
  _data: null,
  _listeners: [],
  _db: null,
  _firestoreInitialized: false,

  init() {
    // One-time clear of local storage for fresh application
    if (!localStorage.getItem('hintonn_cleared_v3')) {
      localStorage.removeItem('hintonn-pm');
      localStorage.removeItem('hintonn-users-db');
      localStorage.removeItem('hintonn-auth-version');
      localStorage.setItem('hintonn_cleared_v3', 'true');
    }

    const defaultMembers = [];

    const saved = localStorage.getItem('hintonn-pm');
    if (saved) {
      this._data = JSON.parse(saved);
      // Ensure all keys exist
      ['projects','tasks','members','milestones','issues','comments','notifications','activities','settings','invoices','bankGuarantees','dlpRecords','retentionRecords','companies']
        .forEach(k => { if (!this._data[k]) this._data[k] = []; });
      
      // Ensure default members are loaded if array is empty
      if (this._data.members.length === 0) {
        this._data.members = defaultMembers;
      }
      if (!this._data.settings) this._data.settings = {};
      this._data.settings.currentUser = 'm2';

      // Ensure tasks have start dates and valid developer assignees (Admin m1 excluded from tasks)
      if (this._data.tasks) {
        this._data.tasks.forEach(t => {
          if (t.assigneeId === 'm5' || t.assigneeId === 'm1') t.assigneeId = 'm3';
          if (!t.startDate) {
            t.startDate = t.createdAt ? t.createdAt.split('T')[0] : (t.dueDate || '2026-08-01');
          }
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

  _save() { localStorage.setItem('hintonn-pm', JSON.stringify(this._data)); },
  _notify() { this._listeners.forEach(fn => fn()); },
  subscribe(fn) { this._listeners.push(fn); },

  // ─── Firebase Cloud Firestore Backend Real-time Sync ───
  _initFirestoreSync() {
    if (this._firestoreInitialized) return;
    if (typeof firebase === 'undefined' || !firebase.firestore) {
      setTimeout(() => this._initFirestoreSync(), 600);
      return;
    }

    try {
      this._db = firebase.firestore();

      // Ensure Firebase Auth has a user (anonymous if no real user) so Firestore rules pass
      const auth = firebase.auth();
      const startSync = () => {
        this._firestoreInitialized = true;
        console.log('⚡ [Hintonn Cloud Sync] Connected to Cloud Firestore backend (Project: hintonn-pmo)');
        this._startFirestoreListeners();
      };

      if (auth.currentUser) {
        // Already authenticated (Google login or redirect result)
        startSync();
      } else {
        // Sign in anonymously so Firestore rules (request.auth != null) are satisfied
        auth.signInAnonymously().then(() => {
          console.log('⚡ [Hintonn Cloud Sync] Anonymous auth for Firestore access');
          startSync();
        }).catch(err => {
          console.warn('[Hintonn Cloud Sync] Anonymous auth failed:', err.code, err.message);
          // Retry later in case Firebase Auth state changes (e.g. after Google login)
          setTimeout(() => this._initFirestoreSync(), 5000);
        });

        // Also listen for auth state changes (e.g. Google login) to trigger sync
        auth.onAuthStateChanged(user => {
          if (user && !this._firestoreInitialized) {
            console.log('⚡ [Hintonn Cloud Sync] Auth state changed, initializing sync for:', user.email || user.uid);
            startSync();
          }
        });
        return;
      }

    } catch (err) {
      console.warn('[Hintonn Cloud Sync] Unable to initialize Firestore listeners:', err);
    }
  },

  _startFirestoreListeners() {
    if (!this._db) return;

    // Phase 6: Added 'notifications' for Cloud Function push + 'audit_logs' for admin audit trail
    const syncCollections = ['projects', 'tasks', 'milestones', 'issues', 'comments', 'activities', 'members', 'invoices', 'bankGuarantees', 'dlpRecords', 'retentionRecords', 'companies', 'notifications'];

    syncCollections.forEach(colName => {
      this._db.collection(colName).onSnapshot(snapshot => {
        if (!snapshot) return;

        // If collection is completely empty on remote, seed initial data to Cloud Firestore
        if (snapshot.empty) {
          const localList = this._data[colName] || [];
          if (localList.length > 0) {
            console.log(`⚡ [Hintonn Cloud Sync] Seeding remote Firestore collection '${colName}' (${localList.length} items)...`);
            localList.forEach(item => {
              if (item && item.id) {
                this._db.collection(colName).doc(String(item.id)).set(item).catch(() => {});
              }
            });
          }
          return;
        }

        // Ingest remote changes from Firestore
        const remoteItems = [];
        snapshot.forEach(doc => {
          const d = doc.data();
          if (d) remoteItems.push(d);
        });

        if (remoteItems.length > 0) {
          if (colName === 'members') {
            const coreMembers = [
              { id: 'm1', name: 'Ayush Desai', role: 'AI Developer', color: '#2563EB', email: 'ayush@hintonn.com', initials: 'AD' },
              { id: 'm2', name: 'Preet Bhavsar', role: 'AI Developer', color: '#7C3AED', email: 'preet@hintonn.com', initials: 'PB' },
              { id: 'm3', name: 'Mohit Jain', role: 'Admin', color: '#4F46E5', email: 'mohit@hintonn.com', initials: 'MJ' },
              { id: 'm4', name: 'Hirvi Sanghavi', role: 'AI Developer', color: '#1D4ED8', email: 'hirvi@hintonn.com', initials: 'HS' }
            ];
            coreMembers.forEach(core => {
              const remote = remoteItems.find(r => r.id === core.id);
              if (!remote) {
                this._db.collection('members').doc(core.id).set(core).catch(()=>{});
                remoteItems.push(core);
              } else if (remote.role !== core.role) {
                this._db.collection('members').doc(core.id).set({ role: core.role }, { merge: true }).catch(()=>{});
                remote.role = core.role;
              }
            });
          } else if (colName === 'tasks') {
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

          this._save();
          this._notify();
        }
      }, err => {
        console.warn(`[Hintonn Cloud Sync] Realtime listener notice for '${colName}':`, err.message || err);
      });
    });

    // Settings synchronization
    this._db.collection('settings').doc('workspace_settings').onSnapshot(doc => {
      if (doc && doc.exists) {
        const remoteSettings = doc.data();
        if (remoteSettings) {
          this._data.settings = Object.assign({}, this._data.settings, remoteSettings);
          this._save();
          this._notify();
        }
      } else if (this._data.settings) {
        this._db.collection('settings').doc('workspace_settings').set(this._data.settings).catch(() => {});
      }
    }, () => {});
  },

  _syncToFirestore(collection, id, data) {
    if (!this._db) return;
    try {
      this._db.collection(collection).doc(String(id)).set(data, { merge: true }).catch(err => {
        console.warn(`[Hintonn Cloud Sync] Failed to sync ${collection}/${id}:`, err.message || err);
      });
    } catch (e) {}
  },

  _deleteFromFirestore(collection, id) {
    if (!this._db) return;
    try {
      this._db.collection(collection).doc(String(id)).delete().catch(err => {
        console.warn(`[Hintonn Cloud Sync] Failed to delete ${collection}/${id}:`, err.message || err);
      });
    } catch (e) {}
  },

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
    this._save(); this._notify();
    this._syncToFirestore('projects', p.id, p);
    return p;
  },
  updateProject(id, d) {
    const p = this.getProject(id); if (!p) return null;
    Object.assign(p, d, { updatedAt: new Date().toISOString() });
    this._addActivity('project', `Updated project <strong>${p.name}</strong>`);
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
    this._addActivity('project', `Deleted project <strong>${p.name}</strong>`);
    this._save(); this._notify();
    this._deleteFromFirestore('projects', id);
    delTasks.forEach(t => this._deleteFromFirestore('tasks', t.id));
    delIssues.forEach(i => this._deleteFromFirestore('issues', i.id));
    delMilestones.forEach(m => this._deleteFromFirestore('milestones', m.id));
  },

  // Tasks
  getTasks(projectId) { return projectId ? this._data.tasks.filter(t => t.projectId === projectId) : this._data.tasks; },
  getTask(id) { return this._data.tasks.find(t => t.id === id); },
  createTask(d) {
    let assigneeId = d.assigneeId || '';
    // Ayush Desai (Admin) can never be assigned a task
    if (assigneeId === 'm1' || (assigneeId && this.getMember(assigneeId)?.role === 'Admin')) {
      assigneeId = '';
    }
    const t = { id: this._genId(), projectId: d.projectId, title: d.title, description: d.description||'',
      status: d.status||'todo', priority: d.priority||'medium', assigneeId: assigneeId,
      startDate: d.startDate || new Date().toISOString().split('T')[0],
      dueDate: d.dueDate||'', tags: d.tags||[], order: this._data.tasks.filter(x=>x.projectId===d.projectId).length,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data.tasks.push(t);
    const proj = this.getProject(t.projectId);
    if (proj) {
      proj.taskIds.push(t.id);
      this._recalcProgress(t.projectId);
      this._syncToFirestore('projects', proj.id, proj);
    }
    this._addActivity('task', `Created task <strong>${t.title}</strong>${proj ? ` in ${proj.name}` : ''}`);
    this._save(); this._notify();
    this._syncToFirestore('tasks', t.id, t);
    return t;
  },
  updateTask(id, d) {
    const t = this.getTask(id); if (!t) return null;
    const oldStatus = t.status;
    const updateData = { ...d };
    // Ayush Desai (Admin) can never be assigned a task
    if (updateData.assigneeId === 'm1' || (updateData.assigneeId && this.getMember(updateData.assigneeId)?.role === 'Admin')) {
      delete updateData.assigneeId;
    }
    Object.assign(t, updateData, { updatedAt: new Date().toISOString() });
    if (d.status && d.status !== oldStatus) {
      this._addActivity('task', `Moved <strong>${t.title}</strong> to ${d.status.replace('-',' ')}`);
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
  deleteTask(id) {
    const t = this.getTask(id); if (!t) return;
    this._data.tasks = this._data.tasks.filter(x => x.id !== id);
    const proj = this.getProject(t.projectId);
    if (proj) {
      proj.taskIds = proj.taskIds.filter(x => x !== id);
      this._recalcProgress(t.projectId);
      this._syncToFirestore('projects', proj.id, proj);
    }
    this._addActivity('task', `Deleted task <strong>${t.title}</strong>`);
    this._save(); this._notify();
    this._deleteFromFirestore('tasks', id);
  },
  getMyTasks(memberId) {
    const m = this.getMember(memberId);
    if (m && m.role === 'Admin') return [];
    return this._data.tasks.filter(t => t.assigneeId === memberId && t.status !== 'done');
  },

  // Members
  getMembers() { return this._data.members; },
  getAssignees() { return (this._data.members || []).filter(m => m.role !== 'Admin' && m.id !== 'm1'); },
  getMember(id) {
    if (!id) return null;
    return this._data.members.find(m =>
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
    const m = { id: d.id || this._genId(), name: d.name, role: d.role || 'AI Developer',
      designation: d.designation || d.role || 'AI Developer', email: d.email || '',
      initials: d.initials || '', color: d.color || '#2563EB' };
    this._data.members.push(m);
    this._addActivity('member', `Added team member <strong>${m.name}</strong> as ${m.designation}`);
    this._addNotification('member', `New team member: ${m.name}`);
    this._save(); this._notify();
    this._syncToFirestore('members', m.id, m);
    return m;
  },
  updateMember(id, d) {
    const m = this.getMember(id); if (!m) return null;
    Object.assign(m, d, { updatedAt: new Date().toISOString() });
    this._addActivity('member', `Updated member <strong>${m.name}</strong> — ${Object.keys(d).join(', ')}`);
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
    this._addActivity('member', `Removed team member <strong>${m.name}</strong>`);
    this._save(); this._notify();
    this._deleteFromFirestore('members', id);
    return m;
  },

  // ─── Companies ───
  getCompanies() { return this._data.companies || []; },
  getCompany(id) { return (this._data.companies || []).find(c => c.id === id); },
  createCompany(d) {
    const c = { id: d.id || this._genId(), name: d.name, contactPerson: d.contactPerson || '',
      totalContractValue: d.totalContractValue || '', activePackage: d.activePackage || '',
      totalBilledFormatted: d.totalBilledFormatted || '', totalPendingFormatted: d.totalPendingFormatted || '',
      paymentStatus: d.paymentStatus || '', paymentStatusBadge: d.paymentStatusBadge || '',
      billsCountText: d.billsCountText || '', hasRevisions: d.hasRevisions || false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data.companies.push(c);
    this._addActivity('company', `Added company <strong>${c.name}</strong>`);
    this._addNotification('company', `New company added: ${c.name}`);
    this._save(); this._notify();
    this._syncToFirestore('companies', c.id, c);
    return c;
  },
  updateCompany(id, d) {
    const c = this.getCompany(id); if (!c) return null;
    Object.assign(c, d, { updatedAt: new Date().toISOString() });
    this._addActivity('company', `Updated company <strong>${c.name}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('companies', c.id, c);
    return c;
  },
  deleteCompany(id) {
    const c = this.getCompany(id); if (!c) return;
    this._data.companies = this._data.companies.filter(x => x.id !== id);
    this._addActivity('company', `Deleted company <strong>${c.name}</strong>`);
    this._save(); this._notify();
    this._deleteFromFirestore('companies', id);
    return c;
  },

  // ─── Invoices (Billing) ───
  getInvoices() { return this._data.invoices || []; },
  getInvoice(id) { return (this._data.invoices || []).find(i => i.id === id); },
  createInvoice(d) {
    const inv = { id: d.id || this._genId(), ...d, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data.invoices.push(inv);
    this._addActivity('invoice', `Created invoice <strong>${inv.id}</strong> for ${inv.projectName || ''}`);
    this._save(); this._notify();
    this._syncToFirestore('invoices', inv.id, inv);
    return inv;
  },
  updateInvoice(id, d) {
    const inv = this.getInvoice(id); if (!inv) return null;
    Object.assign(inv, d, { updatedAt: new Date().toISOString() });
    this._addActivity('invoice', `Updated invoice <strong>${inv.id}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('invoices', inv.id, inv);
    return inv;
  },
  deleteInvoice(id) {
    const inv = this.getInvoice(id); if (!inv) return;
    this._data.invoices = this._data.invoices.filter(x => x.id !== id);
    this._addActivity('invoice', `Deleted invoice <strong>${inv.id}</strong>`);
    this._save(); this._notify();
    this._deleteFromFirestore('invoices', id);
  },

  // ─── Bank Guarantees ───
  getBankGuarantees() { return this._data.bankGuarantees || []; },
  getBankGuarantee(id) { return (this._data.bankGuarantees || []).find(b => b.id === id || b.ref === id); },
  createBankGuarantee(d) {
    const bg = { id: d.id || d.ref || this._genId(), ...d, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data.bankGuarantees.push(bg);
    this._addActivity('bankGuarantee', `Registered BG <strong>${bg.ref}</strong> — ${bg.projectName || ''}`);
    this._save(); this._notify();
    this._syncToFirestore('bankGuarantees', bg.id || bg.ref, bg);
    return bg;
  },
  updateBankGuarantee(id, d) {
    const bg = this.getBankGuarantee(id); if (!bg) return null;
    Object.assign(bg, d, { updatedAt: new Date().toISOString() });
    this._addActivity('bankGuarantee', `Updated BG <strong>${bg.ref}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('bankGuarantees', bg.id || bg.ref, bg);
    return bg;
  },
  deleteBankGuarantee(id) {
    const bg = this.getBankGuarantee(id); if (!bg) return;
    this._data.bankGuarantees = this._data.bankGuarantees.filter(x => x.id !== id && x.ref !== id);
    this._addActivity('bankGuarantee', `Deleted BG <strong>${bg.ref}</strong>`);
    this._save(); this._notify();
    this._deleteFromFirestore('bankGuarantees', bg.id || bg.ref);
  },

  // ─── DLP Records ───
  getDlpRecords() { return this._data.dlpRecords || []; },
  getDlpRecord(id) { return (this._data.dlpRecords || []).find(r => r.id === id); },
  createDlpRecord(d) {
    const r = { id: d.id || this._genId(), ...d, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
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
  getRetentionRecords() { return this._data.retentionRecords || []; },
  getRetentionRecord(id) { return (this._data.retentionRecords || []).find(r => r.id === id); },
  createRetentionRecord(d) {
    const r = { id: d.id || this._genId(), ...d, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
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

  // Milestones
  getMilestones(projectId) { return projectId ? this._data.milestones.filter(m => m.projectId === projectId) : this._data.milestones; },
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
    this._addActivity('milestone', `Created milestone <strong>${m.name}</strong>`);
    this._save(); this._notify();
    this._syncToFirestore('milestones', m.id, m);
    return m;
  },
  updateMilestone(id, d) {
    const m = this._data.milestones.find(x => x.id === id); if (!m) return null;
    Object.assign(m, d);
    this._addActivity('milestone', `Updated milestone <strong>${m.name}</strong>`);
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
  getIssues(projectId) { return projectId ? this._data.issues.filter(i => i.projectId === projectId) : this._data.issues; },
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
    this._addActivity('issue', `Created issue <strong>${i.title}</strong>${proj ? ` in ${proj.name}` : ''}`);
    this._addNotification('issue', `New issue: ${i.title}`);
    this._save(); this._notify();
    this._syncToFirestore('issues', i.id, i);
    return i;
  },
  updateIssue(id, d) {
    const i = this._data.issues.find(x => x.id === id); if (!i) return null;
    Object.assign(i, d, { updatedAt: new Date().toISOString() });
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

  // Notifications
  getNotifications() {
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    let notifs = this._data.notifications.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (user && user.role === 'AI Developer') {
      const userMemberId = user.memberId || (user.id === 'preet' ? 'm2' : user.id === 'mohit' ? 'm3' : user.id === 'hirvi' ? 'm4' : '');
      const myTasks = this.getTasks().filter(t => 
        t.assigneeId === user.id ||
        (userMemberId && t.assigneeId === userMemberId) ||
        (user.id === 'preet' && t.assigneeId === 'm2') ||
        (user.id === 'mohit' && t.assigneeId === 'm3') ||
        (user.id === 'hirvi' && t.assigneeId === 'm4') ||
        (user.memberId === 'm2' && t.assigneeId === 'preet') ||
        (user.memberId === 'm3' && t.assigneeId === 'mohit') ||
        (user.memberId === 'm4' && t.assigneeId === 'hirvi')
      );
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
  _addNotification(type, text) {
    this._data.notifications.unshift({ id: this._genId(), type, text, read: false, createdAt: new Date().toISOString() });
    if (this._data.notifications.length > 100) this._data.notifications = this._data.notifications.slice(0, 100);
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

    // Commercial entities
    const queryMatchesBGs = expandedTerms.has('bg') || expandedTerms.has('bank guarantee') || expandedTerms.has('guarantee') || expandedTerms.has('pbg') || expandedTerms.has('abg') || expandedTerms.has('mbg');
    const queryMatchesBilling = expandedTerms.has('billing') || expandedTerms.has('invoice') || expandedTerms.has('invoices') || expandedTerms.has('bill') || expandedTerms.has('payment');

    const sampleBGs = [];

    const sampleInvoices = [];

    const matchedBGs = sampleBGs.filter(bg => {
      if (queryMatchesBGs) return true;
      return isDirectMatch(bg.ref) || isDirectMatch(bg.projectName) || isDirectMatch(bg.type) || isDirectMatch(bg.amount);
    });

    const matchedInvoices = sampleInvoices.filter(inv => {
      if (queryMatchesBilling) return true;
      return isDirectMatch(inv.id) || isDirectMatch(inv.projectName) || isDirectMatch(inv.milestone) || isDirectMatch(inv.amount) || isDirectMatch(inv.status);
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
    const members = [
      { id: 'm1', name: 'Ayush Desai', role: 'AI Developer', designation: 'AI Core Engineering', color: '#2563EB', email: 'ayush@hintonn.com', initials: 'AD', activeTasks: 4, completedTasks: 12, hoursLogged: 186 },
      { id: 'm2', name: 'Preet Bhavsar', role: 'AI Developer', designation: 'AI Core Engineering', color: '#7C3AED', email: 'preet@hintonn.com', initials: 'PB', activeTasks: 3, completedTasks: 9, hoursLogged: 142 },
      { id: 'm3', name: 'Mohit Jain', role: 'Admin', designation: 'Executive PMO & Lead', color: '#4F46E5', email: 'mohit@hintonn.com', initials: 'MJ', activeTasks: 0, completedTasks: 28, hoursLogged: 310 },
      { id: 'm4', name: 'Hirvi Sanghavi', role: 'AI Developer', designation: 'LoRA Research & Telemetry', color: '#1D4ED8', email: 'hirvi@hintonn.com', initials: 'HS', activeTasks: 5, completedTasks: 7, hoursLogged: 124 },
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
    const companies = [];

    return { projects, tasks, members, milestones, issues, comments, notifications, activities,
      invoices, bankGuarantees, dlpRecords, retentionRecords, companies,
      settings: { workspaceName: 'Hintonn AI', currentUser: 'm3' } };
  }
};
