// ─── Topbar Component (Section 19) ───
const Topbar = {
  render() {
    const crumbs = document.getElementById('breadcrumb');
    const settings = Store.getSettings();
    const screen = App.currentScreen;
    const labels = {
      dashboard: 'Dashboard', projects: 'Projects', tasks: 'Tasks', calendar: 'Calendar',
      timeline: 'Timeline & Gantt', milestones: 'Milestones', issues: 'Issues', team: 'Team',
      reports: 'Reports & Analytics', 'ai-assistant': 'AI Assistant', settings: 'Settings',
      notifications: 'Notifications', 'project-detail': 'Project Details'
    };
    let label = labels[screen] || 'Dashboard';
    if (screen === 'project-detail' && App.currentProjectId) {
      const p = Store.getProject(App.currentProjectId);
      label = p ? p.name : 'Project';
    }
    
    crumbs.innerHTML = `
      <span class="workspace-name">${settings.workspaceName || 'Hintonn AI'}</span>
      <span style="color:var(--color-border-strong);font-weight:400">/</span>
      <span class="current">${label}</span>
    `;

    // Render User Avatar
    const avatar = document.getElementById('topbar-avatar');
    if (avatar) {
      const user = Store.getMember(settings.currentUser || 'm1');
      const initials = user ? user.name.split(' ').map(w=>w[0]).join('').slice(0,2) : 'AS';
      avatar.textContent = initials;
      avatar.title = user ? user.name : 'Ayush Sharma';
    }
  }
};
