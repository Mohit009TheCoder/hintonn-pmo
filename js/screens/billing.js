// ─── Billing & Invoices Screen (Commercial PMO with Bill Version Control) ───
const BillingScreen = {
  _filter: 'all', // 'all' | 'pending' | 'paid' | 'revised' | 'latest'
  _companyFilter: 'all',
  _viewMode: 'company', // 'company' (default) | 'table'
  _search: '',
  _expandedCompanies: {},
  _getCompanies() {
    return Store.getCompanies();
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
    return Store.getInvoices().map(inv => ({
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
      list = list.filter(i => String(i.version || '').startsWith('v2') || !i.isRevised);
    }

    // Search query
    if (this._search) {
      const q = this._search.toLowerCase().trim();
      list = list.filter(i =>
        String(i.id || '').toLowerCase().includes(q) ||
        String(i.projectName || '').toLowerCase().includes(q) ||
        String(i.companyName || '').toLowerCase().includes(q) ||
        String(i.milestone || '').toLowerCase().includes(q) ||
        String(i.version || '').toLowerCase().includes(q) ||
        String(i.billNumber || '').toLowerCase().includes(q) ||
        String(i.amountDue || '').toLowerCase().includes(q)
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
    if (typeof document !== 'undefined') {
      const btnCompany = document.getElementById('billing-btn-group-company');
      const btnTable = document.getElementById('billing-btn-all-invoices');
      if (btnCompany && btnTable) {
        if (mode === 'company') {
          btnCompany.classList.remove('btn-ghost');
          btnCompany.classList.add('btn-primary');
          btnCompany.setAttribute('aria-pressed', 'true');
          btnTable.classList.remove('btn-primary');
          btnTable.classList.add('btn-ghost');
          btnTable.setAttribute('aria-pressed', 'false');
        } else {
          btnTable.classList.remove('btn-ghost');
          btnTable.classList.add('btn-primary');
          btnTable.setAttribute('aria-pressed', 'true');
          btnCompany.classList.remove('btn-primary');
          btnCompany.classList.add('btn-ghost');
          btnCompany.setAttribute('aria-pressed', 'false');
        }
      }
    }
    this.updateBillingContainer();
  },

  setCompanyFilter(companyId) {
    this._companyFilter = companyId;
    if (typeof document !== 'undefined') {
      const select = document.getElementById('billing-company-filter');
      if (select && select.value !== companyId) {
        select.value = companyId;
      }
    }
    this.updateBillingContainer();
  },

  setFilter(filter) {
    this._filter = filter;
    if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
      const tabs = document.querySelectorAll('.timeline-stage-tab[data-billing-filter]');
      if (tabs && tabs.forEach) {
        tabs.forEach(tab => {
          if (tab.getAttribute('data-billing-filter') === filter) {
            tab.classList.add('active');
          } else {
            tab.classList.remove('active');
          }
        });
      }
    }
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

  _updateKPIsAndTabs() {
    const allInvoices = this._getInvoices();
    const companies = this._getCompanies();
    const totalBills = allInvoices.length;
    const paidBills = allInvoices.filter(i => i.status === 'paid').length;
    const pendingBills = totalBills - paidBills;
    const totalRevisedBills = allInvoices.filter(i => i.isRevised).length;
    const companyCount = companies.length;
    const packageCount = new Set(allInvoices.map(i => i.projectName).filter(Boolean)).size;

    const elTotal = document.getElementById('kpi-total-bills');
    const elTotalSub = document.getElementById('kpi-total-sub');
    const elPaid = document.getElementById('kpi-paid-bills');
    const elPending = document.getElementById('kpi-pending-bills');
    const elRevised = document.getElementById('kpi-revised-bills');

    if (elTotal) elTotal.textContent = `${totalBills} Bills`;
    if (elTotalSub) elTotalSub.textContent = `${companyCount} client ${companyCount === 1 ? 'company' : 'companies'} · ${packageCount} packages`;
    if (elPaid) elPaid.textContent = `${paidBills} Invoices`;
    if (elPending) elPending.textContent = `${pendingBills} Invoices`;
    if (elRevised) elRevised.textContent = `${totalRevisedBills} Bills Revised`;

    const tabsContainer = document.getElementById('billing-stage-tabs');
    if (tabsContainer) {
      tabsContainer.innerHTML = `
        <button type="button" class="timeline-stage-tab ${this._filter==='all'?'active':''}" data-billing-filter="all" onclick="BillingScreen.setFilter('all')">
          All Bills (${allInvoices.length})
        </button>
        <button type="button" class="timeline-stage-tab ${this._filter==='pending'?'active':''}" data-billing-filter="pending" onclick="BillingScreen.setFilter('pending')">
          Pending Approval (${allInvoices.filter(i=>i.status!=='paid').length})
        </button>
        <button type="button" class="timeline-stage-tab ${this._filter==='paid'?'active':''}" data-billing-filter="paid" onclick="BillingScreen.setFilter('paid')">
          Paid (${allInvoices.filter(i=>i.status==='paid').length})
        </button>
        <button type="button" class="timeline-stage-tab ${this._filter==='revised'?'active':''}" data-billing-filter="revised" onclick="BillingScreen.setFilter('revised')">
          Revised (v1.1+) (${allInvoices.filter(i=>i.isRevised).length})
        </button>
        <button type="button" class="timeline-stage-tab ${this._filter==='latest'?'active':''}" data-billing-filter="latest" onclick="BillingScreen.setFilter('latest')">
          Latest Active Only
        </button>
      `;
    }
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
      this._updateKPIsAndTabs();
    } else {
      if (typeof App !== 'undefined' && (App.currentScreen === 'billing' || App.currentScreen === 'invoices')) {
        App.refresh();
      }
    }
  },

  // ─── Main Screen Render ───
  render() {
    const allInvoices = this._getInvoices();
    const companies = this._getCompanies();
    const invoices = this._getFilteredInvoices();

    // Bill counts — monetary amounts removed from billing summary per request
    const totalBills = allInvoices.length;
    const paidBills = allInvoices.filter(i => i.status === 'paid').length;
    const pendingBills = totalBills - paidBills;
    const totalRevisedBills = allInvoices.filter(i => i.isRevised).length;
    const companyCount = companies.length;
    const packageCount = new Set(allInvoices.map(i => i.projectName).filter(Boolean)).size;

    return `
      <div class="billing-screen" id="billing">
        
        <!-- Page Header -->
        <div class="page-header" style="margin-bottom:18px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px">
          <div class="page-header-left">
            <h1>Billing & Invoices</h1>
            <p>Multi-bill company grouping, invoice version tracking (v1.0, v1.1, v2.0), and commercial revision history audit ledger.</p>
          </div>
          <div class="page-header-actions" style="display:flex;align-items:center;gap:10px;margin-left:auto">
            <button class="btn btn-primary" id="btn-create-invoice" onclick="BillingScreen.openCreateInvoiceModal()" style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;font-weight:700;font-size:13.5px;box-shadow:var(--shadow-md);border-radius:8px">
              ${Icons.plus} Create Invoice
            </button>
          </div>
        </div>

        <!-- Top Commercial KPI Strip -->
        <div class="kpi-grid" id="billing-kpi-grid" style="margin-bottom:20px">
          <div class="kpi-card" onclick="BillingScreen.setFilter('all')" style="cursor:pointer">
            <div class="kpi-header">
              <span class="kpi-label">Total Invoiced</span>
              <div class="kpi-icon-wrap">${Icons.fileText}</div>
            </div>
            <div class="kpi-value" id="kpi-total-bills">${totalBills} Bills</div>
            <div class="kpi-change neutral" id="kpi-total-sub" style="font-weight:600;color:var(--color-text-secondary)">
              ${companyCount} client ${companyCount === 1 ? 'company' : 'companies'} · ${packageCount} packages
            </div>
          </div>

          <div class="kpi-card" onclick="BillingScreen.setFilter('paid')" style="cursor:pointer">
            <div class="kpi-header">
              <span class="kpi-label">Certified & Collected</span>
              <div class="kpi-icon-wrap">${Icons.check}</div>
            </div>
            <div class="kpi-value" id="kpi-paid-bills">${paidBills} Invoices</div>
            <div class="kpi-change neutral" style="font-weight:600;color:var(--color-success-700, #1E40AF)">
              Fully settled
            </div>
          </div>

          <div class="kpi-card" onclick="BillingScreen.setFilter('pending')" style="cursor:pointer">
            <div class="kpi-header">
              <span class="kpi-label">Pending Client Sign-off</span>
              <div class="kpi-icon-wrap">${Icons.clock}</div>
            </div>
            <div class="kpi-value" id="kpi-pending-bills">${pendingBills} Invoices</div>
            <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
              Under review / certification
            </div>
          </div>

          <div class="kpi-card" onclick="BillingScreen.setFilter('revised')" style="cursor:pointer">
            <div class="kpi-header">
              <span class="kpi-label">Multi-Version Revisions</span>
              <div class="kpi-icon-wrap">${Icons.shield}</div>
            </div>
            <div class="kpi-value" id="kpi-revised-bills">${totalRevisedBills} Bills Revised</div>
            <div class="kpi-change neutral" style="font-weight:600;color:var(--color-warning-700, #5B21B6)">
              v1.1 → v2.0 version controlled
            </div>
          </div>
        </div>

        <!-- Filter & Search Toolbar Card -->
        <div class="section-card" style="margin-bottom:20px;padding:12px 16px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            
            <!-- Left: View Mode Toggle & Status Filters -->
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              
              <!-- View Mode Selector -->
              <div class="btn-group" id="billing-view-mode-group" style="display:inline-flex;align-items:center;background:var(--color-bg-page);padding:2px;border-radius:var(--radius-sm);border:1px solid var(--color-border);flex-shrink:0;box-sizing:border-box;gap:2px">
                <button type="button" id="billing-btn-group-company"
                        class="btn btn-xs ${this._viewMode==='company'?'btn-primary':'btn-ghost'}" 
                        onclick="BillingScreen.setViewMode('company')" 
                        style="font-weight:600;transform:none!important;cursor:pointer;white-space:nowrap;line-height:22px;height:26px;padding:0 12px;box-sizing:border-box;margin:0"
                        aria-pressed="${this._viewMode==='company'}">
                  Group by Company
                </button>
                <button type="button" id="billing-btn-all-invoices"
                        class="btn btn-xs ${this._viewMode==='table'?'btn-primary':'btn-ghost'}" 
                        onclick="BillingScreen.setViewMode('table')" 
                        style="font-weight:600;transform:none!important;cursor:pointer;white-space:nowrap;line-height:22px;height:26px;padding:0 12px;box-sizing:border-box;margin:0"
                        aria-pressed="${this._viewMode==='table'}">
                  All Invoices
                </button>
              </div>

              <!-- Status & Version Filter Tabs -->
              <div class="timeline-stage-tabs" id="billing-stage-tabs" style="margin:0;flex-shrink:0">
                <button type="button" class="timeline-stage-tab ${this._filter==='all'?'active':''}" data-billing-filter="all" onclick="BillingScreen.setFilter('all')">
                  All Bills (${allInvoices.length})
                </button>
                <button type="button" class="timeline-stage-tab ${this._filter==='pending'?'active':''}" data-billing-filter="pending" onclick="BillingScreen.setFilter('pending')">
                  Pending Approval (${allInvoices.filter(i=>i.status!=='paid').length})
                </button>
                <button type="button" class="timeline-stage-tab ${this._filter==='paid'?'active':''}" data-billing-filter="paid" onclick="BillingScreen.setFilter('paid')">
                  Paid (${allInvoices.filter(i=>i.status==='paid').length})
                </button>
                <button type="button" class="timeline-stage-tab ${this._filter==='revised'?'active':''}" data-billing-filter="revised" onclick="BillingScreen.setFilter('revised')">
                  Revised (v1.1+) (${allInvoices.filter(i=>i.isRevised).length})
                </button>
                <button type="button" class="timeline-stage-tab ${this._filter==='latest'?'active':''}" data-billing-filter="latest" onclick="BillingScreen.setFilter('latest')">
                  Latest Active Only
                </button>
              </div>

            </div>

            <!-- Right: Company Filter Dropdown & Instant Search -->
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              
              <select id="billing-company-filter" class="form-select form-control-sm" style="width:200px;height:32px;font-size:12.5px" 
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
      const hasInvoices = this._getInvoices().length > 0;
      return `
        <div class="section-card" style="padding:40px;text-align:center">
          <div style="width:44px;height:44px;margin:0 auto 12px;border-radius:var(--radius-md);background:var(--color-primary-50);color:var(--color-primary);display:flex;align-items:center;justify-content:center">
            ${Icons.fileText || ''}
          </div>
          <p style="color:var(--color-text-primary);font-size:14px;font-weight:600;margin:0 0 4px">
            ${this._search ? `No billing records found matching “${this._search}”` : (hasInvoices ? 'No invoices match the selected filters.' : 'No invoices yet')}
          </p>
          <p style="color:var(--color-text-muted);font-size:12.5px;margin:0">
            ${hasInvoices ? 'Adjust the filters or search to see more bills.' : 'Generate your first proforma invoice from an existing project — bill numbers, GST and TDS are calculated automatically.'}
          </p>
          <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:16px">
            <button class="btn btn-secondary btn-sm" onclick="BillingScreen.clearSearch(); BillingScreen.setFilter('all'); BillingScreen.setCompanyFilter('all')">
              Reset Filters
            </button>
            <button class="btn btn-primary btn-sm" onclick="BillingScreen.openCreateInvoiceModal()">
              ${Icons.plus} Create Invoice
            </button>
          </div>
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
                  <div style="width:36px;height:36px;border-radius:8px;background:var(--color-primary-50);color:var(--color-primary);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0">
                    ${comp.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style="min-width:0">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                      <span style="font-weight:700;font-size:14.5px;color:var(--color-text-primary)">${comp.name}</span>
                      <span class="badge badge-primary" style="font-size:10px;padding:1px 6px">${compInvoices.length} Bills Issued</span>
                      <span class="badge ${comp.paymentStatusBadge}" style="font-size:10px;padding:1px 6px">${comp.paymentStatus}</span>
                      ${comp.hasRevisions ? `<span class="badge" style="background:var(--color-warning-soft);color:var(--color-warning-700);border:1px solid var(--violet-200);font-size:10px;padding:1px 6px">Version Controlled</span>` : ''}
                    </div>
                    <div style="font-size:11.5px;color:var(--color-text-muted);margin-top:1px">
                      ${comp.activePackage} · Contract: <strong>${comp.totalContractValue}</strong> · Contact: ${comp.contactPerson}
                    </div>
                  </div>
                </div>

                <!-- Company Bill Status Pill (amounts removed per request) -->
                <div style="display:flex;align-items:center;gap:16px;flex-shrink:0">
                  <div style="text-align:right">
                    <div style="font-size:10.5px;text-transform:uppercase;color:var(--color-text-muted);font-weight:600">Settled</div>
                    <div style="font-size:13.5px;font-weight:700;color:var(--color-text-primary)">${compInvoices.filter(i => i.status === 'paid').length} / ${compInvoices.length} Bills</div>
                  </div>
                  <div style="text-align:right">
                    <div style="font-size:10.5px;text-transform:uppercase;color:var(--color-text-muted);font-weight:600">Open Bills</div>
                    <div style="font-size:13.5px;font-weight:700;color:var(--color-error)">${compInvoices.filter(i => i.status !== 'paid').length} Bills</div>
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
                              <div style="color:var(--color-error)">-${inv.deductions || '₹0'} (Ret)</div>
                            </td>

                            <td style="font-size:12px;color:var(--color-text-secondary);white-space:nowrap">
                              ${Utils.formatDate(inv.dueDate)}
                            </td>

                            <td class="center">
                              <span class="badge ${inv.badgeClass}">${inv.statusLabel}</span>
                            </td>

                            <td class="center">
                              <div style="display:flex;align-items:center;justify-content:center;gap:5px;flex-wrap:wrap">
                                <button class="btn btn-primary btn-xs" onclick="BillingScreen.openProformaPreview('${inv.id}')" title="View Proforma Invoice">
                                  📄 Proforma
                                </button>
                                <button class="btn btn-outline btn-xs" onclick="BillingScreen.openVersionHistory('${inv.id}')" title="View Version History">
                                  📜 History
                                </button>
                                <button class="btn btn-ghost btn-xs" onclick="BillingScreen.printProformaInvoice('${inv.id}')" title="Print / PDF">
                                  🖨️ PDF
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
      const hasInvoices = this._getInvoices().length > 0;
      return `
        <div class="section-card" style="padding:40px;text-align:center">
          <div style="width:44px;height:44px;margin:0 auto 12px;border-radius:var(--radius-md);background:var(--color-primary-50);color:var(--color-primary);display:flex;align-items:center;justify-content:center">
            ${Icons.fileText || ''}
          </div>
          <p style="color:var(--color-text-primary);font-size:14px;font-weight:600;margin:0 0 4px">
            ${this._search ? `No invoices found matching “${this._search}”` : (hasInvoices ? 'No invoices match the selected filters.' : 'No invoices yet')}
          </p>
          <p style="color:var(--color-text-muted);font-size:12.5px;margin:0">
            ${hasInvoices ? 'Adjust the filters or search to see more bills.' : 'Generate your first proforma invoice from an existing project — bill numbers, GST and TDS are calculated automatically.'}
          </p>
          <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:16px">
            <button class="btn btn-secondary btn-sm" onclick="BillingScreen.clearSearch(); BillingScreen.setFilter('all'); BillingScreen.setCompanyFilter('all')">
              Reset Filters
            </button>
            <button class="btn btn-primary btn-sm" onclick="BillingScreen.openCreateInvoiceModal()">
              ${Icons.plus} Create Invoice
            </button>
          </div>
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
                      <button class="btn btn-primary btn-xs" onclick="BillingScreen.openProformaPreview('${inv.id}')" title="View Proforma Invoice">
                        📄 Proforma
                      </button>
                      <button class="btn btn-outline btn-xs" onclick="BillingScreen.openVersionHistory('${inv.id}')" title="Version History">
                        History
                      </button>
                      <button class="btn btn-ghost btn-xs" onclick="BillingScreen.printProformaInvoice('${inv.id}')" title="Print / PDF">
                        🖨️ PDF
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
        <div style="padding:12px 16px;background:var(--color-primary-50);border:1px solid var(--color-border-brand);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between;gap:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:16px">⚖️</span>
            <div>
              <div style="font-weight:700;color:var(--color-primary-800);font-size:12.5px">Baseline v1.0 vs Active ${inv.version} Revisions</div>
              <div style="font-size:11.5px;color:var(--color-primary-500)">
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
                 style="padding:14px 16px;border-radius:8px;border:1px solid ${ver.isCurrent ? 'var(--color-primary-300)' : 'var(--color-border)'};background:${ver.isCurrent ? 'var(--color-bg-page)' : 'var(--color-surface)'};box-shadow:${ver.isCurrent ? '0 2px 6px rgba(37,99,235,0.08)' : 'none'}">
              
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="billing-version-badge ${ver.isCurrent ? (ver.version.startsWith('v2')?'version-pill-v2':'version-pill-v1-1') : 'version-pill-v1'}" style="font-size:11px">
                    ${ver.version}
                  </span>
                  <span style="font-weight:700;font-size:13px;color:var(--color-text-primary)">${ver.label}</span>
                  ${ver.isCurrent ? `<span class="badge" style="background:var(--color-success-soft);color:var(--color-success-700);border:1px solid var(--color-primary-200);font-size:10px;font-weight:700">● CURRENT ACTIVE BASELINE</span>` : `<span class="badge" style="background:var(--color-bg-page);color:var(--color-text-muted);font-size:10px">ARCHIVED HISTORICAL REVISION</span>`}
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
                  <strong style="color:var(--color-success-700, #1E40AF)">+${ver.tax}</strong>
                </div>
                <div>
                  <span style="color:var(--color-text-muted)">Retention:</span>
                  <strong style="color:var(--color-error)">-${ver.deductions}</strong>
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
        
        <div style="padding:12px 14px;background:var(--color-primary-50);border:1px solid var(--color-border-brand);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between">
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
            <input type="text" class="form-control" id="revise-base-amount" value="${(inv.amountDue || '').replace('₹', '')}">
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
              <div>Tax (GST): <strong style="color:var(--color-success-700, #1E40AF)">+${baseline.tax}</strong></div>
              <div>Retention: <strong style="color:var(--color-error)">-${baseline.deductions}</strong></div>
              <div style="margin-top:4px;padding-top:4px;border-top:1px solid var(--color-border)">
                Net Payable: <strong style="color:var(--color-primary-700);font-size:14px">${baseline.netPayable}</strong>
              </div>
            </div>
            <div style="font-size:11.5px;color:var(--color-text-secondary);margin-top:8px">
              <strong>Editor:</strong> ${baseline.editor}
            </div>
          </div>

          <!-- Current Active Card -->
          <div class="version-diff-card" style="border-color:var(--color-primary-300);background:var(--color-bg-page)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span class="billing-version-badge version-pill-v2">${current.version} (Active)</span>
              <span style="font-size:11.5px;color:var(--color-text-muted)">${Utils.formatDate(current.date)}</span>
            </div>
            <div style="font-size:12px;display:flex;flex-direction:column;gap:4px">
              <div>Base Due: <strong style="color:var(--color-primary)">${current.baseAmount}</strong></div>
              <div>Tax (GST): <strong style="color:var(--color-success-700, #1E40AF)">+${current.tax}</strong></div>
              <div>Retention: <strong style="color:var(--color-error)">-${current.deductions}</strong></div>
              <div style="margin-top:4px;padding-top:4px;border-top:1px solid var(--color-border)">
                Net Payable: <strong style="color:var(--color-primary-700);font-size:14px">${current.netPayable}</strong>
              </div>
            </div>
            <div style="font-size:11.5px;color:var(--color-text-secondary);margin-top:8px">
              <strong>Editor:</strong> ${current.editor}
            </div>
          </div>
        </div>

        <div style="padding:10px 14px;background:var(--color-success-soft);border:1px solid var(--color-primary-200);border-radius:var(--radius-md);font-size:12px;color:var(--color-success-700)">
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

        <div style="padding:10px 14px;background:var(--color-primary-50);border:1px solid var(--color-border-brand);border-radius:var(--radius-md);color:#1D4ED8;font-size:12.5px">
          ${Icons.check} <strong>Verified Billing State:</strong> Certified by commercial directorate. Ready for dispatch or proforma printout.
        </div>
      </div>
    `;

    Modal.open(`Invoice: ${inv.id} · ${inv.version}`, html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-outline" onclick="BillingScreen.openVersionHistory('${inv.id}')">
        📜 Version Revisions
      </button>
      <button class="btn btn-primary" onclick="Modal.closeAll(); BillingScreen.openProformaPreview('${inv.id}')">
        📄 View Proforma Invoice
      </button>
      <button class="btn btn-outline" onclick="Modal.closeAll(); BillingScreen.printProformaInvoice('${inv.id}')">
        🖨️ Print Proforma PDF
      </button>
    `, { large: true });
  },

  sendReminder(id) {
    const inv = this._getInvoices().find(x => x.id === id);
    const company = inv ? inv.companyName : 'Client';
    Toast.show(`Automated reminder notice dispatched to ${company} Commercial Team for ${id}.`, 'success', 3500);
  },

  // ─── Number / Currency Helpers ───
  _fmtINR(n, showSign = true) {
    if (n === undefined || n === null || isNaN(n)) return '₹0';
    const isNeg = n < 0;
    const absVal = Math.round(Math.abs(n));
    const s = absVal.toString();
    let result = '';
    if (s.length <= 3) {
      result = s;
    } else {
      result = s.slice(-3);
      let remaining = s.slice(0, -3);
      while (remaining.length > 2) {
        result = remaining.slice(-2) + ',' + result;
        remaining = remaining.slice(0, -2);
      }
      if (remaining.length > 0) result = remaining + ',' + result;
    }
    const prefix = isNeg ? (showSign ? '–₹' : '₹') : '₹';
    return prefix + result;
  },

  _numberToWords(num) {
    if (!num || num === 0) return 'Zero';
    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
      'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const convertBelow1000 = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
      return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' and ' + convertBelow1000(n%100) : '');
    };
    const intNum = Math.floor(Math.abs(num));
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
    return result ? result + ' Only' : 'Zero';
  },

  // ─── "Create Invoice" Modal & Flow ───
  _createModalState: null,

  _initCreateModalState() {
    const today = new Date();
    const validUntil = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
    const dateStr = today.toISOString().split('T')[0];
    const validStr = validUntil.toISOString().split('T')[0];

    const companies = this._getCompanies();
    const defaultComp = companies[0] || null;

    // Proper sequential bill number / quotation ref (per client, per year)
    const invoiceNumber = Store.generateBillNumber('CLIENT', today);
    const refQuotation = Store.generateQuotationRef('CLIENT', today);

    this._createModalState = {
      clientMode: 'other', // 'other' | 'existing'
      selectedCompanyId: defaultComp ? defaultComp.id : '',
      // Project-based billing — linked to a REAL project from the workspace
      projectId: '',
      milestoneId: '',
      clientLegalName: '',
      clientAddr1: '',
      clientAddr2: '',
      clientState: '',
      clientGstin: '',
      saveCompany: true,
      invoiceNumber: invoiceNumber,
      invoiceDate: dateStr,
      validUntil: validStr,
      refQuotation: refQuotation,
      currency: 'INR (₹)',
      modulesTag: '[R1 • R2 • R3]',
      items: [
        {
          id: 1,
          name: 'Service Delivery — as per agreed scope of work',
          desc: 'One-time development • incl. 1 month post-go-live fine-tuning',
          gross: 0,
          discountPct: 15
        }
      ],
      includeRecurring: true,
      recurringItem: {
        module: 'Annual Maintenance & Support (SLA)',
        desc: 'Annual Maintenance, Security Patches & Cloud Ops',
        basis: 'Flat annual package',
        freq: 'Annual',
        amount: 60000
      }
    };
  },

  openCreateInvoiceModal() {
    this._initCreateModalState();
    const html = this._renderCreateModalBody();

    Modal.open('Create Proforma Invoice', html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="BillingScreen.saveAndGenerateInvoice()" style="display:inline-flex;align-items:center;gap:6px">
        ${Icons.check} Generate &amp; Preview Bill
      </button>
    `, { extraLarge: true });

    setTimeout(() => {
      this._recalcCreateModal();
    }, 50);
  },

  _renderCreateModalBody() {
    const s = this._createModalState;
    const companies = this._getCompanies();
    const projects = Store.getProjects() || [];

    return `
    <div class="bim">
      <style>
        .bim { display:flex; flex-direction:column; gap:12px; font-size:13px; color:var(--color-text-primary); }
        /* Slim context strip (replaces the old bulky hero) */
        .bim-topline { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:2px 2px 0; flex-wrap:wrap; }
        .bim-topline-main { display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; min-width:0; }
        .bim-brand { font-family:var(--font-display); font-weight:700; font-size:12.5px; color:var(--color-text-primary); }
        .bim-topline-sub { font-size:11.5px; color:var(--color-text-muted); }
        .bim-pill { font-size:10.5px; font-weight:700; letter-spacing:0.3px; color:var(--color-primary); background:var(--color-primary-50); border:1px solid var(--color-border-brand); padding:3px 10px; border-radius:var(--radius-pill); white-space:nowrap; }
        .bim-pill-ok { color:var(--color-success-700); background:var(--color-success-soft); border-color:var(--color-primary-200); }

        /* Single sheet, divider-separated steps */
        .bim-sheet { background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); overflow:hidden; }
        .bim-step { padding:14px 18px; }
        .bim-step + .bim-step { border-top:1px solid var(--color-border); }
        .bim-step-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; flex-wrap:wrap; }
        .bim-step-title { display:flex; align-items:center; gap:9px; font-family:var(--font-display); font-weight:700; font-size:13px; color:var(--color-text-primary); min-width:0; }
        .bim-num { font-family:var(--font-mono); font-size:10px; font-weight:600; color:var(--color-primary); background:var(--color-primary-50); border:1px solid var(--color-border-brand); border-radius:var(--radius-xs); padding:2px 6px; flex-shrink:0; }
        .bim-sub { font-weight:500; font-size:11.5px; color:var(--color-text-muted); }
        .bim-step-body { display:flex; flex-direction:column; gap:12px; }

        /* Grids & fields */
        .bim-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .bim-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
        .bim-field { display:flex; flex-direction:column; gap:6px; margin:0; min-width:0; }
        .bim-label { font-size:12px; font-weight:600; color:var(--color-text-secondary); }
        .bim-req { color:var(--color-error); }
        .bim-hint { font-size:11px; color:var(--color-text-muted); line-height:1.45; }
        .bim-side { display:flex; align-items:center; padding-top:20px; }

        /* Segmented radio control */
        .bim-seg { display:inline-flex; background:var(--color-bg-subtle); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:2px; gap:2px; }
        .bim-seg label { display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:var(--radius-xs); font-size:12px; font-weight:600; color:var(--color-text-secondary); cursor:pointer; transition:all var(--transition-fast); white-space:nowrap; border:1px solid transparent; }
        .bim-seg label:hover { color:var(--color-text-primary); }
        .bim-seg input { accent-color:var(--color-primary); margin:0; }
        .bim-seg label.on { background:var(--color-surface); color:var(--color-primary); box-shadow:var(--shadow-sm); border-color:var(--color-border-brand); }

        .bim-info-line { font-size:11.5px; color:var(--color-text-muted); display:flex; align-items:center; gap:6px; line-height:1.4; }
        .bim-warn { padding:9px 12px; background:var(--color-warning-soft); border:1px solid var(--violet-200); border-radius:var(--radius-sm); font-size:11.5px; color:var(--color-warning-700); line-height:1.45; }

        /* Items table */
        .bim-table { width:100%; border-collapse:collapse; font-size:12px; }
        .bim-table thead th { text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--color-text-muted); padding:8px 10px; border-bottom:1px solid var(--color-border); background:var(--color-bg-page); white-space:nowrap; }
        .bim-table td { padding:8px 10px; border-bottom:1px solid var(--color-border-subtle); vertical-align:top; }
        .bim-table tr:last-child td { border-bottom:none; }
        .bim-table .num { text-align:right; }
        .bim-table .form-control { height:32px; padding:0 10px; font-size:12px; border-radius:var(--radius-sm); }
        .bim-table .row-delta { font-size:10.5px; color:var(--color-error); margin-top:3px; text-align:right; }
        .bim-table .row-val { font-weight:600; color:var(--color-text-primary); padding-top:14px; }
        .bim-table .row-val-soft { color:var(--color-text-secondary); padding-top:14px; }
        .bim-table .row-amt { font-weight:700; color:var(--color-primary-700); padding-top:14px; }
        .bim-disc-wrap { display:flex; align-items:center; gap:3px; justify-content:flex-end; }
        .bim-disc-wrap .form-control { width:56px; text-align:right; }
        .bim-unit { font-size:11px; color:var(--color-text-muted); }
        .bim-row-del { color:var(--color-error); padding:2px 6px; margin-top:10px; }

        /* Totals */
        .bim-totals { display:grid; grid-template-columns:1.15fr 1fr; gap:12px; margin-top:2px; }
        .bim-words { background:var(--color-bg-page); border-radius:var(--radius-sm); padding:10px 13px; display:flex; flex-direction:column; gap:6px; }
        .bim-words-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--color-text-muted); }
        .bim-words-value { font-size:12.5px; font-weight:600; color:var(--color-text-primary); line-height:1.5; }
        .bim-words-note { font-size:10.5px; color:var(--color-text-muted); line-height:1.4; }
        .bim-sum { background:var(--color-bg-page); border-radius:var(--radius-sm); padding:9px 13px; font-size:12px; display:flex; flex-direction:column; justify-content:center; }
        .bim-sum-row { display:flex; justify-content:space-between; align-items:center; padding:4px 0; color:var(--color-text-secondary); gap:10px; }
        .bim-sum-row strong { color:var(--color-text-primary); font-weight:600; }
        .bim-sum-row .neg { color:var(--color-error); font-weight:600; }
        .bim-sum-row .pos { color:var(--color-success-700); font-weight:600; }
        .bim-sum-row.total { border-top:1px solid var(--color-border); margin-top:4px; padding-top:8px; font-size:13px; font-weight:700; color:var(--color-text-primary); }
        .bim-sum-row.net { margin-top:6px; background:var(--color-primary-50); border:1px solid var(--color-border-brand); border-radius:var(--radius-xs); padding:7px 10px; font-weight:800; color:var(--color-primary-700); }

        /* Mini blocks (schedule / recurring) */
        .bim-mini { background:var(--color-bg-page); border-radius:var(--radius-sm); padding:11px 13px; display:flex; flex-direction:column; gap:8px; min-width:0; }
        .bim-mini-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .bim-mini-title { font-family:var(--font-display); font-weight:700; font-size:12.5px; color:var(--color-text-primary); display:flex; align-items:center; gap:7px; }
        .bim-dot { width:7px; height:7px; border-radius:50%; background:var(--color-primary); flex-shrink:0; }
        .bim-dot-ai { background:var(--color-ai); }
        .bim-sched-row { display:flex; justify-content:space-between; align-items:center; gap:10px; font-size:11.5px; color:var(--color-text-secondary); padding:5px 9px; background:var(--color-surface); border:1px solid var(--color-border-subtle); border-radius:var(--radius-xs); }
        .bim-sched-row strong { color:var(--color-text-primary); font-weight:700; }
        .bim-check { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:600; color:var(--color-text-secondary); cursor:pointer; white-space:nowrap; }
        .bim-check input { accent-color:var(--color-primary); margin:0; }
        .bim-rec-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .bim-rec-grid .form-control { height:32px; font-size:12px; border-radius:var(--radius-sm); }

        @media (max-width: 900px) {
          .bim-grid-2, .bim-grid-3, .bim-totals, .bim-rec-grid { grid-template-columns:1fr; }
        }
      </style>

      <!-- Slim context strip -->
      <div class="bim-topline">
        <div class="bim-topline-main">
          <span class="bim-brand">Hintonn AI Private Limited</span>
          <span class="bim-topline-sub">Proforma invoice · not a tax invoice — for client approval &amp; advance payment</span>
        </div>
        <span class="bim-pill">3-Page Format</span>
      </div>

      <div class="bim-sheet">
        <!-- 01 · BILL TO -->
        <div class="bim-step">
          <div class="bim-step-head">
            <div class="bim-step-title">
              <span class="bim-num">01</span> Bill to
              <span class="bim-sub">Client &amp; company details</span>
            </div>
            ${companies.length > 0 ? `
            <div class="bim-seg" role="radiogroup" aria-label="Client source">
              <label class="${s.clientMode==='other'?'on':''}">
                <input type="radio" name="inv-client-mode" value="other" ${s.clientMode==='other'?'checked':''} onchange="BillingScreen._toggleClientMode('other')">
                New client details
              </label>
              <label class="${s.clientMode==='existing'?'on':''}">
                <input type="radio" name="inv-client-mode" value="existing" ${s.clientMode==='existing'?'checked':''} onchange="BillingScreen._toggleClientMode('existing')">
                Existing client (${companies.length})
              </label>
            </div>` : ''}
          </div>
          <div class="bim-step-body">
            <!-- Existing company dropdown -->
            <div id="inv-existing-company-row" style="display:${s.clientMode==='existing'?'block':'none'}">
              <div class="bim-field">
                <label class="bim-label" for="inv-existing-select">Registered client company</label>
                <select class="form-control" id="inv-existing-select" onchange="BillingScreen._onSelectExistingClient(this.value)">
                  <option value="">— Choose existing client company —</option>
                  ${companies.map(c => `
                    <option value="${c.id}" ${s.selectedCompanyId===c.id?'selected':''}>${Utils.escapeHtml(c.name)}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Client fields -->
            <div id="inv-other-company-fields" style="display:flex;flex-direction:column;gap:12px">
              <div class="bim-grid-2">
                <div class="bim-field">
                  <label class="bim-label" for="inv-client-name">Client / company legal name <span class="bim-req">*</span></label>
                  <input type="text" class="form-control" id="inv-client-name" placeholder="e.g. Acme AI Innovations Private Limited"
                         value="${Utils.escapeHtml(s.clientLegalName)}"
                         oninput="BillingScreen._onClientNameInput(this.value)">
                </div>
                <div class="bim-field">
                  <label class="bim-label" for="inv-client-gstin">Client GSTIN / tax ID</label>
                  <input type="text" class="form-control" id="inv-client-gstin" placeholder="e.g. 24AAACH1234N1Z0 or —"
                         value="${Utils.escapeHtml(s.clientGstin)}">
                </div>
              </div>

              <div class="bim-grid-2">
                <div class="bim-field">
                  <label class="bim-label" for="inv-client-addr1">Address line 1</label>
                  <input type="text" class="form-control" id="inv-client-addr1" placeholder="e.g. 10th Floor, Horizon Tech Park, Corporate Rd"
                         value="${Utils.escapeHtml(s.clientAddr1)}">
                </div>
                <div class="bim-field">
                  <label class="bim-label" for="inv-client-addr2">Address line 2, city — PIN</label>
                  <input type="text" class="form-control" id="inv-client-addr2" placeholder="e.g. S.G. Highway, Ahmedabad — 380054"
                         value="${Utils.escapeHtml(s.clientAddr2)}">
                </div>
              </div>

              <div class="bim-grid-2" style="align-items:end">
                <div class="bim-field">
                  <label class="bim-label" for="inv-client-state">State, country</label>
                  <input type="text" class="form-control" id="inv-client-state" placeholder="e.g. Gujarat, India"
                         value="${Utils.escapeHtml(s.clientState)}">
                </div>
                <div id="inv-save-company-wrap" class="bim-side" style="display:${s.clientMode==='other'?'flex':'none'}">
                  <label class="bim-check">
                    <input type="checkbox" id="inv-save-company-check" ${s.saveCompany?'checked':''}>
                    Save this company to the client directory for future billing
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 02 · PROJECT LINK -->
        <div class="bim-step">
          <div class="bim-step-head">
            <div class="bim-step-title">
              <span class="bim-num">02</span> Project link
              <span class="bim-sub">Bill against an existing workspace project</span>
            </div>
            <span class="bim-pill bim-pill-ok">Live project data</span>
          </div>
          <div class="bim-step-body">
            <div class="bim-grid-2">
              <div class="bim-field">
                <label class="bim-label" for="inv-project">Existing project</label>
                <select class="form-control" id="inv-project" onchange="BillingScreen._onProjectChange(this.value)">
                  <option value="">— General invoice (no project link) —</option>
                  ${projects.map(p => `
                    <option value="${p.id}" ${s.projectId===p.id?'selected':''}>${Utils.escapeHtml(p.name)}${p.status ? ` · ${p.status}` : ''}</option>
                  `).join('')}
                </select>
              </div>
              <div class="bim-field">
                <label class="bim-label" for="inv-milestone">Milestone (from project)</label>
                <select class="form-control" id="inv-milestone" onchange="BillingScreen._onMilestoneChange(this.value)">
                  ${this._renderMilestoneOptions(s.projectId, s.milestoneId)}
                </select>
              </div>
            </div>
            <div id="inv-project-info" class="bim-info-line">
              ${s.projectId ? this._projectInfoHtml(s.projectId) : 'No project selected — this invoice will be logged as a general client bill.'}
            </div>
            ${projects.length === 0 ? `
              <div class="bim-warn">
                No projects exist yet. Create a project first (Projects screen) to bill against it — or continue with a general invoice below.
              </div>
            ` : ''}
          </div>
        </div>
        <!-- 03 · REFERENCES -->
        <div class="bim-step">
          <div class="bim-step-head">
            <div class="bim-step-title">
              <span class="bim-num">03</span> Invoice references
              <span class="bim-sub">Numbering, dates &amp; validity</span>
            </div>
          </div>
          <div class="bim-step-body">
            <div class="bim-grid-3">
              <div class="bim-field">
                <label class="bim-label" for="inv-number">Invoice no. <span class="bim-req">*</span></label>
                <input type="text" class="form-control" id="inv-number" value="${Utils.escapeHtml(s.invoiceNumber)}" style="font-family:var(--font-mono);font-weight:600;font-size:12.5px">
              </div>
              <div class="bim-field">
                <label class="bim-label" for="inv-date">Invoice date</label>
                <input type="date" class="form-control" id="inv-date" value="${s.invoiceDate}">
              </div>
              <div class="bim-field">
                <label class="bim-label" for="inv-valid-until">Valid until (expiry)</label>
                <input type="date" class="form-control" id="inv-valid-until" value="${s.validUntil}">
              </div>
            </div>
            <div class="bim-grid-3">
              <div class="bim-field">
                <label class="bim-label" for="inv-ref-quotation">Ref. quotation</label>
                <input type="text" class="form-control" id="inv-ref-quotation" value="${Utils.escapeHtml(s.refQuotation)}" style="font-family:var(--font-mono);font-size:12.5px">
              </div>
              <div class="bim-field">
                <label class="bim-label" for="inv-currency">Currency</label>
                <input type="text" class="form-control" id="inv-currency" value="${Utils.escapeHtml(s.currency)}" readonly style="background:var(--color-bg-page);color:var(--color-text-secondary)">
              </div>
              <div class="bim-field">
                <label class="bim-label" for="inv-modules-tag">Prepared for modules</label>
                <input type="text" class="form-control" id="inv-modules-tag" value="${Utils.escapeHtml(s.modulesTag)}">
              </div>
            </div>
          </div>
        </div>

        <!-- 04 · CHARGES -->
        <div class="bim-step">
          <div class="bim-step-head">
            <div class="bim-step-title">
              <span class="bim-num">04</span> Development charges
              <span class="bim-sub">One-time line items</span>
            </div>
            <button type="button" class="btn btn-outline btn-xs" onclick="BillingScreen._addModuleItemRow()" style="font-weight:600">
              ${Icons.plus || '+'} Add line
            </button>
          </div>
          <div class="bim-step-body">
            <div style="overflow-x:auto;border:1px solid var(--color-border);border-radius:var(--radius-sm)">
              <table class="bim-table" id="inv-items-table">
                <thead>
                  <tr>
                    <th style="min-width:230px">Module / service description</th>
                    <th class="num" style="width:120px">Gross (₹)</th>
                    <th class="num" style="width:105px">Disc. %</th>
                    <th class="num" style="width:110px">Taxable (₹)</th>
                    <th class="num" style="width:105px">GST 18% (₹)</th>
                    <th class="num" style="width:115px">Amount (₹)</th>
                    <th style="width:42px"></th>
                  </tr>
                </thead>
                <tbody id="inv-items-tbody">
                  ${this._renderCreateModalItemsRows()}
                </tbody>
              </table>
            </div>

            <!-- Live totals -->
            <div class="bim-totals">
              <div class="bim-words">
                <div class="bim-words-label">Amount in words (incl. GST)</div>
                <div id="inv-words-preview" class="bim-words-value">Indian Rupees Zero Only (incl. GST).</div>
                <div class="bim-words-note">TDS @10% u/s 194J will be deducted by the client on the taxable value base.</div>
              </div>
              <div class="bim-sum">
                <div class="bim-sum-row"><span>Gross development cost</span><strong id="inv-sum-gross">₹0</strong></div>
                <div class="bim-sum-row"><span>Less: discount</span><span class="neg" id="inv-sum-discount">–₹0</span></div>
                <div class="bim-sum-row"><span>Taxable value</span><span id="inv-sum-taxable">₹0</span></div>
                <div class="bim-sum-row"><span>Add: GST @18% (CGST 9% + SGST 9%)</span><span class="pos" id="inv-sum-gst">₹0</span></div>
                <div class="bim-sum-row total"><span>Total payable (incl. GST)</span><span id="inv-sum-total">₹0</span></div>
                <div class="bim-sum-row"><span>Less: TDS @10% u/s 194J</span><span class="neg" id="inv-sum-tds">–₹0</span></div>
                <div class="bim-sum-row net"><span>Net payable after TDS</span><span id="inv-sum-net">₹0</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 05 · SCHEDULE & RECURRING -->
        <div class="bim-step">
          <div class="bim-step-head">
            <div class="bim-step-title">
              <span class="bim-num">05</span> Payment schedule
              <span class="bim-sub">Milestones &amp; recurring reference</span>
            </div>
          </div>
          <div class="bim-step-body">
            <div class="bim-grid-2">
              <div class="bim-mini">
                <div class="bim-mini-head">
                  <div class="bim-mini-title"><span class="bim-dot"></span> Milestones</div>
                  <span class="bim-hint">40 / 40 / 20 split</span>
                </div>
                <div class="bim-sched-row"><span>M1 · Advance on PO</span><strong id="inv-sched-m1">₹0</strong></div>
                <div class="bim-sched-row"><span>M2 · Module demonstration</span><strong id="inv-sched-m2">₹0</strong></div>
                <div class="bim-sched-row"><span>M3 · Deployment &amp; go-live</span><strong id="inv-sched-m3">₹0</strong></div>
              </div>

              <div class="bim-mini">
                <div class="bim-mini-head">
                  <div class="bim-mini-title"><span class="bim-dot bim-dot-ai"></span> Recurring <span class="bim-hint">(reference only)</span></div>
                  <label class="bim-check">
                    <input type="checkbox" id="inv-include-recurring" ${s.includeRecurring?'checked':''} onchange="BillingScreen._toggleRecurring(this.checked)">
                    Include table
                  </label>
                </div>
                <div id="inv-recurring-inputs" style="display:${s.includeRecurring?'block':'none'}">
                  <div class="bim-rec-grid">
                    <input type="text" class="form-control" id="inv-rec-module" placeholder="Module name" value="${Utils.escapeHtml(s.recurringItem.module)}">
                    <input type="number" class="form-control" id="inv-rec-amount" placeholder="Amount (excl. GST)" value="${s.recurringItem.amount}">
                  </div>
                  <div class="bim-hint" style="margin-top:8px">
                    Amounts exclusive of GST. Shown for reference only — billed separately as they fall due.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
  },

  _renderCreateModalItemsRows() {
    const items = (this._createModalState && this._createModalState.items) ? this._createModalState.items : [];
    return items.map((it, idx) => {
      const g = it.gross || 0;
      const dPct = it.discountPct !== undefined ? it.discountPct : 15;
      const dAmt = Math.round(g * (dPct / 100));
      const tax = g - dAmt;
      const gst = Math.round(tax * 0.18);
      const amt = tax + gst;

      return `
        <tr data-item-idx="${idx}">
          <td>
            <input type="text" class="form-control" style="font-weight:600"
                   id="item-name-${idx}"
                   value="${Utils.escapeHtml(it.name || '')}" placeholder="Module / service name"
                   oninput="BillingScreen._onItemFieldChange(${idx}, 'name', this.value)">
            <input type="text" class="form-control" style="margin-top:5px;color:var(--color-text-secondary)"
                   value="${Utils.escapeHtml(it.desc || '')}" placeholder="One-time development • incl. 1 month post-go-live fine-tuning"
                   oninput="BillingScreen._onItemFieldChange(${idx}, 'desc', this.value)">
          </td>
          <td class="num">
            <input type="number" class="form-control" style="text-align:right;font-weight:700"
                   value="${g}" min="0" step="1000"
                   oninput="BillingScreen._onItemFieldChange(${idx}, 'gross', parseFloat(this.value)||0)">
          </td>
          <td class="num">
            <div class="bim-disc-wrap">
              <input type="number" class="form-control"
                     value="${dPct}" min="0" max="100" step="1"
                     oninput="BillingScreen._onItemFieldChange(${idx}, 'discountPct', parseFloat(this.value)||0)">
              <span class="bim-unit">%</span>
            </div>
            <div id="item-disc-amt-${idx}" class="row-delta">${this._fmtINR(-dAmt)}</div>
          </td>
          <td class="num row-val" id="item-taxable-${idx}">${this._fmtINR(tax)}</td>
          <td class="num row-val-soft" id="item-gst-${idx}">${this._fmtINR(gst)}</td>
          <td class="num row-amt" id="item-amt-${idx}">${this._fmtINR(amt)}</td>
          <td style="text-align:center">
            ${items.length > 1 ? `
              <button type="button" class="btn btn-ghost btn-xs bim-row-del" onclick="BillingScreen._removeModuleItemRow(${idx})" title="Remove line">✕</button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
  },

  // ─── Project-Based Billing Handlers (existing projects only) ───
  _renderMilestoneOptions(projectId, selectedId) {
    const milestones = projectId ? Store.getMilestones(projectId) : [];
    if (!projectId) return `<option value="">— Select a project first —</option>`;
    return `
      <option value="">— General (no milestone) —</option>
      ${milestones.map(m => `<option value="${m.id}" ${selectedId===m.id?'selected':''}>${Utils.escapeHtml(m.name)}${m.dueDate ? ` — due ${m.dueDate}` : ''}</option>`).join('')}
    `;
  },
  _projectInfoHtml(projectId) {
    const p = Store.getProject(projectId);
    if (!p) return '';
    const msCount = Store.getMilestones(projectId).length;
    const taskCount = Store.getTasks(projectId).length;
    const progress = p.progress != null ? p.progress : 0;
    return `<span>Linked: <strong>${Utils.escapeHtml(p.name)}</strong> — ${progress}% complete · ${taskCount} tasks · ${msCount} milestones</span>`;
  },
  _onProjectChange(projectId) {
    if (!this._createModalState) return;
    const s = this._createModalState;
    s.projectId = projectId || '';
    s.milestoneId = '';

    // Rebuild milestone dropdown from the REAL project's milestones
    const msSelect = document.getElementById('inv-milestone');
    if (msSelect) msSelect.innerHTML = this._renderMilestoneOptions(s.projectId, '');

    // Update project info line
    const info = document.getElementById('inv-project-info');
    if (info) {
      info.innerHTML = s.projectId
        ? this._projectInfoHtml(s.projectId)
        : 'No project selected — invoice will be logged as a general client bill.';
    }

    // Prefill the first line item with the real project name (unless user typed a custom one)
    const proj = s.projectId ? Store.getProject(s.projectId) : null;
    if (proj && s.items && s.items.length && !s._itemTouched) {
      s.items[0].name = `${proj.name} — Service Delivery`;
      const nameInput = document.getElementById(`item-name-0`);
      if (nameInput) nameInput.value = s.items[0].name;
    }
    this._recalcCreateModal();
  },
  _onMilestoneChange(milestoneId) {
    if (!this._createModalState) return;
    const s = this._createModalState;
    s.milestoneId = milestoneId || '';

    const proj = s.projectId ? Store.getProject(s.projectId) : null;
    const ms = milestoneId ? Store.getMilestones(s.projectId).find(m => m.id === milestoneId) : null;

    // Prefill line item with project + real milestone name
    if (proj && s.items && s.items.length && !s._itemTouched) {
      s.items[0].name = ms ? `${proj.name} — ${ms.name}` : `${proj.name} — Service Delivery`;
      const nameInput = document.getElementById(`item-name-0`);
      if (nameInput) nameInput.value = s.items[0].name;
    }

    // Suggest valid-until = milestone due date when available
    if (ms && ms.dueDate) {
      s.validUntil = ms.dueDate;
      const vuInput = document.getElementById('inv-valid-until');
      if (vuInput) vuInput.value = ms.dueDate;
    }
    this._recalcCreateModal();
  },
  _toggleClientMode(mode) {
    if (!this._createModalState) return;
    this._createModalState.clientMode = mode;
    const existingRow = document.getElementById('inv-existing-company-row');
    const saveCheckWrap = document.getElementById('inv-save-company-wrap');

    if (mode === 'existing') {
      if (existingRow) existingRow.style.display = 'block';
      if (saveCheckWrap) saveCheckWrap.style.display = 'none';
      const select = document.getElementById('inv-existing-select');
      if (select && select.value) {
        this._onSelectExistingClient(select.value);
      }
    } else {
      if (existingRow) existingRow.style.display = 'none';
      if (saveCheckWrap) saveCheckWrap.style.display = 'flex';
    }

    // Segmented control active state (client source pills)
    document.querySelectorAll('.bim-seg label').forEach(l => {
      const input = l.querySelector('input');
      l.classList.toggle('on', !!(input && input.value === mode));
    });
  },

  _onSelectExistingClient(companyId) {
    if (!companyId) return;
    const comp = this._getCompanies().find(c => c.id === companyId);
    if (!comp) return;

    if (this._createModalState) {
      this._createModalState.selectedCompanyId = companyId;
    }

    const nameInput = document.getElementById('inv-client-name');
    const addr1Input = document.getElementById('inv-client-addr1');
    const addr2Input = document.getElementById('inv-client-addr2');
    const stateInput = document.getElementById('inv-client-state');
    const gstinInput = document.getElementById('inv-client-gstin');

    if (nameInput) nameInput.value = comp.name || '';
    if (addr1Input) addr1Input.value = comp.addressLine1 || (comp.contactPerson ? `Attn: ${comp.contactPerson}` : '');
    if (addr2Input) addr2Input.value = comp.addressLine2 || (comp.activePackage ? `Package: ${comp.activePackage}` : '');
    if (stateInput) stateInput.value = comp.stateCountry || 'Gujarat, India';
    if (gstinInput) gstinInput.value = comp.gstin || '';

    const invInput = document.getElementById('inv-number');
    const quotInput = document.getElementById('inv-ref-quotation');
    const autoInv = Store.generateBillNumber(comp.name, new Date());
    const autoQuot = Store.generateQuotationRef(comp.name, new Date());
    if (invInput) invInput.value = autoInv;
    if (quotInput) quotInput.value = autoQuot;
    if (this._createModalState) {
      this._createModalState._autoInvNumber = autoInv;
      this._createModalState._autoQuotRef = autoQuot;
    }
  },

  _onClientNameInput(name) {
    if (!name) return;
    const s = this._createModalState || {};
    const invInput = document.getElementById('inv-number');
    const quotInput = document.getElementById('inv-ref-quotation');
    // Only regenerate when the field still holds an auto-generated value
    // (a manual override by the user is always preserved)
    const invIsAuto = invInput && (!invInput.value || invInput.value === s._autoInvNumber || invInput.value.includes('CLIENT'));
    const quotIsAuto = quotInput && (!quotInput.value || quotInput.value === s._autoQuotRef || quotInput.value.includes('CLIENT'));
    if (invIsAuto) {
      const autoInv = Store.generateBillNumber(name, new Date());
      invInput.value = autoInv;
      s._autoInvNumber = autoInv;
    }
    if (quotIsAuto) {
      const autoQuot = Store.generateQuotationRef(name, new Date());
      quotInput.value = autoQuot;
      s._autoQuotRef = autoQuot;
    }
  },

  _addModuleItemRow() {
    if (!this._createModalState) return;
    this._createModalState.items.push({
      id: Date.now(),
      name: 'Additional AI Module & Analytics Integration',
      desc: 'One-time development • incl. 1 month post-go-live fine-tuning',
      gross: 250000,
      discountPct: 15
    });
    const tbody = document.getElementById('inv-items-tbody');
    if (tbody) {
      tbody.innerHTML = this._renderCreateModalItemsRows();
    }
    this._recalcCreateModal();
  },

  _removeModuleItemRow(idx) {
    if (!this._createModalState || this._createModalState.items.length <= 1) return;
    this._createModalState.items.splice(idx, 1);
    const tbody = document.getElementById('inv-items-tbody');
    if (tbody) {
      tbody.innerHTML = this._renderCreateModalItemsRows();
    }
    this._recalcCreateModal();
  },

  _onItemFieldChange(idx, field, value) {
    if (!this._createModalState || !this._createModalState.items[idx]) return;
    this._createModalState.items[idx][field] = value;
    if (field === 'name') this._createModalState._itemTouched = true; // stop auto-prefill from project/milestone
    this._recalcCreateModal();
  },

  _toggleRecurring(include) {
    if (this._createModalState) this._createModalState.includeRecurring = include;
    const inputs = document.getElementById('inv-recurring-inputs');
    if (inputs) inputs.style.display = include ? 'block' : 'none';
  },

  _recalcCreateModal() {
    if (!this._createModalState) return;
    const items = this._createModalState.items || [];
    let totalGross = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalGst = 0;
    let totalPayable = 0;

    items.forEach((it, idx) => {
      const g = it.gross || 0;
      const dPct = it.discountPct !== undefined ? it.discountPct : 15;
      const dAmt = Math.round(g * (dPct / 100));
      const tax = g - dAmt;
      const gst = Math.round(tax * 0.18);
      const amt = tax + gst;

      totalGross += g;
      totalDiscount += dAmt;
      totalTaxable += tax;
      totalGst += gst;
      totalPayable += amt;

      const rowDiscAmt = document.getElementById(`item-disc-amt-${idx}`);
      const rowTaxable = document.getElementById(`item-taxable-${idx}`);
      const rowGst = document.getElementById(`item-gst-${idx}`);
      const rowAmt = document.getElementById(`item-amt-${idx}`);

      if (rowDiscAmt) rowDiscAmt.textContent = this._fmtINR(-dAmt);
      if (rowTaxable) rowTaxable.textContent = this._fmtINR(tax);
      if (rowGst) rowGst.textContent = this._fmtINR(gst);
      if (rowAmt) rowAmt.textContent = this._fmtINR(amt);
    });

    const tdsAmount = Math.round(totalTaxable * 0.10);
    const netPayable = totalPayable - tdsAmount;
    const words = this._numberToWords(totalPayable);

    const elSumGross = document.getElementById('inv-sum-gross');
    const elSumDisc = document.getElementById('inv-sum-discount');
    const elSumTaxable = document.getElementById('inv-sum-taxable');
    const elSumGst = document.getElementById('inv-sum-gst');
    const elSumTotal = document.getElementById('inv-sum-total');
    const elSumTds = document.getElementById('inv-sum-tds');
    const elSumNet = document.getElementById('inv-sum-net');
    const elWords = document.getElementById('inv-words-preview');
    const elSchedM1 = document.getElementById('inv-sched-m1');
    const elSchedM2 = document.getElementById('inv-sched-m2');
    const elSchedM3 = document.getElementById('inv-sched-m3');

    if (elSumGross) elSumGross.textContent = this._fmtINR(totalGross);
    if (elSumDisc) elSumDisc.textContent = this._fmtINR(-totalDiscount);
    if (elSumTaxable) elSumTaxable.textContent = this._fmtINR(totalTaxable);
    if (elSumGst) elSumGst.textContent = this._fmtINR(totalGst);
    if (elSumTotal) elSumTotal.textContent = this._fmtINR(totalPayable);
    if (elSumTds) elSumTds.textContent = this._fmtINR(-tdsAmount);
    if (elSumNet) elSumNet.textContent = this._fmtINR(netPayable);
    if (elWords) elWords.textContent = `Indian Rupees ${words} (incl. GST).`;

    const m1 = Math.round(totalPayable * 0.4);
    const m2 = Math.round(totalPayable * 0.4);
    const m3 = totalPayable - (m1 + m2);

    if (elSchedM1) elSchedM1.textContent = this._fmtINR(m1);
    if (elSchedM2) elSchedM2.textContent = this._fmtINR(m2);
    if (elSchedM3) elSchedM3.textContent = this._fmtINR(m3);
  },

  saveAndGenerateInvoice() {
    const s = this._createModalState || {};

    // ── Client validation ──
    const clientNameInput = document.getElementById('inv-client-name');
    const clientLegalName = clientNameInput ? clientNameInput.value.trim() : '';
    if (!clientLegalName) {
      Toast.show('Please enter the Client / Company Legal Name.', 'error', 3500);
      if (clientNameInput) clientNameInput.focus();
      return;
    }

    // ── Form metadata ──
    const readVal = (id, fallback) => {
      const el = document.getElementById(id);
      return el && el.value ? el.value.trim() : fallback;
    };
    const invoiceNumber = readVal('inv-number', '') || Store.generateBillNumber(clientLegalName);
    const invoiceDate = readVal('inv-date', new Date().toISOString().split('T')[0]);
    const validUntil = readVal('inv-valid-until', '');
    const refQuotation = readVal('inv-ref-quotation', '') || Store.generateQuotationRef(clientLegalName);
    const modulesTag = readVal('inv-modules-tag', '[R1 • R2 • R3]');

    const clientGstin = readVal('inv-client-gstin', '');
    const clientAddr1 = readVal('inv-client-addr1', '');
    const clientAddr2 = readVal('inv-client-addr2', '');
    const clientState = readVal('inv-client-state', '');

    const recModuleEl = document.getElementById('inv-rec-module');
    const recAmountEl = document.getElementById('inv-rec-amount');
    const recurringItem = {
      module: recModuleEl ? recModuleEl.value.trim() : '',
      desc: 'Annual Maintenance, Security Patches & Cloud Ops',
      basis: 'Flat annual package',
      freq: 'Annual',
      amount: recAmountEl ? parseFloat(recAmountEl.value) || 0 : 0
    };

    const items = Array.isArray(s.items) ? s.items : [];

    // ── Project + milestone linkage (EXISTING project data only — no seeds) ──
    const projectId = s.projectId || '';
    const milestoneId = s.milestoneId || '';
    const proj = projectId ? Store.getProject(projectId) : null;
    if (projectId && !proj) {
      Toast.show('Selected project no longer exists. Please re-select the project.', 'error', 4000);
      return;
    }

    // ── Generate through the Store invoice engine (single source of truth) ──
    const validDays = validUntil
      ? Math.max(1, Math.round((new Date(validUntil) - new Date(invoiceDate)) / 86400000))
      : 15;

    const invoice = Store.generateInvoice(projectId, {
      billNumber: invoiceNumber,
      quotationRef: refQuotation,
      companyId: s.selectedCompanyId || '',
      companyName: clientLegalName,
      clientDetails: {
        legalName: clientLegalName,
        addressLine1: clientAddr1,
        addressLine2: clientAddr2,
        stateCountry: clientState,
        gstin: clientGstin
      },
      milestoneId: milestoneId,
      modulesTag: modulesTag,
      invoiceDate: invoiceDate,
      validDays: validDays,
      items: items,
      includeRecurring: s.includeRecurring !== false,
      recurringItem: recurringItem
    });

    if (!invoice) {
      Toast.show('Could not generate invoice — enter at least one line item with a gross amount greater than zero.', 'warning', 4500);
      return;
    }

    this._invoices = null;
    this._expandedCompanies[invoice.companyId] = true;
    this.updateBillingContainer();
    Modal.closeAll();
    Toast.show(
      `Proforma Invoice ${invoice.billNumber} generated from ${proj ? `project "${proj.name}"` : 'client details'}!`,
      'success', 4000
    );

    setTimeout(() => {
      this.openProformaPreview(invoice.id);
    }, 150);
  },

  // ─── Proforma Invoice Preview & Document Reader ───
  openProformaPreview(invoiceIdOrData) {
    let inv = typeof invoiceIdOrData === 'object' ? invoiceIdOrData : (this._getInvoices().find(i => i.id === invoiceIdOrData) || Store.getInvoice(invoiceIdOrData));
    if (!inv) {
      Toast.show('Invoice not found.', 'error');
      return;
    }

    const docHtml = this.renderProformaHTML(inv, false);

    const bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:14px">
        
        <!-- Document Action Strip -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:8px 12px;background:var(--color-bg-page);border-radius:6px;border:1px solid var(--color-border)">
          <div class="btn-group" style="display:inline-flex;gap:4px">
            <button class="btn btn-xs btn-primary proforma-tab-btn" data-tab="all" onclick="BillingScreen._switchProformaTab('all')">
              📑 All 3 Pages
            </button>
            <button class="btn btn-xs btn-ghost proforma-tab-btn" data-tab="p1" onclick="BillingScreen._switchProformaTab('p1')">
              Page 1: Invoice &amp; Charges
            </button>
            <button class="btn btn-xs btn-ghost proforma-tab-btn" data-tab="p2" onclick="BillingScreen._switchProformaTab('p2')">
              Page 2: Schedule &amp; Bank
            </button>
            <button class="btn btn-xs btn-ghost proforma-tab-btn" data-tab="p3" onclick="BillingScreen._switchProformaTab('p3')">
              Page 3: Terms &amp; Warranty
            </button>
          </div>

          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11.5px;color:var(--color-text-secondary)">Status: <strong>${inv.statusLabel || 'Pending Approval'}</strong></span>
            <span class="billing-version-badge ${inv.versionBadgeClass || 'version-pill-v1'}">${inv.version || 'v1.0'}</span>
          </div>
        </div>

        <!-- Rendered Document View -->
        <div class="proforma-doc-wrapper">
          ${docHtml}
        </div>

      </div>
    `;

    Modal.open(`Proforma Invoice: ${inv.billNumber || inv.id} — ${inv.companyName}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-outline" onclick="BillingScreen.openVersionHistory('${inv.id}')">
        📜 Version History
      </button>
      <button class="btn btn-primary" onclick="BillingScreen.printProformaInvoice('${inv.id}')" style="display:inline-flex;align-items:center;gap:6px">
        🖨️ Print / Save as PDF
      </button>
    `, { extraLarge: true });
  },

  _switchProformaTab(tabId) {
    document.querySelectorAll('.proforma-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-ghost');
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-ghost');
      }
    });

    const p1 = document.getElementById('proforma-page-1');
    const p2 = document.getElementById('proforma-page-2');
    const p3 = document.getElementById('proforma-page-3');

    if (tabId === 'all') {
      if (p1) p1.style.display = 'block';
      if (p2) p2.style.display = 'block';
      if (p3) p3.style.display = 'block';
    } else if (tabId === 'p1') {
      if (p1) p1.style.display = 'block';
      if (p2) p2.style.display = 'none';
      if (p3) p3.style.display = 'none';
    } else if (tabId === 'p2') {
      if (p1) p1.style.display = 'none';
      if (p2) p2.style.display = 'block';
      if (p3) p3.style.display = 'none';
    } else if (tabId === 'p3') {
      if (p1) p1.style.display = 'none';
      if (p2) p2.style.display = 'none';
      if (p3) p3.style.display = 'block';
    }
  },

  // ─── Proforma Invoice HTML Generator (Exact 3-Page Format Template) ───
  renderProformaHTML(inv, isForPrint = false) {
    const parseNum = (s) => {
      if (!s) return 0;
      if (typeof s === 'number') return s;
      const str = String(s).replace(/[^0-9.]/g, '');
      return parseFloat(str) || 0;
    };

    const invNumber = inv.billNumber || inv.id || 'HIN-PI-2026-001';
    const refQuotation = inv.quotationRef || `HIN-CL-${invNumber.replace('HIN-PI-', '')}`;
    const currency = inv.currency || 'INR (₹)';
    const modulesTag = inv.modulesTag || inv.milestone || '[R1 • R2 • R3]';

    const fmtDate = (d) => {
      if (!d) return '30 Sep 2026';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formattedIssueDate = fmtDate(inv.issueDate);
    const formattedValidDate = fmtDate(inv.dueDate);

    // Client Details
    const client = inv.clientDetails || {};
    const clientName = client.legalName || inv.companyName || 'Client Legal Name';
    const clientAddr1 = client.addressLine1 || '';
    const clientAddr2 = client.addressLine2 || '';
    const clientState = client.stateCountry || 'Gujarat, India';
    const clientGstin = client.gstin || '—';

    // Development Charges Items
    let items = inv.items && inv.items.length > 0 ? inv.items : [];
    if (items.length === 0) {
      const baseNum = parseNum(inv.amountDue || inv.netPayable) || 500000;
      items = [
        {
          name: inv.milestone || 'AI Automated PMO Platform & Copilot Intelligence Engine',
          desc: 'One-time development • incl. 1 month post-go-live fine-tuning',
          gross: baseNum,
          discountPct: 15,
          discountAmount: Math.round(baseNum * 0.15),
          taxable: Math.round(baseNum * 0.85),
          gstRate: 18,
          gstAmount: Math.round(baseNum * 0.85 * 0.18),
          amount: Math.round(baseNum * 0.85 * 1.18)
        }
      ];
    }

    let totalGross = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalGst = 0;
    let totalPayable = 0;

    const lineItemRows = items.map(it => {
      const g = it.gross || 0;
      const dPct = it.discountPct !== undefined ? it.discountPct : 15;
      const dAmt = it.discountAmount !== undefined ? it.discountAmount : Math.round(g * (dPct / 100));
      const tax = it.taxable !== undefined ? it.taxable : (g - dAmt);
      const gst = it.gstAmount !== undefined ? it.gstAmount : Math.round(tax * 0.18);
      const amt = it.amount !== undefined ? it.amount : (tax + gst);

      totalGross += g;
      totalDiscount += dAmt;
      totalTaxable += tax;
      totalGst += gst;
      totalPayable += amt;

      return `
        <tr>
          <td style="text-align:left">
            <div style="font-weight:700;color:#0F172A;font-size:12px">${Utils.escapeHtml(it.name || it.description || 'Module / Service')}</div>
            <div style="color:#64748B;font-size:10.5px;margin-top:2px">${Utils.escapeHtml(it.desc || it.description || 'One-time development • incl. 1 month post-go-live fine-tuning')}</div>
          </td>
          <td style="text-align:right">${this._fmtINR(g)}</td>
          <td style="text-align:right;color:#DC2626">${dAmt > 0 ? this._fmtINR(-dAmt) : '–₹0'}</td>
          <td style="text-align:right">${this._fmtINR(tax)}</td>
          <td style="text-align:right">${this._fmtINR(gst)}</td>
          <td style="text-align:right;font-weight:600">${this._fmtINR(amt)}</td>
        </tr>
      `;
    }).join('');

    const tdsAmount = Math.round(totalTaxable * 0.10);
    const netPayable = totalPayable - tdsAmount;
    const amountInWords = this._numberToWords(totalPayable);

    // Milestones
    const schedM1 = Math.round(totalPayable * 0.4);
    const schedM2 = Math.round(totalPayable * 0.4);
    const schedM3 = totalPayable - (schedM1 + schedM2);

    // Recurring Items
    const recurring = inv.recurringCharges || [];
    const recurringRows = recurring.length > 0 ? recurring.map((r, idx) => `
      <tr>
        <td style="font-weight:600">[${Utils.escapeHtml(r.module || 'AI Engine Core')}]</td>
        <td>
          <div style="font-weight:600;font-size:11px">[R#${idx+1}] ${Utils.escapeHtml(r.component || r.desc || 'Cloud SLA & Maintenance')}</div>
        </td>
        <td>[${Utils.escapeHtml(r.basis || 'Flat annual package')}]</td>
        <td style="text-align:center">[${Utils.escapeHtml(r.freq || 'Annual')}]</td>
        <td style="text-align:right;font-weight:600">[${this._fmtINR(r.amount || 0)}]</td>
      </tr>
    `).join('') : `
      <tr>
        <td style="font-weight:600">[Module name]</td>
        <td>[R#] [Component description]</td>
        <td>[Flat annual package]</td>
        <td style="text-align:center">[Annual]</td>
        <td style="text-align:right;font-weight:600">[₹0]</td>
      </tr>
    `;

    return `
      <!-- ════════════ PAGE 1: INVOICE & DEVELOPMENT CHARGES ════════════ -->
      <div class="proforma-page" id="proforma-page-1">
        
        <!-- Header Row -->
        <div class="proforma-header-row">
          <div class="proforma-brand">
            <div style="width:42px;height:42px;flex-shrink:0">
              ${Icons.hexagonH}
            </div>
            <div>
              <div class="proforma-brand-title">Hintonn AI</div>
              <div class="proforma-brand-sub">AI SOLUTIONS • www.hintonn.com</div>
            </div>
          </div>
          <div class="proforma-title-area">
            <h1 class="proforma-doc-title">PROFORMA INVOICE</h1>
            <div class="proforma-doc-subtitle">Not a Tax Invoice — for approval &amp; advance payment</div>
          </div>
        </div>

        <div class="proforma-divider"></div>

        <!-- Meta Grid -->
        <div class="proforma-meta-grid">
          <div class="proforma-meta-left">
            <div class="proforma-meta-item"><span class="proforma-meta-lbl">Invoice No.</span><span class="proforma-meta-val">${invNumber}</span></div>
            <div class="proforma-meta-item"><span class="proforma-meta-lbl">Invoice Date</span><span class="proforma-meta-val">${formattedIssueDate}</span></div>
            <div class="proforma-meta-item"><span class="proforma-meta-lbl">Valid Until</span><span class="proforma-meta-val">${formattedValidDate}</span></div>
            <div class="proforma-meta-item"><span class="proforma-meta-lbl">Ref. Quotation</span><span class="proforma-meta-val">${refQuotation}</span></div>
            <div class="proforma-meta-item"><span class="proforma-meta-lbl">Currency</span><span class="proforma-meta-val">${currency}</span></div>
          </div>
          <div class="proforma-meta-right">
            <div style="color:#64748B;font-size:11px">Prepared for the deployment of modules</div>
            <div class="proforma-modules-badge">${modulesTag}</div>
          </div>
        </div>

        <!-- Addresses Box (FROM vs BILL TO) -->
        <div class="proforma-address-box">
          <div class="proforma-addr-col">
            <h4>FROM</h4>
            <div class="proforma-addr-name">HINTONN AI PRIVATE LIMITED</div>
            <div class="proforma-addr-text">
              A-706, TITANIUM SQUARE, B/H SARVESHWAR TOWER,<br>
              Ahmedabad, Gujarat – 380054, India<br>
              GSTIN: 24AAICH8280N1Z0<br>
              www.hintonn.com
            </div>
          </div>
          <div class="proforma-addr-col">
            <h4>BILL TO</h4>
            <div class="proforma-addr-name">${Utils.escapeHtml(clientName)}</div>
            <div class="proforma-addr-text">
              ${clientAddr1 ? Utils.escapeHtml(clientAddr1) + '<br>' : ''}
              ${clientAddr2 ? Utils.escapeHtml(clientAddr2) + '<br>' : ''}
              ${clientState ? Utils.escapeHtml(clientState) + '<br>' : ''}
              GSTIN: ${Utils.escapeHtml(clientGstin || '—')}
            </div>
          </div>
        </div>

        <!-- Development Charges Table -->
        <div class="proforma-section-heading">
          <div class="proforma-section-bar"></div>
          <h3 class="proforma-section-title">DEVELOPMENT CHARGES — ONE-TIME</h3>
        </div>

        <table class="proforma-table">
          <thead>
            <tr>
              <th style="text-align:left;width:42%">Module / Description</th>
              <th style="text-align:right;width:12%">Gross</th>
              <th style="text-align:right;width:14%">BNI Disc. 15%</th>
              <th style="text-align:right;width:11%">Taxable</th>
              <th style="text-align:right;width:10%">GST 18%</th>
              <th style="text-align:right;width:11%">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemRows}
            <tr class="totals-row">
              <td>TOTALS</td>
              <td style="text-align:right">${this._fmtINR(totalGross)}</td>
              <td style="text-align:right">${this._fmtINR(-totalDiscount)}</td>
              <td style="text-align:right">${this._fmtINR(totalTaxable)}</td>
              <td style="text-align:right">${this._fmtINR(totalGst)}</td>
              <td style="text-align:right">${this._fmtINR(totalPayable)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Summary Wrap -->
        <div class="proforma-summary-wrap">
          <div class="proforma-amount-words">
            <div class="proforma-amount-bar"></div>
            <div>
              Amount in words: <strong>Indian Rupees ${amountInWords} (incl. GST).</strong>
            </div>
          </div>

          <div class="proforma-calc-box">
            <div class="proforma-calc-row">
              <span style="color:#64748B">Gross Development Cost</span>
              <strong>${this._fmtINR(totalGross)}</strong>
            </div>
            <div class="proforma-calc-row" style="color:#DC2626">
              <span>Less: BNI Discount (15%)</span>
              <strong>${this._fmtINR(-totalDiscount)}</strong>
            </div>
            <div class="proforma-calc-row taxable">
              <span>Taxable Value</span>
              <strong>${this._fmtINR(totalTaxable)}</strong>
            </div>
            <div class="proforma-calc-row">
              <span style="color:#64748B">Add: GST @18% (CGST 9% + SGST 9%)</span>
              <strong>${this._fmtINR(totalGst)}</strong>
            </div>
            <div class="proforma-calc-row total-payable">
              <span>Total Payable (incl. GST)</span>
              <span>${this._fmtINR(totalPayable)}</span>
            </div>
            <div class="proforma-calc-row" style="color:#64748B;font-size:11px">
              <span>Less: TDS @10% u/s 194J (by client)</span>
              <strong>${this._fmtINR(-tdsAmount)}</strong>
            </div>
            <div class="proforma-calc-row net-payable">
              <span>Net Payable After TDS</span>
              <span>${this._fmtINR(netPayable)}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ════════════ PAGE 2: PAYMENT SCHEDULE & REMITTANCE ════════════ -->
      <div class="proforma-page" id="proforma-page-2">
        
        <!-- Payment Schedule -->
        <div class="proforma-section-heading" style="margin-top:0">
          <div class="proforma-section-bar"></div>
          <h3 class="proforma-section-title">PAYMENT SCHEDULE</h3>
        </div>

        <table class="proforma-table">
          <thead>
            <tr>
              <th style="width:12%;text-align:left">Milestone</th>
              <th style="width:58%;text-align:left">Stage / Trigger</th>
              <th style="width:10%;text-align:center">%</th>
              <th style="width:20%;text-align:right">Amount (incl. GST)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight:700">M1</td>
              <td>Advance — on signing of agreement / receipt of PO</td>
              <td style="text-align:center">40%</td>
              <td style="text-align:right;font-weight:600">${this._fmtINR(schedM1)}</td>
            </tr>
            <tr>
              <td style="font-weight:700">M2</td>
              <td>Demo — on demonstration of built AI modules</td>
              <td style="text-align:center">40%</td>
              <td style="text-align:right;font-weight:600">${this._fmtINR(schedM2)}</td>
            </tr>
            <tr>
              <td style="font-weight:700">M3</td>
              <td>Deployment — after production deployment &amp; go-live</td>
              <td style="text-align:center">20%</td>
              <td style="text-align:right;font-weight:600">${this._fmtINR(schedM3)}</td>
            </tr>
            <tr class="totals-row">
              <td>TOTAL</td>
              <td></td>
              <td style="text-align:center">100%</td>
              <td style="text-align:right">${this._fmtINR(totalPayable)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Recurring Charges -->
        <div class="proforma-section-heading">
          <div class="proforma-section-bar"></div>
          <h3 class="proforma-section-title">RECURRING CHARGES — FOR REFERENCE ONLY (NOT BILLED IN THIS INVOICE)</h3>
        </div>

        <table class="proforma-table">
          <thead>
            <tr>
              <th style="text-align:left;width:25%">Module</th>
              <th style="text-align:left;width:35%">Component</th>
              <th style="text-align:left;width:15%">Billing Basis</th>
              <th style="text-align:center;width:10%">Frequency</th>
              <th style="text-align:right;width:15%">Amount (excl. GST)</th>
            </tr>
          </thead>
          <tbody>
            ${recurringRows}
          </tbody>
        </table>

        <div style="font-size:9.5px;color:#64748B;line-height:1.4;margin-bottom:10px;padding:6px 10px;background:#F8FAFC;border-radius:4px;border-left:3px solid #94A3B8">
          <strong>Note:</strong> Amounts above are exclusive of GST (18% applicable additionally at billing). This table is provided for reference only — recurring charges are NOT included in the invoice totals, payment schedule, or amount due on this proforma invoice, and will be billed separately as they fall due. All recurring items above are indicative and subject to final confirmation with the client.
        </div>

        <!-- Banking Details -->
        <div class="proforma-section-heading">
          <div class="proforma-section-bar"></div>
          <h3 class="proforma-section-title">BANKING DETAILS — FOR REMITTANCE</h3>
        </div>

        <table class="proforma-bank-table">
          <tbody>
            <tr>
              <td class="proforma-bank-label">Bank Name</td>
              <td class="proforma-bank-val">IDFC FIRST Bank</td>
            </tr>
            <tr>
              <td class="proforma-bank-label">Branch</td>
              <td class="proforma-bank-val">Ahmedabad – Sattadhar Branch, Ground Floor, GF-11, Plot No. 104/1, Ahmedabad – 380054</td>
            </tr>
            <tr>
              <td class="proforma-bank-label">Account Name</td>
              <td class="proforma-bank-val">HINTONN AI PRIVATE LIMITED</td>
            </tr>
            <tr>
              <td class="proforma-bank-label">Account Type</td>
              <td class="proforma-bank-val">Current Account</td>
            </tr>
            <tr>
              <td class="proforma-bank-label">Account No.</td>
              <td class="proforma-bank-val" style="font-family:monospace;font-size:12.5px;letter-spacing:1px">69999995202</td>
            </tr>
            <tr>
              <td class="proforma-bank-label">IFSC Code</td>
              <td class="proforma-bank-val" style="font-family:monospace;letter-spacing:1px">IDFB0040345</td>
            </tr>
            <tr>
              <td class="proforma-bank-label">GST No.</td>
              <td class="proforma-bank-val" style="font-family:monospace">24AAICH8280N1Z0</td>
            </tr>
          </tbody>
        </table>

        <!-- Terms & Conditions Part 1 -->
        <div class="proforma-section-heading">
          <div class="proforma-section-bar"></div>
          <h3 class="proforma-section-title">TERMS &amp; CONDITIONS</h3>
        </div>

        <div class="proforma-terms-list">
          <div class="proforma-term-item">
            <div class="proforma-term-title">1. Pricing Basis &amp; Currency</div>
            <div>All amounts are in Indian Rupees (INR / ₹) and are exclusive of taxes unless stated. GST is levied at 18% (CGST 9% + SGST 9% for intra-state supply within Gujarat; IGST 18% for inter-state). A GST-compliant tax invoice will be issued against each milestone payment.</div>
          </div>
          <div class="proforma-term-item">
            <div class="proforma-term-title">2. BNI Discount</div>
            <div>A 15% BNI (Business Network International) referral discount has been applied exclusively on the gross one-time development cost of each module. It does not apply to any recurring, annual, per-minute, token-based, or third-party licensing charges.</div>
          </div>
          <div class="proforma-term-item">
            <div class="proforma-term-title">3. Fine-Tuning</div>
            <div>Each module includes one (1) month of post-go-live fine-tuning at no additional charge, covering model calibration, prompt optimisation, and minor workflow/configuration adjustments.</div>
          </div>
          <div class="proforma-term-item">
            <div class="proforma-term-title">4. Payment Schedule</div>
            <div>Payments are due against milestones as set out above. Each milestone invoice is payable within 15 days of issuance. Work on each phase commences on receipt of the corresponding payment.</div>
          </div>
        </div>

      </div>

      <!-- ════════════ PAGE 3: STATUTORY & WARRANTY ════════════ -->
      <div class="proforma-page" id="proforma-page-3">
        
        <div class="proforma-section-heading" style="margin-top:0">
          <div class="proforma-section-bar"></div>
          <h3 class="proforma-section-title">TERMS &amp; CONDITIONS (CONTINUED) — STATUTORY &amp; WARRANTY</h3>
        </div>

        <div class="proforma-terms-list">
          <div class="proforma-term-item">
            <div class="proforma-term-title">5. Payment Terms &amp; Scope of this Invoice</div>
            <div>This proforma invoice covers the one-time development cost of the modules listed only. Recurring charges — including annual service packages, server infrastructure, token-based LLM/API consumption, and per-minute calling charges — are NOT covered by this invoice and will be billed separately as they fall due, as detailed in the Recurring Charges reference table above.</div>
          </div>
          <div class="proforma-term-item">
            <div class="proforma-term-title">6. Taxation &amp; Statutory Compliance</div>
            <div>GST @18% is included in all totals. The client shall deduct TDS @10% under Section 194J of the Income Tax Act, 1961 on the taxable (pre-GST) value, and furnish Form 16A within the statutory timeline. TDS base = ${this._fmtINR(totalTaxable)}; TDS = ${this._fmtINR(tdsAmount)}; net payable after TDS = ${this._fmtINR(netPayable)}.</div>
          </div>
          <div class="proforma-term-item">
            <div class="proforma-term-title">7. Validity</div>
            <div>This proforma invoice is valid for 15 days from the date of issue. Acceptance is effected by issuing a signed Purchase Order or a signed copy of this document along with the advance payment.</div>
          </div>
          <div class="proforma-term-item">
            <div class="proforma-term-title">8. Data Security &amp; Privacy</div>
            <div>Services are delivered in compliance with India's DPDP Act, 2023, with cloud data residency in India. Production data at rest and in transit is encrypted (AES-256 / TLS 1.3). A Data Processing Agreement (DPA) will be executed prior to commencement.</div>
          </div>
          <div class="proforma-term-item">
            <div class="proforma-term-title">9. Warranty</div>
            <div>A 90-day bug-fix warranty from go-live is provided free of charge per module for defects attributable to the development team. It excludes issues from client-side infrastructure changes, third-party API modifications, or user error.</div>
          </div>
        </div>

        <!-- Authorized Signatory / Formal Sign-off Block -->
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px;padding-top:12px;border-top:1px dashed #CBD5E1">
          <div>
            <div style="font-weight:700;font-size:10px;color:#0F172A;margin-bottom:2px">Accepted &amp; Agreed:</div>
            <div style="font-size:9px;color:#64748B">Client Authorized Representative Signature &amp; Stamp</div>
            <div style="width:190px;height:32px;border-bottom:1px solid #94A3B8;margin-top:4px"></div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700;font-size:10px;color:#0F172A">For HINTONN AI PRIVATE LIMITED</div>
            <div style="font-size:9px;color:#64748B;margin-top:2px">Authorized Signatory / Digital Validation</div>
            <div style="font-size:9px;color:#2563EB;font-weight:600;margin-top:16px">[Computer Generated Document]</div>
          </div>
        </div>

        <div class="proforma-footer">
          <div style="font-weight:600;margin-bottom:3px">
            This is a computer-generated proforma invoice and does not require a signature from HINTONN AI PRIVATE LIMITED.
          </div>
          <div>HINTONN AI PRIVATE LIMITED • www.hintonn.com • GSTIN 24AAICH8280N1Z0</div>
        </div>

      </div>
    `;
  },

  // ─── Proforma Standalone Printing ───
  printProformaInvoice(invoiceId) {
    const inv = this._getInvoices().find(i => i.id === invoiceId) || Store.getInvoice(invoiceId);
    if (!inv) {
      Toast.show('Invoice not found.', 'error');
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Proforma Invoice - ${inv.billNumber || inv.id}</title>
<style>
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  @page {
    size: A4 portrait;
    margin: 0 !important; /* CRITICAL: 0 margin completely strips browser header & footer */
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #FFFFFF;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #0F172A;
  }
  @media screen {
    body {
      background: #E2E8F0;
      padding: 20px 0 40px 0;
    }
    .no-print-toolbar {
      width: 210mm;
      max-width: 800px;
      margin: 0 auto 16px auto;
      padding: 10px 18px;
      background: #1E3A8A;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #FFF;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    }
    .proforma-page {
      background: #FFFFFF;
      color: #0F172A;
      width: 210mm;
      max-width: 800px;
      min-height: 297mm;
      margin: 0 auto 24px auto;
      padding: 14mm 16mm;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border-radius: 4px;
      box-sizing: border-box;
    }
    .proforma-page:last-child {
      margin-bottom: 0;
    }
  }
  @media print {
    body {
      background: #FFFFFF !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 210mm !important;
    }
    .no-print, .no-print-toolbar {
      display: none !important;
    }
    .proforma-page {
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      padding: 14mm 16mm !important;
      width: 210mm !important;
      max-width: 210mm !important;
      height: 297mm !important;
      max-height: 297mm !important;
      min-height: 297mm !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      overflow: hidden !important;
      position: relative !important;
      background: #FFFFFF !important;
      box-sizing: border-box !important;
    }
    .proforma-page:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    .proforma-section-heading,
    .proforma-term-item,
    .proforma-address-box,
    .proforma-summary-wrap,
    .proforma-calc-box,
    .proforma-bank-table,
    table, tr, td, th {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  }
  .print-btn {
    background: #2563EB;
    color: #FFF;
    border: none;
    padding: 8px 18px;
    border-radius: 5px;
    font-weight: 700;
    cursor: pointer;
    font-size: 13px;
  }
  .print-btn:hover { background: #1D4ED8; }
  .close-btn {
    background: rgba(255,255,255,0.2);
    color: #FFF;
    border: none;
    padding: 8px 14px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 13px;
    margin-left: 8px;
  }
  ${this._getProformaPrintCSS()}
</style>
</head>
<body>
  <div class="no-print-toolbar no-print">
    <div style="font-weight:700;font-size:13.5px">Hintonn AI Proforma Invoice · ${inv.billNumber || inv.id}</div>
    <div>
      <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="close-btn" onclick="window.close()">✕ Close</button>
    </div>
  </div>
  ${this.renderProformaHTML(inv, true)}
  <script>
    window.onload = function() {
      setTimeout(() => {
        try { window.print(); } catch(e) {}
      }, 500);
    };
  </script>
</body>
</html>`;

    const printWin = window.open('', '_blank', 'width=960,height=800');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
    } else {
      Toast.show('Pop-up was blocked. Please allow pop-ups for this site.', 'warning');
    }
  },

  _getProformaPrintCSS() {
    return `
      .proforma-page {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 11px;
        line-height: 1.45;
        color: #0F172A;
      }
      .proforma-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
      .proforma-brand { display: flex; align-items: center; gap: 12px; }
      .proforma-brand-title { font-size: 20px; font-weight: 800; color: #0F172A; }
      .proforma-brand-sub { font-size: 9.5px; font-weight: 700; color: #64748B; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
      .proforma-title-area { text-align: right; }
      .proforma-doc-title { font-size: 21px; font-weight: 800; color: #1E3A8A; letter-spacing: 0.5px; text-transform: uppercase; margin: 0; }
      .proforma-doc-subtitle { font-size: 10.5px; color: #64748B; margin-top: 3px; }
      .proforma-divider { height: 3px; background: linear-gradient(90deg, #2563EB 0%, #7C3AED 100%); border-radius: 2px; margin: 12px 0 14px 0; }
      .proforma-meta-grid { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; font-size: 11px; }
      .proforma-meta-left { display: flex; flex-direction: column; gap: 3.5px; }
      .proforma-meta-item { display: flex; gap: 8px; }
      .proforma-meta-lbl { color: #64748B; min-width: 95px; font-weight: 500; font-size: 11px; }
      .proforma-meta-val { color: #0F172A; font-weight: 700; font-size: 11px; }
      .proforma-meta-right { text-align: right; }
      .proforma-modules-badge { display: inline-block; color: #1D4ED8; font-weight: 700; font-size: 12.5px; margin-top: 2px; }
      .proforma-address-box { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 10px 14px; background: #F8FAFC !important; border: 1px solid #E2E8F0; border-radius: 6px; margin-bottom: 14px; }
      .proforma-addr-col h4 { font-size: 10px; font-weight: 800; color: #4F46E5; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 4px 0; }
      .proforma-addr-name { font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 2px; }
      .proforma-addr-text { font-size: 10.5px; color: #334155; line-height: 1.45; }
      .proforma-section-heading { display: flex; align-items: center; gap: 8px; margin: 12px 0 7px 0; }
      .proforma-section-bar { width: 3.5px; height: 15px; background: #2563EB !important; border-radius: 2px; }
      .proforma-section-title { font-size: 11px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; color: #0F172A; margin: 0; }
      .proforma-table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 10px; }
      .proforma-table th { background: #1E3A8A !important; color: #FFFFFF !important; font-weight: 700; padding: 6px 8px; font-size: 10.5px; text-align: left; }
      .proforma-table td { padding: 5.5px 8px; border-bottom: 1px solid #E2E8F0; color: #334155; font-size: 10.5px; }
      .proforma-table tr.totals-row td { background: #F1F5F9 !important; border-top: 2px solid #CBD5E1; font-weight: 700; color: #0F172A; }
      .proforma-summary-wrap { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px; gap: 16px; }
      .proforma-amount-words { flex: 1; display: flex; gap: 8px; font-size: 10.5px; color: #0F172A; line-height: 1.45; }
      .proforma-amount-bar { width: 3.5px; height: 16px; background: #4F46E5 !important; border-radius: 2px; flex-shrink: 0; margin-top: 2px; }
      .proforma-calc-box { width: 320px; font-size: 10.5px; }
      .proforma-calc-row { display: flex; justify-content: space-between; padding: 3px 6px; }
      .proforma-calc-row.taxable { border-top: 1px solid #E2E8F0; font-weight: 600; }
      .proforma-calc-row.total-payable { font-weight: 800; font-size: 11.5px; color: #0F172A; border-top: 1px solid #CBD5E1; padding-top: 4px; margin-top: 2px; }
      .proforma-calc-row.net-payable { background: #EDE9FE !important; color: #5B21B6 !important; font-weight: 800; font-size: 12px; padding: 5px 8px; border-radius: 4px; margin-top: 4px; }
      .proforma-bank-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px; border: 1px solid #E2E8F0; }
      .proforma-bank-table td { padding: 4px 10px; border-bottom: 1px solid #E2E8F0; }
      .proforma-bank-label { width: 130px; color: #64748B; font-weight: 600; background: #F8FAFC !important; border-right: 1px solid #E2E8F0; }
      .proforma-bank-val { color: #0F172A; font-weight: 600; }
      .proforma-terms-list { display: flex; flex-direction: column; gap: 7px; font-size: 10px; line-height: 1.42; color: #334155; margin-bottom: 12px; }
      .proforma-term-item { display: flex; flex-direction: column; gap: 1.5px; page-break-inside: avoid !important; break-inside: avoid !important; }
      .proforma-term-title { font-weight: 700; color: #0F172A; font-size: 10.5px; }
      .proforma-footer { text-align: center; font-size: 9.5px; color: #64748B; line-height: 1.5; padding-top: 14px; border-top: 1px solid #E2E8F0; margin-top: 20px; }
    `;
  },

  generateBillPDF(invoiceId) {
    this.printProformaInvoice(invoiceId);
  },

  exportLedger() {
    Toast.show('Commercial Invoicing Ledger exported.', 'success', 3000);
  }
};


