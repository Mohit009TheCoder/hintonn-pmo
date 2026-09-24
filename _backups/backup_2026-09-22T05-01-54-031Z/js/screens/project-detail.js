// ─── Project Detail Screen ───
const ProjectDetailScreen = {
  _tab: 'tasks',

  render(projectId) {
    const p = Store.getProject(projectId);
    if (!p) return '<div class="empty-state"><h3>Project not found</h3></div>';

    const tasks = Store.getTasks(projectId);
    const milestones = Store.getMilestones(projectId);
    const issues = Store.getIssues(projectId);
    const members = p.memberIds.map(id => Store.getMember(id)).filter(Boolean);
    const activities = Store.getActivities(20).filter(a => {
      return tasks.some(t => a.html.includes(t.title)) || a.html.includes(p.name);
    }).slice(0, 5);

    const tabs = [
      { id: 'tasks', label: 'Tasks', count: tasks.length },
      { id: 'milestones', label: 'Milestones', count: milestones.length },
      { id: 'issues', label: 'Issues', count: issues.length },
      { id: 'team', label: 'Team', count: members.length },
      { id: 'activity', label: 'Activity' },
    ];

    return `
      <div class="page-header">
        <div class="page-header-left">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <a href="#projects" style="font-size:13px;color:var(--color-text-muted)">${Icons.chevronLeft} Projects</a>
          </div>
          <h1>${p.name}</h1>
          <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
            <span class="badge badge-${p.status}">${Utils.humanize(p.status)}</span>
            <span style="font-size:12px;color:var(--color-text-muted)">${p.type}</span>
            <span class="priority-dot priority-${p.priority}"></span>
            <span style="font-size:12px;color:var(--color-text-muted)">${Utils.humanize(p.priority)} priority</span>
          </div>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="ProjectsScreen.openCreateModal(Store.getProject('${projectId}'))">${Icons.edit} Edit</button>
          <button class="btn btn-primary" onclick="TasksScreen.openCreateModal('${projectId}')">${Icons.plus} Add Task</button>
        </div>
      </div>

      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:24px">
        <div class="kpi-card">
          <div class="kpi-label">Progress</div>
          <div class="kpi-value">${p.progress}%</div>
          <div class="progress-bar progress-blue" style="margin-top:8px"><div class="progress-bar-fill" style="width:${p.progress}%"></div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Tasks</div>
          <div class="kpi-value">${tasks.filter(t=>t.status==='done').length}/${tasks.length}</div>
          <div class="kpi-change neutral">${tasks.filter(t=>t.status==='done').length} completed</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Issues</div>
          <div class="kpi-value">${issues.filter(i=>i.status==='open').length}</div>
          <div class="kpi-change ${issues.filter(i=>i.status==='open').length > 0 ? 'negative' : 'positive'}">open</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Timeline</div>
          <div style="font-size:14px;font-weight:600;color:var(--color-text-primary)">${p.startDate ? Utils.formatDate(p.startDate) : '—'} → ${p.endDate ? Utils.formatDate(p.endDate) : '—'}</div>
        </div>
      </div>

      ${p.description ? `<div class="section-card" style="margin-bottom:24px"><div class="section-card-body"><p class="body">${p.description}</p></div></div>` : ''}

      <div class="tabs">
        ${tabs.map(t => `<button class="tab ${this._tab===t.id?'active':''}" onclick="ProjectDetailScreen._tab='${t.id}';ProjectDetailScreen.refresh('${projectId}')">${t.label}${t.count !== undefined ? ` (${t.count})` : ''}</button>`).join('')}
      </div>

      <div id="project-tab-content">${this._renderTab(projectId, tasks, milestones, issues, members, activities, p)}</div>`;
  },

  _renderTab(projectId, tasks, milestones, issues, members, activities, project) {
    switch(this._tab) {
      case 'tasks': return this._renderTasks(projectId, tasks);
      case 'milestones': return this._renderMilestones(projectId, milestones);
      case 'issues': return this._renderIssues(projectId, issues);
      case 'team': return this._renderTeam(members, project);
      case 'activity': return this._renderActivity(activities);
      default: return '';
    }
  },

  _renderTasks(projectId, tasks) {
    if (!tasks.length) return `<div class="empty-state"><div class="empty-state-icon">${Icons.checkSquare}</div><h3>No tasks yet</h3><p>Create the first task for this project.</p><button class="btn btn-primary" onclick="TasksScreen.openCreateModal('${projectId}')">${Icons.plus} Add Task</button></div>`;
    return `<div class="table-wrap"><table class="table">
      <thead><tr><th style="width:40px"></th><th>Task</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due</th><th></th></tr></thead>
      <tbody>${tasks.sort((a,b)=>a.order-b.order).map(t => {
        const m = Store.getMember(t.assigneeId);
        return `<tr>
          <td><span class="priority-dot priority-${t.priority}" title="${t.priority}"></span></td>
          <td><span class="task-title" onclick="TasksScreen.openDetailModal('${t.id}')">${t.title}</span></td>
          <td>${m ? `<div style="display:flex;align-items:center;gap:6px"><div class="avatar avatar-sm" style="background:${m.color}">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div><span style="font-size:12px">${m.name}</span></div>` : '<span style="color:var(--color-text-disabled);font-size:12px">Unassigned</span>'}</td>
          <td><span class="badge badge-${t.priority}">${Utils.humanize(t.priority)}</span></td>
          <td>
            <select class="form-select" style="height:28px;font-size:11px;padding:0 24px 0 8px;width:auto;min-width:100px" onchange="TasksScreen.updateStatus('${t.id}',this.value)">
              ${['todo','in-progress','review','done'].map(s => `<option value="${s}" ${t.status===s?'selected':''}>${Utils.humanize(s)}</option>`).join('')}
            </select>
          </td>
          <td style="font-size:12px;color:${Utils.isOverdue(t.dueDate)?'var(--color-error-500)':'var(--color-text-muted)'}">${t.dueDate ? Utils.formatDate(t.dueDate) : '—'}</td>
          <td><button class="btn btn-ghost btn-sm btn-icon" onclick="TasksScreen.openDetailModal('${t.id}')" title="View">${Icons.edit}</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
    <div style="margin-top:12px"><button class="btn btn-secondary btn-sm" onclick="TasksScreen.openCreateModal('${projectId}')">${Icons.plus} Add Task</button></div>`;
  },

  _renderMilestones(projectId, milestones) {
    if (!milestones.length) return `<div class="empty-state"><div class="empty-state-icon">${Icons.flag}</div><h3>No milestones</h3><p>Set milestones to track major deliverables.</p><button class="btn btn-primary" onclick="MilestonesScreen.openCreateModal('${projectId}')">${Icons.plus} Add Milestone</button></div>`;
    return `<div class="milestone-list">${milestones.map(m => {
      const status = m.status === 'completed' ? 'completed' : new Date(m.dueDate) < new Date() ? 'pending' : 'upcoming';
      return `<div class="milestone-item">
        <div class="milestone-icon ${status}">${status==='completed'?'✓':'⚑'}</div>
        <div class="milestone-info"><div class="milestone-name">${m.name}</div><div class="milestone-date">${m.dueDate ? 'Due ' + Utils.formatDate(m.dueDate) : 'No due date'}</div></div>
        <span class="badge badge-${status==='completed'?'completed':status==='pending'?'paused':'planning'}">${Utils.humanize(m.status)}</span>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="MilestonesScreen.openEditModal('${m.id}')">${Icons.edit}</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="MilestonesScreen.deleteMilestone('${m.id}')">${Icons.trash}</button>
      </div>`;
    }).join('')}</div>
    <div style="margin-top:12px"><button class="btn btn-secondary btn-sm" onclick="MilestonesScreen.openCreateModal('${projectId}')">${Icons.plus} Add Milestone</button></div>`;
  },

  _renderIssues(projectId, issues) {
    if (!issues.length) return `<div class="empty-state"><div class="empty-state-icon">${Icons.alertCircle}</div><h3>No issues</h3><p>No issues reported for this project.</p><button class="btn btn-primary" onclick="IssuesScreen.openCreateModal('${projectId}')">${Icons.plus} Report Issue</button></div>`;
    return `<div class="table-wrap"><table class="table">
      <thead><tr><th>Issue</th><th>Priority</th><th>Assignee</th><th>Status</th><th>Created</th></tr></thead>
      <tbody>${issues.map(i => {
        const m = Store.getMember(i.assigneeId);
        return `<tr>
          <td><span class="task-title">${i.title}</span></td>
          <td><span class="badge badge-${i.priority}">${Utils.humanize(i.priority)}</span></td>
          <td>${m ? m.name : '<span style="color:var(--color-text-disabled)">Unassigned</span>'}</td>
          <td><span class="badge badge-${i.status==='open'?'open':'resolved'}">${Utils.humanize(i.status)}</span></td>
          <td style="font-size:12px;color:var(--color-text-muted)">${Utils.timeAgo(i.createdAt)}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
    <div style="margin-top:12px"><button class="btn btn-secondary btn-sm" onclick="IssuesScreen.openCreateModal('${projectId}')">${Icons.plus} Report Issue</button></div>`;
  },

  _renderTeam(members, project) {
    return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px">
      ${members.map(m => {
        const memberTasks = Store.getTasks(project.id).filter(t => t.assigneeId === m.id);
        return `<div class="section-card" style="padding:20px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <div class="avatar avatar-lg" style="background:${m.color}">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
            <div><div style="font-size:14px;font-weight:600">${m.name}</div><div style="font-size:12px;color:var(--color-text-muted)">${m.role}</div></div>
          </div>
          <div style="display:flex;gap:16px;font-size:12px;color:var(--color-text-muted)">
            <span>${memberTasks.length} tasks</span>
            <span>${memberTasks.filter(t=>t.status==='done').length} done</span>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  },

  _renderActivity(activities) {
    if (!activities.length) return '<div class="empty-state"><p>No activity recorded yet.</p></div>';
    return `<div class="section-card"><div class="section-card-body"><div class="activity-feed">
      ${activities.map(a => `<div class="activity-item">
        <div class="activity-icon ${a.type}">${DashboardScreen._activityIcon(a.type)}</div>
        <div><div class="activity-text">${a.html}</div><div class="activity-time">${Utils.timeAgo(a.createdAt)}</div></div>
      </div>`).join('')}
    </div></div></div>`;
  },

  refresh(projectId) { document.getElementById('page-content').innerHTML = this.render(projectId); }
};
