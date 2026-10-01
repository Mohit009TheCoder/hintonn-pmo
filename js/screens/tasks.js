// ─── Tasks Screen (Bifurcated Kanban: Assigned Project Tasks vs Personal Tasks & Shared Project Collaboration) ───
const TasksScreen = {
  _view: 'kanban',
  _filter: { project: '', status: '', priority: '', assignee: '', search: '' },
  _dragTask: null,
  _modalSubtasks: [],

  _isUserTask(t, currentUser) {
    if (!t || !currentUser) return false;
    const userMemberId = currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '');
    const ids = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0
      ? t.assigneeIds
      : (t.assigneeId ? [t.assigneeId] : []);

    return ids.some(id =>
      id === currentUser.id ||
      (userMemberId && id === userMemberId) ||
      (currentUser.id === 'preet' && id === 'm2') ||
      (currentUser.id === 'mohit' && id === 'm3') ||
      (currentUser.id === 'hirvi' && id === 'm4') ||
      (currentUser.memberId === 'm2' && id === 'preet') ||
      (currentUser.memberId === 'm3' && id === 'mohit') ||
      (currentUser.memberId === 'm4' && id === 'hirvi')
    );
  },

  _isOwnPersonalTask(t, currentUser) {
    if (!t || !t.isPersonal || !currentUser) return false;
    if (currentUser.role === 'Admin') return false;
    const uid = currentUser.id;
    const mid = currentUser.memberId || (uid === 'preet' ? 'm2' : uid === 'mohit' ? 'm3' : uid === 'hirvi' ? 'm4' : '');

    // Strict Personal Task Privacy: Accessible ONLY by the individual standard user who created it
    if (t.userId && (t.userId === uid || (mid && t.userId === mid))) return true;
    if (t.creatorId && (t.creatorId === uid || (mid && t.creatorId === mid))) return true;
    if (t.assigneeId && (t.assigneeId === uid || (mid && t.assigneeId === mid))) return true;
    if (Array.isArray(t.assigneeIds) && (t.assigneeIds.includes(uid) || (mid && t.assigneeIds.includes(mid)))) return true;
    if (t.createdBy && currentUser.name && t.createdBy === currentUser.name) return true;
    return false;
  },

  _isUserCollaboratorOnProject(projectId, currentUser) {
    if (!projectId || !currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    const project = Store.getProject(projectId);
    if (!project) return false;
    const userMemberId = currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '');
    return Array.isArray(project.memberIds) && (
      project.memberIds.includes(userMemberId) ||
      project.memberIds.includes(currentUser.id) ||
      (currentUser.id === 'preet' && project.memberIds.includes('m2')) ||
      (currentUser.id === 'mohit' && project.memberIds.includes('m3')) ||
      (currentUser.id === 'hirvi' && project.memberIds.includes('m4'))
    );
  },

  _getFilteredTasks() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isStandardUser = !isAdmin;

    let tasks = Store.getTasks();

    if (isAdmin) {
      // Admin monitors all project tasks across the organization; personal tasks strictly omitted
      tasks = tasks.filter(t => !t.isPersonal);
    } else if (isStandardUser) {
      if (this._filter.project) {
        // Project filter: strictly tasks assigned to the current user within this project
        // Personal tasks are excluded from project-specific views
        tasks = tasks.filter(t => 
          !t.isPersonal &&
          t.projectId === this._filter.project &&
          this._isUserTask(t, currentUser)
        );
      } else {
        // All Projects view: strictly tasks assigned to the current user + user's own private personal tasks
        // Strictly omits tasks assigned solely to other team members
        tasks = tasks.filter(t => 
          (t.isPersonal && this._isOwnPersonalTask(t, currentUser)) ||
          (!t.isPersonal && this._isUserTask(t, currentUser))
        );
      }
    }

    if (this._filter.project) tasks = tasks.filter(t => t.projectId === this._filter.project && !t.isPersonal);
    if (this._filter.status) tasks = tasks.filter(t => t.status === this._filter.status);
    if (this._filter.priority) tasks = tasks.filter(t => t.priority === this._filter.priority);
    if (isAdmin && this._filter.assignee) {
      tasks = tasks.filter(t => {
        const ids = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
        return ids.includes(this._filter.assignee);
      });
    }

    // Real-time search: title, description, project.name, assignee.name
    if (this._filter.search) {
      const q = this._filter.search.toLowerCase().trim();
      tasks = tasks.filter(t => {
        const proj = Store.getProject(t.projectId);
        const ids = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
        const assigneeNames = ids.map(id => Store.getMember(id)?.name?.toLowerCase() || '').join(' ');
        const projName = proj ? proj.name.toLowerCase() : '';
        return (
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          projName.includes(q) ||
          assigneeNames.includes(q)
        );
      });
    }

    return tasks;
  },

  render() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isStandardUser = !isAdmin;
    const userMemberId = currentUser ? (currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '')) : '';

    const allTasks = isAdmin ? Store.getTasks().filter(t => !t.isPersonal) : Store.getTasks();
    const tasks = this._getFilteredTasks();

    const allProjects = Store.getProjects();
    const projects = isStandardUser
      ? allProjects.filter(p =>
          Array.isArray(p.memberIds) && (
            p.memberIds.includes(userMemberId) ||
            p.memberIds.includes(currentUser?.id) ||
            (currentUser?.id === 'preet' && p.memberIds.includes('m2')) ||
            (currentUser?.id === 'mohit' && p.memberIds.includes('m3')) ||
            (currentUser?.id === 'hirvi' && p.memberIds.includes('m4'))
          )
        )
      : allProjects;

    const assignees = Store.getAssignees();

    const subtitle = isStandardUser
      ? (this._filter.project
          ? `${tasks.filter(t=>!t.isPersonal).length} project tasks · ${tasks.filter(t=>t.status==='done').length} completed`
          : `${tasks.length} tasks (${tasks.filter(t=>!t.isPersonal).length} assigned, ${tasks.filter(t=>t.isPersonal).length} personal) · ${tasks.filter(t=>t.status==='done').length} completed`)
      : `${allTasks.length} total · ${allTasks.filter(t=>t.status==='done').length} completed`;

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Tasks</h1>
          <p id="tasks-subtitle">${subtitle}</p>
        </div>
        <div class="page-header-actions">
          <div style="display:flex;gap:4px">
            <button id="tasks-view-board-btn" class="btn btn-ghost btn-sm ${this._view==='kanban'?'active':''}" onclick="TasksScreen.handleViewChange('kanban')" style="${this._view==='kanban'?'background:var(--color-surface-subtle)':''}">Board</button>
            <button id="tasks-view-list-btn" class="btn btn-ghost btn-sm ${this._view==='list'?'active':''}" onclick="TasksScreen.handleViewChange('list')" style="${this._view==='list'?'background:var(--color-surface-subtle)':''}">List</button>
          </div>
          <button id="tasks-create-btn" class="btn btn-primary" onclick="TasksScreen.openCreateModal()">${Icons.plus} Create Task</button>
        </div>
      </div>

      <!-- Restored Clean Filter Bar -->
      <div class="filter-bar" id="tasks-filter-bar">
        <div class="search-input-wrap">
          <span class="search-icon">${Icons.search}</span>
          <input type="text" id="task-search-input" class="form-input search-input" placeholder="Search tasks..." value="${this._filter.search}" oninput="TasksScreen.handleSearch(this.value)">
          <button type="button" id="task-search-clear" class="search-clear-btn ${this._filter.search ? '' : 'hidden'}" onclick="TasksScreen.clearSearch()" title="Clear search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        
        <select class="form-select" id="task-filter-project" style="width:160px" onchange="TasksScreen.handleFilterChange('project', this.value)">
          <option value="">All Projects</option>
          ${projects.map(p => `<option value="${p.id}" ${this._filter.project===p.id?'selected':''}>${p.name}</option>`).join('')}
        </select>
        
        <select class="form-select" id="task-filter-priority" style="width:120px" onchange="TasksScreen.handleFilterChange('priority', this.value)">
          <option value="">All Priority</option>
          <option value="high" ${this._filter.priority==='high'?'selected':''}>High</option>
          <option value="medium" ${this._filter.priority==='medium'?'selected':''}>Medium</option>
          <option value="low" ${this._filter.priority==='low'?'selected':''}>Low</option>
        </select>
        
        <select class="form-select" id="task-filter-status" style="width:130px" onchange="TasksScreen.handleFilterChange('status', this.value)">
          <option value="">All Status</option>
          <option value="todo" ${this._filter.status==='todo'?'selected':''}>To Do</option>
          <option value="in-progress" ${this._filter.status==='in-progress'?'selected':''}>In Progress</option>
          <option value="review" ${this._filter.status==='review'?'selected':''}>Review</option>
          <option value="done" ${this._filter.status==='done'?'selected':''}>Done</option>
        </select>
        
        ${isAdmin ? `
        <select class="form-select" id="task-filter-assignee" style="width:140px" onchange="TasksScreen.handleFilterChange('assignee', this.value)">
          <option value="">All Assignees</option>
          ${assignees.map(m => `<option value="${m.id}" ${this._filter.assignee===m.id?'selected':''}>${m.name}</option>`).join('')}
        </select>` : ''}
      </div>

      <div id="tasks-container" class="tasks-list">
        ${this._renderContent(tasks)}
      </div>`;
  },

  handleSearch(val) {
    this._filter.search = val;
    const clearBtn = document.getElementById('task-search-clear');
    if (clearBtn) {
      if (val) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }
    this.updateTasksContainer();
  },

  clearSearch() {
    this._filter.search = '';
    const input = document.getElementById('task-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    const clearBtn = document.getElementById('task-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.updateTasksContainer();
  },

  handleFilterChange(key, val) {
    this._filter[key] = val;
    this.updateTasksContainer();
  },

  handleViewChange(view) {
    this._view = view;
    const boardBtn = document.getElementById('tasks-view-board-btn');
    const listBtn = document.getElementById('tasks-view-list-btn');
    if (boardBtn && listBtn) {
      boardBtn.style.background = view === 'kanban' ? 'var(--color-surface-subtle)' : '';
      listBtn.style.background = view === 'list' ? 'var(--color-surface-subtle)' : '';
      if (view === 'kanban') {
        boardBtn.classList.add('active');
        listBtn.classList.remove('active');
      } else {
        listBtn.classList.add('active');
        boardBtn.classList.remove('active');
      }
    }
    this.updateTasksContainer();
  },

  updateTasksContainer() {
    const tasks = this._getFilteredTasks();
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isStandardUser = !isAdmin;
    const allTasks = isAdmin ? Store.getTasks().filter(t => !t.isPersonal) : Store.getTasks();

    const subtitleEl = document.getElementById('tasks-subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = isStandardUser
        ? (this._filter.project
            ? `${tasks.filter(t=>!t.isPersonal).length} project tasks · ${tasks.filter(t=>t.status==='done').length} completed`
            : `${tasks.length} tasks (${tasks.filter(t=>!t.isPersonal).length} assigned, ${tasks.filter(t=>t.isPersonal).length} personal) · ${tasks.filter(t=>t.status==='done').length} completed`)
        : `${allTasks.length} total · ${allTasks.filter(t=>t.status==='done').length} completed`;
    }

    const container = document.getElementById('tasks-container') || document.querySelector('.tasks-list');
    if (container) {
      container.innerHTML = this._renderContent(tasks);
    } else {
      this.refresh();
      return;
    }
  },

  _renderContent(tasks) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';

    if (tasks.length === 0) {
      if (this._filter.search) {
        return `
          <div class="empty-state">
            <div class="empty-state-icon">${Icons.search}</div>
            <h3>No matching results found for "${this._filter.search}"</h3>
            <p>Try searching for a different task title, description, project, or assignee name.</p>
            <button class="btn btn-secondary btn-sm" onclick="TasksScreen.clearSearch()">Clear Search</button>
          </div>
        `;
      }
      return `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons.checkSquare}</div>
          <h3>No tasks found</h3>
          <p>${this._filter.project || this._filter.priority || this._filter.status || this._filter.assignee ? 'Try adjusting your filters.' : 'Create your first task to get started.'}</p>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
            <button class="btn btn-primary" onclick="TasksScreen.openCreateModal()">${Icons.plus} Create Project Task</button>
            ${!isAdmin ? `<button class="btn btn-secondary" onclick="TasksScreen.openAddPersonalTaskModal('todo')">${Icons.plus} Add Personal Task</button>` : ''}
          </div>
        </div>
      `;
    }
    return this._view === 'kanban' ? this._renderKanban(tasks) : this._renderList(tasks);
  },

  // ─── Bifurcated Kanban Column Rendering (Assigned to Me, Shared Work, Personal Tasks in To Do) ───
  _renderKanban(tasks) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const columns = [
      { status: 'todo', label: isAdmin ? 'Project Tasks' : 'To Do', color: 'var(--color-text-disabled)' },
      { status: 'in-progress', label: 'In Progress', color: 'var(--color-primary)' },
      { status: 'review', label: 'Review', color: 'var(--color-ai)' },
      { status: 'done', label: 'Done', color: 'var(--color-success-500)' }
    ];

    // All personal tasks are localized and anchored inside "To Do" (Standard User Only)
    const personalTasks = isAdmin ? [] : tasks.filter(t => t.isPersonal);

    return `
      <div class="kanban">
        ${columns.map(col => {
          // Official project tasks for this specific column
          const projectTasks = tasks.filter(t => !t.isPersonal && t.status === col.status);

          // 1. Admin Role: Direct Board View across ALL columns ("Project Tasks", "In Progress", "Review", "Done")
          // Completely REMOVES "PERSONAL TASKS", "+ Add Personal Task", "ASSIGNED TO ME", and "PROJECT TASKS / SHARED WORK" sub-headers
          // Renders all project tasks directly under main status headers in a single vertical list without inner sub-sections or divider lines
          if (isAdmin) {
            return `
              <div class="kanban-column" data-status="${col.status}">
                
                <!-- Main Column Status Header -->
                <div class="kanban-column-top-header" style="margin-bottom:8px;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="width:10px;height:10px;border-radius:50%;background:${col.color};display:inline-block;"></span>
                    <span class="kanban-column-title" style="font-size:14px;font-weight:700;">${col.label}</span>
                  </div>
                  <span class="kanban-column-count">${projectTasks.length}</span>
                </div>

                <!-- Direct Full-Height Cards Container for Unified Project Monitoring -->
                <div class="kanban-cards kanban-full-cards" data-status="${col.status}">
                  ${projectTasks.length === 0 ? `
                    <div class="kanban-subcolumn-empty" style="margin-top:4px;">No ${col.status === 'todo' ? 'project tasks' : 'tasks in ' + col.label.toLowerCase()}</div>
                  ` : projectTasks.sort((a,b)=>(a.order||0)-(b.order||0)).map(t => this._renderKanbanCard(t)).join('')}
                </div>

              </div>
            `;
          }

          // 2. Standard User Role: "To Do" Column with bifurcated sub-sections
          if (col.status === 'todo') {
            // Multi-assignee collaborative tasks go to Shared Work, solo tasks go to Assigned to Me
            const assignedTasks = projectTasks.filter(t => {
              if (!this._isUserTask(t, currentUser)) return false;
              const ids = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
              return ids.length <= 1; // Solo-assigned tasks go to "Assigned to Me"
            });
            const sharedTasks = projectTasks.filter(t => {
              if (!this._isUserTask(t, currentUser)) return false;
              const ids = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
              return ids.length > 1; // Multi-assignee collaborative tasks
            });
            const colTotalCount = projectTasks.length + personalTasks.length;

            return `
              <div class="kanban-bifurcated-column">
                
                <!-- Main Column Status Header -->
                <div class="kanban-column-top-header">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="width:10px;height:10px;border-radius:50%;background:${col.color};display:inline-block;"></span>
                    <span class="kanban-column-title" style="font-size:14px;font-weight:700;">${col.label}</span>
                  </div>
                  <span class="kanban-column-count">${colTotalCount}</span>
                </div>

                <!-- TOP SUB-SECTION: Assigned to Me -->
                <div class="kanban-subcolumn-section">
                  <div class="kanban-subcolumn-header">
                    <span class="kanban-subcolumn-title">
                      <svg style="width:12px;height:12px;color:var(--color-primary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      ASSIGNED TO ME
                    </span>
                    <span class="kanban-subcolumn-badge">${assignedTasks.length}</span>
                  </div>
                  
                  <div class="kanban-subcolumn-cards" data-status="todo" data-section="assigned"
                    ondragover="TasksScreen.onDragOver(event)" ondrop="TasksScreen.onDrop(event,'todo')" ondragleave="TasksScreen.onDragLeave(event)">
                    ${assignedTasks.length === 0 ? `
                      <div class="kanban-subcolumn-empty">No assigned tasks</div>
                    ` : assignedTasks.sort((a,b)=>(a.order||0)-(b.order||0)).map(t => this._renderKanbanCard(t)).join('')}
                  </div>
                </div>

                <!-- MIDDLE SUB-SECTION: Project Tasks / Shared Work -->
                <div class="kanban-subcolumn-section" style="border-top:1px solid var(--color-border);padding-top:10px;">
                  <div class="kanban-subcolumn-header">
                    <span class="kanban-subcolumn-title" style="color:var(--color-text-secondary);">
                      <svg style="width:12px;height:12px;color:var(--color-text-secondary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      PROJECT TASKS / SHARED WORK
                    </span>
                    <span class="kanban-subcolumn-badge">${sharedTasks.length}</span>
                  </div>
                  
                  <div class="kanban-subcolumn-cards" data-status="todo" data-section="shared"
                    ondragover="TasksScreen.onDragOver(event)" ondrop="TasksScreen.onDrop(event,'todo')" ondragleave="TasksScreen.onDragLeave(event)">
                    ${sharedTasks.length === 0 ? `
                      <div class="kanban-subcolumn-empty">No shared project tasks</div>
                    ` : sharedTasks.sort((a,b)=>(a.order||0)-(b.order||0)).map(t => this._renderKanbanCard(t)).join('')}
                  </div>
                </div>

                <!-- BOTTOM SUB-SECTION: Personal Tasks (Strictly for Standard User Role) -->
                <div class="kanban-subcolumn-section" style="border-top:1px dashed var(--color-border);padding-top:10px;">
                  <div class="kanban-subcolumn-header">
                    <span class="kanban-subcolumn-title" style="color:#7E22CE;">
                      <svg style="width:12px;height:12px;color:#8B2CF5;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      PERSONAL TASKS
                    </span>
                    <button type="button" class="btn btn-ghost btn-xs add-personal-btn" onclick="TasksScreen.promptAddPersonalTask()" title="Add personal task" style="color:var(--color-primary);font-weight:600;padding:1px 6px;height:22px;border:1px solid var(--color-border);background:var(--color-surface);border-radius:4px;">
                      ${Icons.plus} Add
                    </button>
                  </div>

                  <div class="kanban-subcolumn-cards personal-subcolumn-cards" data-status="todo" data-section="personal">
                    ${personalTasks.length === 0 ? `
                      <div class="kanban-subcolumn-empty" style="cursor:pointer;" onclick="TasksScreen.promptAddPersonalTask()">
                        + Add Personal Task
                      </div>
                    ` : personalTasks.sort((a,b)=>(a.order||0)-(b.order||0)).map(t => this._renderPersonalTaskCard(t)).join('')}
                  </div>
                </div>

              </div>
            `;
          }

          // 3. Standard User Role: "In Progress", "Review", "Done" Columns: Clean Single Layout
          return `
            <div class="kanban-column" data-status="${col.status}">
              
              <!-- Main Column Status Header -->
              <div class="kanban-column-top-header" style="margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="width:10px;height:10px;border-radius:50%;background:${col.color};display:inline-block;"></span>
                  <span class="kanban-column-title" style="font-size:14px;font-weight:700;">${col.label}</span>
                </div>
                <span class="kanban-column-count">${projectTasks.length}</span>
              </div>

              <!-- Direct Full-Height Cards Container for Project Tasks -->
              <div class="kanban-cards kanban-full-cards" data-status="${col.status}"
                ondragover="TasksScreen.onDragOver(event)" ondrop="TasksScreen.onDrop(event,'${col.status}')" ondragleave="TasksScreen.onDragLeave(event)">
                ${projectTasks.length === 0 ? `
                  <div class="kanban-subcolumn-empty" style="margin-top:4px;">No tasks in ${col.label.toLowerCase()}</div>
                ` : projectTasks.sort((a,b)=>(a.order||0)-(b.order||0)).map(t => this._renderKanbanCard(t)).join('')}
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // ─── Project Task Kanban Card (with Overlapping Avatar Stack [PB][MJ][HS]) ───
  _renderKanbanCard(t) {
    const proj = Store.getProject(t.projectId);
    const isOverdue = Utils.isOverdue(t.dueDate) && t.status !== 'done';
    const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
    const totalSt = subtasks.length;
    const completedSt = subtasks.filter(s => s.completed).length;
    const allCompleted = totalSt > 0 && completedSt === totalSt;

    const assigneeIds = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0
      ? t.assigneeIds
      : (t.assigneeId ? [t.assigneeId] : []);
    const members = assigneeIds.map(id => Store.getMember(id)).filter(Boolean);

    let assigneeMarkup = '';
    if (members.length === 0) {
      assigneeMarkup = `<span style="font-size:11px;color:var(--color-text-disabled);">Unassigned</span>`;
    } else if (members.length === 1) {
      const m = members[0];
      const initials = m.initials || m.name.split(' ').map(w=>w[0]).join('').slice(0,2);
      const memberColor = m.color || '#2563EB';
      assigneeMarkup = `
        <div class="avatar avatar-badge" style="background:${memberColor};width:24px;height:24px;font-size:10px;font-weight:700;color:#FFFFFF;border:1.5px solid #FFFFFF;box-shadow:0 1px 2px rgba(0,0,0,0.1);display:inline-flex;align-items:center;justify-content:center;border-radius:50%;" title="Assigned to ${m.name}">
          ${initials}
        </div>
        <span style="font-size:12px;font-weight:600;color:var(--color-text-primary);">${m.name.split(' ')[0]}</span>
      `;
    } else {
      // Overlapping Avatar Stack [PB][MJ][HS] for multi-assignee tasks
      assigneeMarkup = `
        <div class="avatar-stack" title="Assigned to: ${members.map(m=>m.name).join(', ')}">
          ${members.map((mem, idx) => {
            const initials = mem.initials || mem.name.split(' ').map(w=>w[0]).join('').slice(0,2);
            const color = mem.color || '#2563EB';
            return `
              <div class="avatar avatar-stack-item" style="background:${color};width:24px;height:24px;font-size:9.5px;font-weight:700;color:#FFFFFF;border:2px solid var(--color-surface, #FFFFFF);box-shadow:0 1px 2px rgba(0,0,0,0.12);display:inline-flex;align-items:center;justify-content:center;border-radius:50%;margin-left:${idx === 0 ? '0' : '-8px'};position:relative;z-index:${idx + 1};" title="${mem.name}">
                ${initials}
              </div>
            `;
          }).join('')}
          <span style="font-size:11.5px;font-weight:600;color:var(--color-text-primary);margin-left:6px;">
            ${members.map(m=>m.name.split(' ')[0]).join('+')}
          </span>
        </div>
      `;
    }

    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isAssigned = this._isUserTask(t, currentUser);
    const canMoveTask = !isAdmin && isAssigned;

    return `
      <div class="kanban-card ${!canMoveTask ? 'observer-card' : ''}" draggable="${canMoveTask ? 'true' : 'false'}" data-task-id="${t.id}"
        ondragstart="TasksScreen.onDragStart(event,'${t.id}')" ondragend="TasksScreen.onDragEnd(event)"
        onclick="TasksScreen.openDetailModal('${t.id}')">
        
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span class="badge badge-${t.priority}" style="font-size:10px;padding:1px 6px">${Utils.humanize(t.priority)}</span>
          ${proj ? `<span style="font-size:11px;font-weight:500;color:var(--color-primary);">${Utils.truncate(proj.name, 18)}</span>` : ''}
        </div>

        <div class="kanban-card-title">${Utils.escapeHtml(t.title)}</div>

        <div class="kanban-card-meta" style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;">
          
          <!-- Assignee Avatar Stack / Single Avatar Badge -->
          <div class="kanban-card-assignee" style="display:flex;align-items:center;gap:6px;">
            ${assigneeMarkup}
          </div>

          <!-- Subtasks Badge & Due Date -->
          <div style="display:flex;align-items:center;gap:6px;">
            ${totalSt > 0 ? `
              <div class="kanban-card-subtask-badge" title="${completedSt} of ${totalSt} subtasks completed" style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;background:${allCompleted ? 'var(--color-success-50, #f0fdf4)' : 'var(--color-surface-subtle, #f1f5f9)'};border:1px solid ${allCompleted ? 'var(--color-success-200, #bbf7d0)' : 'var(--color-border)'};color:${allCompleted ? 'var(--color-success-600, #16a34a)' : 'var(--color-text-muted)'};line-height:1;">
                <span style="font-size:11px;display:inline-block;">☑</span>
                <span>${completedSt}/${totalSt}</span>
              </div>
            ` : ''}
            ${t.dueDate ? `<div class="kanban-card-due ${isOverdue?'overdue':''}">${Icons.clock} ${Utils.formatDate(t.dueDate)}</div>` : ''}
          </div>

        </div>

        ${(isAdmin && t.status === 'review' && !t.isPersonal) ? `
          <div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--color-border-subtle);width:100%;">
            <button type="button" class="btn btn-xs" onclick="event.stopPropagation();TasksScreen.openReviewModal('${t.id}')" style="width:100%;background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200);font-weight:600;font-size:11px;padding:5px 8px;border-radius:6px;display:flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
              <span>Review Changes</span>
            </button>
          </div>
        ` : ''}
        ${(t.reviewNotes && t.status === 'in-progress') ? `
          <div style="margin-top:6px;width:100%;">
            <span style="background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200);padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;display:inline-flex;align-items:center;gap:4px;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
              Changes Requested
            </span>
          </div>
        ` : ''}
      </div>
    `;
  },

  // ─── Personal Task Kanban Card (Anchored inside To Do with Checkbox) ───
  _renderPersonalTaskCard(t) {
    const isDone = Boolean(t.completed || t.status === 'done');
    const isOverdue = Utils.isOverdue(t.dueDate) && !isDone;
    const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
    const totalSt = subtasks.length;
    const completedSt = subtasks.filter(s => s.completed).length;
    const allCompleted = totalSt > 0 && completedSt === totalSt;

    return `
      <div class="kanban-card personal-task-card ${isDone ? 'is-completed' : ''}" data-task-id="${t.id}"
        onclick="TasksScreen.openDetailModal('${t.id}')">
        
        <!-- Main Row: Checkbox + Title on the left, Priority badge + Delete icon on the right -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
          <div style="display:flex;align-items:flex-start;gap:8px;flex:1;min-width:0;">
            <button type="button" class="personal-task-checkbox ${isDone ? 'checked' : ''}" 
              onclick="event.stopPropagation();TasksScreen.togglePersonalTaskComplete(event, '${t.id}')"
              title="${isDone ? 'Mark as incomplete' : 'Mark as complete'}"
              style="width:18px;height:18px;min-width:18px;min-height:18px;border-radius:4px;border:1.5px solid ${isDone ? '#2563EB' : 'var(--color-border)'};background:${isDone ? '#2563EB' : '#FFFFFF'};display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0;margin-top:2px;transition:all 0.15s ease;flex-shrink:0;">
              ${isDone ? `<svg style="width:12px;height:12px;color:#FFFFFF;stroke-width:3;" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
            </button>
            <div class="kanban-card-title personal-task-title ${isDone ? 'is-completed' : ''}" style="font-weight:600;font-size:13px;line-height:1.35;flex:1;margin-bottom:0;word-break:break-word;${isDone ? 'text-decoration:line-through;opacity:0.65;color:var(--color-text-muted);' : 'color:var(--color-text-primary);'}">
              ${Utils.escapeHtml(t.title)}
            </div>
          </div>
          
          <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;margin-top:1px;">
            <span class="badge badge-${t.priority || 'medium'}" style="font-size:10px;padding:1px 6px">${Utils.humanize(t.priority || 'medium')}</span>
            <button type="button" onclick="event.stopPropagation();TasksScreen.deletePersonalTask('${t.id}')" title="Delete personal task" style="background:none;border:none;cursor:pointer;color:var(--color-text-muted);padding:0 2px;display:flex;align-items:center;">
              <svg style="width:13px;height:13px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <!-- Meta Row: Self-managed + Due Date at the bottom -->
        <div class="kanban-card-meta" style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;${isDone ? 'opacity:0.65;' : ''}">
          <div style="font-size:11px;color:${isDone ? 'var(--color-text-muted)' : '#7E22CE'};font-weight:600;display:flex;align-items:center;gap:4px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${isDone ? 'var(--color-text-disabled)' : '#8B2CF5'};display:inline-block;"></span>
            ${isDone ? 'Completed' : 'Self-managed'}
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            ${totalSt > 0 ? `
              <div class="kanban-card-subtask-badge" title="${completedSt} of ${totalSt} subtasks completed" style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;background:${allCompleted ? 'var(--color-success-50, #f0fdf4)' : 'var(--color-surface-subtle, #f1f5f9)'};border:1px solid ${allCompleted ? 'var(--color-success-200, #bbf7d0)' : 'var(--color-border)'};color:${allCompleted ? 'var(--color-success-600, #16a34a)' : 'var(--color-text-muted)'};line-height:1;">
                <span style="font-size:11px;display:inline-block;">☑</span>
                <span>${completedSt}/${totalSt}</span>
              </div>
            ` : ''}
            ${t.dueDate ? `<div class="kanban-card-due ${isOverdue?'overdue':''}">${Icons.clock} ${Utils.formatDate(t.dueDate)}</div>` : ''}
          </div>
        </div>

      </div>
    `;
  },

  // ─── List View Rendering ───
  _renderList(tasks) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isStandardUser = !isAdmin;

    return `
      <div class="section-card">
        <div class="section-card-body no-pad">
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th style="width:36px"></th>
                  <th>Task</th>
                  <th>Scope</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Subtasks</th>
                  <th>Due</th>
                  <th style="width:40px"></th>
                </tr>
              </thead>
              <tbody>
                ${[...tasks].sort((a,b)=>(a.order||0)-(b.order||0)).map(t => {
                  const assigneeIds = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
                  const members = assigneeIds.map(id => Store.getMember(id)).filter(Boolean);
                  const m = members[0];
                  const proj = Store.getProject(t.projectId);
                  const isDone = Boolean(t.completed || t.status === 'done');
                  const isOverdue = Utils.isOverdue(t.dueDate) && !isDone;
                  const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
                  const totalSt = subtasks.length;
                  const completedSt = subtasks.filter(s => s.completed).length;
                  const allCompleted = totalSt > 0 && completedSt === totalSt;

                  return `
                    <tr class="${t.isPersonal && isDone ? 'task-row-completed' : ''}">
                      <td>
                        ${t.isPersonal ? `
                          <button type="button" class="personal-task-checkbox ${isDone ? 'checked' : ''}" 
                            onclick="event.stopPropagation();TasksScreen.togglePersonalTaskComplete(event, '${t.id}')"
                            title="${isDone ? 'Mark as incomplete' : 'Mark as complete'}"
                            style="width:16px;height:16px;min-width:16px;min-height:16px;border-radius:4px;border:1.5px solid ${isDone ? '#2563EB' : 'var(--color-border)'};background:${isDone ? '#2563EB' : '#FFFFFF'};display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:all 0.15s ease;">
                            ${isDone ? `<svg style="width:10px;height:10px;color:#FFFFFF;stroke-width:3;" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
                          </button>
                        ` : `
                          <span class="priority-dot priority-${t.priority}"></span>
                        `}
                      </td>
                      <td>
                        <div style="display:flex;align-items:center;gap:6px;">
                          <span class="task-title" onclick="TasksScreen.openDetailModal('${t.id}')" style="${t.isPersonal && isDone ? 'text-decoration:line-through;opacity:0.65;color:var(--color-text-muted);' : ''}">${Utils.escapeHtml(t.title)}</span>
                        </div>
                      </td>
                      <td>
                        ${t.isPersonal ? `
                          <span class="personal-task-tag">Personal</span>
                        ` : `
                          <span style="font-size:12px;color:var(--color-text-muted);">${proj ? proj.name : '—'}</span>
                        `}
                      </td>
                      <td>
                        ${t.isPersonal ? `
                          <span style="font-size:12px;color:#7E22CE;font-weight:600;">You (Personal)</span>
                        ` : (members.length > 1 ? `
                          <div style="display:flex;align-items:center;gap:6px;">
                            <div class="avatar-stack">
                              ${members.map((mem, idx) => {
                                const initials = mem.initials || mem.name.split(' ').map(w=>w[0]).join('').slice(0,2);
                                return `<div class="avatar avatar-stack-item" style="background:${mem.color};width:24px;height:24px;font-size:9.5px;font-weight:700;color:#FFFFFF;border:2px solid var(--color-surface,#FFF);display:inline-flex;align-items:center;justify-content:center;border-radius:50%;margin-left:${idx===0?'0':'-8px'};position:relative;z-index:${idx+1};" title="${mem.name}">${initials}</div>`;
                              }).join('')}
                            </div>
                            <span style="font-size:12px;font-weight:500;">${members.map(mem=>mem.name.split(' ')[0]).join('+')}</span>
                          </div>
                        ` : (members.length === 1 ? `
                          <div style="display:flex;align-items:center;gap:6px;">
                            <div class="avatar avatar-sm" style="background:${m.color}">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                            <span style="font-size:12px;font-weight:500;">${m.name}</span>
                          </div>
                        ` : '<span style="color:var(--color-text-disabled);font-size:12px">—</span>'))}
                      </td>
                      <td><span class="badge badge-${t.priority}">${Utils.humanize(t.priority)}</span></td>
                      <td>
                        ${isAdmin && !t.isPersonal ? `
                          <div style="display:flex;align-items:center;gap:6px;">
                            <span class="badge" style="font-size:11px;padding:3px 8px;background:var(--color-surface-subtle);color:var(--color-text-primary);border:1px solid var(--color-border);">${Utils.humanize(t.status)}</span>
                            ${t.status === 'review' ? `
                              <button type="button" class="btn btn-xs" onclick="TasksScreen.openReviewModal('${t.id}')" style="background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200);padding:2px 8px;font-size:10.5px;font-weight:600;border-radius:4px;cursor:pointer;">Review Changes</button>
                            ` : ''}
                          </div>
                        ` : (t.isPersonal ? `
                          <select class="form-select" style="height:28px;font-size:11px;padding:0 24px 0 8px;width:auto;min-width:100px" onchange="TasksScreen.updateStatus('${t.id}',this.value)">
                            <option value="todo" ${!isDone ? 'selected' : ''}>To Do</option>
                            <option value="done" ${isDone ? 'selected' : ''}>Done</option>
                          </select>
                        ` : (this._isUserTask(t, currentUser) ? `
                          <select class="form-select" style="height:28px;font-size:11px;padding:0 24px 0 8px;width:auto;min-width:100px" onchange="TasksScreen.updateStatus('${t.id}',this.value)">
                            ${['todo','in-progress','review','done'].map(s => `<option value="${s}" ${(isDone && s==='done') || t.status===s ? 'selected' : ''}>${Utils.humanize(s)}</option>`).join('')}
                          </select>
                        ` : `
                          <span class="badge" style="font-size:11px;padding:3px 8px;background:var(--color-surface-subtle);color:var(--color-text-primary);border:1px solid var(--color-border);">${Utils.humanize(t.status)}</span>
                        `))}
                      </td>
                      <td>
                        ${totalSt > 0 ? `
                          <span class="badge" style="font-size:11px;font-weight:600;padding:2px 6px;background:${allCompleted ? 'var(--color-success-50, #f0fdf4)' : 'var(--color-surface-subtle, #f1f5f9)'};border:1px solid ${allCompleted ? 'var(--color-success-200, #bbf7d0)' : 'var(--color-border)'};color:${allCompleted ? 'var(--color-success-600, #16a34a)' : 'var(--color-text-muted)'};">
                            ☑ ${completedSt}/${totalSt}
                          </span>
                        ` : '<span style="color:var(--color-text-disabled);font-size:12px">—</span>'}
                      </td>
                      <td style="font-size:12px;color:${isOverdue?'var(--color-error-500)':'var(--color-text-muted)'}">${t.dueDate ? Utils.formatDate(t.dueDate) : '—'}</td>
                      <td>
                        <button class="btn btn-ghost btn-sm btn-icon" onclick="TasksScreen.openDetailModal('${t.id}')">${Icons.edit}</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // Drag & Drop (Only for assigned team members on project tasks)
  onDragStart(e, taskId) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const task = Store.getTask(taskId);
    if (!task) return false;
    if (task.isPersonal) {
      e.preventDefault();
      return false;
    }
    if (currentUser && currentUser.role === 'Admin') {
      e.preventDefault();
      if (typeof Toast !== 'undefined') Toast.show('Admins monitor task progress in observer mode. Status updates are performed by assigned team members.', 'info');
      return false;
    }
    if (!this._isUserTask(task, currentUser)) {
      e.preventDefault();
      if (typeof Toast !== 'undefined') Toast.show('Only the assigned team member can move this task.', 'warning');
      return false;
    }
    this._dragTask = taskId;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  },
  onDragEnd(e) { e.target.classList.remove('dragging'); this._dragTask = null; },
  onDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); },
  onDragLeave(e) { e.currentTarget.classList.remove('drag-over'); },
  onDrop(e, status) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    if (currentUser && currentUser.role === 'Admin') {
      this._dragTask = null;
      return;
    }
    if (this._dragTask) {
      const task = Store.getTask(this._dragTask);
      if (!task || task.isPersonal) {
        this._dragTask = null;
        return;
      }
      if (!this._isUserTask(task, currentUser)) {
        if (typeof Toast !== 'undefined') Toast.show('Only the assigned team member can move this task.', 'warning');
        this._dragTask = null;
        return;
      }
      this.updateStatus(this._dragTask, status);
      this._dragTask = null;
    }
  },

  updateStatus(taskId, status) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const task = Store.getTask(taskId);
    if (!task) return;

    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isAssigned = this._isUserTask(task, currentUser);

    // Only assigned team member can update execution status (Admins review via review flow)
    if (!isAdmin && !isAssigned) {
      if (typeof Toast !== 'undefined') Toast.show('Only the assigned team member can move this task.', 'warning');
      return;
    }
    if (isAdmin && !isAssigned && status !== 'in-progress' && status !== 'done') {
      if (typeof Toast !== 'undefined') Toast.show('Admins monitor task progress in observer mode. Status updates are performed by assigned team members.', 'info');
      return;
    }

    const prevStatus = task ? task.status : '';
    const completed = status === 'done';
    Store.updateTask(taskId, { status, completed });
    Toast.show(`Task moved to ${Utils.humanize(status)}`);

    // When assignee brings task to review phase, notify admin
    if (status === 'review' && prevStatus !== 'review') {
      const devName = currentUser ? currentUser.name : 'Assigned team member';
      Store.addNotification({
        type: 'task',
        text: `📋 Task "<strong>${task ? task.title : 'Task'}</strong>" submitted for review by ${devName}. Ready for admin review.`,
        taskId: taskId,
        projectId: task ? task.projectId : '',
        read: false
      });
    }

    this.updateTasksContainer();
  },

  togglePersonalTaskComplete(event, taskId) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const t = Store.getTask(taskId);
    if (!t) return;
    const newCompleted = !Boolean(t.completed || t.status === 'done');
    Store.updateTask(taskId, {
      completed: newCompleted,
      status: newCompleted ? 'done' : 'todo'
    });
    Toast.show(newCompleted ? 'Personal task completed' : 'Personal task marked active');
    this.updateTasksContainer();
  },

  openAddPersonalTaskModal(status) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    if (currentUser && currentUser.role === 'Admin') return;
    this.promptAddPersonalTask();
  },

  promptAddPersonalTask() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    if (currentUser && currentUser.role === 'Admin') {
      if (typeof Toast !== 'undefined') Toast.show('Personal tasks are not available for Admins.', 'info');
      return;
    }
    const body = `
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label" style="font-size:12px;font-weight:600;">Personal Task Title *</label>
        <input type="text" class="form-input" id="quick-personal-title-input" placeholder="e.g. Follow up on retro items..." autofocus style="font-size:13px" onkeydown="if(event.key==='Enter'){event.preventDefault();TasksScreen.submitPromptPersonalTask();}">
      </div>
    `;
    const footer = `
      <button class="btn btn-secondary btn-sm" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary btn-sm" onclick="TasksScreen.submitPromptPersonalTask()">Add Task</button>
    `;
    if (typeof Modal !== 'undefined' && Modal.open) {
      Modal.open('Add Personal Task', body, footer, { small: true });
      setTimeout(() => {
        const inp = document.getElementById('quick-personal-title-input');
        if (inp) inp.focus();
      }, 80);
    } else {
      const title = (typeof window !== 'undefined' && window.prompt) ? window.prompt('Enter personal task title:') : null;
      if (title && title.trim()) {
        this._createPersonalTaskDirect(title.trim());
      }
    }
  },

  submitPromptPersonalTask() {
    const input = document.getElementById('quick-personal-title-input');
    const title = input ? input.value.trim() : '';
    if (!title) {
      if (input) input.focus();
      return;
    }
    this._createPersonalTaskDirect(title);
    if (typeof Modal !== 'undefined') Modal.closeAll();
  },

  _createPersonalTaskDirect(title) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const userMemberId = currentUser ? (currentUser.memberId || currentUser.id) : '';
    const userId = currentUser ? currentUser.id : '';
    Store.createTask({
      title,
      description: '',
      status: 'todo',
      completed: false,
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0],
      projectId: '',
      isPersonal: true,
      userId: userId,
      creatorId: userId,
      createdBy: currentUser ? (currentUser.name || '') : '',
      assigneeId: userMemberId,
      subtasks: []
    });
    if (typeof Toast !== 'undefined') Toast.show('Personal task added');
    this.updateTasksContainer();
  },

  focusQuickAddPersonalTask() {
    this.promptAddPersonalTask();
  },

  submitQuickAddPersonalTask() {
    const input = document.getElementById('quick-add-personal-input');
    if (input && input.value.trim()) {
      this._createPersonalTaskDirect(input.value.trim());
      input.value = '';
    } else {
      this.promptAddPersonalTask();
    }
  },

  quickPromptAddPersonalTask() {
    this.promptAddPersonalTask();
  },

  // ─── Assignee Selector Helpers ───
  _getSelectableAssignees(projectId, currentUser) {
    const allAssignees = Store.getAssignees(); // Excludes Admin m1
    if (allAssignees && allAssignees.length > 0) {
      return allAssignees;
    }
    const allMembers = Store.getMembers() || [];
    return allMembers.filter(m => m.id !== 'm1' && m.role !== 'Admin');
  },

  _renderAssigneePills(availableMembers, selectedMemberIds = [], prefix = 'task') {
    if (!availableMembers || availableMembers.length === 0) {
      return `<div style="font-size:12.5px;color:var(--color-text-muted);font-style:italic;padding:6px 0;">No team members available.</div>`;
    }
    return `
      <div class="assignee-pills-wrap" id="${prefix}-assignee-pills" style="display:flex;flex-wrap:wrap;gap:8px;padding-top:4px;">
        ${availableMembers.map(m => {
          const isSelected = selectedMemberIds.includes(m.id) ||
                             selectedMemberIds.includes(String(m.id)) ||
                             (m.memberId && selectedMemberIds.includes(m.memberId)) ||
                             (m.userId && selectedMemberIds.includes(m.userId)) ||
                             (m.id === 'm2' && selectedMemberIds.includes('preet')) ||
                             (m.id === 'm3' && selectedMemberIds.includes('mohit')) ||
                             (m.id === 'm4' && selectedMemberIds.includes('hirvi'));
          const initials = m.initials || m.name.split(' ').map(w=>w[0]).join('').slice(0,2);
          const color = m.color || '#2563EB';
          return `
            <label class="assignee-pill-btn ${isSelected ? 'selected' : ''}" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;border:1.5px solid ${isSelected ? 'var(--color-primary, #2563EB)' : 'var(--color-border)'};background:${isSelected ? 'rgba(37,99,235,0.08)' : 'var(--color-surface)'};cursor:pointer;user-select:none;transition:all 0.15s ease;">
              <input type="checkbox" class="task-assignee-cb" value="${m.id}" ${isSelected ? 'checked' : ''} onchange="TasksScreen.handleAssigneePillToggle(this)" style="position:absolute;opacity:0;pointer-events:none;width:0;height:0;">
              <span class="avatar avatar-xs" style="background:${color};width:20px;height:20px;font-size:9.5px;font-weight:700;color:#FFFFFF;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;pointer-events:none;">${initials}</span>
              <span style="font-size:12.5px;font-weight:${isSelected ? '600' : '500'};color:${isSelected ? 'var(--color-primary, #2563EB)' : 'var(--color-text-primary)'};pointer-events:none;">${m.name}</span>
              <span class="assignee-check-indicator" style="font-size:12px;color:var(--color-primary);font-weight:bold;margin-left:2px;pointer-events:none;display:${isSelected ? 'inline-block' : 'none'};">✓</span>
            </label>
          `;
        }).join('')}
      </div>
    `;
  },

  _renderReadOnlyAssigneePills(selectedMemberIds = []) {
    if (!selectedMemberIds || selectedMemberIds.length === 0) {
      return `<div style="font-size:12.5px;color:var(--color-text-muted);font-style:italic;padding:6px 0;">Unassigned</div>`;
    }
    const members = selectedMemberIds.map(id => Store.getMember(id)).filter(Boolean);
    if (members.length === 0) {
      return `<div style="font-size:12.5px;color:var(--color-text-muted);font-style:italic;padding:6px 0;">Unassigned</div>`;
    }
    return `
      <div class="assignee-pills-wrap" style="display:flex;flex-wrap:wrap;gap:8px;padding-top:4px;">
        ${members.map(m => {
          const initials = m.initials || m.name.split(' ').map(w=>w[0]).join('').slice(0,2);
          const color = m.color || '#2563EB';
          return `
            <div class="assignee-pill-readonly" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;border:1.5px solid var(--color-border);background:var(--color-surface-subtle);cursor:default;" title="${m.name} (${m.role || 'Member'})">
              <span class="avatar avatar-xs" style="background:${color};width:20px;height:20px;font-size:9.5px;font-weight:700;color:#FFFFFF;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">${initials}</span>
              <span style="font-size:12.5px;font-weight:500;color:var(--color-text-primary);">${m.name}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  handleAssigneePillToggle(input) {
    if (!input || typeof input.closest !== 'function') return;
    const label = input.closest('.assignee-pill-btn');
    if (!label) return;

    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = !currentUser || currentUser.role === 'Admin' || (typeof Auth !== 'undefined' && typeof Auth.isAdmin === 'function' && Auth.isAdmin());

    if (!isAdmin) {
      const isPersonalTaskModal = document.getElementById('personal-task-title') !== null;
      if (!isPersonalTaskModal) {
        if (input && typeof input.checked === 'boolean') {
          input.checked = !input.checked;
        }
        if (typeof Toast !== 'undefined') Toast.show('Only Admin can assign or change team members.', 'warning');
        return;
      }
    }

    const isChecked = input.checked;
    if (isChecked) {
      label.classList.add('selected');
      label.style.borderColor = 'var(--color-primary, #2563EB)';
      label.style.background = 'rgba(37,99,235,0.08)';
      const textSpan = label.querySelector('span:nth-of-type(2)');
      if (textSpan) {
        textSpan.style.color = 'var(--color-primary, #2563EB)';
        textSpan.style.fontWeight = '600';
      }
      const checkIndicator = label.querySelector('.assignee-check-indicator');
      if (checkIndicator) checkIndicator.style.display = 'inline-block';
    } else {
      label.classList.remove('selected');
      label.style.borderColor = 'var(--color-border)';
      label.style.background = 'var(--color-surface)';
      const textSpan = label.querySelector('span:nth-of-type(2)');
      if (textSpan) {
        textSpan.style.color = 'var(--color-text-primary)';
        textSpan.style.fontWeight = '500';
      }
      const checkIndicator = label.querySelector('.assignee-check-indicator');
      if (checkIndicator) checkIndicator.style.display = 'none';
    }
    const picker = input.closest('#task-assignee-picker') || input.closest('#detail-assignee-picker');
    const checked = picker
      ? Array.from(picker.querySelectorAll('.task-assignee-cb:checked')).map(cb => cb.value)
      : Array.from(document.querySelectorAll('.task-assignee-cb:checked')).map(cb => cb.value);
    const hiddenInput = document.getElementById(picker && picker.id.includes('detail') ? 'detail-assignee' : 'task-assignee');
    if (hiddenInput) hiddenInput.value = checked[0] || '';
  },

  handleProjectChangeInModal(projectId, prefix = 'task') {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const available = this._getSelectableAssignees(projectId, currentUser);
    const container = document.getElementById(`${prefix}-assignee-picker`);
    if (!container) return;

    // Retain currently checked assignees that are still available
    const currentChecked = Array.from(container.querySelectorAll('.task-assignee-cb:checked')).map(cb => cb.value);
    let selected = currentChecked.filter(id => available.some(m => m.id === id));

    // If none are selected and standard user, pre-select current user if collaborator
    if (selected.length === 0 && currentUser && currentUser.role !== 'Admin') {
      const myId = currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : currentUser.id);
      if (available.some(m => m.id === myId)) {
        selected = [myId];
      }
    }

    container.innerHTML = this._renderAssigneePills(available, selected, prefix);
    const hiddenInput = document.getElementById(`${prefix}-assignee`);
    if (hiddenInput) hiddenInput.value = selected[0] || '';
  },

  refresh() { 
    const content = document.getElementById('page-content');
    if (content && App.currentScreen === 'tasks') {
      content.innerHTML = this.render();
    }
  },

  // ─── Create Official Project Task Modal ───
  openCreateModal(projectId, defaultDueDate) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isStandardUser = !isAdmin;
    const userMemberId = currentUser ? (currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '')) : '';

    const allProjects = Store.getProjects();
    const projects = isStandardUser
      ? allProjects.filter(p =>
          Array.isArray(p.memberIds) && (
            p.memberIds.includes(userMemberId) ||
            p.memberIds.includes(currentUser?.id) ||
            (currentUser?.id === 'preet' && p.memberIds.includes('m2')) ||
            (currentUser?.id === 'mohit' && p.memberIds.includes('m3')) ||
            (currentUser?.id === 'hirvi' && p.memberIds.includes('m4'))
          )
        )
      : allProjects;

    const initialProjectId = projectId || (projects.length === 1 ? projects[0].id : (projects[0]?.id || ''));
    const defaultAssigneeId = userMemberId || currentUser?.id || 'm2';
    const selectableAssignees = this._getSelectableAssignees(initialProjectId, currentUser);
    const initialSelectedAssignees = isStandardUser && selectableAssignees.some(m => m.id === defaultAssigneeId)
      ? [defaultAssigneeId]
      : [];

    this._modalSubtasks = [];

    const body = `
      <div class="form-group" style="margin-bottom:14px">
        <label class="form-label">Task Title *</label>
        <input type="text" class="form-input" id="task-title" placeholder="Enter task title" required>
        <div class="form-error" id="task-title-error" style="color:var(--color-error-500);font-size:12px;margin-top:4px;"></div>
      </div>
      <div class="form-group" style="margin-bottom:14px">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="task-desc" placeholder="Describe the task..." rows="3"></textarea>
      </div>
      <div class="form-row" style="margin-bottom:14px">
        <div class="form-group" style="flex:1;">
          <label class="form-label">Project *</label>
          <select class="form-select" id="task-project" required onchange="TasksScreen.handleProjectChangeInModal(this.value, 'task')">
            <option value="">Select project</option>
            ${projects.map(p => `<option value="${p.id}" ${(initialProjectId===p.id) ? 'selected' : ''}>${p.name}</option>`).join('')}
          </select>
        </div>
      </div>
      ${isAdmin ? `
        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label" style="display:flex;align-items:center;justify-content:space-between;">
            <span>Assignee(s) <span style="font-weight:normal;color:var(--color-text-muted);font-size:12px;">(Select one or multiple team members)</span></span>
          </label>
          <div id="task-assignee-picker">
            ${this._renderAssigneePills(selectableAssignees, initialSelectedAssignees, 'task')}
          </div>
          <input type="hidden" id="task-assignee" value="${initialSelectedAssignees[0] || ''}">
        </div>
      ` : (function() {
        const currentMember = userMemberId ? Store.getMember(userMemberId) : null;
        const currentName = currentMember ? currentMember.name : (currentUser?.name || 'Self');
        const currentInitials = currentMember ? (currentMember.initials || currentMember.name.split(' ').map(w=>w[0]).join('').slice(0,2)) : (currentUser?.name?.slice(0,2) || 'ME');
        const currentColor = currentMember ? (currentMember.color || '#2563EB') : '#2563EB';
        return `
          <div class="form-group" style="margin-bottom:14px">
            <label class="form-label" style="display:flex;align-items:center;justify-content:space-between;">
              <span>Assignee</span>
              <span style="font-weight:normal;color:var(--color-text-muted);font-size:11px;">(Only Admin can assign or change team members)</span>
            </label>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 12px;background:var(--color-surface-subtle);border:1px solid var(--color-border);border-radius:var(--radius-md);max-width:max-content;">
              <div class="avatar avatar-xs" style="background:${currentColor};width:22px;height:22px;font-size:9.5px;font-weight:700;color:#fff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">${currentInitials}</div>
              <span style="font-size:13px;font-weight:600;color:var(--color-text-primary);">${currentName}</span>
              <span style="font-size:10.5px;background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200);padding:1px 6px;border-radius:var(--radius-pill);font-weight:600;">Self</span>
            </div>
            <input type="hidden" id="task-assignee" value="${userMemberId || currentUser?.id}">
            <input type="checkbox" class="task-assignee-cb" value="${userMemberId || currentUser?.id}" checked style="display:none;">
          </div>
        `;
      })()}
      <div class="form-row" style="margin-bottom:14px">
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-select" id="task-priority">
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="task-status">
            <option value="todo" selected>To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label">Due Date</label>
        <input type="date" class="form-input" id="task-due" value="${defaultDueDate || ''}">
      </div>

      <!-- Initial Subtasks Checklist Section -->
      <div class="form-group" style="border-top:1px solid var(--color-border);padding-top:14px;margin-bottom:6px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div class="subtasks-header-wrap" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span class="subtasks-header-icon" style="display: inline-flex; align-items: center; justify-content: center; width: 18px !important; height: 18px !important; min-width: 18px !important; min-height: 18px !important; color: #2563EB; flex-shrink: 0;">
              ${Icons.checkSquare.replace('<svg ', '<svg style="width: 18px !important; height: 18px !important; min-width: 18px !important; min-height: 18px !important; color: #2563EB; flex-shrink: 0;" ')}
            </span>
            <span class="subtasks-header-title" style="font-size: 14px; font-weight: 600; color: #0F172A; line-height: 1;">Initial Subtasks</span>
          </div>
          <span id="create-modal-subtasks-count" style="font-size:11px;color:var(--color-text-muted);font-weight:600;">0 items</span>
        </div>
        <div id="create-modal-subtasks-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;">
          <div style="font-size:12.5px;color:var(--color-text-muted);font-style:italic;padding:4px 0;" id="create-modal-subtasks-empty">No subtasks added yet. Type below to add checklist items.</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="text" class="form-input" id="create-modal-new-subtask" placeholder="Add subtask item (e.g. Wireframe approval)..." style="font-size:13px;height:34px;flex:1;" onkeydown="if(event.key==='Enter'){event.preventDefault();TasksScreen.addModalSubtask();}">
          <button type="button" class="btn btn-secondary btn-sm" onclick="TasksScreen.addModalSubtask()" style="white-space:nowrap;height:34px;">
            ${Icons.plus} Add Item
          </button>
        </div>
      </div>`;

    const footer = `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" id="modal-submit-task-btn" onclick="TasksScreen.saveTask()">Create Task</button>`;
    
    Modal.open('Create New Task', body, footer, { large: true });
  },

  // ─── Create Personal Task Modal ───
  openAddPersonalTaskModal(defaultStatus = 'todo') {
    this._modalSubtasks = [];

    const body = `
      <div class="form-group" style="margin-bottom:14px">
        <label class="form-label">Personal Task Title *</label>
        <input type="text" class="form-input" id="personal-task-title" placeholder="e.g. Prep sprint retrospective notes..." required>
        <div class="form-error" id="personal-task-title-error" style="color:var(--color-error-500);font-size:12px;margin-top:4px;"></div>
      </div>
      <div class="form-group" style="margin-bottom:14px">
        <label class="form-label">Notes / Description</label>
        <textarea class="form-textarea" id="personal-task-desc" placeholder="Personal notes, reminders, or scratchpad..." rows="3"></textarea>
      </div>
      <div class="form-row" style="margin-bottom:14px">
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="personal-task-status">
            <option value="todo" ${defaultStatus==='todo'?'selected':''}>To Do</option>
            <option value="in-progress" ${defaultStatus==='in-progress'?'selected':''}>In Progress</option>
            <option value="review" ${defaultStatus==='review'?'selected':''}>Review</option>
            <option value="done" ${defaultStatus==='done'?'selected':''}>Done</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-select" id="personal-task-priority">
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label">Due Date</label>
        <input type="date" class="form-input" id="personal-task-due" value="${new Date().toISOString().split('T')[0]}">
      </div>

      <!-- Subtasks Section -->
      <div class="form-group" style="border-top:1px solid var(--color-border);padding-top:14px;margin-bottom:6px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div class="subtasks-header-wrap" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span class="subtasks-header-icon" style="display:inline-flex;align-items:center;justify-content:center;width:18px!important;height:18px!important;min-width:18px!important;min-height:18px!important;color:#8B2CF5;flex-shrink:0;">
              ${Icons.checkSquare.replace('<svg ', '<svg style="width:18px!important;height:18px!important;min-width:18px!important;min-height:18px!important;color:#8B2CF5;flex-shrink:0;" ')}
            </span>
            <span class="subtasks-header-title" style="font-size:14px;font-weight:600;color:#0F172A;line-height:1;">Checklist Items</span>
          </div>
          <span id="create-modal-subtasks-count" style="font-size:11px;color:var(--color-text-muted);font-weight:600;">0 items</span>
        </div>
        <div id="create-modal-subtasks-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;">
          <div style="font-size:12.5px;color:var(--color-text-muted);font-style:italic;padding:4px 0;" id="create-modal-subtasks-empty">No subtasks added yet. Type below to add items.</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="text" class="form-input" id="create-modal-new-subtask" placeholder="Add checklist item..." style="font-size:13px;height:34px;flex:1;" onkeydown="if(event.key==='Enter'){event.preventDefault();TasksScreen.addModalSubtask();}">
          <button type="button" class="btn btn-secondary btn-sm" onclick="TasksScreen.addModalSubtask()" style="white-space:nowrap;height:34px;">
            ${Icons.plus} Add
          </button>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="TasksScreen.savePersonalTask()">Create Personal Task</button>
    `;

    Modal.open('Create Personal Task', body, footer, { large: true });
  },

  savePersonalTask() {
    const titleInput = document.getElementById('personal-task-title');
    const title = titleInput?.value?.trim() || '';
    if (!title) {
      const err = document.getElementById('personal-task-title-error');
      if (err) err.textContent = 'Personal task title is required';
      if (titleInput) titleInput.focus();
      return;
    }

    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const userMemberId = currentUser ? (currentUser.memberId || currentUser.id) : '';

    const data = {
      title,
      description: document.getElementById('personal-task-desc')?.value?.trim() || '',
      status: document.getElementById('personal-task-status')?.value || 'todo',
      priority: document.getElementById('personal-task-priority')?.value || 'medium',
      dueDate: document.getElementById('personal-task-due')?.value || '',
      projectId: '',
      isPersonal: true,
      assigneeId: userMemberId,
      assigneeIds: [userMemberId],
      creatorId: currentUser ? (currentUser.id || currentUser.memberId || '') : '',
      createdBy: currentUser ? (currentUser.name || '') : '',
      subtasks: this._modalSubtasks || []
    };

    Store.createTask(data);
    Toast.show('Personal task created');
    Modal.closeAll();
    this.updateTasksContainer();
  },

  deletePersonalTask(taskId) {
    Modal.confirm('Delete Personal Task', 'Are you sure you want to remove this personal task?', () => {
      Store.deleteTask(taskId);
      Toast.show('Personal task removed');
      Modal.closeAll();
      this.updateTasksContainer();
    }, { danger: true });
  },

  addModalSubtask() {
    const input = document.getElementById('create-modal-new-subtask');
    if (!input) return;
    const title = input.value.trim();
    if (!title) return;

    const newSubtask = {
      id: 'st-' + Date.now().toString(36) + '-' + Math.floor(Math.random()*1000),
      title: title,
      completed: false
    };
    this._modalSubtasks.push(newSubtask);
    input.value = '';
    this.renderModalSubtasks();
    input.focus();
  },

  removeModalSubtask(id) {
    this._modalSubtasks = this._modalSubtasks.filter(s => s.id !== id);
    this.renderModalSubtasks();
  },

  renderModalSubtasks() {
    const listEl = document.getElementById('create-modal-subtasks-list');
    const countEl = document.getElementById('create-modal-subtasks-count');
    if (!listEl) return;

    if (countEl) {
      countEl.textContent = `${this._modalSubtasks.length} item${this._modalSubtasks.length === 1 ? '' : 's'}`;
    }

    if (this._modalSubtasks.length === 0) {
      listEl.innerHTML = `<div style="font-size:12.5px;color:var(--color-text-muted);font-style:italic;padding:4px 0;" id="create-modal-subtasks-empty">No subtasks added yet. Type below to add checklist items.</div>`;
      return;
    }

    listEl.innerHTML = this._modalSubtasks.map((st, idx) => `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;border-radius:6px;background:var(--color-surface-soft, #f8fafc);border:1px solid var(--color-border-subtle, #e2e8f0);">
        <div style="display:flex;align-items:center;gap:8px;flex:1;">
          <span style="font-size:11px;font-weight:700;color:var(--color-primary);">${idx + 1}.</span>
          <span style="font-size:13px;color:var(--color-text-primary);">${Utils.escapeHtml(st.title)}</span>
        </div>
        <button type="button" class="btn btn-ghost btn-xs btn-icon" onclick="TasksScreen.removeModalSubtask('${st.id}')" title="Remove" style="color:var(--color-text-muted);">
          ${Icons.x}
        </button>
      </div>
    `).join('');
  },

  saveTask(id) {
    const titleEl = document.getElementById('task-title') || document.getElementById('detail-title');
    const projectEl = document.getElementById('task-project') || document.getElementById('detail-project');
    const descEl = document.getElementById('task-desc') || document.getElementById('detail-desc');
    const priorityEl = document.getElementById('task-priority') || document.getElementById('detail-priority');
    const dueEl = document.getElementById('task-due') || document.getElementById('detail-due');
    const statusEl = document.getElementById('task-status') || document.getElementById('detail-status');

    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isStandardUser = !isAdmin;
    const userMemberId = currentUser ? (currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '')) : '';

    const title = titleEl?.value?.trim() || '';
    const projectId = projectEl?.value || '';
    if (!title) {
      const errEl = document.getElementById('task-title-error');
      if (errEl) errEl.textContent = 'Task title is required';
      if (titleEl) { titleEl.classList.add('error'); titleEl.focus(); }
      return;
    }

    const existingTask = id ? Store.getTask(id) : null;
    const isPersonal = existingTask ? existingTask.isPersonal : !projectId;

    if (!isPersonal && !projectId) {
      Toast.show('Please select a project for this task', 'error');
      if (projectEl) projectEl.focus();
      return;
    }

    // Role-based assignee enforcement: ONLY Admin can select or change team members
    let assigneeIds = [];
    if (isAdmin) {
      const checkedAssigneeBoxes = document.querySelectorAll('.task-assignee-cb:checked');
      assigneeIds = Array.from(checkedAssigneeBoxes).map(cb => cb.value);
      if (assigneeIds.length === 0) {
        const fallbackAssignee = document.getElementById('task-assignee')?.value || document.getElementById('detail-assignee')?.value;
        if (fallbackAssignee) {
          assigneeIds = [fallbackAssignee];
        } else if (existingTask && Array.isArray(existingTask.assigneeIds) && existingTask.assigneeIds.length > 0) {
          assigneeIds = existingTask.assigneeIds;
        } else if (existingTask && existingTask.assigneeId) {
          assigneeIds = [existingTask.assigneeId];
        }
      }
      assigneeIds = assigneeIds.filter(mid => mid && mid !== 'm1' && Store.getMember(mid)?.role !== 'Admin');
      assigneeIds = [...new Set(assigneeIds)];
    } else {
      // Standard user cannot change or pick assignees
      if (id && existingTask) {
        // Preserves existing task assignments strictly
        assigneeIds = Array.isArray(existingTask.assigneeIds) && existingTask.assigneeIds.length > 0
          ? existingTask.assigneeIds
          : (existingTask.assigneeId ? [existingTask.assigneeId] : [userMemberId || currentUser?.id || 'm2']);
      } else {
        // New task created by standard user is strictly assigned to themselves
        assigneeIds = [userMemberId || currentUser?.id || 'm2'];
      }
    }
    const assigneeId = assigneeIds[0] || (userMemberId || currentUser?.id || '');

    if (id) {
      const isAssigned = this._isUserTask(existingTask, currentUser);
      const updatePayload = {
        title,
        projectId: isPersonal ? '' : projectId,
        description: descEl?.value?.trim() || '',
        assigneeId,
        assigneeIds,
        priority: priorityEl?.value || 'medium',
        status: (isAdmin || !isAssigned) ? (existingTask ? existingTask.status : 'todo') : (statusEl?.value || 'todo'),
        dueDate: dueEl?.value || ''
      };

      // Detect if developer moved task to review in modal
      if (!isAdmin && existingTask && updatePayload.status === 'review' && existingTask.status !== 'review') {
        const devName = currentUser ? currentUser.name : 'Assigned developer';
        Store.addNotification({
          type: 'task',
          text: `📋 Task "<strong>${title}</strong>" submitted for review by ${devName}. Ready for admin review.`,
          taskId: id,
          projectId: updatePayload.projectId,
          read: false
        });
      }

      Store.updateTask(id, updatePayload);
      Toast.show('Task updated');
    } else {
      const data = {
        title,
        projectId,
        description: descEl?.value?.trim() || '',
        assigneeId,
        assigneeIds,
        creatorId: currentUser ? (currentUser.id || currentUser.memberId || '') : '',
        createdBy: currentUser ? (currentUser.name || '') : '',
        priority: priorityEl?.value || 'medium',
        status: statusEl?.value || 'todo',
        dueDate: dueEl?.value || '',
        subtasks: this._modalSubtasks || []
      };
      Store.createTask(data);
      Toast.show('Task created successfully');
    }

    // Ensure all assigned members are linked to the project
    if (projectId && assigneeIds && assigneeIds.length > 0) {
      const proj = Store.getProject(projectId);
      if (proj) {
        let existingMembers = Array.isArray(proj.memberIds) ? [...proj.memberIds] : [];
        let updated = false;
        assigneeIds.forEach(mid => {
          if (!existingMembers.includes(mid)) {
            existingMembers.push(mid);
            updated = true;
          }
        });
        if (updated) {
          Store.updateProject(projectId, { memberIds: existingMembers });
        }
      }
    }

    Modal.closeAll();
    this.updateTasksContainer();
    if (typeof App !== 'undefined') App.refresh();
  },

  openDetailModal(taskId) {
    const t = Store.getTask(taskId);
    if (!t) return;
    const projects = Store.getProjects();
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isStandardUser = !isAdmin;
    const isOwnTask = this._isUserTask(t, currentUser);
    const isCreator = t && currentUser && (
      t.creatorId === currentUser.id ||
      t.creatorId === currentUser.memberId ||
      t.createdBy === currentUser.name ||
      (currentUser.id === 'preet' && (t.creatorId === 'm2' || t.createdBy === 'Preet Banga')) ||
      (currentUser.id === 'mohit' && (t.creatorId === 'm3' || t.createdBy === 'Mohit Joshi')) ||
      (currentUser.id === 'hirvi' && (t.creatorId === 'm4' || t.createdBy === 'Hirvi Shah'))
    );
    const canDelete = isAdmin || isCreator || t.isPersonal;
    const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];

    const existingAssigneeIds = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0
      ? t.assigneeIds
      : (t.assigneeId ? [t.assigneeId] : []);
    const selectableAssignees = this._getSelectableAssignees(t.projectId, currentUser);

    const body = `
      <div class="form-group" style="margin-bottom:14px">
        <label class="form-label">Title</label>
        <input type="text" class="form-input" id="detail-title" value="${Utils.escapeHtml(t.title)}" ${(!isOwnTask && !isAdmin) ? 'readonly style="background:var(--color-surface-subtle);cursor:default;"' : ''}>
      </div>
      <div class="form-group" style="margin-bottom:14px">
        <label class="form-label">${t.isPersonal ? 'Notes / Scratchpad' : 'Description'}</label>
        <textarea class="form-textarea" id="detail-desc" rows="3" ${(!isOwnTask && !isAdmin) ? 'readonly style="background:var(--color-surface-subtle);cursor:default;"' : ''}>${Utils.escapeHtml(t.description || '')}</textarea>
      </div>
      
      ${!t.isPersonal ? `
        <div class="form-row" style="margin-bottom:14px">
          <div class="form-group" style="flex:1;">
            <label class="form-label">Project</label>
            <select class="form-select" id="detail-project" ${(!isOwnTask && !isAdmin) ? 'disabled style="background:var(--color-surface-subtle);cursor:not-allowed;"' : ''} onchange="TasksScreen.handleProjectChangeInModal(this.value, 'detail')">
              ${projects.map(p => `<option value="${p.id}" ${t.projectId===p.id?'selected':''}>${p.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label" style="display:flex;align-items:center;justify-content:space-between;">
            <span>Assignee(s) ${isAdmin ? '<span style="font-weight:normal;color:var(--color-text-muted);font-size:12px;">(Select one or multiple team members)</span>' : '<span style="font-weight:normal;color:var(--color-text-muted);font-size:11px;">(Only Admin can assign or change team members)</span>'}</span>
          </label>
          <div id="detail-assignee-picker">
            ${isAdmin
              ? this._renderAssigneePills(selectableAssignees, existingAssigneeIds, 'detail')
              : this._renderReadOnlyAssigneePills(existingAssigneeIds)}
          </div>
          <input type="hidden" id="detail-assignee" value="${t.assigneeId || ''}">
        </div>
      ` : ''}

      <div class="form-row" style="margin-bottom:14px">
        <div class="form-group">
          <label class="form-label">Status ${isAdmin ? '<span style="font-weight:400;color:var(--color-text-muted);font-size:11px;">(Observer Mode)</span>' : (!isOwnTask ? '<span style="font-weight:400;color:var(--color-text-muted);font-size:11px;">(View Only)</span>' : '')}</label>
          <select class="form-select" id="detail-status" ${(!isOwnTask || isAdmin) ? 'disabled style="background:var(--color-surface-subtle);cursor:not-allowed;" title="' + (isAdmin ? 'Live execution status updated by assigned developers' : 'Only assigned team member can update execution status') + '"' : ''}>
            ${['todo','in-progress','review','done'].map(s => `<option value="${s}" ${t.status===s?'selected':''}>${Utils.humanize(s)}</option>`).join('')}
          </select>
          ${isAdmin ? `<small style="font-size:11px;color:var(--color-text-muted);display:block;margin-top:2px;">Live execution status updated by assigned developers.</small>` : (!isOwnTask ? `<small style="font-size:11px;color:var(--color-text-muted);display:block;margin-top:2px;">Only assigned team member can change execution status.</small>` : '')}
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-select" id="detail-priority" ${(!isOwnTask && !isAdmin) ? 'disabled style="background:var(--color-surface-subtle);cursor:not-allowed;"' : ''}>
            ${['low','medium','high'].map(p => `<option value="${p}" ${t.priority===p?'selected':''}>${Utils.humanize(p)}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Review Feedback Callout Banner (Visible when task has review feedback) -->
      ${(t.reviewNotes && (t.status === 'in-progress' || !isAdmin)) ? `
        <div class="review-feedback-banner" style="background:var(--color-primary-50);border:1px solid var(--color-primary-200);border-left:3px solid var(--color-primary);border-radius:6px;padding:12px 14px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--color-primary-800);margin-bottom:4px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
            <span>Review Changes Requested ${t.lastReviewedBy ? `by ${Utils.escapeHtml(t.lastReviewedBy)}` : ''} ${t.lastReviewAt ? `· ${Utils.timeAgo(t.lastReviewAt)}` : ''}</span>
          </div>
          <div style="font-size:13px;color:var(--color-text-primary);line-height:1.45;white-space:pre-wrap;">${Utils.escapeHtml(t.reviewNotes)}</div>
        </div>
      ` : ''}

      <div class="form-group" style="margin-bottom:18px">
        <label class="form-label">Due Date</label>
        <input type="date" class="form-input" id="detail-due" value="${t.dueDate || ''}" ${(!isOwnTask && !isAdmin) ? 'disabled style="background:var(--color-surface-subtle);cursor:not-allowed;"' : ''}>
      </div>

      <!-- Interactive Subtasks Checklist Section with Visual Progress Bar -->
      <div id="detail-subtasks-wrapper" style="border-top:1px solid var(--color-border);padding-top:16px;">
        ${this._buildSubtasksHtml(taskId, subtasks, (isAdmin || isOwnTask))}
      </div>
    `;

    const footer = `
      ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="${t.isPersonal ? `TasksScreen.deletePersonalTask('${taskId}')` : `TasksScreen.deleteTask('${taskId}')`}" style="margin-right:auto">Delete</button>` : ''}
      ${(isAdmin && t.status === 'review' && !t.isPersonal) ? `
        <button class="btn btn-primary btn-sm" onclick="TasksScreen.openReviewModal('${taskId}')" style="font-weight:600;display:inline-flex;align-items:center;gap:5px;">
          Review Changes
        </button>
      ` : ''}
      <button class="btn btn-secondary" onclick="Modal.closeAll()">${(!isAdmin && !isOwnTask) ? 'Close' : 'Cancel'}</button>
      ${(!isAdmin && !isOwnTask) ? '' : `<button class="btn btn-primary" onclick="TasksScreen.saveTask('${taskId}')">Save Changes</button>`}`;
    
    Modal.open(t.isPersonal ? 'Personal Task Details' : 'Edit Task Details', body, footer, { large: true });
  },

  _buildSubtasksHtml(taskId, subtasks, isEditable = true) {
    const list = Array.isArray(subtasks) ? subtasks : [];
    const total = list.length;
    const completed = list.filter(s => s.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isFull = total > 0 && completed === total;

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div class="subtasks-header-wrap" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span class="subtasks-header-icon" style="display: inline-flex; align-items: center; justify-content: center; width: 18px !important; height: 18px !important; min-width: 18px !important; min-height: 18px !important; color: #2563EB; flex-shrink: 0;">
            ${Icons.checkSquare.replace('<svg ', '<svg style="width: 18px !important; height: 18px !important; min-width: 18px !important; min-height: 18px !important; color: #2563EB; flex-shrink: 0;" ')}
          </span>
          <span class="subtasks-header-title" style="font-size: 14px; font-weight: 600; color: #0F172A; line-height: 1;">Subtasks Checklist <span style="font-weight:normal;color:var(--color-text-muted);font-size:12px;">(${completed}/${total})</span></span>
        </div>
        <span class="badge ${isFull ? 'badge-success' : 'badge-primary'}" id="subtask-percent-pill" style="font-size:11px;font-weight:700;">
          ${percent}% Completed
        </span>
      </div>

      <!-- Visual Completion Percentage Bar -->
      <div class="subtasks-progress-track" style="width:100%;height:7px;background:var(--color-surface-subtle, #f1f5f9);border-radius:999px;overflow:hidden;margin-bottom:12px;border:1px solid var(--color-border-subtle, #e2e8f0);">
        <div class="subtasks-progress-fill" style="width:${percent}%;height:100%;background:${isFull ? 'var(--color-success-500, #22c55e)' : 'linear-gradient(90deg, var(--color-primary), var(--color-ai, #8B2CF5))'};transition:width 0.25s ease;border-radius:999px;"></div>
      </div>

      <!-- Checklist Items -->
      <div class="subtasks-checklist-items" style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
        ${total === 0 ? `
          <div style="font-size:12.5px;color:var(--color-text-muted);font-style:italic;padding:6px 0;">No subtasks created for this task yet. ${isEditable ? 'Add checklist items below.' : ''}</div>
        ` : list.map(st => `
          <div class="subtask-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;border-radius:6px;background:${st.completed ? 'var(--color-surface-subtle, #f8fafc)' : 'var(--color-surface)'};border:1px solid ${st.completed ? 'var(--color-border-subtle, #e2e8f0)' : 'var(--color-border)'};transition:all 0.15s ease;">
            <label style="display:flex;align-items:center;gap:10px;cursor:${isEditable ? 'pointer' : 'default'};flex:1;margin:0;user-select:none;">
              <input type="checkbox" ${st.completed ? 'checked' : ''} ${!isEditable ? 'disabled style="cursor:not-allowed;"' : `onchange="TasksScreen.handleToggleSubtask('${taskId}', '${st.id}', this.checked)"`} style="width:16px;height:16px;cursor:${isEditable ? 'pointer' : 'not-allowed'};accent-color:var(--color-primary);border-radius:4px;">
              <span style="font-size:13px;transition:all 0.15s ease;${st.completed ? 'text-decoration:line-through;color:var(--color-text-disabled);' : 'color:var(--color-text-primary);font-weight:500;'}">
                ${Utils.escapeHtml(st.title)}
              </span>
            </label>
            ${isEditable ? `
              <button type="button" class="btn btn-ghost btn-xs btn-icon" onclick="TasksScreen.handleDeleteSubtask('${taskId}', '${st.id}')" title="Delete Subtask" style="color:var(--color-text-muted);">
                ${Icons.x}
              </button>
            ` : ''}
          </div>
        `).join('')}
      </div>

      ${isEditable ? `
        <!-- Inline + Add Subtask Text Field -->
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="text" class="form-input" id="detail-new-subtask-input" placeholder="+ Add a new subtask checklist item..." style="font-size:13px;height:34px;flex:1;" onkeydown="if(event.key==='Enter'){event.preventDefault();TasksScreen.handleAddSubtask('${taskId}');}">
          <button type="button" class="btn btn-secondary btn-sm" onclick="TasksScreen.handleAddSubtask('${taskId}')" style="white-space:nowrap;height:34px;">
            ${Icons.plus} Add Subtask
          </button>
        </div>
      ` : ''}
    `;
  },

  handleToggleSubtask(taskId, subtaskId, isChecked) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const task = Store.getTask(taskId);
    if (!task) return;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    if (!isAdmin && !this._isUserTask(task, currentUser)) {
      if (typeof Toast !== 'undefined') Toast.show('Only the assigned team member can update subtasks.', 'warning');
      return;
    }
    Store.toggleSubtask(taskId, subtaskId, isChecked);
    const updatedTask = Store.getTask(taskId);
    const wrapper = document.getElementById('detail-subtasks-wrapper');
    if (wrapper && updatedTask) {
      wrapper.innerHTML = this._buildSubtasksHtml(taskId, updatedTask.subtasks || [], true);
    }
    this.updateTasksContainer();
  },

  handleAddSubtask(taskId) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const task = Store.getTask(taskId);
    if (!task) return;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    if (!isAdmin && !this._isUserTask(task, currentUser)) {
      if (typeof Toast !== 'undefined') Toast.show('Only the assigned team member can add subtasks.', 'warning');
      return;
    }
    const input = document.getElementById('detail-new-subtask-input');
    if (!input) return;
    const title = input.value.trim();
    if (!title) return;

    Store.addSubtask(taskId, title);
    const updatedTask = Store.getTask(taskId);
    const wrapper = document.getElementById('detail-subtasks-wrapper');
    if (wrapper && updatedTask) {
      wrapper.innerHTML = this._buildSubtasksHtml(taskId, updatedTask.subtasks || [], true);
      const newInput = document.getElementById('detail-new-subtask-input');
      if (newInput) newInput.focus();
    }
    this.updateTasksContainer();
    Toast.show('Subtask added');
  },

  handleDeleteSubtask(taskId, subtaskId) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const task = Store.getTask(taskId);
    if (!task) return;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    if (!isAdmin && !this._isUserTask(task, currentUser)) {
      if (typeof Toast !== 'undefined') Toast.show('Only the assigned team member can remove subtasks.', 'warning');
      return;
    }
    Store.deleteSubtask(taskId, subtaskId);
    const updatedTask = Store.getTask(taskId);
    const wrapper = document.getElementById('detail-subtasks-wrapper');
    if (wrapper && updatedTask) {
      wrapper.innerHTML = this._buildSubtasksHtml(taskId, updatedTask.subtasks || [], true);
    }
    this.updateTasksContainer();
    Toast.show('Subtask removed');
  },

  addComment(taskId) {
    const input = document.getElementById('new-comment');
    const text = input ? input.value.trim() : '';
    if (!text) return;
    Store.addComment(taskId, Store.getSettings().currentUser, text);
    Toast.show('Comment added');
    Modal.closeAll();
    this.openDetailModal(taskId);
  },

  openReviewModal(taskId) {
    const task = Store.getTask(taskId);
    if (!task) return;

    const body = `
      <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px;line-height:1.5;">
        Specify the requested changes or review feedback for <strong style="color:var(--color-text-primary);">${Utils.escapeHtml(task.title)}</strong>. Submitting will move the task back to <strong>In Progress</strong> and notify the assigned developer(s).
      </div>
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:600;margin-bottom:6px;">
          Review Comments / Required Changes <span style="color:var(--color-danger);">*</span>
        </label>
        <textarea class="form-textarea" id="admin-review-input" rows="4" placeholder="Explain the specific changes, fixes, or additions needed..." style="resize:vertical;">${Utils.escapeHtml(task.reviewNotes || '')}</textarea>
        <div id="admin-review-error" style="color:var(--color-danger);font-size:11.5px;font-weight:500;margin-top:6px;display:none;"></div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="TasksScreen.submitAdminReview('${taskId}')">Submit Changes</button>
    `;

    Modal.open('Review Changes', body, footer);
  },

  submitAdminReview(taskId) {
    const task = Store.getTask(taskId);
    if (!task) return;

    const input = document.getElementById('admin-review-input');
    const errorEl = document.getElementById('admin-review-error');
    const reviewText = input ? input.value.trim() : '';

    if (!reviewText) {
      if (errorEl) {
        errorEl.textContent = 'Please enter review comments or required changes.';
        errorEl.style.display = 'block';
      }
      if (typeof Toast !== 'undefined') {
        Toast.show('Please enter review comments before requesting changes', 'error');
      }
      if (input) {
        input.classList.add('error');
        input.focus();
      }
      return;
    }

    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const adminName = currentUser ? (currentUser.name || 'Admin') : 'Admin';
    const assigneeIds = Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0
      ? task.assigneeIds
      : (task.assigneeId ? [task.assigneeId] : []);

    const reviewHistory = Array.isArray(task.reviewHistory) ? [...task.reviewHistory] : [];
    reviewHistory.unshift({
      text: reviewText,
      reviewedBy: adminName,
      reviewedAt: new Date().toISOString()
    });

    // Move task back to In Progress with review feedback
    Store.updateTask(taskId, {
      status: 'in-progress',
      completed: false,
      reviewNotes: reviewText,
      lastReviewAt: new Date().toISOString(),
      lastReviewedBy: adminName,
      reviewHistory
    });

    // Notify assignee(s)
    const notifText = `⚠️ <strong>Changes requested on "${task.title}"</strong> by ${adminName}: <strong>"${reviewText}"</strong>. Task moved back to In Progress.`;
    Store.addNotification({
      type: 'task',
      text: notifText,
      taskId: task.id,
      projectId: task.projectId,
      targetMemberIds: assigneeIds,
      reviewNotes: reviewText,
      read: false
    });

    // Activity log
    const assigneeNames = assigneeIds.map(mid => {
      const mem = Store.getMember(mid);
      return mem ? mem.name : mid;
    }).filter(Boolean);

    Store._addActivity(
      'task',
      `Admin <strong>${adminName}</strong> requested changes on task <strong>${task.title}</strong>${assigneeNames.length > 0 ? ` (assigned to ${assigneeNames.join(', ')})` : ''}: "${Utils.escapeHtml(reviewText)}"`
    );

    if (typeof Toast !== 'undefined') {
      Toast.show(`Review submitted. Task moved back to In Progress and assignee(s) notified.`, 'success');
    }

    Modal.closeAll();
    this.updateTasksContainer();
    if (typeof App !== 'undefined') {
      App.refresh();
      App.updateNotifDot();
    }
  },

  deleteTask(id) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const t = Store.getTask(id);
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isCreator = t && currentUser && (
      t.creatorId === currentUser.id ||
      t.creatorId === currentUser.memberId ||
      t.createdBy === currentUser.name ||
      (currentUser.id === 'preet' && (t.creatorId === 'm2' || t.createdBy === 'Preet Banga')) ||
      (currentUser.id === 'mohit' && (t.creatorId === 'm3' || t.createdBy === 'Mohit Joshi')) ||
      (currentUser.id === 'hirvi' && (t.creatorId === 'm4' || t.createdBy === 'Hirvi Shah'))
    );
    const isPersonal = t && t.isPersonal;

    if (!isAdmin && !isCreator && !isPersonal) {
      if (typeof Toast !== 'undefined') Toast.show('Only the task creator or administrators can delete tasks.', 'error');
      return;
    }
    Modal.confirm('Delete Task', 'Are you sure you want to delete this task?',
      () => { Store.deleteTask(id); Toast.show('Task deleted'); Modal.closeAll(); App.refresh(); }, { danger: true });
  }
};
