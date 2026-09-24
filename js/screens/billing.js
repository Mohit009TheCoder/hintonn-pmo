// ─── Billing & Invoices Screen (Commercial PMO with Bill Version Control) ───
const BillingScreen = {
  _filter: 'all', // 'all' | 'pending' | 'paid' | 'revised' | 'latest'
  _companyFilter: 'all',
  _viewMode: 'company', // 'company' (default) | 'table'
  _search: '',
  _expandedCompanies: { 'c1': true, 'c2': true, 'c3': true, 'c4': true, 'c5': true },
  _invoices: null,

  _getCompanies() {
    return [
      {
        id: 'c1',
        name: 'Apex Power & Energy Corp',
        contactPerson: 'Rohan Verma (VP Commercial)',
        totalContractValue: '₹48,34,00,000',
        activePackage: 'PKG-01 · Core EPC Phase 1',
        totalBilledFormatted: '₹16,12,80,000',
        totalPendingFormatted: '₹6,04,80,000',
        paymentStatus: 'Partially Paid',
        paymentStatusBadge: 'badge-medium',
        billsCountText: '3 Bills Issued · 2 Revisions',
        hasRevisions: true
      },
      {
        id: 'c2',
        name: 'Vertex Grid Utilities Ltd',
        contactPerson: 'Deepak Shinde (Lead Engineer)',
        totalContractValue: '₹28,56,00,000',
        activePackage: 'PKG-02 · Substation Package',
        totalBilledFormatted: '₹10,58,40,000',
        totalPendingFormatted: '₹3,44,40,000',
        paymentStatus: 'Partially Paid',
        paymentStatusBadge: 'badge-medium',
        billsCountText: '2 Bills Issued · 1 Revision',
        hasRevisions: true
      },
      {
        id: 'c3',
        name: 'Northern Powertech Systems',
        contactPerson: 'Sunil Mehta (Procurement Head)',
        totalContractValue: '₹17,64,00,000',
        activePackage: 'PKG-03 · Utilities & Balance of Plant',
        totalBilledFormatted: '₹2,35,20,000',
        totalPendingFormatted: '₹2,35,20,000',
        paymentStatus: 'Pending Release',
        paymentStatusBadge: 'badge-review',
        billsCountText: '1 Active Bill',
        hasRevisions: false
      },
      {
        id: 'c4',
        name: 'Solaris Infra Concessions',
        contactPerson: 'Vikram Sen (Director Projects)',
        totalContractValue: '₹12,60,00,000',
        activePackage: 'PKG-04 · SCADA & Grid Automation',
        totalBilledFormatted: '₹8,73,60,000',
        totalPendingFormatted: '₹1,59,60,000',
        paymentStatus: 'Partially Paid',
        paymentStatusBadge: 'badge-medium',
        billsCountText: '2 Active Bills · 1 Revision',
        hasRevisions: true
      },
      {
        id: 'c5',
        name: 'Metro Rail Transmission Authority',
        contactPerson: 'Anand Kulkarni (General Manager)',
        totalContractValue: '₹11,76,00,000',
        activePackage: 'PKG-05 · Civil & Site Facilities',
        totalBilledFormatted: '₹5,46,00,000',
        totalPendingFormatted: '₹0',
        paymentStatus: 'Paid',
        paymentStatusBadge: 'badge-completed',
        billsCountText: '1 Settled Bill',
        hasRevisions: false
      }
    ];
  },

  // ─── Normalize $ → ₹ for any legacy Firestore data ───
  _normAmt(val) {
    if (!val) return val;
    if (typeof val === 'string' && val.startsWith('$')) {
      return '₹' + val.slice(1);
    }
    return val;
  },

  // Commercial EPC Invoices Dataset with Multi-Version Control & History
  _getInvoices() {
    if (this._invoices) return this._invoices;

    this._invoices = Store.getInvoices().map(inv => ({
      ...inv,
      amountDue: this._normAmt(inv.amountDue),
      taxAmount: this._normAmt(inv.taxAmount),
      deductions: this._normAmt(inv.deductions),
      netPayable: this._normAmt(inv.netPayable),
      contractValue: this._normAmt(inv.contractValue),
      versionHistory: (inv.versionHistory || []).map(v => ({
        ...v,
        baseAmount: this._normAmt(v.baseAmount),
        tax: this._normAmt(v.tax),
        deductions: this._normAmt(v.deductions),
        netPayable: this._normAmt(v.netPayable)
      }))
    }));

    return this._invoices;
  },

  _getFilteredInvoices() {
    let list = this._getInvoices();

    // Company filter
    if (this._companyFilter !== 'all') {
      list = list.filter(i => i.companyId === this._companyFilter);
    }

    // Status / Version filter
    if (this._filter === 'pending') {
      list = list.filter(i => i.status === 'pending-client' || i.status === 'under-certification');
    } else if (this._filter === 'paid') {
      list = list.filter(i => i.status === 'paid');
    } else if (this._filter === 'revised') {
      list = list.filter(i => i.isRevised);
    } else if (this._filter === 'latest') {
      list = list.filter(i => i.version.startsWith('v2') || !i.isRevised);
    }

    // Search query
    if (this._search) {
      const q = this._search.toLowerCase().trim();
      list = list.filter(i => 
        i.id.toLowerCase().includes(q) || 
        i.projectName.toLowerCase().includes(q) || 
        i.companyName.toLowerCase().includes(q) || 
        i.milestone.toLowerCase().includes(q) ||
        i.version.toLowerCase().includes(q) ||
        i.billNumber.toLowerCase().includes(q) ||
        i.amountDue.toLowerCase().includes(q)
      );
    }

    return list;
  },

  toggleCompany(companyId) {
    this._expandedCompanies[companyId] = !this._expandedCompanies[companyId];
    this.updateBillingContainer();
  },

  setViewMode(mode) {
    this._viewMode = mode;
    this.updateBillingContainer();
  },

  setCompanyFilter(companyId) {
    this._companyFilter = companyId;
    this.updateBillingContainer();
  },

  setFilter(filter) {
    this._filter = filter;
    this.updateBillingContainer();
  },

  onSearch(val) {
    this._search = val;
    const clearBtn = document.getElementById('billing-search-clear');
    if (clearBtn) {
      if (val) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }
    this.updateBillingContainer();
  },

  clearSearch() {
    this._search = '';
    const input = document.getElementById('billing-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    const clearBtn = document.getElementById('billing-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.updateBillingContainer();
  },

  updateBillingContainer() {
    const container = document.getElementById('billing-content-view');
    if (container) {
      const invoices = this._getFilteredInvoices();
      if (this._viewMode === 'company') {
        container.innerHTML = this._renderCompanyGroups(invoices);
      } else {
        container.innerHTML = this._renderTable(invoices);
      }
    } else {
      App.refresh();
    }
  },

  // ─── Main Screen Render ───
  render() {
    const allInvoices = this._getInvoices();
    const companies = this._getCompanies();
    const invoices = this._getFilteredInvoices();

    // Parse amount strings like "₹410,000" or "$5.8M" to numbers
    const parseAmt = (s) => { if (!s) return 0; const str = String(s).replace(/[^0-9.MKmk]/g, ''); if (str.includes('M')||str.includes('m')) return parseFloat(str)*1000000; if (str.includes('K')||str.includes('k')) return parseFloat(str)*1000; return parseFloat(str)||0; };
    const fmtAmt = (n) => { if (!n || n === 0) return '₹0'; const s = Math.round(n).toString(); let result = ''; const len = s.length; if (len <= 3) return '₹' + s; result = s.slice(-3); let remaining = s.slice(0, -3); while (remaining.length > 2) { result = remaining.slice(-2) + ',' + result; remaining = remaining.slice(0, -2); } if (remaining.length > 0) result = remaining + ',' + result; return '₹' + result; };
    const totalBilledNum = allInvoices.reduce((s,i) => s + parseAmt(i.amountDue || i.netPayable), 0);
    const collectedNum = allInvoices.filter(i => i.status === 'paid').reduce((s,i) => s + parseAmt(i.amountDue || i.netPayable), 0);
    const pendingNum = totalBilledNum - collectedNum;
    const totalBilled = fmtAmt(totalBilledNum);
    const totalCollected = fmtAmt(collectedNum);
    const totalPending = fmtAmt(pendingNum);
    const totalRevisedBills = allInvoices.filter(i => i.isRevised).length;

    return `
      <div class="billing-screen" id="billing">
        
        <!-- Page Header -->
        <div class="page-header" style="margin-bottom:18px">
          <div class="page-header-left">
            <div style="display:flex;align-items:center;gap:10px">
              <h1>Billing & Invoices</h1>
              <span class="badge badge-primary" style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;">Bill Version Control Active</span>
            </div>
            <p>Multi-bill company grouping, invoice version tracking (v1.0, v1.1, v2.0), and commercial revision history audit ledger.</p>
          </div>
        </div>

        <!-- Top Commercial KPI Strip -->
        <div class="kpi-grid" style="margin-bottom:20px">
          <div class="kpi-card" onclick="BillingScreen.setFilter('all')" style="cursor:pointer">
            <div class="kpi-header">
              <span class="kpi-label">Total Invoiced (8 Bills)</span>
              <div class="kpi-icon-wrap">${Icons.fileText}</div>
            </div>
            <div class="kpi-value">${totalBilled}</div>
            <div class="kpi-change neutral" style="font-weight:600;color:var(--color-primary-700)">
              5 Client Companies · 5 EPC Packages
            </div>
          </div>

          <div class="kpi-card" onclick="BillingScreen.setFilter('paid')" style="cursor:pointer">
            <div class="kpi-header">
              <span class="kpi-label">Certified & Collected</span>
              <div class="kpi-icon-wrap">${Icons.check}</div>
            </div>
            <div class="kpi-value">${totalCollected}</div>
            <div class="kpi-change neutral" style="font-weight:600;color:var(--color-emerald-700, #059669)">
              3 Invoices Fully Settled
            </div>
          </div>

          <div class="kpi-card" onclick="BillingScreen.setFilter('pending')" style="cursor:pointer">
            <div class="kpi-header">
              <span class="kpi-label">Pending Client Sign-off</span>
              <div class="kpi-icon-wrap">${Icons.clock}</div>
            </div>
            <div class="kpi-value">${totalPending}</div>
            <div class="kpi-change neutral" style="font-weight:600;color:var(--color-ai-700)">
              <span class="badge badge-high" style="font-size:10px;padding:2px 7px;font-weight:600">5 Invoices</span>
              Under Review / Certification
            </div>
          </div>

          <div class="kpi-card" onclick="BillingScreen.setFilter('revised')" style="cursor:pointer">
            <div class="kpi-header">
              <span class="kpi-label">Multi-Version Revisions</span>
              <div class="kpi-icon-wrap">${Icons.shield}</div>
            </div>
            <div class="kpi-value">${totalRevisedBills} Bills Revised</div>
            <div class="kpi-change neutral" style="font-weight:600;color:#7C3AED">
              v1.1 to v2.0 Version Controlled
            </div>
          </div>
        </div>

        <!-- Filter & Search Toolbar Card -->
        <div class="section-card" style="margin-bottom:20px;padding:14px 18px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            
            <!-- Left: View Mode Toggle & Status Filters -->
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              
              <!-- View Mode Selector -->
              <div class="btn-group" style="display:inline-flex;background:var(--color-bg-page);padding:2px;border-radius:6px;border:1px solid var(--color-border)">
                <button class="btn btn-xs ${this._viewMode==='company'?'btn-primary':'btn-ghost'}" 
                        onclick="BillingScreen.setViewMode('company')" style="font-weight:600">
                  🏢 Group by Company
                </button>
                <button class="btn btn-xs ${this._viewMode==='table'?'btn-primary':'btn-ghost'}" 
                        onclick="BillingScreen.setViewMode('table')" style="font-weight:600">
                  📄 All Invoices Table
                </button>
              </div>

              <!-- Status & Version Filter Tabs -->
              <div class="timeline-stage-tabs" style="margin:0">
                <button class="timeline-stage-tab ${this._filter==='all'?'active':''}" onclick="BillingScreen.setFilter('all')">
                  All Bills (${allInvoices.length})
                </button>
                <button class="timeline-stage-tab ${this._filter==='pending'?'active':''}" onclick="BillingScreen.setFilter('pending')">
                  Pending Approval (${allInvoices.filter(i=>i.status!=='paid').length})
                </button>
                <button class="timeline-stage-tab ${this._filter==='paid'?'active':''}" onclick="BillingScreen.setFilter('paid')">
                  Paid (${allInvoices.filter(i=>i.status==='paid').length})
                </button>
                <button class="timeline-stage-tab ${this._filter==='revised'?'active':''}" onclick="BillingScreen.setFilter('revised')">
                  Revised (v1.1+) (${allInvoices.filter(i=>i.isRevised).length})
                </button>
                <button class="timeline-stage-tab ${this._filter==='latest'?'active':''}" onclick="BillingScreen.setFilter('latest')">
                  Latest Active Only
                </button>
              </div>

            </div>

            <!-- Right: Company Filter Dropdown & Instant Search -->
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              
              <select class="form-select form-control-sm" style="width:200px;height:32px;font-size:12.5px" 
                      onchange="BillingScreen.setCompanyFilter(this.value)">
                <option value="all" ${this._companyFilter==='all'?'selected':''}>Filter by Company (${companies.length})</option>
                ${companies.map(c => `
                  <option value="${c.id}" ${this._companyFilter===c.id?'selected':''}>${c.name}</option>
                `).join('')}
              </select>

              <div class="search-input-wrap" style="width:240px">
                <span class="search-icon">${Icons.search}</span>
                <input type="text" id="billing-search-input" class="form-input search-input" style="height:32px;font-size:12.5px" 
                       placeholder="Search company, bill, or v2.0..." value="${this._search}"
                       oninput="BillingScreen.onSearch(this.value)">
                <button type="button" id="billing-search-clear" class="search-clear-btn ${this._search ? '' : 'hidden'}" onclick="BillingScreen.clearSearch()" title="Clear search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

            </div>

          </div>
        </div>

        <!-- Dynamic Billing Content Container (Company Accordion or Flat Table) -->
        <div id="billing-content-view">
          ${this._viewMode === 'company' ? this._renderCompanyGroups(invoices) : this._renderTable(invoices)}
        </div>

      </div>
    `;
  },

  // ─── 1. Company Grouped Accordion View ───
  _renderCompanyGroups(invoices) {
    const companies = this._getCompanies();
    
    // Filter companies if companyFilter is set
    const filteredCompanies = companies.filter(comp => {
      if (this._companyFilter !== 'all' && comp.id !== this._companyFilter) return false;
      const compInvs = invoices.filter(i => i.companyId === comp.id);
      return compInvs.length > 0;
    });

    if (filteredCompanies.length === 0) {
      return `
        <div class="section-card" style="padding:40px;text-align:center">
          <p style="color:var(--color-text-muted);font-size:14px">
            ${this._search ? `No billing records found matching "${this._search}"` : 'No billing records match selected filters.'}
          </p>
          <button class="btn btn-secondary btn-sm" onclick="BillingScreen.clearSearch(); BillingScreen.setFilter('all'); BillingScreen.setCompanyFilter('all')" style="margin-top:10px">
            Reset Filters
          </button>
        </div>
      `;
    }

    return `
      <div class="billing-company-groups-container" style="display:flex;flex-direction:column;gap:16px">
        ${filteredCompanies.map(comp => {
          const compInvoices = invoices.filter(i => i.companyId === comp.id);
          const isExpanded = this._expandedCompanies[comp.id] !== false;

          return `
            <div class="billing-company-card section-card no-pad" style="border:1px solid var(--color-border);border-radius:10px;overflow:hidden;background:var(--color-surface)">
              
              <!-- Company Header Accordion Bar -->
              <div class="billing-company-header" 
                   onclick="BillingScreen.toggleCompany('${comp.id}')"
                   style="padding:14px 20px;background:var(--color-bg-page);border-bottom:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;transition:background 0.15s ease">
                
                <div style="display:flex;align-items:center;gap:12px;min-width:0">
                  <span style="font-size:11px;font-family:var(--font-mono);color:var(--color-text-muted)">${isExpanded ? '▼' : '▶'}</span>
                  <div style="width:36px;height:36px;border-radius:8px;background:rgba(37,99,235,0.1);color:#2563EB;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0">
                    ${comp.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style="min-width:0">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                      <span style="font-weight:700;font-size:14.5px;color:var(--color-text-primary)">${comp.name}</span>
                      <span class="badge badge-primary" style="font-size:10px;padding:1px 6px">${compInvoices.length} Bills Issued</span>
                      <span class="badge ${comp.paymentStatusBadge}" style="font-size:10px;padding:1px 6px">${comp.paymentStatus}</span>
                      ${comp.hasRevisions ? `<span class="badge" style="background:#F3E8FF;color:#7C3AED;border:1px solid #DDD6FE;font-size:10px;padding:1px 6px">Version Controlled</span>` : ''}
                    </div>
                    <div style="font-size:11.5px;color:var(--color-text-muted);margin-top:1px">
                      ${comp.activePackage} · Contract: <strong>${comp.totalContractValue}</strong> · Contact: ${comp.contactPerson}
                    </div>
                  </div>
                </div>

                <!-- Company Financial Summary Pill -->
                <div style="display:flex;align-items:center;gap:16px;flex-shrink:0">
                  <div style="text-align:right">
                    <div style="font-size:10.5px;text-transform:uppercase;color:var(--color-text-muted);font-weight:600">Total Billed</div>
                    <div style="font-size:13.5px;font-weight:700;color:var(--color-text-primary)">${comp.totalBilledFormatted}</div>
                  </div>
                  <div style="text-align:right">
                    <div style="font-size:10.5px;text-transform:uppercase;color:var(--color-text-muted);font-weight:600">Pending Due</div>
                    <div style="font-size:13.5px;font-weight:700;color:#DC2626">${comp.totalPendingFormatted}</div>
                  </div>
                  <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); BillingScreen.toggleCompany('${comp.id}')">
                    ${isExpanded ? 'Collapse' : 'Expand'}
                  </button>
                </div>

              </div>

              <!-- Expanded Invoice List for Company -->
              ${isExpanded ? `
                <div class="billing-company-body" style="padding:0">
                  <div class="table-wrap">
                    <table class="table commercial-table" style="margin:0">
                      <thead>
                        <tr style="background:var(--color-surface)">
                          <th style="width:140px">Bill Reference</th>
                          <th style="width:130px">Version</th>
                          <th>Milestone Deliverable</th>
                          <th class="num" style="width:120px">Amount Due</th>
                          <th class="num" style="width:120px">Tax / Deduct.</th>
                          <th style="width:110px">Due Date</th>
                          <th class="center" style="width:150px">Status</th>
                          <th class="center" style="width:220px">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${compInvoices.map(inv => `
                          <tr>
                            <td>
                              <div style="font-family:var(--font-mono);font-weight:700;font-size:13px;color:var(--color-text-primary)">
                                ${inv.id}
                              </div>
                              <div style="font-size:10.5px;color:var(--color-text-muted);font-weight:600">
                                ${inv.billNumber}
                              </div>
                            </td>
                            
                            <!-- Version Badge & Indicator -->
                            <td>
                              <button class="billing-version-badge ${inv.versionBadgeClass}" 
                                      onclick="BillingScreen.openVersionHistory('${inv.id}')"
                                      title="Click to inspect complete revision audit trail">
                                <span class="version-dot"></span>
                                <span>${inv.version}</span>
                                ${inv.isRevised ? `<span style="font-size:9px;opacity:0.85">(${inv.versionHistory.length} rev)</span>` : ''}
                              </button>
                            </td>

                            <td>
                              <div style="font-size:12.5px;font-weight:600;color:var(--color-text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px" title="${inv.milestone}">
                                ${inv.milestone}
                              </div>
                              <div style="font-size:11px;color:var(--color-text-muted)">
                                Issued: ${Utils.formatDate(inv.issueDate)} · Project: ${inv.projectName}
                              </div>
                            </td>

                            <td class="num" style="font-weight:700;font-size:13px;color:var(--color-text-primary)">
                              ${inv.amountDue}
                            </td>

                            <td class="num" style="font-size:11.5px;color:var(--color-text-muted)">
                              <div>+${inv.taxAmount || '₹0'} (Tax)</div>
                              <div style="color:#DC2626">-${inv.deductions || '₹0'} (Ret)</div>
                            </td>

                            <td style="font-size:12px;color:var(--color-text-secondary);white-space:nowrap">
                              ${Utils.formatDate(inv.dueDate)}
                            </td>

                            <td class="center">
                              <span class="badge ${inv.badgeClass}">${inv.statusLabel}</span>
                            </td>

                            <td class="center">
                              <div style="display:flex;align-items:center;justify-content:center;gap:5px;flex-wrap:wrap">
                                <button class="btn btn-outline btn-xs" onclick="BillingScreen.openVersionHistory('${inv.id}')" title="View Version History">
                                  📜 Version History
                                </button>
                                <button class="btn btn-ghost btn-xs" onclick="BillingScreen.viewInvoice('${inv.id}')" title="View Certificate">
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              ` : ''}

            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // ─── 2. Flat All Invoices Table View ───
  _renderTable(invoices) {
    if (invoices.length === 0) {
      return `
        <div class="section-card" style="padding:40px;text-align:center">
          <p style="color:var(--color-text-muted);font-size:14px">
            ${this._search ? `No invoices found matching "${this._search}"` : 'No invoices match selected filter.'}
          </p>
        </div>
      `;
    }

    return `
      <div class="section-card no-pad">
        <div class="table-wrap">
          <table class="table commercial-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Company / Client</th>
                <th>Version</th>
                <th>Project / Package</th>
                <th class="num">Amount Due</th>
                <th>Milestone Reference</th>
                <th>Due Date</th>
                <th class="center">Status</th>
                <th class="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => `
                <tr>
                  <td>
                    <span class="task-title" style="font-family:var(--font-mono, monospace);font-weight:700" 
                          onclick="BillingScreen.openVersionHistory('${inv.id}')">
                      ${inv.id}
                    </span>
                    <div style="font-size:10px;color:var(--color-text-muted)">${inv.billNumber}</div>
                  </td>
                  <td>
                    <div style="font-weight:600;color:var(--color-text-primary);font-size:12.5px">${inv.companyName}</div>
                  </td>
                  <td>
                    <button class="billing-version-badge ${inv.versionBadgeClass}" 
                            onclick="BillingScreen.openVersionHistory('${inv.id}')"
                            title="Inspect revision history">
                      <span class="version-dot"></span>
                      <span>${inv.version}</span>
                    </button>
                  </td>
                  <td>
                    <div style="font-weight:600;color:var(--color-text-primary);font-size:12.5px">${inv.projectName}</div>
                    <div style="font-size:11px;color:var(--color-text-muted)">${inv.packageCode}</div>
                  </td>
                  <td class="num" style="font-weight:700;color:var(--color-text-primary)">
                    ${inv.amountDue}
                  </td>
                  <td style="font-size:12px;color:var(--color-text-secondary);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${inv.milestone}">
                    ${inv.milestone}
                  </td>
                  <td style="font-size:12px;color:var(--color-text-secondary);white-space:nowrap">
                    ${Utils.formatDate(inv.dueDate)}
                  </td>
                  <td class="center">
                    <span class="badge ${inv.badgeClass}">${inv.statusLabel}</span>
                  </td>
                  <td class="center">
                    <div style="display:flex;align-items:center;justify-content:center;gap:5px">
                      <button class="btn btn-outline btn-xs" onclick="BillingScreen.openVersionHistory('${inv.id}')" title="Version History">
                        History
                      </button>
                      <button class="btn btn-ghost btn-xs" onclick="BillingScreen.viewInvoice('${inv.id}')">
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ─── 3. Interactive Version History Drawer / Modal ───
  openVersionHistory(invoiceId) {
    const inv = this._getInvoices().find(i => i.id === invoiceId);
    if (!inv) return;

    const history = inv.versionHistory || [];
    const baseline = history.find(h => h.version === 'v1.0') || history[0];
    const current = history.find(h => h.isCurrent) || history[history.length - 1];

    const html = `
      <div class="version-history-modal-body" style="display:flex;flex-direction:column;gap:16px;font-size:13px">
        
        <!-- Header Information Card -->
        <div style="padding:14px 18px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-family:var(--font-mono);font-size:17px;font-weight:700;color:var(--color-text-primary)">${inv.id}</span>
              <span class="badge ${inv.badgeClass}">${inv.statusLabel}</span>
              <span class="billing-version-badge ${inv.versionBadgeClass}">${inv.version} (Active)</span>
            </div>
            <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px">
              Client: <strong>${inv.companyName}</strong> · Project: <strong>${inv.projectName}</strong>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;text-transform:uppercase;color:var(--color-text-muted);font-weight:600">Current Net Payable</div>
            <div style="font-size:18px;font-weight:800;color:var(--color-primary-700)">${inv.netPayable || inv.amountDue}</div>
          </div>
        </div>

        <!-- Baseline vs Current Diff Summary Box -->
        <div style="padding:12px 16px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between;gap:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:16px">⚖️</span>
            <div>
              <div style="font-weight:700;color:#1E40AF;font-size:12.5px">Baseline v1.0 vs Active ${inv.version} Revisions</div>
              <div style="font-size:11.5px;color:#3B82F6">
                Total ${history.length} documented revisions logged with strict commercial audit compliance.
              </div>
            </div>
          </div>
          <button class="btn btn-outline btn-xs" onclick="BillingScreen.compareVersions('${inv.id}')" style="background:#fff;font-weight:600">
            🔍 Side-by-Side Diff
          </button>
        </div>

        <!-- Chronological Timeline of Revisions -->
        <div class="version-history-timeline" style="display:flex;flex-direction:column;gap:12px;position:relative">
          ${history.slice().reverse().map((ver) => `
            <div class="version-history-item ${ver.isCurrent ? 'active-version' : ''}" 
                 style="padding:14px 16px;border-radius:8px;border:1px solid ${ver.isCurrent ? '#93C5FD' : 'var(--color-border)'};background:${ver.isCurrent ? '#F8FAFC' : 'var(--color-surface)'};box-shadow:${ver.isCurrent ? '0 2px 6px rgba(37,99,235,0.08)' : 'none'}">
              
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="billing-version-badge ${ver.isCurrent ? (ver.version.startsWith('v2')?'version-pill-v2':'version-pill-v1-1') : 'version-pill-v1'}" style="font-size:11px">
                    ${ver.version}
                  </span>
                  <span style="font-weight:700;font-size:13px;color:var(--color-text-primary)">${ver.label}</span>
                  ${ver.isCurrent ? `<span class="badge" style="background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;font-size:10px;font-weight:700">● CURRENT ACTIVE BASELINE</span>` : `<span class="badge" style="background:var(--color-bg-page);color:var(--color-text-muted);font-size:10px">ARCHIVED HISTORICAL REVISION</span>`}
                </div>
                <span style="font-size:11.5px;color:var(--color-text-muted)">
                  📅 ${Utils.formatDate(ver.date)}
                </span>
              </div>

              <!-- Amounts & Financial Breakdown -->
              <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;padding:8px 12px;background:var(--color-bg-page);border-radius:6px;margin-bottom:8px;font-size:11.5px">
                <div>
                  <span style="color:var(--color-text-muted)">Base Due:</span>
                  <strong style="color:var(--color-text-primary)">${ver.baseAmount}</strong>
                </div>
                <div>
                  <span style="color:var(--color-text-muted)">Tax/GST:</span>
                  <strong style="color:#059669">+${ver.tax}</strong>
                </div>
                <div>
                  <span style="color:var(--color-text-muted)">Retention:</span>
                  <strong style="color:#DC2626">-${ver.deductions}</strong>
                </div>
                <div>
                  <span style="color:var(--color-text-muted)">Net Payable:</span>
                  <strong style="color:var(--color-primary-700)">${ver.netPayable}</strong>
                </div>
              </div>

              <!-- Reason & Editor -->
              <div style="font-size:12px;color:var(--color-text-secondary);line-height:1.4">
                <strong>Change Reason:</strong> ${ver.changeReason}
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--color-text-muted)">
                <span>Modified Fields: <code style="background:var(--color-bg-page);padding:1px 4px;border-radius:3px">${(ver.modifiedFields || []).join(', ')}</code></span>
                <span>Editor: <strong>${ver.editor}</strong></span>
              </div>

            </div>
          `).join('')}
        </div>

      </div>
    `;

    Modal.open(`Bill Version History: ${inv.id} (${inv.companyName})`, html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-outline" onclick="Modal.closeAll(); BillingScreen.generateBillPDF('${inv.id}')">
        🖨️ Generate Tax Invoice PDF
      </button>
      <button class="btn btn-secondary" onclick="Modal.closeAll(); BillingScreen.viewInvoice('${inv.id}')">
        View Active Invoice
      </button>
    `, { large: true });
  },

  // ─── 4. "Create Revised Version" / "Revise Bill" Action & Modal ───
  openReviseModal(invoiceId) {
    const inv = this._getInvoices().find(i => i.id === invoiceId);
    if (!inv) return;

    const currentVer = inv.version || 'v1.0';
    let nextMinor = 'v1.1';
    let nextMajor = 'v2.0';

    if (currentVer.startsWith('v1.')) {
      const minorNum = parseInt(currentVer.split('.')[1] || '0', 10) + 1;
      nextMinor = `v1.${minorNum}`;
      nextMajor = 'v2.0';
    } else if (currentVer.startsWith('v2.')) {
      const minorNum = parseInt(currentVer.split('.')[1] || '0', 10) + 1;
      nextMinor = `v2.${minorNum}`;
      nextMajor = 'v3.0';
    }

    const currentBaseNumber = parseInt((inv.amountDue || '₹0').replace(/[^0-9]/g, ''), 10) || 410000;

    const html = `
      <div style="display:flex;flex-direction:column;gap:14px;font-size:13px">
        
        <div style="padding:12px 14px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;font-weight:600">Revising Active Bill</div>
            <div style="font-weight:700;font-size:15px;color:var(--color-text-primary)">
              ${inv.id} (${inv.companyName})
            </div>
          </div>
          <span class="billing-version-badge ${inv.versionBadgeClass}">Current: ${currentVer}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label" style="font-weight:600">New Version Increment</label>
            <select class="form-control" id="revise-version-select">
              <option value="${nextMinor}" selected>${nextMinor} - Minor Adjustment (Tax/Quantity)</option>
              <option value="${nextMajor}">${nextMajor} - Major Re-negotiated Addendum</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:600">Effective Revision Date</label>
            <input type="date" class="form-control" id="revise-date" value="2026-09-23">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label" style="font-weight:600">Base Amount Due (₹)</label>
            <input type="text" class="form-control" id="revise-base-amount" value="${inv.amountDue.replace('₹', '')}">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:600">Tax / GST (18%) (₹)</label>
            <input type="text" class="form-control" id="revise-tax-amount" value="${inv.taxAmount ? inv.taxAmount.replace('₹', '') : '73,800'}">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:600">Retention (5%) (₹)</label>
            <input type="text" class="form-control" id="revise-retention-amount" value="${inv.deductions ? inv.deductions.replace('₹', '') : '20,500'}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600">Modified Fields (Tags)</label>
          <input type="text" class="form-control" id="revise-fields" placeholder="e.g. BOQ Line 4.2 Adjustment, Scope Addendum, Surcharge Tax" value="BOQ Quantity Adjustment, Base Due">
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600">Reason for Revision (Mandatory Audit Trail)</label>
          <textarea class="form-control" id="revise-reason" rows="2" placeholder="Describe the commercial agreement, joint survey notes, or scope addendum..."></textarea>
        </div>

      </div>
    `;

    Modal.open(`Revise Invoice: ${inv.id}`, html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="BillingScreen._saveRevision('${inv.id}')">
        ${Icons.check} Publish Revised Version
      </button>
    `);
  },

  _saveRevision(invoiceId) {
    const inv = this._getInvoices().find(i => i.id === invoiceId);
    if (!inv) return;

    const newVer = document.getElementById('revise-version-select') ? document.getElementById('revise-version-select').value : 'v2.0';
    const revDate = document.getElementById('revise-date') ? document.getElementById('revise-date').value : '2026-09-23';
    const baseAmt = document.getElementById('revise-base-amount') ? document.getElementById('revise-base-amount').value : '425,000';
    const taxAmt = document.getElementById('revise-tax-amount') ? document.getElementById('revise-tax-amount').value : '76,500';
    const retAmt = document.getElementById('revise-retention-amount') ? document.getElementById('revise-retention-amount').value : '21,250';
    const fieldsStr = document.getElementById('revise-fields') ? document.getElementById('revise-fields').value : 'Scope Addendum';
    const reason = document.getElementById('revise-reason') ? document.getElementById('revise-reason').value : 'Client commercial council signed scope addendum';

    const baseFormatted = baseAmt.startsWith('₹') ? baseAmt : `₹${baseAmt}`;
    const taxFormatted = taxAmt.startsWith('₹') ? taxAmt : `₹${taxAmt}`;
    const retFormatted = retAmt.startsWith('₹') ? retAmt : `₹${retAmt}`;

    const numBase = parseInt(baseAmt.replace(/[^0-9]/g, ''), 10) || 0;
    const numTax = parseInt(taxAmt.replace(/[^0-9]/g, ''), 10) || 0;
    const numRet = parseInt(retAmt.replace(/[^0-9]/g, ''), 10) || 0;
    const netFormatted = `₹${(numBase + numTax - numRet).toLocaleString()}`;

    // Build version history entry
    const newRevObj = {
      version: newVer,
      label: newVer.startsWith('v2') || newVer.startsWith('v3') ? 'Re-negotiated & Final Submission' : 'Minor Revision & Adjustment',
      date: revDate,
      baseAmount: baseFormatted,
      tax: taxFormatted,
      deductions: retFormatted,
      netPayable: netFormatted,
      editor: 'Ayush Desai (Admin)',
      changeReason: reason || 'Commercial revision authorized and logged.',
      modifiedFields: fieldsStr.split(',').map(s => s.trim()).filter(Boolean),
      isCurrent: true
    };

    Store.updateInvoice(invoiceId, {
      versionHistory: [...(inv.versionHistory || []).map(h => ({...h, isCurrent: false})), newRevObj],
      version: newVer,
      versionLabel: `${newVer} - Active Revision`,
      versionBadgeClass: newVer.startsWith('v2') || newVer.startsWith('v3') ? 'version-pill-v2' : 'version-pill-v1-1',
      isRevised: true,
      amountDue: baseFormatted,
      taxAmount: taxFormatted,
      deductions: retFormatted,
      netPayable: netFormatted
    });

    Modal.closeAll();
    Toast.show(`Bill ${inv.id} revised to ${newVer}. Version audit trail updated.`, 'success', 4000);
    this.updateBillingContainer();
  },

  // ─── 5. Side-by-Side Version Diff Comparison ───
  compareVersions(invoiceId) {
    const inv = this._getInvoices().find(i => i.id === invoiceId);
    if (!inv) return;

    const history = inv.versionHistory || [];
    const baseline = history.find(h => h.version === 'v1.0') || history[0];
    const current = history.find(h => h.isCurrent) || history[history.length - 1];

    const html = `
      <div style="display:flex;flex-direction:column;gap:14px;font-size:13px">
        <div style="padding:10px 14px;background:var(--color-bg-page);border-radius:6px;border:1px solid var(--color-border);font-size:12.5px">
          Comparing <strong>${inv.id}</strong>: Baseline <code>${baseline.version}</code> vs Active <code>${current.version}</code>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <!-- Baseline Card -->
          <div class="version-diff-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span class="billing-version-badge version-pill-v1">${baseline.version} (Baseline)</span>
              <span style="font-size:11.5px;color:var(--color-text-muted)">${Utils.formatDate(baseline.date)}</span>
            </div>
            <div style="font-size:12px;display:flex;flex-direction:column;gap:4px">
              <div>Base Due: <strong>${baseline.baseAmount}</strong></div>
              <div>Tax (GST): <strong style="color:#059669">+${baseline.tax}</strong></div>
              <div>Retention: <strong style="color:#DC2626">-${baseline.deductions}</strong></div>
              <div style="margin-top:4px;padding-top:4px;border-top:1px solid var(--color-border)">
                Net Payable: <strong style="color:var(--color-primary-700);font-size:14px">${baseline.netPayable}</strong>
              </div>
            </div>
            <div style="font-size:11.5px;color:var(--color-text-secondary);margin-top:8px">
              <strong>Editor:</strong> ${baseline.editor}
            </div>
          </div>

          <!-- Current Active Card -->
          <div class="version-diff-card" style="border-color:#93C5FD;background:#F8FAFC">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span class="billing-version-badge version-pill-v2">${current.version} (Active)</span>
              <span style="font-size:11.5px;color:var(--color-text-muted)">${Utils.formatDate(current.date)}</span>
            </div>
            <div style="font-size:12px;display:flex;flex-direction:column;gap:4px">
              <div>Base Due: <strong style="color:#2563EB">${current.baseAmount}</strong></div>
              <div>Tax (GST): <strong style="color:#059669">+${current.tax}</strong></div>
              <div>Retention: <strong style="color:#DC2626">-${current.deductions}</strong></div>
              <div style="margin-top:4px;padding-top:4px;border-top:1px solid var(--color-border)">
                Net Payable: <strong style="color:var(--color-primary-700);font-size:14px">${current.netPayable}</strong>
              </div>
            </div>
            <div style="font-size:11.5px;color:var(--color-text-secondary);margin-top:8px">
              <strong>Editor:</strong> ${current.editor}
            </div>
          </div>
        </div>

        <div style="padding:10px 14px;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:6px;font-size:12px;color:#065F46">
          ${Icons.check} <strong>Audit Trail Endorsement:</strong> All revisions cryptographically fingerprinted and aligned with commercial client contracts.
        </div>
      </div>
    `;

    Modal.open(`Version Comparison: ${inv.id}`, html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-primary" onclick="BillingScreen.openVersionHistory('${inv.id}')">
        Back to Version History
      </button>
    `);
  },

  viewInvoice(id) {
    const inv = this._getInvoices().find(x => x.id === id);
    if (!inv) return;

    const html = `
      <div style="display:flex;flex-direction:column;gap:14px;font-size:13px">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div>
            <div style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;font-weight:600">Invoice Number & Version</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
              <span style="font-family:var(--font-mono, monospace);font-size:16px;font-weight:700;color:var(--color-text-primary)">${inv.id}</span>
              <span class="billing-version-badge ${inv.versionBadgeClass}">${inv.version}</span>
            </div>
          </div>
          <span class="badge ${inv.badgeClass}">${inv.statusLabel}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface)">
          <div><span style="color:var(--color-text-muted)">Client Company:</span> <strong>${inv.companyName}</strong></div>
          <div><span style="color:var(--color-text-muted)">Project:</span> <strong>${inv.projectName}</strong></div>
          <div><span style="color:var(--color-text-muted)">Package:</span> <strong>${inv.packageCode}</strong></div>
          <div><span style="color:var(--color-text-muted)">Contract Value:</span> <strong>${inv.contractValue}</strong></div>
          <div><span style="color:var(--color-text-muted)">Base Invoice:</span> <strong style="font-size:14px;color:var(--color-primary-700)">${inv.amountDue}</strong></div>
          <div><span style="color:var(--color-text-muted)">Net Payable:</span> <strong style="font-size:14px;color:var(--color-primary-700)">${inv.netPayable || inv.amountDue}</strong></div>
          <div><span style="color:var(--color-text-muted)">Milestone:</span> ${inv.milestone}</div>
          <div><span style="color:var(--color-text-muted)">Due Date:</span> <strong>${Utils.formatDate(inv.dueDate)}</strong></div>
        </div>

        <div style="padding:10px 14px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:var(--radius-md);color:#1D4ED8;font-size:12.5px">
          ${Icons.check} <strong>Version Control Verified:</strong> Active baseline version <code>${inv.version}</code> matches Hintonn Commercial PMO ledger and client signed BOQ.
        </div>
      </div>
    `;

    Modal.open(`Invoice: ${inv.id} · ${inv.version}`, html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-outline" onclick="BillingScreen.openVersionHistory('${inv.id}')">
        📜 View Version Revisions
      </button>
      <button class="btn btn-primary" onclick="Modal.closeAll(); BillingScreen.generateBillPDF('${inv.id}')">
        ${Icons.download} Download PDF
      </button>
    `);
  },

  sendReminder(id) {
    const inv = this._getInvoices().find(x => x.id === id);
    const company = inv ? inv.companyName : 'Client';
    Toast.show(`Automated reminder notice dispatched to ${company} Commercial Team for ${id}.`, 'success', 3500);
  },

  // ─── Indian Tax Invoice PDF Generator (GST Compliant) ───
  generateBillPDF(invoiceId) {
    const inv = this._getInvoices().find(x => x.id === invoiceId);
    if (!inv) { Toast.show('Invoice not found.', 'error'); return; }

    // Parse amount values from dollar strings to numbers (working with ₹)
    const parseNum = (s) => {
      if (!s) return 0;
      const str = String(s).replace(/[^0-9.]/g, '');
      return parseFloat(str) || 0;
    };

    const baseAmount = parseNum(inv.amountDue || inv.netPayable) || 5250000;
    const cgstRate = 9;
    const sgstRate = 9;
    const igstRate = 18;
    const cgstAmount = baseAmount * cgstRate / 100;
    const sgstAmount = baseAmount * sgstRate / 100;
    const igstAmount = baseAmount * igstRate / 100;
    const taxAmount = cgstAmount + sgstAmount; // intra-state: CGST + SGST
    const totalBeforeDiscount = baseAmount + taxAmount;
    const roundOff = Math.round(totalBeforeDiscount) - totalBeforeDiscount;
    const grandTotal = Math.round(totalBeforeDiscount);

    // Format Indian currency with ₹
    const fmtINR = (n) => {
      const num = Math.abs(n);
      const sign = n < 0 ? '-' : '';
      const parts = num.toFixed(2).split('.');
      let intPart = parts[0];
      const decPart = parts[1];
      // Indian grouping: last 3 digits, then groups of 2
      if (intPart.length > 3) {
        const last3 = intPart.slice(-3);
        const rest = intPart.slice(0, -3);
        const groups = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
        intPart = groups + ',' + last3;
      }
      return sign + '₹' + intPart + '.' + decPart;
    };

    // Number to Indian words
    const numberToWords = (num) => {
      if (num === 0) return 'Zero';
      const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
        'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
      const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
      const convertBelow1000 = (n) => {
        if (n === 0) return '';
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
        return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' and ' + convertBelow1000(n%100) : '');
      };
      const intNum = Math.floor(num);
      const decNum = Math.round((num - intNum) * 100);
      let result = '';
      if (intNum >= 10000000) {
        result += convertBelow1000(Math.floor(intNum / 10000000)) + ' Crore ';
      }
      if (intNum >= 100000) {
        result += convertBelow1000(Math.floor((intNum % 10000000) / 100000)) + ' Lakh ';
      }
      if (intNum >= 1000) {
        result += convertBelow1000(Math.floor((intNum % 100000) / 1000)) + ' Thousand ';
      }
      if (intNum % 1000 > 0) {
        result += convertBelow1000(intNum % 1000);
      }
      result = result.trim();
      if (decNum > 0) {
        result += ' and ' + convertBelow1000(decNum) + ' Paise';
      }
      return result + ' Only';
    };

    const amountInWords = numberToWords(grandTotal);
    const invNumber = inv.billNumber || inv.id;
    const issueDate = inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const dueDate = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '30 Sep 2026';

    // Build line items from available data
    const lineItems = [
      {
        sno: 1,
        description: inv.milestone || 'EPC Project Services',
        hsn: '998314', // SAC code for project management services
        qty: '1',
        unit: 'NOS',
        rate: baseAmount,
        amount: baseAmount
      },
      {
        sno: 2,
        description: 'Site Supervision & Technical Support',
        hsn: '998319',
        qty: '1',
        unit: 'NOS',
        rate: 0,
        amount: 0
      }
    ];

    // If there's an active package, update first item
    if (inv.packageCode) {
      lineItems[0].description = inv.milestone + ' - ' + inv.packageCode;
    }

    // If amount is already from tax, remove the tax item
    if (lineItems[1].amount === 0) {
      lineItems.splice(1, 1);
    }

    const taxLines = `
      <tr>
        <td style="text-align:left;padding:6px 10px;font-weight:600">CGST @ ${cgstRate}%</td>
        <td style="text-align:right;padding:6px 10px">${fmtINR(cgstAmount)}</td>
      </tr>
      <tr>
        <td style="text-align:left;padding:6px 10px;font-weight:600">SGST @ ${sgstRate}%</td>
        <td style="text-align:right;padding:6px 10px">${fmtINR(sgstAmount)}</td>
      </tr>
    `;

    const lineItemRows = lineItems.map(item => `
      <tr style="border-bottom:1px solid #E5E7EB">
        <td style="padding:8px 10px;text-align:center;font-size:12px;color:#374151">${item.sno}</td>
        <td style="padding:8px 10px;font-size:12px;color:#111827;font-weight:500">${item.description}</td>
        <td style="padding:8px 10px;text-align:center;font-size:11px;color:#6B7280;font-family:monospace">${item.hsn}</td>
        <td style="padding:8px 10px;text-align:center;font-size:12px;color:#374151">${item.qty}</td>
        <td style="padding:8px 10px;text-align:center;font-size:11px;color:#6B7280">${item.unit}</td>
        <td style="padding:8px 10px;text-align:right;font-size:12px;color:#374151">${fmtINR(item.rate)}</td>
        <td style="padding:8px 10px;text-align:right;font-size:12px;color:#111827;font-weight:600">${fmtINR(item.amount)}</td>
      </tr>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tax Invoice ${invNumber} - Hintonn AI</title>
<style>
  @page { size: A4; margin: 15mm 12mm 20mm 12mm; }
  @media print {
    body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
    .invoice-container { box-shadow: none !important; border: none !important; }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #F3F4F6; color: #111827; line-height: 1.5; }
  .invoice-container {
    max-width: 800px; margin: 20px auto; background: #FFFFFF;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08); border-radius: 4px; overflow: hidden;
  }
  @media print { .invoice-container { margin: 0; box-shadow: none; } }
  .invoice-header { background: linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%); color: #FFFFFF; padding: 24px 32px; position: relative; }
  .invoice-header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #F59E0B, #F97316, #EF4444); }
  .company-row { display: flex; justify-content: space-between; align-items: flex-start; }
  .company-info h1 { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px; }
  .company-info .tagline { font-size: 11px; opacity: 0.8; letter-spacing: 1px; text-transform: uppercase; }
  .company-details { font-size: 11.5px; line-height: 1.7; opacity: 0.92; margin-top: 8px; }
  .tax-reg-box { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); border-radius: 6px; padding: 10px 14px; text-align: right; min-width: 200px; }
  .tax-reg-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; }
  .tax-reg-box .value { font-size: 14px; font-weight: 700; letter-spacing: 1.5px; font-family: monospace; }
  .tax-reg-box .pan { font-size: 11px; margin-top: 2px; opacity: 0.85; }
  .invoice-title-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 32px; background: #F8FAFC; border-bottom: 2px solid #E5E7EB; }
  .invoice-title-bar h2 { font-size: 18px; font-weight: 800; color: #1E3A5F; text-transform: uppercase; letter-spacing: 2px; }
  .invoice-title-bar .copy { font-size: 10px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px; border: 1px solid #D1D5DB; border-radius: 3px; }
  .invoice-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .meta-section { padding: 18px 32px; }
  .meta-section.bill-to { border-right: 1px solid #E5E7EB; }
  .meta-section h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #6B7280; margin-bottom: 10px; font-weight: 700; }
  .meta-row { display: flex; margin-bottom: 5px; font-size: 12.5px; }
  .meta-label { width: 120px; color: #6B7280; font-weight: 500; flex-shrink: 0; }
  .meta-value { color: #111827; font-weight: 600; }
  .item-table { width: 100%; border-collapse: collapse; margin: 0; }
  .item-table thead th {
    background: #1E3A5F; color: #FFFFFF; font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.8px; padding: 10px; text-align: center;
  }
  .item-table thead th:first-child { text-align: center; width: 40px; }
  .item-table thead th:nth-child(2) { text-align: left; }
  .item-table tbody tr:hover { background: #F9FAFB; }
  .totals-section { display: flex; justify-content: flex-end; padding: 0 32px 20px; }
  .totals-box { width: 340px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 12px; font-size: 12.5px; border-bottom: 1px solid #F3F4F6; }
  .totals-row.tax { color: #059669; font-weight: 500; }
  .totals-row.grand { background: #1E3A5F; color: #FFFFFF; font-weight: 800; font-size: 15px; border-radius: 0 0 6px 6px; padding: 10px 12px; margin-top: 2px; }
  .amount-words { margin: 0 32px 20px; padding: 12px 16px; background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 6px; font-size: 12px; }
  .amount-words .label { font-weight: 700; color: #92400E; font-size: 10.5px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .amount-words .value { color: #78350F; font-weight: 600; }
  .bank-details { margin: 0 32px 20px; padding: 14px 18px; border: 1px solid #E5E7EB; border-radius: 6px; background: #F9FAFB; }
  .bank-details h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #1E3A5F; margin-bottom: 10px; font-weight: 700; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; }
  .bank-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; font-size: 12px; }
  .bank-grid .bl { color: #6B7280; font-weight: 500; }
  .bank-grid .bv { color: #111827; font-weight: 600; font-family: monospace; }
  .terms-section { margin: 0 32px 20px; padding: 14px 18px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; }
  .terms-section h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #1E3A5F; margin-bottom: 8px; font-weight: 700; }
  .terms-section ol { margin-left: 18px; font-size: 11px; color: #4B5563; line-height: 1.8; }
  .signature-section { display: flex; justify-content: space-between; padding: 20px 32px 30px; margin-top: 10px; }
  .sig-block { width: 220px; text-align: center; }
  .sig-block .line { border-top: 1px solid #9CA3AF; margin-top: 50px; padding-top: 8px; }
  .sig-block .name { font-size: 12px; font-weight: 700; color: #111827; }
  .sig-block .role { font-size: 10.5px; color: #6B7280; margin-top: 2px; }
  .invoice-footer { text-align: center; padding: 14px 32px; background: #1E3A5F; color: rgba(255,255,255,0.7); font-size: 10.5px; letter-spacing: 0.5px; }
  .stamp-box { border: 2px dashed #D1D5DB; border-radius: 6px; padding: 30px; text-align: center; color: #9CA3AF; font-size: 11px; }
  .print-actions { text-align: center; padding: 20px; background: #F8FAFC; border-top: 1px solid #E5E7EB; }
  .print-btn { padding: 10px 28px; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; border: none; margin: 0 8px; }
  .print-btn.primary { background: #2563EB; color: #fff; }
  .print-btn.secondary { background: #E5E7EB; color: #374151; }
  .print-btn:hover { opacity: 0.9; }
</style>
</head>
<body>
<div class="invoice-container" id="tax-invoice">

  <!-- ═══ HEADER ═══ -->
  <div class="invoice-header">
    <div class="company-row">
      <div class="company-info">
        <h1>HINTONN AI</h1>
        <div class="tagline">Engineering · Procurement · Construction — Technology Solutions</div>
        <div class="company-details">
          Office 401, Skyline Tower, Andheri East,<br>
          Mumbai, Maharashtra — 400069, India<br>
          Phone: +91 22 4567 8900 &nbsp;|&nbsp; Email: billing@hintonn.ai<br>
          Website: www.hintonn.ai
        </div>
      </div>
      <div class="tax-reg-box">
        <div class="label">GSTIN</div>
        <div class="value">27AABCH1234A1Z5</div>
        <div class="pan">PAN: AABCH1234A</div>
        <div class="label" style="margin-top:8px">State</div>
        <div class="value" style="font-size:12px;letter-spacing:0.5px">27 — Maharashtra</div>
      </div>
    </div>
  </div>

  <!-- ═══ INVOICE TITLE BAR ═══ -->
  <div class="invoice-title-bar">
    <h2>Tax Invoice</h2>
    <div class="copy">Original for Recipient</div>
  </div>

  <!-- ═══ META: BILL TO + INVOICE DETAILS ═══ -->
  <div class="invoice-meta">
    <div class="meta-section bill-to">
      <h3>Bill To / Sold To</h3>
      <div class="meta-row"><span class="meta-label">Company:</span><span class="meta-value">${inv.companyName || 'Client Company'}</span></div>
      <div class="meta-row"><span class="meta-label">Address:</span><span class="meta-value">Registered Office Address</span></div>
      <div class="meta-row"><span class="meta-label">State:</span><span class="meta-value">Maharashtra — 27</span></div>
      <div class="meta-row"><span class="meta-label">GSTIN:</span><span class="meta-value" style="font-family:monospace">27XXXXX1234X1Z5</span></div>
      <div class="meta-row"><span class="meta-label">Contact:</span><span class="meta-value">${inv.companyName ? inv.companyName.split(' ')[0] + ' Accounts' : 'Accounts Dept'}</span></div>
    </div>
    <div class="meta-section" style="padding-left:24px">
      <h3>Invoice Details</h3>
      <div class="meta-row"><span class="meta-label">Invoice No.:</span><span class="meta-value" style="font-family:monospace;color:#2563EB">${invNumber}</span></div>
      <div class="meta-row"><span class="meta-label">Invoice Date:</span><span class="meta-value">${issueDate}</span></div>
      <div class="meta-row"><span class="meta-label">Due Date:</span><span class="meta-value">${dueDate}</span></div>
      <div class="meta-row"><span class="meta-label">Payment Terms:</span><span class="meta-value">Net 30 Days</span></div>
      <div class="meta-row"><span class="meta-label">Project:</span><span class="meta-value">${inv.projectName || 'EPC Project'}</span></div>
      <div class="meta-row"><span class="meta-label">Version:</span><span class="meta-value">${inv.version || 'v1.0'}</span></div>
    </div>
  </div>

  <!-- ═══ ITEM TABLE ═══ -->
  <table class="item-table">
    <thead>
      <tr>
        <th>S.No</th>
        <th style="text-align:left">Description of Service</th>
        <th>HSN/SAC</th>
        <th>Qty</th>
        <th>Unit</th>
        <th style="text-align:right">Rate (₹)</th>
        <th style="text-align:right">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemRows}
      <!-- Subtotal Row -->
      <tr style="border-top:2px solid #1E3A5F;background:#F8FAFC">
        <td colspan="6" style="padding:8px 10px;text-align:right;font-size:12px;font-weight:700;color:#374151">Sub Total</td>
        <td style="padding:8px 10px;text-align:right;font-size:13px;font-weight:700;color:#111827">${fmtINR(baseAmount)}</td>
      </tr>
    </tbody>
  </table>

  <!-- ═══ TAX BREAKDOWN + TOTALS ═══ -->
  <div class="totals-section">
    <div class="totals-box">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <tbody>
          <tr>
            <td style="padding:5px 12px;color:#6B7280;border-bottom:1px solid #F3F4F6">Taxable Amount</td>
            <td style="padding:5px 12px;text-align:right;font-weight:600;color:#374151;border-bottom:1px solid #F3F4F6">${fmtINR(baseAmount)}</td>
          </tr>
          ${taxLines}
          <tr style="border-bottom:2px solid #E5E7EB">
            <td style="padding:5px 12px;color:#6B7280">Round Off</td>
            <td style="padding:5px 12px;text-align:right;font-weight:500;color:#374151">${roundOff >= 0 ? '+' : ''}${fmtINR(roundOff)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:0">
              <div style="background:#1E3A5F;color:#FFF;display:flex;justify-content:space-between;padding:10px 12px;border-radius:0 0 6px 6px;font-weight:800;font-size:15px">
                <span>Grand Total (Inclusive GST)</span>
                <span>${fmtINR(grandTotal)}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ═══ AMOUNT IN WORDS ═══ -->
  <div class="amount-words">
    <div class="label">Amount Chargeable (in words)</div>
    <div class="value">₹ ${amountInWords}</div>
  </div>

  <!-- ═══ BANK DETAILS ═══ -->
  <div class="bank-details">
    <h4>Bank Details for Payment</h4>
    <div class="bank-grid">
      <div><span class="bl">Bank Name:</span></div><div class="bv">HDFC Bank Ltd</div>
      <div><span class="bl">Account Name:</span></div><div class="bv">HINTONN AI PRIVATE LIMITED</div>
      <div><span class="bl">Account No.:</span></div><div class="bv">50100012345678</div>
      <div><span class="bl">IFSC Code:</span></div><div class="bv">HDFC0001234</div>
      <div><span class="bl">Account Type:</span></div><div class="bv">Current Account</div>
      <div><span class="bl">Branch:</span></div><div class="bv">Andheri East, Mumbai</div>
    </div>
  </div>

  <!-- ═══ TERMS & CONDITIONS ═══ -->
  <div class="terms-section">
    <h4>Terms &amp; Conditions</h4>
    <ol>
      <li>Payment is due within 30 days from the date of invoice.</li>
      <li>GST is charged @ 18% (CGST 9% + SGST 9%) for intra-state supply. For inter-state supply, IGST @ 18% shall apply.</li>
      <li>TDS @ 2% u/s 194C/194J of Income Tax Act, 1961 may be deducted by the client as applicable.</li>
      <li>Late payment will attract interest @ 18% per annum from the due date.</li>
      <li>All disputes subject to Mumbai, Maharashtra jurisdiction only.</li>
      <li>This is a computer-generated invoice and does not require a physical signature.</li>
      <li>E. &amp; O.E (Errors and Omissions Excepted).</li>
    </ol>
  </div>

  <!-- ═══ SIGNATURE SECTION ═══ -->
  <div class="signature-section">
    <div class="sig-block">
      <div class="stamp-box">
        <div style="font-size:10px;color:#9CA3AF">Company Seal / Stamp</div>
      </div>
    </div>
    <div style="width:100px"></div>
    <div class="sig-block">
      <div class="line">
        <div class="name">Authorised Signatory</div>
        <div class="role">For HINTONN AI PRIVATE LIMITED</div>
      </div>
    </div>
  </div>

  <!-- ═══ FOOTER ═══ -->
  <div class="invoice-footer">
    HINTONN AI PRIVATE LIMITED &nbsp;|&nbsp; CIN: U72200MH2024PTC123456 &nbsp;|&nbsp; GSTIN: 27AABCH1234A1Z5 &nbsp;|&nbsp; PAN: AABCH1234A<br>
    This is a system-generated tax invoice. For queries, contact accounts@hintonn.ai or call +91 22 4567 8900
  </div>

  <!-- ═══ PRINT ACTIONS (no-print on paper) ═══ -->
  <div class="print-actions no-print">
    <button class="print-btn primary" onclick="window.print()">🖨️ Print / Save as PDF</button>
    <button class="print-btn secondary" onclick="window.close()">Close</button>
  </div>

</div>
</body>
</html>`;

    // Open new window and render
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      // Auto-trigger print after render
      printWindow.onload = function() {
        setTimeout(() => {
          try { printWindow.print(); } catch(e) { /* user may need to click print button */ }
        }, 400);
      };
    } else {
      Toast.show('Pop-up blocked. Please allow pop-ups for this site.', 'error');
    }
  },

  exportLedger() {
    Toast.show('Commercial Invoicing Ledger exported.', 'success', 3000);
  }
};

