// ─── Retention Summary Screen (Commercial PMO) ───
const RetentionScreen = {
  _getRetentionData() {
    return Store.getRetentionRecords();
  },

  _normAmt(val) {
    if (!val) return val;
    if (typeof val === 'string' && val.startsWith('$')) {
      return '₹' + val.slice(1);
    }
    return val;
  },

  _parseAmt(s) {
    if (!s) return 0;
    const str = String(s).replace(/[^0-9.MKmk]/g, '');
    if (str.includes('M') || str.includes('m')) return parseFloat(str) * 1000000;
    if (str.includes('K') || str.includes('k')) return parseFloat(str) * 1000;
    return parseFloat(str) || 0;
  },

  _fmtAmt(n) {
    if (!n || n === 0) return '₹0';
    const s = Math.round(n).toString();
    let result = '';
    const len = s.length;
    if (len <= 3) return '₹' + s;
    result = s.slice(-3);
    let remaining = s.slice(0, -3);
    while (remaining.length > 2) {
      result = remaining.slice(-2) + ',' + result;
      remaining = remaining.slice(0, -2);
    }
    if (remaining.length > 0) result = remaining + ',' + result;
    return '₹' + result;
  },

  render() {
    const rawItems = this._getRetentionData();
    const items = rawItems.map(r => ({
      ...r,
      contractValue: this._normAmt(r.contractValue),
      retentionHeld: this._normAmt(r.retentionHeld)
    }));

    const parseAmt = this._parseAmt;
    const fmtAmt = this._fmtAmt;

    const totalRetention = fmtAmt(items.reduce((s, r) => s + parseAmt(r.retentionHeld), 0));
    const activeRetention = fmtAmt(items.filter(r => r.status === 'on-schedule' || r.status === 'Partial' || r.status === 'Held').reduce((s, r) => s + parseAmt(r.retentionHeld), 0));
    const dlpRetention = fmtAmt(items.filter(r => r.status === 'under-review' || r.status === 'release-initiated').reduce((s, r) => s + parseAmt(r.retentionHeld), 0));
    const nextRelease = items.filter(r => r.releaseDueDate && r.status !== 'released').sort((a, b) => new Date(a.releaseDueDate) - new Date(b.releaseDueDate))[0];
    const nextReleaseDate = nextRelease ? Utils.formatDate(nextRelease.releaseDueDate) : '—';

    const activePackages = items.filter(r => r.status === 'on-schedule' || r.status === 'Partial' || r.status === 'Held');
    const dlpReleases = items.filter(r => r.status === 'under-review' || r.status === 'release-initiated' || (r.pendingRelease && r.pendingRelease > 0));
    const avgPercent = items.length ? (items.reduce((s, r) => s + (parseFloat(r.retentionPct || r.retentionPercent) || 0), 0) / items.length).toFixed(1) : 0;

    return `
      <div class="page-header" style="margin-bottom:18px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <div class="page-header-left">
          <h1>Retention Summary &amp; Ledger</h1>
          <p>Retention tracking, tranche maturity schedule, and Defects Liability (DLP) release triggers.</p>
        </div>
        <div class="page-header-actions" style="display:flex;align-items:center;gap:10px;margin-left:auto;flex-wrap:wrap">
          <button class="btn btn-secondary" onclick="RetentionScreen.exportLedger()" style="display:inline-flex;align-items:center;gap:6px">
            ${Icons.download} Export Ledger
          </button>
          <button class="btn btn-outline" onclick="RetentionScreen.generateReleaseAudit()" style="display:inline-flex;align-items:center;gap:6px">
            ${Icons.check} Release Tranches
          </button>
          <button class="btn btn-primary" id="btn-add-retention" onclick="RetentionScreen.openAddRetentionModal()" style="display:inline-flex;align-items:center;gap:8px;font-weight:700;box-shadow:var(--shadow-md)">
            ${Icons.plus} Add Retention Record
          </button>
        </div>
      </div>

      <!-- Top Summary KPI Row -->
      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Total Retention Held</span>
            <div class="kpi-icon-wrap">${Icons.target}</div>
          </div>
          <div class="kpi-value">${totalRetention}</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-primary-700)">
            ${items.length > 0 ? `Cumulative ${avgPercent}% Across Portfolio` : 'No retention recorded'}
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Active EPC Retention</span>
            <div class="kpi-icon-wrap">${Icons.folder}</div>
          </div>
          <div class="kpi-value">${activeRetention}</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
            ${items.length > 0 ? `${activePackages.length} Active Construction Packages` : 'No active construction packages'}
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">DLP Exit Retention</span>
            <div class="kpi-icon-wrap">${Icons.clock}</div>
          </div>
          <div class="kpi-value">${dlpRetention}</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-ai-700)">
            ${dlpReleases.length > 0 ? `
              <span class="badge badge-high" style="font-size:10px;padding:2px 7px;font-weight:600">Action Needed</span>
              ${dlpReleases.length} Release Tranche${dlpReleases.length > 1 ? 's' : ''} Pending
            ` : '<span style="font-size:12px;color:var(--color-text-muted)">No release tranches pending</span>'}
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Next Release Due</span>
            <div class="kpi-icon-wrap">${Icons.calendar}</div>
          </div>
          <div class="kpi-value" style="font-size:22px">${nextReleaseDate}</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
            ${nextRelease ? (nextRelease.retentionHeld || '') + ' · ' + (nextRelease.packageCode || nextRelease.projectName || '') : 'No releases scheduled'}
          </div>
        </div>
      </div>

      <!-- Main Project Retention Table Card -->
      <div class="section-card">
        <div class="section-card-header" style="display:flex;align-items:center;justify-content:space-between">
          <h3>${Icons.fileText} EPC Project Retention Ledger</h3>
          <span class="badge badge-active" style="font-size:11.5px">${items.length} Package${items.length === 1 ? '' : 's'} Monitored</span>
        </div>

        <div class="section-card-body no-pad">
          ${items.length === 0 ? `
            <div style="padding:48px 24px;text-align:center">
              <div style="width:48px;height:48px;margin:0 auto 12px;border-radius:var(--radius-md);background:var(--color-primary-50);color:var(--color-primary);display:flex;align-items:center;justify-content:center">
                ${Icons.lock || ''}
              </div>
              <p style="color:var(--color-text-primary);font-size:15px;font-weight:700;margin:0 0 6px">No Retention Records Yet</p>
              <p style="color:var(--color-text-muted);font-size:13px;max-width:420px;margin:0 auto 16px">Track retention holdbacks, maturity release dates, and warranty compliance per EPC contract package.</p>
              <button class="btn btn-primary btn-sm" onclick="RetentionScreen.openAddRetentionModal()" style="display:inline-flex;align-items:center;gap:6px">
                ${Icons.plus} Add First Retention Record
              </button>
            </div>
          ` : `
            <div class="table-wrap">
              <table class="table commercial-table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th class="num">Contract Value</th>
                    <th class="center">Retention %</th>
                    <th class="num">Retention Held (₹)</th>
                    <th>Tranche Phase</th>
                    <th>Release Due Date</th>
                    <th>Release Trigger Milestone</th>
                    <th class="center">Status</th>
                    <th class="center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(r => `
                    <tr>
                      <td>
                        <div class="commercial-project-title" onclick="App.navigate('project-detail','${r.projectId || ''}')">
                          ${Utils.escapeHtml(r.projectName)}
                        </div>
                        <div class="commercial-project-code">${Utils.escapeHtml(r.packageCode || '—')}</div>
                      </td>
                      <td class="num" style="font-weight:600;color:var(--color-text-primary)">
                        ${r.contractValue}
                      </td>
                      <td class="center" style="font-weight:600;color:var(--color-text-secondary)">
                        ${r.retentionPct || (r.retentionPercent ? r.retentionPercent + '%' : '5%')}
                      </td>
                      <td class="num" style="font-weight:700;color:var(--color-text-primary)">
                        ${r.retentionHeld}
                      </td>
                      <td style="font-size:12px;color:var(--color-text-muted)">
                        ${Utils.escapeHtml(r.tranchePhase || 'Tranche 1')}
                      </td>
                      <td style="font-size:12.5px;color:var(--color-text-secondary);white-space:nowrap">
                        ${Utils.formatDate(r.releaseDueDate)}
                      </td>
                      <td style="font-size:12px;color:var(--color-text-secondary);max-width:220px" title="${Utils.escapeHtml(r.releaseTrigger || '')}">
                        ${Utils.escapeHtml(r.releaseTrigger || '—')}
                      </td>
                      <td class="center">
                        <span class="badge ${r.badgeClass || 'badge-active'}">${Utils.escapeHtml(r.statusLabel || r.status || 'Active')}</span>
                      </td>
                      <td class="center">
                        <div style="display:flex;align-items:center;justify-content:center;gap:4px">
                          <button class="btn btn-outline btn-xs" onclick="RetentionScreen.auditTerms('${r.id}')" title="Audit Retention Terms">
                            Audit
                          </button>
                          <button class="btn btn-ghost btn-xs" onclick="RetentionScreen.openEditRetentionModal('${r.id}')" title="Edit Record">
                            ✏️
                          </button>
                        </div>
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
  },

  // ─── Add / Edit Retention Record Modal ───
  openAddRetentionModal(initialProjectId = '') {
    this._renderRetentionModal(null, initialProjectId);
  },

  openEditRetentionModal(id) {
    const item = this._getRetentionData().find(x => x.id === id);
    if (!item) {
      Toast.show('Retention record not found.', 'error');
      return;
    }
    this._renderRetentionModal(item);
  },

  _renderRetentionModal(existing = null, defaultProjectId = '') {
    const isEdit = !!existing;
    const projects = Store.getProjects() || [];
    const selectedProjId = existing ? existing.projectId : (defaultProjectId || (projects[0] ? projects[0].id : ''));
    const selectedProj = projects.find(p => p.id === selectedProjId);

    const defaultContractNum = existing ? this._parseAmt(existing.contractValue) : 5000000;
    const defaultPct = existing ? parseFloat(existing.retentionPct || existing.retentionPercent) || 5.0 : 5.0;
    const defaultHeldNum = existing ? this._parseAmt(existing.retentionHeld) : Math.round(defaultContractNum * (defaultPct / 100));

    const today = new Date();
    const oneYearLater = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultDueDate = existing && existing.releaseDueDate ? existing.releaseDueDate : oneYearLater;

    const html = `
      <div style="display:flex;flex-direction:column;gap:14px;font-size:13px;color:var(--color-text-primary)">
        
        <div style="padding:10px 14px;background:var(--color-primary-50);border:1px solid var(--color-border-brand);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;font-weight:600">
              ${isEdit ? 'Editing Retention Record' : 'Commercial Retention Holdback'}
            </div>
            <div style="font-weight:700;font-size:14px;color:var(--color-text-primary)">
              ${isEdit ? `${existing.projectName} (${existing.packageCode || ''})` : 'New Contract Package Retention'}
            </div>
          </div>
          <span class="badge badge-active">${isEdit ? 'Update' : 'New Entry'}</span>
        </div>

        <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:12px">
          <div class="form-group">
            <label class="form-label" style="font-weight:600">Select Project <span style="color:var(--color-error)">*</span></label>
            <select class="form-control" id="ret-modal-project" onchange="RetentionScreen._onModalProjectChange(this.value)">
              <option value="">— Standalone / Custom Project —</option>
              ${projects.map(p => `
                <option value="${p.id}" ${p.id === selectedProjId ? 'selected' : ''}>
                  ${Utils.escapeHtml(p.name)} (${p.code || p.id})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:600">Package Code <span style="color:var(--color-error)">*</span></label>
            <input type="text" class="form-control" id="ret-modal-package" 
                   value="${existing ? Utils.escapeHtml(existing.packageCode || '') : (selectedProj ? `PKG-${String(selectedProj.id).toUpperCase().replace(/\D/g, '').padStart(2, '0') || '01'}` : 'PKG-01')}" 
                   placeholder="e.g. PKG-01 / ELEC-02">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600">Project / Package Name</label>
          <input type="text" class="form-control" id="ret-modal-proj-name" 
                 value="${existing ? Utils.escapeHtml(existing.projectName || '') : (selectedProj ? Utils.escapeHtml(selectedProj.name) : '')}" 
                 placeholder="e.g. Substation Construction & Line Automation">
        </div>

        <div style="display:grid;grid-template-columns:1fr 0.8fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label" style="font-weight:600">Contract Value (₹) <span style="color:var(--color-error)">*</span></label>
            <input type="text" class="form-control" id="ret-modal-contract-val" 
                   value="${defaultContractNum.toLocaleString('en-IN')}" 
                   placeholder="e.g. 5,000,000"
                   oninput="RetentionScreen._recalcModalAmounts()">
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:600">Retention %</label>
            <div style="position:relative">
              <input type="number" class="form-control" id="ret-modal-pct" 
                     value="${defaultPct}" min="1" max="50" step="0.5" 
                     style="padding-right:28px"
                     oninput="RetentionScreen._recalcModalAmounts()">
              <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-weight:600;color:var(--color-text-muted)">%</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:600">Retention Held (₹)</label>
            <input type="text" class="form-control" id="ret-modal-held" 
                   value="${defaultHeldNum.toLocaleString('en-IN')}" 
                   placeholder="Auto-calculated"
                   style="font-weight:700;color:var(--color-primary-700)">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label" style="font-weight:600">Tranche Phase</label>
            <select class="form-control" id="ret-modal-tranche">
              <option value="Tranche 1 (50% Handover / 50% DLP Exit)" ${existing && existing.tranchePhase && existing.tranchePhase.includes('50% Handover') ? 'selected' : ''}>
                Tranche 1 (50% Handover / 50% DLP Exit)
              </option>
              <option value="Tranche 2 (100% Post-Defects Liability)" ${existing && existing.tranchePhase && existing.tranchePhase.includes('100% Post') ? 'selected' : ''}>
                Tranche 2 (100% Post-Defects Liability)
              </option>
              <option value="Single Tranche (100% Final Handover)" ${existing && existing.tranchePhase && existing.tranchePhase.includes('Single Tranche') ? 'selected' : ''}>
                Single Tranche (100% Final Handover)
              </option>
              <option value="Milestone-Linked Retention (33/33/34)" ${existing && existing.tranchePhase && existing.tranchePhase.includes('33/33/34') ? 'selected' : ''}>
                Milestone-Linked Retention (33/33/34)
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:600">Release Due Date</label>
            <input type="date" class="form-control" id="ret-modal-due-date" value="${defaultDueDate}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600">Release Trigger / Prerequisite Milestone</label>
          <input type="text" class="form-control" id="ret-modal-trigger" 
                 value="${existing ? Utils.escapeHtml(existing.releaseTrigger || '') : 'Commercial Handover Acceptance & Final Defect Liability Clearance Certificate'}" 
                 placeholder="e.g. 12 Months DLP Completion & Audit Sign-off">
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600">Retention Status</label>
          <select class="form-control" id="ret-modal-status">
            <option value="on-schedule" ${!existing || existing.status === 'on-schedule' ? 'selected' : ''}>Active / On Schedule</option>
            <option value="under-review" ${existing && existing.status === 'under-review' ? 'selected' : ''}>Under Review (DLP Window)</option>
            <option value="release-initiated" ${existing && existing.status === 'release-initiated' ? 'selected' : ''}>Release Initiated</option>
            <option value="released" ${existing && existing.status === 'released' ? 'selected' : ''}>Released / Cleared</option>
          </select>
        </div>

      </div>
    `;

    Modal.open(isEdit ? `Edit Retention Record: ${existing.packageCode || ''}` : 'Add New Retention Record', html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="RetentionScreen.saveRetentionRecord(${isEdit ? `'${existing.id}'` : 'null'})" style="display:inline-flex;align-items:center;gap:6px">
        ${Icons.check} ${isEdit ? 'Save Changes' : 'Create Retention Record'}
      </button>
    `);
  },

  _onModalProjectChange(projId) {
    if (!projId) return;
    const proj = Store.getProject(projId);
    if (!proj) return;

    const nameInput = document.getElementById('ret-modal-proj-name');
    const pkgInput = document.getElementById('ret-modal-package');
    if (nameInput) nameInput.value = proj.name || '';
    if (pkgInput) {
      const num = String(proj.id).replace(/\D/g, '');
      pkgInput.value = num ? `PKG-${num.padStart(2, '0')}` : `PKG-${String(proj.id).toUpperCase()}`;
    }
    this._recalcModalAmounts();
  },

  _recalcModalAmounts() {
    const valInput = document.getElementById('ret-modal-contract-val');
    const pctInput = document.getElementById('ret-modal-pct');
    const heldInput = document.getElementById('ret-modal-held');

    if (!valInput || !pctInput || !heldInput) return;

    const numContract = parseFloat(valInput.value.replace(/[^0-9.]/g, '')) || 0;
    const numPct = parseFloat(pctInput.value) || 0;
    const numHeld = Math.round(numContract * (numPct / 100));

    heldInput.value = numHeld.toLocaleString('en-IN');
  },

  saveRetentionRecord(editId = null) {
    if (editId === 'null' || editId === 'undefined' || !editId) editId = null;
    const projId = document.getElementById('ret-modal-project') ? document.getElementById('ret-modal-project').value : '';
    const proj = projId ? Store.getProject(projId) : null;
    const projectNameInput = document.getElementById('ret-modal-proj-name');
    const projectName = (projectNameInput && projectNameInput.value.trim()) || (proj ? proj.name : 'General Project');

    const pkgInput = document.getElementById('ret-modal-package');
    const packageCode = (pkgInput && pkgInput.value.trim()) || 'PKG-01';

    const valInput = document.getElementById('ret-modal-contract-val');
    const contractValRaw = valInput ? valInput.value.trim() : '';
    if (!contractValRaw) {
      Toast.show('Please enter the Contract Value.', 'error');
      if (valInput) valInput.focus();
      return;
    }

    const pctInput = document.getElementById('ret-modal-pct');
    const retPctVal = pctInput ? parseFloat(pctInput.value) || 5.0 : 5.0;

    const heldInput = document.getElementById('ret-modal-held');
    const heldValRaw = heldInput ? heldInput.value.trim() : '';

    const numContract = parseFloat(contractValRaw.replace(/[^0-9.]/g, '')) || 0;
    const numHeld = parseFloat(heldValRaw.replace(/[^0-9.]/g, '')) || Math.round(numContract * (retPctVal / 100));

    const contractFormatted = `₹${numContract.toLocaleString('en-IN')}`;
    const heldFormatted = `₹${numHeld.toLocaleString('en-IN')}`;
    const pctFormatted = `${retPctVal}%`;

    const trancheInput = document.getElementById('ret-modal-tranche');
    const tranchePhase = trancheInput ? trancheInput.value : 'Tranche 1 (50% Handover / 50% DLP Exit)';

    const dueInput = document.getElementById('ret-modal-due-date');
    const releaseDueDate = dueInput ? dueInput.value : '';

    const triggerInput = document.getElementById('ret-modal-trigger');
    const releaseTrigger = triggerInput ? triggerInput.value.trim() : 'Commercial Handover Acceptance & Final Defect Liability Clearance Certificate';

    const statusInput = document.getElementById('ret-modal-status');
    const status = statusInput ? statusInput.value : 'on-schedule';

    const statusMap = {
      'on-schedule': { label: 'Active / On Schedule', badge: 'badge-active' },
      'under-review': { label: 'Under Review', badge: 'badge-warning' },
      'release-initiated': { label: 'Release Initiated', badge: 'badge-info' },
      'released': { label: 'Released', badge: 'badge-paid' }
    };

    const statusInfo = statusMap[status] || statusMap['on-schedule'];

    const recordData = {
      projectId: projId || (editId ? (Store.getRetentionRecord(editId) || {}).projectId : ''),
      projectName,
      packageCode,
      contractValue: contractFormatted,
      retentionPct: pctFormatted,
      retentionPercent: retPctVal,
      retentionHeld: heldFormatted,
      pendingRelease: status === 'released' ? 0 : numHeld,
      tranchePhase,
      releaseDueDate,
      releaseTrigger,
      status,
      statusLabel: statusInfo.label,
      badgeClass: statusInfo.badge
    };

    if (editId) {
      Store.updateRetentionRecord(editId, recordData);
      Toast.show(`Retention record for ${packageCode} updated successfully.`, 'success', 3500);
    } else {
      Store.createRetentionRecord(recordData);
      Toast.show(`Retention record for ${packageCode} created successfully.`, 'success', 3500);
    }

    Modal.closeAll();
    if (typeof App !== 'undefined' && App.currentScreen === 'retention') {
      App.refresh();
    }
  },

  deleteRecord(id) {
    const item = this._getRetentionData().find(x => x.id === id);
    if (!item) return;

    if (confirm(`Are you sure you want to delete the retention record for "${item.projectName} (${item.packageCode || ''})"?`)) {
      Store.deleteRetentionRecord(id);
      Modal.closeAll();
      Toast.show(`Retention record for ${item.packageCode || item.projectName} deleted.`, 'success', 3000);
      if (typeof App !== 'undefined' && App.currentScreen === 'retention') {
        App.refresh();
      }
    }
  },

  markReleaseInitiated(id) {
    Store.updateRetentionRecord(id, {
      status: 'release-initiated',
      statusLabel: 'Release Initiated',
      badgeClass: 'badge-info'
    });
    Modal.closeAll();
    Toast.show('Retention release clearance notice prepared and status updated to Release Initiated.', 'success', 4000);
    if (typeof App !== 'undefined' && App.currentScreen === 'retention') {
      App.refresh();
    }
  },

  auditTerms(id) {
    const item = this._getRetentionData().find(x => x.id === id);
    if (!item) return;

    const html = `
      <div style="display:flex;flex-direction:column;gap:12px;font-size:13px">
        <div style="padding:12px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;font-weight:600">Contract Package</div>
            <div style="font-size:15px;font-weight:700;color:var(--color-text-primary)">${Utils.escapeHtml(item.projectName)} (${Utils.escapeHtml(item.packageCode || '—')})</div>
          </div>
          <span class="badge ${item.badgeClass || 'badge-active'}">${Utils.escapeHtml(item.statusLabel || item.status || 'Active')}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md);background:#FFFFFF">
          <div><span style="color:var(--color-text-muted)">Contract Value:</span> <strong>${this._normAmt(item.contractValue)}</strong></div>
          <div><span style="color:var(--color-text-muted)">Retention Held:</span> <strong style="color:var(--color-primary-700)">${this._normAmt(item.retentionHeld)} (${item.retentionPct || (item.retentionPercent + '%')})</strong></div>
          <div><span style="color:var(--color-text-muted)">Release Due:</span> <strong>${Utils.formatDate(item.releaseDueDate)}</strong></div>
          <div><span style="color:var(--color-text-muted)">Tranche Window:</span> <strong>${Utils.escapeHtml(item.tranchePhase || 'Tranche 1')}</strong></div>
        </div>

        <div style="padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div style="font-size:11.5px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:4px">Release Prerequisite</div>
          <p style="margin:0;color:var(--color-text-secondary);line-height:1.5">${Utils.escapeHtml(item.releaseTrigger || 'Commercial Acceptance & Final Defect Clearance Certificate')}</p>
        </div>
      </div>
    `;

    Modal.open(`Retention Audit: ${item.packageCode || item.projectName}`, html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-outline" onclick="Modal.closeAll(); RetentionScreen.openEditRetentionModal('${item.id}')" style="display:inline-flex;align-items:center;gap:4px">
        ✏️ Edit Record
      </button>
      <button class="btn btn-outline btn-danger" onclick="RetentionScreen.deleteRecord('${item.id}')" style="color:var(--color-error)">
        🗑️ Delete
      </button>
      <button class="btn btn-primary" onclick="RetentionScreen.markReleaseInitiated('${item.id}')">
        Prepare Release Certificate
      </button>
    `);
  },

  generateReleaseAudit() {
    Toast.show('Automated Retention Tranche Release schedule generated.', 'success', 3500);
  },

  exportLedger() {
    Toast.show('Retention Ledger exported to CSV.', 'success', 3000);
  }
};
