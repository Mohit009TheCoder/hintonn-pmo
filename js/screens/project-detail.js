// ─── Project Detail Screen ───
const ProjectDetailScreen = {
  _tab: 'tasks',
  _issueFilter: 'all',

  switchTab(projectId, tab, filter = '') {
    this._tab = tab;
    if (tab === 'issues') {
      this._issueFilter = filter || 'all';
    }
    this.refresh(projectId);
    const tabsEl = document.querySelector('.tabs') || document.getElementById('project-tab-content');
    if (tabsEl && typeof tabsEl.scrollIntoView === 'function') {
      tabsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  setIssueFilter(projectId, filter) {
    this._issueFilter = filter;
    this.refresh(projectId);
  },

  render(projectId) {
    const p = Store.getProject(projectId);
    if (!p) return '<div class="empty-state"><h3>Project not found</h3></div>';

    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isStandardUser = !isAdmin;
    const userMemberId = currentUser ? (currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '')) : '';

    const isUserTask = (t) => {
      const ids = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
      return ids.some(id =>
        id === currentUser?.id ||
        (userMemberId && id === userMemberId) ||
        (currentUser?.id === 'preet' && id === 'm2') ||
        (currentUser?.id === 'mohit' && id === 'm3') ||
        (currentUser?.id === 'hirvi' && id === 'm4') ||
        (currentUser?.memberId === 'm2' && id === 'preet') ||
        (currentUser?.memberId === 'm3' && id === 'mohit') ||
        (currentUser?.memberId === 'm4' && id === 'hirvi')
      );
    };

    let allProjectTasks = Store.getTasks(projectId).filter(t => !t.isPersonal);

    // Strict RBAC: Standard user must be a member or have assigned tasks in project to view it
    if (isStandardUser) {
      const isMember = Array.isArray(p.memberIds) && (
        p.memberIds.includes(userMemberId) ||
        p.memberIds.includes(currentUser?.id) ||
        (currentUser?.id === 'preet' && p.memberIds.includes('m2')) ||
        (currentUser?.id === 'mohit' && p.memberIds.includes('m3')) ||
        (currentUser?.id === 'hirvi' && p.memberIds.includes('m4'))
      );
      const myProjectTasks = allProjectTasks.filter(isUserTask);
      if (!isMember && myProjectTasks.length === 0) {
        return `
          <div class="access-restricted-wrapper" style="min-height:75vh;display:flex;align-items:center;justify-content:center;padding:32px 20px;box-sizing:border-box;">
            <div class="section-card access-restricted-card" style="max-width:520px;width:100%;text-align:center;padding:48px 36px;box-shadow:var(--shadow-md);border-radius:12px;background:var(--color-surface);border:1px solid var(--color-border);box-sizing:border-box;">
              <div style="width:64px;height:64px;border-radius:50%;background:#FEF2F2;border:1px solid #FECACA;color:#DC2626;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                <svg style="width:30px;height:30px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h2 style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--color-text-primary);margin:0 0 12px 0;">Access Restricted</h2>
              <p style="font-size:14px;color:var(--color-text-secondary);line-height:1.6;margin:0 0 24px 0;">
                You are not listed as an active team member on this project. Please contact an administrator for project allocation.
              </p>
              <div>
                <button type="button" class="btn btn-primary" onclick="App.navigate('projects')" style="padding:0 24px;height:42px;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:8px;margin:0 auto;border-radius:8px;cursor:pointer;">
                  Back to Projects
                </button>
              </div>
            </div>
          </div>
        `;
      }
    }

    const tasks = isStandardUser ? allProjectTasks.filter(isUserTask) : allProjectTasks;
    const milestones = Store.getMilestones(projectId);
    let issues = Store.getIssues(projectId);
    if (isStandardUser) {
      issues = issues.filter(i => 
        i.assigneeId === currentUser?.id ||
        (userMemberId && i.assigneeId === userMemberId) ||
        (currentUser?.id === 'preet' && i.assigneeId === 'm2') ||
        (currentUser?.id === 'mohit' && i.assigneeId === 'm3') ||
        (currentUser?.id === 'hirvi' && i.assigneeId === 'm4') ||
        (currentUser?.memberId === 'm2' && i.assigneeId === 'preet') ||
        (currentUser?.memberId === 'm3' && i.assigneeId === 'mohit') ||
        (currentUser?.memberId === 'm4' && i.assigneeId === 'hirvi')
      );
    }
    const members = p.memberIds.map(id => Store.getMember(id)).filter(Boolean);
    const activities = Store.getActivities(20).filter(a => {
      return tasks.some(t => a.html.includes(t.title)) || a.html.includes(p.name);
    }).slice(0, 5);

    const openIssuesCount = issues.filter(i => i.status === 'open').length;

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
          ${isAdmin ? `<button class="btn btn-secondary" onclick="ProjectsScreen.openCreateModal(Store.getProject('${projectId}'))">${Icons.edit} Edit</button>` : ''}
          <button class="btn btn-primary" onclick="TasksScreen.openCreateModal('${projectId}')">${Icons.plus} Add Task</button>
        </div>
      </div>

      <!-- Interactive Metric Summary Cards -->
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:24px">
        <div class="kpi-card" style="cursor:pointer" onclick="ProjectDetailScreen.switchTab('${projectId}', 'tasks')" title="Click to view Project Tasks">
          <div class="kpi-label">Progress</div>
          <div class="kpi-value">${p.progress}%</div>
          <div class="progress-bar progress-blue" style="margin-top:8px"><div class="progress-bar-fill" style="width:${p.progress}%"></div></div>
        </div>

        <div class="kpi-card" style="cursor:pointer" onclick="ProjectDetailScreen.switchTab('${projectId}', 'tasks')" title="Click to view Project Tasks">
          <div class="kpi-label">Tasks</div>
          <div class="kpi-value">${tasks.filter(t=>t.status==='done').length}/${tasks.length}</div>
          <div class="kpi-change neutral">${tasks.filter(t=>t.status==='done').length} completed</div>
        </div>

        <div class="kpi-card" style="cursor:pointer" onclick="ProjectDetailScreen.switchTab('${projectId}', 'issues', 'open')" title="Click to filter Open Issues">
          <div class="kpi-label">Issues</div>
          <div class="kpi-value">${openIssuesCount}</div>
          <div class="kpi-change ${openIssuesCount > 0 ? 'negative' : 'positive'}" style="display:inline-flex;align-items:center;gap:4px">
            <span>${openIssuesCount} open</span>
            <span style="font-size:10px;opacity:0.85">➔</span>
          </div>
        </div>

        <div class="kpi-card" style="cursor:pointer" onclick="ProjectDetailScreen.switchTab('${projectId}', 'milestones')" title="Click to view Timeline Milestones">
          <div class="kpi-label">Timeline</div>
          <div style="font-size:14px;font-weight:600;color:var(--color-text-primary);margin-top:4px">${p.startDate ? Utils.formatDate(p.startDate) : '—'} → ${p.endDate ? Utils.formatDate(p.endDate) : '—'}</div>
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
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const userMemberId = currentUser ? (currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '')) : '';
    const isUserTask = (t) => {
      const ids = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
      return ids.some(id =>
        id === currentUser?.id ||
        (userMemberId && id === userMemberId) ||
        (currentUser?.id === 'preet' && id === 'm2') ||
        (currentUser?.id === 'mohit' && id === 'm3') ||
        (currentUser?.id === 'hirvi' && id === 'm4') ||
        (currentUser?.memberId === 'm2' && id === 'preet') ||
        (currentUser?.memberId === 'm3' && id === 'mohit') ||
        (currentUser?.memberId === 'm4' && id === 'hirvi')
      );
    };

    if (!tasks.length) return `<div class="empty-state"><div class="empty-state-icon">${Icons.checkSquare}</div><h3>No tasks yet</h3><p>Create the first task for this project.</p><button class="btn btn-primary" onclick="TasksScreen.openCreateModal('${projectId}')">${Icons.plus} Add Task</button></div>`;
    return `<div class="table-wrap"><table class="table">
      <thead><tr><th style="width:40px"></th><th>Task</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due</th><th></th></tr></thead>
      <tbody>${tasks.sort((a,b)=>a.order-b.order).map(t => {
        const assigneeIds = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
        const members = assigneeIds.map(id => Store.getMember(id)).filter(Boolean);
        const m = members[0];
        return `<tr>
          <td><span class="priority-dot priority-${t.priority}" title="${t.priority}"></span></td>
          <td><span class="task-title" onclick="TasksScreen.openDetailModal('${t.id}')">${t.title}</span></td>
          <td>${members.length > 1 ? `
            <div style="display:flex;align-items:center;gap:6px">
              <div class="avatar-stack">
                ${members.map((mem, idx) => {
                  const initials = mem.initials || mem.name.split(' ').map(w=>w[0]).join('').slice(0,2);
                  return `<div class="avatar avatar-stack-item" style="background:${mem.color};width:24px;height:24px;font-size:9.5px;font-weight:700;color:#FFF;border:2px solid var(--color-surface,#FFF);border-radius:50%;margin-left:${idx===0?'0':'-8px'};position:relative;z-index:${idx+1}" title="${mem.name}">${initials}</div>`;
                }).join('')}
              </div>
              <span style="font-size:12px">${members.map(mem=>mem.name.split(' ')[0]).join(' + ')}</span>
            </div>
          ` : (members.length === 1 ? `
            <div style="display:flex;align-items:center;gap:6px"><div class="avatar avatar-sm" style="background:${m.color}">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div><span style="font-size:12px">${m.name}</span></div>
          ` : '<span style="color:var(--color-text-disabled);font-size:12px">Unassigned</span>')}</td>
          <td><span class="badge badge-${t.priority}">${Utils.humanize(t.priority)}</span></td>
          <td>
            ${(isAdmin || isUserTask(t)) ? `
              <select class="form-select" style="height:28px;font-size:11px;padding:0 24px 0 8px;width:auto;min-width:100px" onchange="TasksScreen.updateStatus('${t.id}',this.value)">
                ${['todo','in-progress','review','done'].map(s => `<option value="${s}" ${t.status===s?'selected':''}>${Utils.humanize(s)}</option>`).join('')}
              </select>
            ` : `
              <span class="badge badge-${t.status}" style="font-size:11px;padding:2px 8px;">${Utils.humanize(t.status)}</span>
            `}
          </td>
          <td style="font-size:12px;color:${Utils.isOverdue(t.dueDate)?'var(--color-error-500)':'var(--color-text-muted)'}">${t.dueDate ? Utils.formatDate(t.dueDate) : '—'}</td>
          <td><button class="btn btn-ghost btn-sm btn-icon" onclick="TasksScreen.openDetailModal('${t.id}')" title="${(isAdmin || isUserTask(t)) ? 'Edit' : 'View'}">${(isAdmin || isUserTask(t)) ? Icons.edit : Icons.eye}</button></td>
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
    const filter = this._issueFilter || 'all';
    let filtered = issues;
    if (filter === 'open') {
      filtered = issues.filter(i => i.status === 'open');
    } else if (filter === 'resolved') {
      filtered = issues.filter(i => i.status === 'resolved');
    }

    const openCount = issues.filter(i => i.status === 'open').length;
    const resolvedCount = issues.filter(i => i.status === 'resolved').length;

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div class="btn-group" style="display:inline-flex;background:var(--color-bg-page);padding:2px;border-radius:6px;border:1px solid var(--color-border)">
          <button class="btn btn-xs ${filter==='all'?'btn-primary':'btn-ghost'}" onclick="ProjectDetailScreen.setIssueFilter('${projectId}','all')" style="font-weight:600">
            All Issues (${issues.length})
          </button>
          <button class="btn btn-xs ${filter==='open'?'btn-primary':'btn-ghost'}" onclick="ProjectDetailScreen.setIssueFilter('${projectId}','open')" style="font-weight:600">
            Open (${openCount})
          </button>
          <button class="btn btn-xs ${filter==='resolved'?'btn-primary':'btn-ghost'}" onclick="ProjectDetailScreen.setIssueFilter('${projectId}','resolved')" style="font-weight:600">
            Resolved (${resolvedCount})
          </button>
        </div>
        <button class="btn btn-primary btn-sm" onclick="IssuesScreen.openCreateModal('${projectId}')">${Icons.plus} Report Issue</button>
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons.alertCircle}</div>
          <h3>No ${filter !== 'all' ? filter : ''} issues found</h3>
          <p>${filter !== 'all' ? `No issues currently marked as ${filter} for this project.` : 'No issues reported for this project.'}</p>
          ${filter !== 'all' ? `<button class="btn btn-secondary btn-sm" onclick="ProjectDetailScreen.setIssueFilter('${projectId}','all')" style="margin-top:8px">Show All Issues</button>` : ''}
        </div>
      ` : `
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Issue</th><th>Priority</th><th>Assignee</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>${filtered.map(i => {
            const m = Store.getMember(i.assigneeId);
            const createdDate = i.createdAt ? (function(raw) {
              try {
                const d = new Date(raw);
                return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              } catch(e) { return '—'; }
            })(i.createdAt) : (new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));

            return `<tr>
              <td><span class="task-title" onclick="IssuesScreen.openEditModal('${i.id}')">${i.title}</span></td>
              <td><span class="badge badge-${i.priority}">${Utils.humanize(i.priority)}</span></td>
              <td>${m ? m.name : '<span style="color:var(--color-text-disabled)">Unassigned</span>'}</td>
              <td><span class="badge badge-${i.status==='open'?'open':'resolved'}">${Utils.humanize(i.status)}</span></td>
              <td style="font-size:12px;color:var(--color-text-muted)">${createdDate}</td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      `}
    `;
  },

  _renderTeam(members, project) {
    return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px">
      ${members.map(m => {
        const memberTasks = Store.getTasks(project.id).filter(t => !t.isPersonal && (
          t.assigneeId === m.id ||
          (Array.isArray(t.assigneeIds) && t.assigneeIds.includes(m.id))
        ));
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

  refresh(projectId) {
    const id = projectId || App.currentProjectId;
    const content = document.getElementById('page-content');
    if (content && typeof App !== 'undefined' && App.currentScreen === 'project-detail') {
      content.innerHTML = this.render(id);
    } else if (typeof App !== 'undefined') {
      App.refresh();
    }
  }
};
