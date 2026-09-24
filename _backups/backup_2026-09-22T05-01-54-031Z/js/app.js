// ─── Utility Functions ───
const Utils = {
  formatDate(d) {
    if (!d) return '';
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },
  timeAgo(dateStr) {
    const now = new Date(); const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff/86400) + 'd ago';
    return Utils.formatDate(dateStr);
  },
  humanize(s) { return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); },
  truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : s || ''; },
  isOverdue(d) { return d && new Date(d) < new Date() && d !== ''; }
};

// ─── Main App ───
const App = {
  currentScreen: 'dashboard',
  currentProjectId: null,

  init() {
    Store.init();
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); this.openCommand(); }
      if (e.key === 'Escape') { Command.close(); Modal.closeAll(); this.closeNotifications(); this.closeSidebar(); }
    });
    Store.subscribe(() => { this.updateNotifDot(); });
    this.updateNotifDot();

    // Mobile resize listener
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        this.closeSidebar();
      }
    });
  },

  handleRoute() {
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

    this.render();
  },

  navigate(screen, param) {
    if (param) window.location.hash = `${screen}/${param}`;
    else window.location.hash = screen;
  },

  render() {
    const content = document.getElementById('page-content');
    const screens = {
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
      notifications: () => NotificationsScreen.render(),
      settings: () => SettingsScreen.render(),
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
    const screens = {
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
      notifications: () => NotificationsScreen.render(),
      settings: () => SettingsScreen.render(),
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
      document.body.style.overflow = 'hidden';
    }
  },

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
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
      if (sidebar) sidebar.classList.toggle('collapsed');
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

  toggleNotifications() {
    const panel = document.getElementById('notification-panel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) this.renderNotifications();
  },

  closeNotifications() { document.getElementById('notification-panel').classList.add('hidden'); },

  renderNotifications() {
    const list = document.getElementById('notification-list');
    const notifications = Store.getNotifications();
    list.innerHTML = notifications.map(n => `
      <div class="notification-item ${n.read?'':'unread'}" onclick="Store.markRead('${n.id}');this.classList.remove('unread');App.updateNotifDot()">
        ${!n.read ? '<div class="notification-dot"></div>' : '<div style="width:8px"></div>'}
        <div class="notification-content">
          <div class="notification-text">${n.text}</div>
          <div class="notification-time">${Utils.timeAgo(n.createdAt)}</div>
        </div>
      </div>`).join('') || '<div style="padding:32px;text-align:center;color:var(--color-text-muted);font-size:13px">No notifications</div>';
  },

  updateNotifDot() {
    const dot = document.getElementById('notif-dot');
    const count = Store.getUnreadCount();
    if (count > 0) { dot.classList.remove('hidden'); }
    else { dot.classList.add('hidden'); }
  }
};

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => App.init());
