// ─── Hintonn PM Data Store (Integrated with Firebase Cloud Firestore) ───
const Store = {
  _data: null,
  _listeners: [],
  _db: null,
  _firestoreInitialized: false,

  init() {
    const defaultMembers = [
      { id: 'm1', name: 'Ayush Desai', role: 'AI Developer', color: '#2563EB', email: 'ayush@hintonn.com', initials: 'AD' },
      { id: 'm2', name: 'Preet Bhavsar', role: 'AI Developer', color: '#7C3AED', email: 'preet@hintonn.com', initials: 'PB' },
      { id: 'm3', name: 'Mohit Jain', role: 'Admin', color: '#4F46E5', email: 'mohit@hintonn.com', initials: 'MJ' },
      { id: 'm4', name: 'Hirvi Sanghavi', role: 'AI Developer', color: '#1D4ED8', email: 'hirvi@hintonn.com', initials: 'HS' },
    ];

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
          // If anonymous auth is disabled, still try — listeners will warn but won't block the app
          console.warn('[Hintonn Cloud Sync] Anonymous auth failed:', err.code, err.message);
          // Retry later in case Firebase Auth state changes (e.g. after Google login)
          setTimeout(() => this._initFirestoreSync(), 5000);
        });
        return;
      }

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

    } catch (err) {
      console.warn('[Hintonn Cloud Sync] Unable to initialize Firestore listeners:', err);
    }
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

    const projects = [
      { id: 'p1', name: 'Hintonn AI Operating System', description: 'Enterprise AI orchestration platform with autonomous agent workflows, multi-model routing, and real-time telemetry.', type: 'AI Platform', status: 'active', priority: 'high', progress: 68, startDate: '2026-06-01', endDate: '2026-12-31', memberIds: ['m1','m2','m3','m4'], taskIds: ['t1','t2','t3','t4','t5','t6','t7'], milestoneIds: ['ms1','ms2','ms3'], issueIds: ['i1','i2'], tags: ['ai','platform','core'], createdAt: '2026-06-01T09:00:00.000Z', updatedAt: '2026-09-20T14:30:00.000Z' },
      { id: 'p2', name: 'WhatsApp Business Automation', description: 'n8n-powered WhatsApp auto-reply engine with AI classification, scheduling, and Firebase-backed session management.', type: 'Automation', status: 'active', priority: 'high', progress: 45, startDate: '2026-07-15', endDate: '2026-11-30', memberIds: ['m1','m2','m4'], taskIds: ['t8','t9','t10','t11','t12'], milestoneIds: ['ms4','ms5'], issueIds: ['i3','i4'], tags: ['whatsapp','automation','n8n'], createdAt: '2026-07-15T10:00:00.000Z', updatedAt: '2026-09-18T16:45:00.000Z' },
      { id: 'p3', name: 'PMO Dashboard v2.0', description: 'Commercial EPC project management dashboard with billing, retention, BG tracking, and DLP timeline management.', type: 'Business', status: 'active', priority: 'medium', progress: 82, startDate: '2026-05-01', endDate: '2026-10-15', memberIds: ['m1','m3'], taskIds: ['t13','t14','t15','t16','t17','t18'], milestoneIds: ['ms6','ms7'], issueIds: ['i5'], tags: ['pmo','dashboard','epc'], createdAt: '2026-05-01T08:00:00.000Z', updatedAt: '2026-09-22T11:00:00.000Z' },
      { id: 'p4', name: 'LoRA Fine-tuning Pipeline', description: 'Automated LoRA adapter training pipeline with W&B experiment tracking, quantization (GGUF/GPTQ), and model registry.', type: 'ML/Ops', status: 'planning', priority: 'medium', progress: 15, startDate: '2026-09-01', endDate: '2027-02-28', memberIds: ['m2','m4'], taskIds: ['t19','t20','t21'], milestoneIds: ['ms8'], issueIds: [], tags: ['lora','ml','training'], createdAt: '2026-09-01T09:00:00.000Z', updatedAt: '2026-09-15T10:30:00.000Z' },
      { id: 'p5', name: 'Voice AI Integration', description: 'Deepgram Nova-3 STT + Aura TTS integration with LiveKit real-time voice calling and Groq LLM inference.', type: 'AI Platform', status: 'active', priority: 'high', progress: 35, startDate: '2026-08-01', endDate: '2026-12-15', memberIds: ['m1','m4'], taskIds: ['t22','t23','t24','t25'], milestoneIds: ['ms9'], issueIds: ['i6'], tags: ['voice','stt','tts','livekit'], createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-09-19T15:20:00.000Z' },
    ];

    const tasks = [
      { id: 't1', projectId: 'p1', title: 'Implement multi-model router with fallback chains', description: 'Build a router that selects optimal LLM (Groq/OpenAI/DeepSeek) based on latency, cost, and task complexity.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-06-05', dueDate: '2026-07-15', tags: ['core','llm'], order: 0, createdAt: '2026-06-05T09:00:00.000Z', updatedAt: '2026-07-10T16:00:00.000Z' },
      { id: 't2', projectId: 'p1', title: 'Build agent orchestration engine', description: 'Design and implement the autonomous agent workflow engine with parallel task execution.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-06-10', dueDate: '2026-08-01', tags: ['core','agents'], order: 1, createdAt: '2026-06-10T09:00:00.000Z', updatedAt: '2026-07-28T14:00:00.000Z' },
      { id: 't3', projectId: 'p1', title: 'Implement real-time telemetry dashboard', description: 'Build live metrics panel showing agent activity, model usage, token counts, and latency.', status: 'in-progress', priority: 'medium', assigneeId: 'm2', startDate: '2026-08-01', dueDate: '2026-09-30', tags: ['telemetry','ui'], order: 2, createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-09-15T11:00:00.000Z' },
      { id: 't4', projectId: 'p1', title: 'Design persistent memory system', description: 'Implement cross-session memory with context compression and skill-based knowledge storage.', status: 'done', priority: 'high', assigneeId: 'm2', startDate: '2026-07-01', dueDate: '2026-08-15', tags: ['memory','core'], order: 3, createdAt: '2026-07-01T09:00:00.000Z', updatedAt: '2026-08-10T17:00:00.000Z' },
      { id: 't5', projectId: 'p1', title: 'Build plugin system with hot-reload', description: 'Allow dynamic loading/unloading of skill plugins without restart.', status: 'todo', priority: 'medium', assigneeId: 'm1', startDate: '2026-09-15', dueDate: '2026-10-31', tags: ['plugins','core'], order: 4, createdAt: '2026-09-15T09:00:00.000Z', updatedAt: '2026-09-15T09:00:00.000Z' },
      { id: 't6', projectId: 'p1', title: 'Implement RBAC permission matrix', description: 'Role-based access control for Admin, PM, Developer, Finance, and Contractor roles.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-06-20', dueDate: '2026-07-20', tags: ['security','auth'], order: 5, createdAt: '2026-06-20T09:00:00.000Z', updatedAt: '2026-07-18T15:00:00.000Z' },
      { id: 't7', projectId: 'p1', title: 'Build universal search engine', description: 'Global search with synonym mapping, entity matching, and keyboard shortcut.', status: 'done', priority: 'medium', assigneeId: 'm2', startDate: '2026-07-10', dueDate: '2026-08-05', tags: ['search','ux'], order: 6, createdAt: '2026-07-10T10:00:00.000Z', updatedAt: '2026-08-03T12:00:00.000Z' },
      { id: 't8', projectId: 'p2', title: 'Setup n8n workflow engine on VPS', description: 'Deploy n8n on Hostinger VPS with webhook endpoints and MySQL backend.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-07-15', dueDate: '2026-07-30', tags: ['n8n','infra'], order: 0, createdAt: '2026-07-15T10:00:00.000Z', updatedAt: '2026-07-28T16:00:00.000Z' },
      { id: 't9', projectId: 'p2', title: 'Build AI message classifier', description: 'Classify incoming WhatsApp messages into categories using Groq Llama 3.3.', status: 'in-progress', priority: 'high', assigneeId: 'm2', startDate: '2026-08-01', dueDate: '2026-09-15', tags: ['ai','classification'], order: 1, createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-09-10T14:00:00.000Z' },
      { id: 't10', projectId: 'p2', title: 'Implement auto-reply scheduling engine', description: 'Time-based auto-reply rules with business hours, holidays, and escalation paths.', status: 'todo', priority: 'medium', assigneeId: 'm4', startDate: '2026-09-10', dueDate: '2026-10-15', tags: ['scheduling','automation'], order: 2, createdAt: '2026-09-10T09:00:00.000Z', updatedAt: '2026-09-10T09:00:00.000Z' },
      { id: 't11', projectId: 'p2', title: 'Build Firebase session manager', description: 'Persistent conversation sessions in Firestore with message history and context window.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-08-05', dueDate: '2026-08-25', tags: ['firebase','sessions'], order: 3, createdAt: '2026-08-05T09:00:00.000Z', updatedAt: '2026-08-22T17:00:00.000Z' },
      { id: 't12', projectId: 'p2', title: 'Design WhatsApp Business API integration', description: 'Meta Cloud API integration with template messages, media handling, and read receipts.', status: 'in-progress', priority: 'high', assigneeId: 'm2', startDate: '2026-08-15', dueDate: '2026-09-30', tags: ['whatsapp','api'], order: 4, createdAt: '2026-08-15T10:00:00.000Z', updatedAt: '2026-09-12T11:00:00.000Z' },
      { id: 't13', projectId: 'p3', title: 'Build commercial billing module', description: 'Multi-version invoice tracking with bill revision history and company-level aggregation.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-05-05', dueDate: '2026-06-15', tags: ['billing','commercial'], order: 0, createdAt: '2026-05-05T09:00:00.000Z', updatedAt: '2026-06-12T16:00:00.000Z' },
      { id: 't14', projectId: 'p3', title: 'Implement bank guarantee tracker', description: 'BG registration with expiry risk monitoring and batch renewal workflows.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-05-20', dueDate: '2026-06-30', tags: ['bg','commercial'], order: 1, createdAt: '2026-05-20T09:00:00.000Z', updatedAt: '2026-06-28T14:00:00.000Z' },
      { id: 't15', projectId: 'p3', title: 'Build retention summary ledger', description: 'Retention money tracking with tranche maturity schedules and DLP release triggers.', status: 'done', priority: 'medium', assigneeId: 'm1', startDate: '2026-06-01', dueDate: '2026-07-10', tags: ['retention','commercial'], order: 2, createdAt: '2026-06-01T09:00:00.000Z', updatedAt: '2026-07-08T15:00:00.000Z' },
      { id: 't16', projectId: 'p3', title: 'Implement DLP timeline management', description: 'Post-handover warranty tracking with defect claims, exit audits, and countdown timers.', status: 'done', priority: 'medium', assigneeId: 'm1', startDate: '2026-06-15', dueDate: '2026-07-25', tags: ['dlp','commercial'], order: 3, createdAt: '2026-06-15T09:00:00.000Z', updatedAt: '2026-07-22T12:00:00.000Z' },
      { id: 't17', projectId: 'p3', title: 'Add AI copilot assistant panel', description: 'Context-aware AI assistant with project insights, risk analysis, and natural language queries.', status: 'in-progress', priority: 'high', assigneeId: 'm2', startDate: '2026-08-01', dueDate: '2026-09-30', tags: ['ai','assistant'], order: 4, createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-09-18T14:00:00.000Z' },
      { id: 't18', projectId: 'p3', title: 'Build executive Gantt timeline', description: 'Interactive Gantt chart with drag-resize, dependency arrows, and critical path highlighting.', status: 'done', priority: 'medium', assigneeId: 'm1', startDate: '2026-07-01', dueDate: '2026-08-10', tags: ['timeline','gantt'], order: 5, createdAt: '2026-07-01T09:00:00.000Z', updatedAt: '2026-08-08T16:00:00.000Z' },
      { id: 't19', projectId: 'p4', title: 'Setup training infrastructure', description: 'Provision GPU instances, configure CUDA environment, and setup model storage.', status: 'todo', priority: 'high', assigneeId: 'm4', startDate: '2026-09-05', dueDate: '2026-09-30', tags: ['infra','gpu'], order: 0, createdAt: '2026-09-05T09:00:00.000Z', updatedAt: '2026-09-05T09:00:00.000Z' },
      { id: 't20', projectId: 'p4', title: 'Build dataset preparation pipeline', description: 'Automated data cleaning, formatting, and tokenization for LoRA training datasets.', status: 'in-progress', priority: 'high', assigneeId: 'm4', startDate: '2026-09-10', dueDate: '2026-10-15', tags: ['data','pipeline'], order: 1, createdAt: '2026-09-10T09:00:00.000Z', updatedAt: '2026-09-20T11:00:00.000Z' },
      { id: 't21', projectId: 'p4', title: 'Integrate W&B experiment tracking', description: 'Setup Weights & Biases logging for training runs, hyperparameter sweeps, and model comparisons.', status: 'todo', priority: 'medium', assigneeId: 'm2', startDate: '2026-10-01', dueDate: '2026-10-31', tags: ['wandb','tracking'], order: 2, createdAt: '2026-10-01T09:00:00.000Z', updatedAt: '2026-10-01T09:00:00.000Z' },
      { id: 't22', projectId: 'p5', title: 'Integrate Deepgram Nova-3 STT', description: 'Real-time speech-to-text with streaming transcription and speaker diarization.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-08-05', dueDate: '2026-08-25', tags: ['stt','deepgram'], order: 0, createdAt: '2026-08-05T09:00:00.000Z', updatedAt: '2026-08-22T16:00:00.000Z' },
      { id: 't23', projectId: 'p5', title: 'Integrate Deepgram Aura TTS', description: 'Natural voice synthesis with emotion control and streaming audio output.', status: 'in-progress', priority: 'high', assigneeId: 'm4', startDate: '2026-08-20', dueDate: '2026-09-20', tags: ['tts','deepgram'], order: 1, createdAt: '2026-08-20T09:00:00.000Z', updatedAt: '2026-09-15T14:00:00.000Z' },
      { id: 't24', projectId: 'p5', title: 'Build LiveKit voice room integration', description: 'Real-time voice calling with LiveKit Cloud, agent dispatch, and room management.', status: 'todo', priority: 'high', assigneeId: 'm1', startDate: '2026-09-15', dueDate: '2026-10-31', tags: ['livekit','voice'], order: 2, createdAt: '2026-09-15T09:00:00.000Z', updatedAt: '2026-09-15T09:00:00.000Z' },
      { id: 't25', projectId: 'p5', title: 'Implement Groq LLM for voice responses', description: 'Ultra-low latency inference with Groq Llama 3.3 70B for real-time voice conversations.', status: 'todo', priority: 'medium', assigneeId: 'm2', startDate: '2026-10-01', dueDate: '2026-11-15', tags: ['groq','llm','voice'], order: 3, createdAt: '2026-10-01T09:00:00.000Z', updatedAt: '2026-10-01T09:00:00.000Z' },
    ];

    const milestones = [
      { id: 'ms1', projectId: 'p1', name: 'Alpha Release — Core Agent Engine', dueDate: '2026-08-01', status: 'completed', taskIds: ['t1','t2'], createdAt: '2026-06-01T09:00:00.000Z' },
      { id: 'ms2', projectId: 'p1', name: 'Beta Release — Telemetry & Memory', dueDate: '2026-10-15', status: 'in-progress', taskIds: ['t3','t4','t5'], createdAt: '2026-06-01T09:00:00.000Z' },
      { id: 'ms3', projectId: 'p1', name: 'GA Release — Full Platform', dueDate: '2026-12-31', status: 'pending', taskIds: [], createdAt: '2026-06-01T09:00:00.000Z' },
      { id: 'ms4', projectId: 'p2', name: 'MVP — Basic Auto-Reply', dueDate: '2026-08-30', status: 'completed', taskIds: ['t8','t11'], createdAt: '2026-07-15T10:00:00.000Z' },
      { id: 'ms5', projectId: 'p2', name: 'v1.0 — AI Classification & Scheduling', dueDate: '2026-10-31', status: 'in-progress', taskIds: ['t9','t10','t12'], createdAt: '2026-07-15T10:00:00.000Z' },
      { id: 'ms6', projectId: 'p3', name: 'Commercial Modules Complete', dueDate: '2026-07-31', status: 'completed', taskIds: ['t13','t14','t15','t16'], createdAt: '2026-05-01T08:00:00.000Z' },
      { id: 'ms7', projectId: 'p3', name: 'AI Copilot Integration', dueDate: '2026-09-30', status: 'in-progress', taskIds: ['t17'], createdAt: '2026-05-01T08:00:00.000Z' },
      { id: 'ms8', projectId: 'p4', name: 'Infrastructure Ready', dueDate: '2026-09-30', status: 'pending', taskIds: ['t19'], createdAt: '2026-09-01T09:00:00.000Z' },
      { id: 'ms9', projectId: 'p5', name: 'Voice Pipeline Alpha', dueDate: '2026-09-30', status: 'in-progress', taskIds: ['t22','t23'], createdAt: '2026-08-01T10:00:00.000Z' },
    ];

    const issues = [
      { id: 'i1', projectId: 'p1', title: 'Memory leak in agent orchestrator after 500+ runs', description: 'Heap usage grows unbounded when agents spawn sub-agents recursively.', status: 'open', priority: 'high', assigneeId: 'm1', createdAt: '2026-09-10T14:00:00.000Z', updatedAt: '2026-09-15T10:00:00.000Z' },
      { id: 'i2', projectId: 'p1', title: 'Context compression drops skill references', description: 'When context exceeds token limit, compressed version loses skill file paths.', status: 'open', priority: 'medium', assigneeId: 'm2', createdAt: '2026-09-12T11:00:00.000Z', updatedAt: '2026-09-12T11:00:00.000Z' },
      { id: 'i3', projectId: 'p2', title: 'WhatsApp webhook timeout on slow networks', description: 'Meta requires 200 response within 5s. Current processing takes 6-8s.', status: 'in-progress', priority: 'high', assigneeId: 'm2', createdAt: '2026-09-08T16:00:00.000Z', updatedAt: '2026-09-14T09:00:00.000Z' },
      { id: 'i4', projectId: 'p2', title: 'Session context overflow on long conversations', description: 'Conversations > 50 messages cause context window overflow.', status: 'open', priority: 'medium', assigneeId: 'm4', createdAt: '2026-09-15T10:00:00.000Z', updatedAt: '2026-09-15T10:00:00.000Z' },
      { id: 'i5', projectId: 'p3', title: 'Billing amount parsing fails for 1Cr+ values', description: 'Indian crore/lakh notation parsing breaks when values exceed 1 crore.', status: 'closed', priority: 'high', assigneeId: 'm1', createdAt: '2026-08-20T14:00:00.000Z', updatedAt: '2026-08-25T16:00:00.000Z' },
      { id: 'i6', projectId: 'p5', title: 'Deepgram streaming cuts off mid-sentence', description: 'WebSocket connection drops after ~30s of continuous streaming transcription.', status: 'open', priority: 'high', assigneeId: 'm1', createdAt: '2026-09-18T11:00:00.000Z', updatedAt: '2026-09-18T11:00:00.000Z' },
    ];

    const comments = [
      { id: 'cmt1', taskId: 't1', authorId: 'm1', text: 'Router now supports Groq, OpenAI, and DeepSeek with automatic fallback. Latency under 200ms.', createdAt: '2026-07-08T14:00:00.000Z' },
      { id: 'cmt2', taskId: 't2', authorId: 'm1', text: 'Agent orchestrator handles up to 10 parallel sub-agents. Memory cleanup hooks added.', createdAt: '2026-07-25T16:00:00.000Z' },
      { id: 'cmt3', taskId: 't3', authorId: 'm2', text: 'Telemetry panel showing real-time agent activity. Need to add token usage charts next.', createdAt: '2026-09-10T11:00:00.000Z' },
      { id: 'cmt4', taskId: 't9', authorId: 'm2', text: 'Classification accuracy at 89% on test set. Working on edge cases for mixed-language messages.', createdAt: '2026-09-05T15:00:00.000Z' },
      { id: 'cmt5', taskId: 't17', authorId: 'm2', text: 'AI copilot now understands project context. Can answer questions about tasks, milestones, and billing.', createdAt: '2026-09-15T14:00:00.000Z' },
      { id: 'cmt6', taskId: 't13', authorId: 'm1', text: 'Billing module supports multi-version invoices with full revision history.', createdAt: '2026-06-10T16:00:00.000Z' },
      { id: 'cmt7', taskId: 't22', authorId: 'm1', text: 'Nova-3 streaming transcription working well. Average latency 180ms.', createdAt: '2026-08-20T16:00:00.000Z' },
      { id: 'cmt8', taskId: 't20', authorId: 'm4', text: 'Dataset pipeline handles JSONL, CSV, and Parquet formats. Auto-cleaning removes duplicates.', createdAt: '2026-09-18T11:00:00.000Z' },
    ];

    const activities = [
      { id: 'act1', type: 'task', html: 'Moved <strong>Implement multi-model router</strong> to done', createdAt: '2026-07-10T16:00:00.000Z' },
      { id: 'act2', type: 'task', html: 'Moved <strong>Build agent orchestration engine</strong> to done', createdAt: '2026-07-28T14:00:00.000Z' },
      { id: 'act3', type: 'milestone', html: 'Completed milestone <strong>Alpha Release — Core Agent Engine</strong>', createdAt: '2026-08-01T09:00:00.000Z' },
      { id: 'act4', type: 'project', html: 'Created project <strong>LoRA Fine-tuning Pipeline</strong>', createdAt: '2026-09-01T09:00:00.000Z' },
      { id: 'act5', type: 'invoice', html: 'Created invoice <strong>BILL-2026-005</strong> for PMO Dashboard v2.0', createdAt: '2026-09-10T09:00:00.000Z' },
      { id: 'act6', type: 'issue', html: 'Created issue <strong>Memory leak in agent orchestrator</strong>', createdAt: '2026-09-10T14:00:00.000Z' },
      { id: 'act7', type: 'task', html: 'Created task <strong>Build LiveKit voice room integration</strong>', createdAt: '2026-09-15T09:00:00.000Z' },
      { id: 'act8', type: 'bankGuarantee', html: 'Registered BG <strong>BG-2026-004</strong> — LoRA Fine-tuning Pipeline', createdAt: '2026-05-01T09:00:00.000Z' },
      { id: 'act9', type: 'retentionRecord', html: 'Created retention record for <strong>Voice AI Integration</strong>', createdAt: '2026-07-20T09:00:00.000Z' },
      { id: 'act10', type: 'dlpRecord', html: 'Created DLP record for <strong>PMO Dashboard v2.0</strong>', createdAt: '2026-08-02T09:00:00.000Z' },
    ];

    const notifications = [
      { id: 'n1', type: 'task', text: 'Task "Implement real-time telemetry dashboard" assigned to Preet moved to in-progress', read: false, createdAt: '2026-09-20T14:00:00.000Z' },
      { id: 'n2', type: 'issue', text: 'New issue: Memory leak in agent orchestrator after 500+ runs', read: false, createdAt: '2026-09-10T14:00:00.000Z' },
      { id: 'n3', type: 'invoice', text: 'Invoice BILL-2026-007 revised to v2.0 for Solaris Infra Concessions', read: false, createdAt: '2026-09-25T10:00:00.000Z' },
      { id: 'n4', type: 'project', text: 'New project created: LoRA Fine-tuning Pipeline', read: true, createdAt: '2026-09-01T09:00:00.000Z' },
      { id: 'n5', type: 'bankGuarantee', text: 'BG-2026-001 expiry in 25 days — Action needed (Critical)', read: false, createdAt: '2026-09-25T08:00:00.000Z' },
      { id: 'n6', type: 'task', text: 'Task "Build dataset preparation pipeline" assigned to Hirvi is in-progress', read: true, createdAt: '2026-09-20T11:00:00.000Z' },
      { id: 'n7', type: 'milestone', text: 'Milestone "MVP — Basic Auto-Reply" completed in WhatsApp Automation', read: true, createdAt: '2026-08-30T16:00:00.000Z' },
    ];

    const invoices = [
      { id: 'inv-001', companyId: 'c1', companyName: 'Apex Power & Energy Corp', projectId: 'p1', projectName: 'Hintonn AI Operating System', milestone: 'Milestone 1 — Foundation', billNumber: 'BILL-2026-001', version: 'v1.0', isRevised: false, status: 'paid', amountDue: '₹5,37,60,000', taxAmount: '₹96,76,800', deductions: '₹26,88,000', netPayable: '₹6,07,48,800', contractValue: '₹48,34,00,000', dueDate: '2026-07-15', paidDate: '2026-07-28', versionHistory: [{ version: 'v1.0', date: '2026-06-30', baseAmount: '₹5,37,60,000', tax: '₹96,76,800', deductions: '₹26,88,000', netPayable: '₹6,07,48,800', status: 'paid' }], createdAt: '2026-06-30T09:00:00.000Z', updatedAt: '2026-07-28T14:00:00.000Z' },
      { id: 'inv-002', companyId: 'c1', companyName: 'Apex Power & Energy Corp', projectId: 'p1', projectName: 'Hintonn AI Operating System', milestone: 'Milestone 2 — Core Platform', billNumber: 'BILL-2026-002', version: 'v2.1', isRevised: true, status: 'pending-client', amountDue: '₹10,75,20,000', taxAmount: '₹1,93,53,600', deductions: '₹53,76,000', netPayable: '₹12,14,97,600', contractValue: '₹48,34,00,000', dueDate: '2026-09-30', paidDate: '', versionHistory: [{ version: 'v1.0', date: '2026-08-15', baseAmount: '₹9,66,80,000', tax: '₹1,74,02,400', deductions: '₹48,34,000', netPayable: '₹10,92,48,400', status: 'revised' }, { version: 'v2.1', date: '2026-09-01', baseAmount: '₹10,75,20,000', tax: '₹1,93,53,600', deductions: '₹53,76,000', netPayable: '₹12,14,97,600', status: 'pending-client' }], createdAt: '2026-08-15T09:00:00.000Z', updatedAt: '2026-09-01T10:00:00.000Z' },
      { id: 'inv-003', companyId: 'c2', companyName: 'Vertex Grid Utilities Ltd', projectId: 'p2', projectName: 'WhatsApp Business Automation', milestone: 'Phase 1 — API Integration', billNumber: 'BILL-2026-003', version: 'v1.0', isRevised: false, status: 'paid', amountDue: '₹5,29,20,000', taxAmount: '₹95,25,600', deductions: '₹26,46,000', netPayable: '₹5,97,99,600', contractValue: '₹28,56,00,000', dueDate: '2026-08-15', paidDate: '2026-08-30', versionHistory: [{ version: 'v1.0', date: '2026-07-31', baseAmount: '₹5,29,20,000', tax: '₹95,25,600', deductions: '₹26,46,000', netPayable: '₹5,97,99,600', status: 'paid' }], createdAt: '2026-07-31T09:00:00.000Z', updatedAt: '2026-08-30T16:00:00.000Z' },
      { id: 'inv-004', companyId: 'c2', companyName: 'Vertex Grid Utilities Ltd', projectId: 'p2', projectName: 'WhatsApp Business Automation', milestone: 'Phase 2 — AI Engine', billNumber: 'BILL-2026-004', version: 'v1.0', isRevised: false, status: 'under-certification', amountDue: '₹5,29,20,000', taxAmount: '₹95,25,600', deductions: '₹26,46,000', netPayable: '₹5,97,99,600', contractValue: '₹28,56,00,000', dueDate: '2026-10-15', paidDate: '', versionHistory: [{ version: 'v1.0', date: '2026-09-15', baseAmount: '₹5,29,20,000', tax: '₹95,25,600', deductions: '₹26,46,000', netPayable: '₹5,97,99,600', status: 'under-certification' }], createdAt: '2026-09-15T09:00:00.000Z', updatedAt: '2026-09-15T09:00:00.000Z' },
      { id: 'inv-005', companyId: 'c3', companyName: 'Northern Powertech Systems', projectId: 'p3', projectName: 'PMO Dashboard v2.0', milestone: 'Milestone 1 — Commercial Modules', billNumber: 'BILL-2026-005', version: 'v1.0', isRevised: false, status: 'pending-client', amountDue: '₹2,35,20,000', taxAmount: '₹42,33,600', deductions: '₹11,76,000', netPayable: '₹2,65,77,600', contractValue: '₹17,64,00,000', dueDate: '2026-10-30', paidDate: '', versionHistory: [{ version: 'v1.0', date: '2026-09-10', baseAmount: '₹2,35,20,000', tax: '₹42,33,600', deductions: '₹11,76,000', netPayable: '₹2,65,77,600', status: 'pending-client' }], createdAt: '2026-09-10T09:00:00.000Z', updatedAt: '2026-09-10T09:00:00.000Z' },
      { id: 'inv-006', companyId: 'c4', companyName: 'Solaris Infra Concessions', projectId: 'p4', projectName: 'LoRA Fine-tuning Pipeline', milestone: 'Phase 1 — Infrastructure', billNumber: 'BILL-2026-006', version: 'v1.0', isRevised: false, status: 'paid', amountDue: '₹4,36,80,000', taxAmount: '₹78,62,400', deductions: '₹21,84,000', netPayable: '₹4,93,58,400', contractValue: '₹12,60,00,000', dueDate: '2026-08-30', paidDate: '2026-09-12', versionHistory: [{ version: 'v1.0', date: '2026-08-15', baseAmount: '₹4,36,80,000', tax: '₹78,62,400', deductions: '₹21,84,000', netPayable: '₹4,93,58,400', status: 'paid' }], createdAt: '2026-08-15T09:00:00.000Z', updatedAt: '2026-09-12T10:00:00.000Z' },
      { id: 'inv-007', companyId: 'c4', companyName: 'Solaris Infra Concessions', projectId: 'p4', projectName: 'LoRA Fine-tuning Pipeline', milestone: 'Phase 2 — Training Pipeline', billNumber: 'BILL-2026-007', version: 'v2.0', isRevised: true, status: 'pending-client', amountDue: '₹4,36,80,000', taxAmount: '₹78,62,400', deductions: '₹21,84,000', netPayable: '₹4,93,58,400', contractValue: '₹12,60,00,000', dueDate: '2026-11-30', paidDate: '', versionHistory: [{ version: 'v1.0', date: '2026-09-20', baseAmount: '₹3,78,00,000', tax: '₹68,04,000', deductions: '₹18,90,000', netPayable: '₹4,27,14,000', status: 'revised' }, { version: 'v2.0', date: '2026-09-25', baseAmount: '₹4,36,80,000', tax: '₹78,62,400', deductions: '₹21,84,000', netPayable: '₹4,93,58,400', status: 'pending-client' }], createdAt: '2026-09-20T09:00:00.000Z', updatedAt: '2026-09-25T10:00:00.000Z' },
      { id: 'inv-008', companyId: 'c5', companyName: 'Metro Rail Transmission Authority', projectId: 'p5', projectName: 'Voice AI Integration', milestone: 'Final Settlement', billNumber: 'BILL-2026-008', version: 'v1.0', isRevised: false, status: 'paid', amountDue: '₹5,46,00,000', taxAmount: '₹98,28,000', deductions: '₹27,30,000', netPayable: '₹6,16,98,000', contractValue: '₹11,76,00,000', dueDate: '2026-07-15', paidDate: '2026-07-20', versionHistory: [{ version: 'v1.0', date: '2026-06-30', baseAmount: '₹5,46,00,000', tax: '₹98,28,000', deductions: '₹27,30,000', netPayable: '₹6,16,98,000', status: 'paid' }], createdAt: '2026-06-30T09:00:00.000Z', updatedAt: '2026-07-20T14:00:00.000Z' },
    ];

    const bankGuarantees = [
      { id: 'bg1', ref: 'BG-2026-001', type: 'Performance BG (PBG)', projectId: 'p1', projectName: 'Hintonn AI Operating System', companyName: 'Apex Power & Energy Corp', amount: '₹4,83,40,000', issuedDate: '2026-01-20', expiryDate: '2026-10-20', daysLeft: 25, status: 'active', risk: 'critical', issuingBank: 'State Bank of India', beneficiary: 'Apex Power & Energy Corp', createdAt: '2026-01-20T09:00:00.000Z', updatedAt: '2026-09-25T10:00:00.000Z' },
      { id: 'bg2', ref: 'BG-2026-002', type: 'Advance Payment BG (ABG)', projectId: 'p2', projectName: 'WhatsApp Business Automation', companyName: 'Vertex Grid Utilities Ltd', amount: '₹2,85,60,000', issuedDate: '2026-03-15', expiryDate: '2026-12-15', daysLeft: 81, status: 'active', risk: 'safe', issuingBank: 'HDFC Bank', beneficiary: 'Vertex Grid Utilities Ltd', createdAt: '2026-03-15T09:00:00.000Z', updatedAt: '2026-09-25T10:00:00.000Z' },
      { id: 'bg3', ref: 'BG-2026-003', type: 'Performance BG (PBG)', projectId: 'p3', projectName: 'PMO Dashboard v2.0', companyName: 'Northern Powertech Systems', amount: '₹1,76,40,000', issuedDate: '2026-04-10', expiryDate: '2026-11-10', daysLeft: 46, status: 'active', risk: 'warning', issuingBank: 'ICICI Bank', beneficiary: 'Northern Powertech Systems', createdAt: '2026-04-10T09:00:00.000Z', updatedAt: '2026-09-25T10:00:00.000Z' },
      { id: 'bg4', ref: 'BG-2026-004', type: 'Mobilization BG (MBG)', projectId: 'p4', projectName: 'LoRA Fine-tuning Pipeline', companyName: 'Solaris Infra Concessions', amount: '₹1,26,00,000', issuedDate: '2026-05-01', expiryDate: '2026-11-01', daysLeft: 37, status: 'active', risk: 'warning', issuingBank: 'Axis Bank', beneficiary: 'Solaris Infra Concessions', createdAt: '2026-05-01T09:00:00.000Z', updatedAt: '2026-09-25T10:00:00.000Z' },
      { id: 'bg5', ref: 'BG-2026-005', type: 'Defects Liability BG (DLP)', projectId: 'p5', projectName: 'Voice AI Integration', companyName: 'Metro Rail Transmission Authority', amount: '₹1,17,60,000', issuedDate: '2026-02-01', expiryDate: '2026-08-01', daysLeft: 0, status: 'released', risk: 'safe', issuingBank: 'Punjab National Bank', beneficiary: 'Metro Rail Transmission Authority', createdAt: '2026-02-01T09:00:00.000Z', updatedAt: '2026-08-01T09:00:00.000Z' },
    ];

    const dlpRecords = [
      { id: 'dlp1', projectId: 'p1', projectName: 'Hintonn AI Operating System', packageCode: 'PKG-01', companyName: 'Apex Power & Energy Corp', handoverDate: '2026-06-30', dlpStartDate: '2026-07-01', dlpExpiry: '2027-06-30', dlpPeriod: '12 months', countdownDays: 278, readiness: 65, warrantyValue: '₹4,83,40,000', openDefects: 3, resolvedDefects: 7, statusLabel: 'In Progress', lastInspection: '2026-09-15', nextInspection: '2026-12-15', createdAt: '2026-07-01T09:00:00.000Z', updatedAt: '2026-09-20T10:00:00.000Z' },
      { id: 'dlp2', projectId: 'p5', projectName: 'Voice AI Integration', packageCode: 'PKG-05', companyName: 'Metro Rail Transmission Authority', handoverDate: '2026-05-15', dlpStartDate: '2026-05-16', dlpExpiry: '2026-11-15', dlpPeriod: '6 months', countdownDays: 51, readiness: 92, warrantyValue: '₹1,17,60,000', openDefects: 1, resolvedDefects: 11, statusLabel: 'Exit Pending', lastInspection: '2026-09-01', nextInspection: '2026-10-15', createdAt: '2026-05-16T09:00:00.000Z', updatedAt: '2026-09-20T10:00:00.000Z' },
      { id: 'dlp3', projectId: 'p3', projectName: 'PMO Dashboard v2.0', packageCode: 'PKG-03', companyName: 'Northern Powertech Systems', handoverDate: '2026-08-01', dlpStartDate: '2026-08-02', dlpExpiry: '2027-08-01', dlpPeriod: '12 months', countdownDays: 310, readiness: 40, warrantyValue: '₹1,76,40,000', openDefects: 5, resolvedDefects: 3, statusLabel: 'Active Monitoring', lastInspection: '2026-09-10', nextInspection: '2026-12-10', createdAt: '2026-08-02T09:00:00.000Z', updatedAt: '2026-09-20T10:00:00.000Z' },
    ];

    const retentionRecords = [
      { id: 'ret1', projectId: 'p1', projectName: 'Hintonn AI Operating System', packageCode: 'PKG-01', companyName: 'Apex Power & Energy Corp', retentionPct: '5%', retentionHeld: '₹2,41,70,000', totalContractValue: '₹48,34,00,000', trancheNumber: 1, releaseDueDate: '2027-01-15', status: 'on-schedule', statusLabel: 'On Schedule', dlpLinked: true, createdAt: '2026-06-30T09:00:00.000Z', updatedAt: '2026-09-20T10:00:00.000Z' },
      { id: 'ret2', projectId: 'p2', projectName: 'WhatsApp Business Automation', packageCode: 'PKG-02', companyName: 'Vertex Grid Utilities Ltd', retentionPct: '5%', retentionHeld: '₹1,42,80,000', totalContractValue: '₹28,56,00,000', trancheNumber: 1, releaseDueDate: '2027-03-15', status: 'on-schedule', statusLabel: 'On Schedule', dlpLinked: true, createdAt: '2026-08-30T09:00:00.000Z', updatedAt: '2026-09-20T10:00:00.000Z' },
      { id: 'ret3', projectId: 'p3', projectName: 'PMO Dashboard v2.0', packageCode: 'PKG-03', companyName: 'Northern Powertech Systems', retentionPct: '10%', retentionHeld: '₹1,76,40,000', totalContractValue: '₹17,64,00,000', trancheNumber: 1, releaseDueDate: '2026-10-30', status: 'release-initiated', statusLabel: 'Release Initiated', dlpLinked: false, createdAt: '2026-09-10T09:00:00.000Z', updatedAt: '2026-09-25T10:00:00.000Z' },
      { id: 'ret4', projectId: 'p5', projectName: 'Voice AI Integration', packageCode: 'PKG-05', companyName: 'Metro Rail Transmission Authority', retentionPct: '5%', retentionHeld: '₹58,80,000', totalContractValue: '₹11,76,00,000', trancheNumber: 2, releaseDueDate: '2026-11-15', status: 'under-review', statusLabel: 'Under Review', dlpLinked: true, createdAt: '2026-07-20T09:00:00.000Z', updatedAt: '2026-09-20T10:00:00.000Z' },
    ];

    const companies = [
      { id: 'c1', name: 'Apex Power & Energy Corp', contactPerson: 'Rohan Verma (VP Commercial)', totalContractValue: '₹48,34,00,000', activePackage: 'PKG-01 · Core EPC Phase 1', totalBilledFormatted: '₹16,12,80,000', totalPendingFormatted: '₹6,04,80,000', paymentStatus: 'Partially Paid', paymentStatusBadge: 'badge-medium', billsCountText: '3 Bills Issued · 2 Revisions', hasRevisions: true },
      { id: 'c2', name: 'Vertex Grid Utilities Ltd', contactPerson: 'Deepak Shinde (Lead Engineer)', totalContractValue: '₹28,56,00,000', activePackage: 'PKG-02 · Substation Package', totalBilledFormatted: '₹10,58,40,000', totalPendingFormatted: '₹3,44,40,000', paymentStatus: 'Partially Paid', paymentStatusBadge: 'badge-medium', billsCountText: '2 Bills Issued · 1 Revision', hasRevisions: true },
      { id: 'c3', name: 'Northern Powertech Systems', contactPerson: 'Sunil Mehta (Procurement Head)', totalContractValue: '₹17,64,00,000', activePackage: 'PKG-03 · Utilities & Balance of Plant', totalBilledFormatted: '₹2,35,20,000', totalPendingFormatted: '₹2,35,20,000', paymentStatus: 'Pending Release', paymentStatusBadge: 'badge-review', billsCountText: '1 Active Bill', hasRevisions: false },
      { id: 'c4', name: 'Solaris Infra Concessions', contactPerson: 'Vikram Sen (Director Projects)', totalContractValue: '₹12,60,00,000', activePackage: 'PKG-04 · SCADA & Grid Automation', totalBilledFormatted: '₹8,73,60,000', totalPendingFormatted: '₹1,59,60,000', paymentStatus: 'Partially Paid', paymentStatusBadge: 'badge-medium', billsCountText: '2 Active Bills · 1 Revision', hasRevisions: true },
      { id: 'c5', name: 'Metro Rail Transmission Authority', contactPerson: 'Anand Kulkarni (General Manager)', totalContractValue: '₹11,76,00,000', activePackage: 'PKG-05 · Civil & Site Facilities', totalBilledFormatted: '₹5,46,00,000', totalPendingFormatted: '₹0', paymentStatus: 'Paid', paymentStatusBadge: 'badge-completed', billsCountText: '1 Settled Bill', hasRevisions: false },
    ];

    return { projects, tasks, members, milestones, issues, comments, notifications, activities,
      invoices, bankGuarantees, dlpRecords, retentionRecords, companies,
      settings: { workspaceName: 'Hintonn AI', currentUser: 'm3' } };
  }
};
