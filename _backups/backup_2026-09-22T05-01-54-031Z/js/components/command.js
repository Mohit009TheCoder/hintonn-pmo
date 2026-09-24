// ─── Command Palette ───
const Command = {
  open() {
    document.getElementById('command-overlay').classList.remove('hidden');
    const input = document.getElementById('command-input');
    input.value = '';
    input.focus();
    this.renderResults('');
  },

  close() { document.getElementById('command-overlay').classList.add('hidden'); },

  renderResults(query) {
    const results = document.getElementById('command-results');
    if (!query) {
      results.innerHTML = `
        <div class="command-group-label">Quick Navigation</div>
        <div class="command-item" onclick="Command.close();App.navigate('dashboard')">
          ${Icons.home}<span class="command-item-text">Go to Dashboard</span><span class="command-item-hint">Overview</span>
        </div>
        <div class="command-item" onclick="Command.close();App.navigate('projects')">
          ${Icons.folder}<span class="command-item-text">Go to Projects</span><span class="command-item-hint">Projects</span>
        </div>
        <div class="command-item" onclick="Command.close();App.navigate('timeline')">
          ${Icons.timeline}<span class="command-item-text">Go to Timeline / Gantt</span><span class="command-item-hint">Gantt View</span>
        </div>
        <div class="command-item" onclick="Command.close();App.navigate('tasks')">
          ${Icons.checkSquare}<span class="command-item-text">Go to Tasks</span><span class="command-item-hint">Kanban / List</span>
        </div>
        <div class="command-item" onclick="Command.close();App.navigate('ai-assistant')">
          ${Icons.assistant}<span class="command-item-text">Open AI Assistant</span><span class="command-item-hint">Copilot</span>
        </div>
        <div class="command-group-label">Actions</div>
        <div class="command-item" onclick="Command.close();TasksScreen.openCreateModal()">
          ${Icons.plus}<span class="command-item-text">Create new task</span>
        </div>
        <div class="command-item" onclick="Command.close();ProjectsScreen.openCreateModal()">
          ${Icons.plus}<span class="command-item-text">Create new project</span>
        </div>
        <div class="command-item" onclick="Command.close();IssuesScreen.openCreateModal()">
          ${Icons.plus}<span class="command-item-text">Report new issue</span>
        </div>`;
      return;
    }
    const data = Store.search(query);
    const members = Store.getMembers().filter(m => m.name.toLowerCase().includes(query.toLowerCase()) || m.role.toLowerCase().includes(query.toLowerCase()));
    let html = '';

    if (data.projects.length) {
      html += '<div class="command-group-label">Projects</div>';
      data.projects.slice(0, 4).forEach(p => {
        html += `<div class="command-item" onclick="Command.close();App.navigate('project-detail','${p.id}')">
          ${Icons.folder}<span class="command-item-text">${p.name}</span><span class="command-item-hint">${Utils.humanize(p.status)}</span>
        </div>`;
      });
    }
    if (data.tasks.length) {
      html += '<div class="command-group-label">Tasks</div>';
      data.tasks.slice(0, 5).forEach(t => {
        html += `<div class="command-item" onclick="Command.close();TasksScreen.openDetailModal('${t.id}')">
          ${Icons.checkSquare}<span class="command-item-text">${t.title}</span><span class="command-item-hint">${Utils.humanize(t.status)}</span>
        </div>`;
      });
    }
    if (members.length) {
      html += '<div class="command-group-label">Team Members</div>';
      members.slice(0, 3).forEach(m => {
        html += `<div class="command-item" onclick="Command.close();App.navigate('team')">
          ${Icons.users}<span class="command-item-text">${m.name}</span><span class="command-item-hint">${m.role}</span>
        </div>`;
      });
    }
    if (data.milestones.length) {
      html += '<div class="command-group-label">Milestones</div>';
      data.milestones.slice(0, 3).forEach(m => {
        html += `<div class="command-item" onclick="Command.close();App.navigate('milestones')">
          ${Icons.flag}<span class="command-item-text">${m.name}</span><span class="command-item-hint">${m.dueDate ? Utils.formatDate(m.dueDate) : 'No date'}</span>
        </div>`;
      });
    }
    if (data.issues.length) {
      html += '<div class="command-group-label">Issues</div>';
      data.issues.slice(0, 3).forEach(i => {
        html += `<div class="command-item" onclick="Command.close();App.navigate('issues')">
          ${Icons.alertCircle}<span class="command-item-text">${i.title}</span><span class="command-item-hint">${Utils.humanize(i.status)}</span>
        </div>`;
      });
    }
    if (!html) html = '<div class="command-empty">No results found</div>';
    results.innerHTML = html;
  }
};
