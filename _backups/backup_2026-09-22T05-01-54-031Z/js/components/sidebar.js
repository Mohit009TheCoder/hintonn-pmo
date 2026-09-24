// ─── Sidebar Component (Section 18) ───
const Sidebar = {
  navItems: [
    { section: 'Overview', items: [
      { id: 'dashboard', icon: 'home', label: 'Dashboard' },
      { id: 'projects', icon: 'folder', label: 'Projects' },
      { id: 'tasks', icon: 'checkSquare', label: 'Tasks' },
      { id: 'calendar', icon: 'calendar', label: 'Calendar' },
      { id: 'timeline', icon: 'timeline', label: 'Timeline' },
    ]},
    { section: 'Intelligence', isAi: true, items: [
      { id: 'milestones', icon: 'flag', label: 'Milestones' },
      { id: 'issues', icon: 'alertCircle', label: 'Issues', badge: () => Store.getIssues().filter(i => i.status === 'open').length },
      { id: 'team', icon: 'users', label: 'Team' },
    ]},
    { section: 'Insights', items: [
      { id: 'reports', icon: 'barChart', label: 'Reports & Analytics' },
    ]},
    { section: 'AI', isAi: true, items: [
      { id: 'ai-assistant', icon: 'assistant', label: 'AI Assistant' },
    ]},
  ],

  render() {
    const nav = document.getElementById('sidebar-nav');
    const header = document.querySelector('.sidebar-header');
    const settings = Store.getSettings();
    const current = App.currentScreen;

    // Render Brand Header (Exact Logo: Hexagonal H + Hintonn AI + Mobile Close Button)
    if (header) {
      header.innerHTML = `
        <a href="#dashboard" class="sidebar-brand" title="Hintonn AI" onclick="if(window.innerWidth<=768)App.closeSidebar()">
          <div class="sidebar-logo-icon">
            ${Icons.hexagonH}
          </div>
          <span class="sidebar-brand-title">Hintonn AI</span>
        </a>
        <button class="sidebar-close-btn" onclick="App.closeSidebar()" aria-label="Close navigation menu">
          ${Icons.x}
        </button>
      `;
    }

    let html = '';

    this.navItems.forEach(section => {
      html += `<div class="sidebar-section">
        <div class="sidebar-section-label">${section.section}</div>`;
      
      section.items.forEach(item => {
        const active = current === item.id || (item.id === 'projects' && current === 'project-detail');
        const badge = item.badge ? item.badge() : 0;
        const isAiItem = section.isAi;
        
        html += `<a href="#${item.id}" class="sidebar-item ${active ? 'active' : ''} ${isAiItem ? 'ai-item' : ''}" onclick="if(window.innerWidth<=768)App.closeSidebar()">
          ${Icons[item.icon] || Icons.hexagonSm}
          <span>${item.label}</span>
          ${badge > 0 ? `<span class="badge-count">${badge}</span>` : ''}
        </a>`;
      });
      html += '</div>';
    });

    html += `<div class="sidebar-section" style="margin-top:auto; padding-top: 12px; border-top: 1px solid var(--color-border-subtle);">
      <a href="#settings" class="sidebar-item ${current === 'settings' ? 'active' : ''}" onclick="if(window.innerWidth<=768)App.closeSidebar()">
        ${Icons.settings}
        <span>Settings</span>
      </a>
    </div>`;

    nav.innerHTML = html;
  }
};
