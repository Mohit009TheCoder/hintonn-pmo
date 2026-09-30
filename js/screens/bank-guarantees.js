// ─── Bank Guarantees Screen (Commercial PMO) ───
const BankGuaranteesScreen = {
  _filter: 'all',

  _getBGs() {
    return Store.getBankGuarantees();
  },

  render() {
    const allBGs = this._getBGs();
    let bgs = allBGs;

    if (this._filter === 'critical') {
      bgs = bgs.filter(b => b.risk === 'critical');
    } else if (this._filter === 'warning') {
      bgs = bgs.filter(b => b.risk === 'warning');
    } else if (this._filter === 'active') {
      bgs = bgs.filter(b => b.status === 'active');
    } else if (this._filter === 'released') {
      bgs = bgs.filter(b => b.status === 'released');
    }

    const totalActive = allBGs.filter(b => b.status !== 'released').length;
    const parseAmt = (s) => { if (!s) return 0; const str = String(s).replace(/[^0-9.MKmk]/g, ''); if (str.includes('M')||str.includes('m')) return parseFloat(str)*1000000; if (str.includes('K')||str.includes('k')) return parseFloat(str)*1000; return parseFloat(str)||0; };
    const fmtAmt = (n) => { if (!n || n === 0) return '₹0'; const s = Math.round(n).toString(); let result = ''; const len = s.length; if (len <= 3) return '₹' + s; result = s.slice(-3); let remaining = s.slice(0, -3); while (remaining.length > 2) { result = remaining.slice(-2) + ',' + result; remaining = remaining.slice(0, -2); } if (remaining.length > 0) result = remaining + ',' + result; return '₹' + result; };
    const totalValue = fmtAmt(allBGs.filter(b => b.status !== 'released').reduce((s,b) => s + parseAmt(b.amount), 0));
    const criticalCount = allBGs.filter(b => b.risk === 'critical').length;
    const warningCount = allBGs.filter(b => b.risk === 'warning').length;

    const criticalBGs = allBGs.filter(b => b.risk === 'critical');
    const warningBGs = allBGs.filter(b => b.risk === 'warning');
    const warningVal = fmtAmt(warningBGs.reduce((s,b) => s + parseAmt(b.amount), 0));

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Bank Guarantees (BG) Management</h1>
          <p>Active Performance, Advance Payment, and Defects Liability guarantees with live expiry risk monitoring.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="BankGuaranteesScreen.batchRenewalModal()">
            ${Icons.refresh} Batch Renewals
          </button>
          <button class="btn btn-primary" onclick="BankGuaranteesScreen.openNewBGModal()">
            ${Icons.plus} Register New BG
          </button>
        </div>
      </div>

      <!-- Top Summary KPI Row -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Active Guarantees</span>
            <div class="kpi-icon-wrap">${Icons.shield}</div>
          </div>
          <div class="kpi-value">${totalActive} Active BGs</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-primary-700)">
            ${allBGs.length > 0 ? `${totalValue} Total Portfolio Guarantee Value` : 'No active guarantees'}
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Critical Expiry</span>
            <div class="kpi-icon-wrap alert">${Icons.alertCircle}</div>
          </div>
          <div class="kpi-value">${criticalCount} BG</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-ai-700)">
            ${criticalCount > 0 ? `
              <span class="badge badge-high" style="font-size:10px;padding:2px 7px;font-weight:600">Action Needed</span>
              Expiring in &lt; 30 Days (${criticalBGs[0].ref || criticalBGs[0].bgNumber || 'Critical Risk'})
            ` : '<span style="font-size:12px;color:var(--color-text-muted)">No guarantees at critical risk</span>'}
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Warning Expiry</span>
            <div class="kpi-icon-wrap">${Icons.clock}</div>
          </div>
          <div class="kpi-value">${warningCount} BGs</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
            ${warningCount > 0 ? `Expiring in 30–60 Days (${warningVal})` : 'No guarantees in 30–60 day window'}
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Issuing Banks</span>
            <div class="kpi-icon-wrap">${Icons.folder}</div>
          </div>
          <div class="kpi-value">5 Institutions</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
            Standard Chartered, HSBC, Barclays, Citi
          </div>
        </div>
      </div>

      <!-- Filter Tabs & Main BG Data Table -->
      <div class="section-card">
        <div class="section-card-header" style="flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn btn-sm ${this._filter==='all'?'btn-primary':'btn-secondary'}" onclick="BankGuaranteesScreen.setFilter('all')">
              All Guarantees (${allBGs.length})
            </button>
            <button class="btn btn-sm ${this._filter==='critical'?'btn-primary':'btn-secondary'}" onclick="BankGuaranteesScreen.setFilter('critical')">
              Critical &lt; 30d (${allBGs.filter(b=>b.risk==='critical').length})
            </button>
            <button class="btn btn-sm ${this._filter==='warning'?'btn-primary':'btn-secondary'}" onclick="BankGuaranteesScreen.setFilter('warning')">
              Warning 30–60d (${allBGs.filter(b=>b.risk==='warning').length})
            </button>
            <button class="btn btn-sm ${this._filter==='active'?'btn-primary':'btn-secondary'}" onclick="BankGuaranteesScreen.setFilter('active')">
              Safe (${allBGs.filter(b=>b.risk==='safe').length})
            </button>
            <button class="btn btn-sm ${this._filter==='released'?'btn-primary':'btn-secondary'}" onclick="BankGuaranteesScreen.setFilter('released')">
              Released
            </button>
          </div>
        </div>

        <div class="section-card-body no-pad">
          <div class="table-wrap">
            <table class="table commercial-table">
              <thead>
                <tr>
                  <th>BG Reference #</th>
                  <th>Issuing Bank</th>
                  <th>Project / Package</th>
                  <th>Guarantee Type</th>
                  <th class="num">Amount ($)</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th class="center">Risk / Status</th>
                  <th class="center">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${bgs.map(bg => `
                  <tr>
                    <td>
                      <span class="task-title" style="font-family:var(--font-mono, monospace);font-weight:700"
                            onclick="BankGuaranteesScreen.viewBGDetails('${bg.ref}')">
                        ${bg.ref}
                      </span>
                    </td>
                    <td style="font-weight:600;color:var(--color-text-primary)">
                      ${bg.issuingBank}
                    </td>
                    <td>
                      <div style="font-weight:600;color:var(--color-text-primary);font-size:13px">${bg.projectName}</div>
                      <div style="font-size:11px;color:var(--color-text-muted)">${bg.packageCode}</div>
                    </td>
                    <td style="font-size:12px;color:var(--color-text-secondary)">
                      ${bg.type}
                    </td>
                    <td class="num" style="font-weight:700;color:var(--color-text-primary)">
                      ${bg.amount}
                    </td>
                    <td style="font-size:12px;color:var(--color-text-muted);white-space:nowrap">
                      ${Utils.formatDate(bg.issueDate)}
                    </td>
                    <td style="font-size:12.5px;color:var(--color-text-secondary);white-space:nowrap">
                      ${Utils.formatDate(bg.expiryDate)}
                    </td>
                    <td class="center">
                      <span class="badge ${bg.badgeClass}">${bg.statusLabel}</span>
                    </td>
                    <td class="center">
                      <div style="display:flex;align-items:center;justify-content:center;gap:6px">
                        ${bg.status !== 'released' ? `
                          <button class="btn btn-outline btn-xs" 
                                  onclick="DashboardScreen.requestRenewal('${bg.ref}', '${bg.projectName.replace(/'/g, "\\'")}', '${bg.amount}', '${bg.type}')">
                            Renew
                          </button>` : ''}
                        <button class="btn btn-ghost btn-xs" onclick="BankGuaranteesScreen.viewBGDetails('${bg.ref}')">
                          Details
                        </button>
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

  setFilter(f) {
    this._filter = f;
    App.refresh();
  },

  viewBGDetails(ref) {
    const bg = this._getBGs().find(x => x.ref === ref);
    if (!bg) return;

    const html = `
      <div style="display:flex;flex-direction:column;gap:12px;font-size:13px">
        <div style="padding:12px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:11px;color:var(--color-text-muted);font-weight:600;text-transform:uppercase">Bank Guarantee Reference</div>
            <div style="font-family:var(--font-mono, monospace);font-size:16px;font-weight:700;color:var(--color-text-primary)">${bg.ref}</div>
          </div>
          <span class="badge ${bg.badgeClass}">${bg.statusLabel}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div><span style="color:var(--color-text-muted)">Issuing Bank:</span> <strong>${bg.issuingBank}</strong></div>
          <div><span style="color:var(--color-text-muted)">Guarantee Amount:</span> <strong style="font-size:14px;color:var(--color-primary-700)">${bg.amount}</strong></div>
          <div><span style="color:var(--color-text-muted)">Project:</span> <strong>${bg.projectName}</strong></div>
          <div><span style="color:var(--color-text-muted)">Guarantee Type:</span> <strong>${bg.type}</strong></div>
          <div><span style="color:var(--color-text-muted)">Issue Date:</span> <strong>${Utils.formatDate(bg.issueDate)}</strong></div>
          <div><span style="color:var(--color-text-muted)">Expiry Date:</span> <strong>${Utils.formatDate(bg.expiryDate)}</strong></div>
        </div>

        <div style="padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div style="font-size:11px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:4px">Governing EPC Clause</div>
          <p style="margin:0;color:var(--color-text-secondary);font-size:12.5px;line-height:1.5">
            Subject to FIDIC EPC Silver Book 1999, Sub-clause 4.2. Bank Guarantee valid until 28 days following the issuance of the Performance Certificate.
          </p>
        </div>
      </div>
    `;

    Modal.open(`Guarantee Audit: ${bg.ref}`, html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-primary" onclick="DashboardScreen.requestRenewal('${bg.ref}', '${bg.projectName.replace(/'/g, "\\'")}', '${bg.amount}', '${bg.type}'); Modal.closeAll();">
        Initiate Extension
      </button>
    `);
  },

  batchRenewalModal() {
    DashboardScreen.openBatchRenewal();
  },

  openNewBGModal() {
    const html = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="form-group">
          <label class="form-label">Project</label>
          <select class="form-control" id="new-bg-proj">
            <option value="p1">Hintonn AI Core Platform</option>
            <option value="p2">Client Substation Package</option>
            <option value="p3">Utilities & Plant Balance</option>
            <option value="p4">Grid Automation & LoRA AI</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Issuing Commercial Bank</label>
          <input type="text" class="form-control" id="new-bg-bank" placeholder="e.g. Standard Chartered / HSBC">
        </div>
        <div class="form-group">
          <label class="form-label">Guarantee Amount (₹)</label>
          <input type="text" class="form-control" id="new-bg-amount" placeholder="e.g. 350,000">
        </div>
        <div class="form-group">
          <label class="form-label">Guarantee Type</label>
          <select class="form-control" id="new-bg-type">
            <option>Performance Guarantee (10%)</option>
            <option>Advance Payment Guarantee (10%)</option>
            <option>Defects Liability (DLP) BG (10%)</option>
            <option>Retention Guarantee</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Expiry Date</label>
          <input type="date" class="form-control" id="new-bg-expiry" value="2027-04-30">
        </div>
      </div>
    `;

    Modal.open('Register Bank Guarantee', html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="BankGuaranteesScreen._saveBG()">Save Guarantee</button>
    `);
  },

  _saveBG() {
    const projectId = document.getElementById('new-bg-proj') ? document.getElementById('new-bg-proj').value : 'p1';
    const bank = document.getElementById('new-bg-bank') ? document.getElementById('new-bg-bank').value : '';
    const amount = document.getElementById('new-bg-amount') ? document.getElementById('new-bg-amount').value : '';
    const type = document.getElementById('new-bg-type') ? document.getElementById('new-bg-type').value : '';
    const expiry = document.getElementById('new-bg-expiry') ? document.getElementById('new-bg-expiry').value : '';

    Store.createBankGuarantee({
      projectId,
      issuingBank: bank,
      amount: amount.startsWith('₹') ? amount : `₹${amount}`,
      type,
      expiryDate: expiry
    });

    Modal.closeAll();
    Toast.show('New Bank Guarantee registered and added to active risk monitor.', 'success', 4000);
    App.refresh();
  }
};
