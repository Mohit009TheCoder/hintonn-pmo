// ─── DLP Timelines Screen (Commercial PMO) ───
// Data-driven: modal lists REAL projects from Store.getProjects(),
// submitted claims are persisted via Store (localStorage + Firestore sync),
// and the schedule table normalises both legacy and current record shapes.
const DLPTimelinesScreen = {
  _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  // Real-world SLA matrix for defect severity
  _SEVERITY: {
    minor:    { label: 'Minor',    sla: '7 Days',    days: 7 },
    moderate: { label: 'Moderate', sla: '48 Hours',  days: 2 },
    critical: { label: 'Critical', sla: '24 Hours',  days: 1 },
  },

  _fmtAmt(n) {
    if (!n || n === 0) return '₹0';
    const s = Math.round(n).toString();
    let result = ''; const len = s.length;
    if (len <= 3) return '₹' + s;
    result = s.slice(-3); let remaining = s.slice(0, -3);
    while (remaining.length > 2) { result = remaining.slice(-2) + ',' + result; remaining = remaining.slice(0, -2); }
    if (remaining.length > 0) result = remaining + ',' + result;
    return '₹' + result;
  },

  _parseAmt(s) {
    if (!s) return 0;
    const str = String(s).replace(/[^0-9.MKmk]/g, '');
    if (str.includes('M') || str.includes('m')) return parseFloat(str) * 1000000;
    if (str.includes('K') || str.includes('k')) return parseFloat(str) * 1000;
    return parseFloat(str) || 0;
  },

  _getDLPData() {
    return Store.getDlpRecords();
  },

  // Normalise a DLP record so both seed-shape and full-shape records render correctly
  _normalize(d) {
    if (!d) return null;
    const project = d.projectId ? Store.getProject(d.projectId) : null;
    const projectName = d.projectName || (project ? project.name : 'Unknown Project');

    // Package code: use stored value, else derive PKG-0X from project id (p1 → PKG-01)
    let packageCode = d.packageCode;
    if (!packageCode) {
      if (d.projectId) {
        const num = String(d.projectId).replace(/\D/g, '');
        packageCode = num ? 'PKG-' + num.padStart(2, '0') : 'PKG-' + String(d.projectId).toUpperCase();
      } else {
        packageCode = 'PKG-—';
      }
    }

    const warrantyMonths = Number(d.warrantyMonths) || 12;
    const dlpDuration = d.dlpDuration || `${warrantyMonths} Months (DLP)`;

    // Countdown computed LIVE from expiry so it never goes stale
    let countdownDays = null;
    if (d.dlpExpiry) {
      const exp = new Date(d.dlpExpiry); exp.setHours(0, 0, 0, 0);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (!isNaN(exp)) countdownDays = Math.round((exp - today) / 86400000);
    }

    let handoverStatus = d.handoverStatus || d.statusLabel;
    if (!handoverStatus) {
      handoverStatus = countdownDays == null ? 'Scheduled' : (countdownDays < 0 ? 'DLP Expired' : 'DLP Active');
    }
    const statusLc = String(handoverStatus).toLowerCase();
    const badgeClass = d.badgeClass
      || (statusLc.includes('complete') ? 'badge-completed'
        : statusLc.includes('expired') ? 'badge-high'
        : statusLc.includes('scheduled') ? 'badge-review'
        : 'badge-active');

    // Retention at stake: prefer stored value, else pending release from Retention Records
    let retentionAmount = d.retentionAmount;
    if (!retentionAmount && d.projectId && Store.getRetentionRecords) {
      const ret = Store.getRetentionRecords().find(r => r.projectId === d.projectId);
      if (ret && ret.pendingRelease) retentionAmount = this._fmtAmt(ret.pendingRelease);
    }
    if (!retentionAmount) retentionAmount = '₹0';

    return Object.assign({}, d, {
      projectName, packageCode, dlpDuration,
      dlpExpiry: d.dlpExpiry || '—',
      countdownDays,
      handoverStatus, badgeClass,
      openDefects: Number(d.openDefects) || 0,
      closedDefects: Number(d.closedDefects) || 0,
      retentionAmount,
      warrantyValue: d.warrantyValue || retentionAmount,
      readiness: d.readiness != null ? d.readiness : (statusLc.includes('complete') ? 100 : 0),
      defectClaims: Array.isArray(d.defectClaims) ? d.defectClaims : [],
    });
  },

  render() {
    const items = this._getDLPData().map(d => this._normalize(d)).filter(Boolean);
    const fmtAmt = (n) => this._fmtAmt(n);
    const parseAmt = (s) => this._parseAmt(s);
    const activeDLPCount = items.filter(d => (d.readiness || 0) < 100).length;
    const totalWarrantyVal = fmtAmt(items.reduce((s, d) => s + parseAmt(d.warrantyValue || d.retentionAmount), 0));
    const totalWarrantyRetention = fmtAmt(items.reduce((s, d) => s + parseAmt(d.retentionAmount), 0));
    const openDefectsCount = items.reduce((s, d) => s + d.openDefects, 0);
    const nearestExpiry = items
      .filter(d => d.dlpExpiry && d.dlpExpiry !== '—' && d.countdownDays != null && d.countdownDays >= 0)
      .sort((a, b) => new Date(a.dlpExpiry) - new Date(b.dlpExpiry))[0];
    const nextExitDate = nearestExpiry
      ? `${Utils.formatDate(nearestExpiry.dlpExpiry)} (${nearestExpiry.countdownDays}d)`
      : '—';

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Defects Liability (DLP) Timelines</h1>
          <p>Post-handover warranty tracking, latent defect resolution, and final retention exit management.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="DLPTimelinesScreen.openDefectModal()">
            ${Icons.plus} Log Defect Claim
          </button>
          <button class="btn btn-primary" onclick="DLPTimelinesScreen.scheduleInspection()">
            ${Icons.calendar} Schedule Exit Audit
          </button>
        </div>
      </div>

      <!-- Top Summary KPI Row -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Active DLP Packages</span>
            <div class="kpi-icon-wrap">${Icons.target}</div>
          </div>
          <div class="kpi-value">${activeDLPCount} Packages</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-primary-700)">
            ${items.length > 0 ? `${totalWarrantyVal} Warranty Coverage Under Management` : 'No active warranty packages'}
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Next DLP Exit</span>
            <div class="kpi-icon-wrap alert">${Icons.clock}</div>
          </div>
          <div class="kpi-value" style="font-size:20px">${nextExitDate}</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-ai-700)">
            ${nearestExpiry ? `
              <span class="badge badge-high" style="font-size:10px;padding:2px 7px;font-weight:600">Exit Pending</span>
              ${this._esc(nearestExpiry.packageCode)} · ${this._esc(nearestExpiry.projectName)}${nearestExpiry.retentionAmount && nearestExpiry.retentionAmount !== '₹0' ? ` (${this._esc(nearestExpiry.retentionAmount)} Retention)` : ''}
            ` : '<span style="font-size:12px;color:var(--color-text-muted)">No exits pending</span>'}
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Open Defect Claims</span>
            <div class="kpi-icon-wrap">${Icons.alertCircle}</div>
          </div>
          <div class="kpi-value">${openDefectsCount} Claims</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
            ${items.length === 0 ? 'No defect claims logged' : openDefectsCount === 0 ? 'All defect claims resolved' : `${openDefectsCount} pending contractor resolution`}
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Warranty Retention</span>
            <div class="kpi-icon-wrap">${Icons.check}</div>
          </div>
          <div class="kpi-value">${items.length > 0 ? totalWarrantyRetention : '₹0'}</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
            ${items.length > 0 ? 'Guaranteed under DLP Bank Guarantees' : 'No retention at stake'}
          </div>
        </div>
      </div>

      <!-- Main DLP Schedule & Resolution Table -->
      <div class="section-card">
        <div class="section-card-header">
          <h3>${Icons.clock} Defects Liability & Warranty Schedule</h3>
          <span class="badge badge-active" style="font-size:11.5px">Active Monitoring</span>
        </div>

        <div class="section-card-body no-pad">
          ${items.length === 0 ? `
            <div style="padding:40px;text-align:center;color:var(--color-text-muted);font-size:13.5px">
              <div style="font-weight:600;color:var(--color-text-secondary);margin-bottom:6px">No DLP packages yet</div>
              Defect liability packages open automatically when you log a defect claim against a project, or after handover of a completed project.
              <div style="margin-top:14px">
                <button class="btn btn-primary btn-sm" onclick="DLPTimelinesScreen.openDefectModal()">${Icons.plus} Log First Defect Claim</button>
              </div>
            </div>` : `
          <div class="table-wrap">
            <table class="table commercial-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Handover Date</th>
                  <th>DLP Duration</th>
                  <th>DLP Expiry Date</th>
                  <th>Countdown / Horizon</th>
                  <th class="center">Open Defects</th>
                  <th class="num">Retention at Stake</th>
                  <th class="center">Handover Status</th>
                  <th class="center">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(d => `
                  <tr>
                    <td>
                      <div class="commercial-project-title" onclick="App.navigate('project-detail','${this._esc(d.projectId)}')">
                        ${this._esc(d.projectName)}
                      </div>
                      <div class="commercial-project-code">${this._esc(d.packageCode)}</div>
                    </td>
                    <td style="font-size:12.5px;color:var(--color-text-secondary)">
                      ${this._esc(d.handoverDate || '—')}
                    </td>
                    <td style="font-size:12.5px;color:var(--color-text-secondary)">
                      ${this._esc(d.dlpDuration)}
                    </td>
                    <td style="font-size:12.5px;font-weight:600;color:var(--color-text-primary);white-space:nowrap">
                      ${this._esc(d.dlpExpiry)}
                    </td>
                    <td>
                      ${d.countdownDays != null && d.countdownDays <= 60 ? `
                        <span class="badge badge-high" style="font-weight:700">${d.countdownDays} Days Remaining</span>` : `
                        <span style="font-size:12px;color:var(--color-text-muted)">${d.countdownDays != null ? d.countdownDays + ' Days Remaining' : 'In Progress'}</span>`}
                    </td>
                    <td class="center">
                      <span class="badge ${d.openDefects > 0 ? 'badge-review' : 'badge-completed'}">
                        ${d.openDefects} Open (${d.closedDefects} Closed)
                      </span>
                    </td>
                    <td class="num" style="font-weight:700;color:var(--color-text-primary)">
                      ${this._esc(d.retentionAmount)}
                    </td>
                    <td class="center">
                      <span class="badge ${d.badgeClass}">${this._esc(d.handoverStatus)}</span>
                    </td>
                    <td class="center">
                      <div style="display:flex;align-items:center;justify-content:center;gap:6px">
                        <button class="btn btn-outline btn-xs" onclick="DLPTimelinesScreen.viewPunchlist('${this._esc(d.id)}')">
                          Punchlist
                        </button>
                        ${d.countdownDays != null && d.countdownDays <= 60 ? `
                          <button class="btn btn-primary btn-xs" onclick="DLPTimelinesScreen.signOffModal('${this._esc(d.id)}')">
                            Sign-Off
                          </button>` : ''}
                      </div>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
        </div>
      </div>
    `;
  },

  viewPunchlist(id) {
    const raw = this._getDLPData().find(x => x.id === id);
    const d = this._normalize(raw);
    if (!d) return;

    const claims = d.defectClaims;
    const sevBadge = (sev) => sev === 'Critical' ? 'badge-high' : sev === 'Moderate' ? 'badge-review' : 'badge-active';

    const html = `
      <div style="display:flex;flex-direction:column;gap:12px;font-size:13px">
        <div style="padding:12px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;font-weight:600">DLP Package</div>
          <div style="font-size:15px;font-weight:700;color:var(--color-text-primary)">${this._esc(d.projectName)} (${this._esc(d.packageCode)})</div>
          <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px">Contractor: ${this._esc(d.contractor || 'Not assigned')}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div><span style="color:var(--color-text-muted)">DLP Expiry:</span> <strong>${this._esc(d.dlpExpiry)}</strong></div>
          <div><span style="color:var(--color-text-muted)">Retention Balance:</span> <strong style="color:var(--color-primary-700)">${this._esc(d.retentionAmount)}</strong></div>
          <div><span style="color:var(--color-text-muted)">Open Claims:</span> <strong>${d.openDefects}</strong></div>
          <div><span style="color:var(--color-text-muted)">Resolved Items:</span> <strong>${d.closedDefects}</strong></div>
        </div>

        <div style="padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div style="font-size:11.5px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:6px">DLP Defect Punchlist Audit</div>
          ${claims.length > 0 ? `
            ${claims.map(c => `
              <div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px dashed var(--color-border)">
                <div style="flex:1">
                  <div style="font-weight:600;color:var(--color-text-primary)">${this._esc(c.description)}</div>
                  <div style="font-size:11.5px;color:var(--color-text-muted);margin-top:2px">
                    Raised ${c.raisedAt ? this._esc(Utils.formatDate(c.raisedAt)) : '—'} by ${this._esc(c.raisedBy || '—')} · SLA: ${this._esc(c.sla || '—')}
                  </div>
                </div>
                <div style="text-align:right;white-space:nowrap">
                  <span class="badge ${sevBadge(c.severity)}">${this._esc(c.severity || 'Minor')}</span>
                  <div style="font-size:11px;color:${c.status === 'open' ? 'var(--color-error-600,#DC2626)' : '#15803D'};font-weight:600;margin-top:4px">${c.status === 'open' ? 'Open' : 'Resolved'}</div>
                </div>
              </div>`).join('')}
          ` : d.openDefects === 0 ? `
            <div style="color:#15803D;font-weight:600;display:flex;align-items:center;gap:6px">
              ${Icons.check} All snag and defect claims cleared. Eligible for Final Handover Certificate.
            </div>` : `
            <div style="color:var(--color-text-secondary);font-size:12.5px">
              ${d.openDefects} open claim(s) tracked against this package — no itemised punchlist entries recorded yet.
            </div>`}
        </div>
      </div>
    `;

    Modal.open(`DLP Punchlist: ${d.packageCode}`, html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-primary" onclick="Toast.show('DLP Punchlist report exported.', 'success'); Modal.closeAll();">
        Export Audit Punchlist
      </button>
    `);
  },

  signOffModal(id) {
    const d = this._normalize(this._getDLPData().find(x => x.id === id));
    if (!d) return;

    Modal.confirm(
      'Issue Final DLP Handover Sign-off',
      `Confirm completion of the Defects Liability Period for <strong>${this._esc(d.projectName)}</strong> and approve the release of <strong>${this._esc(d.retentionAmount)}</strong> final retention tranche?`,
      () => {
        Toast.show(`Final DLP Sign-off certificate issued for ${d.projectName}. Retention release unlocked.`, 'success', 4500);
      },
      { confirmText: 'Authorize Sign-off' }
    );
  },

  scheduleInspection() {
    this.openScheduleAuditModal();
  },

  openScheduleAuditModal(packageId = '') {
    const dlpRecords = this._getDLPData().map(d => this._normalize(d)).filter(Boolean);
    const projects = Store.getProjects();
    const members = Store.getMembers();

    // Default inspection date: 7 days from now
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const defaultDate = d.toISOString().split('T')[0];

    const packageOptions = dlpRecords.length > 0
      ? dlpRecords.map(p => `<option value="${this._esc(p.id || p.projectId)}" ${packageId === (p.id || p.projectId) ? 'selected' : ''}>${this._esc(p.packageCode)} — ${this._esc(p.projectName)} (DLP Expiry: ${this._esc(Utils.formatDate(p.dlpExpiry))})</option>`).join('')
      : projects.map(p => `<option value="${this._esc(p.id)}">${this._esc(p.name)}</option>`).join('');

    const memberOptions = members.length > 0
      ? members.map(m => `<option value="${this._esc(m.id)}">${this._esc(m.name)} (${this._esc(m.role || 'Auditor')})</option>`).join('')
      : '<option value="admin">PMO Lead Auditor</option>';

    const html = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:12px 14px;display:flex;align-items:flex-start;gap:10px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" width="18" height="18" style="flex-shrink:0;margin-top:2px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <div style="font-size:12.5px;color:#1E40AF;line-height:1.5;">
            <strong>DLP Joint Exit Audit</strong> — Formal site inspection between Employer/Client, Contractor & PMO representatives to verify closure of defects and authorize final retention release.
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600;font-size:13px;display:block;margin-bottom:6px">Select DLP Package / Project <span style="color:#EF4444">*</span></label>
          <select class="form-control" id="audit-dlp-package" style="width:100%;height:40px;border-radius:6px;border:1px solid var(--color-border);padding:0 12px;font-size:13.5px;background:var(--color-surface);color:var(--color-text-primary)">
            ${packageOptions}
          </select>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label" style="font-weight:600;font-size:13px;display:block;margin-bottom:6px">Audit Inspection Date <span style="color:#EF4444">*</span></label>
            <input type="date" class="form-control" id="audit-date" value="${defaultDate}" style="width:100%;height:40px;border-radius:6px;border:1px solid var(--color-border);padding:0 12px;font-size:13.5px;background:var(--color-surface);color:var(--color-text-primary)">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:600;font-size:13px;display:block;margin-bottom:6px">Inspection Time</label>
            <input type="time" class="form-control" id="audit-time" value="10:30" style="width:100%;height:40px;border-radius:6px;border:1px solid var(--color-border);padding:0 12px;font-size:13.5px;background:var(--color-surface);color:var(--color-text-primary)">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600;font-size:13px;display:block;margin-bottom:6px">Lead PMO Inspector</label>
          <select class="form-control" id="audit-lead-member" style="width:100%;height:40px;border-radius:6px;border:1px solid var(--color-border);padding:0 12px;font-size:13.5px;background:var(--color-surface);color:var(--color-text-primary)">
            ${memberOptions}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600;font-size:13px;display:block;margin-bottom:6px">Stakeholder Notice Recipients</label>
          <div style="display:flex;flex-direction:column;gap:6px;padding:10px 12px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-bg-page);font-size:12.5px;color:var(--color-text-secondary)">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="audit-notify-client" checked> <strong>Client Representative</strong> (Employer Project Lead)
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="audit-notify-contractor" checked> <strong>Main Contractor Project Head & QA Team</strong>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="audit-notify-pmo" checked> <strong>Hintonn PMO Commercial & Quality Auditor</strong>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600;font-size:13px;display:block;margin-bottom:6px">Audit Scope & Checklist Focus</label>
          <textarea class="form-control" id="audit-notes" rows="2" placeholder="e.g. Verify closure of defect claims, inspect MEP plant rooms, validate readiness for Final Retention Release." style="width:100%;border-radius:6px;border:1px solid var(--color-border);padding:8px 12px;font-size:13px;background:var(--color-surface);color:var(--color-text-primary);resize:vertical">Joint site inspection to verify closure of all outstanding defect claims, test building MEP systems, and validate readiness for final DLP certificate sign-off.</textarea>
        </div>
      </div>
    `;

    Modal.open('Schedule DLP Exit Audit & Dispatch Notice', html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="DLPTimelinesScreen.submitScheduleAudit()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>
        Dispatch Notice & Schedule Audit
      </button>
    `, { large: true });
  },

  submitScheduleAudit() {
    const packageSel = document.getElementById('audit-dlp-package');
    const dateInput = document.getElementById('audit-date');
    const timeInput = document.getElementById('audit-time');
    const leadSel = document.getElementById('audit-lead-member');
    const notesInput = document.getElementById('audit-notes');

    const notifyClient = document.getElementById('audit-notify-client')?.checked;
    const notifyContractor = document.getElementById('audit-notify-contractor')?.checked;
    const notifyPmo = document.getElementById('audit-notify-pmo')?.checked;

    const packageId = packageSel ? packageSel.value : '';
    const date = dateInput ? dateInput.value : '';
    const time = timeInput ? timeInput.value : '10:30';
    const leadId = leadSel ? leadSel.value : '';
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!packageId) { Toast.show('Please select a DLP package or project.', 'error'); return; }
    if (!date) { Toast.show('Please choose an audit inspection date.', 'error'); return; }

    const dlpRecords = this._getDLPData();
    const dlpRecord = dlpRecords.find(d => d.id === packageId || d.projectId === packageId);
    const projectName = dlpRecord ? dlpRecord.projectName : (Store.getProject(packageId)?.name || 'Project');
    const leadMember = Store.getMember(leadId);
    const leadName = leadMember ? leadMember.name : 'PMO Lead';

    const recipients = [];
    if (notifyClient) recipients.push('Client Engineering Team');
    if (notifyContractor) recipients.push('Main Contractor Project Head');
    if (notifyPmo) recipients.push('Hintonn PMO Quality Auditor');

    // Update DLP Record with scheduled exit inspection
    if (dlpRecord) {
      Store.updateDlpRecord(dlpRecord.id, {
        exitAuditScheduled: true,
        exitAuditDate: date,
        exitAuditTime: time,
        exitAuditLead: leadName,
        exitAuditNotes: notes,
        handoverStatus: 'Audit Scheduled'
      });
    }

    // Add activity to project timeline
    if (Store.addActivity) {
      Store.addActivity({
        type: 'dlp_audit_scheduled',
        text: `📅 DLP Exit Joint Site Inspection scheduled for <strong>${this._esc(projectName)}</strong> on ${Utils.formatDate(date)} at ${time}. Notice dispatched to: ${recipients.join(', ')}.`,
        projectId: dlpRecord ? dlpRecord.projectId : packageId,
        date: new Date().toISOString()
      });
    }

    // Add workspace notification
    if (Store.addNotification) {
      Store.addNotification({
        type: 'dlp',
        text: `📋 <strong>DLP Exit Audit Scheduled:</strong> ${this._esc(projectName)} on ${Utils.formatDate(date)} (${time}). Dispatched to ${recipients.join(', ')}.`,
        projectId: dlpRecord ? dlpRecord.projectId : packageId,
        read: false
      });
    }

    Modal.closeAll();
    Toast.show(`✅ Joint Site Inspection scheduled for ${projectName} on ${Utils.formatDate(date)} at ${time}. Notice dispatched to ${recipients.length} stakeholder groups.`, 'success', 5000);
    this.refresh();
  },

  openDefectModal() {
    // REAL projects from the system store (Firestore-synced), not hardcoded seed names
    const projects = Store.getProjects();
    const projectOptions = projects.length > 0
      ? projects.map(p => `<option value="${this._esc(p.id)}">${this._esc(p.name)}${p.status ? ' · ' + this._esc(Utils.humanize(p.status)) : ''}</option>`).join('')
      : `<option value="" disabled selected>No projects in the system yet</option>`;

    const html = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="form-group">
          <label class="form-label">Project</label>
          <select class="form-control" id="dlp-claim-project">
            <option value="" disabled ${projects.length ? 'selected' : ''}>Select a project…</option>
            ${projectOptions}
          </select>
          <div style="font-size:11.5px;color:var(--color-text-muted);margin-top:4px">
            Claims are logged against the project's DLP package — a new package opens automatically if the project has none.
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Defect Summary / Description</label>
          <input type="text" class="form-control" id="dlp-claim-desc" placeholder="e.g. HVAC condensation line leak in Server Room B">
        </div>
        <div class="form-group">
          <label class="form-label">Severity Level</label>
          <select class="form-control" id="dlp-claim-severity">
            <option value="minor" selected>Minor (SLA: 7 Days)</option>
            <option value="moderate">Moderate (SLA: 48 Hours)</option>
            <option value="critical">Critical (SLA: 24 Hours)</option>
          </select>
        </div>
      </div>
    `;

    Modal.open('Log Defect Liability Claim', html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="DLPTimelinesScreen.submitDefectClaim()">
        Submit Claim
      </button>
    `);
  },

  submitDefectClaim() {
    const projectSel = document.getElementById('dlp-claim-project');
    const descInput = document.getElementById('dlp-claim-desc');
    const sevSel = document.getElementById('dlp-claim-severity');

    const projectId = projectSel ? projectSel.value : '';
    const description = descInput ? descInput.value.trim() : '';
    const sev = this._SEVERITY[sevSel ? sevSel.value : 'minor'] || this._SEVERITY.minor;

    if (!projectId) { Toast.show('Select a project for the defect claim.', 'error'); return; }
    if (description.length < 10) { Toast.show('Describe the defect in at least 10 characters.', 'error'); return; }

    const project = Store.getProject(projectId);
    if (!project) { Toast.show('Selected project not found in the system.', 'error'); return; }

    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const raisedBy = user ? (user.name || user.email || 'Team Member') : 'Team Member';
    const today = new Date().toISOString().split('T')[0];

    const claim = {
      id: 'dc-' + Date.now().toString(36),
      description,
      severity: sev.label,
      sla: sev.sla,
      status: 'open',
      raisedBy,
      raisedAt: today,
    };

    // If the project already has a DLP package → append the claim & bump open count
    const existing = this._getDLPData().find(r => r.projectId === projectId);
    if (existing) {
      Store.updateDlpRecord(existing.id, {
        openDefects: (Number(existing.openDefects) || 0) + 1,
        defectClaims: [...(Array.isArray(existing.defectClaims) ? existing.defectClaims : []), claim],
      });
    } else {
      // Open a NEW DLP package with real-world defaults derived from the project
      const num = String(projectId).replace(/\D/g, '');
      const packageCode = num ? 'PKG-' + num.padStart(2, '0') : 'PKG-' + String(projectId).toUpperCase();
      const handoverDate = project.endDate || today;
      const warrantyMonths = 12; // Standard DLP window until contract says otherwise
      const exp = new Date(handoverDate); exp.setMonth(exp.getMonth() + warrantyMonths);
      const dlpExpiry = exp.toISOString().split('T')[0];

      // Retention at stake = pending release from the project's retention record, if any
      let retentionAmount = '₹0';
      if (Store.getRetentionRecords) {
        const ret = Store.getRetentionRecords().find(r => r.projectId === projectId);
        if (ret && ret.pendingRelease) retentionAmount = this._fmtAmt(ret.pendingRelease);
      }

      Store.createDlpRecord({
        projectId,
        projectName: project.name,
        packageCode,
        contractor: 'TBD — Contractor Appointment Pending',
        handoverDate,
        dlpDuration: `${warrantyMonths} Months (DLP)`,
        warrantyMonths,
        dlpExpiry,
        openDefects: 1,
        closedDefects: 0,
        readiness: 0,
        handoverStatus: 'DLP Active',
        statusLabel: 'In Progress',
        retentionAmount,
        warrantyValue: retentionAmount,
        defectClaims: [claim],
      });
    }

    // Notify the workspace (shows in the notification bell)
    if (Store.addNotification) {
      Store.addNotification({
        type: 'dlp',
        text: `📄 DLP defect claim logged on <strong>${this._esc(project.name)}</strong> — ${sev.label} severity (SLA: ${sev.sla}).`,
        projectId: projectId,
        read: false,
      });
    }

    Toast.show(`Defect claim logged for ${project.name} — ${sev.label} severity (SLA: ${sev.sla}).`, 'success', 4500);
    Modal.closeAll();
  }
};
