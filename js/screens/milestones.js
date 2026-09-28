// ─── Milestones Screen ───
const MilestonesScreen = {
  _filter: { search: '' },

  _getFilteredMilestones() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isDeveloper = currentUser && currentUser.role === 'AI Developer';
    const userMemberId = currentUser ? (currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '')) : '';

    let allMilestones = Store.getMilestones();
    let milestones = allMilestones;

    // Strict Privacy: Filter milestones to projects containing tasks assigned to AI Developer
    if (isDeveloper) {
      const allTasks = Store.getTasks();
      const myTasks = allTasks.filter(task =>
        task.assigneeId === currentUser.id ||
        (userMemberId && task.assigneeId === userMemberId)
      );
      const myProjectIds = new Set(myTasks.map(t => t.projectId));

      // Also include projects where user is a member
      allProjects = allProjects || Store.getProjects();
      allProjects.filter(p =>
        Array.isArray(p.memberIds) && (
          p.memberIds.includes(userMemberId) ||
          p.memberIds.includes(currentUser.id)
        )
      ).forEach(p => myProjectIds.add(p.id));

      milestones = milestones.filter(m => myProjectIds.has(m.projectId));
    }

    if (this._filter.search) {
      const q = this._filter.search.toLowerCase().trim();
      milestones = milestones.filter(m => {
        const proj = Store.getProject(m.projectId);
        const projName = proj ? proj.name.toLowerCase() : '';
        return (
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.status && m.status.toLowerCase().includes(q)) ||
          projName.includes(q)
        );
      });
    }

    return milestones;
  },

  handleSearch(query) {
    this._filter.search = query;
    const clearBtn = document.getElementById('milestone-search-clear');
    if (clearBtn) {
      if (query && query.trim()) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }
    const container = document.getElementById('milestones-container');
    if (container) {
      const milestones = this._getFilteredMilestones();
      container.innerHTML = this._renderContent(milestones);
    }
  },

  clearSearch() {
    this._filter.search = '';
    const input = document.getElementById('milestone-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    const clearBtn = document.getElementById('milestone-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    const container = document.getElementById('milestones-container');
    if (container) {
      const milestones = this._getFilteredMilestones();
      container.innerHTML = this._renderContent(milestones);
    }
  },

  _renderContent(milestones) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';

    if (milestones.length === 0) {
      if (this._filter.search) {
        return `
          <div class="empty-state" style="padding:48px 24px;text-align:center">
            <div class="empty-state-icon" style="margin-bottom:12px">${Icons.search || Icons.flag}</div>
            <h3 style="font-size:16px;font-weight:700;color:var(--color-text-primary);margin-bottom:6px">No matching results found for "${this._filter.search}"</h3>
            <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:16px">Try searching for a different milestone or project deliverable.</p>
            <button class="btn btn-secondary btn-sm" onclick="MilestonesScreen.clearSearch()">Clear Search</button>
          </div>
        `;
      }
      return `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons.flag}</div>
          <h3>No milestones yet</h3>
          <p>Create milestones to track major project deliverables.</p>
          ${isAdmin ? `<button class="btn btn-primary" onclick="MilestonesScreen.openCreateModal()">${Icons.plus} New Milestone</button>` : ''}
        </div>
      `;
    }

    return `
      <div class="milestone-list">
        ${milestones.map(m => {
          const proj = Store.getProject(m.projectId);
          const status = m.status === 'completed' ? 'completed' : new Date(m.dueDate) < new Date() ? 'pending' : 'upcoming';
          const isOverdue = m.status !== 'completed' && m.dueDate && new Date(m.dueDate) < new Date();
          return `
            <div class="milestone-item">
              <div class="milestone-icon ${status}">${status==='completed' ? Icons.check : Icons.flag}</div>
              <div class="milestone-info">
                <div class="milestone-name">${m.name}</div>
                <div class="milestone-date">${proj ? proj.name + ' · ' : ''}${m.dueDate ? (isOverdue ? 'Overdue: ' : 'Due ') + Utils.formatDate(m.dueDate) : 'No due date'}</div>
              </div>
              <span class="badge badge-${status==='completed'?'completed':status==='pending'?'paused':'planning'}">${Utils.humanize(m.status)}</span>
              ${isAdmin && m.status !== 'completed' ? `<button class="btn btn-ghost btn-sm" onclick="MilestonesScreen.completeMilestone('${m.id}')">Complete</button>` : ''}
              ${isAdmin ? `<button class="btn btn-ghost btn-sm btn-icon" onclick="MilestonesScreen.openEditModal('${m.id}')">${Icons.edit}</button>` : ''}
              ${isAdmin ? `<button class="btn btn-ghost btn-sm btn-icon" onclick="MilestonesScreen.deleteMilestone('${m.id}')">${Icons.trash}</button>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  render() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isDeveloper = currentUser && currentUser.role === 'AI Developer';
    const isAdmin = currentUser && currentUser.role === 'Admin';

    const allMilestones = Store.getMilestones();
    const milestones = this._getFilteredMilestones();

    const completed = milestones.filter(m => m.status === 'completed').length;
    const subtitle = isDeveloper
      ? `${milestones.length} milestones in your project scope · ${completed} completed`
      : `${allMilestones.length} total · ${completed} completed`;

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Milestones</h1>
          <p id="milestones-subtitle">${subtitle}</p>
        </div>
        <div class="page-header-actions">
          ${isAdmin ? `<button class="btn btn-primary" onclick="MilestonesScreen.openCreateModal()">${Icons.plus} New Milestone</button>` : ''}
        </div>
      </div>

      <div class="filter-bar" id="milestones-filter-bar">
        <div class="search-input-wrap">
          <span class="search-icon">${Icons.search}</span>
          <input type="text" id="milestone-search-input" class="form-input search-input" placeholder="Search milestones..." value="${this._filter.search}" oninput="MilestonesScreen.handleSearch(this.value)">
          <button type="button" id="milestone-search-clear" class="search-clear-btn ${this._filter.search ? '' : 'hidden'}" onclick="MilestonesScreen.clearSearch()" title="Clear search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div id="milestones-container">
        ${this._renderContent(milestones)}
      </div>
    `;
  },

  openCreateModal(projectId) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    if (!isAdmin) { Toast.show('Only admins can create milestones', 'error'); return; }
    const isDeveloper = currentUser && currentUser.role === 'AI Developer';
    const userMemberId = currentUser ? (currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '')) : '';

    let projects = Store.getProjects();
    if (isDeveloper) {
      const allTasks = Store.getTasks();
      const myTasks = allTasks.filter(task => 
        task.assigneeId === currentUser.id ||
        (userMemberId && task.assigneeId === userMemberId) ||
        (currentUser.id === 'preet' && task.assigneeId === 'm2') ||
        (currentUser.id === 'mohit' && task.assigneeId === 'm3') ||
        (currentUser.id === 'hirvi' && task.assigneeId === 'm4') ||
        (currentUser.memberId === 'm2' && task.assigneeId === 'preet') ||
        (currentUser.memberId === 'm3' && task.assigneeId === 'mohit') ||
        (currentUser.memberId === 'm4' && task.assigneeId === 'hirvi')
      );
      const myProjectIds = new Set(myTasks.map(t => t.projectId));
      projects = projects.filter(p => myProjectIds.has(p.id));
    }
    const body = `
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label">Milestone Name *</label>
        <input type="text" class="form-input" id="ms-name" placeholder="e.g. Beta Launch">
      </div>
      <div class="form-row" style="margin-bottom:16px">
        <div class="form-group">
          <label class="form-label">Project *</label>
          <select class="form-select" id="ms-project">
            <option value="">Select project</option>
            ${projects.map(p => `<option value="${p.id}" ${projectId===p.id?'selected':''}>${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input type="date" class="form-input" id="ms-due">
        </div>
      </div>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button><button class="btn btn-primary" onclick="MilestonesScreen.saveMilestone()">Create Milestone</button>`;
    Modal.open('New Milestone', body, footer);
  },

  openEditModal(id) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    if (!isAdmin) { Toast.show('Only admins can edit milestones', 'error'); return; }
    const m = Store.getMilestones().find(x=>x.id===id); if (!m) return;
    const projects = Store.getProjects();
    const body = `
      <div class="form-group" style="margin-bottom:16px"><label class="form-label">Name</label><input type="text" class="form-input" id="ms-name" value="${m.name}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Project</label><select class="form-select" id="ms-project">${projects.map(p=>`<option value="${p.id}" ${m.projectId===p.id?'selected':''}>${p.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Due Date</label><input type="date" class="form-input" id="ms-due" value="${m.dueDate||''}"></div>
      </div>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button><button class="btn btn-primary" onclick="MilestonesScreen.saveMilestone('${id}')">Save</button>`;
    Modal.open('Edit Milestone', body, footer);
  },

  saveMilestone(id) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    if (!isAdmin) { Toast.show('Only admins can save milestones', 'error'); return; }
    const name = document.getElementById('ms-name').value.trim();
    const projectId = document.getElementById('ms-project').value;
    if (!name || !projectId) { Toast.show('Name and project are required', 'error'); return; }
    const data = { name, projectId, dueDate: document.getElementById('ms-due').value };
    if (id) { Store.updateMilestone(id, data); Toast.show('Milestone updated'); }
    else { Store.createMilestone(data); Toast.show('Milestone created'); }
    Modal.closeAll(); App.refresh();
  },

  completeMilestone(id) { const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null; if (!(currentUser && currentUser.role === 'Admin')) { Toast.show('Only admins can complete milestones', 'error'); return; } Store.updateMilestone(id, { status: 'completed' }); Toast.show('Milestone completed!'); App.refresh(); },
  deleteMilestone(id) { const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null; if (!(currentUser && currentUser.role === 'Admin')) { Toast.show('Only admins can delete milestones', 'error'); return; } Modal.confirm('Delete Milestone', 'Are you sure?', () => { Store.deleteMilestone(id); Toast.show('Milestone deleted'); App.refresh(); }, { danger: true }); },
  refresh() { document.getElementById('page-content').innerHTML = this.render(); }
};
