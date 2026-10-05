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
      'dlp-timelines': 'DLP Timelines', 'user-approvals': 'User Approvals'
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

    // Render Tenant Control (Company Switcher for Super Admin or Company Badge for Member)
    let tenantControl = document.getElementById('topbar-tenant-control');
    if (!tenantControl) {
      tenantControl = document.createElement('div');
      tenantControl.id = 'topbar-tenant-control';
      tenantControl.className = 'topbar-tenant-control';
      tenantControl.style.cssText = 'display:flex;align-items:center;margin-right:10px;';
      const actions = document.querySelector('.topbar-actions');
      if (actions && actions.parentNode) {
        actions.parentNode.insertBefore(tenantControl, actions);
      }
    }

    if (tenantControl) {
      const isSuper = typeof Auth !== 'undefined' && typeof Auth.isSuperAdmin === 'function' && Auth.isSuperAdmin();
      if (isSuper) {
        const companies = (typeof Store !== 'undefined' && typeof Store.getCompanies === 'function') ? Store.getCompanies() : [];
        const activeCid = (typeof Store !== 'undefined' && typeof Store.getActiveCompanyId === 'function') ? Store.getActiveCompanyId() : 'all';
        tenantControl.innerHTML = `
          <div style="display:inline-flex;align-items:center;gap:6px;background:var(--color-bg-card);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);padding:3px 8px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
            <span style="font-size:13px" title="Super Admin Tenant Switcher">🏢</span>
            <select id="tenantCompanySelect" onchange="Store.setActiveCompany(this.value)" aria-label="Active Company Tenant" style="background:transparent;border:none;font-size:12px;font-weight:600;color:var(--color-text-primary);cursor:pointer;outline:none;padding:2px 0;">
              <option value="all" ${activeCid === 'all' ? 'selected' : ''}>🏢 All Companies (Global)</option>
              ${companies.map(c => `<option value="${Utils.escapeHtml(c.id)}" ${activeCid === c.id ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>
        `;
      } else {
        const compName = (typeof Auth !== 'undefined' && Auth.getCompanyName && Auth.getCompanyName()) || 'Hintonn AI';
        const teamName = (typeof Auth !== 'undefined' && Auth.getUserTeam && Auth.getUserTeam()) || 'AI & Tech';
        const isCompAdmin = typeof Auth !== 'undefined' && typeof Auth.isCompanyAdmin === 'function' && Auth.isCompanyAdmin();
        tenantControl.innerHTML = `
          <div style="display:inline-flex;align-items:center;gap:6px;background:var(--color-bg-page);border:1px solid var(--color-border-subtle);border-radius:var(--radius-pill);padding:4px 10px;font-size:12px;">
            <span style="font-size:12px">🏢</span>
            <span style="font-weight:600;color:var(--color-text-primary);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${Utils.escapeHtml(compName)}">${Utils.escapeHtml(compName)}</span>
            <span style="color:var(--color-border-strong);font-weight:400">·</span>
            <span style="color:var(--color-primary-600);font-weight:600;font-size:11px">${Utils.escapeHtml(teamName)}</span>
            ${isCompAdmin ? `<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:var(--radius-pill);background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200);margin-left:2px">Admin</span>` : ''}
          </div>
        `;
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
    const isSuper = typeof Auth !== 'undefined' && typeof Auth.isSuperAdmin === 'function' && Auth.isSuperAdmin();
    const isAdmin = user && (user.role === 'Admin' || isSuper);
    const roleLabel = isSuper ? 'Super Admin' : (user.role === 'Admin' ? 'Company Admin' : (user.role || 'Member'));
    const companyName = user.companyName || (typeof Auth !== 'undefined' && Auth.getCompanyName && Auth.getCompanyName()) || 'Hintonn AI';
    const teamName = user.team || (typeof Auth !== 'undefined' && Auth.getUserTeam && Auth.getUserTeam()) || 'AI & Tech';

    dropdown.innerHTML = `
      <div style="padding:14px 16px;border-bottom:1px solid var(--color-border-subtle);background:var(--color-bg-page)">
        <div style="font-weight:700;font-size:14px;color:var(--color-text-primary);margin-bottom:4px">${Utils.escapeHtml(user.name)}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap">
          <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:var(--radius-pill);background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200)">${Utils.escapeHtml(roleLabel)}</span>
          <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:var(--radius-pill);background:var(--color-bg-subtle);color:var(--color-text-secondary);border:1px solid var(--color-border-subtle)">🏢 ${Utils.escapeHtml(companyName)}</span>
        </div>
        <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:3px">Team: <strong style="color:var(--color-text-secondary)">${Utils.escapeHtml(teamName)}</strong></div>
        <div style="font-size:12px;color:var(--color-text-muted)">${Utils.escapeHtml(user.googleEmail || user.email || '')}</div>
      </div>
      <div style="padding:6px">
        ${isAdmin ? `
        <a href="#user-approvals" class="menu-item dropdown-item" onclick="Topbar.closeUserMenu();App.navigate('user-approvals')">
          ${Icons.users}
          <span>User Approvals</span>
        </a>
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
