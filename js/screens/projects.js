// ─── Projects Screen ───
const ProjectsScreen = {
  _view: 'grid',
  _filter: { status: '', type: '', search: '' },

  _getFilteredProjects() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isDeveloper = currentUser && currentUser.role === 'AI Developer';
    const userMemberId = currentUser ? (currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '')) : '';

    let allProjects = Store.getProjects();
    let projects = allProjects;

    // Strict Privacy: AI Developers only see projects containing tasks assigned to them
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

    if (this._filter.status) projects = projects.filter(p => p.status === this._filter.status);
    if (this._filter.type) projects = projects.filter(p => p.type === this._filter.type);
    
    // Standardized real-time case-insensitive substring search: name, description, category/type, tags
    if (this._filter.search) {
      const q = this._filter.search.toLowerCase().trim();
      projects = projects.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.type && p.type.toLowerCase().includes(q)) ||
        (p.status && p.status.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }
    return projects;
  },

  render() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isDeveloper = currentUser && currentUser.role === 'AI Developer';
    const allProjects = Store.getProjects();
    const projects = this._getFilteredProjects();

    const subtitle = isDeveloper
      ? `${projects.length} assigned projects · ${projects.filter(p=>p.status==='active').length} active`
      : `${allProjects.length} projects total · ${allProjects.filter(p=>p.status==='active').length} active`;

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Projects</h1>
          <p id="projects-subtitle">${subtitle}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="ProjectsScreen.openCreateModal()">
            ${Icons.plus} New Project
          </button>
        </div>
      </div>

      <div class="filter-bar" id="projects-filter-bar">
        <div class="search-input-wrap">
          <span class="search-icon">${Icons.search}</span>
          <input type="text" id="project-search-input" class="form-input search-input" placeholder="Search projects..." value="${this._filter.search}" oninput="ProjectsScreen.handleSearch(this.value)">
          <button type="button" id="project-search-clear" class="search-clear-btn ${this._filter.search ? '' : 'hidden'}" onclick="ProjectsScreen.clearSearch()" title="Clear search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <select class="form-select" id="project-filter-status" style="width:140px" onchange="ProjectsScreen.handleFilterChange('status', this.value)">
          <option value="">All Status</option>
          <option value="planning" ${this._filter.status==='planning'?'selected':''}>Planning</option>
          <option value="active" ${this._filter.status==='active'?'selected':''}>Active</option>
          <option value="completed" ${this._filter.status==='completed'?'selected':''}>Completed</option>
          <option value="paused" ${this._filter.status==='paused'?'selected':''}>Paused</option>
          <option value="archived" ${this._filter.status==='archived'?'selected':''}>Archived</option>
        </select>
        <select class="form-select" id="project-filter-type" style="width:140px" onchange="ProjectsScreen.handleFilterChange('type', this.value)">
          <option value="">All Types</option>
          <option value="AI/ML" ${this._filter.type==='AI/ML'?'selected':''}>AI/ML</option>
          <option value="Software" ${this._filter.type==='Software'?'selected':''}>Software</option>
          <option value="Marketing" ${this._filter.type==='Marketing'?'selected':''}>Marketing</option>
          <option value="Business" ${this._filter.type==='Business'?'selected':''}>Business</option>
          <option value="Research" ${this._filter.type==='Research'?'selected':''}>Research</option>
          <option value="Internal" ${this._filter.type==='Internal'?'selected':''}>Internal</option>
          <option value="Client" ${this._filter.type==='Client'?'selected':''}>Client</option>
        </select>
        <div style="flex:1"></div>
        <div style="display:flex;gap:4px">
          <button id="project-view-grid-btn" class="btn btn-ghost btn-sm btn-icon ${this._view==='grid'?'active':''}" onclick="ProjectsScreen.handleViewChange('grid')" style="${this._view==='grid'?'background:var(--color-surface-subtle)':''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button id="project-view-list-btn" class="btn btn-ghost btn-sm btn-icon ${this._view==='list'?'active':''}" onclick="ProjectsScreen.handleViewChange('list')" style="${this._view==='list'?'background:var(--color-surface-subtle)':''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div id="projects-list" class="projects-grid-container">
        ${this._renderContent(projects)}
      </div>`;
  },

  handleSearch(val) {
    this._filter.search = val;
    const clearBtn = document.getElementById('project-search-clear');
    if (clearBtn) {
      if (val) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }
    this.updateProjectsContainer();
  },

  clearSearch() {
    this._filter.search = '';
    const input = document.getElementById('project-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    const clearBtn = document.getElementById('project-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.updateProjectsContainer();
  },

  handleFilterChange(field, val) {
    this._filter[field] = val;
    this.updateProjectsContainer();
  },

  handleViewChange(view) {
    this._view = view;
    const gridBtn = document.getElementById('project-view-grid-btn');
    const listBtn = document.getElementById('project-view-list-btn');
    if (gridBtn && listBtn) {
      gridBtn.classList.toggle('active', view === 'grid');
      gridBtn.style.background = view === 'grid' ? 'var(--color-surface-subtle)' : '';
      listBtn.classList.toggle('active', view === 'list');
      listBtn.style.background = view === 'list' ? 'var(--color-surface-subtle)' : '';
    }
    this.updateProjectsContainer();
  },

  updateProjectsContainer() {
    const projects = this._getFilteredProjects();
    const allProjects = Store.getProjects();
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isDeveloper = currentUser && currentUser.role === 'AI Developer';

    const subtitleEl = document.getElementById('projects-subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = isDeveloper
        ? `${projects.length} assigned projects · ${projects.filter(p=>p.status==='active').length} active`
        : `${allProjects.length} projects total · ${allProjects.filter(p=>p.status==='active').length} active`;
    }

    const container = document.getElementById('projects-list') || document.querySelector('.projects-grid') || document.querySelector('.project-grid');
    if (container) {
      container.innerHTML = this._renderContent(projects);
    } else {
      this.refresh();
      return;
    }
  },

  _renderContent(projects) {
    if (projects.length === 0) {
      if (this._filter.search) {
        return `
          <div class="empty-state">
            <div class="empty-state-icon">${Icons.search}</div>
            <h3>No matching results found for "${this._filter.search}"</h3>
            <p>Try searching for a different project name, description, or type.</p>
            <button class="btn btn-secondary btn-sm" onclick="ProjectsScreen.clearSearch()">Clear Search</button>
          </div>
        `;
      }
      return `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons.folder}</div>
          <h3>No projects found</h3>
          <p>${this._filter.status || this._filter.type ? 'Try adjusting your filters.' : 'Create your first project to get started.'}</p>
          ${!this._filter.status && !this._filter.type ? '<button class="btn btn-primary" onclick="ProjectsScreen.openCreateModal()">'+Icons.plus+' New Project</button>' : ''}
        </div>`;
    }
    return this._view === 'grid' ? this._renderGrid(projects) : this._renderList(projects);
  },

  _renderGrid(projects) {
    const colors = ['progress-blue', 'progress-purple', 'progress-green', 'progress-gradient'];
    return `<div class="project-grid projects-grid">${projects.map((p, i) => {
      const tasks = Store.getTasks(p.id);
      const doneTasks = tasks.filter(t => t.status === 'done').length;
      const members = p.memberIds.map(id => Store.getMember(id)).filter(Boolean);
      return `<div class="project-card" onclick="App.navigate('project-detail','${p.id}')">
        <div class="project-card-header">
          <div>
            <div class="project-card-type">${p.type}</div>
            <div class="project-card-name">${p.name}</div>
          </div>
          <span class="badge badge-${p.status}">${Utils.humanize(p.status)}</span>
        </div>
        <div class="project-card-desc">${p.description}</div>
        <div class="project-card-progress">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span class="body-sm" style="color:var(--color-text-muted)">Progress</span>
            <span class="body-sm" style="font-weight:600;color:var(--color-text-primary)">${p.progress}%</span>
          </div>
          <div class="progress-bar ${colors[i % colors.length]}"><div class="progress-bar-fill" style="width:${p.progress}%"></div></div>
        </div>
        <div class="project-card-meta">
          <div class="project-card-avatars">${members.slice(0,3).map(m =>
            `<div class="avatar avatar-sm" style="background:${m.color}" title="${m.name}">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>`
          ).join('')}${members.length > 3 ? `<div class="avatar avatar-sm" style="background:var(--color-surface-subtle);color:var(--color-text-muted)">+${members.length-3}</div>` : ''}</div>
          <div class="project-card-stats">
            <span>${doneTasks}/${tasks.length} tasks</span>
          </div>
        </div>
      </div>`;
    }).join('')}</div>`;
  },

  _renderList(projects) {
    return `<div class="section-card"><div class="section-card-body no-pad"><div class="table-wrap"><table class="table">
      <thead><tr><th>Project</th><th>Type</th><th>Status</th><th>Progress</th><th>Team</th><th>Due</th></tr></thead>
      <tbody>${projects.map(p => {
        const members = p.memberIds.map(id => Store.getMember(id)).filter(Boolean);
        return `<tr style="cursor:pointer" onclick="App.navigate('project-detail','${p.id}')">
          <td><span class="task-title">${p.name}</span><br><span style="font-size:11px;color:var(--color-text-muted)">${Utils.truncate(p.description, 60)}</span></td>
          <td><span style="font-size:12px">${p.type}</span></td>
          <td><span class="badge badge-${p.status}">${Utils.humanize(p.status)}</span></td>
          <td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar progress-blue" style="width:80px"><div class="progress-bar-fill" style="width:${p.progress}%"></div></div><span style="font-size:12px;font-weight:600">${p.progress}%</span></div></td>
          <td><div class="project-card-avatars">${members.slice(0,3).map(m => `<div class="avatar avatar-sm" style="background:${m.color}">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>`).join('')}</div></td>
          <td style="font-size:12px;color:var(--color-text-muted)">${p.endDate ? Utils.formatDate(p.endDate) : '—'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div></div></div>`;
  },

  refresh() {
    const content = document.getElementById('page-content');
    if (content) content.innerHTML = this.render();
  },

  openCreateModal(project) {
    const isEdit = !!project;
    const members = Store.getMembers();
    const body = `
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label">Project Name *</label>
        <input type="text" class="form-input" id="project-name" value="${isEdit ? project.name : ''}" placeholder="Enter project name">
        <div class="form-error" id="project-name-error"></div>
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="project-desc" placeholder="Brief description of the project">${isEdit ? project.description : ''}</textarea>
      </div>
      <div class="form-row" style="margin-bottom:16px">
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-select" id="project-type">
            ${['AI/ML','Software','Marketing','Business','Research','Internal','Client','Other'].map(t => `<option value="${t}" ${isEdit && project.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-select" id="project-priority">
            ${['low','medium','high'].map(p => `<option value="${p}" ${isEdit && project.priority===p?'selected':''}>${Utils.humanize(p)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row" style="margin-bottom:16px">
        <div class="form-group">
          <label class="form-label">Start Date</label>
          <input type="date" class="form-input" id="project-start" value="${isEdit ? project.startDate : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">End Date</label>
          <input type="date" class="form-input" id="project-end" value="${isEdit ? project.endDate : ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Team Members</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
          ${members.map(m => {
            const checked = isEdit && project.memberIds.includes(m.id);
            return `<label style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid ${checked?'var(--color-primary)':'var(--color-border)'};border-radius:var(--radius-md);cursor:pointer;font-size:13px;${checked?'background:var(--color-primary-50)':''}">
              <input type="checkbox" value="${m.id}" class="project-member-check" ${checked?'checked':''} style="display:none">
              <div class="avatar avatar-sm" style="background:${m.color}">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
              ${m.name}
            </label>`;
          }).join('')}
        </div>
      </div>`;

    const footer = `
      ${isEdit ? `<button class="btn btn-danger" onclick="ProjectsScreen.deleteProject('${project.id}')" style="margin-right:auto">Delete</button>` : ''}
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="ProjectsScreen.saveProject(${isEdit ? `'${project.id}'` : 'null'})">${isEdit ? 'Save Changes' : 'Create Project'}</button>`;

    Modal.open(isEdit ? 'Edit Project' : 'New Project', body, footer, { large: true });

    // Toggle member checkboxes
    document.querySelectorAll('.project-member-check').forEach(cb => {
      cb.closest('label').onclick = (e) => {
        e.preventDefault();
        cb.checked = !cb.checked;
        const label = cb.closest('label');
        label.style.borderColor = cb.checked ? 'var(--color-primary)' : 'var(--color-border)';
        label.style.background = cb.checked ? 'var(--color-primary-50)' : '';
      };
    });
  },

  saveProject(id) {
    const name = document.getElementById('project-name').value.trim();
    const errorEl = document.getElementById('project-name-error');
    if (!name) { errorEl.textContent = 'Project name is required'; document.getElementById('project-name').classList.add('error'); return; }
    const memberIds = [...document.querySelectorAll('.project-member-check:checked')].map(cb => cb.value);
    const data = {
      name, description: document.getElementById('project-desc').value.trim(),
      type: document.getElementById('project-type').value, priority: document.getElementById('project-priority').value,
      startDate: document.getElementById('project-start').value, endDate: document.getElementById('project-end').value,
      memberIds
    };
    if (id) { Store.updateProject(id, data); Toast.show('Project updated'); }
    else { Store.createProject(data); Toast.show('Project created'); }
    Modal.closeAll(); App.refresh();
  },

  deleteProject(id) {
    const p = Store.getProject(id);
    Modal.confirm('Delete Project', `Are you sure you want to delete <strong>${p.name}</strong>? This will also delete all associated tasks, issues, and milestones. This cannot be undone.`,
      () => { Store.deleteProject(id); Toast.show('Project deleted'); App.navigate('projects'); }, { danger: true });
  }
};
