// ─── Utility Functions ───
const Utils = {
  formatDate(d) {
    if (!d) return '—';
    try {
      let date;
      if (d instanceof Date) {
        date = d;
      } else if (typeof d === 'string') {
        const trimmed = d.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          date = new Date(trimmed + 'T00:00:00');
        } else {
          date = new Date(trimmed);
        }
      } else {
        date = new Date(d);
      }
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '—';
    }
  },
  timeAgo(dateStr) {
    if (!dateStr) return '—';
    try {
      const now = new Date();
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      const diff = Math.floor((now - d) / 1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) return Math.floor(diff/60) + 'm ago';
      if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
      if (diff < 604800) return Math.floor(diff/86400) + 'd ago';
      return Utils.formatDate(dateStr);
    } catch(e) {
      return '—';
    }
  },
  humanize(s) { return s ? s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : ''; },
  truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : s || ''; },
  isOverdue(d) { 
    if (!d) return false;
    try {
      const target = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.trim()) ? new Date(d.trim() + 'T23:59:59') : new Date(d);
      return !isNaN(target.getTime()) && target < new Date();
    } catch(e) {
      return false;
    }
  },
  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

// ─── Main App ───
const App = {
  currentScreen: 'dashboard',
  currentProjectId: null,

  init() {
    Store.init();
    if (typeof Auth !== 'undefined') {
      Auth.init();
    }
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); this.openCommand(); }
      if (e.key === 'Escape') { 
        Command.close(); 
        Modal.closeAll(); 
        this.closeNotifications(); 
        this.closeSidebar(); 
        if (typeof Topbar !== 'undefined') Topbar.closeUserMenu();
      }
    });
    Store.subscribe(() => { 
      this.updateNotifDot(); 
      this.refreshCurrentScreen();
    });
    this.updateNotifDot();

    // Global click listener to close notification dropdown & profile dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('notification-panel');
      const notifBtn = document.getElementById('notif-btn');
      if (panel && !panel.classList.contains('hidden')) {
        if (!panel.contains(e.target) && notifBtn && !notifBtn.contains(e.target)) {
          this.closeNotifications();
        }
      }

      const userDropdown = document.getElementById('profileDropdown') || document.getElementById('topbar-user-dropdown');
      const avatar = document.getElementById('topbar-avatar');
      if (userDropdown && userDropdown.style.display === 'block') {
        if (!userDropdown.contains(e.target) && avatar && !avatar.contains(e.target)) {
          if (typeof Topbar !== 'undefined') Topbar.closeUserMenu();
        }
      }
    });

    // Mobile resize listener
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        this.closeSidebar();
      }
    });
  },

  handleRoute() {
    const loc = typeof window !== 'undefined' && window.location ? window.location : { hash: '' };
    const rawHash = (loc.hash || '').replace(/^#\/?/, '').split('/')[0];
    const authRoutes = ['login', 'signup', 'forgot-password', 'reset-password'];

    // 1. Enforce Unauthenticated Route Guarding
    if (typeof Auth !== 'undefined') {
      if (!Auth.isAuthenticated()) {
        const targetView = authRoutes.includes(rawHash) ? rawHash : 'login';
        this.currentScreen = targetView;
        if (loc.hash && !loc.hash.startsWith('#' + targetView)) {
          loc.hash = '#' + targetView;
        }
        this.renderLogin(targetView);
        return;
      } else {
        // Authenticated user trying to access any auth route gets redirected to #dashboard
        if (authRoutes.includes(rawHash) || !rawHash) {
          if (typeof window !== 'undefined' && window.location) window.location.hash = '#dashboard';
          loc.hash = '#dashboard';
        }
      }
    }

    const hash = (loc.hash || '').slice(1) || 'dashboard';
    const parts = hash.split('/');
    const screen = parts[0];
    const param = parts[1] || null;

    if (screen === 'project-detail' && param) {
      this.currentScreen = 'project-detail';
      this.currentProjectId = param;
    } else {
      this.currentScreen = screen;
      this.currentProjectId = null;
    }

    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }

    // Hard Route Protection: RBAC checking
    if (typeof Auth !== 'undefined' && !Auth.hasAccess(this.currentScreen)) {
      this.renderAccessRestricted(`Access Restricted: You do not have permission to view ${Utils.humanize(this.currentScreen)}.`);
      return;
    }

    this.render();
  },

  isCommercialRoute(screen) {
    return ['billing', 'invoices', 'retention', 'bg', 'bank-guarantees', 'dlp', 'dlp-timelines'].includes(screen);
  },

  navigate(screen, param) {
    if (param) window.location.hash = `${screen}/${param}`;
    else window.location.hash = screen;
  },

  renderLogin(view) {
    document.body.classList.add('login-active');
    const content = document.getElementById('page-content');
    if (content && typeof LoginScreen !== 'undefined') {
      let viewType = 'signin';
      if (view === 'signup') viewType = 'signup';
      else if (view === 'forgot-password' || view === 'forgot') viewType = 'forgot';
      else if (view === 'reset-password' || view === 'reset') viewType = 'reset';
      content.innerHTML = LoginScreen.render(viewType);
    }
    Modal.closeAll();
    this.closeNotifications();
    this.closeSidebar();
    if (typeof Topbar !== 'undefined') Topbar.closeUserMenu();
  },

  renderAccessRestricted(customMessage) {
    document.body.classList.remove('login-active');
    const content = document.getElementById('page-content');
    const heading = customMessage ? (customMessage.startsWith('Access Restricted') ? customMessage : `Access Restricted: ${customMessage}`) : 'Access Restricted';
    const bodyMsg = customMessage || 'You do not have permission to view commercial or financial administration records. Please contact Ayush Desai (Admin) for elevated access.';
    if (content) {
      content.innerHTML = `
        <div class="access-restricted-wrapper" style="min-height:75vh;display:flex;align-items:center;justify-content:center;padding:32px 20px;box-sizing:border-box;">
          <div class="section-card access-restricted-card" style="max-width:520px;width:100%;text-align:center;padding:48px 36px;box-shadow:var(--shadow-md);border-radius:12px;background:var(--color-surface);border:1px solid var(--color-border);box-sizing:border-box;">
            
            <div style="width:64px;height:64px;border-radius:50%;background:#FEF2F2;border:1px solid #FECACA;color:#DC2626;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
              <svg style="width:30px;height:30px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>

            <h2 style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--color-text-primary);margin:0 0 12px 0;">${heading}</h2>

            <p style="font-size:14px;color:var(--color-text-secondary);line-height:1.6;margin:0 0 24px 0;">
              ${bodyMsg}
            </p>

            <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-pill);font-size:12px;color:var(--color-text-muted);margin-bottom:28px;">
              <span>Role Level:</span>
              <span style="font-weight:600;color:var(--color-primary-700);">${typeof Auth !== 'undefined' && Auth.getCurrentUser() ? Auth.getCurrentUser().role : 'AI Developer'}</span>
            </div>

            <div>
              <button type="button" class="btn btn-primary" onclick="App.navigate('dashboard')" style="padding:0 24px;height:42px;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:8px;margin:0 auto;border-radius:8px;cursor:pointer;">
                <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Back to Dashboard
              </button>
            </div>

          </div>
        </div>
      `;
    }
    Modal.closeAll();
    Sidebar.render();
    Topbar.render();
    this.updateMobileNav();
  },

  render() {
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
      this.renderLogin(this.currentScreen);
      return;
    }

    // Hard Route Protection: RBAC checking
    if (typeof Auth !== 'undefined' && !Auth.hasAccess(this.currentScreen)) {
      this.renderAccessRestricted(`Access Restricted: You do not have permission to view ${Utils.humanize(this.currentScreen)}.`);
      return;
    }

    document.body.classList.remove('login-active');
    const content = document.getElementById('page-content');
    const screens = {
      login: () => typeof LoginScreen !== 'undefined' ? LoginScreen.render('signin') : '',
      signup: () => typeof LoginScreen !== 'undefined' ? LoginScreen.render('signup') : '',
      'forgot-password': () => typeof LoginScreen !== 'undefined' ? LoginScreen.render('forgot') : '',
      'reset-password': () => typeof LoginScreen !== 'undefined' ? LoginScreen.render('reset') : '',
      dashboard: () => DashboardScreen.render(),
      projects: () => ProjectsScreen.render(),
      'project-detail': () => ProjectDetailScreen.render(this.currentProjectId),
      tasks: () => TasksScreen.render(),
      timeline: () => TimelineScreen.render(),
      team: () => TeamScreen.render(),
      calendar: () => CalendarScreen.render(),
      reports: () => ReportsScreen.render(),
      issues: () => IssuesScreen.render(),
      milestones: () => MilestonesScreen.render(),
      'ai-assistant': () => AIAssistantScreen.render(),
      connectors: () => ConnectorsScreen.render(),
      notifications: () => NotificationsScreen.render(),
      settings: () => SettingsScreen.render(),
      'user-approvals': () => UserApprovalsScreen.render(),
      billing: () => BillingScreen.render(),
      invoices: () => BillingScreen.render(),
      retention: () => RetentionScreen.render(),
      bg: () => BankGuaranteesScreen.render(),
      'bank-guarantees': () => BankGuaranteesScreen.render(),
      dlp: () => DLPTimelinesScreen.render(),
      'dlp-timelines': () => DLPTimelinesScreen.render(),
    };

    const renderer = screens[this.currentScreen] || screens.dashboard;
    content.innerHTML = renderer();
    content.classList.add('animate-fade-in');
    setTimeout(() => content.classList.remove('animate-fade-in'), 200);

    Modal.closeAll();
    Sidebar.render();
    Topbar.render();
    this.updateMobileNav();
  },

  refresh() {
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
      this.renderLogin();
      return;
    }

    // Hard Route Protection: RBAC checking
    if (typeof Auth !== 'undefined' && !Auth.hasAccess(this.currentScreen)) {
      this.renderAccessRestricted(`Access Restricted: You do not have permission to view ${Utils.humanize(this.currentScreen)}.`);
      return;
    }

    document.body.classList.remove('login-active');
    const screens = {
      login: () => typeof LoginScreen !== 'undefined' ? LoginScreen.render() : '',
      dashboard: () => DashboardScreen.render(),
      projects: () => ProjectsScreen.render(),
      'project-detail': () => ProjectDetailScreen.render(this.currentProjectId),
      tasks: () => TasksScreen.render(),
      timeline: () => TimelineScreen.render(),
      team: () => TeamScreen.render(),
      calendar: () => CalendarScreen.render(),
      reports: () => ReportsScreen.render(),
      issues: () => IssuesScreen.render(),
      milestones: () => MilestonesScreen.render(),
      'ai-assistant': () => AIAssistantScreen.render(),
      connectors: () => ConnectorsScreen.render(),
      notifications: () => NotificationsScreen.render(),
      settings: () => SettingsScreen.render(),
      'user-approvals': () => UserApprovalsScreen.render(),
      billing: () => BillingScreen.render(),
      invoices: () => BillingScreen.render(),
      retention: () => RetentionScreen.render(),
      bg: () => BankGuaranteesScreen.render(),
      'bank-guarantees': () => BankGuaranteesScreen.render(),
      dlp: () => DLPTimelinesScreen.render(),
      'dlp-timelines': () => DLPTimelinesScreen.render(),
    };
    const renderer = screens[this.currentScreen] || screens.dashboard;
    document.getElementById('page-content').innerHTML = renderer();

    Sidebar.render();
    Topbar.render();
    this.updateMobileNav();
  },

  refreshCurrentScreen() {
    if (this.currentScreen === 'tasks' && typeof TasksScreen !== 'undefined' && typeof TasksScreen.updateTasksContainer === 'function') {
      TasksScreen.updateTasksContainer();
      return;
    }
    const modalOpen = typeof Modal !== 'undefined' && typeof Modal.isOpen === 'function' ? Modal.isOpen() : false;
    if (!modalOpen && ['dashboard', 'projects', 'team', 'project-detail', 'reports'].includes(this.currentScreen)) {
      this.refresh();
    }
  },

  openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
    if (window.innerWidth <= 768) {
      if (document.body && document.body.style) document.body.style.overflow = 'hidden';
    }
  },

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    if (document.body && document.body.style) document.body.style.overflow = '';
  },

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768) {
      if (sidebar && sidebar.classList.contains('open')) {
        this.closeSidebar();
      } else {
        this.openSidebar();
      }
    } else {
      if (sidebar) {
        sidebar.classList.toggle('collapsed');
        sidebar.classList.toggle('sidebar-collapsed');
      }
      if (document.body && document.body.classList) {
        document.body.classList.toggle('sidebar-collapsed');
      }
    }
  },

  updateMobileNav() {
    const navItems = document.querySelectorAll('.mobile-bottom-nav .mobile-nav-item[data-nav]');
    const cur = this.currentScreen;
    navItems.forEach(item => {
      const nav = item.getAttribute('data-nav');
      const isActive = nav === cur || (nav === 'projects' && cur === 'project-detail');
      if (isActive) item.classList.add('active');
      else item.classList.remove('active');
    });
  },

  openCommand() { Command.open(); },
  closeCommand() { Command.close(); },
  onCommandSearch(v) { Command.renderResults(v); },

  toggleNotifications(e) {
    const evt = e || (typeof window !== 'undefined' ? window.event : null);
    if (evt && typeof evt.stopPropagation === 'function') {
      evt.stopPropagation();
    }
    const panel = document.getElementById('notification-panel');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    if (isHidden) {
      panel.classList.remove('hidden');
      this.renderNotifications();
      this.updateNotifDot();
    } else {
      panel.classList.add('hidden');
    }
  },

  closeNotifications() {
    const panel = document.getElementById('notification-panel');
    if (panel) panel.classList.add('hidden');
  },

  renderNotifications() {
    const list = document.getElementById('notification-list');
    if (!list) return;

    // Fetch pending users from Firestore in background
    if (typeof Auth !== 'undefined' && Auth.fetchPendingUsersFromFirestore) {
      Auth.fetchPendingUsersFromFirestore().then(() => this.renderNotifications());
    }

    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = user && user.role === 'Admin';
    let googleHtml = '';

    if (isAdmin && typeof Auth !== 'undefined' && Auth.getGoogleApprovalRequests) {
      const googleRequests = Auth.getGoogleApprovalRequests();
      const pendingGoogle = googleRequests.filter(r => r.status === 'pending');
      if (pendingGoogle.length > 0) {
        googleHtml = `
          <div style="background:#F0F7FF;border-bottom:1px solid #BFDBFE;padding:12px 14px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:#1E40AF;text-transform:uppercase;letter-spacing:0.04em;">
                <svg width="13" height="13" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
                Google Login Approval (${pendingGoogle.length})
              </div>
              <a href="#user-approvals" onclick="App.closeNotifications();" style="font-size:11.5px;color:#2563EB;font-weight:600;text-decoration:none;">View All</a>
            </div>
            ${pendingGoogle.map(r => `
              <div style="background:#FFFFFF;border:1px solid #DBEAFE;border-radius:6px;padding:10px;margin-bottom:6px;box-shadow:0 1px 2px rgba(0,0,0,0.03);">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <div style="width:26px;height:26px;border-radius:50%;background:${r.color || '#2563EB'};color:#FFF;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${r.avatar || 'GU'}</div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:12.5px;font-weight:700;color:var(--color-text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.name}</div>
                    <div style="font-size:11px;color:var(--color-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.email}</div>
                  </div>
                  <span style="font-size:10px;font-weight:700;background:#FEF3C7;color:#92400E;padding:1px 6px;border-radius:10px;">Pending</span>
                </div>
                <div style="font-size:11.5px;color:var(--color-text-secondary);margin-bottom:8px;">${r.department || 'Commercial PMO & Project Delivery'}</div>
                <div style="display:flex;gap:6px;justify-content:flex-end;">
                  <button type="button" onclick="App.handleGoogleApproval('${r.id}', true)" style="padding:4px 10px;background:#059669;color:#FFF;border:none;border-radius:4px;font-size:11.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
                    ✓ Accept
                  </button>
                  <button type="button" onclick="App.handleGoogleApproval('${r.id}', false)" style="padding:4px 8px;background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;border-radius:4px;font-size:11.5px;font-weight:600;cursor:pointer;">
                    ✕ Reject
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    // Pending standard signup users for admin
    let signupHtml = '';
    if (isAdmin && typeof Auth !== 'undefined' && Auth.getAllUsersWithStatus) {
      const allUsers = Auth.getAllUsersWithStatus();
      const pendingSignup = allUsers.filter(u => !u.approved && !u.rejected);
      if (pendingSignup.length > 0) {
        signupHtml = `
          <div style="background:#FFFBEB;border-bottom:1px solid #FDE68A;padding:12px 14px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.04em;">
                👤 Sign-Up Requests (${pendingSignup.length})
              </div>
              <a href="#user-approvals" onclick="App.closeNotifications();" style="font-size:11.5px;color:#2563EB;font-weight:600;text-decoration:none;">View All</a>
            </div>
            ${pendingSignup.map(u => `
              <div style="background:#FFFFFF;border:1px solid #FDE68A;border-radius:6px;padding:10px;margin-bottom:6px;box-shadow:0 1px 2px rgba(0,0,0,0.03);">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <div style="width:26px;height:26px;border-radius:50%;background:${u.color||'#2563EB'};color:#FFF;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${u.initials||'??'}</div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:12.5px;font-weight:700;color:var(--color-text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.name}</div>
                    <div style="font-size:11px;color:var(--color-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.email}</div>
                  </div>
                  <span style="font-size:10px;font-weight:700;background:#FEF3C7;color:#92400E;padding:1px 6px;border-radius:10px;">Pending</span>
                </div>
                <div style="font-size:11.5px;color:var(--color-text-secondary);margin-bottom:8px;">${u.role || 'AI Developer'} · ${u.requestSource || 'Sign Up'}</div>
                <div style="display:flex;gap:6px;justify-content:flex-end;">
                  <button type="button" onclick="UserApprovalsScreen.approveUser('${u.id}');App.renderNotifications();" style="padding:4px 10px;background:#059669;color:#FFF;border:none;border-radius:4px;font-size:11.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
                    ✓ Approve
                  </button>
                  <button type="button" onclick="UserApprovalsScreen.rejectUser('${u.id}');App.renderNotifications();" style="padding:4px 8px;background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;border-radius:4px;font-size:11.5px;font-weight:600;cursor:pointer;">
                    ✕ Reject
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    const notifications = Store.getNotifications();
    const standardHtml = notifications.map(n => `
      <div class="notification-item ${n.read?'':'unread'}" onclick="Store.markRead('${n.id}');App.renderNotifications();App.updateNotifDot();${n.taskId ? `App.closeNotifications();if(window.location.hash!=='#tasks')window.location.hash='#tasks';setTimeout(()=>TasksScreen.openDetailModal('${n.taskId}'),250);` : ''}">
        ${!n.read ? '<div class="notification-dot"></div>' : '<div style="width:8px"></div>'}
        <div class="notification-content">
          <div class="notification-text">${n.text}</div>
          <div class="notification-time">${Utils.timeAgo(n.createdAt)}</div>
        </div>
      </div>`).join('') || (!googleHtml ? '<div style="padding:32px;text-align:center;color:var(--color-text-muted);font-size:13px">No notifications</div>' : '');

    list.innerHTML = googleHtml + signupHtml + standardHtml;
    this.updateNotifDot();
  },

  handleGoogleApproval(reqId, isApprove) {
    if (typeof Auth === 'undefined') return;
    if (isApprove) {
      const res = Auth.approveGoogleRequest(reqId);
      if (res.success && typeof Toast !== 'undefined') {
        Toast.show(`✅ Approved Google login for ${res.request.name}!`, 'success');
      }
    } else {
      const res = Auth.rejectGoogleRequest(reqId);
      if (res.success && typeof Toast !== 'undefined') {
        Toast.show(`Google login request rejected for ${res.request.name}.`, 'info');
      }
    }
    this.renderNotifications();
    this.updateNotifDot();
    if (this.currentScreen === 'user-approvals' && typeof UserApprovalsScreen !== 'undefined') {
      UserApprovalsScreen.refresh();
    }
  },

  updateNotifDot() {
    const dot = document.getElementById('notif-dot');
    let count = Store.getUnreadCount();

    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = user && user.role === 'Admin';
    if (isAdmin && typeof Auth !== 'undefined') {
      if (Auth.getPendingGoogleRequests) count += Auth.getPendingGoogleRequests().length;
      if (Auth.getAllUsersWithStatus) {
        count += Auth.getAllUsersWithStatus().filter(u => !u.approved && !u.rejected).length;
      }
    }

    if (dot) {
      if (count > 0) {
        dot.classList.remove('hidden');
      } else {
        dot.classList.add('hidden');
      }
    }
    const panelCount = document.getElementById('notif-panel-count');
    if (panelCount) {
      panelCount.textContent = count > 0 ? `${count} unread` : 'All caught up';
      panelCount.className = `badge ${count > 0 ? 'badge-primary' : 'badge-completed'}`;
    }
  }
};

// ─── Init ───
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else if (typeof Store !== 'undefined' && typeof Auth !== 'undefined') {
    App.init();
  }
}
