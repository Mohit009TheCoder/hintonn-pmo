// ─── Hintonn PM Authentication & Session Management ───
// Google-only login. Admin = mohitsjain12104@gmail.com ONLY.
const Auth = {
  // Pre-configured User Database (existing users are pre-approved)
  users: [
    {
      id: 'mohit',
      memberId: 'm3',
      loginId: 'Mohit',
      name: 'Mohit Jain',
      role: 'Admin',
      email: 'mohitsjain12104@gmail.com',
      googleEmail: 'mohitsjain12104@gmail.com',
      initials: 'MJ',
      color: '#4F46E5',
      approved: true
    },
    {
      id: 'ayush',
      memberId: 'm1',
      loginId: 'Ayush',
      name: 'Ayush Desai',
      role: 'AI Developer',
      email: 'ayush@hintonn.com',
      googleEmail: 'ayushhintonn@gmail.com',
      initials: 'AD',
      color: '#2563EB',
      approved: true
    },
    {
      id: 'preet',
      memberId: 'm2',
      loginId: 'Preet',
      name: 'Preet Bhavsar',
      role: 'AI Developer',
      email: 'preet@hintonn.com',
      googleEmail: 'preethintonn@gmail.com',
      initials: 'PB',
      color: '#7C3AED',
      approved: true
    },
    {
      id: 'hirvi',
      memberId: 'm4',
      loginId: 'Hirvi',
      name: 'Hirvi Sanghavi',
      role: 'AI Developer',
      email: 'hirvi@hintonn.com',
      googleEmail: 'hirvihintonn@gmail.com',
      initials: 'HS',
      color: '#1D4ED8',
      approved: true
    }
  ],

  currentUser: null,

  // ─── Admin email whitelist — ONLY this email gets Admin role ───
  _ADMIN_EMAILS: ['mohitsjain12104@gmail.com'],

  // RBAC Permission Matrix based on Role
  permissions: {
    // Standard Modules (All roles)
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

    // Commercial / Financial Modules
    billing: ['PM', 'ADMIN', 'PMO', 'FIN'],
    invoices: ['PM', 'ADMIN', 'PMO', 'FIN'],
    retention: ['ADMIN', 'PMO', 'FIN'],
    bg: ['ADMIN', 'PMO', 'FIN', 'CTR'],
    'bank-guarantees': ['ADMIN', 'PMO', 'FIN', 'CTR'],
    dlp: ['PM', 'ADMIN', 'PMO'],
    'dlp-timelines': ['PM', 'ADMIN', 'PMO'],

    // Admin / High Level Modules
    settings: ['ADMIN'],
    connectors: ['ADMIN'],
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

  // ─── Enforce Admin role for the single admin email ───
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
      // Version-based cache bust
      const AUTH_VERSION = 'v4-google-only';
      if (localStorage.getItem('hintonn-auth-version') !== AUTH_VERSION) {
        const savedUsers = localStorage.getItem('hintonn-users-db');
        if (savedUsers) {
          try {
            const parsed = JSON.parse(savedUsers);
            parsed.forEach(u => { if (u.approved === undefined) u.approved = true; });
            localStorage.setItem('hintonn-users-db', JSON.stringify(parsed));
          } catch(e) {}
        }
        localStorage.setItem('hintonn-auth-version', AUTH_VERSION);
      }

      // Load user database from localStorage
      const savedUsers = localStorage.getItem('hintonn-users-db');
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers);
          parsed.forEach(saved => {
            const exists = this.users.find(u => u.id === saved.id || (u.email && saved.email && u.email.toLowerCase() === saved.email.toLowerCase()));
            if (exists) {
              if (saved.approved !== undefined) exists.approved = saved.approved;
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

  // ─── Save user database to localStorage ───
  _saveUserDb() {
    try {
      localStorage.setItem('hintonn-users-db', JSON.stringify(this.users));
    } catch(e) {}
  },

  // ─── Google OAuth Login (the ONLY login method) ───
  googleLogin(email) {
    const raw = (email || '').trim().toLowerCase();
    let user = this.users.find(u => 
      (u.googleEmail && u.googleEmail.toLowerCase() === raw) ||
      (u.email && u.email.toLowerCase() === raw) ||
      u.loginId.toLowerCase() === raw
    );

    // If account not found, create a PENDING user (requires admin approval)
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
        approved: false, // ← Requires admin approval
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
      try {
        localStorage.setItem('hintonn-current-user', JSON.stringify(user));
      } catch (e) {}

      if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
        Store._data.settings.currentUser = user.memberId;
      }

      return { success: true, user };
    }

    return { success: false, error: 'Google account not registered with Hintonn PMO.' };
  },

  // ─── Admin: Approve a pending user ───
  approveUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };

    user.approved = true;
    user.approvedDate = new Date().toISOString();
    this._saveUserDb();

    // Also create member in Store if not already there
    if (typeof Store !== 'undefined' && typeof Store.getMembers === 'function') {
      const members = Store.getMembers();
      const memberId = user.memberId || ('m_' + Date.now());
      if (!members.some(m => m.id === memberId)) {
        const memberObj = {
          id: memberId,
          name: user.name,
          role: user.role || 'AI Developer',
          designation: user.role || 'AI Developer',
          email: user.email,
          initials: user.initials || user.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
          color: user.color || '#2563EB',
          activeTasks: 0,
          completedTasks: 0,
          hoursLogged: 0
        };
        Store.createMember(memberObj);
      }
      user.memberId = memberId;
    }

    // Add notification for admin
    if (typeof Store !== 'undefined' && typeof Store.addNotification === 'function') {
      Store.addNotification({
        type: 'user-approval',
        text: `✅ Access approved for <strong>${user.name}</strong> (${user.email}) — they can now log in.`
      });
    }

    return { success: true, user };
  },

  // ─── Admin: Reject a pending user ───
  rejectUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };

    user.approved = false;
    user.rejected = true;
    user.rejectedDate = new Date().toISOString();
    this._saveUserDb();

    if (typeof Store !== 'undefined' && typeof Store.addNotification === 'function') {
      Store.addNotification({
        type: 'user-approval',
        text: `❌ Access rejected for <strong>${user.name}</strong> (${user.email}).`
      });
    }

    return { success: true };
  },

  // ─── Admin: Remove user entirely ───
  removeUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };

    // Don't allow removing the admin
    const adminEmail = (user.email || '').toLowerCase();
    const adminGoogleEmail = (user.googleEmail || '').toLowerCase();
    if (this._ADMIN_EMAILS.includes(adminEmail) || this._ADMIN_EMAILS.includes(adminGoogleEmail)) {
      return { success: false, error: 'Cannot remove the primary admin account.' };
    }

    this.users = this.users.filter(u => u.id !== userId);
    this._saveUserDb();

    if (user.memberId && typeof Store !== 'undefined') {
      Store.deleteMember(user.memberId);
    }

    return { success: true };
  },

  // ─── Get pending approval users ───
  getPendingUsers() {
    return this.users.filter(u => u.approved === false && u.rejected !== true);
  },

  // ─── Get all users with approval status ───
  getAllUsersWithStatus() {
    return this.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email || u.googleEmail,
      role: u.role || 'AI Developer',
      initials: u.initials || u.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
      color: u.color || '#94A3B8',
      approved: u.approved !== false,
      rejected: u.rejected === true,
      requestDate: u.requestDate || '',
      approvedDate: u.approvedDate || '',
      requestSource: u.requestSource || 'Pre-configured',
      loginId: u.loginId || ''
    }));
  },

  // ─── Notify admin of pending request ───
  _notifyAdminOfPendingRequest(user) {
    if (typeof Store !== 'undefined' && typeof Store.addNotification === 'function') {
      Store.addNotification({
        type: 'user-approval',
        text: `🔔 New access request from <strong>${user.name}</strong> (${user.email}). <a href="#user-approvals" style="color:var(--color-primary);font-weight:600;">Review →</a>`
      });
    }
  },

  // ─── Admin: Add user directly (pre-approved, Google account) ───
  adminAddUser(name, email, role) {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanRole = role || 'AI Developer';

    // Check for duplicates
    const existing = this.users.find(u =>
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      (u.googleEmail && u.googleEmail.toLowerCase() === cleanEmail)
    );
    if (existing) {
      return { success: false, error: 'A user with this email already exists.' };
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
      role: cleanRole,
      email: cleanEmail,
      googleEmail: cleanEmail,
      initials: initials,
      color: chosenColor,
      approved: true, // ← Admin-created users are pre-approved
      approvedDate: new Date().toISOString(),
      requestSource: 'Admin Direct Add'
    };

    this.users.push(newUser);
    this._saveUserDb();

    // Also add to Store members
    if (typeof Store !== 'undefined' && typeof Store.getMembers === 'function') {
      const members = Store.getMembers();
      if (!members.some(m => m.email === cleanEmail)) {
        Store.createMember({
          id: newMemberId,
          name: cleanName,
          role: cleanRole,
          designation: cleanRole,
          email: cleanEmail,
          initials: initials,
          color: chosenColor,
          activeTasks: 0,
          completedTasks: 0,
          hoursLogged: 0
        });
      }
    }

    if (typeof Store !== 'undefined' && typeof Store.addNotification === 'function') {
      Store.addNotification({
        type: 'user-approval',
        text: `👤 New team member <strong>${cleanName}</strong> (${cleanRole}) added by admin. Access auto-approved.`
      });
    }

    return { success: true, user: newUser };
  },

  logout() {
    this.currentUser = null;
    try {
      localStorage.removeItem('hintonn-current-user');
    } catch (e) {}

    if (typeof FirebaseAuth !== 'undefined' && typeof FirebaseAuth.signOut === 'function') {
      FirebaseAuth.signOut().catch(() => {});
    }

    window.location.hash = '#login';
    if (typeof App !== 'undefined' && typeof App.handleRoute === 'function') {
      App.handleRoute();
    }
  },

  isAuthenticated() {
    return !!this.currentUser;
  },

  getCurrentUser() {
    this._enforceAdminRole(this.currentUser);
    return this.currentUser;
  },

  isAdmin() {
    return this.currentUser && this.currentUser.role === 'Admin';
  }
};
