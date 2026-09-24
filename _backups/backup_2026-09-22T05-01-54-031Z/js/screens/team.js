// ─── Team Screen (Blue/Purple/Slate Theme) ───
const TeamScreen = {
  render() {
    const members = Store.getMembers();
    const tasks = Store.getTasks();
    const settings = Store.getSettings();

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Team</h1>
          <p>${members.length} active team members</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px">
        ${members.map(m => {
          const memberTasks = tasks.filter(t => t.assigneeId === m.id);
          const activeTasks = memberTasks.filter(t => t.status !== 'done');
          const overdueTasks = memberTasks.filter(t => t.status !== 'done' && Utils.isOverdue(t.dueDate));
          const isCurrentUser = m.id === settings.currentUser;
          return `<div class="section-card" style="padding:24px">
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
              <div class="avatar avatar-xl" style="background:${m.color}">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
              <div>
                <div style="font-size:16px;font-weight:700;color:var(--color-text-primary);font-family:var(--font-display)">
                  ${m.name} ${isCurrentUser ? '<span style="font-size:11px;background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200);padding:2px 8px;border-radius:var(--radius-pill);font-weight:600">You</span>' : ''}
                </div>
                <div style="font-size:13px;color:var(--color-text-muted)">${m.role}</div>
                <div style="font-size:12px;color:var(--color-text-disabled);margin-top:2px">${m.email}</div>
              </div>
            </div>
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
            ${activeTasks.length > 0 ? `
            <div style="font-size:11px;font-weight:700;color:var(--color-text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Active Tasks</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${activeTasks.slice(0,4).map(t => `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:12.5px">
                <span class="priority-dot priority-${t.priority}"></span>
                <span style="flex:1;color:var(--color-text-primary);font-weight:500">${Utils.truncate(t.title, 35)}</span>
                <span class="badge badge-${t.status}" style="font-size:11px;padding:1px 6px">${Utils.humanize(t.status)}</span>
              </div>`).join('')}
              ${activeTasks.length > 4 ? `<div style="font-size:11px;color:var(--color-text-disabled);text-align:center">+${activeTasks.length - 4} more</div>` : ''}
            </div>` : '<div style="font-size:13px;color:var(--color-text-muted);text-align:center;padding:16px">No active tasks</div>'}
          </div>`;
        }).join('')}
      </div>`;
  }
};
