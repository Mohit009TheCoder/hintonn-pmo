// ─── Hintonn PM Authentication & Session Management ───
const Auth = {
  // Pre-configured User Database
  users: [
    {
      id: 'ayush',
      memberId: 'm1',
      loginId: 'Ayush',
      password: 'ayush@123',
      name: 'Ayush Desai',
      role: 'AI Developer',
      email: 'ayush@hintonn.com',
      googleEmail: 'ayushhintonn@gmail.com',
      initials: 'AD',
      color: '#2563EB'
    },
    {
      id: 'preet',
      memberId: 'm2',
      loginId: 'Preet',
      password: 'preet@123',
      name: 'Preet Bhavsar',
      role: 'AI Developer',
      email: 'preet@hintonn.com',
      googleEmail: 'preethintonn@gmail.com',
      initials: 'PB',
      color: '#7C3AED'
    },
    {
      id: 'mohit',
      memberId: 'm3',
      loginId: 'Mohit',
      password: 'mohit@123',
      name: 'Mohit Jain',
      role: 'Admin',
      email: 'mohit@hintonn.com',
      googleEmail: 'mohithintonn@gmail.com',
      initials: 'MJ',
      color: '#4F46E5'
    },
    {
      id: 'hirvi',
      memberId: 'm4',
      loginId: 'Hirvi',
      password: 'hirvi@123',
      name: 'Hirvi Sanghavi',
      role: 'AI Developer',
      email: 'hirvi@hintonn.com',
      googleEmail: 'hirvihintonn@gmail.com',
      initials: 'HS',
      color: '#1D4ED8'
    }
  ],

  // Google OAuth Pre-loaded Account Profiles
  googleAccounts: [
    {
      email: 'ayushhintonn@gmail.com',
      primaryEmail: 'ayush@hintonn.com',
      name: 'Ayush Desai',
      role: 'AI Developer',
      avatar: 'AD',
      color: '#2563EB',
      description: 'AI Core Engineering & Task Allocation'
    },
    {
      email: 'preethintonn@gmail.com',
      primaryEmail: 'preet@hintonn.com',
      name: 'Preet Bhavsar',
      role: 'AI Developer',
      avatar: 'PB',
      color: '#7C3AED',
      description: 'AI Core Engineering & Task Allocation'
    },
    {
      email: 'mohithintonn@gmail.com',
      primaryEmail: 'mohit@hintonn.com',
      name: 'Mohit Jain',
      role: 'Admin',
      avatar: 'MJ',
      color: '#4F46E5',
      description: 'Executive Portfolio & Full PMO Control'
    },
    {
      email: 'hirvihintonn@gmail.com',
      primaryEmail: 'hirvi@hintonn.com',
      name: 'Hirvi Sanghavi',
      role: 'AI Developer',
      avatar: 'HS',
      color: '#1D4ED8',
      description: 'LoRA Research & Telemetry Automation'
    }
  ],

  currentUser: null,

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
    timeline: ['ADMIN'] // assuming timeline is admin restricted as before
  },

  hasAccess(module) {
    if (!this.currentUser) return false;
    
    // Map existing system roles to the Matrix Role codes
    const roleMap = {
      'Admin': 'ADMIN',
      'AI Developer': 'DEV', // using DEV as a baseline for the existing users
      'Project Manager': 'PM',
      'PMO': 'PMO',
      'Finance': 'FIN',
      'Contractor': 'CTR'
    };
    
    const userRoleCode = roleMap[this.currentUser.role] || 'DEV';
    const allowedRoles = this.permissions[module];
    
    // If module isn't strictly defined, allow access by default
    if (!allowedRoles) return true;
    
    return allowedRoles.includes(userRoleCode);
  },

  // ─── Force Admin role for known admin emails/IDs ───
  _enforceAdminRole(user) {
    if (!user) return user;
    const adminEmails = ['mohithintonn@gmail.com'];
    const adminIds = ['mohit', 'm3'];
    const isAdmin =
      (user.email && adminEmails.includes(user.email.toLowerCase())) ||
      (user.googleEmail && adminEmails.includes(user.googleEmail.toLowerCase())) ||
      (user.id && adminIds.includes(user.id.toLowerCase())) ||
      (user.memberId && adminIds.includes(user.memberId.toLowerCase())) ||
      (user.loginId && adminEmails.includes(user.loginId.toLowerCase()));
    if (isAdmin) {
      user.role = 'Admin';
      user.title = user.title || 'Executive PMO & Lead';
    }
    return user;
  },

  init() {
    try {
      // Version-based cache bust: clear stale localStorage on code update
      const AUTH_VERSION = 'v2-admin-fix';
      if (localStorage.getItem('hintonn-auth-version') !== AUTH_VERSION) {
        localStorage.removeItem('hintonn-current-user');
        localStorage.setItem('hintonn-auth-version', AUTH_VERSION);
      }

      const saved = localStorage.getItem('hintonn-current-user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Find existing or restore saved user session
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
          this.currentUser = match;
          if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
            Store._data.settings.currentUser = match.memberId || 'm1';
          }
          // Re-save with enforced role
          try { localStorage.setItem('hintonn-current-user', JSON.stringify(match)); } catch (e) {}
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

  login(loginIdOrEmail, password) {
    const raw = (loginIdOrEmail || '').trim().toLowerCase();
    const rawPass = password || '';

    // Match by Login ID or Email
    const user = this.users.find(u => 
      u.loginId.toLowerCase() === raw || 
      (u.email && u.email.toLowerCase() === raw) ||
      (u.googleEmail && u.googleEmail.toLowerCase() === raw)
    );

    // Match Password with strict case sensitivity
    if (user && user.password === rawPass) {
      this._enforceAdminRole(user);
      this.currentUser = user;
      try {
        localStorage.setItem('hintonn-current-user', JSON.stringify(user));
      } catch (e) {}

      // Synchronize with Store
      if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
        Store._data.settings.currentUser = user.memberId;
        if (typeof Store._save === 'function') Store._save();
      }

      return { success: true, user };
    }

    return { success: false, error: 'Invalid Login ID or password.' };
  },

  // Google OAuth Login
  googleLogin(email) {
    const raw = (email || '').trim().toLowerCase();
    let user = this.users.find(u => 
      (u.googleEmail && u.googleEmail.toLowerCase() === raw) ||
      (u.email && u.email.toLowerCase() === raw) ||
      u.loginId.toLowerCase() === raw
    );

    // If account not found, auto-provision as AI Developer
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
        password: '',
        name: namePart || 'Google User',
        role: 'AI Developer',
        avatar: initials,
        color: chosenColor,
        title: 'AI Developer'
      };

      this.users.push(user);
      if (typeof Store !== 'undefined' && Store._data && Store._data.members) {
        const newMemberObj = {
          id: newMemberId,
          name: user.name,
          role: 'AI Developer',
          email: raw,
          avatar: initials,
          color: chosenColor,
          activeTasks: 0,
          completedTasks: 0,
          hoursLogged: 0
        };
        Store._data.members.push(newMemberObj);
        if (typeof Store._save === 'function') Store._save();
        if (typeof Store._syncToFirestore === 'function') Store._syncToFirestore('members', newMemberId, newMemberObj);
      }
    }

    if (user) {
      this._enforceAdminRole(user);
      this.currentUser = user;
      try {
        localStorage.setItem('hintonn-current-user', JSON.stringify(user));
      } catch (e) {}

      if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
        Store._data.settings.currentUser = user.memberId;
        if (typeof Store._save === 'function') Store._save();
      }

      return { success: true, user };
    }

    return { success: false, error: 'Google account not registered with Hintonn PMO.' };
  },

  // Sign Up / Registration
  signUp(name, email, password) {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = password || '';

    // Check for existing account
    const existing = this.users.find(u => 
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      (u.googleEmail && u.googleEmail.toLowerCase() === cleanEmail)
    );

    if (existing) {
      return { success: false, error: 'An account with this email address already exists.' };
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
      color: chosenColor
    };

    this.users.push(newUser);

    // Also register into Store members if Store is available
    if (typeof Store !== 'undefined' && typeof Store.getMembers === 'function') {
      const members = Store.getMembers();
      if (!members.some(m => m.id === newMemberId || m.email === cleanEmail)) {
        const newMemberObj = {
          id: newMemberId,
          name: cleanName,
          role: 'AI Developer',
          email: cleanEmail,
          initials: initials,
          color: chosenColor
        };
        members.push(newMemberObj);
        if (typeof Store._save === 'function') Store._save();
        if (typeof Store._syncToFirestore === 'function') Store._syncToFirestore('members', newMemberId, newMemberObj);
      }
    }

    this._enforceAdminRole(newUser);
    this.currentUser = newUser;
    try {
      localStorage.setItem('hintonn-current-user', JSON.stringify(newUser));
    } catch (e) {}

    if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
      Store._data.settings.currentUser = newUser.memberId;
      if (typeof Store._save === 'function') Store._save();
    }

    return { success: true, user: newUser };
  },

  // Forgot Password
  forgotPassword(email) {
    const raw = (email || '').trim().toLowerCase();
    const user = this.users.find(u => 
      (u.email && u.email.toLowerCase() === raw) ||
      (u.googleEmail && u.googleEmail.toLowerCase() === raw)
    );

    // Accept and generate reset trigger
    return { success: true, userExists: !!user };
  },

  // Reset Password
  resetPassword(email, newPassword) {
    const raw = (email || '').trim().toLowerCase();
    const user = this.users.find(u => 
      (u.email && u.email.toLowerCase() === raw) ||
      (u.googleEmail && u.googleEmail.toLowerCase() === raw)
    );

    if (user) {
      user.password = newPassword;
      return { success: true };
    }

    // If specific email not found, update the first non-admin user or active user
    const targetUser = this.users[1] || this.users[0];
    if (targetUser) {
      targetUser.password = newPassword;
    }
    return { success: true };
  },

  logout() {
    this.currentUser = null;
    try {
      localStorage.removeItem('hintonn-current-user');
    } catch (e) {}

    if (typeof FirebaseAuth !== 'undefined' && typeof FirebaseAuth.signOut === 'function') {
      FirebaseAuth.signOut().catch(() => {});
    }

    // Redirect to Login
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
