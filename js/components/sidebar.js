// ─── Sidebar Component (Commercial PMO & EPC Edition) ───
const Sidebar = {
  navItems: [
    { section: 'Overview', items: [
      { id: 'dashboard', icon: 'home', label: 'Dashboard' },
      { id: 'projects', icon: 'folder', label: 'Projects' },
      { id: 'tasks', icon: 'checkSquare', label: 'Tasks' },
      { id: 'issues', icon: 'alertCircle', label: 'Issues', badge: () => Store.getIssues().filter(i => i.status === 'open').length },
      { id: 'milestones', icon: 'flag', label: 'Milestones' },
      { id: 'calendar', icon: 'calendar', label: 'Calendar' },
      { id: 'timeline', icon: 'timeline', label: 'Timeline' },
      { id: 'team', icon: 'users', label: 'Team' },
    ]},
    { section: 'COMMERCIAL', isCommercial: true, items: [
      { id: 'billing', icon: 'fileText', label: 'Billing & Invoices', badge: () => 4 },
      { id: 'retention', icon: 'dollarSign', label: 'Retention Summary' },
      { id: 'bg', icon: 'shield', label: 'Bank Guarantees (BG)', badge: () => 2 },
      { id: 'dlp', icon: 'clock', label: 'DLP Timelines' },
    ]},
    { section: 'AI & Intelligence', isAi: true, items: [
      { id: 'ai-assistant', icon: 'assistant', label: 'AI Assistant' },
      { id: 'connectors', icon: 'connectors', label: 'Connectors' },
    ]},
    { section: 'Insights', items: [
      { id: 'reports', icon: 'barChart', label: 'Reports & Analytics' },
    ]},
  ],

  render() {
    const nav = document.getElementById('sidebar-nav');
    const header = document.querySelector('.sidebar-header') || document.getElementById('top-brand-area');
    const settings = Store.getSettings();
    const current = App.currentScreen;

    // Render Brand Header
    if (header) {
      header.innerHTML = `
        <div class="sidebar-header-row">
          <a href="#dashboard" class="sidebar-brand brand-logo brand-wrapper brand-container" title="Hintonn AI" onclick="if(window.innerWidth<=768)App.closeSidebar()">
            <img 
              src="assets/WhatsApp Image 2026-09-21 at 3.13.45 PM_2.jpeg" 
              alt="Hintonn AI" 
              class="brand-logo-img"
              style="height: 44px; width: auto; max-width: 220px; object-fit: contain; display: block; image-rendering: -webkit-optimize-contrast; mix-blend-mode: multiply; background: transparent !important;"
            />
          </a>
          <div class="sidebar-header-actions">
            <button class="sidebar-close-btn" onclick="App.closeSidebar()" aria-label="Close navigation menu">
              ${Icons.x}
            </button>
          </div>
        </div>
      `;
    }

    let html = '';
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = user && user.role === 'Admin';

    this.navItems.forEach(section => {
      // Filter items based on RBAC matrix
      const accessibleItems = section.items.filter(item => {
        return typeof Auth === 'undefined' || Auth.hasAccess(item.id);
      });

      // If no items in this section are accessible, skip the section
      if (accessibleItems.length === 0) {
        return;
      }

      html += `<div class="sidebar-section">
        <div class="sidebar-section-label">${section.section}</div>`;
      
      accessibleItems.forEach(item => {
        const active = current === item.id || 
          (item.id === 'projects' && current === 'project-detail') ||
          (item.id === 'bg' && (current === 'bank-guarantees' || current === 'bg')) ||
          (item.id === 'dlp' && (current === 'dlp-timelines' || current === 'dlp')) ||
          (item.id === 'billing' && (current === 'invoices' || current === 'billing'));
        const badge = item.badge ? item.badge() : 0;
        const isAiItem = section.isAi;
        const isCommercial = section.isCommercial;
        
        html += `<a href="#${item.id}" class="sidebar-item ${active ? 'active' : ''} ${isAiItem ? 'ai-item' : ''} ${isCommercial ? 'commercial-item' : ''}" onclick="if(window.innerWidth<=768)App.closeSidebar()">
          ${Icons[item.icon] || Icons.hexagonSm}
          <span>${item.label}</span>
          ${badge > 0 ? `<span class="badge-count">${badge}</span>` : ''}
        </a>`;
      });
      html += '</div>';
    });

    // Render Settings & Admin section based on RBAC access
    if (typeof Auth !== 'undefined' && Auth.hasAccess('settings')) {
      html += `<div class="sidebar-section" style="margin-top:auto; padding-top: 12px; border-top: 1px solid var(--color-border-subtle);">
        <div class="sidebar-section-label">Administration</div>
        <a href="#user-approvals" class="sidebar-item ${current === 'user-approvals' ? 'active' : ''}" onclick="if(window.innerWidth<=768)App.closeSidebar()">
          ${Icons.users || Icons.hexagonSm}
          <span>User Approvals</span>
          ${typeof Auth !== 'undefined' && Auth.getPendingUsers && Auth.getPendingUsers().length > 0 ? `<span class="badge-count" style="background:#F59E0B;color:#fff;">${Auth.getPendingUsers().length}</span>` : ''}
        </a>
        <a href="#settings" class="sidebar-item ${current === 'settings' ? 'active' : ''}" onclick="if(window.innerWidth<=768)App.closeSidebar()">
          ${Icons.settings}
          <span>Settings</span>
        </a>
      </div>`;
    }

    nav.innerHTML = html;
  }
};
