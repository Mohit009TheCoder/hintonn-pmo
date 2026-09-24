// ─── Calendar Screen ───
const CalendarScreen = {
  _year: new Date().getFullYear(),
  _month: new Date().getMonth(),

  render() {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const firstDay = new Date(this._year, this._month, 1).getDay();
    const daysInMonth = new Date(this._year, this._month + 1, 0).getDate();
    const today = new Date();
    const tasks = Store.getTasks().filter(t => t.dueDate);
    const milestones = Store.getMilestones().filter(m => m.dueDate);

    let calHtml = '<div class="calendar-grid">';
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => { calHtml += `<div class="calendar-header-cell">${d}</div>`; });

    // Previous month fill
    const prevDays = new Date(this._year, this._month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      calHtml += `<div class="calendar-cell other-month"><div class="calendar-day">${prevDays - i}</div></div>`;
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${this._year}-${String(this._month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = d === today.getDate() && this._month === today.getMonth() && this._year === today.getFullYear();
      const dayTasks = tasks.filter(t => t.dueDate === dateStr);
      const dayMilestones = milestones.filter(m => m.dueDate === dateStr);
      calHtml += `<div class="calendar-cell ${isToday?'today':''}">
        <div class="calendar-day">${d}</div>
        ${dayTasks.slice(0,3).map(t => `<div class="calendar-event task" title="${t.title}" onclick="TasksScreen.openDetailModal('${t.id}')">${Utils.truncate(t.title, 20)}</div>`).join('')}
        ${dayMilestones.slice(0,1).map(m => `<div class="calendar-event milestone" title="${m.name}">⚑ ${Utils.truncate(m.name, 16)}</div>`).join('')}
        ${dayTasks.length + dayMilestones.length > 3 ? `<div style="font-size:9px;color:var(--color-text-disabled);padding-left:6px">+${dayTasks.length + dayMilestones.length - 3} more</div>` : ''}
      </div>`;
    }

    // Next month fill
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      calHtml += `<div class="calendar-cell other-month"><div class="calendar-day">${i}</div></div>`;
    }
    calHtml += '</div>';

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Calendar</h1>
          <p>Tasks and milestones with due dates</p>
        </div>
      </div>
      <div class="calendar-nav">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="CalendarScreen.prevMonth()">${Icons.chevronLeft}</button>
        <h3>${months[this._month]} ${this._year}</h3>
        <button class="btn btn-secondary btn-sm btn-icon" onclick="CalendarScreen.nextMonth()">${Icons.chevronRight}</button>
        <button class="btn btn-ghost btn-sm" onclick="CalendarScreen.goToday()">Today</button>
      </div>
      ${calHtml}
      <div style="display:flex;gap:16px;margin-top:16px;font-size:12px;color:var(--color-text-muted)">
        <span><span class="calendar-event task" style="display:inline">Task</span> — Task due date</span>
        <span><span class="calendar-event milestone" style="display:inline">⚑ Milestone</span> — Milestone deadline</span>
      </div>`;
  },

  prevMonth() { this._month--; if (this._month < 0) { this._month = 11; this._year--; } this.refresh(); },
  nextMonth() { this._month++; if (this._month > 11) { this._month = 0; this._year++; } this.refresh(); },
  goToday() { this._year = new Date().getFullYear(); this._month = new Date().getMonth(); this.refresh(); },
  refresh() { document.getElementById('page-content').innerHTML = this.render(); }
};
