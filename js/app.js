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
    Store.subscribe(() => { this.updateNotifDot(); });
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
    const rawHash = (window.location.hash || '').replace(/^#\/?/, '').split('/')[0];
    const authRoutes = ['login', 'signup', 'forgot-password', 'reset-password'];

    // 1. Enforce Unauthenticated Route Guarding
    if (typeof Auth !== 'undefined') {
      if (!Auth.isAuthenticated()) {
        const targetView = authRoutes.includes(rawHash) ? rawHash : 'login';
        this.currentScreen = targetView;
        if (!window.location.hash.startsWith('#' + targetView)) {
          window.location.hash = '#' + targetView;
        }
        this.renderLogin(targetView);
        return;
      } else {
        // Authenticated user trying to access any auth route gets redirected to #dashboard
        if (authRoutes.includes(rawHash) || !rawHash) {
          window.location.hash = '#dashboard';
        }
      }
    }

    const hash = window.location.hash.slice(1) || 'dashboard';
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
      connectors: () => ConnectorsScreen.render(),
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
    const notifications = Store.getNotifications();
    list.innerHTML = notifications.map(n => `
      <div class="notification-item ${n.read?'':'unread'}" onclick="Store.markRead('${n.id}');App.renderNotifications();App.updateNotifDot()">
        ${!n.read ? '<div class="notification-dot"></div>' : '<div style="width:8px"></div>'}
        <div class="notification-content">
          <div class="notification-text">${n.text}</div>
          <div class="notification-time">${Utils.timeAgo(n.createdAt)}</div>
        </div>
      </div>`).join('') || '<div style="padding:32px;text-align:center;color:var(--color-text-muted);font-size:13px">No notifications</div>';
    this.updateNotifDot();
  },

  updateNotifDot() {
    const dot = document.getElementById('notif-dot');
    const count = Store.getUnreadCount();
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
document.addEventListener('DOMContentLoaded', () => App.init());
