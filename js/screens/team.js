// ─── Team Screen (Blue/Purple/Slate Theme with Expandable Tasks) ───
const TeamScreen = {
  _expandedMembers: {},

  toggleMemberTasks(memberId, e) {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
    }
    this._expandedMembers[memberId] = !this._expandedMembers[memberId];
    this.refresh();
  },

  refresh() {
    const content = document.getElementById('page-content');
    if (content && typeof App !== 'undefined' && App.currentScreen === 'team') {
      content.innerHTML = this.render();
    } else if (typeof App !== 'undefined') {
      App.refresh();
    }
  },

  render() {
    const teamMembers = Store.getMembers();
    const tasks = Store.getTasks();
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;

    // Filter out users with role === 'Admin' to render ONLY active AI Developers
    const developersList = teamMembers.filter(member => member.role !== 'Admin');

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Team</h1>
          <p>${developersList.length} active AI Developer${developersList.length === 1 ? '' : 's'}</p>
        </div>
      </div>
      <div class="team-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px">
        ${developersList.map(m => {
          const memberTasks = tasks.filter(t => 
            t.assigneeId === m.id ||
            (m.id === 'm2' && t.assigneeId === 'preet') ||
            (m.id === 'm3' && t.assigneeId === 'mohit') ||
            (m.id === 'm4' && t.assigneeId === 'hirvi') ||
            (m.name.includes('Preet') && t.assigneeId === 'preet') ||
            (m.name.includes('Mohit') && t.assigneeId === 'mohit') ||
            (m.name.includes('Hirvi') && t.assigneeId === 'hirvi')
          );
          const activeTasks = memberTasks.filter(t => t.status !== 'done');
          const overdueTasks = memberTasks.filter(t => t.status !== 'done' && Utils.isOverdue(t.dueDate));
          const isYou = currentUser && (
            currentUser.id === m.id ||
            currentUser.memberId === m.id ||
            (currentUser.id === 'preet' && (m.id === 'm2' || m.name.includes('Preet'))) ||
            (currentUser.id === 'mohit' && (m.id === 'm3' || m.name.includes('Mohit'))) ||
            (currentUser.id === 'hirvi' && (m.id === 'm4' || m.name.includes('Hirvi')))
          );
          const initials = m.initials || m.name.split(' ').map(w=>w[0]).join('').slice(0,2);
          const isExpanded = !!this._expandedMembers[m.id];
          const visibleTasks = isExpanded ? activeTasks : activeTasks.slice(0, 3);
          const remainingCount = activeTasks.length - 3;
          
          return `<div class="section-card team-card" style="padding:24px;display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
                <div class="avatar avatar-xl" style="background:${m.color};font-weight:700;font-size:18px">${initials}</div>
                <div>
                  <div style="font-size:16px;font-weight:700;color:var(--color-text-primary);font-family:var(--font-display)">
                    ${m.name} ${isYou ? '<span style="font-size:11px;background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200);padding:2px 8px;border-radius:var(--radius-pill);font-weight:600">You</span>' : ''}
                  </div>
                  <div style="font-size:13px;color:var(--color-text-muted);display:flex;align-items:center;gap:6px;margin-top:2px">
                    ${m.role}
                  </div>
                  <div style="font-size:12px;color:var(--color-text-disabled);margin-top:2px">${m.email}</div>
                </div>
              </div>

              <!-- Developer Task Metrics -->
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;padding:12px 0;border-top:1px solid var(--color-border);border-bottom:1px solid var(--color-border)">
                <div style="text-align:center">
                  <div style="font-family:var(--font-display);font-size:20px;font-weight:800;color:var(--color-text-primary)">${memberTasks.length}</div>
                  <div style="font-size:11px;color:var(--color-text-muted);font-weight:500">Total</div>
                </div>
                <div style="text-align:center">
                  <div style="font-family:var(--font-display);font-size:20px;font-weight:800;color:var(--color-primary)">${activeTasks.length}</div>
                  <div style="font-size:11px;color:var(--color-text-muted);font-weight:500">Active</div>
                </div>
                <div style="text-align:center">
                  <div style="font-family:var(--font-display);font-size:20px;font-weight:800;color:${overdueTasks.length > 0 ? 'var(--color-ai-700)' : 'var(--color-text-primary)'}">${overdueTasks.length}</div>
                  <div style="font-size:11px;color:var(--color-text-muted);font-weight:500">Overdue</div>
                </div>
              </div>

              <!-- Active Tasks List -->
              ${activeTasks.length > 0 ? `
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                <span style="font-size:11px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em">Active Tasks (${activeTasks.length})</span>
                ${activeTasks.length > 3 ? `
                  <button type="button" class="btn btn-ghost btn-xs team-task-toggle-link" 
                          onclick="TeamScreen.toggleMemberTasks('${m.id}', event)" 
                          style="font-size:11px;padding:1px 6px;color:var(--color-primary-700);font-weight:600">
                    ${isExpanded ? 'Collapse ▲' : 'Expand all ▼'}
                  </button>
                ` : ''}
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                ${visibleTasks.map(t => `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:12.5px;cursor:pointer" onclick="TasksScreen.openDetailModal('${t.id}')" title="Click to view task details">
                  <span class="priority-dot priority-${t.priority}"></span>
                  <span style="flex:1;color:var(--color-text-primary);font-weight:500">${Utils.truncate(t.title, 35)}</span>
                  <span class="badge badge-${t.status}" style="font-size:11px;padding:1px 6px">${Utils.humanize(t.status)}</span>
                </div>`).join('')}
                ${activeTasks.length > 3 ? `
                  <button type="button" class="btn btn-ghost btn-xs team-task-more-btn" 
                          onclick="TeamScreen.toggleMemberTasks('${m.id}', event)" 
                          style="font-size:11.5px;margin-top:4px;width:100%;color:var(--color-primary-700);font-weight:600;display:flex;align-items:center;justify-content:center;gap:4px;padding:6px;border:1px dashed var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface)">
                    <span>${isExpanded ? 'Show less' : `+${remainingCount} more`}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12">
                      <polyline points="${isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}"/>
                    </svg>
                  </button>
                ` : ''}
              </div>` : '<div style="font-size:13px;color:var(--color-text-muted);text-align:center;padding:16px">No active tasks</div>'}
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }
};

