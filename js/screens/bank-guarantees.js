// ─── Bank Guarantees Screen (Commercial PMO) ───
const BankGuaranteesScreen = {
  _filter: 'all',

  _getBGs() {
    return Store.getBankGuarantees();
  },

  getUnseenCount() {
    const allBGs = this._getBGs();
    if (!allBGs || allBGs.length === 0) return 0;

    // If user is currently viewing the Bank Guarantees screen, mark as seen and return 0
    if (typeof App !== 'undefined' && (App.currentScreen === 'bg' || App.currentScreen === 'bank-guarantees')) {
      this.markAllAsSeen();
      return 0;
    }

    try {
      if (typeof localStorage === 'undefined') return 0;
      const raw = localStorage.getItem('hintonn_seen_bg_ids');
      if (raw === null) {
        // Initial state: mark current existing BGs as seen so no stale badge is displayed
        const initialIds = allBGs.map(b => String(b.id || b.ref));
        localStorage.setItem('hintonn_seen_bg_ids', JSON.stringify(initialIds));
        return 0;
      }
      const seenIds = new Set(JSON.parse(raw).map(String));
      const unseen = allBGs.filter(b => {
        const id = String(b.id || b.ref);
        return !seenIds.has(id);
      });
      return unseen.length;
    } catch (e) {
      return 0;
    }
  },

  markAllAsSeen() {
    try {
      if (typeof localStorage === 'undefined') return;
      const allBGs = this._getBGs();
      const allIds = allBGs.map(b => String(b.id || b.ref));
      localStorage.setItem('hintonn_seen_bg_ids', JSON.stringify(allIds));

      // Remove badge from DOM immediately if present in the sidebar
      const nav = document.getElementById('sidebar-nav');
      if (nav) {
        const bgLink = nav.querySelector('a[href="#bg"]');
        if (bgLink) {
          const badgeEl = bgLink.querySelector('.badge-count');
          if (badgeEl) badgeEl.remove();
        }
      }
    } catch (e) {}
  },

  render() {
    this.markAllAsSeen();
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

    // Dynamic Issuing Banks calculation from active Bank Guarantees dataset
    const bankList = allBGs
      .map(b => (b.issuingBank || b.bank || '').trim())
      .filter(Boolean);
    const uniqueBanks = Array.from(new Set(bankList));
    const bankCount = uniqueBanks.length;
    const bankSummaryText = bankCount > 0
      ? (bankCount <= 4
          ? uniqueBanks.join(', ')
          : `${uniqueBanks.slice(0, 3).join(', ')} +${bankCount - 3} more`)
      : 'No issuing banks registered';

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
        <div class="kpi-card" onclick="BankGuaranteesScreen.setFilter('all')" style="cursor:pointer">
          <div class="kpi-header">
            <span class="kpi-label">Active Guarantees</span>
            <div class="kpi-icon-wrap">${Icons.shield}</div>
          </div>
          <div class="kpi-value">${totalActive} Active BGs</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-primary-700)">
            ${allBGs.length > 0 ? `${totalValue} Total Portfolio Guarantee Value` : 'No active guarantees'}
          </div>
        </div>

        <div class="kpi-card" onclick="BankGuaranteesScreen.setFilter('critical')" style="cursor:pointer">
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

        <div class="kpi-card" onclick="BankGuaranteesScreen.setFilter('warning')" style="cursor:pointer">
          <div class="kpi-header">
            <span class="kpi-label">Warning Expiry</span>
            <div class="kpi-icon-wrap">${Icons.clock}</div>
          </div>
          <div class="kpi-value">${warningCount} BGs</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
            ${warningCount > 0 ? `Expiring in 30–60 Days (${warningVal})` : 'No guarantees in 30–60 day window'}
          </div>
        </div>

        <div class="kpi-card" onclick="BankGuaranteesScreen.setFilter('all')" style="cursor:pointer">
          <div class="kpi-header">
            <span class="kpi-label">Issuing Banks</span>
            <div class="kpi-icon-wrap">${Icons.folder}</div>
          </div>
          <div class="kpi-value">${bankCount} ${bankCount === 1 ? 'Institution' : 'Institutions'}</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)" title="${uniqueBanks.join(', ')}">
            ${bankSummaryText}
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
                  <th class="num">Amount (₹)</th>
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
                      ${bg.issuingBank || bg.bank || '—'}
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
                                  onclick="DashboardScreen.requestRenewal('${bg.ref || ''}', '${(bg.projectName || '').replace(/'/g, "\\'")}', '${bg.amount || ''}', '${bg.type || ''}')">
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
            <div style="font-family:var(--font-mono, monospace);font-size:16px;font-weight:700;color:var(--color-text-primary)">${bg.ref || '—'}</div>
          </div>
          <span class="badge ${bg.badgeClass || ''}">${bg.statusLabel || ''}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div><span style="color:var(--color-text-muted)">Issuing Bank:</span> <strong>${bg.issuingBank || bg.bank || '—'}</strong></div>
          <div><span style="color:var(--color-text-muted)">Guarantee Amount:</span> <strong style="font-size:14px;color:var(--color-primary-700)">${bg.amount || '₹0'}</strong></div>
          <div><span style="color:var(--color-text-muted)">Project:</span> <strong>${bg.projectName || '—'}</strong></div>
          <div><span style="color:var(--color-text-muted)">Guarantee Type:</span> <strong>${bg.type || 'BG'}</strong></div>
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

    Modal.open(`Guarantee Audit: ${bg.ref || ''}`, html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-primary" onclick="DashboardScreen.requestRenewal('${bg.ref || ''}', '${(bg.projectName || '').replace(/'/g, "\\'")}', '${bg.amount || ''}', '${bg.type || ''}'); Modal.closeAll();">
        Initiate Extension
      </button>
    `);
  },

  batchRenewalModal() {
    DashboardScreen.openBatchRenewal();
  },

  openNewBGModal() {
    const projects = (typeof Store !== 'undefined' && Store.getProjects) ? Store.getProjects() : [];
    const html = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group">
          <label class="form-label">Project</label>
          <select class="form-control" id="new-bg-proj">
            ${projects.length > 0 ? projects.map(p => `
              <option value="${p.id}">${p.name} ${p.code ? `(${p.code})` : ''}</option>
            `).join('') : `
              <option value="p1">Hintonn AI Core Platform</option>
              <option value="p2">Client Substation Package</option>
              <option value="p3">Utilities & Plant Balance</option>
              <option value="p4">Grid Automation & LoRA AI</option>
            `}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Issuing Commercial Bank (Indian Scheduled Banks)</label>
          <select class="form-control" id="new-bg-bank" onchange="const customWrap = document.getElementById('new-bg-custom-bank-wrap'); if(customWrap) customWrap.style.display = this.value === 'Other Indian Scheduled Bank' ? 'block' : 'none';">
            <option value="" disabled selected>Select Issuing Indian Bank...</option>
            
            <optgroup label="Public Sector Banks (PSU)">
              <option value="State Bank of India">State Bank of India (SBI)</option>
              <option value="Punjab National Bank">Punjab National Bank (PNB)</option>
              <option value="Bank of Baroda">Bank of Baroda (BOB)</option>
              <option value="Canara Bank">Canara Bank</option>
              <option value="Union Bank of India">Union Bank of India</option>
              <option value="Bank of India">Bank of India (BOI)</option>
              <option value="Indian Bank">Indian Bank</option>
              <option value="Central Bank of India">Central Bank of India</option>
              <option value="Indian Overseas Bank">Indian Overseas Bank (IOB)</option>
              <option value="UCO Bank">UCO Bank</option>
              <option value="Bank of Maharashtra">Bank of Maharashtra</option>
              <option value="Punjab & Sind Bank">Punjab & Sind Bank</option>
            </optgroup>

            <optgroup label="Leading Private Sector Banks">
              <option value="HDFC Bank">HDFC Bank</option>
              <option value="ICICI Bank">ICICI Bank</option>
              <option value="Axis Bank">Axis Bank</option>
              <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
              <option value="IndusInd Bank">IndusInd Bank</option>
              <option value="IDBI Bank">IDBI Bank</option>
              <option value="Yes Bank">Yes Bank</option>
              <option value="Federal Bank">Federal Bank</option>
              <option value="IDFC FIRST Bank">IDFC FIRST Bank</option>
              <option value="South Indian Bank">South Indian Bank</option>
              <option value="RBL Bank">RBL Bank</option>
              <option value="Bandhan Bank">Bandhan Bank</option>
              <option value="City Union Bank">City Union Bank</option>
              <option value="Karur Vysya Bank">Karur Vysya Bank</option>
              <option value="Karnataka Bank">Karnataka Bank</option>
              <option value="Tamilnad Mercantile Bank">Tamilnad Mercantile Bank</option>
              <option value="Jammu & Kashmir Bank">Jammu & Kashmir Bank (J&K Bank)</option>
              <option value="CSB Bank">CSB Bank</option>
              <option value="Dhanlaxmi Bank">Dhanlaxmi Bank</option>
              <option value="DCB Bank">DCB Bank</option>
            </optgroup>

            <optgroup label="Development & Specialized Institutions">
              <option value="Export-Import Bank of India (EXIM)">Export-Import Bank of India (EXIM Bank)</option>
              <option value="SIDBI">Small Industries Development Bank of India (SIDBI)</option>
              <option value="NABARD">NABARD</option>
            </optgroup>

            <optgroup label="Foreign Scheduled Commercial Banks (Operating in India)">
              <option value="Standard Chartered Bank">Standard Chartered Bank (India)</option>
              <option value="HSBC India">HSBC India</option>
              <option value="Citibank India">Citibank India</option>
              <option value="Deutsche Bank India">Deutsche Bank India</option>
              <option value="Barclays Bank India">Barclays Bank India</option>
              <option value="DBS Bank India">DBS Bank India</option>
              <option value="BNP Paribas India">BNP Paribas India</option>
              <option value="SMBC Bank India">Sumitomo Mitsui Banking Corp (SMBC India)</option>
              <option value="MUFG Bank India">MUFG Bank India</option>
              <option value="Mizuho Bank India">Mizuho Bank India</option>
            </optgroup>

            <optgroup label="Other">
              <option value="Other Indian Scheduled Bank">Other Indian Scheduled Bank...</option>
            </optgroup>
          </select>
        </div>

        <div class="form-group" id="new-bg-custom-bank-wrap" style="display:none">
          <label class="form-label">Specify Bank Name</label>
          <input type="text" class="form-control" id="new-bg-custom-bank" placeholder="Enter bank name...">
        </div>

        <div class="form-group">
          <label class="form-label">Guarantee Amount (₹)</label>
          <input type="text" class="form-control" id="new-bg-amount" placeholder="e.g. 14,250,000">
        </div>

        <div class="form-group">
          <label class="form-label">Guarantee Type</label>
          <select class="form-control" id="new-bg-type">
            <option value="Performance BG">Performance Guarantee (PBG - 10%)</option>
            <option value="Advance BG">Advance Payment Guarantee (ABG - 10%)</option>
            <option value="Defects Liability (DLP) BG">Defects Liability (DLP) BG (10%)</option>
            <option value="Retention BG">Retention Money Guarantee (RBG)</option>
            <option value="Financial BG">Financial Guarantee / Bid Bond</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Expiry Date</label>
          <input type="date" class="form-control" id="new-bg-expiry" value="${new Date(Date.now() + 180*24*60*60*1000).toISOString().slice(0, 10)}">
        </div>
      </div>
    `;

    Modal.open('Register Bank Guarantee', html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="BankGuaranteesScreen._saveBG()">Save Guarantee</button>
    `);
  },

  _saveBG() {
    const projSelect = document.getElementById('new-bg-proj');
    const projectId = projSelect ? projSelect.value : 'p1';
    const proj = (typeof Store !== 'undefined' && Store.getProject) ? Store.getProject(projectId) : null;
    const projectName = proj ? proj.name : (projSelect && projSelect.options[projSelect.selectedIndex] ? projSelect.options[projSelect.selectedIndex].text : 'General Project');
    const packageCode = proj ? (proj.packageCode || proj.code || 'PKG-01') : 'PKG-01';

    const bankSelect = document.getElementById('new-bg-bank');
    let bank = bankSelect ? bankSelect.value : '';
    if (bank === 'Other Indian Scheduled Bank') {
      const custom = document.getElementById('new-bg-custom-bank') ? document.getElementById('new-bg-custom-bank').value.trim() : '';
      if (custom) bank = custom;
    }

    if (!bank) {
      if (typeof Toast !== 'undefined' && Toast.show) Toast.show('Please select an issuing Indian bank.', 'warning');
      return;
    }

    const amountRaw = document.getElementById('new-bg-amount') ? document.getElementById('new-bg-amount').value.trim() : '';
    if (!amountRaw) {
      if (typeof Toast !== 'undefined' && Toast.show) Toast.show('Please enter the guarantee amount.', 'warning');
      return;
    }

    const cleanAmt = amountRaw.replace(/[^0-9.]/g, '');
    const numAmt = parseFloat(cleanAmt) || 0;
    const fmtINR = (n) => {
      if (!n || n === 0) return '₹0';
      const s = Math.round(n).toString();
      let result = s.slice(-3);
      let remaining = s.slice(0, -3);
      while (remaining.length > 2) {
        result = remaining.slice(-2) + ',' + result;
        remaining = remaining.slice(0, -2);
      }
      if (remaining.length > 0) result = remaining + ',' + result;
      return '₹' + result;
    };
    const formattedAmount = fmtINR(numAmt);

    const type = document.getElementById('new-bg-type') ? document.getElementById('new-bg-type').value : 'Performance BG';
    const expiry = document.getElementById('new-bg-expiry') ? document.getElementById('new-bg-expiry').value : '';

    if (!expiry) {
      if (typeof Toast !== 'undefined' && Toast.show) Toast.show('Please select an expiry date.', 'warning');
      return;
    }

    // Determine type code for BG reference
    let typeCode = 'PBG';
    const tl = type.toLowerCase();
    if (tl.includes('advance')) typeCode = 'ABG';
    else if (tl.includes('defects') || tl.includes('dlp')) typeCode = 'DLP';
    else if (tl.includes('retention')) typeCode = 'RBG';
    else if (tl.includes('financial') || tl.includes('bid')) typeCode = 'FBG';

    const projectCode = proj ? (proj.code || (proj.name ? proj.name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') : 'PRJ')) : 'PRJ';
    const bgRef = `BG/${projectCode}/${typeCode}/${String(Math.floor(100 + Math.random() * 900))}`;

    // Risk and days left calculation
    const expDate = new Date(expiry);
    const today = new Date();
    const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    let risk = 'safe';
    let badgeClass = 'badge-success';
    let statusLabel = 'Active';
    if (daysLeft < 0) {
      risk = 'expired';
      badgeClass = 'badge-danger';
      statusLabel = 'Expired';
    } else if (daysLeft <= 30) {
      risk = 'critical';
      badgeClass = 'badge-high';
      statusLabel = 'Critical';
    } else if (daysLeft <= 60) {
      risk = 'warning';
      badgeClass = 'badge-warning';
      statusLabel = 'Warning';
    }

    Store.createBankGuarantee({
      ref: bgRef,
      projectId,
      projectName,
      packageCode,
      issuingBank: bank,
      bank: bank,
      amount: formattedAmount,
      type,
      issueDate: new Date().toISOString().slice(0, 10),
      expiryDate: expiry,
      daysLeft,
      risk,
      status: 'active',
      statusLabel,
      badgeClass
    });

    if (typeof Modal !== 'undefined' && Modal.closeAll) Modal.closeAll();
    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show(`Bank Guarantee ${bgRef} from ${bank} registered successfully.`, 'success', 4000);
    }
    if (typeof App !== 'undefined' && App.refresh) App.refresh();
  }
};
