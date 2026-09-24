// ─── Timeline / Gantt Screen ───
const TimelineScreen = {
  _scale: 'month', // 'month' | 'week' | 'day'
  _filter: { project: '', status: '', assignee: '', search: '' },
  _collapsedProjects: {},

  toggleProject(projectId) {
    this._collapsedProjects[projectId] = !this._collapsedProjects[projectId];
    this.refresh();
  },

  setFilter(key, value) {
    this._filter[key] = value;
    this.refresh();
  },

  setScale(scale) {
    this._scale = scale;
    this.refresh();
  },

  scrollToToday() {
    const todayEl = document.getElementById('timeline-today-indicator');
    const scrollContainer = document.getElementById('timeline-scroll-container');
    if (todayEl && scrollContainer) {
      const containerWidth = scrollContainer.clientWidth;
      const todayLeft = todayEl.offsetLeft;
      scrollContainer.scrollTo({ left: todayLeft - (containerWidth / 2), behavior: 'smooth' });
    }
  },

  refresh() {
    const content = document.getElementById('page-content');
    if (content && App.currentScreen === 'timeline') {
      content.innerHTML = this.render();
      setTimeout(() => this.scrollToToday(), 50);
    }
  },

  _parseDate(dStr) {
    if (!dStr) return null;
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date(dStr);
  },

  _formatDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  render() {
    let projects = Store.getProjects();
    const allTasks = Store.getTasks();
    const allMilestones = Store.getMilestones();
    const members = Store.getMembers();

    // Filters
    if (this._filter.project) {
      projects = projects.filter(p => p.id === this._filter.project);
    }
    if (this._filter.search) {
      const q = this._filter.search.toLowerCase();
      projects = projects.filter(p => {
        const matchesName = p.name.toLowerCase().includes(q);
        const pTasks = allTasks.filter(t => t.projectId === p.id);
        const matchesTask = pTasks.some(t => t.title.toLowerCase().includes(q));
        return matchesName || matchesTask;
      });
    }

    // Determine Timeline Global Date Range
    let minDate = new Date(2026, 4, 1); // Default May 2026
    let maxDate = new Date(2027, 1, 28); // Default Feb 2027

    projects.forEach(p => {
      if (p.startDate) {
        const d = this._parseDate(p.startDate);
        if (d && d < minDate) minDate = new Date(d.getFullYear(), d.getMonth(), 1);
      }
      if (p.endDate) {
        const d = this._parseDate(p.endDate);
        if (d && d > maxDate) maxDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      }
      const pTasks = allTasks.filter(t => t.projectId === p.id);
      pTasks.forEach(t => {
        if (t.startDate) {
          const d = this._parseDate(t.startDate);
          if (d && d < minDate) minDate = new Date(d.getFullYear(), d.getMonth(), 1);
        }
        if (t.dueDate) {
          const d = this._parseDate(t.dueDate);
          if (d && d > maxDate) maxDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        }
      });
    });

    // Ensure range padding
    minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0);

    const totalDays = Math.max(30, Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)));
    
    // Scale settings: column width per unit
    let dayWidth = 24; // px per day in month view
    if (this._scale === 'week') dayWidth = 40;
    if (this._scale === 'day') dayWidth = 64;

    const timelineTotalWidth = Math.max(900, totalDays * dayWidth);

    // Build timeline columns/headers
    const today = new Date();
    const todayOffsetDays = (today - minDate) / (1000 * 60 * 60 * 24);
    const todayLeftPx = Math.max(0, Math.min(timelineTotalWidth, todayOffsetDays * dayWidth));
    const showToday = todayOffsetDays >= 0 && todayOffsetDays <= totalDays;

    // Header intervals
    const headerIntervals = [];
    const curr = new Date(minDate);
    while (curr <= maxDate) {
      const mName = curr.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const year = curr.getFullYear();
      const month = curr.getMonth();
      const nextMonth = new Date(year, month + 1, 1);
      const daysInMonth = Math.round((nextMonth - curr) / (1000 * 60 * 60 * 24));
      const width = daysInMonth * dayWidth;
      
      headerIntervals.push({
        label: mName,
        month,
        year,
        width,
        daysInMonth
      });
      curr.setMonth(curr.getMonth() + 1);
    }

    return `
      <div class="page-header" style="margin-bottom:20px">
        <div class="page-header-left">
          <h1>Timeline & Gantt</h1>
          <p>Visual project schedules, task durations, and key milestones</p>
        </div>
        <div class="page-header-actions">
          <div class="timeline-scale-selector">
            <button class="btn btn-sm ${this._scale==='month'?'btn-primary':'btn-secondary'}" onclick="TimelineScreen.setScale('month')">Month</button>
            <button class="btn btn-sm ${this._scale==='week'?'btn-primary':'btn-secondary'}" onclick="TimelineScreen.setScale('week')">Week</button>
            <button class="btn btn-sm ${this._scale==='day'?'btn-primary':'btn-secondary'}" onclick="TimelineScreen.setScale('day')">Day</button>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="TimelineScreen.scrollToToday()">
            ${Icons.target} Jump to Today
          </button>
          <button class="btn btn-primary btn-sm" onclick="TasksScreen.openCreateModal()">
            ${Icons.plus} New Task
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar" style="margin-bottom:16px">
        <input type="text" class="form-input search-input" placeholder="Search timeline..." value="${this._filter.search}" oninput="TimelineScreen.setFilter('search', this.value)">
        <select class="form-select" style="width:160px" onchange="TimelineScreen.setFilter('project', this.value)">
          <option value="">All Projects</option>
          ${Store.getProjects().map(p => `<option value="${p.id}" ${this._filter.project===p.id?'selected':''}>${p.name}</option>`).join('')}
        </select>
        <select class="form-select" style="width:130px" onchange="TimelineScreen.setFilter('status', this.value)">
          <option value="">All Status</option>
          <option value="in-progress" ${this._filter.status==='in-progress'?'selected':''}>In Progress</option>
          <option value="todo" ${this._filter.status==='todo'?'selected':''}>To Do</option>
          <option value="review" ${this._filter.status==='review'?'selected':''}>Review</option>
          <option value="done" ${this._filter.status==='done'?'selected':''}>Done</option>
        </select>
        <select class="form-select" style="width:150px" onchange="TimelineScreen.setFilter('assignee', this.value)">
          <option value="">All Assignees</option>
          ${members.map(m => `<option value="${m.id}" ${this._filter.assignee===m.id?'selected':''}>${m.name}</option>`).join('')}
        </select>
      </div>

      <!-- Gantt Main Container -->
      <div class="timeline-container">
        <!-- Sticky Sidebar Header & Rows -->
        <div class="timeline-sidebar">
          <div class="timeline-sidebar-header">
            <span>Project / Task / Milestone</span>
          </div>
          <div class="timeline-sidebar-body">
            ${projects.map(p => {
              const isCollapsed = !!this._collapsedProjects[p.id];
              let pTasks = allTasks.filter(t => t.projectId === p.id);
              if (this._filter.status) pTasks = pTasks.filter(t => t.status === this._filter.status);
              if (this._filter.assignee) pTasks = pTasks.filter(t => t.assigneeId === this._filter.assignee);
              const pMilestones = allMilestones.filter(m => m.projectId === p.id);

              return `
                <div class="timeline-row timeline-row-project">
                  <button class="timeline-collapse-btn" onclick="TimelineScreen.toggleProject('${p.id}')">
                    ${isCollapsed ? Icons.chevronRight : Icons.chevronDown}
                  </button>
                  <span class="timeline-project-title" onclick="App.navigate('project-detail','${p.id}')" title="${p.name}">
                    ${p.name}
                  </span>
                  <span class="timeline-badge">${p.progress}%</span>
                </div>
                ${!isCollapsed ? `
                  ${pTasks.map(t => {
                    const m = Store.getMember(t.assigneeId);
                    return `
                      <div class="timeline-row timeline-row-task" onclick="TasksScreen.openDetailModal('${t.id}')">
                        <span class="timeline-tree-branch">├─</span>
                        <span class="priority-dot priority-${t.priority}"></span>
                        <span class="timeline-task-title" title="${t.title}">${t.title}</span>
                        ${m ? `<div class="avatar avatar-sm" style="background:${m.color};width:20px;height:20px;font-size:9px" title="${m.name}">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>` : ''}
                      </div>
                    `;
                  }).join('')}
                  ${pMilestones.map(ms => `
                    <div class="timeline-row timeline-row-milestone" onclick="App.navigate('milestones')">
                      <span class="timeline-tree-branch">└─</span>
                      <span style="color:var(--color-ai-600);font-size:12px">◆</span>
                      <span class="timeline-milestone-title" title="${ms.name}">Milestone: ${ms.name}</span>
                    </div>
                  `).join('')}
                ` : ''}
              `;
            }).join('') || '<div style="padding:24px;color:var(--color-text-muted);font-size:13px">No projects match filters</div>'}
          </div>
        </div>

        <!-- Scrollable Gantt Chart Canvas -->
        <div class="timeline-chart-scroll" id="timeline-scroll-container">
          <div class="timeline-chart-canvas" style="width:${timelineTotalWidth}px">
            
            <!-- Timeline Header Axis -->
            <div class="timeline-axis-header">
              ${headerIntervals.map(h => `
                <div class="timeline-axis-cell" style="width:${h.width}px">
                  <span class="timeline-axis-label">${h.label}</span>
                </div>
              `).join('')}
            </div>

            <!-- Today Vertical Marker Line -->
            ${showToday ? `
              <div class="timeline-today-line" id="timeline-today-indicator" style="left:${todayLeftPx}px">
                <div class="timeline-today-tag">Today</div>
              </div>
            ` : ''}

            <!-- Background Grid Column Guides -->
            <div class="timeline-grid-bg">
              ${headerIntervals.map(h => `
                <div class="timeline-grid-col" style="width:${h.width}px"></div>
              `).join('')}
            </div>

            <!-- Gantt Data Rows -->
            <div class="timeline-chart-body">
              ${projects.map(p => {
                const isCollapsed = !!this._collapsedProjects[p.id];
                let pTasks = allTasks.filter(t => t.projectId === p.id);
                if (this._filter.status) pTasks = pTasks.filter(t => t.status === this._filter.status);
                if (this._filter.assignee) pTasks = pTasks.filter(t => t.assigneeId === this._filter.assignee);
                const pMilestones = allMilestones.filter(m => m.projectId === p.id);

                // Project Bar Span
                const pStart = this._parseDate(p.startDate || '2026-07-01');
                const pEnd = this._parseDate(p.endDate || '2026-12-31');
                const pOffsetDays = Math.max(0, (pStart - minDate) / (1000 * 60 * 60 * 24));
                const pDurationDays = Math.max(5, (pEnd - pStart) / (1000 * 60 * 60 * 24));
                const pLeft = pOffsetDays * dayWidth;
                const pWidth = Math.max(40, pDurationDays * dayWidth);

                return `
                  <div class="timeline-chart-row timeline-chart-row-project">
                    <div class="timeline-bar timeline-bar-project" style="left:${pLeft}px;width:${pWidth}px" onclick="App.navigate('project-detail','${p.id}')">
                      <div class="timeline-bar-fill" style="width:${p.progress}%"></div>
                      <span class="timeline-bar-text">${p.name} · ${p.progress}%</span>
                    </div>
                  </div>

                  ${!isCollapsed ? `
                    ${pTasks.map(t => {
                      const tStart = this._parseDate(t.startDate || t.createdAt.split('T')[0] || '2026-08-01');
                      const tEnd = this._parseDate(t.dueDate || '2026-09-30');
                      const tOffsetDays = Math.max(0, (tStart - minDate) / (1000 * 60 * 60 * 24));
                      const tDurationDays = Math.max(2, (tEnd - tStart) / (1000 * 60 * 60 * 24));
                      const tLeft = tOffsetDays * dayWidth;
                      const tWidth = Math.max(28, tDurationDays * dayWidth);
                      const isOverdue = Utils.isOverdue(t.dueDate) && t.status !== 'done';

                      return `
                        <div class="timeline-chart-row timeline-chart-row-task">
                          <div class="timeline-bar timeline-bar-task status-${t.status} ${isOverdue?'overdue':''}" style="left:${tLeft}px;width:${tWidth}px" onclick="TasksScreen.openDetailModal('${t.id}')" title="${t.title} (${Utils.formatDate(t.startDate)} → ${Utils.formatDate(t.dueDate)})">
                            <span class="timeline-bar-title">${t.title}</span>
                          </div>
                        </div>
                      `;
                    }).join('')}

                    ${pMilestones.map(ms => {
                      const msDate = this._parseDate(ms.dueDate || '2026-10-01');
                      const msOffsetDays = Math.max(0, (msDate - minDate) / (1000 * 60 * 60 * 24));
                      const msLeft = msOffsetDays * dayWidth;

                      return `
                        <div class="timeline-chart-row timeline-chart-row-milestone">
                          <div class="timeline-milestone-marker" style="left:${msLeft}px" title="${ms.name}: ${Utils.formatDate(ms.dueDate)}">
                            <div class="timeline-diamond ${ms.status==='completed'?'completed':''}"></div>
                            <span class="timeline-milestone-tag">${ms.name}</span>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  ` : ''}
                `;
              }).join('')}
            </div>

          </div>
        </div>
      </div>
    `;
  }
};
