// ─── Topbar Component (Section 19) ───
const Topbar = {
  render() {
    const crumbs = document.getElementById('breadcrumb');
    const settings = Store.getSettings();
    const screen = App.currentScreen;
    const user = (typeof Auth !== 'undefined' && Auth.getCurrentUser()) || Store.getMember(settings.currentUser || 'm2');
    
    const labels = {
      dashboard: 'Dashboard', projects: 'Projects', tasks: 'Tasks', calendar: 'Calendar',
      timeline: 'Timeline & Gantt', milestones: 'Milestones', issues: 'Issues', team: 'Team',
      reports: 'Reports & Analytics', 'ai-assistant': 'AI Assistant', connectors: 'Connectors', settings: 'Settings',
      notifications: 'Notifications', 'project-detail': 'Project Details',
      billing: 'Billing & Invoices', invoices: 'Billing & Invoices',
      retention: 'Retention Summary', bg: 'Bank Guarantees (BG)',
      'bank-guarantees': 'Bank Guarantees (BG)', dlp: 'DLP Timelines',
      'dlp-timelines': 'DLP Timelines'
    };
    let label = labels[screen] || 'Dashboard';
    if (screen === 'project-detail' && App.currentProjectId) {
      const p = Store.getProject(App.currentProjectId);
      label = p ? p.name : 'Project';
    }
    
    if (crumbs) {
      crumbs.innerHTML = `
        <span class="workspace-name">${settings.workspaceName || 'Hintonn AI'}</span>
        <span style="color:var(--color-border-strong);font-weight:400">/</span>
        <span class="current">${label}</span>
      `;
    }

    // Render User Avatar
    const avatar = document.getElementById('topbar-avatar');
    if (avatar && user) {
      const initials = user.initials || user.name.split(' ').map(w=>w[0]).join('').slice(0,2);
      avatar.textContent = initials;
      avatar.title = `${user.name} (${user.role})`;
      if (user.color) {
        avatar.style.background = user.color;
      }
    }
  },

  getUserDropdown() {
    return document.getElementById('profileDropdown') || document.getElementById('topbar-user-dropdown');
  },

  toggleUserMenu(e) {
    if (e) e.stopPropagation();
    const dropdown = this.getUserDropdown();
    if (!dropdown) return;
    const isHidden = dropdown.style.display === 'none' || !dropdown.style.display;
    if (isHidden) {
      this.openUserMenu();
    } else {
      this.closeUserMenu();
    }
  },

  openUserMenu() {
    const dropdown = this.getUserDropdown();
    if (!dropdown) return;
    const user = (typeof Auth !== 'undefined' && Auth.getCurrentUser()) || { name: 'Mohit Jain', role: 'Admin', email: 'mohithintonn@gmail.com', initials: 'MJ', color: '#4F46E5' };
    const isAdmin = user && user.role === 'Admin';

    dropdown.innerHTML = `
      <div style="padding:14px 16px;border-bottom:1px solid var(--color-border-subtle);background:var(--color-bg-page)">
        <div style="font-weight:700;font-size:14px;color:var(--color-text-primary);margin-bottom:3px">${user.name}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:var(--radius-pill);background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200)">${user.role}</span>
        </div>
        <div style="font-size:12px;color:var(--color-text-muted)">${user.googleEmail || user.email}</div>
      </div>
      <div style="padding:6px">
        ${isAdmin ? `
        <a href="#settings" class="menu-item dropdown-item" onclick="Topbar.closeUserMenu();App.navigate('settings')">
          ${Icons.settings}
          <span>Settings & Profile</span>
        </a>
        <div style="height:1px;background:var(--color-border-subtle);margin:4px 0"></div>
        ` : ''}
        <button type="button" class="menu-item dropdown-item" onclick="Topbar.closeUserMenu();Auth.logout()" style="width:100%;border:none;background:none;cursor:pointer;text-align:left;color:#DC2626;font-weight:600">
          ${Icons.logout}
          <span>Sign Out</span>
        </button>
      </div>
    `;
    dropdown.style.display = 'block';
  },

  closeUserMenu() {
    const dropdown = this.getUserDropdown();
    if (dropdown) dropdown.style.display = 'none';
  }
};
