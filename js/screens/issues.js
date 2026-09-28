// ─── Issues Screen ───
const IssuesScreen = {
  _filter: { status: '', priority: '', project: '', search: '' },

  _getFilteredIssues() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isDeveloper = currentUser && currentUser.role === 'AI Developer';
    const userMemberId = currentUser ? (currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '')) : '';

    let allIssues = Store.getIssues();
    let issues = allIssues;

    if (isDeveloper) {
      issues = issues.filter(issue =>
        issue.assigneeId === currentUser.id ||
        (userMemberId && issue.assigneeId === userMemberId)
      );
    }

    if (this._filter.status) issues = issues.filter(i => i.status === this._filter.status);
    if (this._filter.priority) issues = issues.filter(i => i.priority === this._filter.priority);
    if (this._filter.project) issues = issues.filter(i => i.projectId === this._filter.project);

    // Standardized real-time case-insensitive substring search: title, description, severity/priority, status, project.name, assignee.name
    if (this._filter.search) {
      const q = this._filter.search.toLowerCase().trim();
      issues = issues.filter(i => {
        const proj = Store.getProject(i.projectId);
        const m = Store.getMember(i.assigneeId);
        const projName = proj ? proj.name.toLowerCase() : '';
        const assigneeName = m ? m.name.toLowerCase() : '';
        return (
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q)) ||
          (i.priority && i.priority.toLowerCase().includes(q)) ||
          (i.status && i.status.toLowerCase().includes(q)) ||
          projName.includes(q) ||
          assigneeName.includes(q)
        );
      });
    }

    return issues;
  },

  render() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isDeveloper = currentUser && currentUser.role === 'AI Developer';
    const allIssues = Store.getIssues();
    const issues = this._getFilteredIssues();
    const projects = Store.getProjects();

    const subtitle = isDeveloper
      ? `${issues.length} assigned to you · ${issues.filter(i=>i.status==='open').length} open`
      : `${allIssues.length} total · ${allIssues.filter(i=>i.status==='open').length} open`;

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Issues</h1>
          <p id="issues-subtitle">${subtitle}</p>
        </div>
        <div class="page-header-actions">
          ${isAdmin ? `<button class="btn btn-primary" onclick="IssuesScreen.openCreateModal()">${Icons.plus} Report Issue</button>` : ''}
        </div>
      </div>
      <div class="filter-bar" id="issues-filter-bar">
        <div class="search-input-wrap">
          <span class="search-icon">${Icons.search}</span>
          <input type="text" id="issue-search-input" class="form-input search-input" placeholder="Search issues..." value="${this._filter.search}" oninput="IssuesScreen.handleSearch(this.value)">
          <button type="button" id="issue-search-clear" class="search-clear-btn ${this._filter.search ? '' : 'hidden'}" onclick="IssuesScreen.clearSearch()" title="Clear search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <select class="form-select" id="issue-filter-status" style="width:130px" onchange="IssuesScreen.handleFilterChange('status', this.value)">
          <option value="">All Status</option>
          <option value="open" ${this._filter.status==='open'?'selected':''}>Open</option>
          <option value="resolved" ${this._filter.status==='resolved'?'selected':''}>Resolved</option>
        </select>
        <select class="form-select" id="issue-filter-priority" style="width:130px" onchange="IssuesScreen.handleFilterChange('priority', this.value)">
          <option value="">All Priority</option>
          <option value="high" ${this._filter.priority==='high'?'selected':''}>High</option>
          <option value="medium" ${this._filter.priority==='medium'?'selected':''}>Medium</option>
          <option value="low" ${this._filter.priority==='low'?'selected':''}>Low</option>
        </select>
        <select class="form-select" id="issue-filter-project" style="width:150px" onchange="IssuesScreen.handleFilterChange('project', this.value)">
          <option value="">All Projects</option>
          ${projects.map(p => `<option value="${p.id}" ${this._filter.project===p.id?'selected':''}>${p.name}</option>`).join('')}
        </select>
      </div>
      <div id="issues-container" class="issues-list">
        ${this._renderContent(issues)}
      </div>`;
  },

  handleSearch(val) {
    this._filter.search = val;
    const clearBtn = document.getElementById('issue-search-clear');
    if (clearBtn) {
      if (val) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }
    this.updateIssuesContainer();
  },

  clearSearch() {
    this._filter.search = '';
    const input = document.getElementById('issue-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    const clearBtn = document.getElementById('issue-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.updateIssuesContainer();
  },

  handleFilterChange(key, val) {
    this._filter[key] = val;
    this.updateIssuesContainer();
  },

  updateIssuesContainer() {
    const issues = this._getFilteredIssues();
    const allIssues = Store.getIssues();
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isDeveloper = currentUser && currentUser.role === 'AI Developer';

    const subtitleEl = document.getElementById('issues-subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = isDeveloper
        ? `${issues.length} assigned to you · ${issues.filter(i=>i.status==='open').length} open`
        : `${allIssues.length} total · ${allIssues.filter(i=>i.status==='open').length} open`;
    }

    const container = document.getElementById('issues-container') || document.getElementById('issues-table') || document.querySelector('.issues-list');
    if (container) {
      container.innerHTML = this._renderContent(issues);
    } else {
      this.refresh();
    }
  },

  _renderContent(issues) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    if (issues.length === 0) {
      if (this._filter.search) {
        return `
          <div class="empty-state">
            <div class="empty-state-icon">${Icons.search}</div>
            <h3>No matching results found for "${this._filter.search}"</h3>
            <p>Try searching for a different issue title, description, project, or severity.</p>
            <button class="btn btn-secondary btn-sm" onclick="IssuesScreen.clearSearch()">Clear Search</button>
          </div>
        `;
      }
      return `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons.alertCircle}</div>
          <h3>No issues found</h3>
          <p>${this._filter.status || this._filter.priority || this._filter.project ? 'Try adjusting your filters.' : 'No issues have been reported yet.'}</p>
        </div>
      `;
    }

    return `
      <div class="section-card"><div class="section-card-body no-pad"><div class="table-wrap"><table class="table" id="issues-table">
        <thead><tr><th>Issue</th><th>Project</th><th>Priority</th><th>Assignee</th><th>Status</th><th>Created</th><th></th></tr></thead>
        <tbody>${issues.map(i => {
          const proj = Store.getProject(i.projectId);
          const m = Store.getMember(i.assigneeId);
          const createdDate = i.createdAt ? (function(raw) {
            try {
              const d = new Date(raw);
              return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            } catch(e) { return '—'; }
          })(i.createdAt) : (new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));

          return `<tr>
            <td><span class="task-title" onclick="IssuesScreen.openEditModal('${i.id}')">${i.title}</span><br><span style="font-size:11px;color:var(--color-text-muted)">${Utils.truncate(i.description, 60)}</span></td>
            <td style="font-size:12px;color:var(--color-text-muted)">${proj ? proj.name : '—'}</td>
            <td><span class="badge badge-${i.priority}">${Utils.humanize(i.priority)}</span></td>
            <td style="font-size:12px">${m ? m.name : '<span style="color:var(--color-text-disabled)">Unassigned</span>'}</td>
            <td><span class="badge badge-${i.status==='open'?'open':'resolved'}">${Utils.humanize(i.status)}</span></td>
            <td style="font-size:12px;color:var(--color-text-muted)" title="${Utils.timeAgo(i.createdAt)}">${createdDate}</td>
            <td style="display:flex;gap:4px">
              ${i.status==='open' ? `<button class="btn btn-ghost btn-sm btn-icon" onclick="IssuesScreen.resolveIssue('${i.id}')" title="Resolve">${Icons.check}</button>` : ''}
              ${isAdmin ? `<button class="btn btn-ghost btn-sm btn-icon" onclick="IssuesScreen.openEditModal('${i.id}')" title="Edit">${Icons.edit}</button>` : ''}
              ${isAdmin ? `<button class="btn btn-ghost btn-sm btn-icon" onclick="IssuesScreen.deleteIssue('${i.id}')" title="Delete">${Icons.trash}</button>` : ''}
            </td>
          </tr>`;
        }).join('')}</tbody>
      </table></div></div></div>
    `;
  },

  refresh() {
    const content = document.getElementById('page-content');
    if (content && App.currentScreen === 'issues') {
      content.innerHTML = this.render();
    }
  },

  openCreateModal(projectId) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    if (!isAdmin) { Toast.show('Only admins can create issues', 'error'); return; }
    const projects = Store.getProjects();
    const assignees = Store.getAssignees();
    const isDeveloper = currentUser && currentUser.role === 'AI Developer';
    const devAssigneeId = currentUser ? (currentUser.memberId || currentUser.id) : '';

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
        ${isDeveloper ? `
          <select class="form-select" id="issue-assignee">
            <option value="${devAssigneeId}">${currentUser ? currentUser.name : 'You'} (You)</option>
          </select>
        ` : `
          <select class="form-select" id="issue-assignee">
            <option value="">Unassigned</option>
            ${assignees.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
          </select>
        `}
      </div>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button><button class="btn btn-primary" onclick="IssuesScreen.saveIssue()">Report Issue</button>`;
    Modal.open('Report Issue', body, footer);
  },

  openEditModal(id) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    if (!isAdmin) { Toast.show('Only admins can edit issues', 'error'); return; }
    const i = Store.getIssues().find(x=>x.id===id); if (!i) return;
    const projects = Store.getProjects();
    const assignees = Store.getAssignees();
    const isDeveloper = currentUser && currentUser.role === 'AI Developer';
    const m = Store.getMember(i.assigneeId);

    const body = `
      <div class="form-group" style="margin-bottom:16px"><label class="form-label">Title</label><input type="text" class="form-input" id="issue-title" value="${i.title}"></div>
      <div class="form-group" style="margin-bottom:16px"><label class="form-label">Description</label><textarea class="form-textarea" id="issue-desc">${i.description}</textarea></div>
      <div class="form-row" style="margin-bottom:16px">
        <div class="form-group"><label class="form-label">Project</label><select class="form-select" id="issue-project">${projects.map(p=>`<option value="${p.id}" ${i.projectId===p.id?'selected':''}>${p.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="issue-priority">${['low','medium','high'].map(p=>`<option value="${p}" ${i.priority===p?'selected':''}>${Utils.humanize(p)}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Assignee</label>
          ${isDeveloper ? `
            <select class="form-select" id="issue-assignee" disabled>
              <option value="${i.assigneeId}">${m ? m.name : (currentUser ? currentUser.name : 'You')}</option>
            </select>
          ` : `
            <select class="form-select" id="issue-assignee"><option value="">Unassigned</option>${assignees.map(m=>`<option value="${m.id}" ${i.assigneeId===m.id?'selected':''}>${m.name}</option>`).join('')}</select>
          `}
        </div>
        <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="issue-status"><option value="open" ${i.status==='open'?'selected':''}>Open</option><option value="resolved" ${i.status==='resolved'?'selected':''}>Resolved</option></select></div>
      </div>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button><button class="btn btn-primary" onclick="IssuesScreen.saveIssue('${id}')">Save</button>`;
    Modal.open('Edit Issue', body, footer);
  },

  saveIssue(id) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    if (!isAdmin) { Toast.show('Only admins can save issues', 'error'); return; }
    const title = document.getElementById('issue-title').value.trim();
    const projectId = document.getElementById('issue-project').value;
    if (!title || !projectId) { Toast.show('Title and project are required', 'error'); return; }
    let assigneeId = document.getElementById('issue-assignee')?.value || '';
    const data = { title, projectId, description: document.getElementById('issue-desc').value.trim(),
      priority: document.getElementById('issue-priority').value, assigneeId: assigneeId };
    if (id) { Store.updateIssue(id, data); Toast.show('Issue updated'); }
    else { Store.createIssue(data); Toast.show('Issue reported'); }
    Modal.closeAll(); App.refresh();
  },

  resolveIssue(id) { Store.updateIssue(id, { status: 'resolved' }); Toast.show('Issue resolved'); App.refresh(); },

  deleteIssue(id) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    if (!isAdmin) { Toast.show('Only admins can delete issues', 'error'); return; }
    Modal.confirm('Delete Issue', 'Are you sure?', () => { Store.deleteIssue(id); Toast.show('Issue deleted'); App.refresh(); }, { danger: true });
  },

  refresh() { document.getElementById('page-content').innerHTML = this.render(); }
};
