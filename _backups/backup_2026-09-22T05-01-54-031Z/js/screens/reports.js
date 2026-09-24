// ─── Reports Screen (Blue/Purple/Slate Theme) ───
const ReportsScreen = {
  render() {
    const s = Store.getStats();
    const projects = Store.getProjects();
    const tasks = Store.getTasks();
    const members = Store.getMembers();
    const issues = Store.getIssues();

    // Project breakdown
    const statusCounts = {};
    projects.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });
    // Task breakdown
    const taskStatusCounts = {};
    tasks.forEach(t => { taskStatusCounts[t.status] = (taskStatusCounts[t.status] || 0) + 1; });
    // Priority breakdown
    const priorityCounts = {};
    tasks.forEach(t => { priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1; });
    // Member workload
    const memberWork = members.map(m => {
      const mt = tasks.filter(t => t.assigneeId === m.id);
      return { ...m, total: mt.length, done: mt.filter(t=>t.status==='done').length, active: mt.filter(t=>t.status!=='done').length };
    }).sort((a,b) => b.total - a.total);

    const maxTasks = Math.max(...memberWork.map(m => m.total), 1);

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Reports & Analytics</h1>
          <p>Project intelligence and task execution analytics</p>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Total Projects</span>
            <span style="color:var(--color-primary)">${Icons.folder}</span>
          </div>
          <div class="kpi-value">${s.totalProjects}</div>
          <div class="kpi-change neutral">${s.activeProjects} active</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Total Tasks</span>
            <span style="color:var(--color-primary)">${Icons.checkSquare}</span>
          </div>
          <div class="kpi-value">${s.totalTasks}</div>
          <div class="kpi-change positive">${s.completedTasks} completed</div>
        </div>

        <div class="kpi-card kpi-card-ai">
          <div class="kpi-header">
            <span class="kpi-label" style="color:var(--color-ai-700)">Completed</span>
            <span style="color:var(--color-ai)">${Icons.checkSquare}</span>
          </div>
          <div class="kpi-value" style="color:var(--color-ai-700)">${s.completedTasks}</div>
          <div class="kpi-change ai">${s.totalTasks ? Math.round(s.completedTasks/s.totalTasks*100) : 0}% completion rate</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Overdue Tasks</span>
            <span style="color:${s.overdueTasks > 0 ? 'var(--color-ai-700)' : 'var(--color-primary)'}">${Icons.clock}</span>
          </div>
          <div class="kpi-value" style="color:${s.overdueTasks > 0 ? 'var(--color-ai-700)' : 'inherit'}">${s.overdueTasks}</div>
          <div class="kpi-change ${s.overdueTasks > 0 ? 'ai' : 'positive'}">${s.overdueTasks > 0 ? 'Requires attention' : 'All on track'}</div>
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
            }).join('')}
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
            }).join('')}
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
            }).join('')}
          </div>
        </div>

        <div class="section-card">
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
        </div>
      </div>

      <div class="section-card">
        <div class="section-card-header"><h3>${Icons.barChart} Project Details</h3></div>
        <div class="section-card-body no-pad">
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Project</th><th>Type</th><th>Status</th><th>Progress</th><th>Tasks</th><th>Issues</th><th>Team</th></tr></thead>
              <tbody>${projects.map(p => {
                const pt = Store.getTasks(p.id);
                const pi = Store.getIssues(p.id);
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
                  <td style="font-size:12.5px">${pt.filter(t=>t.status==='done').length}/${pt.length}</td>
                  <td style="font-size:12.5px;color:${pi.filter(i=>i.status==='open').length>0 ? 'var(--color-ai-700);font-weight:600' : 'var(--color-text-muted)'}">
                    ${pi.filter(i=>i.status==='open').length} open
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
