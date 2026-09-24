// ─── Team Screen (Blue/Purple/Slate Theme with Expandable Tasks & Custom Designation Controls) ───
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

  handleRoleSelectChange(selectEl) {
    const wrap = document.getElementById('member-custom-designation-wrap');
    const input = document.getElementById('member-custom-designation');
    if (!wrap) return;
    if (selectEl.value === '__custom__') {
      wrap.style.display = 'block';
      if (input) {
        input.focus();
      }
    } else {
      wrap.style.display = 'none';
      if (input) {
        input.value = selectEl.value;
      }
    }
  },

  openAddMemberModal() {
    const presets = [
      'AI Developer',
      'Senior AI Engineer',
      'Project Manager',
      'Data Engineer',
      'QA Specialist',
      'UI/UX Designer'
    ];

    const bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Full Name <span style="color:#EF4444">*</span></label>
          <input type="text" id="member-name" class="form-input" placeholder="e.g. Alex Morgan" required style="width:100%;height:38px;padding:0 12px;border-radius:6px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text-primary);" />
        </div>

        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Email Address <span style="color:#EF4444">*</span></label>
          <input type="email" id="member-email" class="form-input" placeholder="e.g. alex@hintonn.com" required style="width:100%;height:38px;padding:0 12px;border-radius:6px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text-primary);" />
        </div>

        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Role / Designation</label>
          <select id="member-role-select" class="form-select" onchange="TeamScreen.handleRoleSelectChange(this)" style="width:100%;height:38px;padding:0 12px;border-radius:6px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text-primary);">
            ${presets.map(p => `<option value="${p}">${p}</option>`).join('')}
            <option value="__custom__">Custom Designation...</option>
          </select>
        </div>

        <div id="member-custom-designation-wrap" style="display:none;">
          <label class="form-label" style="display:block;margin-bottom:4px;font-size:12px;font-weight:600;color:var(--color-text-secondary);">Custom Designation Title</label>
          <input type="text" id="member-custom-designation" class="form-input" placeholder="e.g. Lead Solutions Architect, Prompt Engineer, MLOps Specialist" style="width:100%;height:38px;padding:0 12px;border-radius:6px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text-primary);" />
          <span style="font-size:11.5px;color:var(--color-text-muted);display:block;margin-top:4px;">Enter any specialized title or custom domain role.</span>
        </div>
      </div>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-primary" onclick="TeamScreen.saveNewMember()">Add Member</button>
    `;

    Modal.open('Add Team Member', bodyHtml, footerHtml);
  },

  saveNewMember() {
    const nameInput = document.getElementById('member-name');
    const emailInput = document.getElementById('member-email');
    const roleSelect = document.getElementById('member-role-select');
    const customInput = document.getElementById('member-custom-designation');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';

    if (!name) {
      if (typeof Toast !== 'undefined') Toast.show('Please enter the team member full name.', 'error');
      return;
    }
    if (!email || !email.includes('@')) {
      if (typeof Toast !== 'undefined') Toast.show('Please enter a valid email address.', 'error');
      return;
    }

    let designation = 'AI Developer';
    if (roleSelect) {
      if (roleSelect.value === '__custom__') {
        designation = customInput ? customInput.value.trim() : '';
        if (!designation) {
          if (typeof Toast !== 'undefined') Toast.show('Please enter a custom designation title.', 'error');
          return;
        }
      } else {
        designation = roleSelect.value.trim();
      }
    }

    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'TM';
    const newId = 'm_' + Date.now();
    const colors = ['#2563EB', '#7C3AED', '#4F46E5', '#1D4ED8', '#059669', '#D97706', '#0891B2'];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];

    const newMember = {
      id: newId,
      name: name,
      role: designation,
      designation: designation,
      email: email,
      initials: initials,
      color: chosenColor
    };

    if (typeof Store !== 'undefined' && Store._data && Store._data.members) {
      Store._data.members.push(newMember);
      if (typeof Store._save === 'function') Store._save();
      if (typeof Store._notify === 'function') Store._notify();
    }

    if (typeof Auth !== 'undefined' && Array.isArray(Auth.users)) {
      Auth.users.push({
        id: 'user_' + Date.now(),
        memberId: newId,
        loginId: name.split(' ')[0] || name,
        password: 'user@123',
        name: name,
        role: designation,
        designation: designation,
        title: designation,
        email: email,
        initials: initials,
        color: chosenColor
      });
    }

    if (typeof Toast !== 'undefined') {
      Toast.show(`Added ${name} (${designation}) to team.`, 'success');
    }

    if (typeof Modal !== 'undefined' && typeof Modal.closeAll === 'function') {
      Modal.closeAll();
    }

    this.refresh();
  },

  openEditRoleModal(memberId) {
    const m = (typeof Store !== 'undefined' && typeof Store.getMember === 'function')
      ? Store.getMember(memberId)
      : (typeof Store !== 'undefined' && Store._data && Store._data.members ? Store._data.members.find(x => x.id === memberId) : null);

    if (!m) {
      if (typeof Toast !== 'undefined') Toast.show('Member not found.', 'error');
      return;
    }

    const currentDesignation = m.designation || m.role || 'AI Developer';
    const presets = [
      'AI Developer',
      'Senior AI Engineer',
      'Project Manager',
      'Data Engineer',
      'QA Specialist',
      'UI/UX Designer'
    ];
    const isPreset = presets.includes(currentDesignation);

    const bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--color-bg-page, #F8FAFC);border-radius:8px;border:1px solid var(--color-border, #E2E8F0);">
          <div class="avatar avatar-md" style="background:${m.color || '#7C3AED'};font-weight:700;">${m.initials || '??'}</div>
          <div style="min-width:0;flex:1;">
            <div style="font-weight:700;color:var(--color-text-primary);font-size:15px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;">${m.name}</div>
            <div style="font-size:12px;color:var(--color-text-muted);text-overflow:ellipsis;white-space:nowrap;overflow:hidden;">${m.email}</div>
          </div>
        </div>

        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Role / Designation</label>
          <select id="member-role-select" class="form-select" onchange="TeamScreen.handleRoleSelectChange(this)" style="width:100%;height:38px;padding:0 12px;border-radius:6px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text-primary);">
            ${presets.map(p => `<option value="${p}" ${isPreset && currentDesignation === p ? 'selected' : ''}>${p}</option>`).join('')}
            <option value="__custom__" ${!isPreset ? 'selected' : ''}>Custom Designation...</option>
          </select>
        </div>

        <div id="member-custom-designation-wrap" style="display:${isPreset ? 'none' : 'block'};">
          <label class="form-label" style="display:block;margin-bottom:4px;font-size:12px;font-weight:600;color:var(--color-text-secondary);">Custom Designation Title</label>
          <input type="text" id="member-custom-designation" class="form-input" placeholder="e.g. Lead Solutions Architect, Prompt Engineer, MLOps Specialist" value="${!isPreset ? currentDesignation : ''}" style="width:100%;height:38px;padding:0 12px;border-radius:6px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text-primary);" />
          <span style="font-size:11.5px;color:var(--color-text-muted);display:block;margin-top:4px;">Enter any specialized title or custom domain role.</span>
        </div>
      </div>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-primary" onclick="TeamScreen.saveMemberRole('${m.id}')">Save Changes</button>
    `;

    Modal.open(`Edit Role & Designation: ${m.name}`, bodyHtml, footerHtml);
  },

  openEditMemberModal(memberId) {
    this.openEditRoleModal(memberId);
  },

  saveMemberRole(memberId) {
    const select = document.getElementById('member-role-select');
    const customInput = document.getElementById('member-custom-designation');
    if (!select) return;

    let finalDesignation = '';
    if (select.value === '__custom__') {
      finalDesignation = (customInput ? customInput.value : '').trim();
      if (!finalDesignation) {
        if (typeof Toast !== 'undefined') Toast.show('Please enter a custom designation title.', 'error');
        return;
      }
    } else {
      finalDesignation = select.value.trim();
    }

    const member = (typeof Store !== 'undefined' && typeof Store.getMember === 'function')
      ? Store.getMember(memberId)
      : (typeof Store !== 'undefined' && Store._data && Store._data.members ? Store._data.members.find(m => m.id === memberId) : null);

    if (!member) {
      if (typeof Toast !== 'undefined') Toast.show('Member not found.', 'error');
      return;
    }

    member.designation = finalDesignation;
    if (member.role !== 'Admin') {
      member.role = finalDesignation;
    }

    // Sync to Store
    if (typeof Store !== 'undefined' && typeof Store._save === 'function') Store._save();
    if (typeof Store !== 'undefined' && typeof Store._notify === 'function') Store._notify();

    // Sync to Auth users
    if (typeof Auth !== 'undefined' && Array.isArray(Auth.users)) {
      const authUser = Auth.users.find(u => u.memberId === memberId || u.id === memberId || u.name === member.name);
      if (authUser) {
        authUser.designation = finalDesignation;
        authUser.title = finalDesignation;
      }
    }

    if (typeof Toast !== 'undefined') {
      Toast.show(`Updated designation for ${member.name} to "${finalDesignation}".`, 'success');
    }

    if (typeof Modal !== 'undefined' && typeof Modal.closeAll === 'function') {
      Modal.closeAll();
    }

    this.refresh();
  },

  render() {
    const teamMembers = Store.getMembers();
    const tasks = Store.getTasks();
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = !currentUser || currentUser.role === 'Admin' || (typeof Store !== 'undefined' && Store._data?.settings?.currentUser === 'm1') || (currentUser && currentUser.id === 'ayush');

    // Filter out users with role === 'Admin' to render ONLY active AI Developers
    const developersList = teamMembers.filter(member => member.role !== 'Admin');

    return `
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div class="page-header-left">
          <h1>Team</h1>
          <p>${developersList.length} active AI Developer${developersList.length === 1 ? '' : 's'}</p>
        </div>
        ${isAdmin ? `
          <div class="page-header-right">
            <button type="button" class="btn btn-primary" onclick="TeamScreen.openAddMemberModal()" style="display:inline-flex;align-items:center;gap:6px;font-weight:600;">
              ${Icons.plus || '+'}
              <span>Add Member</span>
            </button>
          </div>
        ` : ''}
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
          const designationText = m.designation || m.role || 'AI Developer';
          
          return `<div class="section-card team-card" style="padding:24px;display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px">
                <div style="display:flex;align-items:center;gap:14px;min-width:0;flex:1;">
                  <div class="avatar avatar-xl" style="background:${m.color};font-weight:700;font-size:18px;flex-shrink:0;">${initials}</div>
                  <div style="min-width:0;flex:1;overflow:hidden;">
                    <div style="font-size:16px;font-weight:700;color:var(--color-text-primary);font-family:var(--font-display);text-overflow:ellipsis;white-space:nowrap;overflow:hidden;" title="${m.name}">
                      ${m.name} ${isYou ? '<span style="font-size:11px;background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200);padding:2px 8px;border-radius:var(--radius-pill);font-weight:600">You</span>' : ''}
                    </div>
                    <div class="team-card-designation" style="font-size:13px;color:var(--color-text-muted);display:block;margin-top:2px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;font-weight:500;" title="${designationText}">
                      ${designationText}
                    </div>
                    <div style="font-size:12px;color:var(--color-text-disabled);margin-top:2px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;" title="${m.email}">${m.email}</div>
                  </div>
                </div>
                ${isAdmin ? `
                  <div class="team-card-actions" style="flex-shrink:0;display:flex;align-items:center;gap:4px;">
                    <button type="button" class="btn btn-ghost btn-xs team-card-action-menu-btn team-edit-role-btn" 
                            onclick="TeamScreen.openEditRoleModal('${m.id}')" 
                            title="Edit Role & Designation" 
                            style="font-size:11.5px;color:var(--color-primary-700);font-weight:600;padding:3px 8px;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface);display:inline-flex;align-items:center;gap:4px;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                      <span>Edit Role</span>
                    </button>
                  </div>
                ` : ''}
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
