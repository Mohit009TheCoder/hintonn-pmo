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
                      <div style="font-weight:600;color:var(--color-text-primary);font-size:13px">${Utils.escapeHtml(bg.projectName)}</div>
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
                      <span class="badge ${bg.badgeClass}">${Utils.escapeHtml(bg.statusLabel)}</span>
                    </td>
                    <td class="center">
                      <div style="display:flex;align-items:center;justify-content:center;gap:6px">
                        ${bg.status !== 'released' ? `
                          <button class="btn btn-outline btn-xs" 
                                  onclick="DashboardScreen.requestRenewal('${bg.ref || ''}', '${(bg.projectName || '').replace(/'/g, "\\'")}', '${bg.amount || ''}', '${bg.type || ''}')">
                            Renew
                          </button>` : ''}
                        <button class="btn btn-ghost btn-xs" onclick="BankGuaranteesScreen.viewBGDetails('${Utils.escapeHtml(bg.ref)}')">
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

  _INDIAN_BANKS: [
    { group: 'Public Sector Banks (PSU)', items: [
      { value: 'State Bank of India', label: 'State Bank of India (SBI)' },
      { value: 'Punjab National Bank', label: 'Punjab National Bank (PNB)' },
      { value: 'Bank of Baroda', label: 'Bank of Baroda (BOB)' },
      { value: 'Canara Bank', label: 'Canara Bank' },
      { value: 'Union Bank of India', label: 'Union Bank of India' },
      { value: 'Bank of India', label: 'Bank of India (BOI)' },
      { value: 'Indian Bank', label: 'Indian Bank' },
      { value: 'Central Bank of India', label: 'Central Bank of India' },
      { value: 'Indian Overseas Bank', label: 'Indian Overseas Bank (IOB)' },
      { value: 'UCO Bank', label: 'UCO Bank' },
      { value: 'Bank of Maharashtra', label: 'Bank of Maharashtra' },
      { value: 'Punjab & Sind Bank', label: 'Punjab & Sind Bank' }
    ]},
    { group: 'Leading Private Sector Banks', items: [
      { value: 'HDFC Bank', label: 'HDFC Bank' },
      { value: 'ICICI Bank', label: 'ICICI Bank' },
      { value: 'Axis Bank', label: 'Axis Bank' },
      { value: 'Kotak Mahindra Bank', label: 'Kotak Mahindra Bank' },
      { value: 'IndusInd Bank', label: 'IndusInd Bank' },
      { value: 'IDBI Bank', label: 'IDBI Bank' },
      { value: 'Yes Bank', label: 'Yes Bank' },
      { value: 'Federal Bank', label: 'Federal Bank' },
      { value: 'IDFC FIRST Bank', label: 'IDFC FIRST Bank' },
      { value: 'South Indian Bank', label: 'South Indian Bank' },
      { value: 'RBL Bank', label: 'RBL Bank' },
      { value: 'Bandhan Bank', label: 'Bandhan Bank' },
      { value: 'City Union Bank', label: 'City Union Bank' },
      { value: 'Karur Vysya Bank', label: 'Karur Vysya Bank' },
      { value: 'Karnataka Bank', label: 'Karnataka Bank' },
      { value: 'Tamilnad Mercantile Bank', label: 'Tamilnad Mercantile Bank' },
      { value: 'Jammu & Kashmir Bank', label: 'Jammu & Kashmir Bank (J&K Bank)' },
      { value: 'CSB Bank', label: 'CSB Bank' },
      { value: 'Dhanlaxmi Bank', label: 'Dhanlaxmi Bank' },
      { value: 'DCB Bank', label: 'DCB Bank' }
    ]},
    { group: 'Development & Specialized Institutions', items: [
      { value: 'Export-Import Bank of India (EXIM)', label: 'Export-Import Bank of India (EXIM Bank)' },
      { value: 'SIDBI', label: 'Small Industries Development Bank of India (SIDBI)' },
      { value: 'NABARD', label: 'NABARD' }
    ]},
    { group: 'Foreign Scheduled Commercial Banks (Operating in India)', items: [
      { value: 'Standard Chartered Bank', label: 'Standard Chartered Bank (India)' },
      { value: 'HSBC India', label: 'HSBC India' },
      { value: 'Citibank India', label: 'Citibank India' },
      { value: 'Deutsche Bank India', label: 'Deutsche Bank India' },
      { value: 'Barclays Bank India', label: 'Barclays Bank India' },
      { value: 'DBS Bank India', label: 'DBS Bank India' },
      { value: 'BNP Paribas India', label: 'BNP Paribas India' },
      { value: 'SMBC Bank India', label: 'Sumitomo Mitsui Banking Corp (SMBC India)' },
      { value: 'MUFG Bank India', label: 'MUFG Bank India' },
      { value: 'Mizuho Bank India', label: 'Mizuho Bank India' }
    ]},
    { group: 'Other', items: [
      { value: 'Other Indian Scheduled Bank', label: 'Other Indian Scheduled Bank...' }
    ]}
  ],

  _renderBankOptionsHTML(query = '') {
    const q = (query || '').toLowerCase().trim();
    let html = '';
    let totalMatches = 0;

    this._INDIAN_BANKS.forEach(grp => {
      const filtered = grp.items.filter(item => 
        !q || item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q) || grp.group.toLowerCase().includes(q)
      );

      if (filtered.length > 0) {
        html += `<div class="custom-dropdown-group-header">${grp.group}</div>`;
        filtered.forEach(item => {
          totalMatches++;
          html += `
            <div class="custom-dropdown-item" onclick="BankGuaranteesScreen.selectBank('${item.value.replace(/'/g, "\\'")}', '${item.label.replace(/'/g, "\\'")}')">
              <span>${Utils.escapeHtml(item.label)}</span>
            </div>
          `;
        });
      }
    });

    if (totalMatches === 0) {
      html = `<div class="custom-dropdown-empty">No banks matching "${Utils.escapeHtml(query)}"</div>`;
    }

    return html;
  },

  toggleBankDropdown(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('custom-bank-menu');
    const trigger = document.getElementById('custom-bank-trigger');
    const arrow = document.getElementById('custom-bank-arrow');
    const searchInput = document.getElementById('custom-bank-search');

    if (!menu) return;
    const isOpen = menu.style.display === 'flex' || menu.style.display === 'block';

    if (isOpen) {
      menu.style.display = 'none';
      if (trigger) trigger.classList.remove('open');
      if (arrow) arrow.style.transform = 'rotate(0deg)';
    } else {
      menu.style.display = 'flex';
      if (trigger) trigger.classList.add('open');
      if (arrow) arrow.style.transform = 'rotate(180deg)';
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 50);
      }
    }
  },

  filterBankDropdown(query) {
    const list = document.getElementById('custom-bank-options-list');
    if (list) {
      list.innerHTML = this._renderBankOptionsHTML(query);
    }
  },

  selectBank(value, label) {
    const hiddenInput = document.getElementById('new-bg-bank');
    const labelSpan = document.getElementById('custom-bank-selected-text');
    const customWrap = document.getElementById('new-bg-custom-bank-wrap');

    if (hiddenInput) hiddenInput.value = value;
    if (labelSpan) {
      labelSpan.textContent = label;
      labelSpan.style.color = 'var(--color-text-primary)';
      labelSpan.style.fontWeight = '600';
    }

    if (customWrap) {
      customWrap.style.display = value === 'Other Indian Scheduled Bank' ? 'block' : 'none';
    }

    const menu = document.getElementById('custom-bank-menu');
    const trigger = document.getElementById('custom-bank-trigger');
    const arrow = document.getElementById('custom-bank-arrow');
    if (menu) menu.style.display = 'none';
    if (trigger) trigger.classList.remove('open');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  },

  openNewBGModal() {
    const projects = (typeof Store !== 'undefined' && Store.getProjects) ? Store.getProjects() : [];
    const html = `
      <div style="display:flex;flex-direction:column;gap:14px" onclick="const m = document.getElementById('custom-bank-menu'); if(m) m.style.display='none'; const t = document.getElementById('custom-bank-trigger'); if(t) t.classList.remove('open'); const a = document.getElementById('custom-bank-arrow'); if(a) a.style.transform='rotate(0deg)';">
        <div class="form-group">
          <label class="form-label" style="font-weight:600">Project</label>
          <select class="form-control" id="new-bg-proj">
            ${projects.length > 0 ? projects.map(p => `
              <option value="${p.id}">${Utils.escapeHtml(p.name)} ${p.code ? `(${p.code})` : ''}</option>
            `).join('') : `
              <option value="p1">Hintonn AI Core Platform</option>
              <option value="p2">Client Substation Package</option>
              <option value="p3">Utilities & Plant Balance</option>
              <option value="p4">Grid Automation & LoRA AI</option>
            `}
          </select>
        </div>

        <div class="form-group" style="position:relative">
          <label class="form-label" style="font-weight:600">Issuing Commercial Bank (Indian Scheduled Banks)</label>
          <input type="hidden" id="new-bg-bank" value="">
          
          <div class="custom-searchable-dropdown" id="custom-bank-select-wrap">
            <div class="custom-dropdown-trigger" id="custom-bank-trigger" onclick="BankGuaranteesScreen.toggleBankDropdown(event)">
              <span id="custom-bank-selected-text" style="color:var(--color-text-muted)">Select Issuing Indian Bank...</span>
              <svg style="width:16px;height:16px;color:var(--color-text-muted);transition:transform 0.2s" id="custom-bank-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>

            <!-- Guaranteed Downward Opening Dropdown Menu -->
            <div class="custom-dropdown-menu" id="custom-bank-menu" style="display:none" onclick="event.stopPropagation()">
              <div class="custom-dropdown-search-wrap">
                <input type="text" class="custom-dropdown-search-input" id="custom-bank-search" 
                       placeholder="Search bank (e.g. SBI, HDFC, Canara, BOB)..." 
                       oninput="BankGuaranteesScreen.filterBankDropdown(this.value)">
              </div>
              <div id="custom-bank-options-list" style="overflow-y:auto;max-height:180px">
                ${this._renderBankOptionsHTML()}
              </div>
            </div>
          </div>
        </div>

        <div class="form-group" id="new-bg-custom-bank-wrap" style="display:none">
          <label class="form-label" style="font-weight:600">Specify Bank Name</label>
          <input type="text" class="form-control" id="new-bg-custom-bank" placeholder="Enter bank name...">
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600">Guarantee Amount (₹)</label>
          <input type="text" class="form-control" id="new-bg-amount" placeholder="e.g. 14,250,000">
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600">Guarantee Type</label>
          <select class="form-control" id="new-bg-type">
            <option value="Performance BG">Performance Guarantee (PBG - 10%)</option>
            <option value="Advance BG">Advance Payment Guarantee (ABG - 10%)</option>
            <option value="Defects Liability (DLP) BG">Defects Liability (DLP) BG (10%)</option>
            <option value="Retention BG">Retention Money Guarantee (RBG)</option>
            <option value="Financial BG">Financial Guarantee / Bid Bond</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600">Expiry Date</label>
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

    const bankInput = document.getElementById('new-bg-bank');
    let bank = bankInput ? bankInput.value : '';
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
