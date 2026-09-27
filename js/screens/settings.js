// ─── Settings Screen ───
const SettingsScreen = {
  _tab: 'workspace',

  render() {
    const settings = Store.getSettings();
    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Settings</h1>
          <p>Manage your workspace and data</p>
        </div>
      </div>
      <div class="settings-layout">
        <div class="settings-nav">
          <button class="settings-nav-item ${this._tab==='workspace'?'active':''}" onclick="SettingsScreen._tab='workspace';SettingsScreen.refresh()">Workspace</button>
          <button class="settings-nav-item ${this._tab==='profile'?'active':''}" onclick="SettingsScreen._tab='profile';SettingsScreen.refresh()">Profile</button>
          <button class="settings-nav-item ${this._tab==='notifications'?'active':''}" onclick="SettingsScreen._tab='notifications';SettingsScreen.refresh()">Notifications</button>
          <button class="settings-nav-item ${this._tab==='data'?'active':''}" onclick="SettingsScreen._tab='data';SettingsScreen.refresh()">Data</button>
        </div>
        <div class="settings-section" id="settings-content">${this._renderTab(settings)}</div>
      </div>`;
  },

  _renderTab(settings) {
    switch(this._tab) {
      case 'workspace': return this._renderWorkspace(settings);
      case 'profile': return this._renderProfile(settings);
      case 'notifications': return this._renderNotifications(settings);
      case 'data': return this._renderData(settings);
      default: return '';
    }
  },

  _renderWorkspace(s) {
    return `
      <h3>Workspace Settings</h3>
      <div class="desc">Configure your workspace name and general preferences.</div>
      <div class="form-group" style="margin-bottom:20px">
        <label class="form-label">Workspace Name</label>
        <input type="text" class="form-input" id="ws-name" value="${s.workspaceName || ''}" style="max-width:400px">
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label">Sidebar</div><div class="settings-row-desc">Choose default sidebar state</div></div>
        <select class="form-select" style="width:160px" id="ws-sidebar">
          <option value="expanded">Expanded</option>
          <option value="collapsed">Collapsed</option>
        </select>
      </div>
      <div style="margin-top:24px"><button class="btn btn-primary" onclick="SettingsScreen.saveWorkspace()">Save Changes</button></div>`;
  },

  _renderProfile(s) {
    const members = Store.getMembers();
    const current = Store.getMember(s.currentUser);
    const authUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser()) || null;
    const displayEmail = (authUser && (authUser.googleEmail || authUser.email)) || (current && (current.googleEmail || current.email)) || '';
    return `
      <h3>Profile</h3>
      <div class="desc">Select your profile from the team.</div>
      <div class="form-group" style="margin-bottom:20px">
        <label class="form-label">Current User</label>
        <select class="form-select" id="profile-user" style="max-width:400px">
          ${members.map(m => `<option value="${m.id}" ${s.currentUser===m.id?'selected':''}>${m.name} — ${m.role}</option>`).join('')}
        </select>
      </div>
      ${current ? `<div style="display:flex;align-items:center;gap:16px;padding:20px;background:var(--color-bg-soft);border-radius:var(--radius-lg)">
        <div class="avatar avatar-xl" style="background:${current.color}">${current.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
        <div><div style="font-size:18px;font-weight:600">${current.name}</div><div style="font-size:14px;color:var(--color-text-muted)">${authUser ? authUser.role : current.role}</div><div style="font-size:13px;color:var(--color-text-disabled);margin-top:2px">${displayEmail}</div></div>
      </div>` : ''}
      <div style="margin-top:24px"><button class="btn btn-primary" onclick="SettingsScreen.saveProfile()">Save Profile</button></div>`;
  },

  _renderData() {
    return `
      <h3>Data Management</h3>
      <div class="desc">Export, import, or reset your project data.</div>
      <div class="settings-row">
        <div><div class="settings-row-label">Export Data</div><div class="settings-row-desc">Download all project data as JSON</div></div>
        <button class="btn btn-secondary btn-sm" onclick="SettingsScreen.exportData()">${Icons.download} Export</button>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label">Import Data</div><div class="settings-row-desc">Load project data from a JSON file</div></div>
        <label class="btn btn-secondary btn-sm" style="cursor:pointer">${Icons.upload} Import
          <input type="file" accept=".json" style="display:none" onchange="SettingsScreen.importData(this)">
        </label>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label">Reset All Data</div><div class="settings-row-desc">Clear all data and load sample projects</div></div>
        <button class="btn btn-danger btn-sm" onclick="SettingsScreen.resetData()">Reset</button>
      </div>`;
  },

  _renderNotifications(s) {
    const prefs = Store.getNotificationPrefs();
    const pushSupported = typeof FCM !== 'undefined' && FCM.isSupported();
    const permission = typeof FCM !== 'undefined' ? FCM.getPermissionStatus() : 'unavailable';
    const pushStatusText = permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked by browser' : 'Not enabled';
    const pushStatusColor = permission === 'granted' ? 'var(--color-success)' : permission === 'denied' ? 'var(--color-danger)' : 'var(--color-text-muted)';

    return `
      <h3>Notifications & Push</h3>
      <div class="desc">Configure push notifications and choose which alerts you want to receive.</div>

      <div class="settings-row" style="margin-top:16px">
        <div>
          <div class="settings-row-label">Push Notifications</div>
          <div class="settings-row-desc">Receive real-time browser push notifications · <span style="color:${pushStatusColor}">${pushStatusText}</span></div>
        </div>
        ${pushSupported ? `<label class="toggle-switch">
          <input type="checkbox" id="push-toggle" ${prefs.pushEnabled && permission === 'granted' ? 'checked' : ''} onchange="SettingsScreen._togglePush(this.checked)">
          <span class="toggle-slider"></span>
        </label>` : '<span style="font-size:13px;color:var(--color-text-muted)">Not supported</span>'}
      </div>

      <div style="margin-top:28px;margin-bottom:16px">
        <h4 style="font-size:14px;font-weight:600;margin-bottom:4px">Notification Preferences</h4>
        <div style="font-size:13px;color:var(--color-text-muted)">Choose which notifications you receive in-app and via push.</div>
      </div>

      <div class="settings-row">
        <div><div class="settings-row-label">Bank Guarantee Expiry Alerts</div><div class="settings-row-desc">Alerts when BG expiry dates are approaching</div></div>
        <label class="toggle-switch"><input type="checkbox" id="pref-bgExpiryAlerts" ${prefs.bgExpiryAlerts ? 'checked' : ''}><span class="toggle-slider"></span></label>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label">Invoice Notifications</div><div class="settings-row-desc">Alerts for invoice status changes and payment updates</div></div>
        <label class="toggle-switch"><input type="checkbox" id="pref-invoiceNotifications" ${prefs.invoiceNotifications ? 'checked' : ''}><span class="toggle-slider"></span></label>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label">DLP Alerts</div><div class="settings-row-desc">Defect liability period reminders and inspection alerts</div></div>
        <label class="toggle-switch"><input type="checkbox" id="pref-dlpAlerts" ${prefs.dlpAlerts ? 'checked' : ''}><span class="toggle-slider"></span></label>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label">Health Score Alerts</div><div class="settings-row-desc">Project health score changes and risk warnings</div></div>
        <label class="toggle-switch"><input type="checkbox" id="pref-healthScoreAlerts" ${prefs.healthScoreAlerts ? 'checked' : ''}><span class="toggle-slider"></span></label>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label">Task Updates</div><div class="settings-row-desc">Notifications for task creation, assignment, and status changes</div></div>
        <label class="toggle-switch"><input type="checkbox" id="pref-taskUpdates" ${prefs.taskUpdates ? 'checked' : ''}><span class="toggle-slider"></span></label>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label">Milestone Updates</div><div class="settings-row-desc">Alerts for milestone completions and deadline reminders</div></div>
        <label class="toggle-switch"><input type="checkbox" id="pref-milestoneUpdates" ${prefs.milestoneUpdates ? 'checked' : ''}><span class="toggle-slider"></span></label>
      </div>

      <div style="margin-top:24px"><button class="btn btn-primary" onclick="SettingsScreen.saveNotificationPrefs()">Save Preferences</button></div>`;
  },

  async _togglePush(enabled) {
    if (enabled) {
      const success = await FCM.enablePush();
      if (!success) {
        document.getElementById('push-toggle').checked = false;
      }
    } else {
      await FCM.disablePush();
    }
  },

  saveNotificationPrefs() {
    const prefs = {
      bgExpiryAlerts: document.getElementById('pref-bgExpiryAlerts')?.checked ?? true,
      invoiceNotifications: document.getElementById('pref-invoiceNotifications')?.checked ?? true,
      dlpAlerts: document.getElementById('pref-dlpAlerts')?.checked ?? true,
      healthScoreAlerts: document.getElementById('pref-healthScoreAlerts')?.checked ?? true,
      taskUpdates: document.getElementById('pref-taskUpdates')?.checked ?? true,
      milestoneUpdates: document.getElementById('pref-milestoneUpdates')?.checked ?? true
    };
    Store.saveNotificationPrefs(prefs);
    Toast.show('Notification preferences saved', 'success');
  },

  saveWorkspace() {
    const name = document.getElementById('ws-name').value.trim();
    if (!name) { Toast.show('Workspace name is required', 'error'); return; }
    Store.updateSettings({ workspaceName: name });
    Toast.show('Settings saved');
    Sidebar.render(); Topbar.render();
  },

  saveProfile() {
    const userId = document.getElementById('profile-user').value;
    Store.updateSettings({ currentUser: userId });
    Toast.show('Profile updated');
    App.refresh();
  },

  exportData() {
    const data = Store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `hintonn-pm-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    Toast.show('Data exported');
  },

  importData(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (Store.importData(e.target.result)) {
        Toast.show('Data imported successfully');
        App.refresh();
      } else { Toast.show('Invalid JSON file', 'error'); }
    };
    reader.readAsText(file);
    input.value = '';
  },

  resetData() {
    Modal.confirm('Reset All Data', 'This will replace all current data with sample projects. This cannot be undone.',
      () => { Store.clearAll(); Toast.show('Data reset to defaults'); App.refresh(); }, { danger: true, confirmText: 'Reset' });
  },

  refresh() { document.getElementById('page-content').innerHTML = this.render(); }
};
