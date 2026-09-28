// ─── Command Palette / Global Search Modal (#searchModal) ───
const Command = {
  open() {
    const overlay = document.getElementById('command-overlay') || document.getElementById('searchModal');
    if (overlay) overlay.classList.remove('hidden');
    const modalEl = document.getElementById('searchModal');
    if (modalEl && modalEl !== overlay) modalEl.classList.remove('hidden');
    const input = document.getElementById('command-input') || (overlay ? overlay.querySelector('input') : null);
    if (input) {
      input.value = '';
      input.focus();
    }
    const clearBtn = document.getElementById('command-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.renderResults('');
  },

  close() {
    const overlay = document.getElementById('command-overlay');
    if (overlay) overlay.classList.add('hidden');
    const modalEl = document.getElementById('searchModal');
    if (modalEl) modalEl.classList.add('hidden');
  },

  clearSearch() {
    const input = document.getElementById('command-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    const clearBtn = document.getElementById('command-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.renderResults('');
  },

  renderResults(query) {
    const results = document.getElementById('command-results') || (document.getElementById('searchModal') ? document.getElementById('searchModal').querySelector('.command-results') : null);
    if (!results) return;

    const clearBtn = document.getElementById('command-search-clear');
    if (clearBtn) {
      if (query && query.trim()) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }

    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isDeveloper = currentUser && currentUser.role === 'AI Developer';
    const userMemberId = currentUser ? (currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '')) : '';

    if (!query || !query.trim()) {
      results.innerHTML = `
        <div class="command-group-label">Quick Navigation</div>
        <div class="command-item" onclick="Command.close();App.navigate('dashboard')">
          ${Icons.home}<span class="command-item-text">Go to Dashboard</span><span class="command-item-hint">Overview</span>
        </div>
        <div class="command-item" onclick="Command.close();App.navigate('projects')">
          ${Icons.folder}<span class="command-item-text">Go to Projects</span><span class="command-item-hint">Projects</span>
        </div>
        ${isAdmin ? `
        <div class="command-item" onclick="Command.close();App.navigate('timeline')">
          ${Icons.timeline}<span class="command-item-text">Go to Timeline / Gantt</span><span class="command-item-hint">Gantt View</span>
        </div>` : ''}
        <div class="command-item" onclick="Command.close();App.navigate('tasks')">
          ${Icons.checkSquare}<span class="command-item-text">Go to Tasks</span><span class="command-item-hint">Kanban / List</span>
        </div>
        <div class="command-item" onclick="Command.close();App.navigate('calendar')">
          ${Icons.calendar}<span class="command-item-text">Go to Calendar</span><span class="command-item-hint">Schedule</span>
        </div>
        <div class="command-item" onclick="Command.close();App.navigate('issues')">
          ${Icons.alertCircle}<span class="command-item-text">Go to Issues</span><span class="command-item-hint">Tracker</span>
        </div>
        <div class="command-item" onclick="Command.close();App.navigate('milestones')">
          ${Icons.flag}<span class="command-item-text">Go to Milestones</span><span class="command-item-hint">Milestones</span>
        </div>
        <div class="command-item" onclick="Command.close();App.navigate('reports')">
          ${Icons.barChart}<span class="command-item-text">Go to Reports</span><span class="command-item-hint">Analytics</span>
        </div>
        <div class="command-item" onclick="Command.close();App.navigate('ai-assistant')">
          ${Icons.assistant}<span class="command-item-text">Open AI Assistant</span><span class="command-item-hint">Copilot</span>
        </div>
        <div class="command-item" onclick="Command.close();App.navigate('connectors')">
          ${Icons.connectors}<span class="command-item-text">Go to Connectors</span><span class="command-item-hint">Integrations & Sources</span>
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

    // Filter Navigation Pages based on Role Permissions
    let pages = (data.pages || []).filter(page => {
      if (page.adminOnly && !isAdmin) return false;
      return true;
    });

    // Strict Privacy: AI Developers only see items assigned to them or within their project scope
    if (isDeveloper) {
      const allTasks = Store.getTasks();
      const myAllTasks = allTasks.filter(task => 
        task.assigneeId === currentUser.id ||
        (userMemberId && task.assigneeId === userMemberId) ||
        (currentUser.id === 'preet' && task.assigneeId === 'm2') ||
        (currentUser.id === 'mohit' && task.assigneeId === 'm3') ||
        (currentUser.id === 'hirvi' && task.assigneeId === 'm4') ||
        (currentUser.memberId === 'm2' && task.assigneeId === 'preet') ||
        (currentUser.memberId === 'm3' && task.assigneeId === 'mohit') ||
        (currentUser.memberId === 'm4' && task.assigneeId === 'hirvi')
      );
      const myProjectIds = new Set(myAllTasks.map(t => t.projectId));

      data.tasks = (data.tasks || []).filter(task => 
        task.assigneeId === currentUser.id ||
        (userMemberId && task.assigneeId === userMemberId) ||
        (currentUser.id === 'preet' && task.assigneeId === 'm2') ||
        (currentUser.id === 'mohit' && task.assigneeId === 'm3') ||
        (currentUser.id === 'hirvi' && task.assigneeId === 'm4') ||
        (currentUser.memberId === 'm2' && task.assigneeId === 'preet') ||
        (currentUser.memberId === 'm3' && task.assigneeId === 'mohit') ||
        (currentUser.memberId === 'm4' && task.assigneeId === 'hirvi')
      );
      data.projects = (data.projects || []).filter(p => myProjectIds.has(p.id));
      data.issues = (data.issues || []).filter(issue => 
        issue.assigneeId === currentUser.id ||
        (userMemberId && issue.assigneeId === userMemberId) ||
        (currentUser.id === 'preet' && issue.assigneeId === 'm2') ||
        (currentUser.id === 'mohit' && issue.assigneeId === 'm3') ||
        (currentUser.id === 'hirvi' && issue.assigneeId === 'm4') ||
        (currentUser.memberId === 'm2' && issue.assigneeId === 'preet') ||
        (currentUser.memberId === 'm3' && issue.assigneeId === 'mohit') ||
        (currentUser.memberId === 'm4' && issue.assigneeId === 'hirvi')
      );
      data.milestones = (data.milestones || []).filter(m => myProjectIds.has(m.projectId));
    }

    let html = '';

    // Group 1: Pages & Views (Top-Level Navigation)
    if (pages.length > 0) {
      html += '<div class="command-group-label">Pages & Views</div>';
      pages.slice(0, 6).forEach(p => {
        const icon = Icons[p.icon] || Icons.folder;
        html += `<div class="command-item" onclick="Command.close();App.navigate('${p.route}')">
          ${icon}<span class="command-item-text">${p.name}</span><span class="command-item-hint">#${p.route}</span>
        </div>`;
      });
    }

    // Group 2: Projects
    if (data.projects && data.projects.length > 0) {
      html += '<div class="command-group-label">Projects</div>';
      data.projects.slice(0, 5).forEach(p => {
        html += `<div class="command-item" onclick="Command.close();App.navigate('project-detail','${p.id}')">
          ${Icons.folder}<span class="command-item-text">${p.name}</span><span class="command-item-hint">${p.type} · ${Utils.humanize(p.status)}</span>
        </div>`;
      });
    }

    // Group 3: Tasks
    if (data.tasks && data.tasks.length > 0) {
      html += '<div class="command-group-label">Tasks</div>';
      data.tasks.slice(0, 5).forEach(t => {
        const proj = Store.getProject(t.projectId);
        html += `<div class="command-item" onclick="Command.close();TasksScreen.openDetailModal('${t.id}')">
          ${Icons.checkSquare}<span class="command-item-text">${t.title}</span><span class="command-item-hint">${proj ? proj.name : 'Task'} · ${Utils.humanize(t.status)}</span>
        </div>`;
      });
    }

    // Group 4: Milestones
    if (data.milestones && data.milestones.length > 0) {
      html += '<div class="command-group-label">Milestones</div>';
      data.milestones.slice(0, 4).forEach(m => {
        const proj = Store.getProject(m.projectId);
        html += `<div class="command-item" onclick="Command.close();App.navigate('milestones')">
          ${Icons.flag}<span class="command-item-text">${m.name}</span><span class="command-item-hint">${proj ? proj.name : 'Milestone'} · ${m.dueDate ? Utils.formatDate(m.dueDate) : Utils.humanize(m.status)}</span>
        </div>`;
      });
    }

    // Group 5: Issues
    if (data.issues && data.issues.length > 0) {
      html += '<div class="command-group-label">Issues</div>';
      data.issues.slice(0, 4).forEach(i => {
        const proj = Store.getProject(i.projectId);
        html += `<div class="command-item" onclick="Command.close();App.navigate('issues')">
          ${Icons.alertCircle}<span class="command-item-text">${i.title}</span><span class="command-item-hint">${proj ? proj.name : 'Issue'} · ${Utils.humanize(i.priority)}</span>
        </div>`;
      });
    }

    // Group 6: Commercial & Financial Records (Admin Only)
    if (isAdmin && data.commercial) {
      const bgs = data.commercial.bGs || [];
      const invoices = data.commercial.invoices || [];
      if (bgs.length > 0 || invoices.length > 0) {
        html += '<div class="command-group-label">Commercial & Finance</div>';
        bgs.slice(0, 3).forEach(bg => {
          html += `<div class="command-item" onclick="Command.close();App.navigate('${bg.route}')">
            ${Icons.shield}<span class="command-item-text">${bg.ref}</span><span class="command-item-hint">${bg.projectName} · ${bg.type}</span>
          </div>`;
        });
        invoices.slice(0, 3).forEach(inv => {
          html += `<div class="command-item" onclick="Command.close();App.navigate('${inv.route}')">
            ${Icons.creditCard}<span class="command-item-text">${inv.id} (${inv.amount})</span><span class="command-item-hint">${inv.projectName} · ${inv.status}</span>
          </div>`;
        });
      }
    }

    if (!html) {
      html = `
        <div class="command-empty" style="padding:32px 16px;text-align:center">
          <div style="font-size:14px;font-weight:600;color:var(--color-text-primary);margin-bottom:6px">No matching results found for "${query}"</div>
          <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:12px">Try searching for projects, tasks, milestones, issues, or navigation pages.</div>
          <button class="btn btn-secondary btn-sm" onclick="Command.clearSearch()">Clear Search</button>
        </div>
      `;
    }

    results.innerHTML = html;
  }
};


