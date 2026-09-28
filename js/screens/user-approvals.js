// ─── User Approvals Screen (Admin Only) ───
const UserApprovalsScreen = {
  _filter: 'all', // 'all' | 'pending' | 'approved' | 'rejected'

  setFilter(filter) {
    this._filter = filter;
    this.refresh();
  },

  refresh() {
    const content = document.getElementById('page-content');
    if (content && typeof App !== 'undefined' && App.currentScreen === 'user-approvals') {
      content.innerHTML = this.render();
    }
  },

  approveUser(userId) {
    const res = Auth.approveUser(userId);
    if (res.success) {
      Toast.show(`✅ User approved! They can now log in.`, 'success');
      this.refresh();
    } else {
      Toast.show(res.error || 'Failed to approve user.', 'error');
    }
  },

  rejectUser(userId) {
    const res = Auth.rejectUser(userId);
    if (res.success) {
      Toast.show(`User access rejected.`, 'success');
      this.refresh();
    } else {
      Toast.show(res.error || 'Failed to reject user.', 'error');
    }
  },

  removeUser(userId, userName) {
    if (!confirm(`Are you sure you want to permanently remove ${userName} from the system? This cannot be undone.`)) return;
    const res = Auth.removeUser(userId);
    if (res.success) {
      Toast.show(`${userName} has been removed from the system.`, 'success');
      this.refresh();
    } else {
      Toast.show(res.error || 'Failed to remove user.', 'error');
    }
  },

  openAddUserModal() {
    const bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:10px 14px;display:flex;align-items:flex-start;gap:8px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" width="16" height="16" style="flex-shrink:0;margin-top:1px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <div style="font-size:12px;color:#1E40AF;line-height:1.5;">
            <strong>Admin Direct Add</strong> — User will be pre-approved and can login immediately with the credentials you set.
          </div>
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Full Name <span style="color:#EF4444">*</span></label>
          <input type="text" id="admin-add-name" class="form-input" placeholder="e.g. John Smith" required style="width:100%;height:42px;padding:0 14px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong,#D1D5DB);background:var(--color-surface,#FFF);color:var(--color-text-primary,#111827);font-size:14px;" />
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Email Address <span style="color:#EF4444">*</span></label>
          <input type="email" id="admin-add-email" class="form-input" placeholder="e.g. john@hintonn.com" required style="width:100%;height:42px;padding:0 14px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong,#D1D5DB);background:var(--color-surface,#FFF);color:var(--color-text-primary,#111827);font-size:14px;" />
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Role</label>
          <select id="admin-add-role" style="width:100%;height:42px;padding:0 14px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong,#D1D5DB);background:var(--color-surface,#FFF);color:var(--color-text-primary,#111827);font-size:14px;font-weight:500;">
            <option value="AI Developer">AI Developer</option>
            <option value="Senior AI Engineer">Senior AI Engineer</option>
            <option value="Project Manager">Project Manager</option>
            <option value="Data Engineer">Data Engineer</option>
            <option value="QA Specialist">QA Specialist</option>
            <option value="UI/UX Designer">UI/UX Designer</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Login Password <span style="font-weight:400;color:var(--color-text-muted);font-size:11px;">(default: user@123)</span></label>
          <input type="password" id="admin-add-password" class="form-input" placeholder="user@123" value="user@123" style="width:100%;height:42px;padding:0 14px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong,#D1D5DB);background:var(--color-surface,#FFF);color:var(--color-text-primary,#111827);font-size:14px;" />
        </div>
      </div>
    `;
    const footerHtml = `
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-primary" onclick="UserApprovalsScreen.saveNewUser()">Add & Approve User</button>
    `;
    Modal.open('Add Team Member (Admin Direct)', bodyHtml, footerHtml);
  },

  saveNewUser() {
    const nameEl = document.getElementById('admin-add-name');
    const emailEl = document.getElementById('admin-add-email');
    const roleEl = document.getElementById('admin-add-role');
    const passEl = document.getElementById('admin-add-password');

    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const role = roleEl ? roleEl.value : 'AI Developer';
    const password = passEl ? passEl.value || 'user@123' : 'user@123';

    if (!name) { Toast.show('Please enter a name.', 'error'); return; }
    if (!email || !email.includes('@')) { Toast.show('Please enter a valid email.', 'error'); return; }

    const res = Auth.adminAddUser(name, email, role, password);
    if (res.success) {
      Toast.show(`✅ ${name} added and approved. Login ID: ${name.split(' ')[0]}`, 'success');
      Modal.closeAll();
      this.refresh();
    } else {
      Toast.show(res.error || 'Failed to add user.', 'error');
    }
  },

  approveGoogleRequest(reqId) {
    const res = Auth.approveGoogleRequest(reqId);
    if (res.success) {
      Toast.show(`✅ Google access approved for ${res.request.name}!`, 'success');
      this.refresh();
      if (typeof App !== 'undefined' && typeof App.updateNotifDot === 'function') {
        App.updateNotifDot();
      }
    } else {
      Toast.show(res.error || 'Failed to approve request.', 'error');
    }
  },

  rejectGoogleRequest(reqId) {
    const res = Auth.rejectGoogleRequest(reqId);
    if (res.success) {
      Toast.show(`Google access request rejected for ${res.request.name}.`, 'info');
      this.refresh();
      if (typeof App !== 'undefined' && typeof App.updateNotifDot === 'function') {
        App.updateNotifDot();
      }
    } else {
      Toast.show(res.error || 'Failed to reject request.', 'error');
    }
  },

  render() {
    const allUsers = Auth.getAllUsersWithStatus();
    const pending = allUsers.filter(u => !u.approved && !u.rejected);
    const approved = allUsers.filter(u => u.approved);
    const rejected = allUsers.filter(u => u.rejected);

    const googleRequests = Auth.getGoogleApprovalRequests();
    const pendingGoogle = googleRequests.filter(r => r.status === 'pending');
    const approvedGoogle = googleRequests.filter(r => r.status === 'approved');
    const rejectedGoogle = googleRequests.filter(r => r.status === 'rejected');

    const totalPendingCount = pending.length + pendingGoogle.length;

    let filtered = allUsers;
    if (this._filter === 'pending') filtered = pending;
    else if (this._filter === 'approved') filtered = approved;
    else if (this._filter === 'rejected') filtered = rejected;

    return `
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div class="page-header-left">
          <h1>User Approvals & Access Control</h1>
          <p>${totalPendingCount} pending authorization · ${approved.length + approvedGoogle.length} approved accounts</p>
        </div>
        <div class="page-header-right">
          <button type="button" class="btn btn-primary" onclick="UserApprovalsScreen.openAddUserModal()" style="display:inline-flex;align-items:center;gap:6px;font-weight:600;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Add Member (Direct)
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div style="display:flex;gap:4px;margin-bottom:20px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:4px;width:fit-content;">
        <button type="button" onclick="UserApprovalsScreen.setFilter('all')" style="padding:8px 16px;border-radius:var(--radius-sm);border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all 150ms;${this._filter === 'all' ? 'background:var(--color-surface);color:var(--color-text-primary);box-shadow:var(--shadow-sm);' : 'background:transparent;color:var(--color-text-muted);'}">
          All (${allUsers.length + googleRequests.length})
        </button>
        <button type="button" onclick="UserApprovalsScreen.setFilter('pending')" style="padding:8px 16px;border-radius:var(--radius-sm);border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all 150ms;${this._filter === 'pending' ? 'background:#FFF7ED;color:#C2410C;box-shadow:var(--shadow-sm);' : 'background:transparent;color:var(--color-text-muted);'}">
          ⏳ Pending (${totalPendingCount})
        </button>
        <button type="button" onclick="UserApprovalsScreen.setFilter('approved')" style="padding:8px 16px;border-radius:var(--radius-sm);border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all 150ms;${this._filter === 'approved' ? 'background:#EFF6FF;color:#1D4ED8;box-shadow:var(--shadow-sm);' : 'background:transparent;color:var(--color-text-muted);'}">
          ✅ Approved (${approved.length + approvedGoogle.length})
        </button>
        ${(rejected.length > 0 || rejectedGoogle.length > 0) ? `
        <button type="button" onclick="UserApprovalsScreen.setFilter('rejected')" style="padding:8px 16px;border-radius:var(--radius-sm);border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all 150ms;${this._filter === 'rejected' ? 'background:#FEF2F2;color:#DC2626;box-shadow:var(--shadow-sm);' : 'background:transparent;color:var(--color-text-muted);'}">
          ❌ Rejected (${rejected.length + rejectedGoogle.length})
        </button>
        ` : ''}
      </div>

      <!-- Google Login Approval Requests Section -->
      ${(googleRequests.length > 0 && (this._filter === 'all' || (this._filter === 'pending' && pendingGoogle.length > 0) || (this._filter === 'approved' && approvedGoogle.length > 0) || (this._filter === 'rejected' && rejectedGoogle.length > 0))) ? `
      <div style="margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
          <svg width="18" height="18" viewBox="0 0 24 24" style="flex-shrink:0;">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <h3 style="font-size:15px;font-weight:700;color:var(--color-text-primary);margin:0;">Google Single Sign-On Access Requests</h3>
          ${pendingGoogle.length > 0 ? `<span style="background:#FEF3C7;color:#92400E;font-size:11px;font-weight:700;padding:2px 8px;border-radius:var(--radius-pill);">${pendingGoogle.length} Pending</span>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${googleRequests
            .filter(r => this._filter === 'all' || r.status === this._filter)
            .map(r => this._renderGoogleRequestCard(r)).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Pending Standard Requests Section -->
      ${pending.length > 0 && (this._filter === 'all' || this._filter === 'pending') ? `
      <div style="margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
          <div style="width:8px;height:8px;border-radius:50%;background:#F59E0B;animation:pulse 2s infinite;"></div>
          <h3 style="font-size:15px;font-weight:700;color:var(--color-text-primary);margin:0;">Pending Workspace Accounts</h3>
          <span style="background:#FEF3C7;color:#92400E;font-size:11px;font-weight:700;padding:2px 8px;border-radius:var(--radius-pill);">${pending.length}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${pending.map(u => this._renderPendingCard(u)).join('')}
        </div>
      </div>
      ` : ''}

      <!-- All/Approved/Rejected Users List -->
      ${filtered.length > 0 ? `
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${filtered.map(u => this._renderUserRow(u)).join('')}
      </div>
      ` : `
      <div style="text-align:center;padding:60px 20px;">
        <div style="width:56px;height:56px;border-radius:50%;background:var(--color-bg-page);border:1px solid var(--color-border);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-text-disabled)" stroke-width="1.5" width="28" height="28"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div style="font-size:14px;font-weight:600;color:var(--color-text-muted);">No users match this filter</div>
      </div>
      `}

      <style>
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      </style>
    `;
  },

  _renderGoogleRequestCard(r) {
    const isPending = r.status === 'pending';
    const isApproved = r.status === 'approved';
    const isRejected = r.status === 'rejected';

    const statusBg = isApproved ? '#DCFCE7' : (isRejected ? '#FEE2E2' : '#FEF3C7');
    const statusColor = isApproved ? '#166534' : (isRejected ? '#991B1B' : '#92400E');
    const statusText = isApproved ? 'Approved' : (isRejected ? 'Rejected' : 'Pending Review');

    return `
      <div style="background:${isPending ? '#F0F7FF' : 'var(--color-surface)'};border:1px solid ${isPending ? '#BFDBFE' : 'var(--color-border)'};border-radius:var(--radius-md);padding:18px 20px;display:flex;align-items:center;gap:16px;box-shadow:var(--shadow-xs);">
        <div style="width:44px;height:44px;border-radius:50%;background:${r.color || '#2563EB'};color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0;">
          ${r.avatar || 'GU'}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px;">
            <span style="font-size:15px;font-weight:700;color:var(--color-text-primary);">${r.name}</span>
            <span class="badge" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:4px;">
              <svg width="12" height="12" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
              Google SSO
            </span>
            <span style="background:${statusBg};color:${statusColor};font-size:11px;font-weight:700;padding:2px 8px;border-radius:var(--radius-pill);">
              ${statusText}
            </span>
          </div>
          <div style="font-size:13px;color:var(--color-text-muted);">${r.email} · <span style="color:var(--color-text-primary);font-weight:500;">${r.department || 'Commercial PMO'}</span></div>
          <div style="font-size:11.5px;color:var(--color-text-disabled);margin-top:4px;display:flex;align-items:center;gap:12px;">
            <span>Requested: <strong>${Utils.timeAgo(r.requestedAt)}</strong></span>
            ${r.reviewedBy ? `<span>Reviewed by: <strong>${r.reviewedBy}</strong></span>` : ''}
          </div>
        </div>

        <div style="display:flex;gap:8px;flex-shrink:0;">
            ${!isApproved ? `
              <button type="button" onclick="UserApprovalsScreen.approveGoogleRequest('${r.id}')" class="btn btn-sm" style="background:#059669;color:#FFFFFF;border:none;font-weight:600;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:6px;cursor:pointer;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                Accept
              </button>
            ` : ''}
            ${!isRejected ? `
              <button type="button" onclick="UserApprovalsScreen.rejectGoogleRequest('${r.id}')" class="btn btn-sm" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;font-weight:600;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:6px;cursor:pointer;">
                Reject
              </button>
            ` : ''}
            ${isApproved ? `
              <span style="font-size:12px;font-weight:600;color:${statusColor};padding:6px 12px;border-radius:6px;background:${statusBg};">
                ✓ Access Granted
              </span>
            ` : ''}
        </div>
      </div>
    `;
  },

  _renderPendingCard(u) {
    const requestTime = u.requestDate ? Utils.timeAgo(u.requestDate) : 'recently';
    return `
      <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:var(--radius-md);padding:20px;display:flex;align-items:flex-start;gap:16px;">
        <div class="avatar avatar-lg" style="background:${u.color || '#F59E0B'};font-weight:700;font-size:16px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:50%;flex-shrink:0;">${u.initials || '??'}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:15px;font-weight:700;color:var(--color-text-primary);">${u.name}</span>
            <span style="background:#FEF3C7;color:#92400E;font-size:10px;font-weight:700;padding:2px 8px;border-radius:var(--radius-pill);text-transform:uppercase;letter-spacing:0.03em;">Pending</span>
          </div>
          <div style="font-size:13px;color:var(--color-text-muted);margin-top:2px;">${u.email}</div>
          <div style="font-size:11.5px;color:var(--color-text-disabled);margin-top:2px;display:flex;align-items:center;gap:12px;">
            <span>Role: <strong style="color:var(--color-text-muted);">${u.role}</strong></span>
            <span>Source: <strong style="color:var(--color-text-muted);">${u.requestSource || 'Sign Up'}</strong></span>
            <span>Requested: <strong style="color:var(--color-text-muted);">${requestTime}</strong></span>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;">
          <button type="button" onclick="UserApprovalsScreen.approveUser('${u.id}')" style="padding:8px 16px;border-radius:var(--radius-sm);border:1px solid #86EFAC;background:#DCFCE7;color:#166534;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 150ms;" onmouseover="this.style.background='#BBF7D0'" onmouseout="this.style.background='#DCFCE7'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
            Approve
          </button>
          <button type="button" onclick="UserApprovalsScreen.rejectUser('${u.id}')" style="padding:8px 12px;border-radius:var(--radius-sm);border:1px solid #FECACA;background:#FEF2F2;color:#991B1B;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all 150ms;" onmouseover="this.style.background='#FEE2E2'" onmouseout="this.style.background='#FEF2F2'">
            Reject
          </button>
        </div>
      </div>
    `;
  },

  _renderUserRow(u) {
    const statusColor = u.approved ? '#16A34A' : (u.rejected ? '#DC2626' : '#F59E0B');
    const statusBg = u.approved ? '#DCFCE7' : (u.rejected ? '#FEE2E2' : '#FEF3C7');
    const statusText = u.approved ? 'Approved' : (u.rejected ? 'Rejected' : 'Pending');
    const statusIcon = u.approved ? '✅' : (u.rejected ? '❌' : '⏳');
    const isCore = u.id === 'mohit' || u.memberId === 'm3' || u.id === 'ayush' || u.memberId === 'm1';

    return `
      <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);transition:border-color 150ms;" onmouseover="this.style.borderColor='var(--color-primary-200)'" onmouseout="this.style.borderColor='var(--color-border)'">
        <div class="avatar avatar-md" style="background:${u.color || '#94A3B8'};font-weight:700;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:50%;flex-shrink:0;">${u.initials || '??'}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:14px;font-weight:700;color:var(--color-text-primary);">${u.name}</span>
            ${isCore ? '<span style="font-size:10px;background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200);padding:1px 6px;border-radius:var(--radius-pill);font-weight:600;">Core</span>' : ''}
          </div>
          <div style="font-size:12.5px;color:var(--color-text-muted);margin-top:1px;">${u.email} · ${u.role}</div>
          ${u.requestDate ? `<div style="font-size:11px;color:var(--color-text-disabled);margin-top:1px;">Requested ${Utils.timeAgo(u.requestDate)} via ${u.requestSource || 'pre-configured'}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
          ${!isCore ? `
            <div style="display:flex;gap:4px;">
              ${!u.approved ? `
                <button type="button" onclick="UserApprovalsScreen.approveUser('${u.id}')" title="Approve" style="padding:6px 10px;border-radius:var(--radius-sm);border:1px solid #86EFAC;background:#DCFCE7;color:#166534;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:background 0.2s;" onmouseover="this.style.background='#BBF7D0'" onmouseout="this.style.background='#DCFCE7'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                  Approve
                </button>
              ` : `
                <button type="button" onclick="UserApprovalsScreen.approveUser('${u.id}')" title="Mark as Approved" style="padding:6px 10px;border-radius:var(--radius-sm);border:1px solid #86EFAC;background:#DCFCE7;color:#166534;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:background 0.2s;" onmouseover="this.style.background='#BBF7D0'" onmouseout="this.style.background='#DCFCE7'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                  Approved
                </button>
              `}
              ${!u.rejected ? `
                <button type="button" onclick="UserApprovalsScreen.rejectUser('${u.id}')" title="Reject" style="padding:6px 10px;border-radius:var(--radius-sm);border:1px solid #FECACA;background:#FEF2F2;color:#991B1B;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:background 0.2s;" onmouseover="this.style.background='#FEE2E2'" onmouseout="this.style.background='#FEF2F2'">
                  Reject
                </button>
              ` : `
                <button type="button" onclick="UserApprovalsScreen.rejectUser('${u.id}')" title="Mark as Rejected" style="padding:6px 10px;border-radius:var(--radius-sm);border:1px solid #FECACA;background:#FEF2F2;color:#991B1B;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:background 0.2s;" onmouseover="this.style.background='#FEE2E2'" onmouseout="this.style.background='#FEF2F2'">
                  Rejected
                </button>
              `}
              <button type="button" onclick="UserApprovalsScreen.removeUser('${u.id}','${u.name.replace(/'/g, "\\'")}')" title="Remove user" style="padding:6px 8px;border-radius:var(--radius-sm);border:1px solid #E5E7EB;background:var(--color-surface);color:var(--color-text-muted);font-size:12px;cursor:pointer;display:inline-flex;align-items:center;transition:background 0.2s;" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='var(--color-surface)'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          ` : `
            <span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;padding:4px 10px;border-radius:var(--radius-pill);background:${statusBg};color:${statusColor};">
              ${statusIcon} ${statusText}
            </span>
          `}
        </div>
      </div>
    `;
  }
};
