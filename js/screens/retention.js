// ─── Retention Summary Screen (Commercial PMO) ───
const RetentionScreen = {
  _getRetentionData() {
    return Store.getRetentionRecords();
  },

  render() {
    const items = this._getRetentionData();
    const parseAmt = (s) => { if (!s) return 0; const str = String(s).replace(/[^0-9.MKmk]/g, ''); if (str.includes('M')||str.includes('m')) return parseFloat(str)*1000000; if (str.includes('K')||str.includes('k')) return parseFloat(str)*1000; return parseFloat(str)||0; };
    const fmtAmt = (n) => { if (n >= 1000000) return '$' + (n/1000000).toFixed(1) + 'M'; if (n >= 1000) return '$' + Math.round(n/1000) + 'K'; return '$' + n.toLocaleString(); };
    const totalRetention = fmtAmt(items.reduce((s,r) => s + parseAmt(r.retentionHeld), 0));
    const activeRetention = fmtAmt(items.filter(r => r.status === 'on-schedule').reduce((s,r) => s + parseAmt(r.retentionHeld), 0));
    const dlpRetention = fmtAmt(items.filter(r => r.status === 'under-review' || r.status === 'release-initiated').reduce((s,r) => s + parseAmt(r.retentionHeld), 0));
    const nextRelease = items.filter(r => r.releaseDueDate).sort((a,b) => new Date(a.releaseDueDate) - new Date(b.releaseDueDate))[0];
    const nextReleaseDate = nextRelease ? Utils.formatDate(nextRelease.releaseDueDate) : '—';

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
            ${nextRelease ? nextRelease.retentionHeld + ' · ' + (nextRelease.packageCode || nextRelease.projectName || '') : 'No releases scheduled'}
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
