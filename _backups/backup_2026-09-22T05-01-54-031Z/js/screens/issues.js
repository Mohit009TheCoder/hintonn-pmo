// ─── Issues Screen ───
const IssuesScreen = {
  _filter: { status: '', priority: '', project: '', search: '' },

  render() {
    let issues = Store.getIssues();
    if (this._filter.status) issues = issues.filter(i => i.status === this._filter.status);
    if (this._filter.priority) issues = issues.filter(i => i.priority === this._filter.priority);
    if (this._filter.project) issues = issues.filter(i => i.projectId === this._filter.project);
    if (this._filter.search) {
      const q = this._filter.search.toLowerCase();
      issues = issues.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    const projects = Store.getProjects();

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Issues</h1>
          <p>${Store.getIssues().length} total · ${Store.getIssues().filter(i=>i.status==='open').length} open</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="IssuesScreen.openCreateModal()">${Icons.plus} Report Issue</button>
        </div>
      </div>
      <div class="filter-bar">
        <input type="text" class="form-input search-input" placeholder="Search issues..." value="${this._filter.search}" oninput="IssuesScreen._filter.search=this.value;IssuesScreen.refresh()">
        <select class="form-select" style="width:130px" onchange="IssuesScreen._filter.status=this.value;IssuesScreen.refresh()">
          <option value="">All Status</option>
          <option value="open" ${this._filter.status==='open'?'selected':''}>Open</option>
          <option value="resolved" ${this._filter.status==='resolved'?'selected':''}>Resolved</option>
        </select>
        <select class="form-select" style="width:130px" onchange="IssuesScreen._filter.priority=this.value;IssuesScreen.refresh()">
          <option value="">All Priority</option>
          <option value="high" ${this._filter.priority==='high'?'selected':''}>High</option>
          <option value="medium" ${this._filter.priority==='medium'?'selected':''}>Medium</option>
          <option value="low" ${this._filter.priority==='low'?'selected':''}>Low</option>
        </select>
        <select class="form-select" style="width:150px" onchange="IssuesScreen._filter.project=this.value;IssuesScreen.refresh()">
          <option value="">All Projects</option>
          ${projects.map(p => `<option value="${p.id}" ${this._filter.project===p.id?'selected':''}>${p.name}</option>`).join('')}
        </select>
      </div>
      ${issues.length === 0 ? `<div class="empty-state"><div class="empty-state-icon">${Icons.alertCircle}</div><h3>No issues found</h3><p>${this._filter.search||this._filter.status||this._filter.priority||this._filter.project?'Try adjusting your filters.':'No issues have been reported yet.'}</p></div>` :
      `<div class="section-card"><div class="section-card-body no-pad"><div class="table-wrap"><table class="table">
        <thead><tr><th>Issue</th><th>Project</th><th>Priority</th><th>Assignee</th><th>Status</th><th>Created</th><th></th></tr></thead>
        <tbody>${issues.map(i => {
          const proj = Store.getProject(i.projectId);
          const m = Store.getMember(i.assigneeId);
          return `<tr>
            <td><span class="task-title">${i.title}</span><br><span style="font-size:11px;color:var(--color-text-muted)">${Utils.truncate(i.description, 60)}</span></td>
            <td style="font-size:12px;color:var(--color-text-muted)">${proj ? proj.name : '—'}</td>
            <td><span class="badge badge-${i.priority}">${Utils.humanize(i.priority)}</span></td>
            <td style="font-size:12px">${m ? m.name : '<span style="color:var(--color-text-disabled)">Unassigned</span>'}</td>
            <td><span class="badge badge-${i.status==='open'?'open':'resolved'}">${Utils.humanize(i.status)}</span></td>
            <td style="font-size:12px;color:var(--color-text-muted)">${Utils.timeAgo(i.createdAt)}</td>
            <td style="display:flex;gap:4px">
              ${i.status==='open' ? `<button class="btn btn-ghost btn-sm btn-icon" onclick="IssuesScreen.resolveIssue('${i.id}')" title="Resolve">${Icons.check}</button>` : ''}
              <button class="btn btn-ghost btn-sm btn-icon" onclick="IssuesScreen.openEditModal('${i.id}')" title="Edit">${Icons.edit}</button>
              <button class="btn btn-ghost btn-sm btn-icon" onclick="IssuesScreen.deleteIssue('${i.id}')" title="Delete">${Icons.trash}</button>
            </td>
          </tr>`;
        }).join('')}</tbody>
      </table></div></div></div>`}`;
  },

  openCreateModal(projectId) {
    const projects = Store.getProjects();
    const members = Store.getMembers();
    const body = `
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label">Title *</label>
        <input type="text" class="form-input" id="issue-title" placeholder="Describe the issue">
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="issue-desc" placeholder="Provide details..."></textarea>
      </div>
      <div class="form-row" style="margin-bottom:16px">
        <div class="form-group">
          <label class="form-label">Project *</label>
          <select class="form-select" id="issue-project">
            <option value="">Select project</option>
            ${projects.map(p => `<option value="${p.id}" ${projectId===p.id?'selected':''}>${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-select" id="issue-priority">
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Assignee</label>
        <select class="form-select" id="issue-assignee">
          <option value="">Unassigned</option>
          ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
        </select>
      </div>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button><button class="btn btn-primary" onclick="IssuesScreen.saveIssue()">Report Issue</button>`;
    Modal.open('Report Issue', body, footer);
  },

  openEditModal(id) {
    const i = Store.getIssues().find(x=>x.id===id); if (!i) return;
    const projects = Store.getProjects();
    const members = Store.getMembers();
    const body = `
      <div class="form-group" style="margin-bottom:16px"><label class="form-label">Title</label><input type="text" class="form-input" id="issue-title" value="${i.title}"></div>
      <div class="form-group" style="margin-bottom:16px"><label class="form-label">Description</label><textarea class="form-textarea" id="issue-desc">${i.description}</textarea></div>
      <div class="form-row" style="margin-bottom:16px">
        <div class="form-group"><label class="form-label">Project</label><select class="form-select" id="issue-project">${projects.map(p=>`<option value="${p.id}" ${i.projectId===p.id?'selected':''}>${p.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="issue-priority">${['low','medium','high'].map(p=>`<option value="${p}" ${i.priority===p?'selected':''}>${Utils.humanize(p)}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Assignee</label><select class="form-select" id="issue-assignee"><option value="">Unassigned</option>${members.map(m=>`<option value="${m.id}" ${i.assigneeId===m.id?'selected':''}>${m.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="issue-status"><option value="open" ${i.status==='open'?'selected':''}>Open</option><option value="resolved" ${i.status==='resolved'?'selected':''}>Resolved</option></select></div>
      </div>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button><button class="btn btn-primary" onclick="IssuesScreen.saveIssue('${id}')">Save</button>`;
    Modal.open('Edit Issue', body, footer);
  },

  saveIssue(id) {
    const title = document.getElementById('issue-title').value.trim();
    const projectId = document.getElementById('issue-project').value;
    if (!title || !projectId) { Toast.show('Title and project are required', 'error'); return; }
    const data = { title, projectId, description: document.getElementById('issue-desc').value.trim(),
      priority: document.getElementById('issue-priority').value, assigneeId: document.getElementById('issue-assignee').value };
    if (id) { Store.updateIssue(id, data); Toast.show('Issue updated'); }
    else { Store.createIssue(data); Toast.show('Issue reported'); }
    Modal.closeAll(); App.refresh();
  },

  resolveIssue(id) { Store.updateIssue(id, { status: 'resolved' }); Toast.show('Issue resolved'); App.refresh(); },

  deleteIssue(id) {
    Modal.confirm('Delete Issue', 'Are you sure?', () => { Store.deleteIssue(id); Toast.show('Issue deleted'); App.refresh(); }, { danger: true });
  },

  refresh() { document.getElementById('page-content').innerHTML = this.render(); }
};
