// ─── Notifications Screen ───
const NotificationsScreen = {
  _filter: 'all',

  render() {
    const notifications = Store.getNotifications();
    const filtered = this._applyFilter(notifications);
    const unreadCount = notifications.filter(n => !n.read).length;
    const types = ['all', 'invoice', 'bankGuarantee', 'bg', 'dlp', 'task', 'milestone', 'project', 'issue', 'system'];

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Notifications</h1>
          <p>${notifications.length} total · ${unreadCount} unread</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" onclick="Store.markAllRead();App.refresh();Toast.show('All notifications marked as read')">Mark all read</button>
        </div>
      </div>

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