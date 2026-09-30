// ─── Billing & Invoices Screen (Commercial PMO with Bill Version Control) ───
const BillingScreen = {
  _filter: 'all', // 'all' | 'pending' | 'paid' | 'revised' | 'latest'
  _companyFilter: 'all',
  _viewMode: 'company', // 'company' (default) | 'table'
  _search: '',
  _expandedCompanies: { 'c1': true, 'c2': true, 'c3': true, 'c4': true, 'c5': true },
  _invoices: null,

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
            <button class="btn btn-primary" id="btn-create-invoice" onclick="BillingScreen.openCreateInvoiceModal()" style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;font-weight:700;font-size:13.5px;box-shadow:0 2px 10px rgba(37,99,235,0.25);border-radius:8px">
              ${Icons.plus} Create Invoice
            </button>
          </div>
        </div>

        <!-- Top Commercial KPI Strip -->
        <div class="kpi-grid" style="margin-bottom:20px">
          <div class="kpi-card" onclick="BillingScreen.setFilter('all')" style="cursor:pointer">
            <div class="kpi-header">
              <span class="kpi-label">Total Invoiced (${totalBills} Bills)</span>
              <div class="kpi-icon-wrap">${Icons.fileText}</div>
            </div>
            <div class="kpi-value">${totalBills} Bills</div>
            <div class="kpi-change neutral" style="font-weight:600;color:var(--color-primary-700)">
              ${companyCount} Client Companies · ${packageCount} EPC Packages
            </div>
          </div>

          <div class="kpi-card" onclick="BillingScreen.setFilter('paid')" style="cursor:pointer">
            <div class="kpi-header">
              <span class="kpi-label">Certified & Collected</span>
              <div class="kpi-icon-wrap">${Icons.check}</div>
            </div>
            <div class="kpi-value">${paidBills} Invoices</div>
            <div class="kpi-change neutral" style="font-weight:600;color:var(--color-emerald-700, #059669)">
              ${paidBills} Invoices Fully Settled
            </div>
          </div>

          <div class="kpi-card" onclick="BillingScreen.setFilter('pending')" style="cursor:pointer">
            <div class="kpi-header">
              <span class="kpi-label">Pending Client Sign-off</span>
              <div class="kpi-icon-wrap">${Icons.clock}</div>
            </div>
            <div class="kpi-value">${pendingBills} Invoices</div>
            <div class="kpi-change neutral" style="font-weight:600;color:var(--color-ai-700)">
              <span class="badge badge-high" style="font-size:10px;padding:2px 7px;font-weight:600">${pendingBills} Invoices</span>
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
          <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:14px">
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

                <!-- Company Bill Status Pill (amounts removed per request) -->
                <div style="display:flex;align-items:center;gap:16px;flex-shrink:0">
                  <div style="text-align:right">
                    <div style="font-size:10.5px;text-transform:uppercase;color:var(--color-text-muted);font-weight:600">Settled</div>
                    <div style="font-size:13.5px;font-weight:700;color:var(--color-text-primary)">${compInvoices.filter(i => i.status === 'paid').length} / ${compInvoices.length} Bills</div>
                  </div>
                  <div style="text-align:right">
                    <div style="font-size:10.5px;text-transform:uppercase;color:var(--color-text-muted);font-weight:600">Open Bills</div>
                    <div style="font-size:13.5px;font-weight:700;color:#DC2626">${compInvoices.filter(i => i.status !== 'paid').length} Bills</div>
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
      return `
        <div class="section-card" style="padding:40px;text-align:center">
          <p style="color:var(--color-text-muted);font-size:14px">
            ${this._search ? `No invoices found matching "${this._search}"` : 'No invoices match selected filter.'}
          </p>
          <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:14px">
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

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const initialCode = 'CLIENT';

    this._createModalState = {
      clientMode: 'other', // 'other' | 'existing'
      selectedCompanyId: defaultComp ? defaultComp.id : '',
      clientLegalName: '',
      clientAddr1: '',
      clientAddr2: '',
      clientState: 'Gujarat, India',
      clientGstin: '',
      saveCompany: true,
      invoiceNumber: `HIN-PI-${initialCode}-2026-${randomSuffix}`,
      invoiceDate: dateStr,
      validUntil: validStr,
      refQuotation: `HIN-CL-${initialCode}-2026-001`,
      currency: 'INR (₹)',
      modulesTag: '[R1 • R2 • R3]',
      items: [
        {
          id: 1,
          name: 'AI Solution Platform & Custom Workflow Automation',
          desc: 'One-time development • incl. 1 month post-go-live fine-tuning',
          gross: 500000,
          discountPct: 15
        }
      ],
      includeRecurring: true,
      recurringItem: {
        module: 'Hintonn AI Enterprise Platform SLA',
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

    return `
      <div class="create-invoice-container" style="display:flex;flex-direction:column;gap:16px;font-size:13px">

        <!-- Top Proforma Identity Strip -->
        <div style="padding:12px 16px;background:linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%);border:1px solid #BFDBFE;border-radius:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:38px;height:38px;border-radius:8px;background:#2563EB;color:#FFF;display:flex;align-items:center;justify-content:center;font-size:18px">
              📄
            </div>
            <div>
              <div style="font-weight:800;font-size:14.5px;color:#1E3A8A">PROFORMA INVOICE GENERATOR</div>
              <div style="font-size:11px;color:var(--color-text-muted)">
                HINTONN AI PRIVATE LIMITED · Not a Tax Invoice — for approval &amp; advance payment
              </div>
            </div>
          </div>
          <span class="badge" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;font-size:11px;font-weight:700;padding:3px 10px">
            Official 3-Page Format Template
          </span>
        </div>

        <!-- 1. BILL TO / CLIENT COMPANY INPUTS -->
        <div class="section-card no-pad" style="border:1px solid var(--color-border);border-radius:8px;padding:16px;background:var(--color-surface)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid var(--color-border);padding-bottom:10px;flex-wrap:wrap;gap:10px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="width:4px;height:16px;background:#4F46E5;border-radius:2px;display:inline-block"></span>
              <span style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:var(--color-text-primary)">
                BILL TO: Client &amp; Company Details
              </span>
            </div>

            <!-- Client Mode Selector -->
            <div style="display:flex;align-items:center;gap:14px;font-size:12px">
              <label style="display:flex;align-items:center;gap:5px;cursor:pointer;color:var(--color-text-primary)">
                <input type="radio" name="inv-client-mode" value="other" ${s.clientMode==='other'?'checked':''} onchange="BillingScreen._toggleClientMode('other')">
                <span style="font-weight:600">Enter Other Company Details</span>
              </label>
              ${companies.length > 0 ? `
                <label style="display:flex;align-items:center;gap:5px;cursor:pointer;color:var(--color-text-primary)">
                  <input type="radio" name="inv-client-mode" value="existing" ${s.clientMode==='existing'?'checked':''} onchange="BillingScreen._toggleClientMode('existing')">
                  <span style="font-weight:600">Select Existing Client (${companies.length})</span>
                </label>
              ` : ''}
            </div>
          </div>

          <!-- Existing Company Select Dropdown -->
          <div id="inv-existing-company-row" style="display:${s.clientMode==='existing'?'block':'none'};margin-bottom:12px">
            <label class="form-label" style="font-weight:600;font-size:12px">Choose Registered Client Company</label>
            <select class="form-control" id="inv-existing-select" onchange="BillingScreen._onSelectExistingClient(this.value)">
              <option value="">-- Choose Existing Client Company --</option>
              ${companies.map(c => `
                <option value="${c.id}" ${s.selectedCompanyId===c.id?'selected':''}>${c.name}</option>
              `).join('')}
            </select>
          </div>

          <!-- Other Company Fields -->
          <div id="inv-other-company-fields">
            <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:12px;margin-bottom:10px">
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-weight:600;font-size:12px">Client / Company Legal Name <span style="color:#DC2626">*</span></label>
                <input type="text" class="form-control" id="inv-client-name" placeholder="e.g. Acme AI Innovations Private Limited" 
                       value="${Utils.escapeHtml(s.clientLegalName)}" 
                       oninput="BillingScreen._onClientNameInput(this.value)">
              </div>
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-weight:600;font-size:12px">Client GSTIN / Tax ID</label>
                <input type="text" class="form-control" id="inv-client-gstin" placeholder="e.g. 24AAACH1234N1Z0 or —" 
                       value="${Utils.escapeHtml(s.clientGstin)}">
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px">
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-weight:600;font-size:12px">Address Line 1</label>
                <input type="text" class="form-control" id="inv-client-addr1" placeholder="e.g. 10th Floor, Horizon Tech Park, Corporate Rd" 
                       value="${Utils.escapeHtml(s.clientAddr1)}">
              </div>
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-weight:600;font-size:12px">Address Line 2, City — PIN</label>
                <input type="text" class="form-control" id="inv-client-addr2" placeholder="e.g. S.G. Highway, Ahmedabad — 380054" 
                       value="${Utils.escapeHtml(s.clientAddr2)}">
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:12px;align-items:center">
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-weight:600;font-size:12px">State, Country</label>
                <input type="text" class="form-control" id="inv-client-state" placeholder="e.g. Gujarat, India" 
                       value="${Utils.escapeHtml(s.clientState)}">
              </div>
              <div id="inv-save-company-wrap" style="display:${s.clientMode==='other'?'flex':'none'};align-items:center;padding-top:20px">
                <label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-size:12px;color:var(--color-text-secondary);user-select:none">
                  <input type="checkbox" id="inv-save-company-check" ${s.saveCompany?'checked':''}>
                  <span>Save this company to client directory for future billing</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. INVOICE REFERENCES & METADATA -->
        <div class="section-card no-pad" style="border:1px solid var(--color-border);border-radius:8px;padding:16px;background:var(--color-surface)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;border-bottom:1px solid var(--color-border);padding-bottom:10px">
            <span style="width:4px;height:16px;background:#2563EB;border-radius:2px;display:inline-block"></span>
            <span style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:var(--color-text-primary)">
              Invoice References &amp; Timeline
            </span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:10px">
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:600;font-size:12px">Invoice No. <span style="color:#DC2626">*</span></label>
              <input type="text" class="form-control" id="inv-number" value="${Utils.escapeHtml(s.invoiceNumber)}" style="font-family:monospace;font-weight:600">
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:600;font-size:12px">Invoice Date</label>
              <input type="date" class="form-control" id="inv-date" value="${s.invoiceDate}">
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:600;font-size:12px">Valid Until (Expiry)</label>
              <input type="date" class="form-control" id="inv-valid-until" value="${s.validUntil}">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:600;font-size:12px">Ref. Quotation</label>
              <input type="text" class="form-control" id="inv-ref-quotation" value="${Utils.escapeHtml(s.refQuotation)}" style="font-family:monospace">
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:600;font-size:12px">Currency</label>
              <input type="text" class="form-control" id="inv-currency" value="${Utils.escapeHtml(s.currency)}" readonly style="background:var(--color-bg-page)">
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:600;font-size:12px">Prepared for Modules</label>
              <input type="text" class="form-control" id="inv-modules-tag" value="${Utils.escapeHtml(s.modulesTag)}">
            </div>
          </div>
        </div>

        <!-- 3. DEVELOPMENT CHARGES (ONE-TIME LINE ITEMS) -->
        <div class="section-card no-pad" style="border:1px solid var(--color-border);border-radius:8px;padding:16px;background:var(--color-surface)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid var(--color-border);padding-bottom:10px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="width:4px;height:16px;background:#059669;border-radius:2px;display:inline-block"></span>
              <span style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:var(--color-text-primary)">
                Development Charges — One-Time
              </span>
            </div>
            <button type="button" class="btn btn-outline btn-xs" onclick="BillingScreen._addModuleItemRow()" style="font-weight:600">
              ${Icons.plus} Add Module Line
            </button>
          </div>

          <div style="overflow-x:auto">
            <table class="table" id="inv-items-table" style="margin:0;font-size:12px">
              <thead>
                <tr style="background:var(--color-bg-page)">
                  <th style="min-width:240px;text-align:left">Module / Service Description</th>
                  <th class="num" style="width:130px">Gross (₹)</th>
                  <th class="num" style="width:115px">BNI Disc. %</th>
                  <th class="num" style="width:120px">Taxable (₹)</th>
                  <th class="num" style="width:110px">GST 18% (₹)</th>
                  <th class="num" style="width:125px">Amount (₹)</th>
                  <th style="width:40px"></th>
                </tr>
              </thead>
              <tbody id="inv-items-tbody">
                ${this._renderCreateModalItemsRows()}
              </tbody>
            </table>
          </div>

          <!-- Live Totals & Calculation Summary -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:16px;padding-top:14px;border-top:1px solid var(--color-border);flex-wrap:wrap;gap:16px">
            
            <div style="flex:1;min-width:280px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:12px 14px">
              <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;color:#64748B;letter-spacing:0.5px;margin-bottom:4px">
                Amount in words (incl. GST)
              </div>
              <div id="inv-words-preview" style="font-size:12.5px;font-weight:600;color:#1E3A8A;line-height:1.5">
                Indian Rupees Zero Only (incl. GST).
              </div>
              <div style="margin-top:8px;font-size:11px;color:#64748B">
                TDS @10% u/s 194J will be deducted by client on the taxable value base.
              </div>
            </div>

            <div style="width:340px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:6px;padding:10px 14px;font-size:12px">
              <div style="display:flex;justify-content:space-between;padding:4px 0">
                <span style="color:var(--color-text-secondary)">Gross Development Cost:</span>
                <strong id="inv-sum-gross">₹0</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding:4px 0;color:#DC2626">
                <span>Less: BNI Discount (15%):</span>
                <strong id="inv-sum-discount">–₹0</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid var(--color-border);font-weight:600">
                <span>Taxable Value:</span>
                <span id="inv-sum-taxable">₹0</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:4px 0;color:#059669">
                <span>Add: GST @18% (CGST 9% + SGST 9%):</span>
                <strong id="inv-sum-gst">₹0</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding:6px 0;border-top:2px solid var(--color-border);font-size:13px;font-weight:700;color:var(--color-text-primary)">
                <span>Total Payable (incl. GST):</span>
                <span id="inv-sum-total">₹0</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:4px 0;color:#6B7280;font-size:11.5px">
                <span>Less: TDS @10% u/s 194J:</span>
                <span id="inv-sum-tds">–₹0</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 10px;background:#EDE9FE;border-radius:4px;font-weight:800;color:#5B21B6;margin-top:6px;font-size:13.5px">
                <span>Net Payable After TDS:</span>
                <span id="inv-sum-net">₹0</span>
              </div>
            </div>

          </div>
        </div>

        <!-- 4. PAYMENT SCHEDULE & RECURRING CHARGES REFERENCE -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          
          <div style="padding:14px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px">
            <div style="font-weight:700;font-size:12.5px;color:var(--color-text-primary);margin-bottom:8px;display:flex;align-items:center;gap:6px">
              <span style="color:#2563EB">●</span> Payment Milestones Schedule
            </div>
            <div style="font-size:11.5px;color:var(--color-text-secondary);display:flex;flex-direction:column;gap:6px">
              <div style="display:flex;justify-content:space-between">
                <span>M1: Advance on PO (40%)</span>
                <strong id="inv-sched-m1">₹0</strong>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span>M2: Demo Built AI Modules (40%)</span>
                <strong id="inv-sched-m2">₹0</strong>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span>M3: Deployment &amp; Go-live (20%)</span>
                <strong id="inv-sched-m3">₹0</strong>
              </div>
            </div>
          </div>

          <div style="padding:14px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <div style="font-weight:700;font-size:12.5px;color:var(--color-text-primary);display:flex;align-items:center;gap:6px">
                <span style="color:#7C3AED">●</span> Recurring Charges (Reference Only)
              </div>
              <label style="font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer">
                <input type="checkbox" id="inv-include-recurring" ${s.includeRecurring?'checked':''} onchange="BillingScreen._toggleRecurring(this.checked)">
                <span>Include Table</span>
              </label>
            </div>
            <div id="inv-recurring-inputs" style="font-size:11.5px;color:var(--color-text-secondary);display:${s.includeRecurring?'block':'none'}">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">
                <input type="text" class="form-control" id="inv-rec-module" placeholder="Module Name" value="${Utils.escapeHtml(s.recurringItem.module)}" style="height:28px;font-size:11.5px">
                <input type="number" class="form-control" id="inv-rec-amount" placeholder="Amount (excl. GST)" value="${s.recurringItem.amount}" style="height:28px;font-size:11.5px">
              </div>
              <div style="font-size:10.5px;color:#94A3B8;line-height:1.4">
                Amounts exclusive of GST. Provided for reference only — billed separately as they fall due.
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
        <tr data-item-idx="${idx}" style="border-bottom:1px solid var(--color-border)">
          <td style="padding:6px 8px">
            <input type="text" class="form-control" style="font-weight:600;font-size:12px;margin-bottom:4px" 
                   value="${Utils.escapeHtml(it.name || '')}" placeholder="Module / Service Name"
                   oninput="BillingScreen._onItemFieldChange(${idx}, 'name', this.value)">
            <input type="text" class="form-control" style="font-size:11px;color:var(--color-text-secondary)" 
                   value="${Utils.escapeHtml(it.desc || '')}" placeholder="One-time development • incl. 1 month post-go-live fine-tuning"
                   oninput="BillingScreen._onItemFieldChange(${idx}, 'desc', this.value)">
          </td>
          <td class="num" style="padding:6px 8px">
            <input type="number" class="form-control" style="text-align:right;font-weight:700;font-size:12px" 
                   value="${g}" min="0" step="1000"
                   oninput="BillingScreen._onItemFieldChange(${idx}, 'gross', parseFloat(this.value)||0)">
          </td>
          <td class="num" style="padding:6px 8px">
            <div style="display:flex;align-items:center;gap:3px;justify-content:flex-end">
              <input type="number" class="form-control" style="text-align:right;font-size:12px;width:55px" 
                     value="${dPct}" min="0" max="100" step="1"
                     oninput="BillingScreen._onItemFieldChange(${idx}, 'discountPct', parseFloat(this.value)||0)">
              <span style="font-size:11px;color:var(--color-text-muted)">%</span>
            </div>
            <div id="item-disc-amt-${idx}" style="font-size:10.5px;color:#DC2626;text-align:right;margin-top:2px">
              ${this._fmtINR(-dAmt)}
            </div>
          </td>
          <td class="num" id="item-taxable-${idx}" style="padding:6px 8px;font-weight:600;font-size:12px;color:var(--color-text-primary)">
            ${this._fmtINR(tax)}
          </td>
          <td class="num" id="item-gst-${idx}" style="padding:6px 8px;font-size:12px;color:var(--color-text-secondary)">
            ${this._fmtINR(gst)}
          </td>
          <td class="num" id="item-amt-${idx}" style="padding:6px 8px;font-weight:700;font-size:12px;color:var(--color-primary-700)">
            ${this._fmtINR(amt)}
          </td>
          <td style="padding:6px 8px;text-align:center">
            ${items.length > 1 ? `
              <button type="button" class="btn btn-ghost btn-xs" onclick="BillingScreen._removeModuleItemRow(${idx})" title="Remove Line" style="color:#DC2626;padding:2px 6px">
                ✕
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
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

    const initials = comp.name.replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase() || 'CLIENT';
    const invInput = document.getElementById('inv-number');
    const quotInput = document.getElementById('inv-ref-quotation');
    if (invInput) {
      const suffix = Math.floor(100 + Math.random() * 900);
      invInput.value = `HIN-PI-${initials}-2026-${suffix}`;
    }
    if (quotInput) {
      quotInput.value = `HIN-CL-${initials}-2026-001`;
    }
  },

  _onClientNameInput(name) {
    if (!name) return;
    const invInput = document.getElementById('inv-number');
    const quotInput = document.getElementById('inv-ref-quotation');
    const clean = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase() || 'CLIENT';
    if (invInput && (invInput.value.includes('CLIENT') || invInput.value.startsWith('HIN-PI-'))) {
      const suffix = Math.floor(100 + Math.random() * 900);
      invInput.value = `HIN-PI-${clean}-2026-${suffix}`;
    }
    if (quotInput && (quotInput.value.includes('CLIENT') || quotInput.value.startsWith('HIN-CL-'))) {
      quotInput.value = `HIN-CL-${clean}-2026-001`;
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
    const clientNameInput = document.getElementById('inv-client-name');
    const clientLegalName = clientNameInput ? clientNameInput.value.trim() : '';
    if (!clientLegalName) {
      Toast.show('Please enter the Client / Company Legal Name.', 'error', 3500);
      if (clientNameInput) clientNameInput.focus();
      return;
    }

    const invNumInput = document.getElementById('inv-number');
    const invoiceNumber = invNumInput ? invNumInput.value.trim() : `HIN-PI-${Date.now()}`;
    const invDateInput = document.getElementById('inv-date');
    const invoiceDate = invDateInput ? invDateInput.value : new Date().toISOString().split('T')[0];
    const validUntilInput = document.getElementById('inv-valid-until');
    const validUntil = validUntilInput ? validUntilInput.value : new Date(Date.now() + 15*86400000).toISOString().split('T')[0];
    const refQuotInput = document.getElementById('inv-ref-quotation');
    const refQuotation = refQuotInput ? refQuotInput.value.trim() : 'HIN-CL-2026-001';
    const modulesTagInput = document.getElementById('inv-modules-tag');
    const modulesTag = modulesTagInput ? modulesTagInput.value.trim() : '[R1 • R2 • R3]';

    const clientGstin = document.getElementById('inv-client-gstin') ? document.getElementById('inv-client-gstin').value.trim() : '';
    const clientAddr1 = document.getElementById('inv-client-addr1') ? document.getElementById('inv-client-addr1').value.trim() : '';
    const clientAddr2 = document.getElementById('inv-client-addr2') ? document.getElementById('inv-client-addr2').value.trim() : '';
    const clientState = document.getElementById('inv-client-state') ? document.getElementById('inv-client-state').value.trim() : 'Gujarat, India';
    const saveCompanyCheck = document.getElementById('inv-save-company-check');
    const shouldSaveCompany = saveCompanyCheck ? saveCompanyCheck.checked : false;

    const includeRecurringCheck = document.getElementById('inv-include-recurring');
    const includeRecurring = includeRecurringCheck ? includeRecurringCheck.checked : true;
    const recModule = document.getElementById('inv-rec-module') ? document.getElementById('inv-rec-module').value.trim() : 'Hintonn AI SLA';
    const recAmount = document.getElementById('inv-rec-amount') ? parseFloat(document.getElementById('inv-rec-amount').value) || 0 : 0;

    const items = (this._createModalState && this._createModalState.items) ? this._createModalState.items : [];
    let totalGross = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalGst = 0;
    let totalPayable = 0;

    const parsedItems = items.map(it => {
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

      return {
        name: it.name || 'AI Module Development',
        desc: it.desc || 'One-time development • incl. 1 month post-go-live fine-tuning',
        gross: g,
        discountPct: dPct,
        discountAmount: dAmt,
        taxable: tax,
        gstRate: 18,
        gstAmount: gst,
        amount: amt
      };
    });

    if (totalGross === 0) {
      Toast.show('Please enter at least one module with gross development cost.', 'warning', 3500);
      return;
    }

    const tdsAmount = Math.round(totalTaxable * 0.10);
    const netPayable = totalPayable - tdsAmount;

    // Determine or create company
    let companyId = this._createModalState ? this._createModalState.selectedCompanyId : '';
    const companies = this._getCompanies();
    const existingComp = companies.find(c => c.name.toLowerCase() === clientLegalName.toLowerCase() || c.id === companyId);

    if (existingComp) {
      companyId = existingComp.id;
    } else if (shouldSaveCompany || this._createModalState?.clientMode === 'other') {
      const initials = clientLegalName.replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toLowerCase() || 'comp';
      const newCId = `c_${initials}_${Date.now()}`;
      const newComp = Store.createCompany({
        id: newCId,
        name: clientLegalName,
        contactPerson: clientLegalName.split(' ')[0] + ' Accounts Team',
        totalContractValue: this._fmtINR(totalGross),
        activePackage: modulesTag,
        totalBilledFormatted: this._fmtINR(totalPayable),
        totalPendingFormatted: this._fmtINR(netPayable),
        paymentStatus: 'Pending',
        paymentStatusBadge: 'badge-high',
        billsCountText: '1 Bill',
        hasRevisions: false,
        addressLine1: clientAddr1,
        addressLine2: clientAddr2,
        stateCountry: clientState,
        gstin: clientGstin
      });
      companyId = newComp.id;
    } else {
      companyId = `c_temp_${Date.now()}`;
    }

    const m1 = Math.round(totalPayable * 0.4);
    const m2 = Math.round(totalPayable * 0.4);
    const m3 = totalPayable - (m1 + m2);

    const invoiceObj = {
      id: invoiceNumber,
      billNumber: invoiceNumber,
      companyId: companyId,
      companyName: clientLegalName,
      projectName: 'AI Platform & Intelligent Automation',
      packageCode: refQuotation,
      quotationRef: refQuotation,
      milestone: `Deployment of Modules ${modulesTag}`,
      modulesTag: modulesTag,
      issueDate: invoiceDate,
      dueDate: validUntil,
      currency: 'INR (₹)',
      amountDue: this._fmtINR(totalGross),
      taxAmount: this._fmtINR(totalGst),
      deductions: this._fmtINR(totalDiscount),
      totalPayable: this._fmtINR(totalPayable),
      netPayable: this._fmtINR(netPayable),
      taxableValue: this._fmtINR(totalTaxable),
      tdsAmount: this._fmtINR(tdsAmount),
      status: 'pending-client',
      statusLabel: 'Pending Approval',
      badgeClass: 'badge-high',
      version: 'v1.0',
      versionBadgeClass: 'version-pill-v1',
      isRevised: false,
      clientDetails: {
        legalName: clientLegalName,
        addressLine1: clientAddr1,
        addressLine2: clientAddr2,
        stateCountry: clientState,
        gstin: clientGstin || '—'
      },
      items: parsedItems,
      paymentSchedule: [
        { milestone: 'M1', stage: 'Advance — on signing of agreement / receipt of PO', percent: 40, amount: m1 },
        { milestone: 'M2', stage: 'Demo — on demonstration of built AI modules', percent: 40, amount: m2 },
        { milestone: 'M3', stage: 'Deployment — after production deployment & go-live', percent: 20, amount: m3 }
      ],
      recurringCharges: includeRecurring ? [
        {
          module: recModule || 'Hintonn AI Enterprise Platform SLA',
          component: 'Annual Maintenance, Security Patches & Cloud Ops',
          basis: 'Flat annual package',
          freq: 'Annual',
          amount: recAmount
        }
      ] : [],
      versionHistory: [
        {
          version: 'v1.0',
          label: 'Initial Proforma Issuance',
          date: invoiceDate,
          baseAmount: this._fmtINR(totalGross),
          tax: this._fmtINR(totalGst),
          deductions: this._fmtINR(totalDiscount),
          netPayable: this._fmtINR(netPayable),
          editor: 'Commercial Operations',
          changeReason: 'Original Proforma Invoice created for client approval and milestone advance.',
          modifiedFields: ['Proforma Generated'],
          isCurrent: true
        }
      ]
    };

    Store.createInvoice(invoiceObj);
    this._invoices = null;
    this._expandedCompanies[companyId] = true;
    this.updateBillingContainer();
    Modal.closeAll();
    Toast.show(`Proforma Invoice ${invoiceObj.id} created successfully!`, 'success', 3500);

    setTimeout(() => {
      this.openProformaPreview(invoiceObj.id);
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


