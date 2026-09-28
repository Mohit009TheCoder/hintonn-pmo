// ─── Hintonn PM Authentication & Session Management ───
// Google OAuth + Email/Password login. No phone/mobile login.
// Admin = mohitsjain12104@gmail.com ONLY.
const Auth = {
  // Pre-configured User Database (existing users are pre-approved)
  users: [],

  currentUser: null,

  // ─── Admin email whitelist — ONLY this email gets Admin role ───
  _ADMIN_EMAILS: ['mohitsjain12104@gmail.com'],

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
      const AUTH_VERSION = 'v6-admin-fix';
      if (localStorage.getItem('hintonn-auth-version') !== AUTH_VERSION) {
        const savedUsers = localStorage.getItem('hintonn-users-db');
        if (savedUsers) {
          try {
            const parsed = JSON.parse(savedUsers);
            parsed.forEach(u => {
              if (u.approved === undefined) u.approved = true;
              // Force admin emails to always be approved
              const uEmail = (u.email || '').toLowerCase();
              const uGEmail = (u.googleEmail || '').toLowerCase();
              if (this._ADMIN_EMAILS.includes(uEmail) || this._ADMIN_EMAILS.includes(uGEmail)) {
                u.approved = true;
                u.role = 'Admin';
              }
            });
            localStorage.setItem('hintonn-users-db', JSON.stringify(parsed));
          } catch(e) {}
        }
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
              if (saved.password && saved.password !== exists.password) exists.password = saved.password;
              // Force admin emails to always be approved
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
  login(loginIdOrEmail, password) {
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

  // ─── Google Login Approval Request Store (UI-Only Mock Demo) ───
  getGoogleApprovalRequests() {
    try {
      const saved = localStorage.getItem('hintonn-google-approval-requests');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}

    // Default sample pending Google request for demonstration
    const defaultRequests = [
      {
        id: 'req_goog_demo1',
        name: 'Alex Morgan',
        email: 'alex.morgan@hintonn.com',
        avatar: 'AM',
        color: '#0284C7',
        role: 'AI Developer',
        department: 'Commercial PMO & Project Delivery',
        reason: 'Google Workspace access for PMO project telemetry & milestone monitoring',
        requestedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null
      }
    ];
    this._saveGoogleRequests(defaultRequests);
    return defaultRequests;
  },

  getPendingGoogleRequests() {
    return this.getGoogleApprovalRequests().filter(r => r.status === 'pending');
  },

  _saveGoogleRequests(requests) {
    try {
      localStorage.setItem('hintonn-google-approval-requests', JSON.stringify(requests));
    } catch (e) {}
  },

  submitGoogleApprovalRequest(accountData, note) {
    const requests = this.getGoogleApprovalRequests();
    // Check if there is already an existing request for this email
    let req = requests.find(r => r.email.toLowerCase() === (accountData.email || '').toLowerCase());
    if (req) {
      req.status = 'pending';
      req.name = accountData.name || req.name;
      req.department = note || req.department || 'Commercial PMO & Project Delivery';
      req.requestedAt = new Date().toISOString();
      req.reviewedBy = null;
      req.reviewedAt = null;
    } else {
      req = {
        id: 'req_goog_' + Date.now().toString(36),
        name: accountData.name || 'Google User',
        email: accountData.email || 'user@hintonn.com',
        avatar: accountData.avatar || (accountData.name || 'GU').split(' ').map(w=>w[0]).join('').slice(0,2),
        color: accountData.color || '#2563EB',
        role: accountData.role || 'AI Developer',
        department: note || 'Commercial PMO & Project Delivery',
        reason: 'Google Single Sign-On Access Request',
        requestedAt: new Date().toISOString(),
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null
      };
      requests.unshift(req);
    }
    this._saveGoogleRequests(requests);
    return req;
  },

  approveGoogleRequest(reqId) {
    const requests = this.getGoogleApprovalRequests();
    const req = requests.find(r => r.id === reqId);
    if (!req) return { success: false, error: 'Request not found' };

    req.status = 'approved';
    req.reviewedBy = 'Mohit Jain (Admin)';
    req.reviewedAt = new Date().toISOString();
    this._saveGoogleRequests(requests);

    // Also ensure this user exists in user database as approved
    let user = this.users.find(u => u.email && u.email.toLowerCase() === req.email.toLowerCase());
    if (!user) {
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
        approved: true
      };
      this.users.push(user);
      this._saveUserDb();
    } else {
      user.approved = true;
      this._saveUserDb();
    }

    return { success: true, request: req, user };
  },

  rejectGoogleRequest(reqId) {
    const requests = this.getGoogleApprovalRequests();
    const req = requests.find(r => r.id === reqId);
    if (!req) return { success: false, error: 'Request not found' };

    req.status = 'rejected';
    req.reviewedBy = 'Mohit Jain (Admin)';
    req.reviewedAt = new Date().toISOString();
    this._saveGoogleRequests(requests);

    return { success: true, request: req };
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
    this._saveUserDb();
    this._notifyAdminOfPendingRequest(newUser);

    return { 
      success: true, 
      user: newUser, 
      pendingApproval: true,
      message: 'Your access request has been submitted. An administrator will review and approve your account.'
    };
  },

  approveUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };
    user.approved = true;
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
    return { success: true };
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
    return this.users.filter(u => u.approved === false && u.rejected !== true);
  },

  getAllUsersWithStatus() {
    return this.users.map(u => ({
      id: u.id, name: u.name, email: u.email || u.googleEmail,
      role: u.role || 'AI Developer',
      initials: u.initials || u.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
      color: u.color || '#94A3B8', approved: u.approved !== false, rejected: u.rejected === true,
      requestDate: u.requestDate || '', approvedDate: u.approvedDate || '',
      requestSource: u.requestSource || 'Pre-configured', loginId: u.loginId || ''
    }));
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
