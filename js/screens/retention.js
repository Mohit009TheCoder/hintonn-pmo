// ─── Retention Summary Screen (Commercial PMO) ───
const RetentionScreen = {
  _getRetentionData() {
    return [
      {
        id: 'ret-1',
        projectName: 'Hintonn AI Core Platform',
        projectId: 'p1',
        packageCode: 'PKG-01 · Core EPC Phase 1',
        contractValue: '$5,800,000',
        retentionPct: '5.0%',
        retentionHeld: '$290,000',
        releaseDueDate: '2027-03-15',
        releaseTrigger: 'Final EPC Commissioning & Handover Acceptance',
        status: 'on-schedule',
        statusLabel: 'On Schedule',
        badgeClass: 'badge-active',
        tranchePhase: 'Tranche 3 (Q1 2027)'
      },
      {
        id: 'ret-2',
        projectName: 'Client Substation Package',
        projectId: 'p2',
        packageCode: 'PKG-02 · Substation Package',
        contractValue: '$3,400,000',
        retentionPct: '5.0%',
        retentionHeld: '$170,000',
        releaseDueDate: '2026-11-30',
        releaseTrigger: 'Substation Energization & Grid Interconnect',
        status: 'under-review',
        statusLabel: 'Under Review',
        badgeClass: 'badge-review',
        tranchePhase: 'Tranche 2 (Q4 2026)'
      },
      {
        id: 'ret-3',
        projectName: 'Utilities & Plant Balance',
        projectId: 'p3',
        packageCode: 'PKG-03 · Utilities & Aux',
        contractValue: '$2,100,000',
        retentionPct: '5.0%',
        retentionHeld: '$105,000',
        releaseDueDate: '2027-05-20',
        releaseTrigger: '72-Hour Performance Guarantee Demonstration',
        status: 'on-schedule',
        statusLabel: 'On Schedule',
        badgeClass: 'badge-active',
        tranchePhase: 'Tranche 4 (Q2 2027)'
      },
      {
        id: 'ret-4',
        projectName: 'Grid Automation & LoRA AI',
        projectId: 'p4',
        packageCode: 'PKG-04 · Automation & SCADA',
        contractValue: '$1,500,000',
        retentionPct: '5.0%',
        retentionHeld: '$75,000',
        releaseDueDate: '2027-08-15',
        releaseTrigger: 'SCADA Telemetry Final Site Acceptance',
        status: 'on-schedule',
        statusLabel: 'On Schedule',
        badgeClass: 'badge-active',
        tranchePhase: 'Tranche 5 (Q3 2027)'
      },
      {
        id: 'ret-5',
        projectName: 'Website & Site Facilities Package',
        projectId: 'p5',
        packageCode: 'PKG-05 · Civil & Architectural',
        contractValue: '$1,400,000',
        retentionPct: '10.0%',
        retentionHeld: '$140,000',
        releaseDueDate: '2026-10-30',
        releaseTrigger: 'Defects Liability Period (DLP) Final Clearance',
        status: 'release-initiated',
        statusLabel: 'Release Initiated',
        badgeClass: 'badge-in-progress',
        tranchePhase: 'Tranche 1 (Oct 2026)'
      }
    ];
  },

  render() {
    const items = this._getRetentionData();
    const totalRetention = '$780,000';
    const activeRetention = '$450,000';
    const dlpRetention = '$330,000';
    const nextReleaseDate = 'Oct 30, 2026';

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Retention Summary & Ledger</h1>
          <p>Retention tracking, tranche maturity schedule, and Defects Liability (DLP) release triggers.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="RetentionScreen.exportLedger()">
            ${Icons.download} Export Retention Ledger
          </button>
          <button class="btn btn-primary" onclick="RetentionScreen.generateReleaseAudit()">
            ${Icons.check} Generate Release Tranche
          </button>
        </div>
      </div>

      <!-- Top Summary KPI Row -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Total Retention Held</span>
            <div class="kpi-icon-wrap">${Icons.target}</div>
          </div>
          <div class="kpi-value">${totalRetention}</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-primary-700)">
            Cumulative 5.5% Across Portfolio
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Active EPC Retention</span>
            <div class="kpi-icon-wrap">${Icons.folder}</div>
          </div>
          <div class="kpi-value">${activeRetention}</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
            4 Active Construction Packages
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">DLP Exit Retention</span>
            <div class="kpi-icon-wrap">${Icons.clock}</div>
          </div>
          <div class="kpi-value">${dlpRetention}</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-ai-700)">
            <span class="badge badge-high" style="font-size:10px;padding:2px 7px;font-weight:600">Action Needed</span>
            1 Release Tranche Due in 38d
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Next Release Due</span>
            <div class="kpi-icon-wrap">${Icons.calendar}</div>
          </div>
          <div class="kpi-value" style="font-size:22px">${nextReleaseDate}</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
            $140,000 · PKG-05 Final DLP
          </div>
        </div>
      </div>

      <!-- Main Project Retention Table Card -->
      <div class="section-card">
        <div class="section-card-header">
          <h3>${Icons.fileText} EPC Project Retention Ledger</h3>
          <span class="badge badge-active" style="font-size:11.5px">5 Packages Monitored</span>
        </div>

        <div class="section-card-body no-pad">
          <div class="table-wrap">
            <table class="table commercial-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th class="num">Contract Value</th>
                  <th class="center">Retention %</th>
                  <th class="num">Retention Held ($)</th>
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
                      <div class="commercial-project-title" onclick="App.navigate('project-detail','${r.projectId}')">
                        ${r.projectName}
                      </div>
                      <div class="commercial-project-code">${r.packageCode}</div>
                    </td>
                    <td class="num" style="font-weight:600;color:var(--color-text-primary)">
                      ${r.contractValue}
                    </td>
                    <td class="center" style="font-weight:600;color:var(--color-text-secondary)">
                      ${r.retentionPct}
                    </td>
                    <td class="num" style="font-weight:700;color:var(--color-text-primary)">
                      ${r.retentionHeld}
                    </td>
                    <td style="font-size:12px;color:var(--color-text-muted)">
                      ${r.tranchePhase}
                    </td>
                    <td style="font-size:12.5px;color:var(--color-text-secondary);white-space:nowrap">
                      ${Utils.formatDate(r.releaseDueDate)}
                    </td>
                    <td style="font-size:12px;color:var(--color-text-secondary);max-width:220px" title="${r.releaseTrigger}">
                      ${r.releaseTrigger}
                    </td>
                    <td class="center">
                      <span class="badge ${r.badgeClass}">${r.statusLabel}</span>
                    </td>
                    <td class="center">
                      <button class="btn btn-outline btn-xs" onclick="RetentionScreen.auditTerms('${r.id}')">
                        Audit
                      </button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  auditTerms(id) {
    const item = this._getRetentionData().find(x => x.id === id);
    if (!item) return;

    const html = `
      <div style="display:flex;flex-direction:column;gap:12px;font-size:13px">
        <div style="padding:12px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;font-weight:600">Contract Package</div>
          <div style="font-size:15px;font-weight:700;color:var(--color-text-primary)">${item.projectName} (${item.packageCode})</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md);background:#FFFFFF">
          <div><span style="color:var(--color-text-muted)">Contract Value:</span> <strong>${item.contractValue}</strong></div>
          <div><span style="color:var(--color-text-muted)">Retention Held:</span> <strong style="color:var(--color-primary-700)">${item.retentionHeld} (${item.retentionPct})</strong></div>
          <div><span style="color:var(--color-text-muted)">Release Due:</span> <strong>${Utils.formatDate(item.releaseDueDate)}</strong></div>
          <div><span style="color:var(--color-text-muted)">Tranche Window:</span> <strong>${item.tranchePhase}</strong></div>
        </div>

        <div style="padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div style="font-size:11.5px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:4px">Release Prerequisite</div>
          <p style="margin:0;color:var(--color-text-secondary);line-height:1.5">${item.releaseTrigger}</p>
        </div>
      </div>
    `;

    Modal.open(`Retention Audit: ${item.packageCode}`, html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-primary" onclick="Toast.show('Retention release clearance notice prepared.', 'success'); Modal.closeAll();">
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
