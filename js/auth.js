// ─── Hintonn PM Authentication & Session Management ───
// Google OAuth + Email/Password login. No phone/mobile login.
// Admin = mohithintonn@gmail.com ONLY.
const Auth = {
  // Pre-configured User Database (existing users are pre-approved)
  users: [
    {
      id: 'mohit',
      memberId: 'm3',
      loginId: 'Mohit',
      name: 'Mohit Jain',
      role: 'Admin',
      email: 'mohithintonn@gmail.com',
      googleEmail: 'mohithintonn@gmail.com',
      initials: 'MJ',
      color: '#4F46E5',
      approved: true
    },
    {
      id: 'admin_hintonn',
      memberId: 'm3',
      loginId: 'admin',
      name: 'Mohit Jain',
      role: 'Admin',
      email: 'admin@hintonn.com',
      googleEmail: 'mohithintonn@gmail.com',
      initials: 'MJ',
      color: '#4F46E5',
      approved: true
    },
    {
      id: 'preet',
      memberId: 'm2',
      loginId: 'Preet',
      name: 'Preet Bhavsar',
      role: 'AI Developer',
      email: 'preethintonn@gmail.com',
      googleEmail: 'preethintonn@gmail.com',
      initials: 'PB',
      color: '#2563EB',
      approved: true
    },
    {
      id: 'hirvi',
      memberId: 'm1',
      loginId: 'Hirvi',
      name: 'Hirvi Sanghavi',
      role: 'AI Developer',
      email: 'hirvihintonn@gmail.com',
      googleEmail: 'hirvihintonn@gmail.com',
      initials: 'HS',
      color: '#059669',
      approved: true
    },
    {
      id: 'mohit_dev',
      memberId: 'm_1790601440429',
      loginId: 'MohitDev',
      name: 'MOHIT JAIN',
      role: 'AI Developer',
      email: 'mohitjain12104@gmail.com',
      googleEmail: 'mohitjain12104@gmail.com',
      initials: 'MJ',
      color: '#D97706',
      approved: true
    }
  ],

  currentUser: null,
  _sessionFallback: {},

  _getSessionStorage() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage;
      }
      if (typeof sessionStorage !== 'undefined') {
        return sessionStorage;
      }
    } catch (e) {}
    if (typeof localStorage !== 'undefined' && typeof window !== 'undefined' && !window.sessionStorage) {
      return localStorage;
    }
    return {
      getItem: (k) => Auth._sessionFallback[k] || null,
      setItem: (k, v) => { Auth._sessionFallback[k] = String(v); },
      removeItem: (k) => { delete Auth._sessionFallback[k]; },
      clear: () => { Auth._sessionFallback = {}; }
    };
  },

  _getSessionUser() {
    try {
      const storage = this._getSessionStorage();
      if (!storage) return null;
      const raw = storage.getItem('hintonn-current-user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  _setSessionUser(u) {
    try {
      const storage = this._getSessionStorage();
      if (storage && u) {
        storage.setItem('hintonn-current-user', JSON.stringify(u));
      }
    } catch (e) {}
    // Guarantee no persistent session remains in localStorage
    try { localStorage.removeItem('hintonn-current-user'); } catch (e) {}
  },

  _clearSessionUser() {
    try {
      const storage = this._getSessionStorage();
      if (storage) {
        storage.removeItem('hintonn-current-user');
      }
    } catch (e) {}
    try { localStorage.removeItem('hintonn-current-user'); } catch (e) {}
  },

  getCurrentUser() {
    if (this.currentUser) this._enforceAdminRole(this.currentUser);
    return this.currentUser;
  },
  setCurrentUser(u) {
    this.currentUser = u;
    if (u) {
      this._setSessionUser(u);
    } else {
      this._clearSessionUser();
    }
  },
  isAuthenticated() {
    return !!(this.currentUser && this.currentUser.approved !== false && this.currentUser.revoked !== true);
  },
  isLoggedIn() {
    return this.isAuthenticated();
  },

  // ─── Admin email whitelist — ONLY this email gets Admin role ───
  _ADMIN_EMAILS: ['mohithintonn@gmail.com', 'admin@hintonn.com'],

  // RBAC Permission Matrix based on Role
  permissions: {
    dashboard: ['PM', 'ADMIN', 'PMO', 'FIN', 'CTR', 'DEV'],
    projects: ['PM', 'ADMIN', 'PMO', 'FIN', 'CTR', 'DEV'],
    'project-detail': ['PM', 'ADMIN', 'PMO', 'FIN', 'CTR', 'DEV'],
    tasks: ['PM', 'ADMIN', 'PMO', 'FIN', 'CTR', 'DEV'],
    calendar: ['PM', 'ADMIN', 'PMO', 'FIN', 'CTR', 'DEV'],
    team: ['PM', 'ADMIN', 'PMO', 'FIN', 'CTR', 'DEV'],
    reports: ['PM', 'ADMIN', 'PMO', 'FIN', 'CTR', 'DEV'],
    issues: ['PM', 'ADMIN', 'PMO', 'FIN', 'CTR', 'DEV'],
    milestones: ['PM', 'ADMIN', 'PMO', 'FIN', 'CTR', 'DEV'],
    'ai-assistant': ['PM', 'ADMIN', 'PMO', 'FIN', 'CTR', 'DEV'],
    connectors: ['PM', 'ADMIN', 'PMO', 'FIN', 'CTR', 'DEV'],
    notifications: ['PM', 'ADMIN', 'PMO', 'FIN', 'CTR', 'DEV'],
    billing: ['PM', 'ADMIN', 'PMO', 'FIN'],
    invoices: ['PM', 'ADMIN', 'PMO', 'FIN'],
    retention: ['ADMIN', 'PMO', 'FIN'],
    bg: ['ADMIN', 'PMO', 'FIN', 'CTR'],
    'bank-guarantees': ['ADMIN', 'PMO', 'FIN', 'CTR'],
    dlp: ['PM', 'ADMIN', 'PMO'],
    'dlp-timelines': ['PM', 'ADMIN', 'PMO'],
    settings: ['ADMIN'],
    'audit-logs': ['ADMIN'],
    timeline: ['ADMIN'],
    'user-approvals': ['ADMIN']
  },

  hasAccess(module) {
    if (!this.currentUser) return false;
    const roleMap = {
      'Admin': 'ADMIN',
      'AI Developer': 'DEV',
      'Project Manager': 'PM',
      'PMO': 'PMO',
      'Finance': 'FIN',
      'Contractor': 'CTR'
    };
    const userRoleCode = roleMap[this.currentUser.role] || 'DEV';
    const allowedRoles = this.permissions[module];
    if (!allowedRoles) return true;
    return allowedRoles.includes(userRoleCode);
  },

  _enforceAdminRole(user) {
    if (!user) return user;
    const emailLower = (user.email || '').toLowerCase();
    const googleEmailLower = (user.googleEmail || '').toLowerCase();
    
    const isAdmin = this._ADMIN_EMAILS.includes(emailLower) || this._ADMIN_EMAILS.includes(googleEmailLower);

    if (isAdmin) {
      user.role = 'Admin';
      user.approved = true;
      user.title = user.title || 'Executive PMO & Lead';
    }
    return user;
  },

  init() {
    try {
      const AUTH_VERSION = 'v9-tab-session';
      if (localStorage.getItem('hintonn-auth-version') !== AUTH_VERSION) {
        localStorage.setItem('hintonn-auth-version', AUTH_VERSION);
      }

      // ── CRITICAL: Purge any legacy localStorage session to enforce login on start ──
      try { localStorage.removeItem('hintonn-current-user'); } catch (e) {}

      const savedUsers = localStorage.getItem('hintonn-users-db');
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers);
          parsed.forEach(saved => {
            const exists = this.users.find(u => u.id === saved.id || (u.email && saved.email && u.email.toLowerCase() === saved.email.toLowerCase()));
            if (exists) {
              if (saved.approved !== undefined) exists.approved = saved.approved;
              if (saved.rejected !== undefined) exists.rejected = saved.rejected;
              if (saved.revoked !== undefined) exists.revoked = saved.revoked;
              if (saved.revokedAt !== undefined) exists.revokedAt = saved.revokedAt;
              if (saved.revokedBy !== undefined) exists.revokedBy = saved.revokedBy;
              if (saved.reviewedBy !== undefined) exists.reviewedBy = saved.reviewedBy;
              if (saved.reviewedAt !== undefined) exists.reviewedAt = saved.reviewedAt;
              if (saved.approvedDate !== undefined) exists.approvedDate = saved.approvedDate;
              if (saved.rejectedDate !== undefined) exists.rejectedDate = saved.rejectedDate;
              delete saved.password; // never persist credentials client-side
              this._enforceAdminRole(exists);
            } else {
              this.users.push(saved);
            }
          });
        } catch(e) {}
      }

      // ── Tab Session Check: Only restore user if active in current tab's sessionStorage ──
      const savedUser = this._getSessionUser();
      if (savedUser) {
        let match = this.users.find(u => 
          u.id === savedUser.id || 
          (u.email && savedUser.email && u.email.toLowerCase() === savedUser.email.toLowerCase()) ||
          (u.googleEmail && savedUser.email && u.googleEmail.toLowerCase() === savedUser.email.toLowerCase())
        );
        if (!match && savedUser && (savedUser.email || savedUser.name)) {
          match = savedUser;
          this.users.push(match);
        }
        if (match) {
          this._enforceAdminRole(match);
          if (match.approved === false || match.revoked === true) {
            this.currentUser = null;
            this._clearSessionUser();
          } else {
            this.currentUser = match;
            if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
              Store._data.settings.currentUser = match.memberId || 'm1';
            }
            this._setSessionUser(match);

            // ── Ensure non-admin user has a member record in Store ──
            if (typeof Store !== 'undefined' && typeof Store.getMembers === 'function' && match.role !== 'Admin') {
              const members = Store.getMembers();
              const existingMember = members.find(m =>
                m.id === match.memberId ||
                (m.email && m.email.toLowerCase() === (match.email || '').toLowerCase())
              );
              if (!existingMember) {
                Store.createMember({
                  id: match.memberId || ('m_' + Date.now()),
                  name: match.name,
                  role: 'AI Developer',
                  designation: 'AI Developer',
                  email: match.email,
                  initials: match.initials || match.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
                  color: match.color || '#2563EB'
                });
              } else if (existingMember.id !== match.memberId) {
                match.memberId = existingMember.id;
                this._setSessionUser(match);
              }
            }
          }
        } else {
          this.currentUser = null;
          this._clearSessionUser();
        }
      } else {
        // Tab closed or fresh start: prompt for login every time!
        this.currentUser = null;
        this._clearSessionUser();
        if (typeof FirebaseAuth !== 'undefined' && typeof FirebaseAuth.signOut === 'function') {
          FirebaseAuth.signOut().catch(() => {});
        }
      }
    } catch (e) {
      this.currentUser = null;
    }
  },

  _saveUserDb() {
    try {
      localStorage.setItem('hintonn-users-db', JSON.stringify(this.users));
    } catch(e) {}
  },

  // ─── Direct ID / Password Login (Firebase Auth + Firestore + Local fallback) ───
  async login(loginIdOrEmail, password) {
    const raw = (loginIdOrEmail || '').trim().toLowerCase();
    const rawPass = password || '';
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);

    if (!raw || !rawPass) {
      return { success: false, error: 'Please enter both login ID/email and password.' };
    }

    // 1. If valid email and FirebaseAuth is initialized, try Firebase Authentication
    if (isEmail && typeof FirebaseAuth !== 'undefined' && typeof FirebaseAuth.signInEmail === 'function') {
      try {
        const fbRes = await FirebaseAuth.signInEmail(raw, rawPass);
        if (fbRes) {
          const fbUser = fbRes.user || fbRes;
          if (fbRes.revoked === true || fbUser.revoked === true) {
            return { success: false, error: 'Your access has been revoked by an administrator. Please contact admin to regain access.' };
          }
          if (fbRes.approved === false || fbUser.approved === false) {
            return { success: false, error: 'Your account is pending admin approval. Please wait for an administrator to approve your access.', pendingApproval: true, user: fbUser };
          }
          this._enforceAdminRole(fbUser);
          this.currentUser = fbUser;
          this._setSessionUser(fbUser);
          if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
            Store._data.settings.currentUser = fbUser.memberId || 'm1';
            if (typeof Store._save === 'function') Store._save();
          }
          return { success: true, user: fbUser };
        }
      } catch (fbErr) {
        console.warn('[Auth] Firebase Auth signInEmail fallback:', fbErr.message || fbErr);
      }
    }

    // 2. Local-only login IDs are no longer supported — credentials are
    //    verified exclusively by Firebase Authentication (step 1). This
    //    removes the client-side password database entirely.
    if (!isEmail) {
      return { success: false, error: 'Please sign in with your registered email address. Local login IDs are no longer supported.' };
    }

    // 3. Look up the local profile registry (roles/approval metadata only — no credentials).
    let user = this.users.find(u =>
      (u.email && u.email.toLowerCase() === raw) ||
      (u.googleEmail && u.googleEmail.toLowerCase() === raw)
    );

    if (!user) {
      return { success: false, error: 'No account found with this email.' };
    }

    this._enforceAdminRole(user);

    // ── BLOCK revoked users from logging in ──
    if (user.revoked === true) {
      return { success: false, error: 'Your access has been revoked by an administrator. Please contact admin to regain access.' };
    }

    // ── If locally unapproved, check Firestore for real-time approval status ──
    if (user.approved === false) {
      const firestoreApproved = await this._checkApprovalInFirestore(user.email || user.googleEmail);
      if (firestoreApproved) {
        user.approved = true;
        this._saveUserDb();
      } else {
        return { success: false, error: 'Your account is pending admin approval. Please wait for an administrator to approve your access.', pendingApproval: true, user: user };
      }
    }

    this.currentUser = user;
    this._setSessionUser(user);

    if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
      Store._data.settings.currentUser = user.memberId || 'm1';
      if (typeof Store._save === 'function') Store._save();
    }

    // ── Ensure non-admin user has a member record in Store ──
    if (typeof Store !== 'undefined' && Store._data && Array.isArray(Store._data.members) && typeof Store.getMembers === 'function' && user.role !== 'Admin') {
      const members = Store.getMembers();
      const existingMember = members.find(m =>
        m.id === user.memberId ||
        (m.email && m.email.toLowerCase() === (user.email || '').toLowerCase())
      );
      if (!existingMember) {
        Store.createMember({
          id: user.memberId || ('m_' + Date.now()),
          name: user.name,
          role: user.role || 'AI Developer',
          designation: user.role || 'AI Developer',
          email: user.email,
          initials: user.initials || user.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
          color: user.color || '#2563EB'
        });
      }
    }

    return { success: true, user };
  },

  // ─── Check Firestore for real-time approval status ───
  async _checkApprovalInFirestore(email) {
    if (!email || typeof firebase === 'undefined' || !firebase.firestore) return false;
    try {
      const snap = await firebase.firestore().collection('users').where('email', '==', email.toLowerCase()).get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        const data = doc.data();
        return data.isActive === true;
      }
    } catch (e) {
      console.warn('[Auth] Firestore approval check failed:', e.message || e);
    }
    return false;
  },

  // ─── Google Login Approval Request Store ───
  getGoogleApprovalRequests() {
    return this.users.filter(u => u.requestSource === 'Google OAuth' || u.id.startsWith('goog_') || u.id.startsWith('req_goog')).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email || u.googleEmail,
      avatar: u.avatar || u.initials,
      color: u.color,
      role: u.role,
      department: u.department || 'Commercial PMO & Project Delivery',
      reason: 'Google Single Sign-On Access Request',
      requestedAt: u.requestDate || new Date().toISOString(),
      status: u.revoked ? 'revoked' : (u.approved ? 'approved' : (u.rejected ? 'rejected' : 'pending')),
      reviewedBy: u.reviewedBy || null,
      reviewedAt: u.reviewedAt || null,
      revokedBy: u.revokedBy || null,
      revokedAt: u.revokedAt || null
    }));
  },

  getPendingGoogleRequests() {
    return this.getGoogleApprovalRequests().filter(r => r.status === 'pending');
  },

  _saveGoogleRequests(requests) {
    // No-op, managed via users DB now
  },

  submitGoogleApprovalRequest(accountData, note) {
    let user = this.users.find(u => u.email && u.email.toLowerCase() === (accountData.email || '').toLowerCase());
    if (user) {
      user.department = note || user.department || 'Commercial PMO & Project Delivery';
      user.requestDate = new Date().toISOString();
      user.approved = false;
      user.rejected = false;
      user.revoked = false;
      user.requestSource = 'Google OAuth';
    } else {
      user = {
        id: 'req_goog_' + Date.now().toString(36),
        memberId: 'm_' + Date.now().toString(36),
        loginId: (accountData.email ? accountData.email.split('@')[0] : 'user'),
        name: accountData.name || 'Google User',
        email: accountData.email || 'user@hintonn.com',
        googleEmail: accountData.email || 'user@hintonn.com',
        avatar: accountData.avatar || (accountData.name || 'GU').split(' ').map(w=>w[0]).join('').slice(0,2),
        color: accountData.color || '#2563EB',
        role: accountData.role || 'AI Developer',
        department: note || 'Commercial PMO & Project Delivery',
        requestDate: new Date().toISOString(),
        requestSource: 'Google OAuth',
        approved: false,
        rejected: false,
        revoked: false
      };
      this.users.push(user);
    }
    this._saveUserDb();
    this._syncApprovalToFirebase(user.email, false);
    
    // Convert to req format expected by UI
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      color: user.color,
      status: 'pending',
      requestedAt: user.requestDate
    };
  },

  _syncApprovalToFirebase(email, isApproved, isRejected = false, isRevoked = false) {
    if (typeof firebase !== 'undefined' && firebase.firestore && email) {
      try {
        firebase.firestore().collection('users').where('email', '==', email).get().then(snap => {
          if (!snap.empty) {
            snap.docs.forEach(doc => {
              doc.ref.set({ isActive: isApproved, isRejected: isRejected, isRevoked: isRevoked }, { merge: true }).catch(()=>{});
            });
          }
        }).catch(()=>{});
      } catch(e) {}
    }
  },

  approveGoogleRequest(reqId) {
    let user = this.users.find(u => u.id === reqId || (u.email && u.email.toLowerCase() === reqId.toLowerCase()));
    if (!user) {
      const requests = this.getGoogleApprovalRequests();
      const req = requests.find(r => r.id === reqId);
      if (req) {
        user = this.users.find(u => u.email && u.email.toLowerCase() === req.email.toLowerCase());
      }
    }

    if (!user) {
      const requests = this.getGoogleApprovalRequests();
      const req = requests.find(r => r.id === reqId);
      if (!req) return { success: false, error: 'Request not found' };
      const loginId = req.name.split(' ')[0] || 'User';
      user = {
        id: 'goog_' + Date.now().toString(36),
        memberId: 'm_' + Date.now().toString(36),
        loginId: loginId,
        name: req.name,
        role: req.role || 'AI Developer',
        email: req.email,
        googleEmail: req.email,
        initials: req.avatar || 'GU',
        color: req.color || '#2563EB',
        approved: true,
        rejected: false,
        revoked: false
      };
      this.users.push(user);
    } else {
      user.approved = true;
      user.rejected = false;
      user.revoked = false;
      user.revokedAt = null;
      user.revokedBy = null;
      user.approvedDate = new Date().toISOString();
      user.reviewedBy = 'Mohit Jain (Admin)';
      user.reviewedAt = new Date().toISOString();
    }
    this._saveUserDb();
    
    this._syncApprovalToFirebase(user.email, true);

    return { 
      success: true, 
      request: {
        id: user.id,
        name: user.name,
        email: user.email || user.googleEmail,
        status: 'approved',
        reviewedBy: 'Mohit Jain (Admin)',
        reviewedAt: new Date().toISOString()
      }, 
      user 
    };
  },

  revokeGoogleRequest(reqId) {
    let user = this.users.find(u => u.id === reqId || (u.email && u.email.toLowerCase() === reqId.toLowerCase()));
    if (!user) {
      const requests = this.getGoogleApprovalRequests();
      const req = requests.find(r => r.id === reqId);
      if (req) {
        user = this.users.find(u => u.email && u.email.toLowerCase() === req.email.toLowerCase());
      }
    }
    if (!user) return { success: false, error: 'Request not found' };

    user.approved = false;
    user.rejected = false;
    user.revoked = true;
    user.revokedAt = new Date().toISOString();
    user.revokedBy = (this.currentUser && this.currentUser.name) || 'Mohit Jain (Admin)';
    this._saveUserDb();

    this._syncApprovalToFirebase(user.email, false, false, true);

    if (typeof Store !== 'undefined' && typeof Store.addNotification === 'function') {
      Store.addNotification({ 
        type: 'user-approval', 
        text: `🚫 Access revoked for <strong>${user.name}</strong> (${user.email || user.googleEmail}).` 
      });
    }

    return { 
      success: true, 
      request: {
        id: user.id,
        name: user.name,
        email: user.email || user.googleEmail,
        status: 'revoked',
        revokedAt: user.revokedAt,
        revokedBy: user.revokedBy
      }, 
      user 
    };
  },

  rejectGoogleRequest(reqId) {
    let user = this.users.find(u => u.id === reqId || (u.email && u.email.toLowerCase() === reqId.toLowerCase()));
    if (!user) {
      const requests = this.getGoogleApprovalRequests();
      const req = requests.find(r => r.id === reqId);
      if (req) {
        user = this.users.find(u => u.email && u.email.toLowerCase() === req.email.toLowerCase());
      }
    }
    if (!user) return { success: false, error: 'Request not found' };

    user.approved = false;
    user.rejected = true;
    user.revoked = false;
    user.reviewedBy = 'Mohit Jain (Admin)';
    user.reviewedAt = new Date().toISOString();
    this._saveUserDb();

    this._syncApprovalToFirebase(user.email, false, true);

    return { 
      success: true, 
      request: {
        id: user.id,
        name: user.name,
        email: user.email || user.googleEmail,
        status: 'rejected',
        reviewedBy: 'Mohit Jain (Admin)',
        reviewedAt: new Date().toISOString()
      } 
    };
  },

  loginWithApprovedGoogle(reqId) {
    const requests = this.getGoogleApprovalRequests();
    const req = requests.find(r => r.id === reqId);
    if (!req || req.status !== 'approved') {
      return { success: false, error: 'Request is not approved yet.' };
    }

    // SECURITY: approval alone never grants a session. The requester must
    // complete a real Google sign-in (Firebase Authentication) first.
    const fbUser = (typeof FirebaseAuth !== 'undefined' && typeof FirebaseAuth.getCurrentUser === 'function')
      ? FirebaseAuth.getCurrentUser() : null;
    if (!fbUser || (fbUser.email || '').toLowerCase() !== (req.email || '').toLowerCase()) {
      return { success: false, error: 'Please sign in with your approved Google account first.' };
    }

    let user = this.users.find(u => u.email && u.email.toLowerCase() === req.email.toLowerCase());
    if (!user) {
      user = {
        id: 'goog_' + Date.now().toString(36),
        memberId: 'm_' + Date.now().toString(36),
        loginId: req.name.split(' ')[0],
        name: req.name,
        role: req.role || 'AI Developer',
        email: req.email,
        googleEmail: req.email,
        initials: req.avatar || 'GU',
        color: req.color || '#2563EB',
        approved: true
      };
      this.users.push(user);
      this._saveUserDb();
    }

    this.currentUser = user;
    this._setSessionUser(user);

    if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
      Store._data.settings.currentUser = user.memberId || 'm1';
      if (typeof Store._save === 'function') Store._save();
    }

    return { success: true, user };
  },

  // ─── Google OAuth Login (real Firebase Auth popup — no email guessing) ───
  async googleLogin() {
    if (typeof FirebaseAuth === 'undefined' || typeof FirebaseAuth.signInGoogle !== 'function') {
      return { success: false, error: 'Authentication service is initializing. Please reload.' };
    }
    try {
      const res = await FirebaseAuth.signInGoogle();
      if (!res) return { success: false, error: 'Google sign-in was cancelled.' };
      if (res.approved && res.user) {
        this.currentUser = res.user;
        this._setSessionUser(res.user);
        if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
          Store._data.settings.currentUser = res.user.memberId || 'm1';
          if (typeof Store._save === 'function') Store._save();
        }
        return { success: true, user: res.user };
      }
      if (res.revoked) {
        return { success: false, error: 'Your access has been revoked by an administrator.' };
      }
      return { success: false, error: 'Your account is pending admin approval. Please wait for an administrator to approve your access.', pendingApproval: true };
    } catch (err) {
      return { success: false, error: err.message || 'Google sign-in failed.' };
    }
  },

  // ─── Sign Up / Request Access (creates PENDING Firebase Auth user) ───
  async signUp(name, email, password) {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = password || '';

    // All accounts are created in Firebase Authentication — the server
    // stores the credential hash; nothing password-related is kept here.
    if (typeof FirebaseAuth === 'undefined' || typeof FirebaseAuth.signUpEmail !== 'function') {
      return { success: false, error: 'Authentication service is initializing. Please reload and try again.' };
    }
    try {
      await FirebaseAuth.signUpEmail(cleanName, cleanEmail, cleanPass);
    } catch (err) {
      return { success: false, error: err.message || 'Could not create the account.' };
    }

    const existing = this.users.find(u => 
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      (u.googleEmail && u.googleEmail.toLowerCase() === cleanEmail)
    );
    if (existing) {
      if (existing.approved === false) {
        return { success: false, error: 'An account with this email already exists and is pending admin approval.', pendingApproval: true };
      }
      return { success: false, error: 'An account with this email address already exists and has access.' };
    }

    const initials = cleanName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'UD';
    const newId = 'user_' + Date.now();
    const newMemberId = 'm_' + Date.now();
    const colors = ['#2563EB', '#7C3AED', '#4F46E5', '#1D4ED8', '#059669', '#D97706'];
    const chosenColor = colors[this.users.length % colors.length];

    const newUser = {
      id: newId,
      memberId: newMemberId,
      loginId: cleanName.split(' ')[0] || cleanName,
      name: cleanName,
      role: 'AI Developer',
      email: cleanEmail,
      googleEmail: cleanEmail,
      initials: initials,
      color: chosenColor,
      approved: false,
      requestDate: new Date().toISOString(),
      requestSource: 'Sign Up'
    };
    this.users.push(newUser);
    this._enforceAdminRole(newUser);
    this._saveUserDb();
    this._notifyAdminOfPendingRequest(newUser);

    // Sync new pending user to Firestore so admins on other devices can see them
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        const fbUid = (typeof FirebaseAuth !== 'undefined' && FirebaseAuth.getCurrentUser && FirebaseAuth.getCurrentUser())
          ? FirebaseAuth.getCurrentUser().uid : newId;
        firebase.firestore().collection('users').doc(fbUid).set({
          uid: fbUid,
          id: fbUid,
          memberId: newMemberId,
          name: cleanName,
          email: cleanEmail,
          role: 'AI Developer',
          initials: initials,
          color: chosenColor,
          isActive: false,
          isRejected: false,
          provider: 'sign_up',
          requestDate: newUser.requestDate,
          requestSource: 'Sign Up',
          createdAt: new Date().toISOString()
        }).catch(() => {});
      } catch (e) {}
    }

    return { 
      success: newUser.approved ? true : false, 
      user: newUser, 
      pendingApproval: !newUser.approved,
      message: newUser.approved ? 'Admin auto-approved.' : 'Your access request has been submitted. An administrator will review and approve your account.'
    };
  },

  approveUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };
    user.approved = true;
    user.rejected = false;
    user.revoked = false;
    user.revokedAt = null;
    user.revokedBy = null;
    user.approvedDate = new Date().toISOString();
    this._saveUserDb();

    if (typeof Store !== 'undefined' && typeof Store.getMembers === 'function') {
      const members = Store.getMembers();
      const memberId = user.memberId || ('m_' + Date.now());
      if (!members.some(m => m.id === memberId)) {
        Store.createMember({
          id: memberId, name: user.name, role: user.role || 'AI Developer',
          designation: user.role || 'AI Developer', email: user.email,
          initials: user.initials || user.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
          color: user.color || '#2563EB', activeTasks: 0, completedTasks: 0, hoursLogged: 0
        });
      }
      user.memberId = memberId;
    }

    if (typeof Store !== 'undefined' && typeof Store.addNotification === 'function') {
      Store.addNotification({ type: 'user-approval', text: `✅ Access approved for <strong>${user.name}</strong> (${user.email}) — they can now log in.` });
    }
    this._syncApprovalToFirebase(user.email, true);
    return { success: true, user };
  },

  rejectUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };
    user.approved = false;
    user.rejected = true;
    user.rejectedDate = new Date().toISOString();
    this._saveUserDb();
    if (typeof Store !== 'undefined' && typeof Store.addNotification === 'function') {
      Store.addNotification({ type: 'user-approval', text: `❌ Access rejected for <strong>${user.name}</strong> (${user.email}).` });
    }
    this._syncApprovalToFirebase(user.email, false, true);
    return { success: true };
  },

  revokeUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };
    const adminEmail = (user.email || '').toLowerCase();
    const adminGoogleEmail = (user.googleEmail || '').toLowerCase();
    if (this._ADMIN_EMAILS.includes(adminEmail) || this._ADMIN_EMAILS.includes(adminGoogleEmail)) {
      return { success: false, error: 'Cannot revoke access for the primary administrator.' };
    }

    user.approved = false;
    user.rejected = false;
    user.revoked = true;
    user.revokedAt = new Date().toISOString();
    user.revokedBy = (this.currentUser && this.currentUser.name) || 'Mohit Jain (Admin)';
    this._saveUserDb();

    this._syncApprovalToFirebase(user.email, false, false, true);

    if (typeof Store !== 'undefined' && typeof Store.addNotification === 'function') {
      Store.addNotification({ 
        type: 'user-approval', 
        text: `🚫 Access revoked for <strong>${user.name}</strong> (${user.email || user.googleEmail}).` 
      });
    }

    return { success: true, user };
  },

  removeUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };
    const adminEmail = (user.email || '').toLowerCase();
    const adminGoogleEmail = (user.googleEmail || '').toLowerCase();
    if (this._ADMIN_EMAILS.includes(adminEmail) || this._ADMIN_EMAILS.includes(adminGoogleEmail)) {
      return { success: false, error: 'Cannot remove the primary admin account.' };
    }
    this.users = this.users.filter(u => u.id !== userId);
    this._saveUserDb();
    if (user.memberId && typeof Store !== 'undefined') Store.deleteMember(user.memberId);
    return { success: true };
  },

  getPendingUsers() {
    return this.users.filter(u => u.approved === false && u.rejected !== true && u.revoked !== true);
  },

  getAllUsersWithStatus() {
    return this.users.map(u => ({
      id: u.id, name: u.name, email: u.email || u.googleEmail,
      role: u.role || 'AI Developer',
      initials: u.initials || u.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
      color: u.color || '#94A3B8', 
      approved: u.approved !== false && !u.revoked, 
      rejected: u.rejected === true,
      revoked: u.revoked === true,
      requestDate: u.requestDate || '', 
      approvedDate: u.approvedDate || '',
      revokedAt: u.revokedAt || '', 
      revokedBy: u.revokedBy || '',
      requestSource: u.requestSource || 'Pre-configured', 
      loginId: u.loginId || ''
    }));
  },

  // ─── Fetch pending users directly from Firestore (for admin panel) ───
  async fetchPendingUsersFromFirestore() {
    if (typeof firebase === 'undefined' || !firebase.firestore) return;
    try {
      const snap = await firebase.firestore().collection('users').where('isActive', '==', false).get();
      snap.forEach(doc => {
        const data = doc.data();
        const emailLower = (data.email || '').toLowerCase();
        const exists = this.users.find(u =>
          (u.email && u.email.toLowerCase() === emailLower) ||
          (u.googleEmail && u.googleEmail.toLowerCase() === emailLower) ||
          (u.id === (data.uid || doc.id))
        );
        if (!exists) {
          const name = data.name || 'User';
          const initials = (name.split(' ').map(w => w[0]).join('').slice(0, 2) || 'GU').toUpperCase();
          this.users.push({
            id: data.uid || doc.id,
            memberId: data.memberId || ('m_' + (data.uid || doc.id).slice(0, 6)),
            loginId: data.email ? data.email.split('@')[0] : name,
            email: data.email || '',
            googleEmail: data.email || '',
            name: name,
            role: data.role || 'AI Developer',
            avatar: initials,
            initials: initials,
            color: data.color || '#2563EB',
            title: data.role || 'AI Developer',
            approved: false,
            rejected: data.isRejected === true,
            requestDate: data.requestDate || data.createdAt || new Date().toISOString(),
            requestSource: data.requestSource || 'Sign Up'
          });
        }
      });
      this._saveUserDb();
    } catch (e) {
      console.warn('[Auth] Could not fetch pending users from Firestore:', e.message || e);
    }
  },

  _notifyAdminOfPendingRequest(user) {
    if (typeof Store !== 'undefined' && typeof Store.addNotification === 'function') {
      Store.addNotification({ type: 'user-approval', text: `🔔 New access request from <strong>${user.name}</strong> (${user.email}). <a href="#user-approvals" style="color:var(--color-primary);font-weight:600;">Review →</a>` });
    }
  },

  // ─── Admin: Add user directly (pre-approved) ───
  // No password handling here — the user signs up with their own password
  // through Firebase Authentication; this only registers the approved profile.
  adminAddUser(name, email, role) {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanRole = role || 'AI Developer';

    const existing = this.users.find(u =>
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      (u.googleEmail && u.googleEmail.toLowerCase() === cleanEmail)
    );
    if (existing) return { success: false, error: 'A user with this email already exists.' };

    const initials = cleanName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'UD';
    const newId = 'user_' + Date.now();
    const newMemberId = 'm_' + Date.now();
    const colors = ['#2563EB', '#7C3AED', '#4F46E5', '#1D4ED8', '#059669', '#D97706'];
    const chosenColor = colors[this.users.length % colors.length];

    const newUser = {
      id: newId, memberId: newMemberId, loginId: cleanName.split(' ')[0] || cleanName,
      name: cleanName, role: cleanRole, email: cleanEmail,
      googleEmail: cleanEmail, initials: initials, color: chosenColor,
      approved: true, approvedDate: new Date().toISOString(), requestSource: 'Admin Direct Add'
    };
    this.users.push(newUser);
    this._saveUserDb();

    if (typeof Store !== 'undefined' && typeof Store.getMembers === 'function') {
      const members = Store.getMembers();
      if (!members.some(m => m.email === cleanEmail)) {
        Store.createMember({ id: newMemberId, name: cleanName, role: cleanRole, designation: cleanRole, email: cleanEmail, initials: initials, color: chosenColor, activeTasks: 0, completedTasks: 0, hoursLogged: 0 });
      }
    }
    if (typeof Store !== 'undefined' && typeof Store.addNotification === 'function') {
      Store.addNotification({ type: 'user-approval', text: `👤 New team member <strong>${cleanName}</strong> (${cleanRole}) added by admin. Access auto-approved.` });
    }
    return { success: true, user: newUser };
  },

  // Sends Firebase Authentication's password-reset email. The user sets a
  // new password via the emailed link — no client-side password writes.
  forgotPassword(email) {
    const raw = (email || '').trim().toLowerCase();
    if (!raw || !raw.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (typeof FirebaseAuth !== 'undefined' && typeof FirebaseAuth.sendResetEmail === 'function') {
      FirebaseAuth.sendResetEmail(raw)
        .then(() => console.log('[Auth] Password reset email sent to', raw))
        .catch(err => console.warn('[Auth] Password reset email:', err.message || err));
    }
    return { success: true, userExists: true };
  },

  // Passwords are reset ONLY through Firebase Authentication's emailed
  // reset link — never written by client code.
  resetPassword(email) {
    if (typeof FirebaseAuth !== 'undefined' && typeof FirebaseAuth.sendResetEmail === 'function') {
      FirebaseAuth.sendResetEmail((email || '').trim().toLowerCase())
        .catch(err => console.warn('[Auth] Password reset email:', err.message || err));
    }
    return { success: true };
  },

  logout() {
    this.currentUser = null;
    this._clearSessionUser();
    if (typeof FirebaseAuth !== 'undefined' && typeof FirebaseAuth.signOut === 'function') {
      FirebaseAuth.signOut().catch(() => {});
    }
    window.location.hash = '#login';
    if (typeof App !== 'undefined' && typeof App.handleRoute === 'function') App.handleRoute();
  },

  isAdmin() { return this.currentUser && this.currentUser.role === 'Admin'; }
};
