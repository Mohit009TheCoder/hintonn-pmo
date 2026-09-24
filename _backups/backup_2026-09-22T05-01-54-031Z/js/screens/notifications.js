// ─── Notifications Screen ───
const NotificationsScreen = {
  render() {
    const notifications = Store.getNotifications();
    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Notifications</h1>
          <p>${notifications.length} total · ${notifications.filter(n=>!n.read).length} unread</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" onclick="Store.markAllRead();App.refresh();Toast.show('All notifications marked as read')">Mark all read</button>
        </div>
      </div>
      ${notifications.length === 0 ? `<div class="empty-state"><div class="empty-state-icon">${Icons.inbox}</div><h3>No notifications</h3><p>You're all caught up!</p></div>` :
      `<div class="section-card"><div class="section-card-body no-pad">
        <div class="notification-panel-body" style="position:static">
          ${notifications.map(n => `
            <div class="notification-item ${n.read?'':'unread'}" onclick="Store.markRead('${n.id}');this.classList.remove('unread');App.updateNotifDot()">
              <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                ${!n.read ? '<div class="notification-dot"></div>' : '<div style="width:8px"></div>'}
                <span style="font-size:16px">${this._icon(n.type)}</span>
              </div>
              <div class="notification-content">
                <div class="notification-text">${n.text}</div>
                <div class="notification-time">${Utils.timeAgo(n.createdAt)}</div>
              </div>
            </div>`).join('')}
        </div>
      </div></div>`}`;
  },

  _icon(type) {
    const icons = { task: '📋', project: '📁', issue: '🔴', milestone: '🏁', comment: '💬', team: '👥' };
    return icons[type] || '📌';
  }
};
