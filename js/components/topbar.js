// ─── Topbar Component (Section 19: Multi-Tenant Architecture) ───
const Topbar = {
  _tenantMenuOpen: false,

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

    // Render Multi-Tenant Selector / Badge
    this.renderTenantElement();

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

  renderTenantElement() {
    const wrap = document.getElementById('topbar-tenant-wrap');
    if (!wrap) return;

    const isSuper = typeof Auth !== 'undefined' && Auth.isSuperAdmin();
    const isAdmin = typeof Auth !== 'undefined' && Auth.isAdmin();
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;

    const userCompanyId = (user && user.companyId) || 'comp_hintonn';
    const userCompanyName = (user && user.companyName) || 'Hintonn PMO';
    const userTeamId = (user && user.teamId) || 'team_ai';

    if (isSuper) {
      // Super Admin: Enterprise Cross-Tenant Switcher
      const activeCompId = Store.getActiveCompanyId();
      const companies = Store.getCompanies();
      let activeLabel = 'All Companies (Global HQ)';
      let activeIcon = '🌐';
      if (activeCompId !== 'all') {
        const found = companies.find(c => c.id === activeCompId);
        if (found) {
          activeLabel = found.name;
          activeIcon = '🏢';
        }
      }

      wrap.innerHTML = `
        <div style="position:relative;">
          <button type="button" class="tenant-selector-btn" id="tenantSelectorBtn" onclick="Topbar.toggleTenantMenu(event)" title="Switch tenant company context">
            <span class="tenant-icon">${activeIcon}</span>
            <span style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.escapeHtml(activeLabel)}</span>
            <span class="tenant-badge-pill">Super Admin</span>
            <svg class="tenant-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          <div class="tenant-dropdown" id="tenantDropdown">
            <div class="tenant-dropdown-header">Tenant Isolation Context</div>
            <button type="button" class="tenant-dropdown-item ${activeCompId === 'all' ? 'active' : ''}" onclick="Topbar.switchCompany('all')">
              <span style="display:flex;align-items:center;gap:8px;">
                <span>🌐</span>
                <span><strong>All Companies</strong> (Cross-Tenant HQ)</span>
              </span>
              ${activeCompId === 'all' ? '✓' : ''}
            </button>
            <div style="height:1px;background:var(--color-border-subtle);margin:4px 0;"></div>
            <div class="tenant-dropdown-header" style="border:none;padding-bottom:2px;">Assigned Tenant Portals</div>
            ${companies.map(c => `
              <button type="button" class="tenant-dropdown-item ${activeCompId === c.id ? 'active' : ''}" onclick="Topbar.switchCompany('${c.id}')">
                <span style="display:flex;align-items:center;gap:8px;min-width:0;">
                  <span>🏢</span>
                  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Utils.escapeHtml(c.name)}</span>
                </span>
                ${activeCompId === c.id ? '✓' : ''}
              </button>
            `).join('')}
            <div style="height:1px;background:var(--color-border-subtle);margin:4px 0;"></div>
            <button type="button" class="tenant-dropdown-item" onclick="Topbar.openNewCompanyModal()" style="color:var(--color-primary-700);font-weight:600;">
              <span style="display:flex;align-items:center;gap:8px;">
                <span>+</span>
                <span>Provision New Company</span>
              </span>
            </button>
          </div>
        </div>
      `;
    } else if (isAdmin) {
      // Company Admin: Locked Tenant Badge
      wrap.innerHTML = `
        <div class="tenant-badge-locked" title="Your data is strictly isolated to ${Utils.escapeHtml(userCompanyName)}">
          <span style="font-size:14px;">🏢</span>
          <span style="font-weight:700;color:var(--color-text-primary);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.escapeHtml(userCompanyName)}</span>
          <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:var(--radius-pill);background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;">Company Admin</span>
        </div>
      `;
    } else {
      // Team Member / Developer: Locked Tenant & Team Badge
      const team = Store.getTeam(userTeamId);
      const teamName = team ? team.name : 'Engineering & Ops';
      wrap.innerHTML = `
        <div class="tenant-badge-locked" title="Isolated to ${Utils.escapeHtml(userCompanyName)} · ${Utils.escapeHtml(teamName)}">
          <span style="font-size:13px;">🏢</span>
          <span style="max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.escapeHtml(userCompanyName)}</span>
          <span style="color:var(--color-border-strong);">·</span>
          <span style="font-size:11px;color:var(--color-text-muted);max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">👥 ${Utils.escapeHtml(teamName)}</span>
        </div>
      `;
    }
  },

  toggleTenantMenu(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('tenantDropdown');
    if (!dropdown) return;
    this._tenantMenuOpen = !this._tenantMenuOpen;
    dropdown.style.display = this._tenantMenuOpen ? 'block' : 'none';

    if (this._tenantMenuOpen) {
      const closeHandler = (evt) => {
        if (!evt.target.closest('#tenantSelectorBtn') && !evt.target.closest('#tenantDropdown')) {
          this.closeTenantMenu();
          document.removeEventListener('click', closeHandler);
        }
      };
      setTimeout(() => document.addEventListener('click', closeHandler), 0);
    }
  },

  closeTenantMenu() {
    this._tenantMenuOpen = false;
    const dropdown = document.getElementById('tenantDropdown');
    if (dropdown) dropdown.style.display = 'none';
  },

  switchCompany(companyId) {
    this.closeTenantMenu();
    Store.setActiveCompanyId(companyId);
    const comp = Store.getCompany(companyId);
    const name = companyId === 'all' ? 'All Companies (Global HQ)' : (comp ? comp.name : companyId);
    Toast.show(`Tenant switched to: ${name}`, 'success');
    App.refresh();
  },

  openNewCompanyModal() {
    this.closeTenantMenu();
    const bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="padding:10px 12px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);font-size:12.5px;color:var(--color-text-muted);line-height:1.5;">
          Provisioning a new company creates an isolated tenant partition with dedicated teams, projects, invoices, and role-based data boundaries.
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Company Name <span style="color:#EF4444">*</span></label>
          <input type="text" id="new-comp-name" class="form-input" placeholder="e.g. Reliance Projects PMO" required style="width:100%;height:40px;padding:0 12px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);font-size:14px;" />
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Company Identifier Code <span style="color:#EF4444">*</span></label>
          <input type="text" id="new-comp-code" class="form-input" placeholder="e.g. comp_reliance" required style="width:100%;height:40px;padding:0 12px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);font-size:14px;" />
          <span style="font-size:11.5px;color:var(--color-text-muted);margin-top:3px;display:block;">Unique lowercase alphanumeric prefix for tenant records.</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Domain</label>
            <input type="text" id="new-comp-domain" class="form-input" placeholder="e.g. reliance.com" style="width:100%;height:40px;padding:0 12px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);font-size:14px;" />
          </div>
          <div>
            <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Industry</label>
            <input type="text" id="new-comp-industry" class="form-input" placeholder="e.g. Telecom & Infrastructure" style="width:100%;height:40px;padding:0 12px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);font-size:14px;" />
          </div>
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Lead Company Admin Email</label>
          <input type="email" id="new-comp-admin-email" class="form-input" placeholder="e.g. pmo.admin@reliance.com" style="width:100%;height:40px;padding:0 12px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);font-size:14px;" />
          <span style="font-size:11.5px;color:var(--color-text-muted);margin-top:3px;display:block;">This user will receive Company Admin privileges for this tenant.</span>
        </div>
      </div>
    `;
    const footerHtml = `
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-primary" onclick="Topbar.saveNewCompany()">Provision Company</button>
    `;
    Modal.open('Provision New Tenant Company', bodyHtml, footerHtml);
  },

  saveNewCompany() {
    const nameEl = document.getElementById('new-comp-name');
    const codeEl = document.getElementById('new-comp-code');
    const domainEl = document.getElementById('new-comp-domain');
    const indEl = document.getElementById('new-comp-industry');
    const adminEmailEl = document.getElementById('new-comp-admin-email');

    const name = nameEl ? nameEl.value.trim() : '';
    let code = codeEl ? codeEl.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') : '';
    const domain = domainEl ? domainEl.value.trim().toLowerCase() : '';
    const industry = indEl ? indEl.value.trim() : 'Infrastructure PMO';
    const adminEmail = adminEmailEl ? adminEmailEl.value.trim().toLowerCase() : '';

    if (!name) { Toast.show('Please provide a company name.', 'error'); return; }
    if (!code) {
      code = 'comp_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);
    }
    if (!code.startsWith('comp_')) {
      code = 'comp_' + code;
    }

    const comp = Store.createCompany({
      id: code,
      name,
      code,
      domain,
      industry
    });

    if (adminEmail && adminEmail.includes('@')) {
      Store.assignCompanyAdmin(adminEmail, comp.id, `${name} Admin`);
    }

    // Provision default primary team for the company
    Store.createTeam({
      id: `team_${code.replace('comp_', '')}_core`,
      companyId: comp.id,
      name: `${name} Core PMO`,
      description: 'Primary project management & engineering squad'
    });

    Toast.show(`Tenant company "${name}" provisioned successfully.`, 'success');
    Modal.closeAll();
    Store.setActiveCompanyId(comp.id);
    App.refresh();
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
    const isSuper = typeof Auth !== 'undefined' && Auth.isSuperAdmin();
    const isAdmin = typeof Auth !== 'undefined' && Auth.isAdmin();
    const compName = (typeof Auth !== 'undefined' && Auth.getCompanyName()) || 'Hintonn PMO';
    const teamId = (typeof Auth !== 'undefined' && Auth.getTeamId()) || 'team_ai';
    const team = Store.getTeam(teamId);
    const teamName = team ? team.name : 'Engineering & AI';

    dropdown.innerHTML = `
      <div style="padding:14px 16px;border-bottom:1px solid var(--color-border-subtle);background:var(--color-bg-page)">
        <div style="font-weight:700;font-size:14px;color:var(--color-text-primary);margin-bottom:3px">${Utils.escapeHtml(user.name)}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
          <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:var(--radius-pill);background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200)">${Utils.escapeHtml(user.role)}</span>
          ${isSuper ? '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:var(--radius-pill);background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;">⚡ Platform Super Admin</span>' : (isAdmin ? '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:var(--radius-pill);background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;">🛡️ Company Admin</span>' : '')}
        </div>
        <div style="font-size:11.5px;color:var(--color-text-secondary);display:flex;flex-direction:column;gap:2px;">
          <div>🏢 <strong>${Utils.escapeHtml(compName)}</strong></div>
          <div>👥 <span>${Utils.escapeHtml(teamName)}</span></div>
          <div style="color:var(--color-text-muted);">${Utils.escapeHtml(user.googleEmail || user.email || '')}</div>
        </div>
      </div>
      <div style="padding:6px">
        ${isAdmin ? `
        <a href="#user-approvals" class="menu-item dropdown-item" onclick="Topbar.closeUserMenu();App.navigate('user-approvals')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>Access & Tenant Isolation</span>
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
