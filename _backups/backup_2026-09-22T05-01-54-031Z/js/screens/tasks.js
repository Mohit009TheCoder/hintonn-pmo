// ─── Tasks Screen ───
const TasksScreen = {
  _view: 'kanban',
  _filter: { project: '', status: '', priority: '', assignee: '', search: '' },
  _dragTask: null,

  render() {
    let tasks = Store.getTasks();
    if (this._filter.project) tasks = tasks.filter(t => t.projectId === this._filter.project);
    if (this._filter.status) tasks = tasks.filter(t => t.status === this._filter.status);
    if (this._filter.priority) tasks = tasks.filter(t => t.priority === this._filter.priority);
    if (this._filter.assignee) tasks = tasks.filter(t => t.assigneeId === this._filter.assignee);
    if (this._filter.search) {
      const q = this._filter.search.toLowerCase();
      tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }

    const projects = Store.getProjects();
    const members = Store.getMembers();

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Tasks</h1>
          <p>${Store.getTasks().length} total · ${Store.getTasks().filter(t=>t.status==='done').length} completed</p>
        </div>
        <div class="page-header-actions">
          <div style="display:flex;gap:4px">
            <button class="btn btn-ghost btn-sm" onclick="TasksScreen._view='kanban';TasksScreen.refresh()" style="${this._view==='kanban'?'background:var(--color-surface-subtle)':''}">Board</button>
            <button class="btn btn-ghost btn-sm" onclick="TasksScreen._view='list';TasksScreen.refresh()" style="${this._view==='list'?'background:var(--color-surface-subtle)':''}">List</button>
          </div>
          <button class="btn btn-primary" onclick="TasksScreen.openCreateModal()">${Icons.plus} New Task</button>
        </div>
      </div>

      <div class="filter-bar">
        <input type="text" class="form-input search-input" placeholder="Search tasks..." value="${this._filter.search}" oninput="TasksScreen._filter.search=this.value;TasksScreen.refresh()">
        <select class="form-select" style="width:140px" onchange="TasksScreen._filter.project=this.value;TasksScreen.refresh()">
          <option value="">All Projects</option>
          ${projects.map(p => `<option value="${p.id}" ${this._filter.project===p.id?'selected':''}>${p.name}</option>`).join('')}
        </select>
        <select class="form-select" style="width:120px" onchange="TasksScreen._filter.priority=this.value;TasksScreen.refresh()">
          <option value="">All Priority</option>
          <option value="high" ${this._filter.priority==='high'?'selected':''}>High</option>
          <option value="medium" ${this._filter.priority==='medium'?'selected':''}>Medium</option>
          <option value="low" ${this._filter.priority==='low'?'selected':''}>Low</option>
        </select>
        <select class="form-select" style="width:140px" onchange="TasksScreen._filter.assignee=this.value;TasksScreen.refresh()">
          <option value="">All Assignees</option>
          ${members.map(m => `<option value="${m.id}" ${this._filter.assignee===m.id?'selected':''}>${m.name}</option>`).join('')}
        </select>
      </div>

      ${tasks.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons.checkSquare}</div>
          <h3>No tasks found</h3>
          <p>${this._filter.search || this._filter.project || this._filter.priority || this._filter.assignee ? 'Try adjusting your filters.' : 'Create your first task to get started.'}</p>
          <button class="btn btn-primary" onclick="TasksScreen.openCreateModal()">${Icons.plus} New Task</button>
        </div>` :
      this._view === 'kanban' ? this._renderKanban(tasks) : this._renderList(tasks)}`;
  },

  _renderKanban(tasks) {
    const columns = [
      { status: 'todo', label: 'To Do', color: 'var(--color-text-disabled)' },
      { status: 'in-progress', label: 'In Progress', color: 'var(--color-primary)' },
      { status: 'review', label: 'Review', color: 'var(--color-ai)' },
      { status: 'done', label: 'Done', color: 'var(--color-success-500)' }
    ];
    return `<div class="kanban">${columns.map(col => {
      const colTasks = tasks.filter(t => t.status === col.status);
      return `<div class="kanban-column">
        <div class="kanban-column-header">
          <span style="width:10px;height:10px;border-radius:50%;background:${col.color}"></span>
          <span class="kanban-column-title">${col.label}</span>
          <span class="kanban-column-count">${colTasks.length}</span>
        </div>
        <div class="kanban-cards" data-status="${col.status}"
          ondragover="TasksScreen.onDragOver(event)" ondrop="TasksScreen.onDrop(event,'${col.status}')" ondragleave="TasksScreen.onDragLeave(event)">
          ${colTasks.sort((a,b)=>a.order-b.order).map(t => this._renderKanbanCard(t)).join('')}
        </div>
      </div>`;
    }).join('')}</div>`;
  },

  _renderKanbanCard(t) {
    const m = Store.getMember(t.assigneeId);
    const proj = Store.getProject(t.projectId);
    const isOverdue = Utils.isOverdue(t.dueDate);
    return `<div class="kanban-card" draggable="true" data-task-id="${t.id}"
      ondragstart="TasksScreen.onDragStart(event,'${t.id}')" ondragend="TasksScreen.onDragEnd(event)"
      onclick="TasksScreen.openDetailModal('${t.id}')">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <span class="badge badge-${t.priority}" style="font-size:10px;padding:1px 6px">${Utils.humanize(t.priority)}</span>
        ${proj ? `<span style="font-size:10px;color:var(--color-text-disabled)">${Utils.truncate(proj.name, 20)}</span>` : ''}
      </div>
      <div class="kanban-card-title">${t.title}</div>
      <div class="kanban-card-meta">
        <div class="kanban-card-assignee">
          ${m ? `<div class="avatar" style="background:${m.color};width:22px;height:22px;font-size:9px">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div><span>${m.name.split(' ')[0]}</span>` : ''}
        </div>
        ${t.dueDate ? `<div class="kanban-card-due ${isOverdue?'overdue':''}">${Icons.clock} ${Utils.formatDate(t.dueDate)}</div>` : ''}
      </div>
    </div>`;
  },

  _renderList(tasks) {
    return `<div class="section-card"><div class="section-card-body no-pad"><div class="table-wrap"><table class="table">
      <thead><tr><th></th><th>Task</th><th>Project</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due</th><th></th></tr></thead>
      <tbody>${tasks.sort((a,b)=>a.order-b.order).map(t => {
        const m = Store.getMember(t.assigneeId);
        const proj = Store.getProject(t.projectId);
        return `<tr>
          <td><span class="priority-dot priority-${t.priority}"></span></td>
          <td><span class="task-title" onclick="TasksScreen.openDetailModal('${t.id}')">${t.title}</span></td>
          <td style="font-size:12px;color:var(--color-text-muted)">${proj ? proj.name : '—'}</td>
          <td>${m ? `<div style="display:flex;align-items:center;gap:6px"><div class="avatar avatar-sm" style="background:${m.color}">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div><span style="font-size:12px">${m.name}</span></div>` : '<span style="color:var(--color-text-disabled);font-size:12px">—</span>'}</td>
          <td><span class="badge badge-${t.priority}">${Utils.humanize(t.priority)}</span></td>
          <td>
            <select class="form-select" style="height:28px;font-size:11px;padding:0 24px 0 8px;width:auto;min-width:100px" onchange="TasksScreen.updateStatus('${t.id}',this.value)">
              ${['todo','in-progress','review','done'].map(s => `<option value="${s}" ${t.status===s?'selected':''}>${Utils.humanize(s)}</option>`).join('')}
            </select>
          </td>
          <td style="font-size:12px;color:${Utils.isOverdue(t.dueDate)?'var(--color-error-500)':'var(--color-text-muted)'}">${t.dueDate ? Utils.formatDate(t.dueDate) : '—'}</td>
          <td><button class="btn btn-ghost btn-sm btn-icon" onclick="TasksScreen.openDetailModal('${t.id}')">${Icons.edit}</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div></div></div>`;
  },

  // Drag & Drop
  onDragStart(e, taskId) {
    this._dragTask = taskId;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  },
  onDragEnd(e) { e.target.classList.remove('dragging'); this._dragTask = null; },
  onDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); },
  onDragLeave(e) { e.currentTarget.classList.remove('drag-over'); },
  onDrop(e, status) {
    e.preventDefault(); e.currentTarget.classList.remove('drag-over');
    if (this._dragTask) { this.updateStatus(this._dragTask, status); this._dragTask = null; }
  },

  updateStatus(taskId, status) {
    Store.updateTask(taskId, { status });
    Toast.show(`Task moved to ${Utils.humanize(status)}`);
    App.refresh();
  },

  refresh() { document.getElementById('page-content').innerHTML = this.render(); },

  openCreateModal(projectId) {
    const projects = Store.getProjects();
    const members = Store.getMembers();
    const body = `
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label">Task Title *</label>
        <input type="text" class="form-input" id="task-title" placeholder="Enter task title">
        <div class="form-error" id="task-title-error"></div>
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="task-desc" placeholder="Describe the task"></textarea>
      </div>
      <div class="form-row" style="margin-bottom:16px">
        <div class="form-group">
          <label class="form-label">Project *</label>
          <select class="form-select" id="task-project">
            <option value="">Select project</option>
            ${projects.map(p => `<option value="${p.id}" ${projectId===p.id?'selected':''}>${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Assignee</label>
          <select class="form-select" id="task-assignee">
            <option value="">Unassigned</option>
            ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row" style="margin-bottom:16px">
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-select" id="task-priority">
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input type="date" class="form-input" id="task-due">
        </div>
      </div>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button><button class="btn btn-primary" onclick="TasksScreen.saveTask()">Create Task</button>`;
    Modal.open('New Task', body, footer);
  },

  saveTask(id) {
    // Support both create form (task-*) and edit form (detail-*)
    const titleEl = document.getElementById('task-title') || document.getElementById('detail-title');
    const projectEl = document.getElementById('task-project') || document.getElementById('detail-project');
    const descEl = document.getElementById('task-desc') || document.getElementById('detail-desc');
    const assigneeEl = document.getElementById('task-assignee') || document.getElementById('detail-assignee');
    const priorityEl = document.getElementById('task-priority') || document.getElementById('detail-priority');
    const dueEl = document.getElementById('task-due') || document.getElementById('detail-due');
    const statusEl = document.getElementById('detail-status');

    const title = titleEl?.value?.trim() || '';
    const projectId = projectEl?.value || '';
    if (!title) { const errEl = document.getElementById('task-title-error'); if(errEl) errEl.textContent = 'Title is required'; if(titleEl) titleEl.classList.add('error'); return; }
    if (!projectId) { Toast.show('Please select a project', 'error'); return; }
    const data = {
      title, projectId, description: descEl?.value?.trim() || '',
      assigneeId: assigneeEl?.value || '', priority: priorityEl?.value || 'medium',
      dueDate: dueEl?.value || ''
    };
    if (statusEl) data.status = statusEl.value;
    if (id) { Store.updateTask(id, data); Toast.show('Task updated'); }
    else { Store.createTask(data); Toast.show('Task created'); }
    Modal.closeAll(); App.refresh();
  },

  openDetailModal(taskId) {
    const t = Store.getTask(taskId);
    if (!t) return;
    const members = Store.getMembers();
    const projects = Store.getProjects();
    const comments = Store.getComments(taskId);
    const m = Store.getMember(t.assigneeId);

    const body = `
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label">Title</label>
        <input type="text" class="form-input" id="detail-title" value="${t.title}">
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="detail-desc">${t.description}</textarea>
      </div>
      <div class="form-row" style="margin-bottom:16px">
        <div class="form-group">
          <label class="form-label">Project</label>
          <select class="form-select" id="detail-project">
            ${projects.map(p => `<option value="${p.id}" ${t.projectId===p.id?'selected':''}>${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Assignee</label>
          <select class="form-select" id="detail-assignee">
            <option value="">Unassigned</option>
            ${members.map(m => `<option value="${m.id}" ${t.assigneeId===m.id?'selected':''}>${m.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row" style="margin-bottom:16px">
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="detail-status">
            ${['todo','in-progress','review','done'].map(s => `<option value="${s}" ${t.status===s?'selected':''}>${Utils.humanize(s)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-select" id="detail-priority">
            ${['low','medium','high'].map(p => `<option value="${p}" ${t.priority===p?'selected':''}>${Utils.humanize(p)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:20px">
        <label class="form-label">Due Date</label>
        <input type="date" class="form-input" id="detail-due" value="${t.dueDate || ''}">
      </div>
      <div style="border-top:1px solid var(--color-border);padding-top:16px">
        <label class="form-label" style="margin-bottom:12px">Comments (${comments.length})</label>
        <div class="comment-list" style="margin-bottom:16px">
          ${comments.map(c => {
            const author = Store.getMember(c.authorId);
            return `<div class="comment-item">
              <div class="avatar avatar-sm" style="background:${author?author.color:'#94A3B8'}">${author?author.name.split(' ').map(w=>w[0]).join('').slice(0,2):'??'}</div>
              <div class="comment-body">
                <div class="comment-header"><span class="comment-author">${author?author.name:'Unknown'}</span><span class="comment-time">${Utils.timeAgo(c.createdAt)}</span></div>
                <div class="comment-text">${c.text}</div>
              </div>
            </div>`;
          }).join('') || '<div style="font-size:13px;color:var(--color-text-muted);padding:12px 0">No comments yet</div>'}
        </div>
        <div style="display:flex;gap:8px">
          <input type="text" class="form-input" id="new-comment" placeholder="Add a comment..." style="flex:1">
          <button class="btn btn-primary btn-sm" onclick="TasksScreen.addComment('${taskId}')">Post</button>
        </div>
      </div>`;

    const footer = `
      <button class="btn btn-danger btn-sm" onclick="TasksScreen.deleteTask('${taskId}')" style="margin-right:auto">Delete</button>
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="TasksScreen.saveTask('${taskId}')">Save</button>`;
    Modal.open('Edit Task', body, footer, { large: true });
  },

  addComment(taskId) {
    const input = document.getElementById('new-comment');
    const text = input.value.trim();
    if (!text) return;
    Store.addComment(taskId, Store.getSettings().currentUser, text);
    Toast.show('Comment added');
    Modal.closeAll();
    this.openDetailModal(taskId);
  },

  deleteTask(id) {
    Modal.confirm('Delete Task', 'Are you sure you want to delete this task?',
      () => { Store.deleteTask(id); Toast.show('Task deleted'); Modal.closeAll(); App.refresh(); }, { danger: true });
  }
};
