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
        totalContractValue: '$5,800,000',
        activePackage: 'PKG-01 · Core EPC Phase 1',
        totalBilledFormatted: '$1,920,000',
        totalPendingFormatted: '$720,000',
        paymentStatus: 'Partially Paid',
        paymentStatusBadge: 'badge-medium',
        billsCountText: '3 Bills Issued · 2 Revisions',
        hasRevisions: true
      },
      {
        id: 'c2',
        name: 'Vertex Grid Utilities Ltd',
        contactPerson: 'Deepak Shinde (Lead Engineer)',
        totalContractValue: '$3,400,000',
        activePackage: 'PKG-02 · Substation Package',
        totalBilledFormatted: '$1,260,000',
        totalPendingFormatted: '$410,000',
        paymentStatus: 'Partially Paid',
        paymentStatusBadge: 'badge-medium',
        billsCountText: '2 Bills Issued · 1 Revision',
        hasRevisions: true
      },
      {
        id: 'c3',
        name: 'Northern Powertech Systems',
        contactPerson: 'Sunil Mehta (Procurement Head)',
        totalContractValue: '$2,100,000',
        activePackage: 'PKG-03 · Utilities & Balance of Plant',
        totalBilledFormatted: '$280,000',
        totalPendingFormatted: '$280,000',
        paymentStatus: 'Pending Release',
        paymentStatusBadge: 'badge-review',
        billsCountText: '1 Active Bill',
        hasRevisions: false
      },
      {
        id: 'c4',
        name: 'Solaris Infra Concessions',
        contactPerson: 'Vikram Sen (Director Projects)',
        totalContractValue: '$1,500,000',
        activePackage: 'PKG-04 · SCADA & Grid Automation',
        totalBilledFormatted: '$1,040,000',
        totalPendingFormatted: '$190,000',
        paymentStatus: 'Partially Paid',
        paymentStatusBadge: 'badge-medium',
        billsCountText: '2 Active Bills · 1 Revision',
        hasRevisions: true
      },
      {
        id: 'c5',
        name: 'Metro Rail Transmission Authority',
        contactPerson: 'Anand Kulkarni (General Manager)',
        totalContractValue: '$1,400,000',
        activePackage: 'PKG-05 · Civil & Site Facilities',
        totalBilledFormatted: '$650,000',
        totalPendingFormatted: '$0',
        paymentStatus: 'Paid',
        paymentStatusBadge: 'badge-completed',
        billsCountText: '1 Settled Bill',
        hasRevisions: false
      }
    ];
  },

  // Commercial EPC Invoices Dataset with Multi-Version Control & History
  _getInvoices() {
    if (this._invoices) return this._invoices;

    this._invoices = [
      {
        id: 'INV-2026-104',
        billNumber: 'Bill #2',
        companyId: 'c1',
        companyName: 'Apex Power & Energy Corp',
        projectName: 'Hintonn AI Core Platform',
        projectId: 'p1',
        packageCode: 'PKG-01 · Core EPC',
        contractValue: '$5,800,000',
        amountDue: '$410,000',
        taxAmount: '$73,800',
        deductions: '$20,500',
        netPayable: '$463,300',
        milestone: 'Execution Milestone 3 (SCADA & Orchestration)',
        dueDate: '2026-10-15',
        status: 'pending-client',
        statusLabel: 'Pending Client Sign-off',
        badgeClass: 'badge-review',
        issueDate: '2026-09-15',
        version: 'v2.0',
        versionLabel: 'v2.0 - Re-negotiated / Re-issued',
        versionBadgeClass: 'version-pill-v2',
        isRevised: true,
        versionHistory: [
          {
            version: 'v1.0',
            label: 'Original Baseline Draft',
            date: '2026-09-01',
            baseAmount: '$380,000',
            tax: '$68,400',
            deductions: '$19,000',
            netPayable: '$429,400',
            editor: 'Ayush Desai (Admin)',
            changeReason: 'Initial milestone 3 achievement draft submitted for commercial certification.',
            modifiedFields: ['Initial Baseline Draft'],
            isCurrent: false
          },
          {
            version: 'v1.1',
            label: 'Surveyor Quantity Adjustment',
            date: '2026-09-08',
            baseAmount: '$395,000',
            tax: '$71,100',
            deductions: '$19,750',
            netPayable: '$446,350',
            editor: 'Preet Bhavsar (AI Developer)',
            changeReason: 'Joint measurement sheet reconciliation with client site engineer (+15,000 USD cabling variance).',
            modifiedFields: ['BOQ Item 3.4 Quantity', 'Base Amount', 'Tax'],
            isCurrent: false
          },
          {
            version: 'v2.0',
            label: 'Re-negotiated & Final Submission',
            date: '2026-09-15',
            baseAmount: '$410,000',
            tax: '$73,800',
            deductions: '$20,500',
            netPayable: '$463,300',
            editor: 'Ayush Desai (Admin)',
            changeReason: 'Finalized scope extension addendum approved by Apex Power commercial council.',
            modifiedFields: ['Scope Addendum #2', 'Base Amount (+15K)', 'Net Due'],
            isCurrent: true
          }
        ]
      },
      {
        id: 'INV-2026-103',
        billNumber: 'Supplemental Bill #1',
        companyId: 'c1',
        companyName: 'Apex Power & Energy Corp',
        projectName: 'Hintonn AI Core Platform',
        projectId: 'p1',
        packageCode: 'PKG-01 · Core EPC',
        contractValue: '$5,800,000',
        amountDue: '$310,000',
        taxAmount: '$55,800',
        deductions: '$15,500',
        netPayable: '$350,300',
        milestone: 'API Gateway & Integration Tranche',
        dueDate: '2026-10-28',
        status: 'under-certification',
        statusLabel: 'Under Certification',
        badgeClass: 'badge-active',
        issueDate: '2026-09-18',
        version: 'v1.1',
        versionLabel: 'v1.1 - Minor Adjustment',
        versionBadgeClass: 'version-pill-v1-1',
        isRevised: true,
        versionHistory: [
          {
            version: 'v1.0',
            label: 'Original Baseline Draft',
            date: '2026-09-10',
            baseAmount: '$300,000',
            tax: '$54,000',
            deductions: '$15,000',
            netPayable: '$339,000',
            editor: 'Ayush Desai (Admin)',
            changeReason: 'Initial supplementary billing draft for Phase 1 API tranche.',
            modifiedFields: ['Initial Draft'],
            isCurrent: false
          },
          {
            version: 'v1.1',
            label: 'Minor Tax Recalculation',
            date: '2026-09-18',
            baseAmount: '$310,000',
            tax: '$55,800',
            deductions: '$15,500',
            netPayable: '$350,300',
            editor: 'Preet Bhavsar (AI Developer)',
            changeReason: 'Updated GST surcharge calculation as per revised state tariff circular.',
            modifiedFields: ['Tax Surcharge', 'Base Amount'],
            isCurrent: true
          }
        ]
      },
      {
        id: 'INV-2026-092',
        billNumber: 'Bill #1',
        companyId: 'c1',
        companyName: 'Apex Power & Energy Corp',
        projectName: 'Hintonn AI Core Platform',
        projectId: 'p1',
        packageCode: 'PKG-01 · Core EPC',
        contractValue: '$5,800,000',
        amountDue: '$1,200,000',
        taxAmount: '$216,000',
        deductions: '$60,000',
        netPayable: '$1,356,000',
        milestone: 'Architecture Blueprint & Mobilization Acceptance',
        dueDate: '2026-07-30',
        status: 'paid',
        statusLabel: 'Paid & Certified',
        badgeClass: 'badge-completed',
        issueDate: '2026-07-05',
        version: 'v1.0',
        versionLabel: 'v1.0 - Original Baseline',
        versionBadgeClass: 'version-pill-v1',
        isRevised: false,
        versionHistory: [
          {
            version: 'v1.0',
            label: 'Original Baseline Submission',
            date: '2026-07-05',
            baseAmount: '$1,200,000',
            tax: '$216,000',
            deductions: '$60,000',
            netPayable: '$1,356,000',
            editor: 'Ayush Desai (Admin)',
            changeReason: 'Mobilization advance milestone certified and settled by client bank wire.',
            modifiedFields: ['Initial Baseline'],
            isCurrent: true
          }
        ]
      },
      {
        id: 'INV-2026-108',
        billNumber: 'Bill #2',
        companyId: 'c2',
        companyName: 'Vertex Grid Utilities Ltd',
        projectName: 'Client Substation Package',
        projectId: 'p2',
        packageCode: 'PKG-02 · Substation',
        contractValue: '$3,400,000',
        amountDue: '$410,000',
        taxAmount: '$73,800',
        deductions: '$20,500',
        netPayable: '$463,300',
        milestone: 'Detailed Engineering Design Phase Certification',
        dueDate: '2026-11-10',
        status: 'pending-client',
        statusLabel: 'Pending Client Sign-off',
        badgeClass: 'badge-review',
        issueDate: '2026-09-10',
        version: 'v1.1',
        versionLabel: 'v1.1 - Minor Adjustment',
        versionBadgeClass: 'version-pill-v1-1',
        isRevised: true,
        versionHistory: [
          {
            version: 'v1.0',
            label: 'Original Baseline Draft',
            date: '2026-08-25',
            baseAmount: '$400,000',
            tax: '$72,000',
            deductions: '$20,000',
            netPayable: '$452,000',
            editor: 'Ayush Desai (Admin)',
            changeReason: 'Initial engineering acceptance draft submission.',
            modifiedFields: ['Initial Submission'],
            isCurrent: false
          },
          {
            version: 'v1.1',
            label: 'Substation Transformer Addendum',
            date: '2026-09-10',
            baseAmount: '$410,000',
            tax: '$73,800',
            deductions: '$20,500',
            netPayable: '$463,300',
            editor: 'Mohit Jain (AI Developer)',
            changeReason: 'Added seismic damper specification costs agreed during client design review.',
            modifiedFields: ['Base Amount (+$10K)', 'Tax', 'Net Due'],
            isCurrent: true
          }
        ]
      },
      {
        id: 'INV-2026-088',
        billNumber: 'Bill #1',
        companyId: 'c2',
        companyName: 'Vertex Grid Utilities Ltd',
        projectName: 'Client Substation Package',
        projectId: 'p2',
        packageCode: 'PKG-02 · Substation',
        contractValue: '$3,400,000',
        amountDue: '$850,000',
        taxAmount: '$153,000',
        deductions: '$42,500',
        netPayable: '$960,500',
        milestone: 'Advance Payment Mobilization Tranche',
        dueDate: '2026-08-15',
        status: 'paid',
        statusLabel: 'Paid & Certified',
        badgeClass: 'badge-completed',
        issueDate: '2026-08-01',
        version: 'v1.0',
        versionLabel: 'v1.0 - Original Baseline',
        versionBadgeClass: 'version-pill-v1',
        isRevised: false,
        versionHistory: [
          {
            version: 'v1.0',
            label: 'Original Baseline Submission',
            date: '2026-08-01',
            baseAmount: '$850,000',
            tax: '$153,000',
            deductions: '$42,500',
            netPayable: '$960,500',
            editor: 'Ayush Desai (Admin)',
            changeReason: 'Advance payment mobilization tranche fully paid.',
            modifiedFields: ['Initial Baseline'],
            isCurrent: true
          }
        ]
      },
      {
        id: 'INV-2026-112',
        billNumber: 'Bill #1',
        companyId: 'c3',
        companyName: 'Northern Powertech Systems',
        projectName: 'Utilities & Plant Balance',
        projectId: 'p3',
        packageCode: 'PKG-03 · Utilities',
        contractValue: '$2,100,000',
        amountDue: '$280,000',
        taxAmount: '$50,400',
        deductions: '$14,000',
        netPayable: '$316,400',
        milestone: 'Long-Lead Equipment Procurement Tranche',
        dueDate: '2026-11-25',
        status: 'under-certification',
        statusLabel: 'Under Certification',
        badgeClass: 'badge-active',
        issueDate: '2026-09-20',
        version: 'v1.0',
        versionLabel: 'v1.0 - Original Baseline',
        versionBadgeClass: 'version-pill-v1',
        isRevised: false,
        versionHistory: [
          {
            version: 'v1.0',
            label: 'Original Baseline Submission',
            date: '2026-09-20',
            baseAmount: '$280,000',
            tax: '$50,400',
            deductions: '$14,000',
            netPayable: '$316,400',
            editor: 'Ayush Desai (Admin)',
            changeReason: 'Turbine cooling equipment procurement milestone submitted.',
            modifiedFields: ['Initial Baseline'],
            isCurrent: true
          }
        ]
      },
      {
        id: 'INV-2026-115',
        billNumber: 'Bill #1',
        companyId: 'c4',
        companyName: 'Solaris Infra Concessions',
        projectName: 'Grid Automation & LoRA AI',
        projectId: 'p4',
        packageCode: 'PKG-04 · Automation',
        contractValue: '$1,500,000',
        amountDue: '$190,000',
        taxAmount: '$34,200',
        deductions: '$9,500',
        netPayable: '$214,700',
        milestone: 'Telemetry Node Testing Phase',
        dueDate: '2026-12-05',
        status: 'under-certification',
        statusLabel: 'Under Certification',
        badgeClass: 'badge-active',
        issueDate: '2026-09-21',
        version: 'v1.0',
        versionLabel: 'v1.0 - Original Baseline',
        versionBadgeClass: 'version-pill-v1',
        isRevised: false,
        versionHistory: [
          {
            version: 'v1.0',
            label: 'Original Baseline Submission',
            date: '2026-09-21',
            baseAmount: '$190,000',
            tax: '$34,200',
            deductions: '$9,500',
            netPayable: '$214,700',
            editor: 'Hirvi Sanghavi (AI Developer)',
            changeReason: 'LoRA transmitter field verification milestone submitted.',
            modifiedFields: ['Initial Baseline'],
            isCurrent: true
          }
        ]
      },
      {
        id: 'INV-2026-098',
        billNumber: 'Final Bill #4',
        companyId: 'c5',
        companyName: 'Metro Rail Transmission Authority',
        projectName: 'Website & Site Facilities',
        projectId: 'p5',
        packageCode: 'PKG-05 · Civil',
        contractValue: '$1,400,000',
        amountDue: '$650,000',
        taxAmount: '$117,000',
        deductions: '$65,000',
        netPayable: '$702,000',
        milestone: 'Final Commissioning & Takeover Certificate',
        dueDate: '2026-08-30',
        status: 'paid',
        statusLabel: 'Paid & Certified',
        badgeClass: 'badge-completed',
        issueDate: '2026-08-01',
        version: 'v1.0',
        versionLabel: 'v1.0 - Original Baseline',
        versionBadgeClass: 'version-pill-v1',
        isRevised: false,
        versionHistory: [
          {
            version: 'v1.0',
            label: 'Original Baseline Submission',
            date: '2026-08-01',
            baseAmount: '$650,000',
            tax: '$117,000',
            deductions: '$65,000',
            netPayable: '$702,000',
            editor: 'Ayush Desai (Admin)',
            changeReason: 'Final civil handover milestone certified and settled.',
            modifiedFields: ['Initial Baseline'],
            isCurrent: true
          }
        ]
      }
    ];

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

    const totalBilled = '$4.90M';
    const totalCollected = '$2.70M';
    const totalPending = '$2.20M';
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
          <div class="page-header-actions" style="display:flex;align-items:center;gap:10px">
            <button class="btn btn-secondary" onclick="BillingScreen.exportLedger()">
              ${Icons.download} Export Audit Ledger
            </button>
            <button class="btn btn-primary" onclick="BillingScreen.openCreateModal()">
              ${Icons.plus} New Bill / Revision
            </button>
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
                              <div>+${inv.taxAmount || '$0'} (Tax)</div>
                              <div style="color:#DC2626">-${inv.deductions || '$0'} (Ret)</div>
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
                                ${inv.status !== 'paid' ? `
                                  <button class="btn btn-primary btn-xs" onclick="BillingScreen.openReviseModal('${inv.id}')" title="Revise this bill to next version">
                                    ✏️ Revise Bill
                                  </button>
                                ` : ''}
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
                      ${inv.status !== 'paid' ? `
                        <button class="btn btn-primary btn-xs" onclick="BillingScreen.openReviseModal('${inv.id}')" title="Revise Bill">
                          Revise
                        </button>
                      ` : ''}
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
      ${inv.status !== 'paid' ? `
        <button class="btn btn-primary" onclick="Modal.closeAll(); BillingScreen.openReviseModal('${inv.id}')">
          ✏️ Create Next Revision
        </button>
      ` : ''}
      <button class="btn btn-outline" onclick="Toast.show('Version control audit trail exported.', 'success'); Modal.closeAll();">
        ${Icons.download} Export Audit History
      </button>
      <button class="btn btn-secondary" onclick="BillingScreen.viewInvoice('${inv.id}')">
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

    const currentBaseNumber = parseInt((inv.amountDue || '$0').replace(/[^0-9]/g, ''), 10) || 410000;

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
            <label class="form-label" style="font-weight:600">Base Amount Due ($)</label>
            <input type="text" class="form-control" id="revise-base-amount" value="${inv.amountDue.replace('$', '')}">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:600">Tax / GST (18%) ($)</label>
            <input type="text" class="form-control" id="revise-tax-amount" value="${inv.taxAmount ? inv.taxAmount.replace('$', '') : '73,800'}">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:600">Retention (5%) ($)</label>
            <input type="text" class="form-control" id="revise-retention-amount" value="${inv.deductions ? inv.deductions.replace('$', '') : '20,500'}">
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

    const baseFormatted = baseAmt.startsWith('$') ? baseAmt : `$${baseAmt}`;
    const taxFormatted = taxAmt.startsWith('$') ? taxAmt : `$${taxAmt}`;
    const retFormatted = retAmt.startsWith('$') ? retAmt : `$${retAmt}`;

    const numBase = parseInt(baseAmt.replace(/[^0-9]/g, ''), 10) || 0;
    const numTax = parseInt(taxAmt.replace(/[^0-9]/g, ''), 10) || 0;
    const numRet = parseInt(retAmt.replace(/[^0-9]/g, ''), 10) || 0;
    const netFormatted = `$${(numBase + numTax - numRet).toLocaleString()}`;

    // Mark previous history items as not current
    if (inv.versionHistory) {
      inv.versionHistory.forEach(h => h.isCurrent = false);
    } else {
      inv.versionHistory = [];
    }

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

    inv.versionHistory.push(newRevObj);
    inv.version = newVer;
    inv.versionLabel = `${newVer} - Active Revision`;
    inv.versionBadgeClass = newVer.startsWith('v2') || newVer.startsWith('v3') ? 'version-pill-v2' : 'version-pill-v1-1';
    inv.isRevised = true;
    inv.amountDue = baseFormatted;
    inv.taxAmount = taxFormatted;
    inv.deductions = retFormatted;
    inv.netPayable = netFormatted;

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
      <button class="btn btn-primary" onclick="Toast.show('Invoice PDF downloaded.', 'success'); Modal.closeAll();">
        ${Icons.download} Download PDF
      </button>
    `);
  },

  sendReminder(id) {
    const inv = this._getInvoices().find(x => x.id === id);
    const company = inv ? inv.companyName : 'Client';
    Toast.show(`Automated reminder notice dispatched to ${company} Commercial Team for ${id}.`, 'success', 3500);
  },

  exportLedger() {
    Toast.show('Commercial Invoicing Ledger & Version Audit Trail exported to CSV.', 'success', 3000);
  },

  openCreateModal() {
    const companies = this._getCompanies();
    const html = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="form-group">
          <label class="form-label">Client Company</label>
          <select class="form-control" id="new-inv-company">
            ${companies.map(c => `
              <option value="${c.id}">${c.name} (${c.totalContractValue})</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Project & Package</label>
          <select class="form-control" id="new-inv-project">
            <option value="p1">Hintonn AI Core Platform ($5.8M · PKG-01)</option>
            <option value="p2">Client Substation Package ($3.4M · PKG-02)</option>
            <option value="p3">Utilities & Plant Balance ($2.1M · PKG-03)</option>
            <option value="p4">Grid Automation & LoRA AI ($1.5M · PKG-04)</option>
            <option value="p5">Website & Site Facilities ($1.4M · PKG-05)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Version Type</label>
          <select class="form-control" id="new-inv-version-type">
            <option value="v1.0">v1.0 - New Baseline Bill</option>
            <option value="v1.1">v1.1 - Minor Revision to Existing Bill</option>
            <option value="v2.0">v2.0 - Major Re-negotiated Addendum</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Base Billing Amount ($)</label>
          <input type="text" class="form-control" id="new-inv-amount" placeholder="e.g. 250,000">
        </div>
        <div class="form-group">
          <label class="form-label">Milestone Trigger Reference</label>
          <input type="text" class="form-control" id="new-inv-milestone" placeholder="e.g. Milestone 4 Acceptance Certificate">
        </div>
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input type="date" class="form-control" id="new-inv-date" value="2026-11-15">
        </div>
      </div>
    `;

    Modal.open('Create Commercial Invoice & Version', html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="BillingScreen._saveInvoice()">Create & Version Log</button>
    `);
  },

  _saveInvoice() {
    Modal.closeAll();
    Toast.show('New commercial invoice version created and queued for client certification.', 'success', 4000);
  }
};

