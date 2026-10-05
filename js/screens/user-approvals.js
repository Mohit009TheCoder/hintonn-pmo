const UserApprovalsScreen = {
  _filter: 'all', // 'all' | 'pending' | 'approved' | 'revoked' | 'rejected' | 'tenants'
  _isFetching: false,
  _lastFetchTime: 0,

  setFilter(filter) {
    this._filter = filter;
    this.refresh();
  },

  refresh() {
    if (typeof App !== 'undefined' && App.currentScreen !== 'user-approvals') {
      return;
    }
    // Prevent wiping active modal if one is open
    if (typeof Modal !== 'undefined' && Modal.isOpen()) {
      return;
    }
    const content = document.getElementById('page-content');
    if (content) {
      content.innerHTML = this.render();
    }
  },

  approveUser(userId) {
    const res = Auth.approveUser(userId);
    if (res.success) {
      Toast.show('User access approved successfully.', 'success');
      this.refresh();
      if (typeof App !== 'undefined' && typeof App.updateNotifDot === 'function') {
        App.updateNotifDot();
      }
    } else {
      Toast.show(res.error || 'Failed to approve user.', 'error');
    }
  },

  promptRejectUserAccess(userId, userName, userEmail) {
    if (!userName || !userEmail) {
      const user = (typeof Auth !== 'undefined' && Auth.users) ? Auth.users.find(u => u.id === userId) : null;
      if (user) {
        userName = user.name;
        userEmail = user.email || user.googleEmail;
      }
    }
    userName = userName || 'User';
    userEmail = userEmail || 'Account';

    const bodyHtml = `
      <div style="display:flex;align-items:flex-start;gap:14px;padding:4px 0;">
        <div style="width:44px;height:44px;border-radius:50%;background:#FEF2F2;border:1px solid #FECACA;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#DC2626;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div style="flex:1;">
          <p style="font-size:14px;color:var(--color-text-primary);line-height:1.6;margin:0 0 8px 0;">
            You are about to reject the access request for <strong>${Utils.escapeHtml(userName)}</strong> (${Utils.escapeHtml(userEmail)}).
          </p>
          <p style="font-size:13px;color:var(--color-text-muted);line-height:1.5;margin:0;">
            This user will not be granted access to the workspace.
          </p>
        </div>
      </div>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-danger" style="background:#DC2626;color:#FFF;border-color:#DC2626;font-weight:600;" onclick="UserApprovalsScreen.confirmRejectUserAccess('${userId}')">Reject Request</button>
    `;

    Modal.open('Reject Access Request?', bodyHtml, footerHtml);
  },

  confirmRejectUserAccess(userId) {
    Modal.closeAll();
    const res = Auth.rejectUser(userId);
    if (res.success) {
      Toast.show('Access request rejected.', 'success');
      this.refresh();
      if (typeof App !== 'undefined' && typeof App.updateNotifDot === 'function') {
        App.updateNotifDot();
      }
    } else {
      Toast.show(res.error || 'Failed to reject user.', 'error');
    }
  },

  promptRevokeUserAccess(userId, userName, userEmail) {
    if (!userName || !userEmail) {
      const user = (typeof Auth !== 'undefined' && Auth.users) ? Auth.users.find(u => u.id === userId) : null;
      if (user) {
        userName = user.name;
        userEmail = user.email || user.googleEmail;
      }
    }
    userName = userName || 'User';
    userEmail = userEmail || 'Account';

    const bodyHtml = `
      <div style="display:flex;align-items:flex-start;gap:14px;padding:4px 0;">
        <div style="width:44px;height:44px;border-radius:50%;background:#FEF2F2;border:1px solid #FECACA;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#DC2626;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <div style="flex:1;">
          <p style="font-size:14px;color:var(--color-text-primary);line-height:1.6;margin:0 0 8px 0;">
            You are about to revoke access for <strong>${Utils.escapeHtml(userName)}</strong> (${Utils.escapeHtml(userEmail)}).
          </p>
          <p style="font-size:13px;color:var(--color-text-muted);line-height:1.5;margin:0;">
            Once revoked, this user will no longer have active access to the application until administrator approval is granted again.
          </p>
        </div>
      </div>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-danger" style="background:#DC2626;color:#FFF;border-color:#DC2626;font-weight:600;" onclick="UserApprovalsScreen.confirmRevokeUserAccess('${userId}')">Revoke Access</button>
    `;

    Modal.open('Revoke Access?', bodyHtml, footerHtml);
  },

  confirmRevokeUserAccess(userId) {
    Modal.closeAll();
    const res = Auth.revokeUser(userId);
    if (res.success) {
      Toast.show('Access revoked successfully.', 'success');
      this.refresh();
      if (typeof App !== 'undefined' && typeof App.updateNotifDot === 'function') {
        App.updateNotifDot();
      }
    } else {
      Toast.show(res.error || 'Failed to revoke access.', 'error');
    }
  },

  promptRejectGoogleAccess(reqId, userName, userEmail) {
    if (!userName || !userEmail) {
      const requests = (typeof Auth !== 'undefined' && Auth.getGoogleApprovalRequests) ? Auth.getGoogleApprovalRequests() : [];
      const req = requests.find(r => r.id === reqId) || ((typeof Auth !== 'undefined' && Auth.users) ? Auth.users.find(u => u.id === reqId || u.email === reqId) : null);
      if (req) {
        userName = req.name;
        userEmail = req.email || req.googleEmail;
      }
    }
    userName = userName || 'User';
    userEmail = userEmail || 'Google Account';

    const bodyHtml = `
      <div style="display:flex;align-items:flex-start;gap:14px;padding:4px 0;">
        <div style="width:44px;height:44px;border-radius:50%;background:#FEF2F2;border:1px solid #FECACA;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#DC2626;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div style="flex:1;">
          <p style="font-size:14px;color:var(--color-text-primary);line-height:1.6;margin:0 0 8px 0;">
            You are about to reject the access request for <strong>${Utils.escapeHtml(userName)}</strong> (${Utils.escapeHtml(userEmail)}).
          </p>
          <p style="font-size:13px;color:var(--color-text-muted);line-height:1.5;margin:0;">
            This user will not be granted access to the workspace.
          </p>
        </div>
      </div>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-danger" style="background:#DC2626;color:#FFF;border-color:#DC2626;font-weight:600;" onclick="UserApprovalsScreen.confirmRejectGoogleAccess('${reqId}')">Reject Request</button>
    `;

    Modal.open('Reject Access Request?', bodyHtml, footerHtml);
  },

  confirmRejectGoogleAccess(reqId) {
    Modal.closeAll();
    const res = Auth.rejectGoogleRequest(reqId);
    if (res.success) {
      Toast.show('Access request rejected.', 'success');
      this.refresh();
      if (typeof App !== 'undefined' && typeof App.updateNotifDot === 'function') {
        App.updateNotifDot();
      }
    } else {
      Toast.show(res.error || 'Failed to reject request.', 'error');
    }
  },

  promptRevokeGoogleAccess(reqId, userName, userEmail) {
    if (!userName || !userEmail) {
      const requests = (typeof Auth !== 'undefined' && Auth.getGoogleApprovalRequests) ? Auth.getGoogleApprovalRequests() : [];
      const req = requests.find(r => r.id === reqId) || ((typeof Auth !== 'undefined' && Auth.users) ? Auth.users.find(u => u.id === reqId || u.email === reqId) : null);
      if (req) {
        userName = req.name;
        userEmail = req.email || req.googleEmail;
      }
    }
    userName = userName || 'User';
    userEmail = userEmail || 'Google Account';

    const bodyHtml = `
      <div style="display:flex;align-items:flex-start;gap:14px;padding:4px 0;">
        <div style="width:44px;height:44px;border-radius:50%;background:#FEF2F2;border:1px solid #FECACA;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#DC2626;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <div style="flex:1;">
          <p style="font-size:14px;color:var(--color-text-primary);line-height:1.6;margin:0 0 8px 0;">
            You are about to revoke access for <strong>${Utils.escapeHtml(userName)}</strong> (${Utils.escapeHtml(userEmail)}).
          </p>
          <p style="font-size:13px;color:var(--color-text-muted);line-height:1.5;margin:0;">
            Once revoked, this user's Google account access will be deactivated until administrator approval is granted again.
          </p>
        </div>
      </div>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-danger" style="background:#DC2626;color:#FFF;border-color:#DC2626;font-weight:600;" onclick="UserApprovalsScreen.confirmRevokeGoogleAccess('${reqId}')">Revoke Access</button>
    `;

    Modal.open('Revoke Access?', bodyHtml, footerHtml);
  },

  confirmRevokeGoogleAccess(reqId) {
    Modal.closeAll();
    const res = Auth.revokeGoogleRequest(reqId);
    if (res.success) {
      Toast.show('Access revoked successfully.', 'success');
      this.refresh();
      if (typeof App !== 'undefined' && typeof App.updateNotifDot === 'function') {
        App.updateNotifDot();
      }
    } else {
      Toast.show(res.error || 'Failed to revoke access.', 'error');
    }
  },

  rejectUser(userId) {
    const res = Auth.rejectUser(userId);
    if (res.success) {
      Toast.show('Access request rejected.', 'success');
      this.refresh();
    } else {
      Toast.show(res.error || 'Failed to reject user.', 'error');
    }
  },

  removeUser(userId, userName) {
    const displayName = userName || 'this user';
    if (!confirm(`Are you sure you want to permanently remove ${displayName} from the system? This cannot be undone.`)) return;
    const res = Auth.removeUser(userId);
    if (res.success) {
      Toast.show(`${displayName} has been removed from the system.`, 'success');
      this.refresh();
    } else {
      Toast.show(res.error || 'Failed to remove user.', 'error');
    }
  },

  openAddUserModal() {
    const isSuper = typeof Auth !== 'undefined' && Auth.isSuperAdmin();
    const companies = Store.getCompanies();
    const currentCompId = typeof Auth !== 'undefined' ? Auth.getCompanyId() : 'comp_hintonn';
    const currentCompName = typeof Auth !== 'undefined' ? Auth.getCompanyName() : 'Hintonn PMO';
    const teams = Store.getTeams();

    const bodyHtml = `
      <form id="admin-add-user-form" onsubmit="event.preventDefault(); UserApprovalsScreen.saveNewUser();" style="display:flex;flex-direction:column;gap:14px;">
        <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:10px 14px;display:flex;align-items:flex-start;gap:8px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" width="16" height="16" style="flex-shrink:0;margin-top:1px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <div style="font-size:12px;color:#1E40AF;line-height:1.5;">
            <strong>Tenant-Isolated Direct Add</strong> — User will be pre-approved under the designated company partition.
          </div>
        </div>

        ${isSuper ? `
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Tenant Company <span style="color:#EF4444">*</span></label>
          <select id="admin-add-company" style="width:100%;height:42px;padding:0 14px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);background:var(--color-surface);color:var(--color-text-primary);font-size:14px;font-weight:500;">
            ${companies.map(c => `
              <option value="${c.id}" ${c.id === currentCompId ? 'selected' : ''}>${Utils.escapeHtml(c.name)} (${c.id})</option>
            `).join('')}
          </select>
        </div>
        ` : `
        <div style="padding:10px 12px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);">
          <span style="font-size:12px;color:var(--color-text-muted);">Assigned Tenant Company:</span>
          <div style="font-size:14px;font-weight:700;color:var(--color-text-primary);margin-top:2px;">🏢 ${Utils.escapeHtml(currentCompName)}</div>
          <input type="hidden" id="admin-add-company" value="${currentCompId}">
        </div>
        `}

        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Full Name <span style="color:#EF4444">*</span></label>
          <input type="text" id="admin-add-name" class="form-input" placeholder="e.g. John Smith" required autofocus style="width:100%;height:42px;padding:0 14px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);background:var(--color-surface);color:var(--color-text-primary);font-size:14px;" />
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Email Address <span style="color:#EF4444">*</span></label>
          <input type="email" id="admin-add-email" class="form-input" placeholder="e.g. john@hintonn.com" required style="width:100%;height:42px;padding:0 14px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);background:var(--color-surface);color:var(--color-text-primary);font-size:14px;" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Role</label>
            <select id="admin-add-role" style="width:100%;height:42px;padding:0 12px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);background:var(--color-surface);color:var(--color-text-primary);font-size:13.5px;font-weight:500;">
              <option value="AI Developer">AI Developer</option>
              <option value="Senior AI Engineer">Senior AI Engineer</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Data Engineer">Data Engineer</option>
              <option value="QA Specialist">QA Specialist</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Team Squad</label>
            <select id="admin-add-team" style="width:100%;height:42px;padding:0 12px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);background:var(--color-surface);color:var(--color-text-primary);font-size:13.5px;font-weight:500;">
              ${teams.map(t => `
                <option value="${t.id}">${Utils.escapeHtml(t.name)}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Account Setup</label>
          <div style="font-size:12px;color:var(--color-text-muted);line-height:1.5;padding:10px 12px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);">The team member sets their own password when they sign up — no default or shared passwords are assigned.</div>
        </div>
      </form>
    `;
    const footerHtml = `
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-primary" onclick="UserApprovalsScreen.saveNewUser()">Add & Approve User</button>
    `;
    Modal.open('Add Team Member (Direct Tenant Provisioning)', bodyHtml, footerHtml);
  },

  saveNewUser() {
    const nameEl = document.getElementById('admin-add-name');
    const emailEl = document.getElementById('admin-add-email');
    const roleEl = document.getElementById('admin-add-role');
    const compEl = document.getElementById('admin-add-company');
    const teamEl = document.getElementById('admin-add-team');

    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const role = roleEl ? roleEl.value : 'AI Developer';
    const compId = compEl ? compEl.value : 'comp_hintonn';
    const teamId = teamEl ? teamEl.value : 'team_ai';

    if (!name) { Toast.show('Please enter a name.', 'error'); return; }
    if (!email || !email.includes('@')) { Toast.show('Please enter a valid email.', 'error'); return; }

    const res = Auth.adminAddUser(name, email, role, compId, teamId);
    if (res && res.success) {
      Toast.show(`✅ ${name} added and approved under tenant partition.`, 'success');
      Modal.closeAll();
      this.refresh();
    } else {
      Toast.show(res ? res.error : 'Failed to add user.', 'error');
    }
  },

  approveGoogleRequest(reqId) {
    const res = Auth.approveGoogleRequest(reqId);
    if (res && res.success) {
      Toast.show('Google access approved successfully.', 'success');
      this.refresh();
      if (typeof App !== 'undefined' && typeof App.updateNotifDot === 'function') {
        App.updateNotifDot();
      }
    } else {
      Toast.show(res ? res.error : 'Failed to approve request.', 'error');
    }
  },

  rejectGoogleRequest(reqId) {
    const reqs = Auth.getGoogleApprovalRequests();
    const req = reqs.find(r => r.id === reqId);
    const name = req ? req.name : 'User';
    const email = req ? req.email : 'Google Account';
    this.promptRejectGoogleAccess(reqId, name, email);
  },

  // ─── Super Admin Company Admin Assignment ───
  openAssignAdminModal() {
    const companies = Store.getCompanies();
    const bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="padding:10px 12px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:var(--radius-md);font-size:12.5px;color:#1E40AF;line-height:1.5;">
          Assigning a Company Admin delegates isolated tenant control over projects, tasks, issues, invoices, and approvals for that specific company.
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Tenant Company <span style="color:#EF4444">*</span></label>
          <select id="assign-admin-comp" style="width:100%;height:40px;padding:0 12px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);font-size:14px;">
            ${companies.map(c => `
              <option value="${c.id}">${Utils.escapeHtml(c.name)} (${c.id})</option>
            `).join('')}
          </select>
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Admin Email Address <span style="color:#EF4444">*</span></label>
          <input type="email" id="assign-admin-email" class="form-input" placeholder="e.g. lead.admin@company.com" required style="width:100%;height:40px;padding:0 12px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);font-size:14px;" />
        </div>
        <div>
          <label class="form-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--color-text-primary);">Admin Full Name</label>
          <input type="text" id="assign-admin-name" class="form-input" placeholder="e.g. Ramesh Sharma" style="width:100%;height:40px;padding:0 12px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);font-size:14px;" />
        </div>
      </div>
    `;
    const footerHtml = `
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-primary" onclick="UserApprovalsScreen.confirmAssignAdmin()">Assign Company Admin</button>
    `;
    Modal.open('Assign Company Admin', bodyHtml, footerHtml);
  },

  confirmAssignAdmin() {
    const compEl = document.getElementById('assign-admin-comp');
    const emailEl = document.getElementById('assign-admin-email');
    const nameEl = document.getElementById('assign-admin-name');

    const compId = compEl ? compEl.value : '';
    const email = emailEl ? emailEl.value.trim().toLowerCase() : '';
    const name = nameEl ? nameEl.value.trim() : 'Company Admin';

    if (!email || !email.includes('@')) {
      Toast.show('Please enter a valid email address.', 'error');
      return;
    }
    if (!compId) {
      Toast.show('Please select a tenant company.', 'error');
      return;
    }

    Store.assignCompanyAdmin(email, compId, name);
    Toast.show(`Assigned ${name} (${email}) as admin for ${compId}.`, 'success');
    Modal.closeAll();
    this.refresh();
  },

  revokeCompanyAdmin(adminId, email) {
    if (!confirm(`Are you sure you want to revoke Company Admin privileges for ${email || 'this admin'}?`)) return;
    Store.revokeCompanyAdmin(adminId);
    Toast.show('Company Admin access revoked.', 'success');
    this.refresh();
  },

  render() {
    // Fetch pending users from Firestore in background (debounced)
    const now = Date.now();
    if (typeof Auth !== 'undefined' && Auth.fetchPendingUsersFromFirestore && !this._isFetching && (now - this._lastFetchTime > 30000)) {
      this._isFetching = true;
      this._lastFetchTime = now;
      Auth.fetchPendingUsersFromFirestore().then(() => {
        this._isFetching = false;
        if (typeof App !== 'undefined' && App.currentScreen === 'user-approvals' && typeof Modal !== 'undefined' && !Modal.isOpen()) {
          this.refresh();
        }
      }).catch(() => {
        this._isFetching = false;
      });
    }

    const isSuper = typeof Auth !== 'undefined' && Auth.isSuperAdmin();
    const userCompId = typeof Auth !== 'undefined' ? Auth.getCompanyId() : 'comp_hintonn';
    const userCompName = typeof Auth !== 'undefined' ? Auth.getCompanyName() : 'Hintonn PMO';
    const activeCompId = Store.getActiveCompanyId();

    // ─── Multi-Tenant Isolation Filter ───
    let allUsers = Auth.getAllUsersWithStatus();
    let googleRequests = Auth.getGoogleApprovalRequests();

    if (!isSuper) {
      // Company Admin: strictly scoped to own company partition
      allUsers = allUsers.filter(u => (u.companyId || 'comp_hintonn') === userCompId);
      googleRequests = googleRequests.filter(r => (r.companyId || 'comp_hintonn') === userCompId);
    } else if (activeCompId !== 'all') {
      // Super Admin: filtered to currently active selected company
      allUsers = allUsers.filter(u => (u.companyId || 'comp_hintonn') === activeCompId);
      googleRequests = googleRequests.filter(r => (r.companyId || 'comp_hintonn') === activeCompId);
    }

    // If Super Admin selected the Tenants & Admins view
    if (isSuper && this._filter === 'tenants') {
      return this._renderTenantsManagementView();
    }

    const pending = allUsers.filter(u => !u.approved && !u.rejected && !u.revoked);
    const approved = allUsers.filter(u => u.approved && !u.revoked);
    const revoked = allUsers.filter(u => u.revoked);
    const rejected = allUsers.filter(u => u.rejected && !u.revoked);

    const pendingGoogle = googleRequests.filter(r => r.status === 'pending');
    const approvedGoogle = googleRequests.filter(r => r.status === 'approved');
    const revokedGoogle = googleRequests.filter(r => r.status === 'revoked');
    const rejectedGoogle = googleRequests.filter(r => r.status === 'rejected');

    const totalPendingCount = pending.length + pendingGoogle.length;
    const totalApprovedCount = approved.length + approvedGoogle.length;
    const totalRevokedCount = revoked.length + revokedGoogle.length;
    const totalRejectedCount = rejected.length + rejectedGoogle.length;

    let filtered = allUsers;
    if (this._filter === 'pending') filtered = pending;
    else if (this._filter === 'approved') filtered = approved;
    else if (this._filter === 'revoked') filtered = revoked;
    else if (this._filter === 'rejected') filtered = rejected;

    return `
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div class="page-header-left">
          <div style="display:flex;align-items:center;gap:10px;">
            <h1>User Approvals & Access Control</h1>
            ${!isSuper ? `<span class="badge" style="background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;font-size:12px;">🏢 ${Utils.escapeHtml(userCompName)}</span>` : '<span class="badge" style="background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;font-size:12px;">⚡ Platform Super Admin</span>'}
          </div>
          <p>${totalPendingCount} pending authorization · ${totalApprovedCount} active approved accounts · ${totalRevokedCount} revoked</p>
        </div>
        <div class="page-header-right" style="display:flex;align-items:center;gap:10px;">
          <button type="button" class="btn btn-primary" onclick="UserApprovalsScreen.openAddUserModal()" style="display:inline-flex;align-items:center;gap:6px;font-weight:600;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Add Member (Direct)
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div style="display:flex;gap:4px;margin-bottom:20px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:4px;width:fit-content;flex-wrap:wrap;">
        <button type="button" onclick="UserApprovalsScreen.setFilter('all')" style="padding:8px 16px;border-radius:var(--radius-sm);border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all 150ms;${this._filter === 'all' ? 'background:var(--color-surface);color:var(--color-text-primary);box-shadow:var(--shadow-sm);' : 'background:transparent;color:var(--color-text-muted);'}">
          All (${allUsers.length + googleRequests.length})
        </button>
        <button type="button" onclick="UserApprovalsScreen.setFilter('pending')" style="padding:8px 16px;border-radius:var(--radius-sm);border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all 150ms;${this._filter === 'pending' ? 'background:#FFF7ED;color:#C2410C;box-shadow:var(--shadow-sm);' : 'background:transparent;color:var(--color-text-muted);'}">
          ⏳ Pending (${totalPendingCount})
        </button>
        <button type="button" onclick="UserApprovalsScreen.setFilter('approved')" style="padding:8px 16px;border-radius:var(--radius-sm);border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all 150ms;${this._filter === 'approved' ? 'background:#EFF6FF;color:#1D4ED8;box-shadow:var(--shadow-sm);' : 'background:transparent;color:var(--color-text-muted);'}">
          ✅ Approved (${totalApprovedCount})
        </button>
        ${totalRevokedCount > 0 ? `
        <button type="button" onclick="UserApprovalsScreen.setFilter('revoked')" style="padding:8px 16px;border-radius:var(--radius-sm);border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all 150ms;${this._filter === 'revoked' ? 'background:#FEF2F2;color:#DC2626;box-shadow:var(--shadow-sm);' : 'background:transparent;color:var(--color-text-muted);'}">
          🚫 Revoked (${totalRevokedCount})
        </button>
        ` : ''}
        ${totalRejectedCount > 0 ? `
        <button type="button" onclick="UserApprovalsScreen.setFilter('rejected')" style="padding:8px 16px;border-radius:var(--radius-sm);border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all 150ms;${this._filter === 'rejected' ? 'background:#F8FAFC;color:#64748B;box-shadow:var(--shadow-sm);' : 'background:transparent;color:var(--color-text-muted);'}">
          ❌ Rejected (${totalRejectedCount})
        </button>
        ` : ''}
        ${isSuper ? `
        <button type="button" onclick="UserApprovalsScreen.setFilter('tenants')" style="padding:8px 16px;border-radius:var(--radius-sm);border:none;font-size:13px;font-weight:700;cursor:pointer;transition:all 150ms;background:#FEF3C7;color:#92400E;display:inline-flex;align-items:center;gap:6px;">
          <span>🏢</span>
          <span>Tenant Portals & Admins</span>
        </button>
        ` : ''}
      </div>

      <!-- Google Login Approval Requests Section -->
      ${(googleRequests.length > 0 && (this._filter === 'all' || (this._filter === 'pending' && pendingGoogle.length > 0) || (this._filter === 'approved' && approvedGoogle.length > 0) || (this._filter === 'revoked' && revokedGoogle.length > 0) || (this._filter === 'rejected' && rejectedGoogle.length > 0))) ? `
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

      <!-- All/Approved/Revoked/Rejected Users List -->
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

  _renderTenantsManagementView() {
    const companies = Store.getCompanies();
    const admins = Store.getAdmins();
    const superAdmins = Store.getSuperAdmins();
    const allProjects = Store.getProjects();

    return `
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div class="page-header-left">
          <div style="display:flex;align-items:center;gap:10px;">
            <h1>Tenant Portals & Platform Administration</h1>
            <span class="badge" style="background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;font-size:12px;">Super Admin Control</span>
          </div>
          <p>Global oversight of tenant companies, company admins, and cross-organization isolation</p>
        </div>
        <div class="page-header-right" style="display:flex;gap:10px;">
          <button type="button" class="btn btn-secondary" onclick="UserApprovalsScreen.setFilter('all')">
            ← Back to User Approvals
          </button>
          <button type="button" class="btn btn-primary" onclick="Topbar.openNewCompanyModal()">
            + Provision Company
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div style="display:flex;gap:4px;margin-bottom:24px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:4px;width:fit-content;">
        <button type="button" onclick="UserApprovalsScreen.setFilter('all')" style="padding:8px 16px;border-radius:var(--radius-sm);border:none;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:var(--color-text-muted);">
          User Accounts
        </button>
        <button type="button" onclick="UserApprovalsScreen.setFilter('tenants')" style="padding:8px 16px;border-radius:var(--radius-sm);border:none;font-size:13px;font-weight:700;cursor:pointer;background:var(--color-surface);color:var(--color-text-primary);box-shadow:var(--shadow-sm);">
          🏢 Tenant Portals & Admins
        </button>
      </div>

      <!-- Provisioned Tenant Companies -->
      <div class="section-card" style="margin-bottom:28px;padding:24px;border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div>
            <h3 style="font-size:16px;font-weight:700;color:var(--color-text-primary);margin:0 0 4px 0;">🏢 Provisioned Tenant Companies (${companies.length})</h3>
            <p style="font-size:13px;color:var(--color-text-muted);margin:0;">Isolated tenant spaces with partitioned projects, financials, and team squads</p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="Topbar.openNewCompanyModal()">+ Add Company</button>
        </div>

        <div style="overflow-x:auto;">
          <table class="data-table" style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="border-bottom:2px solid var(--color-border);text-align:left;color:var(--color-text-muted);">
                <th style="padding:10px 14px;">Company Name</th>
                <th style="padding:10px 14px;">Tenant Code</th>
                <th style="padding:10px 14px;">Industry</th>
                <th style="padding:10px 14px;">Domain</th>
                <th style="padding:10px 14px;">Projects</th>
                <th style="padding:10px 14px;">Assigned Admins</th>
                <th style="padding:10px 14px;">Switch Context</th>
              </tr>
            </thead>
            <tbody>
              ${companies.map(c => {
                const compProjects = allProjects.filter(p => (p.companyId || 'comp_hintonn') === c.id);
                const compAdmins = admins.filter(a => a.companyId === c.id);
                const isCurrent = Store.getActiveCompanyId() === c.id;
                return `
                  <tr style="border-bottom:1px solid var(--color-border-subtle);background:${isCurrent ? 'var(--color-primary-50)' : 'transparent'};">
                    <td style="padding:12px 14px;font-weight:700;color:var(--color-text-primary);">
                      🏢 ${Utils.escapeHtml(c.name)}
                    </td>
                    <td style="padding:12px 14px;"><code>${Utils.escapeHtml(c.id)}</code></td>
                    <td style="padding:12px 14px;color:var(--color-text-secondary);">${Utils.escapeHtml(c.industry || 'Infrastructure')}</td>
                    <td style="padding:12px 14px;color:var(--color-text-muted);">${Utils.escapeHtml(c.domain || '—')}</td>
                    <td style="padding:12px 14px;">
                      <span class="badge" style="background:#EFF6FF;color:#1D4ED8;font-weight:700;">${compProjects.length} Projects</span>
                    </td>
                    <td style="padding:12px 14px;">
                      ${compAdmins.length > 0 ? compAdmins.map(a => `<span class="badge" style="background:#ECFDF5;color:#047857;margin-right:4px;">${Utils.escapeHtml(a.email)}</span>`).join('') : '<span style="color:var(--color-text-disabled)">None assigned</span>'}
                    </td>
                    <td style="padding:12px 14px;">
                      <button type="button" class="btn btn-xs ${isCurrent ? 'btn-primary' : 'btn-secondary'}" onclick="Topbar.switchCompany('${c.id}')">
                        ${isCurrent ? '✓ Active' : 'Enter Portal'}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Company Admins Table -->
      <div class="section-card" style="margin-bottom:28px;padding:24px;border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div>
            <h3 style="font-size:16px;font-weight:700;color:var(--color-text-primary);margin:0 0 4px 0;">🛡️ Company Administrators (${admins.length})</h3>
            <p style="font-size:13px;color:var(--color-text-muted);margin:0;">Registered in Firebase <code>admins</code> collection for scoped tenant oversight</p>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="UserApprovalsScreen.openAssignAdminModal()">+ Assign Company Admin</button>
        </div>

        <div style="overflow-x:auto;">
          <table class="data-table" style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="border-bottom:2px solid var(--color-border);text-align:left;color:var(--color-text-muted);">
                <th style="padding:10px 14px;">Admin Name</th>
                <th style="padding:10px 14px;">Admin Email</th>
                <th style="padding:10px 14px;">Assigned Tenant</th>
                <th style="padding:10px 14px;">Privilege Level</th>
                <th style="padding:10px 14px;">Assigned Date</th>
                <th style="padding:10px 14px;text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${admins.map(a => {
                const comp = Store.getCompany(a.companyId);
                const compName = comp ? comp.name : a.companyId;
                return `
                  <tr style="border-bottom:1px solid var(--color-border-subtle);">
                    <td style="padding:12px 14px;font-weight:700;color:var(--color-text-primary);">${Utils.escapeHtml(a.name || 'Company Admin')}</td>
                    <td style="padding:12px 14px;color:var(--color-text-secondary);">${Utils.escapeHtml(a.email)}</td>
                    <td style="padding:12px 14px;">
                      <span class="badge" style="background:#F0FDF4;color:#166534;border:1px solid #BBF7D0;font-weight:600;">🏢 ${Utils.escapeHtml(compName)}</span>
                    </td>
                    <td style="padding:12px 14px;">
                      <span class="badge" style="background:#ECFDF5;color:#047857;font-weight:700;">Company Admin</span>
                    </td>
                    <td style="padding:12px 14px;color:var(--color-text-muted);">${a.assignedAt ? Utils.timeAgo(a.assignedAt) : 'Recently'}</td>
                    <td style="padding:12px 14px;text-align:right;">
                      <button type="button" class="btn btn-xs btn-danger" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;" onclick="UserApprovalsScreen.revokeCompanyAdmin('${a.id}', '${a.email}')">
                        Revoke
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Platform Super Admins Table -->
      <div class="section-card" style="padding:24px;border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface);">
        <div style="margin-bottom:16px;">
          <h3 style="font-size:16px;font-weight:700;color:var(--color-text-primary);margin:0 0 4px 0;">⚡ Platform Super Admins (${superAdmins.length})</h3>
          <p style="font-size:13px;color:var(--color-text-muted);margin:0;">Registered in Firebase <code>super_admins</code> collection with cross-tenant authorization</p>
        </div>

        <div style="overflow-x:auto;">
          <table class="data-table" style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="border-bottom:2px solid var(--color-border);text-align:left;color:var(--color-text-muted);">
                <th style="padding:10px 14px;">Super Admin</th>
                <th style="padding:10px 14px;">Email</th>
                <th style="padding:10px 14px;">Scope</th>
                <th style="padding:10px 14px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${superAdmins.map(sa => `
                <tr style="border-bottom:1px solid var(--color-border-subtle);">
                  <td style="padding:12px 14px;font-weight:700;color:var(--color-text-primary);">${Utils.escapeHtml(sa.name || 'Platform Admin')}</td>
                  <td style="padding:12px 14px;color:var(--color-text-secondary);">${Utils.escapeHtml(sa.email)}</td>
                  <td style="padding:12px 14px;">
                    <span class="badge" style="background:#FEF3C7;color:#92400E;font-weight:700;">🌐 All Tenants (Global HQ)</span>
                  </td>
                  <td style="padding:12px 14px;">
                    <span class="badge" style="background:#EFF6FF;color:#1D4ED8;font-weight:700;">Verified Platform Owner</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  _renderGoogleRequestCard(r) {
    const isPending = r.status === 'pending';
    const isApproved = r.status === 'approved';
    const isRevoked = r.status === 'revoked';
    const isRejected = r.status === 'rejected';

    let statusBg = '#FEF3C7';
    let statusColor = '#92400E';
    let statusText = 'Pending Review';

    if (isApproved) {
      statusBg = '#DCFCE7';
      statusColor = '#166534';
      statusText = 'Approved';
    } else if (isRevoked) {
      statusBg = '#FEF2F2';
      statusColor = '#DC2626';
      statusText = 'Access Revoked';
    } else if (isRejected) {
      statusBg = '#FEE2E2';
      statusColor = '#991B1B';
      statusText = 'Rejected';
    }

    const compName = r.companyName || 'Hintonn PMO';

    return `
      <div style="background:${isPending ? '#F0F7FF' : 'var(--color-surface)'};border:1px solid ${isPending ? '#BFDBFE' : (isRevoked ? '#FECACA' : 'var(--color-border)')};border-radius:var(--radius-md);padding:18px 20px;display:flex;align-items:center;gap:16px;box-shadow:var(--shadow-xs);">
        <div style="width:44px;height:44px;border-radius:50%;background:${r.color || '#2563EB'};color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0;">
          ${r.avatar || 'GU'}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px;">
            <span style="font-size:15px;font-weight:700;color:var(--color-text-primary);">${Utils.escapeHtml(r.name)}</span>
            <span class="badge" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:4px;">
              <svg width="12" height="12" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
              Google SSO
            </span>
            <span class="badge" style="background:#F1F5F9;color:#475569;border:1px solid #CBD5E1;font-size:11px;font-weight:600;">
              🏢 ${Utils.escapeHtml(compName)}
            </span>
            <span style="background:${statusBg};color:${statusColor};font-size:11px;font-weight:700;padding:2px 8px;border-radius:var(--radius-pill);">
              ${statusText}
            </span>
          </div>
          <div style="font-size:13px;color:var(--color-text-muted);">${Utils.escapeHtml(r.email)} · <span style="color:var(--color-text-primary);font-weight:500;">${r.department || 'Commercial PMO'}</span></div>
          <div style="font-size:11.5px;color:var(--color-text-disabled);margin-top:4px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <span>Requested: <strong>${Utils.timeAgo(r.requestedAt)}</strong></span>
            ${r.reviewedBy && !isRevoked ? `<span>Approved by: <strong>${r.reviewedBy}</strong></span>` : ''}
            ${isRevoked && r.revokedAt ? `<span style="color:#DC2626;">Revoked: <strong>${Utils.timeAgo(r.revokedAt)}</strong> by <strong>${r.revokedBy || 'Mohit Jain (Admin)'}</strong></span>` : ''}
          </div>
        </div>

        <div style="display:flex;gap:8px;flex-shrink:0;align-items:center;">
            ${isPending ? `
              <button type="button" onclick="UserApprovalsScreen.approveGoogleRequest('${r.id}')" class="btn btn-sm" style="background:#059669;color:#FFFFFF;border:none;font-weight:600;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:6px;cursor:pointer;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                Accept
              </button>
              <button type="button" onclick="UserApprovalsScreen.promptRejectGoogleAccess('${r.id}')" class="btn btn-sm" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;font-weight:600;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:6px;cursor:pointer;">
                Reject
              </button>
            ` : ''}

            ${isApproved ? `
              <span style="font-size:12px;font-weight:600;color:#166534;padding:6px 12px;border-radius:6px;background:#DCFCE7;">
                ✓ Access Granted
              </span>
              <button type="button" onclick="UserApprovalsScreen.promptRevokeGoogleAccess('${r.id}')" class="btn btn-sm" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;font-weight:600;display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:6px;cursor:pointer;" title="Revoke access for this account">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                Revoke Access
              </button>
            ` : ''}

            ${isRevoked ? `
              <button type="button" onclick="UserApprovalsScreen.approveGoogleRequest('${r.id}')" class="btn btn-sm" style="background:#059669;color:#FFFFFF;border:none;font-weight:600;display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:6px;cursor:pointer;" title="Re-grant access">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
                Re-grant Access
              </button>
            ` : ''}

            ${isRejected ? `
              <button type="button" onclick="UserApprovalsScreen.approveGoogleRequest('${r.id}')" class="btn btn-sm" style="background:#059669;color:#FFFFFF;border:none;font-weight:600;display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:6px;cursor:pointer;" title="Grant access">
                Accept
              </button>
            ` : ''}
        </div>
      </div>
    `;
  },

  _renderPendingCard(u) {
    const requestTime = u.requestDate ? Utils.timeAgo(u.requestDate) : 'recently';
    const compName = u.companyName || 'Hintonn PMO';

    return `
      <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:var(--radius-md);padding:20px;display:flex;align-items:flex-start;gap:16px;">
        <div class="avatar avatar-lg" style="background:${u.color || '#F59E0B'};font-weight:700;font-size:16px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:50%;flex-shrink:0;">${u.initials || '??'}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:15px;font-weight:700;color:var(--color-text-primary);">${Utils.escapeHtml(u.name)}</span>
            <span style="background:#FEF3C7;color:#92400E;font-size:10px;font-weight:700;padding:2px 8px;border-radius:var(--radius-pill);text-transform:uppercase;letter-spacing:0.03em;">Pending</span>
            <span class="badge" style="background:#EFF6FF;color:#1D4ED8;font-size:11px;font-weight:600;">🏢 ${Utils.escapeHtml(compName)}</span>
          </div>
          <div style="font-size:13px;color:var(--color-text-muted);margin-top:2px;">${Utils.escapeHtml(u.email)}</div>
          <div style="font-size:11.5px;color:var(--color-text-disabled);margin-top:2px;display:flex;align-items:center;gap:12px;">
            <span>Role: <strong style="color:var(--color-text-muted);">${Utils.escapeHtml(u.role)}</strong></span>
            <span>Source: <strong style="color:var(--color-text-muted);">${u.requestSource || 'Sign Up'}</strong></span>
            <span>Requested: <strong style="color:var(--color-text-muted);">${requestTime}</strong></span>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;">
          <button type="button" onclick="UserApprovalsScreen.approveUser('${u.id}')" style="padding:8px 16px;border-radius:var(--radius-sm);border:1px solid #86EFAC;background:#DCFCE7;color:#166534;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 150ms;" onmouseover="this.style.background='#BBF7D0'" onmouseout="this.style.background='#DCFCE7'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
            Approve
          </button>
          <button type="button" onclick="UserApprovalsScreen.promptRejectUserAccess('${u.id}')" style="padding:8px 12px;border-radius:var(--radius-sm);border:1px solid #FECACA;background:#FEF2F2;color:#991B1B;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all 150ms;" onmouseover="this.style.background='#FEE2E2'" onmouseout="this.style.background='#FEF2F2'">
            Reject
          </button>
        </div>
      </div>
    `;
  },

  _renderUserRow(u) {
    const isRevoked = u.revoked === true;
    const isApproved = u.approved && !isRevoked;
    const isRejected = u.rejected === true && !isRevoked;
    const isPending = !isApproved && !isRevoked && !isRejected;

    let statusColor = '#F59E0B';
    let statusBg = '#FEF3C7';
    let statusText = 'Pending';
    let statusIcon = '⏳';

    if (isApproved) {
      statusColor = '#16A34A';
      statusBg = '#DCFCE7';
      statusText = 'Approved';
      statusIcon = '✅';
    } else if (isRevoked) {
      statusColor = '#DC2626';
      statusBg = '#FEF2F2';
      statusText = 'Revoked';
      statusIcon = '🚫';
    } else if (isRejected) {
      statusColor = '#DC2626';
      statusBg = '#FEE2E2';
      statusText = 'Rejected';
      statusIcon = '❌';
    }

    const isCore = u.id === 'mohit' || u.memberId === 'm3' || u.id === 'ayush' || u.memberId === 'm1';
    const compName = u.companyName || 'Hintonn PMO';

    return `
      <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--color-surface);border:1px solid ${isRevoked ? '#FECACA' : 'var(--color-border)'};border-radius:var(--radius-md);transition:border-color 150ms;" onmouseover="this.style.borderColor='var(--color-primary-200)'" onmouseout="this.style.borderColor='${isRevoked ? '#FECACA' : 'var(--color-border)'}'">
        <div class="avatar avatar-md" style="background:${u.color || '#94A3B8'};font-weight:700;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:50%;flex-shrink:0;">${u.initials || '??'}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:14px;font-weight:700;color:var(--color-text-primary);">${Utils.escapeHtml(u.name)}</span>
            ${isCore ? '<span style="font-size:10px;background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200);padding:1px 6px;border-radius:var(--radius-pill);font-weight:600;">Core</span>' : ''}
            <span class="badge" style="background:#F1F5F9;color:#475569;border:1px solid #CBD5E1;font-size:11px;font-weight:600;">🏢 ${Utils.escapeHtml(compName)}</span>
            <span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:700;padding:2px 7px;border-radius:var(--radius-pill);background:${statusBg};color:${statusColor};">
              ${statusIcon} ${statusText}
            </span>
          </div>
          <div style="font-size:12.5px;color:var(--color-text-muted);margin-top:1px;">${Utils.escapeHtml(u.email)} · ${Utils.escapeHtml(u.role)}</div>
          <div style="font-size:11px;color:var(--color-text-disabled);margin-top:1px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            ${u.requestDate ? `<span>Requested ${Utils.timeAgo(u.requestDate)} via ${u.requestSource || 'pre-configured'}</span>` : ''}
            ${isRevoked && u.revokedAt ? `<span style="color:#DC2626;">Revoked ${Utils.timeAgo(u.revokedAt)} by ${u.revokedBy || 'Mohit Jain (Admin)'}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
          ${!isCore ? `
            <div style="display:flex;gap:6px;align-items:center;">
              ${isApproved ? `
                <button type="button" onclick="UserApprovalsScreen.promptRevokeUserAccess('${u.id}')" title="Revoke access" style="padding:6px 10px;border-radius:var(--radius-sm);border:1px solid #FECACA;background:#FEF2F2;color:#DC2626;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:background 0.2s;" onmouseover="this.style.background='#FEE2E2'" onmouseout="this.style.background='#FEF2F2'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                  Revoke Access
                </button>
              ` : ''}

              ${isRevoked ? `
                <button type="button" onclick="UserApprovalsScreen.approveUser('${u.id}')" title="Re-grant Access" style="padding:6px 10px;border-radius:var(--radius-sm);border:1px solid #86EFAC;background:#DCFCE7;color:#166534;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:background 0.2s;" onmouseover="this.style.background='#BBF7D0'" onmouseout="this.style.background='#DCFCE7'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                  Re-grant Access
                </button>
              ` : ''}

              ${isPending ? `
                <button type="button" onclick="UserApprovalsScreen.approveUser('${u.id}')" title="Approve" style="padding:6px 10px;border-radius:var(--radius-sm);border:1px solid #86EFAC;background:#DCFCE7;color:#166534;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:background 0.2s;" onmouseover="this.style.background='#BBF7D0'" onmouseout="this.style.background='#DCFCE7'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                  Approve
                </button>
                <button type="button" onclick="UserApprovalsScreen.promptRejectUserAccess('${u.id}')" title="Reject" style="padding:6px 10px;border-radius:var(--radius-sm);border:1px solid #FECACA;background:#FEF2F2;color:#991B1B;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:background 0.2s;" onmouseover="this.style.background='#FEE2E2'" onmouseout="this.style.background='#FEF2F2'">
                  Reject
                </button>
              ` : ''}

              ${isRejected ? `
                <button type="button" onclick="UserApprovalsScreen.approveUser('${u.id}')" title="Grant Access" style="padding:6px 10px;border-radius:var(--radius-sm);border:1px solid #86EFAC;background:#DCFCE7;color:#166534;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:background 0.2s;" onmouseover="this.style.background='#BBF7D0'" onmouseout="this.style.background='#DCFCE7'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                  Accept
                </button>
              ` : ''}

              <button type="button" onclick="UserApprovalsScreen.removeUser('${u.id}', '${Utils.escapeHtml(u.name)}')" title="Remove user" style="padding:6px 8px;border-radius:var(--radius-sm);border:1px solid #E5E7EB;background:var(--color-surface);color:var(--color-text-muted);font-size:12px;cursor:pointer;display:inline-flex;align-items:center;transition:background 0.2s;" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='var(--color-surface)'">
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

window.UserApprovalsScreen = UserApprovalsScreen;
