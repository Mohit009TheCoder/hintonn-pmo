// ─── Dashboard Screen (Section 25 & 26) ───
const DashboardScreen = {
  render() {
    const s = Store.getStats();
    const activities = Store.getActivities(8);
    const projects = Store.getProjects();
    const tasks = Store.getTasks();
    const settings = Store.getSettings();
    const now = new Date();
    const openIssues = Store.getIssues().filter(i => i.status === 'open').slice(0, 5);
    const myTasks = tasks.filter(t => t.assigneeId === settings.currentUser && t.status !== 'done').slice(0, 5);

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Good ${now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, ${this._getUserName(settings.currentUser)}</h1>
          <p>Here is what Hintonn AI is managing and what needs your attention today.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="App.navigate('tasks')">
            ${Icons.checkSquare} View Tasks
          </button>
          <button class="btn btn-ai" onclick="App.openCommand()">
            ${Icons.bot} Ask Hintonn
          </button>
        </div>
      </div>

      <!-- KPI Grid with Manrope Typography -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Active Projects</span>
            <span style="color:var(--color-primary)">${Icons.folder}</span>
          </div>
          <div class="kpi-value">${s.activeProjects}</div>
          <div class="kpi-change neutral">${s.totalProjects} total managed</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Tasks Completed</span>
            <span style="color:var(--color-primary)">${Icons.checkSquare}</span>
          </div>
          <div class="kpi-value">${s.completedTasks}</div>
          <div class="kpi-change positive">↑ ${s.totalTasks ? Math.round(s.completedTasks / s.totalTasks * 100) : 0}% completion rate</div>
        </div>

        <div class="kpi-card kpi-card-ai">
          <div class="kpi-header">
            <span class="kpi-label" style="color:var(--color-ai-700)">AI Actions</span>
            <span style="color:var(--color-ai)">${Icons.bot}</span>
          </div>
          <div class="kpi-value" style="color:var(--color-ai-700)">124</div>
          <div class="kpi-change ai">82% resolved automatically</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Needs Attention</span>
            <span style="color:${s.overdueTasks + s.openIssues > 0 ? 'var(--color-ai-700)' : 'var(--color-primary)'}">${Icons.alertCircle}</span>
          </div>
          <div class="kpi-value" style="color:${s.overdueTasks + s.openIssues > 0 ? 'var(--color-ai-700)' : 'var(--color-text-primary)'}">${s.overdueTasks + s.openIssues}</div>
          <div class="kpi-change ${s.overdueTasks + s.openIssues > 0 ? 'negative' : 'positive'}">
            ${s.overdueTasks} overdue · ${s.openIssues} open issues
          </div>
        </div>
      </div>

      <!-- Project Progress & AI Activity Monitoring -->
      <div class="content-grid content-grid-2-1" style="margin-bottom:24px">
        <div class="section-card">
          <div class="section-card-header">
            <h3>Project Progress</h3>
            <a href="#projects" class="btn btn-ghost btn-sm">View all projects →</a>
          </div>
          <div class="section-card-body" style="padding:10px 20px">
            ${projects.filter(p => p.status === 'active' || p.status === 'planning').slice(0, 4).map(p => `
              <div class="project-progress-row" onclick="App.navigate('project-detail','${p.id}')">
                <div class="project-progress-meta">
                  <div class="project-progress-name">${p.name}</div>
                  <div class="project-progress-sub">${p.type} · ${Store.getTasks(p.id).length} tasks · ${Store.getMilestones(p.id).length} milestones</div>
                </div>
                <div class="project-progress-bar-wrap">
                  <div class="progress-bar progress-blue" style="flex:1">
                    <div class="progress-bar-fill" style="width:${p.progress}%"></div>
                  </div>
                  <span class="project-progress-pct">${p.progress}%</span>
                </div>
              </div>`).join('') || '<div class="empty-state" style="padding:32px"><p>No active projects</p></div>'}
          </div>
        </div>

        <!-- AI Activity Monitoring Card -->
        <div class="section-card">
          <div class="section-card-header">
            <h3>AI Activity</h3>
            <span class="badge badge-active" style="font-size:11.5px">Monitoring</span>
          </div>
          <div class="section-card-body" style="padding:16px 20px">
            <div style="margin-bottom:14px">
              <div style="font-size:18px;font-weight:700;color:var(--color-text-primary);line-height:1.2">124 autonomous actions</div>
              <div style="font-size:12.5px;color:var(--color-text-muted);margin-top:2px">Across 3 AI agents in the last 24 hours</div>
            </div>

            <div class="ai-activity-list">
              <div class="ai-activity-row">
                <div class="ai-activity-dot"></div>
                <div style="flex:1">
                  <div class="ai-activity-agent-name">Sales Agent</div>
                  <div class="ai-activity-agent-role">Inbound Qualification</div>
                </div>
                <div class="ai-activity-agent-stat">18 leads qualified</div>
              </div>

              <div class="ai-activity-row">
                <div class="ai-activity-dot"></div>
                <div style="flex:1">
                  <div class="ai-activity-agent-name">Orchestration</div>
                  <div class="ai-activity-agent-role">Workflow Dispatcher</div>
                </div>
                <div class="ai-activity-agent-stat">34 tasks synced</div>
              </div>

              <div class="ai-activity-row">
                <div class="ai-activity-dot"></div>
                <div style="flex:1">
                  <div class="ai-activity-agent-name">Research Agent</div>
                  <div class="ai-activity-agent-role">LoRA Fine-tuning</div>
                </div>
                <div class="ai-activity-agent-stat">12 runs evaluated</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Secondary Content: Tasks & Activity -->
      <div class="content-grid content-grid-2">
        <div class="section-card">
          <div class="section-card-header">
            <h3>${Icons.checkSquare} My Tasks</h3>
            <a href="#tasks" class="btn btn-ghost btn-sm">View all</a>
          </div>
          <div class="section-card-body no-pad">
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>Task</th><th>Status</th><th>Due Date</th></tr></thead>
                <tbody>
                  ${myTasks.map(t => `
                    <tr>
                      <td><span class="task-title" onclick="App.navigate('tasks')">${t.title}</span></td>
                      <td><span class="badge badge-${t.status}">${Utils.humanize(t.status)}</span></td>
                      <td style="font-size:12.5px;color:${Utils.isOverdue(t.dueDate) ? 'var(--color-error-500);font-weight:600' : 'var(--color-text-muted)'}">
                        ${t.dueDate ? Utils.formatDate(t.dueDate) : '—'}
                      </td>
                    </tr>`).join('') || '<tr><td colspan="3" class="empty-state" style="padding:28px">No tasks assigned to you</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-card-header">
            <h3>${Icons.activity} Recent Activity</h3>
          </div>
          <div class="section-card-body" style="padding:10px 24px">
            <div class="activity-feed">
              ${activities.map(a => `
                <div class="activity-item">
                  <div class="activity-icon ${a.type}">${this._activityIcon(a.type)}</div>
                  <div>
                    <div class="activity-text">${a.html}</div>
                    <div class="activity-time">${Utils.timeAgo(a.createdAt)}</div>
                  </div>
                </div>`).join('') || '<div class="empty-state" style="padding:24px"><p>No activity yet</p></div>'}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _getUserName(id) {
    const m = Store.getMember(id);
    return m ? m.name.split(' ')[0] : 'there';
  },

  _activityIcon(type) {
    const map = { task: '📋', project: '📁', comment: '💬', issue: '🔴', milestone: '🏁' };
    return map[type] || '📌';
  }
};
