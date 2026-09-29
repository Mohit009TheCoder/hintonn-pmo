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
      password: 'Mohit@123',
      name: 'Mohit Jain',
      role: 'Admin',
      email: 'mohithintonn@gmail.com',
      googleEmail: 'mohithintonn@gmail.com',
      initials: 'MJ',
      color: '#4F46E5',
      approved: true
    }
  ],

  currentUser: null,
  getCurrentUser() {
    return this.currentUser;
  },

  // ─── Admin email whitelist — ONLY this email gets Admin role ───
  _ADMIN_EMAILS: ['mohithintonn@gmail.com'],

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
      const AUTH_VERSION = 'v8-revoke-fix';
      if (localStorage.getItem('hintonn-auth-version') !== AUTH_VERSION) {
        localStorage.setItem('hintonn-auth-version', AUTH_VERSION);
      }

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
              if (saved.password && saved.password !== exists.password) exists.password = saved.password;
              this._enforceAdminRole(exists);
            } else {
              this.users.push(saved);
            }
          });
        } catch(e) {}
      }

      const saved = localStorage.getItem('hintonn-current-user');
      if (saved) {
        const parsed = JSON.parse(saved);
        let match = this.users.find(u => 
          u.id === parsed.id || 
          (u.email && parsed.email && u.email.toLowerCase() === parsed.email.toLowerCase()) ||
          (u.googleEmail && parsed.email && u.googleEmail.toLowerCase() === parsed.email.toLowerCase())
        );
        if (!match && parsed && (parsed.email || parsed.name)) {
          match = parsed;
          this.users.push(match);
        }
        if (match) {
          this._enforceAdminRole(match);
          if (match.approved === false) {
            this.currentUser = null;
            localStorage.removeItem('hintonn-current-user');
          } else {
            this.currentUser = match;
            if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
              Store._data.settings.currentUser = match.memberId || 'm1';
            }
            try { localStorage.setItem('hintonn-current-user', JSON.stringify(match)); } catch (e) {}

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
                // Sync memberId if found by email but has different ID
                match.memberId = existingMember.id;
                try { localStorage.setItem('hintonn-current-user', JSON.stringify(match)); } catch (e) {}
              }
            }
          }
        } else {
          this.currentUser = null;
          localStorage.removeItem('hintonn-current-user');
        }
      } else {
        this.currentUser = null;
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

  // ─── Direct ID / Password Login (Unchanged, direct login) ───
  async login(loginIdOrEmail, password) {
    const raw = (loginIdOrEmail || '').trim().toLowerCase();
    const rawPass = password || '';

    const user = this.users.find(u => 
      (u.loginId && u.loginId.toLowerCase() === raw) || 
      (u.email && u.email.toLowerCase() === raw) ||
      (u.googleEmail && u.googleEmail.toLowerCase() === raw)
    );

    if (!user) {
      return { success: false, error: 'No account found with this ID or email.' };
    }

    if (user.password !== rawPass) {
      return { success: false, error: 'Incorrect password. Please try again.' };
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
        // Admin approved on another device — sync locally
        user.approved = true;
        this._saveUserDb();
      } else {
        return { success: false, error: 'Your account is pending admin approval. Please wait for an administrator to approve your access.', pendingApproval: true, user: user };
      }
    }

    this.currentUser = user;
    try {
      localStorage.setItem('hintonn-current-user', JSON.stringify(user));
    } catch (e) {}

    if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
      Store._data.settings.currentUser = user.memberId || 'm1';
      if (typeof Store._save === 'function') Store._save();
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
        password: 'user@123',
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

    let user = this.users.find(u => u.email && u.email.toLowerCase() === req.email.toLowerCase());
    if (!user) {
      user = {
        id: 'goog_' + Date.now().toString(36),
        memberId: 'm_' + Date.now().toString(36),
        loginId: req.name.split(' ')[0],
        password: 'user@123',
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
    try {
      localStorage.setItem('hintonn-current-user', JSON.stringify(user));
    } catch (e) {}

    if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
      Store._data.settings.currentUser = user.memberId || 'm1';
      if (typeof Store._save === 'function') Store._save();
    }

    return { success: true, user };
  },

  // ─── Google OAuth Login ───
  googleLogin(email) {
    const raw = (email || '').trim().toLowerCase();
    let user = this.users.find(u => 
      (u.googleEmail && u.googleEmail.toLowerCase() === raw) ||
      (u.email && u.email.toLowerCase() === raw)
    );

    if (!user && raw.includes('@')) {
      const namePart = raw.split('@')[0].split(/[._-]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      const initials = namePart.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'GU';
      const newId = 'user_g_' + Date.now();
      const newMemberId = 'm_g_' + Date.now();
      const colors = ['#2563EB', '#7C3AED', '#4F46E5', '#1D4ED8', '#059669', '#D97706'];
      const chosenColor = colors[this.users.length % colors.length];

      user = {
        id: newId,
        memberId: newMemberId,
        loginId: raw.split('@')[0],
        email: raw,
        googleEmail: raw,
        name: namePart || 'Google User',
        role: 'AI Developer',
        avatar: initials,
        color: chosenColor,
        title: 'AI Developer',
        approved: false,
        initials: initials,
        requestDate: new Date().toISOString(),
        requestSource: 'Google OAuth'
      };
      this.users.push(user);
      this._saveUserDb();
    }

    if (user) {
      this._enforceAdminRole(user);
      if (user.approved === false) {
        return { 
          success: false, 
          error: 'Your account is pending admin approval. Please wait for an administrator to approve your access.',
          pendingApproval: true 
        };
      }
      this.currentUser = user;
      try { localStorage.setItem('hintonn-current-user', JSON.stringify(user)); } catch (e) {}
      if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
        Store._data.settings.currentUser = user.memberId;
      }
      return { success: true, user };
    }
    return { success: false, error: 'Google account not registered with Hintonn PMO.' };
  },

  // ─── Sign Up / Request Access (creates PENDING user) ───
  signUp(name, email, password) {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = password || '';

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
      password: cleanPass,
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
        firebase.firestore().collection('users').doc(newId).set({
          id: newId,
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
  adminAddUser(name, email, role, password) {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = password || 'user@123';
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
      password: cleanPass, name: cleanName, role: cleanRole, email: cleanEmail,
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

  forgotPassword(email) {
    const raw = (email || '').trim().toLowerCase();
    const user = this.users.find(u => (u.email && u.email.toLowerCase() === raw) || (u.googleEmail && u.googleEmail.toLowerCase() === raw));
    return { success: true, userExists: !!user };
  },

  resetPassword(email, newPassword) {
    const raw = (email || '').trim().toLowerCase();
    const user = this.users.find(u => (u.email && u.email.toLowerCase() === raw) || (u.googleEmail && u.googleEmail.toLowerCase() === raw));
    if (user) {
      user.password = newPassword;
      this._saveUserDb();
      return { success: true };
    }
    return { success: false, error: 'User not found.' };
  },

  logout() {
    this.currentUser = null;
    try { localStorage.removeItem('hintonn-current-user'); } catch (e) {}
    if (typeof FirebaseAuth !== 'undefined' && typeof FirebaseAuth.signOut === 'function') {
      FirebaseAuth.signOut().catch(() => {});
    }
    window.location.hash = '#login';
    if (typeof App !== 'undefined' && typeof App.handleRoute === 'function') App.handleRoute();
  },

  isAuthenticated() { return !!this.currentUser; },
  getCurrentUser() { this._enforceAdminRole(this.currentUser); return this.currentUser; },
  isAdmin() { return this.currentUser && this.currentUser.role === 'Admin'; }
};
