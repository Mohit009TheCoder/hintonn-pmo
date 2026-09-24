// ─── DLP Timelines Screen (Commercial PMO) ───
const DLPTimelinesScreen = {
  _getDLPData() {
    return [
      {
        id: 'dlp-1',
        projectName: 'Website & Site Facilities Package',
        projectId: 'p5',
        packageCode: 'PKG-05 · Civil & Architectural',
        handoverDate: '2025-10-30',
        dlpDuration: '12 Months',
        dlpExpiry: '2026-10-30',
        countdownDays: 38,
        openDefects: 0,
        closedDefects: 6,
        warrantyValue: '$1,400,000',
        retentionAmount: '$140,000',
        handoverStatus: 'Exit Audit Scheduled',
        badgeClass: 'badge-medium',
        readiness: 98
      },
      {
        id: 'dlp-2',
        projectName: 'Client Substation Package',
        projectId: 'p2',
        packageCode: 'PKG-02 · Substation',
        handoverDate: '2026-11-30 (Estimated)',
        dlpDuration: '24 Months',
        dlpExpiry: '2028-11-30',
        countdownDays: 798,
        openDefects: 1,
        closedDefects: 2,
        warrantyValue: '$3,400,000',
        retentionAmount: '$170,000',
        handoverStatus: 'Pre-Handover Testing',
        badgeClass: 'badge-review',
        readiness: 72
      },
      {
        id: 'dlp-3',
        projectName: 'Hintonn AI Core Platform',
        projectId: 'p1',
        packageCode: 'PKG-01 · Core EPC Phase 1',
        handoverDate: '2027-01-15 (Estimated)',
        dlpDuration: '12 Months',
        dlpExpiry: '2028-01-15',
        countdownDays: 844,
        openDefects: 3,
        closedDefects: 14,
        warrantyValue: '$5,800,000',
        retentionAmount: '$290,000',
        handoverStatus: 'Execution Stage',
        badgeClass: 'badge-active',
        readiness: 68
      },
      {
        id: 'dlp-4',
        projectName: 'Utilities & Plant Balance',
        projectId: 'p3',
        packageCode: 'PKG-03 · Utilities & Aux',
        handoverDate: '2027-05-20 (Estimated)',
        dlpDuration: '12 Months',
        dlpExpiry: '2028-05-20',
        countdownDays: 970,
        openDefects: 0,
        closedDefects: 0,
        warrantyValue: '$2,100,000',
        retentionAmount: '$105,000',
        handoverStatus: 'Procurement Phase',
        badgeClass: 'badge-active',
        readiness: 15
      }
    ];
  },

  render() {
    const items = this._getDLPData();
    const activeDLPCount = 3;
    const totalWarrantyVal = '$10.6M';
    const openDefectsCount = 4;
    const nextExitDate = 'Oct 30, 2026 (38 Days)';

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
            ${totalWarrantyVal} Warranty Coverage Under Management
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Next DLP Exit</span>
            <div class="kpi-icon-wrap alert">${Icons.clock}</div>
          </div>
          <div class="kpi-value" style="font-size:20px">${nextExitDate}</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-ai-700)">
            <span class="badge badge-high" style="font-size:10px;padding:2px 7px;font-weight:600">Exit Pending</span>
            PKG-05 ($140K Retention)
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Open Defect Claims</span>
            <div class="kpi-icon-wrap">${Icons.alertCircle}</div>
          </div>
          <div class="kpi-value">${openDefectsCount} Claims</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
            100% Within Contractor SLA (Avg 4.2d)
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Warranty Retention</span>
            <div class="kpi-icon-wrap">${Icons.check}</div>
          </div>
          <div class="kpi-value">$705K</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
            Guaranteed under DLP Bank Guarantees
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
