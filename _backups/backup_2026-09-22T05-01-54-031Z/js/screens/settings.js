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
          <button class="settings-nav-item ${this._tab==='data'?'active':''}" onclick="SettingsScreen._tab='data';SettingsScreen.refresh()">Data</button>
        </div>
        <div class="settings-section" id="settings-content">${this._renderTab(settings)}</div>
      </div>`;
  },

  _renderTab(settings) {
    switch(this._tab) {
      case 'workspace': return this._renderWorkspace(settings);
      case 'profile': return this._renderProfile(settings);
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
        <div><div style="font-size:18px;font-weight:600">${current.name}</div><div style="font-size:14px;color:var(--color-text-muted)">${current.role}</div><div style="font-size:13px;color:var(--color-text-disabled);margin-top:2px">${current.email}</div></div>
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
