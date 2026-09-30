// ─── DLP Timelines Screen (Commercial PMO) ───
const DLPTimelinesScreen = {
  _getDLPData() {
    return Store.getDlpRecords();
  },

  render() {
    const items = this._getDLPData();
    const parseAmt = (s) => { if (!s) return 0; const str = String(s).replace(/[^0-9.MKmk]/g, ''); if (str.includes('M')||str.includes('m')) return parseFloat(str)*1000000; if (str.includes('K')||str.includes('k')) return parseFloat(str)*1000; return parseFloat(str)||0; };
    const fmtAmt = (n) => { if (!n || n === 0) return '₹0'; const s = Math.round(n).toString(); let result = ''; const len = s.length; if (len <= 3) return '₹' + s; result = s.slice(-3); let remaining = s.slice(0, -3); while (remaining.length > 2) { result = remaining.slice(-2) + ',' + result; remaining = remaining.slice(0, -2); } if (remaining.length > 0) result = remaining + ',' + result; return '₹' + result; };
    const activeDLPCount = items.filter(d => (d.readiness || 0) < 100).length;
    const totalWarrantyVal = fmtAmt(items.reduce((s,d) => s + parseAmt(d.warrantyValue || d.retentionAmount), 0));
    const totalWarrantyRetention = fmtAmt(items.reduce((s,d) => s + parseAmt(d.retentionAmount), 0));
    const openDefectsCount = items.reduce((s,d) => s + (Number(d.openDefects) || 0), 0);
    const nearestExpiry = items.filter(d => d.dlpExpiry).sort((a,b) => new Date(a.dlpExpiry) - new Date(b.dlpExpiry))[0];
    const nextExitDate = nearestExpiry ? `${Utils.formatDate(nearestExpiry.dlpExpiry)} (${nearestExpiry.countdownDays != null ? nearestExpiry.countdownDays + 'd' : '?'})` : '—';

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
              ${nearestExpiry.packageCode || nearestExpiry.projectName || ''}${nearestExpiry.retentionAmount ? ` (${nearestExpiry.retentionAmount} Retention)` : ''}
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
                      <div class="commercial-project-title" onclick="App.navigate('project-detail','${d.projectId}')">
                        ${d.projectName}
                      </div>
                      <div class="commercial-project-code">${d.packageCode}</div>
                    </td>
                    <td style="font-size:12.5px;color:var(--color-text-secondary)">
                      ${d.handoverDate}
                    </td>
                    <td style="font-size:12.5px;color:var(--color-text-secondary)">
                      ${d.dlpDuration}
                    </td>
                    <td style="font-size:12.5px;font-weight:600;color:var(--color-text-primary);white-space:nowrap">
                      ${d.dlpExpiry}
                    </td>
                    <td>
                      ${d.countdownDays <= 60 ? `
                        <span class="badge badge-high" style="font-weight:700">${d.countdownDays} Days Remaining</span>` : `
                        <span style="font-size:12px;color:var(--color-text-muted)">In Progress</span>`}
                    </td>
                    <td class="center">
                      <span class="badge ${d.openDefects > 0 ? 'badge-review' : 'badge-completed'}">
                        ${d.openDefects} Open (${d.closedDefects} Closed)
                      </span>
                    </td>
                    <td class="num" style="font-weight:700;color:var(--color-text-primary)">
                      ${d.retentionAmount}
                    </td>
                    <td class="center">
                      <span class="badge ${d.badgeClass}">${d.handoverStatus}</span>
                    </td>
                    <td class="center">
                      <div style="display:flex;align-items:center;justify-content:center;gap:6px">
                        <button class="btn btn-outline btn-xs" onclick="DLPTimelinesScreen.viewPunchlist('${d.id}')">
                          Punchlist
                        </button>
                        ${d.countdownDays <= 60 ? `
                          <button class="btn btn-primary btn-xs" onclick="DLPTimelinesScreen.signOffModal('${d.id}')">
                            Sign-Off
                          </button>` : ''}
                      </div>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  viewPunchlist(id) {
    const d = this._getDLPData().find(x => x.id === id);
    if (!d) return;

    const html = `
      <div style="display:flex;flex-direction:column;gap:12px;font-size:13px">
        <div style="padding:12px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;font-weight:600">DLP Package</div>
          <div style="font-size:15px;font-weight:700;color:var(--color-text-primary)">${d.projectName} (${d.packageCode})</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div><span style="color:var(--color-text-muted)">DLP Expiry:</span> <strong>${d.dlpExpiry}</strong></div>
          <div><span style="color:var(--color-text-muted)">Retention Balance:</span> <strong style="color:var(--color-primary-700)">${d.retentionAmount}</strong></div>
          <div><span style="color:var(--color-text-muted)">Open Claims:</span> <strong>${d.openDefects}</strong></div>
          <div><span style="color:var(--color-text-muted)">Resolved Items:</span> <strong>${d.closedDefects}</strong></div>
        </div>

        <div style="padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div style="font-size:11.5px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:6px">DLP Defect Punchlist Audit</div>
          ${d.openDefects === 0 ? `
            <div style="color:#15803D;font-weight:600;display:flex;align-items:center;gap:6px">
              ${Icons.check} All snag and defect claims cleared. Eligible for Final Handover Certificate.
            </div>` : `
            <div style="color:var(--color-text-secondary);font-size:12.5px">
              1 outstanding test report verification pending from electrical commissioning engineer.
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
    const d = this._getDLPData().find(x => x.id === id);
    if (!d) return;

    Modal.confirm(
      'Issue Final DLP Handover Sign-off',
      `Confirm completion of the Defects Liability Period for <strong>${d.projectName}</strong> and approve the release of <strong>${d.retentionAmount}</strong> final retention tranche?`,
      () => {
        Toast.show(`Final DLP Sign-off certificate issued for ${d.projectName}. Retention release unlocked.`, 'success', 4500);
      },
      { confirmText: 'Authorize Sign-off' }
    );
  },

  scheduleInspection() {
    Toast.show('DLP Exit Joint Site Inspection notice sent to Client & Contractor teams.', 'success', 3500);
  },

  openDefectModal() {
    const html = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="form-group">
          <label class="form-label">Project</label>
          <select class="form-control">
            <option>Website & Site Facilities (PKG-05)</option>
            <option>Client Substation Package (PKG-02)</option>
            <option>Hintonn AI Core Platform (PKG-01)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Defect Summary / Description</label>
          <input type="text" class="form-control" placeholder="e.g. HVAC condensation line leak in Server Room B">
        </div>
        <div class="form-group">
          <label class="form-label">Severity Level</label>
          <select class="form-control">
            <option>Minor (SLA: 7 Days)</option>
            <option>Moderate (SLA: 48 Hours)</option>
            <option>Critical (SLA: 24 Hours)</option>
          </select>
        </div>
      </div>
    `;

    Modal.open('Log Defect Liability Claim', html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="Toast.show('Defect claim registered and sent to contractor.', 'success'); Modal.closeAll();">
        Submit Claim
      </button>
    `);
  }
};
