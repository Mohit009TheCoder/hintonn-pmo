// ─── Notifications Screen ───
const NotificationsScreen = {
  _filter: 'all',

  render() {
    const notifications = Store.getNotifications();
    const filtered = this._applyFilter(notifications);
    const unreadCount = notifications.filter(n => !n.read).length;
    const types = ['all', 'invoice', 'bankGuarantee', 'bg', 'dlp', 'task', 'milestone', 'project', 'issue', 'system'];

    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = user && user.role === 'Admin';
    const googleRequests = (isAdmin && typeof Auth !== 'undefined' && Auth.getGoogleApprovalRequests) ? Auth.getGoogleApprovalRequests() : [];
    const pendingGoogle = googleRequests.filter(r => r.status === 'pending');

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Notifications</h1>
          <p>${notifications.length + googleRequests.length} total · ${unreadCount + pendingGoogle.length} unread</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" onclick="Store.markAllRead();App.refresh();Toast.show('All notifications marked as read')">Mark all read</button>
        </div>
      </div>

      <!-- Google Login Requests for Admin -->
      ${(isAdmin && googleRequests.length > 0 && (this._filter === 'all' || this._filter === 'system')) ? `
      <div style="margin-bottom:20px;">
        <div style="font-size:13px;font-weight:700;color:var(--color-text-primary);margin-bottom:10px;display:flex;align-items:center;gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
          Google Workspace Login Approval Requests
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${googleRequests.map(r => `
            <div style="background:${r.status==='pending'?'#F0F7FF':'var(--color-surface)'};border:1px solid ${r.status==='pending'?'#BFDBFE':'var(--color-border)'};border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:12px;">
              <div style="width:36px;height:36px;border-radius:50%;background:${r.color||'#2563EB'};color:#FFF;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${r.avatar||'GU'}</div>
              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <strong style="font-size:13.5px;color:var(--color-text-primary);">${r.name}</strong>
                  <span style="font-size:11px;color:var(--color-text-muted);">(${r.email})</span>
                  <span class="badge" style="background:${r.status==='approved'?'#DCFCE7':r.status==='rejected'?'#FEE2E2':'#FEF3C7'};color:${r.status==='approved'?'#166534':r.status==='rejected'?'#991B1B':'#92400E'};font-size:10px;padding:1px 6px;">${r.status}</span>
                </div>
                <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px;">Requested Google Login access · ${Utils.timeAgo(r.requestedAt)}</div>
              </div>
              <div style="display:flex;gap:6px;flex-shrink:0;">
                ${r.status === 'pending' ? `
                  <button type="button" onclick="App.handleGoogleApproval('${r.id}', true);NotificationsScreen._refresh()" class="btn btn-sm" style="background:#059669;color:#FFF;border:none;padding:6px 12px;font-size:12px;font-weight:600;border-radius:4px;cursor:pointer;">✓ Accept</button>
                  <button type="button" onclick="App.handleGoogleApproval('${r.id}', false);NotificationsScreen._refresh()" class="btn btn-sm" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;padding:6px 10px;font-size:12px;font-weight:600;border-radius:4px;cursor:pointer;">✕ Reject</button>
                ` : `
                  <span style="font-size:11.5px;font-weight:600;color:${r.status==='approved'?'#166534':'#991B1B'};">${r.status==='approved'?'✓ Approved':'✕ Rejected'}</span>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px">
        ${types.map(t => `
          <button class="btn btn-sm ${this._filter === t ? 'btn-primary' : 'btn-ghost'}" onclick="NotificationsScreen._filter='${t}';NotificationsScreen._refresh()">
            ${this._filterLabel(t)}
          </button>`).join('')}
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons.inbox}</div>
          <h3>No notifications</h3>
          <p>${this._filter === 'all' ? "You're all caught up!" : `No ${this._filterLabel(this._filter).toLowerCase()} notifications`}</p>
        </div>` :
      `<div class="section-card"><div class="section-card-body no-pad">
        <div class="notification-panel-body" style="position:static">
          ${filtered.map(n => `
            <div class="notification-item ${n.read ? '' : 'unread'}" style="cursor:pointer" onclick="NotificationsScreen._handleClick('${n.id}', '${n.type}')">
              <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                ${!n.read ? '<div class="notification-dot"></div>' : '<div style="width:8px"></div>'}
                <span style="font-size:16px">${this._icon(n.type)}</span>
              </div>
              <div class="notification-content" style="flex:1;min-width:0">
                <div class="notification-text">${n.text}</div>
                <div class="notification-time">${Utils.timeAgo(n.createdAt)}</div>
              </div>
              <button class="btn btn-ghost btn-sm btn-icon" onclick="event.stopPropagation();Store.markRead('${n.id}');NotificationsScreen._refresh()" title="Mark as read" style="flex-shrink:0">
                ${n.read ? '' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'}
              </button>
            </div>`).join('')}
        </div>
      </div></div>`}`;
  },

  _applyFilter(notifications) {
    if (this._filter === 'all') return notifications;
    // Map filter keys to notification types
    const typeMap = {
      'invoice': ['invoice'],
      'bankGuarantee': ['bankGuarantee', 'bg'],
      'bg': ['bankGuarantee', 'bg'],
      'dlp': ['dlpRecord', 'dlp'],
      'task': ['task'],
      'milestone': ['milestone'],
      'project': ['project'],
      'issue': ['issue'],
      'system': ['system', 'member', 'company', 'comment', 'team']
    };
    const matchTypes = typeMap[this._filter] || [this._filter];
    return notifications.filter(n => matchTypes.includes(n.type));
  },

  _filterLabel(type) {
    const labels = {
      'all': 'All',
      'invoice': 'Invoices',
      'bankGuarantee': 'Bank Guarantees',
      'bg': 'BG',
      'dlp': 'DLP',
      'task': 'Tasks',
      'milestone': 'Milestones',
      'project': 'Projects',
      'issue': 'Issues',
      'system': 'System'
    };
    return labels[type] || type;
  },

  _handleClick(id, type) {
    Store.markRead(id);
    App.updateNotifDot();
    // Navigate to relevant screen based on notification type
    const routes = {
      'task': '#tasks',
      'issue': '#issues',
      'milestone': '#milestones',
      'project': '#projects',
      'invoice': '#billing',
      'bankGuarantee': '#bg',
      'dlpRecord': '#dlp'
    };
    const route = routes[type];
    if (route) {
      window.location.hash = route;
    } else {
      this._refresh();
    }
  },

  _refresh() {
    const el = document.getElementById('page-content');
    if (el) el.innerHTML = this.render();
  },

  _icon(type) {
    const icons = {
      task: '📋',
      project: '📁',
      issue: '🔴',
      milestone: '🏁',
      comment: '💬',
      team: '👥',
      invoice: '💰',
      bankGuarantee: '🏦',
      bg: '🏦',
      dlpRecord: '⏱️',
      dlp: '⏱️',
      member: '👤',
      company: '🏢',
      system: '⚙️'
    };
    return icons[type] || '📌';
  }
};