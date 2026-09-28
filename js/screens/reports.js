// ─── Reports Screen (Personalized Role-Based Analytics) ───
const ReportsScreen = {
  render() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isDeveloper = currentUser && currentUser.role === 'AI Developer';
    const userMemberId = currentUser ? (currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '')) : '';

    const isUserTask = (t) => {
      return t.assigneeId === currentUser.id ||
             (userMemberId && t.assigneeId === userMemberId) ||
             (currentUser.id === 'preet' && t.assigneeId === 'm2') ||
             (currentUser.id === 'mohit' && t.assigneeId === 'm3') ||
             (currentUser.id === 'hirvi' && t.assigneeId === 'm4') ||
             (currentUser.memberId === 'm2' && t.assigneeId === 'preet') ||
             (currentUser.memberId === 'm3' && t.assigneeId === 'mohit') ||
             (currentUser.memberId === 'm4' && t.assigneeId === 'hirvi');
    };

    const allTasks = Store.getTasks();
    const allProjects = Store.getProjects();
    const s = Store.getStats();

    let tasks = allTasks;
    let projects = allProjects;

    // Data filtering for AI Developers
    if (isDeveloper) {
      tasks = allTasks.filter(isUserTask);
      const myProjectIds = new Set();
      tasks.forEach(t => {
        if (t.projectId) myProjectIds.add(t.projectId);
      });

      // Also include projects containing milestones assigned to currentUser or containing user's tasks
      const allMilestones = Store.getMilestones ? Store.getMilestones() : [];
      allMilestones.forEach(m => {
        const isUserMilestone = 
          m.assigneeId === currentUser.id ||
          (userMemberId && m.assigneeId === userMemberId) ||
          (currentUser.id === 'preet' && m.assigneeId === 'm2') ||
          (currentUser.id === 'mohit' && m.assigneeId === 'm3') ||
          (currentUser.id === 'hirvi' && m.assigneeId === 'm4') ||
          (m.taskIds && m.taskIds.some(tid => {
            const t = Store.getTask ? Store.getTask(tid) : allTasks.find(x => x.id === tid);
            return t && isUserTask(t);
          }));
        if (isUserMilestone && m.projectId) {
          myProjectIds.add(m.projectId);
        }
      });

      projects = allProjects.filter(p => myProjectIds.has(p.id));
    }

    // Top KPI metrics
    const totalProjects = isDeveloper ? projects.length : s.totalProjects;
    const activeProjects = isDeveloper ? projects.filter(p => p.status === 'active').length : s.activeProjects;

    const totalTasks = isDeveloper ? tasks.length : s.totalTasks;
    const completedTasks = isDeveloper ? tasks.filter(t => t.status === 'done').length : s.completedTasks;
    const activeTasks = isDeveloper ? tasks.filter(t => t.status !== 'done').length : (s.totalTasks - s.completedTasks);
    const completionRate = totalTasks ? Math.round(completedTasks / totalTasks * 100) : 0;

    const overdueTasks = isDeveloper 
      ? tasks.filter(t => t.status !== 'done' && t.dueDate && (typeof Utils !== 'undefined' ? Utils.isOverdue(t.dueDate) : new Date(t.dueDate) < new Date())).length
      : s.overdueTasks;

    // Project breakdown
    const statusCounts = {};
    projects.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });

    // Task breakdown
    const taskStatusCounts = {};
    tasks.forEach(t => { taskStatusCounts[t.status] = (taskStatusCounts[t.status] || 0) + 1; });

    // Priority breakdown
    const priorityCounts = {};
    tasks.forEach(t => { priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1; });

    // Admin Workload: Team workload across 3 developers (excluding Ayush Desai)
    const assignees = Store.getAssignees();
    const memberWork = assignees.map(m => {
      const mt = allTasks.filter(t => t.assigneeId === m.id);
      return { ...m, total: mt.length, done: mt.filter(t=>t.status==='done').length, active: mt.filter(t=>t.status!=='done').length };
    }).sort((a,b) => b.total - a.total);

    const maxTasks = Math.max(...memberWork.map(m => m.total), 1);

    const pageSubtitle = isDeveloper
      ? `Personal performance and assigned task execution analytics for ${currentUser ? currentUser.name : 'You'}`
      : 'Project intelligence and task execution analytics across portfolio';

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Reports & Analytics</h1>
          <p>${pageSubtitle}</p>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card" data-kpi="total-projects">
          <div class="kpi-header">
            <span class="kpi-label">Total Projects</span>
            <div class="kpi-icon-wrap">${Icons.folder}</div>
          </div>
          <div class="kpi-value">${totalProjects}</div>
          <div class="kpi-change neutral">${activeProjects} active</div>
        </div>

        <div class="kpi-card" data-kpi="total-tasks">
          <div class="kpi-header">
            <span class="kpi-label">Total Tasks</span>
            <div class="kpi-icon-wrap">${Icons.checkSquare}</div>
          </div>
          <div class="kpi-value">${totalTasks}</div>
          <div class="kpi-change positive">${completedTasks} completed</div>
        </div>

        <div class="kpi-card kpi-card-ai" data-kpi="completed">
          <div class="kpi-header">
            <span class="kpi-label" style="color:var(--color-ai-700)">Completed</span>
            <div class="kpi-icon-wrap ai">${Icons.checkSquare}</div>
          </div>
          <div class="kpi-value" style="color:var(--color-ai-700)">${completedTasks}</div>
          <div class="kpi-change ai">${completionRate}% completion rate</div>
        </div>

        <div class="kpi-card" data-kpi="overdue-tasks">
          <div class="kpi-header">
            <span class="kpi-label">Overdue Tasks</span>
            <div class="kpi-icon-wrap ${overdueTasks > 0 ? 'alert' : ''}">${Icons.clock}</div>
          </div>
          <div class="kpi-value" style="color:${overdueTasks > 0 ? 'var(--color-ai-700)' : 'inherit'}">${overdueTasks}</div>
          <div class="kpi-change ${overdueTasks > 0 ? 'ai' : 'positive'}">${overdueTasks > 0 ? 'Requires attention' : 'All on track'}</div>
        </div>
      </div>

      <div class="content-grid content-grid-2" style="margin-bottom:24px">
        <div class="section-card">
          <div class="section-card-header"><h3>${Icons.folder} Project Status</h3></div>
          <div class="section-card-body">
            ${Object.entries(statusCounts).map(([status, count]) => {
              const pct = Math.round(count / (projects.length || 1) * 100);
              return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                <span class="badge badge-${status}" style="min-width:90px">${Utils.humanize(status)}</span>
                <div class="progress-bar" style="flex:1">
                  <div class="progress-bar-fill" style="width:${pct}%;background:var(--color-primary)"></div>
                </div>
                <span style="font-family:var(--font-display);font-size:13px;font-weight:700;min-width:28px;text-align:right">${count}</span>
              </div>`;
            }).join('') || '<div style="font-size:13px;color:var(--color-text-muted)">No projects tracked</div>'}
          </div>
        </div>

        <div class="section-card">
          <div class="section-card-header"><h3>${Icons.target} Task Priority</h3></div>
          <div class="section-card-body">
            ${Object.entries(priorityCounts).map(([p, count]) => {
              const pct = Math.round(count / (tasks.length || 1) * 100);
              const color = p === 'high' ? 'var(--gradient-primary)' : p === 'medium' ? 'var(--color-primary-600)' : 'var(--neutral-400)';
              return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                <span class="badge badge-${p}" style="min-width:90px">${Utils.humanize(p)}</span>
                <div class="progress-bar" style="flex:1">
                  <div class="progress-bar-fill" style="width:${pct}%;background:${color}"></div>
                </div>
                <span style="font-family:var(--font-display);font-size:13px;font-weight:700;min-width:28px;text-align:right">${count}</span>
              </div>`;
            }).join('') || '<div style="font-size:13px;color:var(--color-text-muted)">No tasks tracked</div>'}
          </div>
        </div>
      </div>

      <div class="content-grid content-grid-2" style="margin-bottom:24px">
        <div class="section-card">
          <div class="section-card-header"><h3>${Icons.checkSquare} Task Status</h3></div>
          <div class="section-card-body">
            ${Object.entries(taskStatusCounts).map(([status, count]) => {
              const pct = Math.round(count / (tasks.length || 1) * 100);
              const colors = { 
                'todo': 'var(--neutral-400)', 
                'in-progress': 'var(--color-primary-600)', 
                'review': 'var(--color-ai-500)', 
                'done': 'var(--gradient-primary)' 
              };
              return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                <span class="badge badge-${status}" style="min-width:90px">${Utils.humanize(status)}</span>
                <div class="progress-bar" style="flex:1">
                  <div class="progress-bar-fill" style="width:${pct}%;background:${colors[status] || 'var(--color-primary)'}"></div>
                </div>
                <span style="font-family:var(--font-display);font-size:13px;font-weight:700;min-width:28px;text-align:right">${count}</span>
              </div>`;
            }).join('') || '<div style="font-size:13px;color:var(--color-text-muted)">No tasks tracked</div>'}
          </div>
        </div>

        <div class="section-card">
          ${isDeveloper ? `
            <div class="section-card-header"><h3>${Icons.barChart} My Workload & Performance</h3></div>
            <div class="section-card-body">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
                <div class="avatar avatar-md" style="background:${currentUser ? currentUser.color : 'var(--color-primary)'}">${currentUser ? currentUser.initials : 'PB'}</div>
                <div style="flex:1">
                  <div style="font-size:14px;font-weight:700;color:var(--color-text-primary);margin-bottom:2px">${currentUser ? currentUser.name : 'You'} (You)</div>
                  <div style="font-size:12px;color:var(--color-text-muted)">${currentUser ? currentUser.role : 'AI Developer'} · ${completedTasks} of ${totalTasks} tasks completed</div>
                </div>
                <span class="badge badge-done" style="font-size:12px;padding:4px 10px;font-weight:700">${completionRate}%</span>
              </div>

              <div style="margin-bottom:16px">
                <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px">
                  <span>Execution Progress</span>
                  <span>${completedTasks}/${totalTasks} Tasks Done</span>
                </div>
                <div class="progress-bar progress-gradient" style="height:10px">
                  <div class="progress-bar-fill" style="width:${completionRate}%"></div>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
                <div style="background:var(--color-surface-subtle);padding:12px;border-radius:8px;border:1px solid var(--color-border-subtle);text-align:center">
                  <div style="font-size:11px;color:var(--color-text-muted);font-weight:600;text-transform:uppercase;margin-bottom:4px">Active Tasks</div>
                  <div style="font-size:20px;font-weight:700;color:var(--color-primary)">${activeTasks}</div>
                </div>
                <div style="background:var(--color-surface-subtle);padding:12px;border-radius:8px;border:1px solid var(--color-border-subtle);text-align:center">
                  <div style="font-size:11px;color:var(--color-text-muted);font-weight:600;text-transform:uppercase;margin-bottom:4px">Completed</div>
                  <div style="font-size:20px;font-weight:700;color:var(--color-success-600)">${completedTasks}</div>
                </div>
              </div>
            </div>
          ` : `
            <div class="section-card-header"><h3>${Icons.users} Team Workload</h3></div>
            <div class="section-card-body">
              ${memberWork.map(m => `<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                <div class="avatar avatar-sm" style="background:${m.color}">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:4px">${m.name}</div>
                  <div class="progress-bar">
                    <div class="progress-bar-fill" style="width:${m.total/maxTasks*100}%;background:var(--gradient-primary)"></div>
                  </div>
                </div>
                <span style="font-size:12px;color:var(--color-text-muted);font-weight:500">${m.done}/${m.total}</span>
              </div>`).join('')}
            </div>
          `}
        </div>
      </div>

      <div class="section-card">
        <div class="section-card-header"><h3>${Icons.barChart} ${isDeveloper ? 'My Projects Overview' : 'Project Details'}</h3></div>
        <div class="section-card-body no-pad">
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Project</th><th>Type</th><th>Status</th><th>Progress</th><th>Tasks</th><th>Issues</th><th>Team</th></tr></thead>
              <tbody>${projects.map(p => {
                const pt = Store.getTasks(p.id);
                const pi = Store.getIssues(p.id);
                const projectTasks = isDeveloper ? pt.filter(isUserTask) : pt;
                const projectIssues = isDeveloper ? pi.filter(i => isUserTask({ assigneeId: i.assigneeId })) : pi;
                return `<tr>
                  <td><span class="task-title" onclick="App.navigate('project-detail','${p.id}')">${p.name}</span></td>
                  <td style="font-size:12px">${p.type}</td>
                  <td><span class="badge badge-${p.status}">${Utils.humanize(p.status)}</span></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="progress-bar progress-blue" style="width:80px">
                        <div class="progress-bar-fill" style="width:${p.progress}%"></div>
                      </div>
                      <span style="font-family:var(--font-display);font-size:12px;font-weight:700">${p.progress}%</span>
                    </div>
                  </td>
                  <td style="font-size:12.5px">${projectTasks.filter(t=>t.status==='done').length}/${projectTasks.length}</td>
                  <td style="font-size:12.5px;color:${projectIssues.filter(i=>i.status==='open').length>0 ? 'var(--color-ai-700);font-weight:600' : 'var(--color-text-muted)'}">
                    ${projectIssues.filter(i=>i.status==='open').length} open
                  </td>
                  <td style="font-size:12.5px">${p.memberIds.length}</td>
                </tr>`;
              }).join('')}</tbody>
            </table>
          </div>
        </div>
      </div>`;
  }
};
