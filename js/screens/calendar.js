// ─── Calendar Screen ───
const CalendarScreen = {
  _year: new Date().getFullYear(),
  _month: new Date().getMonth(),

  render() {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const firstDay = new Date(this._year, this._month, 1).getDay();
    const daysInMonth = new Date(this._year, this._month + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isNonAdmin = currentUser && currentUser.role !== 'Admin';
    const userMemberId = currentUser ? (currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '')) : '';

    let tasks = Store.getTasks().filter(t => t.dueDate);
    let milestones = Store.getMilestones().filter(m => m.dueDate);

    // Strict Individual Privacy for Non-Admin Users
    if (isNonAdmin) {
      tasks = tasks.filter(task => {
        const ids = Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0 ? task.assigneeIds : (task.assigneeId ? [task.assigneeId] : []);
        return ids.some(id =>
          id === currentUser.id ||
          (userMemberId && id === userMemberId) ||
          (currentUser.id === 'preet' && (id === 'm2' || id === 'preet')) ||
          (currentUser.id === 'mohit' && (id === 'm3' || id === 'mohit')) ||
          (currentUser.id === 'hirvi' && (id === 'm4' || id === 'hirvi')) ||
          (currentUser.memberId === 'm2' && (id === 'm2' || id === 'preet')) ||
          (currentUser.memberId === 'm3' && (id === 'm3' || id === 'mohit')) ||
          (currentUser.memberId === 'm4' && (id === 'm4' || id === 'hirvi'))
        );
      });

      const myProjectIds = new Set(tasks.map(t => t.projectId));
      milestones = milestones.filter(m => myProjectIds.has(m.projectId));
    }

    let calHtml = '<div class="calendar-grid">';
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => { 
      calHtml += `<div class="calendar-header-cell">${d}</div>`; 
    });

    // Previous month fill
    const prevDays = new Date(this._year, this._month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevDayNum = prevDays - i;
      calHtml += `<div class="calendar-cell other-month"><div class="calendar-day-header"><span class="calendar-day-badge">${prevDayNum}</span></div></div>`;
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${this._year}-${String(this._month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = dateStr === todayStr;
      
      const dayTasks = tasks.filter(t => t.dueDate === dateStr);
      const dayMilestones = milestones.filter(m => m.dueDate === dateStr);

      // Map all items for sorting and display
      const allItems = [
        ...dayMilestones.map(m => ({ type: 'milestone', data: m })),
        ...dayTasks.map(t => ({ type: 'task', data: t }))
      ];

      const visibleItems = allItems.slice(0, 3);
      const remainingCount = allItems.length - 3;

      calHtml += `
        <div class="calendar-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
          <div class="calendar-day-header">
            <span class="calendar-day-badge">${d}</span>
            ${isToday ? '<span class="today-indicator-tag">Today</span>' : ''}
          </div>
          ${visibleItems.map(item => {
            if (item.type === 'milestone') {
              const m = item.data;
              const proj = Store.getProject(m.projectId);
              const projName = proj ? proj.name : 'Unknown Project';
              const tooltip = `${m.name}&#10;Type: Milestone Deadline&#10;Project: ${projName}&#10;Due: ${Utils.formatDate(m.dueDate)}&#10;Status: ${Utils.humanize(m.status || 'active')}`;
              return `
                <div class="calendar-event milestone" title="${tooltip}" onclick="CalendarScreen.openEventDetail('milestone', '${m.id}')">
                  <svg style="width:11px;height:11px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                  <span class="calendar-event-title">${Utils.escapeHtml(m.name)}</span>
                </div>
              `;
            } else {
              const t = item.data;
              const proj = Store.getProject(t.projectId);
              const m = Store.getMember(t.assigneeId);
              const projName = proj ? proj.name : 'Unknown Project';
              const assigneeName = m ? m.name : 'Unassigned';
              const isOverdue = Utils.isOverdue(t.dueDate) && t.status !== 'done';
              const statusClass = isOverdue ? 'overdue' : 'task';
              const tooltip = `${t.title}&#10;Type: Task (${Utils.humanize(t.priority)} Priority)&#10;Project: ${projName}&#10;Assignee: ${assigneeName}&#10;Status: ${Utils.humanize(t.status)}${isOverdue ? ' [OVERDUE]' : ''}&#10;Due: ${Utils.formatDate(t.dueDate)}`;
              return `
                <div class="calendar-event ${statusClass}" title="${tooltip}" onclick="CalendarScreen.openEventDetail('task', '${t.id}')">
                  <span class="calendar-event-title">${Utils.escapeHtml(t.title)}</span>
                </div>
              `;
            }
          }).join('')}
          ${remainingCount > 0 ? `
            <button type="button" class="calendar-more-btn" onclick="CalendarScreen.openDayModal('${dateStr}')" title="View all ${allItems.length} items for this date">
              <span>+${remainingCount} more</span>
              <svg style="width:10px;height:10px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ` : ''}
        </div>
      `;
    }

    // Next month fill
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      calHtml += `<div class="calendar-cell other-month"><div class="calendar-day-header"><span class="calendar-day-badge">${i}</span></div></div>`;
    }
    calHtml += '</div>';

    const _user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isDeveloper = !!_user && _user.role !== 'Admin';
    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Calendar</h1>
          <p>${isDeveloper ? `${tasks.length} tasks and ${milestones.length} milestones in your scope` : 'Tasks and milestones with due dates'}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="TasksScreen.openCreateModal()">${Icons.plus} New Task</button>
        </div>
      </div>
      <div class="calendar-nav">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="CalendarScreen.prevMonth()" title="Previous Month">${Icons.chevronLeft}</button>
        <h3>${months[this._month]} ${this._year}</h3>
        <button class="btn btn-secondary btn-sm btn-icon" onclick="CalendarScreen.nextMonth()" title="Next Month">${Icons.chevronRight}</button>
        <button class="btn btn-ghost btn-sm" onclick="CalendarScreen.goToday()">Today</button>
      </div>
      ${calHtml}
      
      <!-- Status & Priority Legend -->
      <div style="display:flex;align-items:center;gap:20px;margin-top:20px;padding:12px 16px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);font-size:12px;color:var(--color-text-secondary);flex-wrap:wrap">
        <span style="font-weight:600;color:var(--color-text-primary);margin-right:4px">Legend:</span>
        <span style="display:inline-flex;align-items:center;gap:6px">
          <span class="calendar-event task" style="display:inline-block;padding:2px 8px;font-size:11px">Task</span>
          <span>Task due date</span>
        </span>
        <span style="display:inline-flex;align-items:center;gap:6px">
          <span class="calendar-event milestone" style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;font-size:11px">
            <svg style="width:10px;height:10px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>Milestone
          </span>
          <span>Milestone deadline</span>
        </span>
        <span style="display:inline-flex;align-items:center;gap:6px">
          <span class="calendar-event overdue" style="display:inline-block;padding:2px 8px;font-size:11px">Overdue</span>
          <span>Overdue task</span>
        </span>
        <span style="display:inline-flex;align-items:center;gap:6px">
          <span style="background:#2563EB;color:#fff;font-weight:700;font-size:10px;padding:1px 6px;border-radius:4px">Today</span>
          <span>Current Date</span>
        </span>
      </div>`;
  },

  prevMonth() { 
    this._month--; 
    if (this._month < 0) { 
      this._month = 11; 
      this._year--; 
    } 
    this.refresh(); 
  },

  nextMonth() { 
    this._month++; 
    if (this._month > 11) { 
      this._month = 0; 
      this._year++; 
    } 
    this.refresh(); 
  },

  goToday() { 
    this._year = new Date().getFullYear(); 
    this._month = new Date().getMonth(); 
    this.refresh(); 
  },

  refresh() { 
    const content = document.getElementById('page-content');
    if (content && App.currentScreen === 'calendar') {
      content.innerHTML = this.render(); 
    }
  },

  openDayModal(dateStr) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isNonAdmin = currentUser && currentUser.role !== 'Admin';
    const userMemberId = currentUser ? (currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '')) : '';

    let tasks = Store.getTasks().filter(t => t.dueDate === dateStr);
    let milestones = Store.getMilestones().filter(m => m.dueDate === dateStr);

    if (isNonAdmin) {
      tasks = tasks.filter(task => {
        const ids = Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0 ? task.assigneeIds : (task.assigneeId ? [task.assigneeId] : []);
        return ids.some(id =>
          id === currentUser.id ||
          (userMemberId && id === userMemberId) ||
          (currentUser.id === 'preet' && (id === 'm2' || id === 'preet')) ||
          (currentUser.id === 'mohit' && (id === 'm3' || id === 'mohit')) ||
          (currentUser.id === 'hirvi' && (id === 'm4' || id === 'hirvi')) ||
          (currentUser.memberId === 'm2' && (id === 'm2' || id === 'preet')) ||
          (currentUser.memberId === 'm3' && (id === 'm3' || id === 'mohit')) ||
          (currentUser.memberId === 'm4' && (id === 'm4' || id === 'hirvi'))
        );
      });
      const myProjectIds = new Set(tasks.map(t => t.projectId));
      milestones = milestones.filter(m => myProjectIds.has(m.projectId));
    }

    const formattedDate = Utils.formatDate(dateStr);
    const allItems = [
      ...milestones.map(m => ({ type: 'milestone', data: m })),
      ...tasks.map(t => ({ type: 'task', data: t }))
    ];

    const body = `
      <div style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:13px;color:var(--color-text-secondary)">All scheduled items for <strong>${formattedDate}</strong></span>
        <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:var(--radius-pill);background:var(--color-primary-50);color:var(--color-primary-700)">${allItems.length} Total</span>
      </div>
      <div class="day-modal-items">
        ${allItems.map(item => {
          if (item.type === 'milestone') {
            const m = item.data;
            const proj = Store.getProject(m.projectId);
            return `
              <div class="day-modal-item milestone" onclick="Modal.closeAll();CalendarScreen.openEventDetail('milestone','${m.id}')">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:28px;height:28px;border-radius:6px;background:#F3E8FF;color:#6B21A8;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <svg style="width:14px;height:14px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                  </div>
                  <div>
                    <div style="font-weight:600;font-size:13px;color:var(--color-text-primary)">${Utils.escapeHtml(m.name)}</div>
                    <div style="font-size:11px;color:var(--color-text-muted)">Project: ${proj ? proj.name : '—'}</div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                  <span class="badge badge-planning" style="font-size:11px">Milestone</span>
                  <button class="btn btn-ghost btn-sm btn-icon" title="View Milestone">${Icons.arrowRight || '→'}</button>
                </div>
              </div>
            `;
          } else {
            const t = item.data;
            const proj = Store.getProject(t.projectId);
            const m = Store.getMember(t.assigneeId);
            const isOverdue = Utils.isOverdue(t.dueDate) && t.status !== 'done';
            return `
              <div class="day-modal-item ${isOverdue ? 'overdue' : 'task'}" onclick="Modal.closeAll();CalendarScreen.openEventDetail('task','${t.id}')">
                <div style="display:flex;align-items:center;gap:10px">
                  <span class="priority-dot priority-${t.priority}"></span>
                  <div>
                    <div style="font-weight:600;font-size:13px;color:var(--color-text-primary)">${Utils.escapeHtml(t.title)}</div>
                    <div style="font-size:11px;color:var(--color-text-muted)">
                      ${proj ? proj.name : '—'} · ${m ? m.name : 'Unassigned'}
                    </div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                  ${isOverdue ? '<span class="badge badge-error" style="font-size:10px">Overdue</span>' : ''}
                  <span class="badge badge-${t.status}" style="font-size:10px">${Utils.humanize(t.status)}</span>
                  <button class="btn btn-ghost btn-sm btn-icon" title="View Task">${Icons.arrowRight || '→'}</button>
                </div>
              </div>
            `;
          }
        }).join('')}
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-primary" onclick="Modal.closeAll();TasksScreen.openCreateModal();setTimeout(()=>{const el=document.getElementById('task-due');if(el)el.value='${dateStr}';},50)">${Icons.plus} Add Task for this Day</button>
    `;

    Modal.open(`Schedule: ${formattedDate}`, body, footer, { large: true });
  },

  openEventDetail(type, id) {
    if (type === 'task') {
      if (typeof TasksScreen !== 'undefined' && typeof TasksScreen.openDetailModal === 'function') {
        TasksScreen.openDetailModal(id);
      }
    } else if (type === 'milestone') {
      const m = Store.getMilestones().find(item => item.id === id);
      if (!m) return;
      const proj = Store.getProject(m.projectId);
      const formattedDate = Utils.formatDate(m.dueDate);

      const body = `
        <div style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:#F3E8FF;border:1px solid #E9D5FF;border-radius:var(--radius-md)">
            <div style="width:36px;height:36px;border-radius:8px;background:#8B2CF5;color:#FFFFFF;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg style="width:18px;height:18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            </div>
            <div>
              <div style="font-size:16px;font-weight:700;color:#581C87">${Utils.escapeHtml(m.name)}</div>
              <div style="font-size:12px;color:#7E22CE">Milestone Deadline: ${formattedDate}</div>
            </div>
          </div>

          <div class="section-card" style="padding:16px;margin:0">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
              <div>
                <span style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;font-weight:600">Associated Project</span>
                <div style="font-weight:600;margin-top:2px">${proj ? proj.name : '—'}</div>
              </div>
              <div>
                <span style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;font-weight:600">Status</span>
                <div style="margin-top:2px"><span class="badge badge-active">Active Target</span></div>
              </div>
            </div>
            ${m.description ? `
              <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-border)">
                <span style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;font-weight:600">Description</span>
                <p style="font-size:13px;color:var(--color-text-secondary);margin-top:4px;line-height:1.5">${Utils.escapeHtml(m.description)}</p>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      const footer = `
        <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
        <button class="btn btn-primary" onclick="Modal.closeAll();App.navigate('milestones')">View in Milestones</button>
      `;

      Modal.open('Milestone Details', body, footer);
    }
  }
};

