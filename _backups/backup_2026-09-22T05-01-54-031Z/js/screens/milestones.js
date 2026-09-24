// ─── Milestones Screen ───
const MilestonesScreen = {
  render() {
    const milestones = Store.getMilestones();
    const projects = Store.getProjects();
    const completed = milestones.filter(m => m.status === 'completed').length;

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Milestones</h1>
          <p>${milestones.length} total · ${completed} completed</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="MilestonesScreen.openCreateModal()">${Icons.plus} New Milestone</button>
        </div>
      </div>
      ${milestones.length === 0 ? `<div class="empty-state"><div class="empty-state-icon">${Icons.flag}</div><h3>No milestones yet</h3><p>Create milestones to track major project deliverables.</p><button class="btn btn-primary" onclick="MilestonesScreen.openCreateModal()">${Icons.plus} New Milestone</button></div>` :
      `<div class="milestone-list">${milestones.map(m => {
        const proj = Store.getProject(m.projectId);
        const status = m.status === 'completed' ? 'completed' : new Date(m.dueDate) < new Date() ? 'pending' : 'upcoming';
        const isOverdue = m.status !== 'completed' && m.dueDate && new Date(m.dueDate) < new Date();
        return `<div class="milestone-item">
          <div class="milestone-icon ${status}">${status==='completed'?'✓':'⚑'}</div>
          <div class="milestone-info">
            <div class="milestone-name">${m.name}</div>
            <div class="milestone-date">${proj ? proj.name + ' · ' : ''}${m.dueDate ? (isOverdue ? 'Overdue: ' : 'Due ') + Utils.formatDate(m.dueDate) : 'No due date'}</div>
          </div>
          <span class="badge badge-${status==='completed'?'completed':status==='pending'?'paused':'planning'}">${Utils.humanize(m.status)}</span>
          ${m.status !== 'completed' ? `<button class="btn btn-ghost btn-sm" onclick="MilestonesScreen.completeMilestone('${m.id}')">Complete</button>` : ''}
          <button class="btn btn-ghost btn-sm btn-icon" onclick="MilestonesScreen.openEditModal('${m.id}')">${Icons.edit}</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="MilestonesScreen.deleteMilestone('${m.id}')">${Icons.trash}</button>
        </div>`;
      }).join('')}</div>`}`;
  },

  openCreateModal(projectId) {
    const projects = Store.getProjects();
    const body = `
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label">Milestone Name *</label>
        <input type="text" class="form-input" id="ms-name" placeholder="e.g. Beta Launch">
      </div>
      <div class="form-row" style="margin-bottom:16px">
        <div class="form-group">
          <label class="form-label">Project *</label>
          <select class="form-select" id="ms-project">
            <option value="">Select project</option>
            ${projects.map(p => `<option value="${p.id}" ${projectId===p.id?'selected':''}>${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input type="date" class="form-input" id="ms-due">
        </div>
      </div>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button><button class="btn btn-primary" onclick="MilestonesScreen.saveMilestone()">Create Milestone</button>`;
    Modal.open('New Milestone', body, footer);
  },

  openEditModal(id) {
    const m = Store.getMilestones().find(x=>x.id===id); if (!m) return;
    const projects = Store.getProjects();
    const body = `
      <div class="form-group" style="margin-bottom:16px"><label class="form-label">Name</label><input type="text" class="form-input" id="ms-name" value="${m.name}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Project</label><select class="form-select" id="ms-project">${projects.map(p=>`<option value="${p.id}" ${m.projectId===p.id?'selected':''}>${p.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Due Date</label><input type="date" class="form-input" id="ms-due" value="${m.dueDate||''}"></div>
      </div>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button><button class="btn btn-primary" onclick="MilestonesScreen.saveMilestone('${id}')">Save</button>`;
    Modal.open('Edit Milestone', body, footer);
  },

  saveMilestone(id) {
    const name = document.getElementById('ms-name').value.trim();
    const projectId = document.getElementById('ms-project').value;
    if (!name || !projectId) { Toast.show('Name and project are required', 'error'); return; }
    const data = { name, projectId, dueDate: document.getElementById('ms-due').value };
    if (id) { Store.updateMilestone(id, data); Toast.show('Milestone updated'); }
    else { Store.createMilestone(data); Toast.show('Milestone created'); }
    Modal.closeAll(); App.refresh();
  },

  completeMilestone(id) { Store.updateMilestone(id, { status: 'completed' }); Toast.show('Milestone completed!'); App.refresh(); },
  deleteMilestone(id) { Modal.confirm('Delete Milestone', 'Are you sure?', () => { Store.deleteMilestone(id); Toast.show('Milestone deleted'); App.refresh(); }, { danger: true }); },
  refresh() { document.getElementById('page-content').innerHTML = this.render(); }
};
