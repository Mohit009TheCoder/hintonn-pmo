// ─── Reports Screen (Personalized Role-Based Analytics & Custom Report Builder) ───
const ReportsScreen = {
  _lastReport: null,

  _isUserTask(t, currentUser) {
    if (!t || !currentUser) return false;
    const userMemberId = currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '');
    const ids = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
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

  render() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isStandardUser = !isAdmin;
    const userMemberId = currentUser ? (currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '')) : '';

    const isUserTask = (t) => this._isUserTask(t, currentUser);

    const allTasks = Store.getTasks().filter(t => !t.isPersonal);
    const allProjects = Store.getProjects();
    const s = Store.getStats();

    let tasks = allTasks;
    let projects = allProjects;

    // Data filtering for standard users (personal activity)
    if (isStandardUser) {
      tasks = allTasks.filter(isUserTask);
      const myProjectIds = new Set();
      tasks.forEach(t => {
        if (t.projectId) myProjectIds.add(t.projectId);
      });

      // Include projects where user is a member
      allProjects.forEach(p => {
        if (Array.isArray(p.memberIds) && (
          p.memberIds.includes(userMemberId) ||
          p.memberIds.includes(currentUser?.id) ||
          (currentUser?.id === 'preet' && p.memberIds.includes('m2')) ||
          (currentUser?.id === 'mohit' && p.memberIds.includes('m3')) ||
          (currentUser?.id === 'hirvi' && p.memberIds.includes('m4'))
        )) {
          myProjectIds.add(p.id);
        }
      });

      // Also include projects containing milestones assigned to currentUser or containing user's tasks
      const allMilestones = Store.getMilestones ? Store.getMilestones() : [];
      allMilestones.forEach(m => {
        const isUserMilestone = 
          m.assigneeId === currentUser?.id ||
          (userMemberId && m.assigneeId === userMemberId) ||
          (currentUser?.id === 'preet' && m.assigneeId === 'm2') ||
          (currentUser?.id === 'mohit' && m.assigneeId === 'm3') ||
          (currentUser?.id === 'hirvi' && m.assigneeId === 'm4') ||
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
    const totalProjects = isStandardUser ? projects.length : s.totalProjects;
    const activeProjects = isStandardUser ? projects.filter(p => p.status === 'active').length : s.activeProjects;

    const totalTasks = isStandardUser ? tasks.length : s.totalTasks;
    const completedTasks = isStandardUser ? tasks.filter(t => t.status === 'done').length : s.completedTasks;
    const activeTasks = isStandardUser ? tasks.filter(t => t.status !== 'done').length : (s.totalTasks - s.completedTasks);
    const completionRate = totalTasks ? Math.round(completedTasks / totalTasks * 100) : 0;

    const overdueTasks = isStandardUser 
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

    // Admin Workload: Team workload across developers (excluding Admin m1)
    const assignees = Store.getAssignees();
    const memberWork = assignees.map(m => {
      const mt = allTasks.filter(t => t.assigneeId === m.id);
      return { ...m, total: mt.length, done: mt.filter(t=>t.status==='done').length, active: mt.filter(t=>t.status!=='done').length };
    }).sort((a,b) => b.total - a.total);

    const maxTasks = Math.max(...memberWork.map(m => m.total), 1);

    const pageSubtitle = isStandardUser
      ? `Personal performance and assigned task execution analytics for ${currentUser ? currentUser.name : 'You'}`
      : 'Project intelligence and task execution analytics across portfolio';

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Reports & Analytics</h1>
          <p>${pageSubtitle}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="reports-create-btn" onclick="ReportsScreen.openCreateReportModal()">
            ${Icons.plus} Create Report
          </button>
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
          ${isStandardUser ? `
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
        <div class="section-card-header"><h3>${Icons.barChart} ${isStandardUser ? 'My Projects Overview' : 'Project Details'}</h3></div>
        <div class="section-card-body no-pad">
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Project</th><th>Type</th><th>Status</th><th>Progress</th><th>Tasks</th><th>Issues</th><th>Team</th></tr></thead>
              <tbody>${projects.map(p => {
                const pt = Store.getTasks(p.id);
                const pi = Store.getIssues(p.id);
                const projectTasks = isStandardUser ? pt.filter(isUserTask) : pt;
                const projectIssues = isStandardUser ? pi.filter(i => isUserTask({ assigneeId: i.assigneeId })) : pi;
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
  },

  // ─── Custom Report Builder Modal ───
  openCreateReportModal() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const assignees = Store.getAssignees();

    const todayStr = new Date().toISOString().split('T')[0];
    const defaultTitle = `${isAdmin ? 'Portfolio' : (currentUser ? currentUser.name : 'Personal')} Performance & Workload Report`;

    const body = `
      <form id="custom-report-form" onsubmit="event.preventDefault(); ReportsScreen.submitCustomReport();">
        
        <!-- Report Title -->
        <div class="form-group" style="margin-bottom:16px;">
          <label class="form-label" style="font-weight:600;color:var(--color-text-primary);">Report Title *</label>
          <input type="text" class="form-input" id="report-title-input" value="${defaultTitle}" placeholder="Enter report title (e.g. Q3 Sprint Workload Summary)" required>
          <div class="form-error" id="report-title-error" style="color:var(--color-error-500);font-size:12px;margin-top:4px;"></div>
        </div>

        <!-- Date Range Selector -->
        <div class="form-group" style="margin-bottom:16px;">
          <label class="form-label" style="font-weight:600;color:var(--color-text-primary);">Date Range</label>
          <select class="form-select" id="report-daterange-select" onchange="ReportsScreen.onDateRangeChange(this.value)">
            <option value="this-month" selected>This Month (${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})</option>
            <option value="last-7-days">Last 7 Days</option>
            <option value="last-30-days">Last 30 Days</option>
            <option value="this-quarter">This Quarter</option>
            <option value="all-time">All Time</option>
            <option value="custom">Custom Date Range...</option>
          </select>
        </div>

        <!-- Custom Date Range Inputs (hidden by default) -->
        <div id="report-custom-date-container" class="form-row" style="display:none;margin-bottom:16px;gap:12px;">
          <div class="form-group" style="flex:1;margin-bottom:0;">
            <label class="form-label">Start Date</label>
            <input type="date" class="form-input" id="report-start-date" value="${todayStr}">
          </div>
          <div class="form-group" style="flex:1;margin-bottom:0;">
            <label class="form-label">End Date</label>
            <input type="date" class="form-input" id="report-end-date" value="${todayStr}">
          </div>
        </div>

        <!-- Scope & Employee Selection (RBAC Enforced) -->
        <div class="form-group" style="margin-bottom:18px;border-top:1px solid var(--color-border);padding-top:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <label class="form-label" style="font-weight:600;color:var(--color-text-primary);margin-bottom:0;">
              Employee Scope (RBAC)
            </label>
            <span class="badge ${isAdmin ? 'badge-primary' : 'badge-neutral'}" style="font-size:11px;">
              ${isAdmin ? 'Admin Full Access' : 'Personal Scope Locked'}
            </span>
          </div>

          ${isAdmin ? `
            <!-- Admin Scope Selector -->
            <div class="report-scope-admin-options" style="display:flex;flex-direction:column;gap:10px;">
              
              <!-- Option 1: All Employees -->
              <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--color-border);border-radius:8px;cursor:pointer;background:var(--color-surface);transition:all 0.15s;" id="scope-opt-all-label">
                <input type="radio" name="report-scope-type" value="all" checked onchange="ReportsScreen.onScopeTypeChange('all')" style="accent-color:var(--color-primary);width:16px;height:16px;">
                <div style="flex:1;">
                  <div style="font-size:13.5px;font-weight:600;color:var(--color-text-primary);">All Employees</div>
                  <div style="font-size:12px;color:var(--color-text-muted);">Aggregated company-wide report across all team members and projects</div>
                </div>
              </label>

              <!-- Option 2: Individual Employee -->
              <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--color-border);border-radius:8px;cursor:pointer;background:var(--color-surface);transition:all 0.15s;" id="scope-opt-ind-label">
                <input type="radio" name="report-scope-type" value="individual" onchange="ReportsScreen.onScopeTypeChange('individual')" style="accent-color:var(--color-primary);width:16px;height:16px;">
                <div style="flex:1;">
                  <div style="font-size:13.5px;font-weight:600;color:var(--color-text-primary);">Individual Employee</div>
                  <div style="font-size:12px;color:var(--color-text-muted);">Deep-dive performance report for a single teammate</div>
                </div>
              </label>
              
              <!-- Individual Employee Picker Container -->
              <div id="scope-individual-picker-wrap" style="display:none;padding:10px 14px;background:var(--color-surface-subtle);border-radius:8px;border:1px solid var(--color-border-subtle);margin-left:26px;">
                <label class="form-label" style="font-size:12px;font-weight:600;margin-bottom:6px;">Select Teammate:</label>
                <select class="form-select" id="report-individual-member-select">
                  ${assignees.map(m => `<option value="${m.id}">${m.name} (${m.role || m.designation})</option>`).join('')}
                </select>
              </div>

              <!-- Option 3: Custom Multi-Employee Group -->
              <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--color-border);border-radius:8px;cursor:pointer;background:var(--color-surface);transition:all 0.15s;" id="scope-opt-grp-label">
                <input type="radio" name="report-scope-type" value="group" onchange="ReportsScreen.onScopeTypeChange('group')" style="accent-color:var(--color-primary);width:16px;height:16px;">
                <div style="flex:1;">
                  <div style="font-size:13.5px;font-weight:600;color:var(--color-text-primary);">Custom Multi-Employee Group</div>
                  <div style="font-size:12px;color:var(--color-text-muted);">Compare or combine metrics for a custom squad/team (e.g. Preet + Hirvi)</div>
                </div>
              </label>

              <!-- Group Multi-select Pills Container -->
              <div id="scope-group-picker-wrap" style="display:none;padding:12px 14px;background:var(--color-surface-subtle);border-radius:8px;border:1px solid var(--color-border-subtle);margin-left:26px;">
                <div style="font-size:12px;font-weight:600;margin-bottom:8px;color:var(--color-text-secondary);">Select Teammates to include:</div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;" id="scope-group-pills">
                  ${assignees.map((m, idx) => `
                    <label style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--color-border);border-radius:20px;cursor:pointer;font-size:12.5px;background:var(--color-surface);user-select:none;transition:all 0.15s;" class="group-member-pill-label">
                      <input type="checkbox" value="${m.id}" class="report-group-member-cb" ${idx < 2 ? 'checked' : ''} onchange="ReportsScreen.updateGroupPillStyle(this)" style="width:14px;height:14px;accent-color:var(--color-primary);">
                      <div class="avatar avatar-xs" style="background:${m.color};width:18px;height:18px;font-size:9px;">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                      <span style="font-weight:500;">${m.name}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

            </div>
          ` : `
            <!-- Standard User Locked Scope Box -->
            <div style="padding:14px 16px;background:var(--color-surface-subtle);border-radius:8px;border:1px solid var(--color-border-subtle);display:flex;align-items:flex-start;gap:12px;">
              <div style="width:36px;height:36px;border-radius:8px;background:var(--color-primary-50);color:var(--color-primary);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg style="width:18px;height:18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                  <span style="font-size:14px;font-weight:700;color:var(--color-text-primary);">My Data Only</span>
                  <span class="badge badge-primary" style="font-size:11px;">${currentUser ? currentUser.name : 'You'} (${currentUser ? currentUser.role : 'AI Developer'})</span>
                </div>
                <div style="font-size:12.5px;color:var(--color-text-muted);line-height:1.4;">
                  Standard user access is locked to your personal activity, execution throughput, and assigned task deliverables.
                </div>
              </div>
            </div>
          `}
        </div>

        <!-- Metric Options -->
        <div class="form-group" style="margin-bottom:14px;border-top:1px solid var(--color-border);padding-top:14px;">
          <label class="form-label" style="font-weight:600;color:var(--color-text-primary);margin-bottom:8px;">Metrics to Include</label>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:10px;">
            
            <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--color-border);border-radius:6px;cursor:pointer;background:var(--color-surface);font-size:13px;user-select:none;">
              <input type="checkbox" id="metric-velocity" checked style="width:16px;height:16px;accent-color:var(--color-primary);">
              <span style="font-weight:500;">Task Velocity & Throughput</span>
            </label>

            <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--color-border);border-radius:6px;cursor:pointer;background:var(--color-surface);font-size:13px;user-select:none;">
              <input type="checkbox" id="metric-completion" checked style="width:16px;height:16px;accent-color:var(--color-primary);">
              <span style="font-weight:500;">Completion Rate (%)</span>
            </label>

            <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--color-border);border-radius:6px;cursor:pointer;background:var(--color-surface);font-size:13px;user-select:none;">
              <input type="checkbox" id="metric-workload" checked style="width:16px;height:16px;accent-color:var(--color-primary);">
              <span style="font-weight:500;">Workload Distribution</span>
            </label>

            <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--color-border);border-radius:6px;cursor:pointer;background:var(--color-surface);font-size:13px;user-select:none;">
              <input type="checkbox" id="metric-overdue" checked style="width:16px;height:16px;accent-color:var(--color-primary);">
              <span style="font-weight:500;">Overdue Items & Blockers</span>
            </label>

            <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--color-border);border-radius:6px;cursor:pointer;background:var(--color-surface);font-size:13px;user-select:none;">
              <input type="checkbox" id="metric-milestones" checked style="width:16px;height:16px;accent-color:var(--color-primary);">
              <span style="font-weight:500;">Project Milestones Progress</span>
            </label>

            <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--color-border);border-radius:6px;cursor:pointer;background:var(--color-surface);font-size:13px;user-select:none;">
              <input type="checkbox" id="metric-priority" checked style="width:16px;height:16px;accent-color:var(--color-primary);">
              <span style="font-weight:500;">Priority Breakdown</span>
            </label>

          </div>
        </div>

      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" id="btn-generate-report" onclick="ReportsScreen.submitCustomReport()">
        ${Icons.barChart} Generate Report
      </button>
    `;

    Modal.open('Custom Report Builder', body, footer, { large: true });
  },

  onDateRangeChange(val) {
    const customWrap = document.getElementById('report-custom-date-container');
    if (customWrap) {
      customWrap.style.display = val === 'custom' ? 'flex' : 'none';
    }
  },

  onScopeTypeChange(type) {
    const indWrap = document.getElementById('scope-individual-picker-wrap');
    const grpWrap = document.getElementById('scope-group-picker-wrap');
    if (indWrap) indWrap.style.display = type === 'individual' ? 'block' : 'none';
    if (grpWrap) grpWrap.style.display = type === 'group' ? 'block' : 'none';
  },

  updateGroupPillStyle(checkbox) {
    const label = checkbox.closest('label');
    if (label) {
      if (checkbox.checked) {
        label.style.borderColor = 'var(--color-primary)';
        label.style.background = 'var(--color-primary-50)';
      } else {
        label.style.borderColor = 'var(--color-border)';
        label.style.background = 'var(--color-surface)';
      }
    }
  },

  submitCustomReport() {
    const titleInput = document.getElementById('report-title-input');
    const title = titleInput?.value?.trim() || 'Custom Report';
    if (!title) {
      const errEl = document.getElementById('report-title-error');
      if (errEl) errEl.textContent = 'Report title is required';
      if (titleInput) titleInput.focus();
      return;
    }

    const dateRange = document.getElementById('report-daterange-select')?.value || 'this-month';
    const startDate = document.getElementById('report-start-date')?.value || '';
    const endDate = document.getElementById('report-end-date')?.value || '';

    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';

    let scopeType = 'my';
    let targetMemberIds = [];
    let scopeLabel = '';

    if (isAdmin) {
      const scopeRadio = document.querySelector('input[name="report-scope-type"]:checked');
      scopeType = scopeRadio ? scopeRadio.value : 'all';

      if (scopeType === 'all') {
        scopeLabel = 'All Employees (Company-wide)';
        targetMemberIds = Store.getAssignees().map(m => m.id);
      } else if (scopeType === 'individual') {
        const selMemberId = document.getElementById('report-individual-member-select')?.value || '';
        const member = Store.getMember(selMemberId);
        scopeLabel = member ? `${member.name} (${member.designation || member.role})` : 'Individual Teammate';
        targetMemberIds = selMemberId ? [selMemberId] : [];
      } else if (scopeType === 'group') {
        const checkedBoxes = document.querySelectorAll('.report-group-member-cb:checked');
        targetMemberIds = Array.from(checkedBoxes).map(cb => cb.value);
        if (targetMemberIds.length === 0) {
          Toast.show('Please select at least one teammate for the group report', 'error');
          return;
        }
        const names = targetMemberIds.map(id => Store.getMember(id)?.name).filter(Boolean);
        scopeLabel = `Custom Squad (${names.join(' + ')})`;
      }
    } else {
      scopeType = 'my';
      const myId = currentUser?.memberId || (currentUser?.id === 'preet' ? 'm2' : currentUser?.id === 'mohit' ? 'm3' : currentUser?.id === 'hirvi' ? 'm4' : currentUser?.id);
      targetMemberIds = [myId];
      scopeLabel = `${currentUser ? currentUser.name : 'You'} (Personal Activity)`;
    }

    const metrics = {
      velocity: document.getElementById('metric-velocity')?.checked ?? true,
      completion: document.getElementById('metric-completion')?.checked ?? true,
      workload: document.getElementById('metric-workload')?.checked ?? true,
      overdue: document.getElementById('metric-overdue')?.checked ?? true,
      milestones: document.getElementById('metric-milestones')?.checked ?? true,
      priority: document.getElementById('metric-priority')?.checked ?? true
    };

    // Calculate Report Data
    const reportData = this._calculateReportData({
      title,
      dateRange,
      startDate,
      endDate,
      scopeType,
      scopeLabel,
      targetMemberIds,
      metrics,
      isAdmin,
      currentUser
    });

    this._lastReport = reportData;
    this.showGeneratedReportModal(reportData);
  },

  _calculateReportData(config) {
    const allTasks = Store.getTasks().filter(t => !t.isPersonal);
    const allMilestones = Store.getMilestones ? Store.getMilestones() : [];
    const allProjects = Store.getProjects();

    // 1. Filter Tasks by Employee Scope
    let tasks = allTasks;
    if (config.scopeType === 'my') {
      tasks = allTasks.filter(t => this._isUserTask(t, config.currentUser));
    } else if (config.scopeType === 'individual' || config.scopeType === 'group') {
      tasks = allTasks.filter(t => {
        const ids = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
        return ids.some(id => config.targetMemberIds.includes(id));
      });
    }

    // 2. Filter Tasks by Date Range if specified
    const now = new Date();
    if (config.dateRange === 'last-7-days') {
      const cut = new Date(now.getTime() - 7 * 86400000);
      tasks = tasks.filter(t => !t.createdAt || new Date(t.createdAt) >= cut || (t.dueDate && new Date(t.dueDate) >= cut));
    } else if (config.dateRange === 'this-month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      tasks = tasks.filter(t => !t.createdAt || new Date(t.createdAt) >= startOfMonth || (t.dueDate && new Date(t.dueDate) >= startOfMonth));
    } else if (config.dateRange === 'last-30-days') {
      const cut = new Date(now.getTime() - 30 * 86400000);
      tasks = tasks.filter(t => !t.createdAt || new Date(t.createdAt) >= cut || (t.dueDate && new Date(t.dueDate) >= cut));
    } else if (config.dateRange === 'custom' && config.startDate && config.endDate) {
      const start = new Date(config.startDate);
      const end = new Date(config.endDate + 'T23:59:59');
      tasks = tasks.filter(t => {
        const d = t.dueDate ? new Date(t.dueDate) : (t.createdAt ? new Date(t.createdAt) : null);
        return d ? (d >= start && d <= end) : true;
      });
    }

    // 3. Compute Metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const reviewTasks = tasks.filter(t => t.status === 'review').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;
    const activeTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate && (typeof Utils !== 'undefined' ? Utils.isOverdue(t.dueDate) : new Date(t.dueDate) < now)).length;

    // Task velocity: completed count / period weight
    const velocity = completedTasks;

    // Priority breakdown
    const priorityCounts = { high: 0, medium: 0, low: 0 };
    tasks.forEach(t => { if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++; });

    // Workload breakdown by member
    const memberBreakdown = config.targetMemberIds.map(mId => {
      const member = Store.getMember(mId) || { name: mId, color: '#4F46E5', role: 'Member' };
      const mTasks = tasks.filter(t => {
        const ids = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
        return ids.includes(mId) || (mId === 'm2' && ids.includes('preet')) || (mId === 'm3' && ids.includes('mohit')) || (mId === 'm4' && ids.includes('hirvi'));
      });
      const mDone = mTasks.filter(t => t.status === 'done').length;
      return {
        id: mId,
        name: member.name,
        color: member.color || '#2563EB',
        role: member.role || member.designation || 'Teammate',
        total: mTasks.length,
        done: mDone,
        active: mTasks.length - mDone,
        rate: mTasks.length > 0 ? Math.round((mDone / mTasks.length) * 100) : 0
      };
    }).sort((a, b) => b.total - a.total);

    // Milestones scope
    let milestones = allMilestones;
    if (config.scopeType === 'my') {
      milestones = allMilestones.filter(m => m.assigneeId === config.currentUser?.id || (config.currentUser?.memberId && m.assigneeId === config.currentUser.memberId));
    }
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;

    return {
      ...config,
      generatedAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      totalTasks,
      completedTasks,
      inProgressTasks,
      reviewTasks,
      todoTasks,
      activeTasks,
      completionRate,
      overdueTasks,
      velocity,
      priorityCounts,
      memberBreakdown,
      milestones,
      completedMilestones,
      tasks
    };
  },

  showGeneratedReportModal(report) {
    const { title, scopeLabel, dateRange, generatedAt, metrics, completionRate, velocity, overdueTasks, totalTasks, completedTasks, activeTasks, priorityCounts, memberBreakdown, tasks } = report;

    const body = `
      <div class="custom-report-output-container" id="printable-report-content">
        
        <!-- Header Banner -->
        <div class="report-header-banner">
          <div>
            <div class="report-title-row">
              <h2>${Utils.escapeHtml(title)}</h2>
              <span class="badge badge-primary" style="font-size:11px;">Custom Report</span>
            </div>
            <div class="report-meta-row">
              <span><strong>Scope:</strong> ${Utils.escapeHtml(scopeLabel)}</span>
              <span>•</span>
              <span><strong>Period:</strong> ${Utils.humanize(dateRange)}</span>
              <span>•</span>
              <span><strong>Generated:</strong> ${generatedAt}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;" class="no-print">
            <button class="btn btn-secondary btn-sm" onclick="ReportsScreen.exportCSV()">
              <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
            <button class="btn btn-primary btn-sm" onclick="ReportsScreen.printReport()">
              <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print / PDF
            </button>
          </div>
        </div>

        <!-- Summary KPI Metric Cards -->
        <div class="report-kpi-grid">
          ${metrics.completion ? `
            <div class="report-kpi-card">
              <div class="report-kpi-card-label">Completion Rate</div>
              <div class="report-kpi-card-val" style="color:var(--color-success-600);">${completionRate}%</div>
              <div class="report-kpi-card-sub">${completedTasks}/${totalTasks} Tasks</div>
            </div>
          ` : ''}

          ${metrics.velocity ? `
            <div class="report-kpi-card">
              <div class="report-kpi-card-label">Task Velocity</div>
              <div class="report-kpi-card-val" style="color:var(--color-primary);">${velocity} <span style="font-size:12px;font-weight:normal;">closed</span></div>
              <div class="report-kpi-card-sub">in period</div>
            </div>
          ` : ''}

          ${metrics.overdue ? `
            <div class="report-kpi-card">
              <div class="report-kpi-card-label">Overdue Items</div>
              <div class="report-kpi-card-val" style="color:${overdueTasks > 0 ? '#DC2626' : 'var(--color-text-primary)'};">${overdueTasks}</div>
              <div class="report-kpi-card-sub" style="color:${overdueTasks > 0 ? '#DC2626' : 'var(--color-text-muted)'};">${overdueTasks > 0 ? 'Requires attention' : 'All on track'}</div>
            </div>
          ` : ''}

          <div class="report-kpi-card">
            <div class="report-kpi-card-label">Active Workload</div>
            <div class="report-kpi-card-val" style="color:var(--color-ai);">${activeTasks}</div>
            <div class="report-kpi-card-sub">In flight items</div>
          </div>
        </div>

        <!-- Performance Breakdown Charts / Visuals -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;">
          
          <!-- Task Status Breakdown -->
          <div class="report-section-card" style="padding:16px;">
            <div style="margin-bottom:12px;">
              <div class="report-section-title">
                <span class="report-icon-badge blue">${Icons.checkSquare}</span>
                Task Status Distribution
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${[
                { label: 'Done', count: completedTasks, color: '#16A34A' },
                { label: 'In Progress', count: report.inProgressTasks, color: '#2563EB' },
                { label: 'Review', count: report.reviewTasks, color: '#8B2CF5' },
                { label: 'To Do', count: report.todoTasks, color: '#94A3B8' }
              ].map(st => {
                const pct = totalTasks > 0 ? Math.round((st.count / totalTasks) * 100) : 0;
                return `
                  <div>
                    <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:4px;">
                      <span>${st.label}</span>
                      <span>${st.count} (${pct}%)</span>
                    </div>
                    <div style="width:100%;height:7px;background:var(--color-surface-subtle);border-radius:4px;overflow:hidden;">
                      <div style="width:${pct}%;height:100%;background:${st.color};border-radius:4px;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Priority Breakdown -->
          ${metrics.priority ? `
            <div class="report-section-card" style="padding:16px;">
              <div style="margin-bottom:12px;">
                <div class="report-section-title">
                  <span class="report-icon-badge red">${Icons.target}</span>
                  Priority Breakdown
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:10px;">
                ${[
                  { label: 'High Priority', count: priorityCounts.high, color: '#DC2626' },
                  { label: 'Medium Priority', count: priorityCounts.medium, color: '#2563EB' },
                  { label: 'Low Priority', count: priorityCounts.low, color: '#94A3B8' }
                ].map(p => {
                  const pct = totalTasks > 0 ? Math.round((p.count / totalTasks) * 100) : 0;
                  return `
                    <div>
                      <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:4px;">
                        <span>${p.label}</span>
                        <span>${p.count} (${pct}%)</span>
                      </div>
                      <div style="width:100%;height:7px;background:var(--color-surface-subtle);border-radius:4px;overflow:hidden;">
                        <div style="width:${pct}%;height:100%;background:${p.color};border-radius:4px;"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

        </div>

        <!-- Workload Distribution Table (if multiple members or workload metric active) -->
        ${metrics.workload && memberBreakdown.length > 0 ? `
          <div class="report-section-card">
            <div class="report-section-card-header">
              <div class="report-section-title">
                <span class="report-icon-badge purple">${Icons.users}</span>
                Workload Distribution by Teammate
              </div>
            </div>
            <div class="table-wrap no-pad">
              <table class="table">
                <thead>
                  <tr>
                    <th>Teammate</th>
                    <th>Role</th>
                    <th>Tasks (Done / Total)</th>
                    <th>Completion %</th>
                  </tr>
                </thead>
                <tbody>
                  ${memberBreakdown.map(m => `
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                          <div class="avatar avatar-xs" style="background:${m.color};">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                          <span style="font-weight:600;font-size:13px;">${m.name}</span>
                        </div>
                      </td>
                      <td style="font-size:12px;color:var(--color-text-muted);">${m.role}</td>
                      <td style="font-size:12.5px;font-weight:600;">${m.done} / ${m.total}</td>
                      <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                          <div class="progress-bar progress-blue" style="width:70px;height:6px;">
                            <div class="progress-bar-fill" style="width:${m.rate}%;"></div>
                          </div>
                          <span style="font-size:12px;font-weight:700;">${m.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- Filtered Tasks Table -->
        <div class="report-section-card">
          <div class="report-section-card-header">
            <div class="report-section-title">
              <span class="report-icon-badge sky">${Icons.checkSquare}</span>
              Scoped Tasks (${tasks.length})
            </div>
            <span style="font-size:11px;color:var(--color-text-muted);font-weight:normal;">Strictly filtered by selected employee scope</span>
          </div>
          <div class="table-wrap no-pad" style="max-height:260px;overflow-y:auto;">
            <table class="table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                ${tasks.length === 0 ? `
                  <tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);padding:16px;">No tasks found in this scope/period.</td></tr>
                ` : tasks.map(t => {
                  const proj = Store.getProject(t.projectId);
                  const mem = Store.getMember(t.assigneeId);
                  return `
                    <tr>
                      <td style="font-weight:600;font-size:13px;">${Utils.escapeHtml(t.title)}</td>
                      <td style="font-size:12px;color:var(--color-text-muted);">${proj ? proj.name : '—'}</td>
                      <td style="font-size:12px;">${mem ? mem.name : 'Unassigned'}</td>
                      <td><span class="badge badge-${t.priority}" style="font-size:10.5px;">${Utils.humanize(t.priority)}</span></td>
                      <td><span class="badge badge-${t.status}" style="font-size:10.5px;">${Utils.humanize(t.status)}</span></td>
                      <td style="font-size:12px;color:var(--color-text-muted);">${t.dueDate ? Utils.formatDate(t.dueDate) : '—'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="ReportsScreen.openCreateReportModal()">${Icons.edit} Configure Filters</button>
      <button class="btn btn-primary" onclick="Modal.closeAll()">Done</button>
    `;

    Modal.open(title, body, footer, { large: true });
  },

  exportCSV() {
    if (!this._lastReport) {
      Toast.show('No report data to export', 'error');
      return;
    }
    const r = this._lastReport;

    const rows = [];
    rows.push(['HINTONN PMO ENTERPRISE REPORT']);
    rows.push(['Report Title', r.title]);
    rows.push(['Scope', r.scopeLabel]);
    rows.push(['Date Range', r.dateRange]);
    rows.push(['Generated At', r.generatedAt]);
    rows.push([]);
    rows.push(['METRICS SUMMARY']);
    rows.push(['Total Tasks', r.totalTasks]);
    rows.push(['Completed Tasks', r.completedTasks]);
    rows.push(['Active Tasks', r.activeTasks]);
    rows.push(['Completion Rate (%)', r.completionRate + '%']);
    rows.push(['Overdue Tasks', r.overdueTasks]);
    rows.push([]);
    rows.push(['WORKLOAD BREAKDOWN']);
    rows.push(['Teammate', 'Role', 'Completed', 'Total', 'Completion Rate']);
    r.memberBreakdown.forEach(m => {
      rows.push([m.name, m.role, m.done, m.total, m.rate + '%']);
    });
    rows.push([]);
    rows.push(['SCOPED TASKS LIST']);
    rows.push(['Task ID', 'Title', 'Project ID', 'Assignee ID', 'Priority', 'Status', 'Due Date']);
    r.tasks.forEach(t => {
      rows.push([t.id, t.title, t.projectId || '', t.assigneeId || '', t.priority, t.status, t.dueDate || '']);
    });

    const csvContent = '\uFEFF' + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${r.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Toast.show('Report exported to CSV successfully');
  },

  printReport() {
    window.print();
  }
};
