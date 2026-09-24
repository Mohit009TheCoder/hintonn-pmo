// ─── Team Screen (Work Assignment View with Project Grouping & Member Profiles) ───
const TeamScreen = {
  _expandedMembers: {},
  _expandedProjects: {},

  toggleMemberTasks(memberId, e) {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
    }
    this._expandedMembers[memberId] = !this._expandedMembers[memberId];
    this.refresh();
  },

  toggleProjectGroup(memberId, projectId, e) {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
    }
    const key = `${memberId}:${projectId}`;
    this._expandedProjects[key] = !this._expandedProjects[key];
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
      if (input) input.focus();
    } else {
      wrap.style.display = 'none';
      if (input) input.value = selectEl.value;
    }
  },

  openAddMemberModal() {
    const presets = [
      'AI Developer', 'Senior AI Engineer', 'Project Manager',
      'Data Engineer', 'QA Specialist', 'UI/UX Designer'
    ];
    const bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Full Name <span style="color:#EF4444">*</span></label>
          <input type="text" id="member-name" class="form-input" placeholder="e.g. Alex Morgan" required style="width:100%;height:42px;padding:0 14px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong,#D1D5DB);background:var(--color-surface,#FFF);color:var(--color-text-primary,#111827);font-size:14px;" />
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Email Address <span style="color:#EF4444">*</span></label>
          <input type="email" id="member-email" class="form-input" placeholder="e.g. alex@hintonn.com" required style="width:100%;height:42px;padding:0 14px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong,#D1D5DB);background:var(--color-surface,#FFF);color:var(--color-text-primary,#111827);font-size:14px;" />
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Role / Designation</label>
          <div id="role-dropdown-wrap" style="position:relative;">
            <button type="button" id="role-dropdown-btn" onclick="TeamScreen.toggleRoleDropdown()" style="width:100%;height:42px;padding:0 36px 0 14px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong,#D1D5DB);background:var(--color-surface,#FFF);color:var(--color-text-primary,#111827);font-size:14px;font-weight:500;text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 150ms;">
              <span id="role-dropdown-label" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">AI Developer</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" width="18" height="18" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;flex-shrink:0;"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div id="role-dropdown-menu" style="display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--color-surface,#FFF);border:1px solid var(--color-border,#E5E7EB);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);z-index:1000;overflow:hidden;max-height:280px;overflow-y:auto;">
              ${presets.map((p, i) => {
                const active = i === 0;
                return `<button type="button" data-role="${p}" onclick="TeamScreen.selectRole('${p}')" style="width:100%;padding:10px 14px;border:none;background:${active?'var(--color-primary-50,#EFF6FF)':'transparent'};color:${active?'var(--color-primary-700,#1D4ED8)':'var(--color-text-primary,#111827)'};font-size:13.5px;font-weight:${active?'600':'500'};text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background 120ms;">
                  <svg class="role-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="flex-shrink:0;${active?'':'display:none;'}"><polyline points="20 6 9 17 4 12"/></svg>
                  <span class="role-spacer" style="width:14px;flex-shrink:0;${active?'display:none;':''}"></span>
                  <span>${p}</span>
                </button>`;
              }).join('')}
              <div style="height:1px;background:var(--color-border,#E5E7EB);margin:4px 0;"></div>
              <button type="button" data-role="__custom__" onclick="TeamScreen.selectRole('__custom__')" style="width:100%;padding:10px 14px;border:none;background:transparent;color:var(--color-text-muted,#6B7280);font-size:13.5px;font-weight:500;text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background 120ms;">
                <svg class="role-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="flex-shrink:0;display:none;"><polyline points="20 6 9 17 4 12"/></svg>
                <span class="role-spacer" style="width:14px;flex-shrink:0;"></span>
                <span>Custom Designation...</span>
              </button>
            </div>
            <input type="hidden" id="member-role-select" value="AI Developer">
          </div>
        </div>
        <div id="member-custom-designation-wrap" style="display:none;">
          <label class="form-label" style="display:block;margin-bottom:4px;font-size:12px;font-weight:600;color:var(--color-text-secondary);">Custom Designation Title</label>
          <input type="text" id="member-custom-designation" class="form-input" placeholder="e.g. Lead Solutions Architect, Prompt Engineer, MLOps Specialist" style="width:100%;height:42px;padding:0 14px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong,#D1D5DB);background:var(--color-surface,#FFF);color:var(--color-text-primary,#111827);font-size:14px;" />
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
    if (!name) { Toast.show('Please enter the team member full name.', 'error'); return; }
    if (!email || !email.includes('@')) { Toast.show('Please enter a valid email address.', 'error'); return; }
    let designation = 'AI Developer';
    if (roleSelect) {
      if (roleSelect.value === '__custom__') {
        designation = customInput ? customInput.value.trim() : '';
        if (!designation) { Toast.show('Please enter a custom designation title.', 'error'); return; }
      } else { designation = roleSelect.value.trim(); }
    }
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'TM';
    const newId = 'm_' + Date.now();
    const colors = ['#2563EB', '#7C3AED', '#4F46E5', '#1D4ED8', '#059669', '#D97706', '#0891B2'];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];

    // Use Store.createMember to sync to Firebase
    Store.createMember({ id: newId, name, role: designation, designation, email, initials, color: chosenColor });

    // Also add to Auth users for login
    if (typeof Auth !== 'undefined' && Array.isArray(Auth.users)) {
      Auth.users.push({
        id: 'user_' + Date.now(), memberId: newId, loginId: name.split(' ')[0] || name,
        password: 'user@123', name, role: designation, designation, title: designation,
        email, initials, color: chosenColor
      });
    }
    Toast.show(`Added ${name} (${designation}) to team.`, 'success');
    Modal.closeAll();
    this.refresh();
  },

  openEditRoleModal(memberId) {
    const m = Store.getMember(memberId);
    if (!m) { Toast.show('Member not found.', 'error'); return; }
    const currentDesignation = m.designation || m.role || 'AI Developer';
    const presets = ['AI Developer','Senior AI Engineer','Project Manager','Data Engineer','QA Specialist','UI/UX Designer'];
    const isPreset = presets.includes(currentDesignation);
    const bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--color-bg-page,#F8FAFC);border-radius:8px;border:1px solid var(--color-border,#E2E8F0);">
          <div class="avatar avatar-md" style="background:${m.color||'#7C3AED'};font-weight:700;">${m.initials||'??'}</div>
          <div style="min-width:0;flex:1;">
            <div style="font-weight:700;color:var(--color-text-primary);font-size:15px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;">${m.name}</div>
            <div style="font-size:12px;color:var(--color-text-muted);text-overflow:ellipsis;white-space:nowrap;overflow:hidden;">${m.email}</div>
          </div>
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Role / Designation</label>
          <div id="role-dropdown-wrap" style="position:relative;">
            <button type="button" id="role-dropdown-btn" onclick="TeamScreen.toggleRoleDropdown()" style="width:100%;height:42px;padding:0 36px 0 14px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong,#D1D5DB);background:var(--color-surface,#FFF);color:var(--color-text-primary,#111827);font-size:14px;font-weight:500;text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 150ms;">
              <span id="role-dropdown-label" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${currentDesignation}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" width="18" height="18" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;flex-shrink:0;"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div id="role-dropdown-menu" style="display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--color-surface,#FFF);border:1px solid var(--color-border,#E5E7EB);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);z-index:1000;overflow:hidden;max-height:280px;overflow-y:auto;">
              ${presets.map(p => {
                const active = p === currentDesignation;
                return `<button type="button" data-role="${p}" onclick="TeamScreen.selectRole('${p}')" style="width:100%;padding:10px 14px;border:none;background:${active?'var(--color-primary-50,#EFF6FF)':'transparent'};color:${active?'var(--color-primary-700,#1D4ED8)':'var(--color-text-primary,#111827)'};font-size:13.5px;font-weight:${active?'600':'500'};text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background 120ms;">
                  <svg class="role-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="flex-shrink:0;${active?'':'display:none;'}"><polyline points="20 6 9 17 4 12"/></svg>
                  <span class="role-spacer" style="width:14px;flex-shrink:0;${active?'display:none;':''}"></span>
                  <span>${p}</span>
                </button>`;
              }).join('')}
              <div style="height:1px;background:var(--color-border,#E5E7EB);margin:4px 0;"></div>
              <button type="button" data-role="__custom__" onclick="TeamScreen.selectRole('__custom__')" style="width:100%;padding:10px 14px;border:none;background:${!isPreset?'var(--color-primary-50,#EFF6FF)':'transparent'};color:${!isPreset?'var(--color-primary-700,#1D4ED8)':'var(--color-text-muted,#6B7280)'};font-size:13.5px;font-weight:${!isPreset?'600':'500'};text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background 120ms;">
                <svg class="role-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="flex-shrink:0;${!isPreset?'':'display:none;'}"><polyline points="20 6 9 17 4 12"/></svg>
                <span class="role-spacer" style="width:14px;flex-shrink:0;${!isPreset?'display:none;':''}"></span>
                <span>Custom Designation...</span>
              </button>
            </div>
            <input type="hidden" id="member-role-select" value="${isPreset ? currentDesignation : '__custom__'}">
          </div>
        </div>
        <div id="member-custom-designation-wrap" style="display:${isPreset?'none':'block'};">
          <label class="form-label" style="display:block;margin-bottom:4px;font-size:12px;font-weight:600;color:var(--color-text-secondary);">Custom Designation Title</label>
          <input type="text" id="member-custom-designation" class="form-input" placeholder="e.g. Lead Solutions Architect" value="${!isPreset?currentDesignation:''}" style="width:100%;height:42px;padding:0 14px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong,#D1D5DB);background:var(--color-surface,#FFF);color:var(--color-text-primary,#111827);font-size:14px;" />
        </div>
      </div>
    `;
    const footerHtml = `
      <button type="button" class="btn btn-danger btn-sm" onclick="Modal.closeAll();setTimeout(()=>TeamScreen.openRemoveMemberModal('${m.id}'),300);" style="margin-right:auto;">Remove</button>
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-primary" onclick="TeamScreen.saveMemberRole('${m.id}')">Save Changes</button>
    `;
    Modal.open(`Edit Role & Designation: ${m.name}`, bodyHtml, footerHtml);
  },

  _roleDropdownOpen: false,
  toggleRoleDropdown() {
    this._roleDropdownOpen = !this._roleDropdownOpen;
    const menu = document.getElementById('role-dropdown-menu');
    const btn = document.getElementById('role-dropdown-btn');
    if (menu) menu.style.display = this._roleDropdownOpen ? 'block' : 'none';
    if (btn) btn.style.borderColor = this._roleDropdownOpen ? 'var(--color-primary,#2563EB)' : '';
    if (this._roleDropdownOpen) {
      this._closeRoleDropdownHandler = (e) => {
        const wrap = document.getElementById('role-dropdown-wrap');
        if (wrap && !wrap.contains(e.target)) this.toggleRoleDropdown();
      };
      setTimeout(() => document.addEventListener('click', this._closeRoleDropdownHandler), 0);
    } else if (this._closeRoleDropdownHandler) {
      document.removeEventListener('click', this._closeRoleDropdownHandler);
      this._closeRoleDropdownHandler = null;
    }
  },
  selectRole(value) {
    const hiddenInput = document.getElementById('member-role-select');
    const label = document.getElementById('role-dropdown-label');
    const customWrap = document.getElementById('member-custom-designation-wrap');
    if (hiddenInput) hiddenInput.value = value;
    if (value === '__custom__') {
      if (label) label.textContent = 'Custom Designation...';
      if (customWrap) customWrap.style.display = 'block';
      const customInput = document.getElementById('member-custom-designation');
      if (customInput) setTimeout(() => customInput.focus(), 100);
    } else {
      if (label) label.textContent = value;
      if (customWrap) customWrap.style.display = 'none';
    }
    this._roleDropdownOpen = false;
    const menu = document.getElementById('role-dropdown-menu');
    if (menu) menu.style.display = 'none';
    const btn = document.getElementById('role-dropdown-btn');
    if (btn) btn.style.borderColor = '';
    // Update checkmarks via data-role attribute
    if (menu) {
      menu.querySelectorAll('[data-role]').forEach(item => {
        const role = item.getAttribute('data-role');
        const isActive = role === value;
        item.style.background = isActive ? 'var(--color-primary-50,#EFF6FF)' : 'transparent';
        item.style.color = isActive ? 'var(--color-primary-700,#1D4ED8)' : 'var(--color-text-primary,#111827)';
        item.style.fontWeight = isActive ? '600' : '500';
        const check = item.querySelector('.role-check');
        if (check) check.style.display = isActive ? 'inline' : 'none';
        const spacer = item.querySelector('.role-spacer');
        if (spacer) spacer.style.display = isActive ? 'none' : 'inline';
      });
    }
  },

  openEditMemberModal(memberId) { this.openEditRoleModal(memberId); },

  saveMemberRole(memberId) {
    const hiddenInput = document.getElementById('member-role-select');
    const customInput = document.getElementById('member-custom-designation');
    if (!hiddenInput) { Toast.show('Could not read role selection.', 'error'); return; }
    let finalDesignation = '';
    if (hiddenInput.value === '__custom__') {
      finalDesignation = (customInput ? customInput.value : '').trim();
      if (!finalDesignation) { Toast.show('Please enter a custom designation title.', 'error'); return; }
    } else { finalDesignation = hiddenInput.value.trim(); }
    if (!finalDesignation) { Toast.show('Please select a role.', 'error'); return; }
    const member = Store.getMember(memberId);
    if (!member) { Toast.show('Member not found.', 'error'); return; }

    // Build update payload — role and designation always stay in sync
    const updateData = { designation: finalDesignation, role: finalDesignation };

    // Use Store.updateMember to sync to Firebase
    Store.updateMember(memberId, updateData);

    // Also write directly to Firestore to avoid snapshot-listener race condition
    if (Store._db) {
      try {
        Store._db.collection('members').doc(String(memberId)).set({ role: finalDesignation, designation: finalDesignation, updatedAt: new Date().toISOString() }, { merge: true });
      } catch(e) {}
    }

    // Sync to Auth users so it persists across refresh
    if (typeof Auth !== 'undefined' && Array.isArray(Auth.users)) {
      const authUser = Auth.users.find(u => u.memberId === memberId || u.id === memberId || u.name === member.name);
      if (authUser) {
        authUser.designation = finalDesignation;
        authUser.title = finalDesignation;
        authUser.role = finalDesignation;
      }
    }
    Toast.show(`Updated designation for ${member.name} to "${finalDesignation}".`, 'success');
    Modal.closeAll();
    this.refresh();
  },

  // ─── Remove Member ───
  openRemoveMemberModal(memberId) {
    const m = Store.getMember(memberId);
    if (!m) { Toast.show('Member not found.', 'error'); return; }
    const memberTasks = this._getMemberTasks(m);
    const activeTasks = memberTasks.filter(t => t.status !== 'done');

    const bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--color-bg-page);border-radius:8px;border:1px solid var(--color-border);">
          <div class="avatar avatar-md" style="background:${m.color||'#7C3AED'};font-weight:700;">${m.initials||'??'}</div>
          <div style="min-width:0;flex:1;">
            <div style="font-weight:700;color:var(--color-text-primary);font-size:15px;">${m.name}</div>
            <div style="font-size:12px;color:var(--color-text-muted);">${m.email}</div>
          </div>
          <span class="badge badge-medium" style="font-size:11px;">${m.designation || m.role || 'AI Developer'}</span>
        </div>
        <div style="padding:14px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;">
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" width="20" height="20" style="flex-shrink:0;margin-top:1px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div>
              <div style="font-weight:700;color:#991B1B;font-size:14px;margin-bottom:4px;">Remove ${m.name} from the team?</div>
              <div style="font-size:13px;color:#7F1D1D;line-height:1.5;">
                This will remove them from all projects. 
                ${activeTasks.length > 0 ? `<strong style="color:#991B1B;">They have ${activeTasks.length} active task${activeTasks.length!==1?'s':''} that will become unassigned.</strong>` : 'They have no active tasks.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const footerHtml = `
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="TeamScreen.confirmRemoveMember('${m.id}')" style="background:#DC2626;color:white;border-color:#DC2626;">Remove Member</button>
    `;
    Modal.open(`Remove Member: ${m.name}`, bodyHtml, footerHtml);
  },

  confirmRemoveMember(memberId) {
    const m = Store.getMember(memberId);
    if (!m) return;

    // Store.deleteMember unassigns tasks, removes from array, syncs to Firebase
    Store.deleteMember(memberId);

    // Remove from Auth users too
    if (typeof Auth !== 'undefined' && Array.isArray(Auth.users)) {
      Auth.users = Auth.users.filter(u => u.memberId !== memberId && u.id !== memberId);
    }

    Toast.show(`${m.name} has been removed from the team.`, 'success');
    Modal.closeAll();
    this.refresh();
  },

  // ─── Get member's tasks matched by various ID schemes ───
  _getMemberTasks(member) {
    const tasks = Store.getTasks();
    return tasks.filter(t =>
      t.assigneeId === member.id ||
      (member.id === 'm2' && t.assigneeId === 'preet') ||
      (member.id === 'm3' && t.assigneeId === 'mohit') ||
      (member.id === 'm4' && t.assigneeId === 'hirvi') ||
      (member.name.includes('Preet') && t.assigneeId === 'preet') ||
      (member.name.includes('Mohit') && t.assigneeId === 'mohit') ||
      (member.name.includes('Hirvi') && t.assigneeId === 'hirvi')
    );
  },

  // ─── Group tasks by project ───
  _groupTasksByProject(tasks) {
    const groups = {};
    tasks.forEach(t => {
      const pid = t.projectId || '_unassigned';
      if (!groups[pid]) groups[pid] = [];
      groups[pid].push(t);
    });
    return groups;
  },

  // ─── Status stage pipeline for visual indicator ───
  _statusPipeline: ['todo', 'in-progress', 'review', 'done'],
  _statusColors: {
    'todo': { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' },
    'in-progress': { bg: '#EFF6FF', text: '#2563EB', dot: '#2563EB' },
    'review': { bg: '#FAF5FF', text: '#7C3AED', dot: '#7C3AED' },
    'done': { bg: '#EFF6FF', text: '#1D4ED8', dot: '#1D4ED8' }
  },

  _renderStatusBadge(status) {
    const s = this._statusColors[status] || this._statusColors['todo'];
    return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:2px 8px;border-radius:var(--radius-pill);background:${s.bg};color:${s.text};white-space:nowrap;"><span style="width:6px;height:6px;border-radius:50%;background:${s.dot};flex-shrink:0;"></span>${Utils.humanize(status)}</span>`;
  },

  _renderPriorityDot(priority) {
    return `<span class="priority-dot priority-${priority}" style="flex-shrink:0;"></span>`;
  },

  // ─── Render the stage pipeline bar for a task ───
  _renderStageBar(status) {
    const stages = this._statusPipeline;
    const currentIdx = stages.indexOf(status);
    return `<div style="display:flex;align-items:center;gap:3px;margin-top:6px;">
      ${stages.map((s, i) => {
        const isComplete = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const sc = this._statusColors[s];
        return `<div style="flex:1;height:4px;border-radius:2px;background:${isComplete ? sc.dot : '#E5E7EB'};${isCurrent ? 'box-shadow:0 0 0 2px ' + sc.dot + '33;' : ''}"></div>`;
      }).join('')}
    </div>`;
  },

  // ─── Open member profile modal with full work breakdown ───
  openMemberProfile(memberId) {
    const m = Store.getMember(memberId);
    if (!m) return;

    const memberTasks = this._getMemberTasks(m);
    const activeTasks = memberTasks.filter(t => t.status !== 'done');
    const completedTasks = memberTasks.filter(t => t.status === 'done');
    const overdueTasks = activeTasks.filter(t => Utils.isOverdue(t.dueDate));

    // Group by project
    const projectGroups = this._groupTasksByProject(activeTasks);
    const completedGroups = this._groupTasksByProject(completedTasks);

    const designationText = m.designation || m.role || 'AI Developer';

    const bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:20px;">
        <!-- Member Header -->
        <div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--color-bg-page);border-radius:var(--radius-md);border:1px solid var(--color-border);">
          <div class="avatar avatar-xl" style="background:${m.color};font-weight:700;font-size:20px;flex-shrink:0;width:56px;height:56px;display:flex;align-items:center;justify-content:center;border-radius:50%;">${m.initials || m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
          <div style="min-width:0;flex:1;">
            <div style="font-size:18px;font-weight:700;color:var(--color-text-primary);font-family:var(--font-display);">${m.name}</div>
            <div style="font-size:13px;color:var(--color-text-muted);font-weight:500;margin-top:2px;">${designationText}</div>
            <div style="font-size:12px;color:var(--color-text-disabled);margin-top:1px;">${m.email}</div>
          </div>
        </div>

        <!-- Work Summary Stats -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
          <div style="text-align:center;padding:14px 8px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);">
            <div style="font-family:var(--font-display);font-size:24px;font-weight:800;color:var(--color-text-primary);">${memberTasks.length}</div>
            <div style="font-size:11px;color:var(--color-text-muted);font-weight:600;margin-top:2px;">Total Tasks</div>
          </div>
          <div style="text-align:center;padding:14px 8px;background:var(--color-primary-50);border:1px solid var(--color-primary-200);border-radius:var(--radius-md);">
            <div style="font-family:var(--font-display);font-size:24px;font-weight:800;color:var(--color-primary);">${activeTasks.length}</div>
            <div style="font-size:11px;color:var(--color-primary-700);font-weight:600;margin-top:2px;">Active</div>
          </div>
          <div style="text-align:center;padding:14px 8px;background:${overdueTasks.length > 0 ? 'var(--color-error-50)' : 'var(--color-surface)'};border:1px solid ${overdueTasks.length > 0 ? 'var(--color-error-100)' : 'var(--color-border)'};border-radius:var(--radius-md);">
            <div style="font-family:var(--font-display);font-size:24px;font-weight:800;color:${overdueTasks.length > 0 ? 'var(--color-error-600)' : 'var(--color-text-primary)'};">${overdueTasks.length}</div>
            <div style="font-size:11px;color:${overdueTasks.length > 0 ? 'var(--color-error-600)' : 'var(--color-text-muted)'};font-weight:600;margin-top:2px;">Overdue</div>
          </div>
          <div style="text-align:center;padding:14px 8px;background:var(--color-success-50);border:1px solid var(--color-success-100);border-radius:var(--radius-md);">
            <div style="font-family:var(--font-display);font-size:24px;font-weight:800;color:var(--color-success-600);">${completedTasks.length}</div>
            <div style="font-size:11px;color:var(--color-success-700);font-weight:600;margin-top:2px;">Done</div>
          </div>
        </div>

        <!-- Active Work by Project -->
        ${Object.keys(projectGroups).length > 0 ? `
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--color-text-primary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" width="16" height="16"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
            Active Work by Project
          </div>
          ${Object.entries(projectGroups).map(([pid, tasks]) => {
            const proj = pid === '_unassigned' ? null : Store.getProject(pid);
            const projName = proj ? proj.name : 'Unassigned';
            const projProgress = proj ? proj.progress : 0;
            const todoCount = tasks.filter(t => t.status === 'todo').length;
            const ipCount = tasks.filter(t => t.status === 'in-progress').length;
            const revCount = tasks.filter(t => t.status === 'review').length;

            return `
            <div style="margin-bottom:14px;border:1px solid var(--color-border);border-radius:var(--radius-md);overflow:hidden;">
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--color-bg-page);border-bottom:1px solid var(--color-border);">
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="width:8px;height:8px;border-radius:2px;background:var(--color-primary);flex-shrink:0;"></div>
                  <span style="font-size:13px;font-weight:700;color:var(--color-text-primary);">${projName}</span>
                  <span style="font-size:11px;color:var(--color-text-muted);font-weight:500;">(${tasks.length} task${tasks.length!==1?'s':''})</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="display:flex;gap:6px;">
                    ${todoCount > 0 ? `<span style="font-size:10px;padding:1px 6px;border-radius:var(--radius-pill);background:#F1F5F9;color:#64748B;font-weight:600;">${todoCount} todo</span>` : ''}
                    ${ipCount > 0 ? `<span style="font-size:10px;padding:1px 6px;border-radius:var(--radius-pill);background:#EFF6FF;color:#2563EB;font-weight:600;">${ipCount} active</span>` : ''}
                    ${revCount > 0 ? `<span style="font-size:10px;padding:1px 6px;border-radius:var(--radius-pill);background:#FAF5FF;color:#7C3AED;font-weight:600;">${revCount} review</span>` : ''}
                  </div>
                </div>
              </div>
              <div style="padding:8px 14px;">
                ${tasks.map(t => `
                  <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--color-border-subtle);cursor:pointer;" onclick="Modal.closeAll();setTimeout(()=>TasksScreen.openDetailModal('${t.id}'),300);">
                    ${this._renderPriorityDot(t.priority)}
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:2px;">${t.title}</div>
                      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                        ${this._renderStatusBadge(t.status)}
                        ${t.dueDate ? `<span style="font-size:11px;color:${Utils.isOverdue(t.dueDate)?'var(--color-error-600)':'var(--color-text-muted)'};">${Icons.clock} ${Utils.formatDate(t.dueDate)}</span>` : ''}
                      </div>
                      ${this._renderStageBar(t.status)}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>`;
          }).join('')}
        </div>` : '<div style="font-size:13px;color:var(--color-text-muted);text-align:center;padding:20px;">No active tasks assigned</div>'}

        <!-- Recently Completed -->
        ${completedTasks.length > 0 ? `
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-success-500)" stroke-width="2" width="16" height="16"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Completed (${completedTasks.length})
          </div>
          <div style="max-height:180px;overflow-y:auto;">
            ${completedTasks.slice(0, 8).map(t => {
              const proj = Store.getProject(t.projectId);
              return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--color-border-subtle);">
                <div style="width:18px;height:18px;border-radius:50%;background:var(--color-success-50);border:2px solid var(--color-success-500);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-success-600)" stroke-width="3" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style="font-size:12px;color:var(--color-text-muted);text-decoration:line-through;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.title}</span>
                ${proj ? `<span style="font-size:10px;color:var(--color-text-disabled);flex-shrink:0;">${Utils.truncate(proj.name, 15)}</span>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}
      </div>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button type="button" class="btn btn-primary" onclick="Modal.closeAll();setTimeout(()=>App.navigate('tasks'),300);">View All Tasks</button>
    `;
    Modal.open(`Work Profile: ${m.name}`, bodyHtml, footerHtml, { large: true });
  },

  render() {
    const teamMembers = Store.getMembers();
    const tasks = Store.getTasks();
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = !currentUser || currentUser.role === 'Admin' || (typeof Store !== 'undefined' && Store._data?.settings?.currentUser === 'm1') || (currentUser && currentUser.id === 'ayush');

    // Filter out admin members
    const developersList = teamMembers.filter(member => member.role !== 'Admin');

    // Overall team stats
    const totalActiveTasks = developersList.reduce((sum, m) => sum + this._getMemberTasks(m).filter(t => t.status !== 'done').length, 0);
    const totalOverdueTasks = developersList.reduce((sum, m) => sum + this._getMemberTasks(m).filter(t => t.status !== 'done' && Utils.isOverdue(t.dueDate)).length, 0);

    return `
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div class="page-header-left">
          <h1>Team & Workload</h1>
          <p>${developersList.length} member${developersList.length===1?'':'s'} · ${totalActiveTasks} active task${totalActiveTasks===1?'':'s'}${totalOverdueTasks > 0 ? ` · <span style="color:var(--color-error-600)">${totalOverdueTasks} overdue</span>` : ''}</p>
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

      <!-- Team Work Grid -->
      <div class="team-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:20px">
        ${developersList.map(m => {
          const memberTasks = this._getMemberTasks(m);
          const activeTasks = memberTasks.filter(t => t.status !== 'done');
          const completedTasks = memberTasks.filter(t => t.status === 'done');
          const overdueTasks = activeTasks.filter(t => Utils.isOverdue(t.dueDate));
          const isYou = currentUser && (
            currentUser.id === m.id || currentUser.memberId === m.id ||
            (currentUser.id === 'preet' && (m.id === 'm2' || m.name.includes('Preet'))) ||
            (currentUser.id === 'mohit' && (m.id === 'm3' || m.name.includes('Mohit'))) ||
            (currentUser.id === 'hirvi' && (m.id === 'm4' || m.name.includes('Hirvi')))
          );
          const initials = m.initials || m.name.split(' ').map(w=>w[0]).join('').slice(0,2);
          const isExpanded = !!this._expandedMembers[m.id];
          const designationText = m.designation || m.role || 'AI Developer';

          // Group active tasks by project
          const projectGroups = this._groupTasksByProject(activeTasks);
          const projectCount = Object.keys(projectGroups).length;

          // Calculate overall progress
          const totalMemberTasks = memberTasks.length;
          const doneMemberTasks = completedTasks.length;
          const memberProgress = totalMemberTasks > 0 ? Math.round((doneMemberTasks / totalMemberTasks) * 100) : 0;

          // Status breakdown for mini pipeline
          const statusCounts = { 'todo': 0, 'in-progress': 0, 'review': 0, 'done': 0 };
          memberTasks.forEach(t => { if (statusCounts[t.status] !== undefined) statusCounts[t.status]++; });

          return `<div class="section-card team-card" style="padding:0;overflow:hidden;border:1px solid var(--color-border);border-radius:var(--radius-lg);">
            <!-- Card Header -->
            <div style="padding:20px 20px 16px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
              <div style="display:flex;align-items:center;gap:14px;min-width:0;flex:1;">
                <div class="avatar avatar-xl" style="background:${m.color};font-weight:700;font-size:18px;flex-shrink:0;width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:50%;">${initials}</div>
                <div style="min-width:0;flex:1;overflow:hidden;">
                  <div style="font-size:16px;font-weight:700;color:var(--color-text-primary);font-family:var(--font-display);text-overflow:ellipsis;white-space:nowrap;overflow:hidden;display:flex;align-items:center;gap:8px;" title="${m.name}">
                    ${m.name}
                    ${isYou ? '<span style="font-size:10px;background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200);padding:1px 7px;border-radius:var(--radius-pill);font-weight:600;flex-shrink:0;">You</span>' : ''}
                  </div>
                  <div style="font-size:12.5px;color:var(--color-text-muted);margin-top:1px;font-weight:500;" title="${designationText}">${designationText}</div>
                  <div style="font-size:11.5px;color:var(--color-text-disabled);margin-top:1px;" title="${m.email}">${m.email}</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
                <button type="button" class="btn btn-ghost btn-xs" onclick="TeamScreen.openMemberProfile('${m.id}')" title="View full work profile" style="font-size:11px;color:var(--color-primary-700);font-weight:600;padding:3px 8px;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface);display:inline-flex;align-items:center;gap:4px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Profile
                </button>
                ${isAdmin ? `
                  <button type="button" class="btn btn-ghost btn-xs" onclick="TeamScreen.openEditRoleModal('${m.id}')" title="Edit Role" style="font-size:11px;color:var(--color-text-muted);padding:3px 8px;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface);display:inline-flex;align-items:center;gap:4px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    Role
                  </button>
                  <button type="button" class="btn btn-ghost btn-xs" onclick="TeamScreen.openRemoveMemberModal('${m.id}')" title="Remove member" style="font-size:11px;color:#DC2626;padding:3px 8px;border:1px solid #FECACA;border-radius:var(--radius-sm);background:#FEF2F2;display:inline-flex;align-items:center;gap:4px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Remove
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Progress Bar -->
            <div style="padding:0 20px 16px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                <span style="font-size:11px;font-weight:600;color:var(--color-text-muted);">Overall Progress</span>
                <span style="font-size:12px;font-weight:700;color:var(--color-primary);">${memberProgress}%</span>
              </div>
              <div style="width:100%;height:6px;background:var(--color-bg-subtle);border-radius:var(--radius-pill);overflow:hidden;">
                <div style="width:${memberProgress}%;height:100%;background:var(--gradient-primary);border-radius:var(--radius-pill);transition:width 0.3s ease;"></div>
              </div>
            </div>

            <!-- Status Pipeline -->
            <div style="padding:0 20px 16px;">
              <div style="display:flex;gap:8px;">
                ${this._statusPipeline.map(s => {
                  const count = statusCounts[s];
                  const sc = this._statusColors[s];
                  return count > 0 ? `
                    <div style="flex:1;text-align:center;padding:8px 4px;background:${sc.bg};border-radius:var(--radius-sm);border:1px solid ${sc.dot}22;">
                      <div style="font-size:16px;font-weight:800;font-family:var(--font-display);color:${sc.text};">${count}</div>
                      <div style="font-size:9px;font-weight:600;color:${sc.text};text-transform:uppercase;letter-spacing:0.03em;">${Utils.humanize(s)}</div>
                    </div>
                  ` : '';
                }).join('')}
              </div>
            </div>

            <!-- Work by Project -->
            ${Object.keys(projectGroups).length > 0 ? `
            <div style="padding:0 20px 16px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <span style="font-size:11px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;">Work by Project (${projectCount})</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;">
                ${Object.entries(projectGroups).slice(0, isExpanded ? 99 : 3).map(([pid, projTasks]) => {
                  const proj = pid === '_unassigned' ? null : Store.getProject(pid);
                  const projName = proj ? proj.name : 'Unassigned';
                  const projDone = projTasks.filter(t => t.status === 'done').length;
                  const projProgress = projTasks.length > 0 ? Math.round((projDone / projTasks.length) * 100) : 0;

                  return `
                  <div style="border:1px solid var(--color-border);border-radius:var(--radius-sm);overflow:hidden;">
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--color-bg-page);cursor:pointer;" onclick="TeamScreen.toggleProjectGroup('${m.id}','${pid}',event)">
                      <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1;">
                        <div style="width:6px;height:6px;border-radius:2px;background:var(--color-primary);flex-shrink:0;"></div>
                        <span style="font-size:12px;font-weight:700;color:var(--color-text-primary);text-overflow:ellipsis;white-space:nowrap;overflow:hidden;" title="${projName}">${Utils.truncate(projName, 28)}</span>
                        <span style="font-size:10px;color:var(--color-text-muted);flex-shrink:0;">${projTasks.length}</span>
                      </div>
                      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                        <div style="width:40px;height:4px;background:var(--color-bg-subtle);border-radius:2px;overflow:hidden;">
                          <div style="width:${projProgress}%;height:100%;background:var(--color-primary);border-radius:2px;"></div>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-text-disabled)" stroke-width="2" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                    </div>
                    <div style="padding:6px 10px;">
                      ${projTasks.slice(0, 3).map(t => `
                        <div style="display:flex;align-items:center;gap:8px;padding:6px 0;${projTasks.indexOf(t) < projTasks.length - 1 ? 'border-bottom:1px solid var(--color-border-subtle);' : ''}cursor:pointer" onclick="TasksScreen.openDetailModal('${t.id}')">
                          ${this._renderPriorityDot(t.priority)}
                          <span style="flex:1;font-size:12px;color:var(--color-text-primary);font-weight:500;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;" title="${t.title}">${Utils.truncate(t.title, 32)}</span>
                          ${this._renderStatusBadge(t.status)}
                        </div>
                      `).join('')}
                      ${projTasks.length > 3 ? `
                        <div style="text-align:center;padding-top:4px;">
                          <button type="button" class="btn btn-ghost btn-xs" onclick="TeamScreen.toggleProjectGroup('${m.id}','${pid}',event)" style="font-size:10px;color:var(--color-primary-700);font-weight:600;">+${projTasks.length - 3} more</button>
                        </div>
                      ` : ''}
                    </div>
                  </div>`;
                }).join('')}
                ${!isExpanded && projectCount > 3 ? `
                  <button type="button" class="btn btn-ghost btn-xs" onclick="TeamScreen.toggleMemberTasks('${m.id}',event)" style="width:100%;color:var(--color-primary-700);font-weight:600;padding:6px;border:1px dashed var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface);display:flex;align-items:center;justify-content:center;gap:4px;font-size:11px;">
                    Show all ${projectCount} projects ▼
                  </button>
                ` : ''}
                ${isExpanded && projectCount > 3 ? `
                  <button type="button" class="btn btn-ghost btn-xs" onclick="TeamScreen.toggleMemberTasks('${m.id}',event)" style="width:100%;color:var(--color-primary-700);font-weight:600;padding:6px;border:1px dashed var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface);display:flex;align-items:center;justify-content:center;gap:4px;font-size:11px;">
                    Show less ▲
                  </button>
                ` : ''}
              </div>
            </div>` : `
            <div style="padding:16px 20px;text-align:center;">
              <div style="font-size:13px;color:var(--color-text-muted);">No tasks assigned yet</div>
              ${isAdmin ? `<button type="button" class="btn btn-ghost btn-xs" onclick="TasksScreen.openCreateModal()" style="margin-top:8px;font-size:11px;color:var(--color-primary-700);font-weight:600;">${Icons.plus || '+'} Assign Task</button>` : ''}
            </div>`}

            <!-- Completed Tasks Footer -->
            ${completedTasks.length > 0 ? `
            <div style="padding:10px 20px;border-top:1px solid var(--color-border);background:var(--color-bg-page);">
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <span style="font-size:11px;color:var(--color-text-muted);font-weight:500;display:flex;align-items:center;gap:4px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-success-500)" stroke-width="2" width="12" height="12"><polyline points="9 11 12 14 22 4"/></svg>
                  ${completedTasks.length} completed
                </span>
                <span style="font-size:11px;color:var(--color-text-muted);">${memberProgress}% done</span>
              </div>
            </div>` : ''}
          </div>`;
        }).join('')}
      </div>`;
  }
};
