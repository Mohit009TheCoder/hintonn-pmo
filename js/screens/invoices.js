// ─── Invoices Screen (Project-Based Invoice System) ───
// Invoices are created against REAL projects from the workspace (no seed data).
// Lifecycle: draft → sent → approved → paid. Amounts are stored as numbers.
const InvoicesScreen = {
  _filter: 'all',        // 'all' | 'draft' | 'sent' | 'approved' | 'paid'
  _projectFilter: 'all',
  _search: '',

  // ─── Indian Currency Formatter ───
  _fmtINR(n) {
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
    return (isNeg ? '–₹' : '₹') + result;
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
    if (intNum >= 10000000) result += convertBelow1000(Math.floor(intNum / 10000000)) + ' Crore ';
    if (intNum >= 100000) result += convertBelow1000(Math.floor((intNum % 10000000) / 100000)) + ' Lakh ';
    if (intNum >= 1000) result += convertBelow1000(Math.floor((intNum % 100000) / 1000)) + ' Thousand ';
    if (intNum % 1000 > 0) result += convertBelow1000(intNum % 1000);
    result = result.trim();
    return result ? result + ' Only' : 'Zero';
  },

  // Hintonn AI seller profile (the invoicing entity)
  _seller: {
    legalName: 'Hintonn AI Private Limited',
    addressLine1: 'A-706, Titanium Square, Thaltej',
    addressLine2: 'Ahmedabad — 380054, Gujarat, India',
    gstin: '24AAICH8280N1Z0',
    email: 'accounts@hintonn.com'
  },

  _getInvoices() { return Store.getInvoices(); },
  _getProjects() { return Store.getProjects(); },

  _statusMeta(status) {
    const map = {
      'draft':    { label: 'Draft',        badge: 'badge-secondary' },
      'sent':     { label: 'Sent',         badge: 'badge-primary' },
      'approved': { label: 'Approved',     badge: 'badge-active' },
      'paid':     { label: 'Paid',         badge: 'badge-success' }
    };
    return map[status] || map['draft'];
  },

  _isOverdue(inv) {
    if (!inv.dueDate || inv.status === 'paid' || inv.status === 'approved') return false;
    try {
      const due = new Date(inv.dueDate + 'T23:59:59');
      return !isNaN(due.getTime()) && due < new Date();
    } catch (e) { return false; }
  },

  // ─── Filtering ───
  _getFilteredInvoices() {
    let list = this._getInvoices();

    if (this._projectFilter !== 'all') {
      list = list.filter(i => i.projectId === this._projectFilter);
    }
    if (this._filter !== 'all') {
      list = list.filter(i => i.status === this._filter);
    }
    if (this._search) {
      const q = this._search.toLowerCase().trim();
      list = list.filter(i =>
        String(i.invoiceNumber || i.id || '').toLowerCase().includes(q) ||
        String(i.projectName || '').toLowerCase().includes(q) ||
        String(i.clientName || '').toLowerCase().includes(q) ||
        String(i.description || '').toLowerCase().includes(q)
      );
    }

    // Newest first
    return list.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  setFilter(f) { this._filter = f; this._refreshContainer(); },
  setProjectFilter(pid) { this._projectFilter = pid; this._refreshContainer(); },

  onSearch(val) {
    this._search = val;
    const clearBtn = document.getElementById('invoice-search-clear');
    if (clearBtn) {
      if (val) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }
    this._refreshContainer();
  },

  clearSearch() {
    this._search = '';
    const input = document.getElementById('invoice-search-input');
    if (input) { input.value = ''; input.focus(); }
    const clearBtn = document.getElementById('invoice-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    this._refreshContainer();
  },

  resetFilters() {
    this._filter = 'all';
    this._projectFilter = 'all';
    this._search = '';
    App.refresh();
  },

  _refreshContainer() {
    const container = document.getElementById('invoices-content-view');
    if (container) {
      container.innerHTML = this._renderList(this._getFilteredInvoices());
    } else {
      App.refresh();
    }
  },

  // ─── Main Screen Render ───
  render() {
    const allInvoices = this._getInvoices();
    const projects = this._getProjects();
    const invoices = this._getFilteredInvoices();

    const draftCount = allInvoices.filter(i => i.status === 'draft').length;
    const sentCount = allInvoices.filter(i => i.status === 'sent').length;
    const approvedCount = allInvoices.filter(i => i.status === 'approved').length;
    const paidCount = allInvoices.filter(i => i.status === 'paid').length;

    const totalValue = allInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const pendingValue = allInvoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const paidValue = allInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const linkedProjects = new Set(allInvoices.map(i => i.projectId).filter(Boolean)).size;

    return `
      <div class="invoices-screen" id="invoices">

        <!-- Page Header -->
        <div class="page-header" style="margin-bottom:18px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px">
          <div class="page-header-left">
            <h1>Invoices</h1>
            <p>Project-based invoicing — raise invoices against your real projects, track them from draft to payment, and print GST-ready tax invoices.</p>
          </div>
          <div class="page-header-actions" style="display:flex;align-items:center;gap:10px;margin-left:auto">
            <button class="btn btn-primary" onclick="InvoicesScreen.openCreateModal()" style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;font-weight:700;font-size:13.5px;box-shadow:0 2px 10px rgba(37,99,235,0.25);border-radius:8px">
              ${Icons.plus} Create Invoice
            </button>
          </div>
        </div>

        <!-- KPI Strip -->
        <div class="kpi-grid" style="margin-bottom:20px">
          <div class="kpi-card" onclick="InvoicesScreen.setFilter('all')" style="cursor:pointer">
            <div class="kpi-header">
              <span class="kpi-label">Total Invoices</span>
              <div class="kpi-icon-wrap">${Icons.fileText}</div>
            </div>
            <div class="kpi-value">${allInvoices.length}</div>
            <div class="kpi-change neutral" style="font-weight:600;color:var(--color-primary-700)">
              ${this._fmtINR(totalValue)} Total Value · ${linkedProjects} Projects
            </div>
          </div>

          <div class="kpi-card" onclick="InvoicesScreen.setFilter('sent')" style="cursor:pointer">
            <div class="kpi-header">
              <span class="kpi-label">Awaiting Approval</span>
              <div class="kpi-icon-wrap">${Icons.clock}</div>
            </div>
            <div class="kpi-value">${sentCount} Sent</div>
            <div class="kpi-change neutral" style="font-weight:600;color:var(--color-ai-700)">
              ${draftCount} Draft · ${approvedCount} Approved
            </div>
          </div>

          <div class="kpi-card" onclick="InvoicesScreen.setFilter('paid')" style="cursor:pointer">
            <div class="kpi-header">
              <span class="kpi-label">Paid</span>
              <div class="kpi-icon-wrap">${Icons.check}</div>
            </div>
            <div class="kpi-value">${paidCount} Invoices</div>
            <div class="kpi-change neutral" style="font-weight:600;color:var(--color-success-700, #059669)">
              ${this._fmtINR(paidValue)} Collected
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">Pending Value</span>
              <div class="kpi-icon-wrap">${Icons.dollarSign}</div>
            </div>
            <div class="kpi-value" style="font-size:20px">${this._fmtINR(pendingValue)}</div>
            <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
              Across ${allInvoices.length - paidCount} unpaid invoices
            </div>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="section-card" style="margin-bottom:20px;padding:14px 18px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              <div class="timeline-stage-tabs" style="margin:0">
                <button class="timeline-stage-tab ${this._filter==='all'?'active':''}" onclick="InvoicesScreen.setFilter('all')">
                  All (${allInvoices.length})
                </button>
                <button class="timeline-stage-tab ${this._filter==='draft'?'active':''}" onclick="InvoicesScreen.setFilter('draft')">
                  Draft (${draftCount})
                </button>
                <button class="timeline-stage-tab ${this._filter==='sent'?'active':''}" onclick="InvoicesScreen.setFilter('sent')">
                  Sent (${sentCount})
                </button>
                <button class="timeline-stage-tab ${this._filter==='approved'?'active':''}" onclick="InvoicesScreen.setFilter('approved')">
                  Approved (${approvedCount})
                </button>
                <button class="timeline-stage-tab ${this._filter==='paid'?'active':''}" onclick="InvoicesScreen.setFilter('paid')">
                  Paid (${paidCount})
                </button>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              <select class="form-select form-control-sm" style="width:220px;height:32px;font-size:12.5px"
                      onchange="InvoicesScreen.setProjectFilter(this.value)">
                <option value="all" ${this._projectFilter==='all'?'selected':''}>All Projects (${projects.length})</option>
                ${projects.map(p => `
                  <option value="${p.id}" ${this._projectFilter===p.id?'selected':''}>${p.name}</option>
                `).join('')}
              </select>

              <div class="search-input-wrap" style="width:240px">
                <span class="search-icon">${Icons.search}</span>
                <input type="text" id="invoice-search-input" class="form-input search-input" style="height:32px;font-size:12.5px"
                       placeholder="Search invoice #, project, client..."
                       value="${Utils.escapeHtml(this._search)}"
                       oninput="InvoicesScreen.onSearch(this.value)">
                <button type="button" id="invoice-search-clear" class="search-clear-btn ${this._search ? '' : 'hidden'}" onclick="InvoicesScreen.clearSearch()" title="Clear search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Dynamic Invoice List -->
        <div id="invoices-content-view">
          ${this._renderList(invoices)}
        </div>

      </div>
    `;
  },

  // ─── Invoice List / Table ───
  _renderList(invoices) {
    if (invoices.length === 0) {
      const hasAny = this._getInvoices().length > 0;
      return `
        <div class="section-card" style="padding:48px 32px;text-align:center">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--color-primary-50);color:var(--color-primary-700);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            ${Icons.fileText}
          </div>
          <h3 style="font-size:16px;font-weight:700;color:var(--color-text-primary);margin:0 0 6px">
            ${hasAny ? 'No invoices match your filters' : 'No invoices yet'}
          </h3>
          <p style="font-size:13.5px;color:var(--color-text-muted);margin:0 0 18px;max-width:420px;margin-left:auto;margin-right:auto">
            ${hasAny
              ? 'Try different filters, or reset them to see all invoices.'
              : 'Invoices are raised against your projects. Create your first invoice to get started — it will be linked to a real project in this workspace.'}
          </p>
          <div style="display:flex;align-items:center;justify-content:center;gap:10px">
            ${hasAny ? `
              <button class="btn btn-secondary btn-sm" onclick="InvoicesScreen.resetFilters()">Reset Filters</button>
            ` : ''}
            <button class="btn btn-primary btn-sm" onclick="InvoicesScreen.openCreateModal()">
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
                <th>Project</th>
                <th>Client</th>
                <th>Description</th>
                <th class="num">Amount</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th class="center">Status</th>
                <th class="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => {
                const meta = this._statusMeta(inv.status);
                const overdue = this._isOverdue(inv);
                return `
                  <tr>
                    <td>
                      <span style="font-family:var(--font-mono, monospace);font-weight:700;font-size:12.5px;color:var(--color-text-primary);cursor:pointer"
                            onclick="InvoicesScreen.openPreview('${inv.id}')">
                        ${Utils.escapeHtml(inv.invoiceNumber || inv.id)}
                      </span>
                    </td>
                    <td>
                      <div style="font-weight:600;color:var(--color-text-primary);font-size:12.5px;cursor:pointer"
                           onclick="App.navigate('project-detail','${inv.projectId}')">
                        ${Utils.escapeHtml(inv.projectName || '—')}
                      </div>
                    </td>
                    <td style="font-size:12.5px;color:var(--color-text-secondary)">
                      ${Utils.escapeHtml(inv.clientName || '—')}
                    </td>
                    <td style="font-size:12px;color:var(--color-text-muted);max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
                        title="${Utils.escapeHtml(inv.description || '')}">
                      ${Utils.escapeHtml(inv.description || '—')}
                    </td>
                    <td class="num" style="font-weight:700;font-size:13px;color:var(--color-text-primary)">
                      ${this._fmtINR(Number(inv.totalAmount) || 0)}
                    </td>
                    <td style="font-size:12px;color:var(--color-text-secondary);white-space:nowrap">
                      ${Utils.formatDate(inv.issueDate)}
                    </td>
                    <td style="font-size:12px;color:${overdue ? '#DC2626' : 'var(--color-text-secondary)'};white-space:nowrap;font-weight:${overdue ? '700' : '400'}">
                      ${Utils.formatDate(inv.dueDate)}
                      ${overdue ? '<div style="font-size:10px;color:#DC2626;font-weight:700">OVERDUE</div>' : ''}
                    </td>
                    <td class="center">
                      <span class="badge ${meta.badge}">${meta.label}</span>
                    </td>
                    <td class="center">
                      <div style="display:flex;align-items:center;justify-content:center;gap:5px;flex-wrap:wrap">
                        <button class="btn btn-primary btn-xs" onclick="InvoicesScreen.openPreview('${inv.id}')" title="Preview Invoice">
                          View
                        </button>
                        ${inv.status !== 'paid' ? `
                          <button class="btn btn-outline btn-xs" onclick="InvoicesScreen.advanceStatus('${inv.id}')" title="Move to next status">
                            ${inv.status === 'draft' ? 'Send' : inv.status === 'sent' ? 'Approve' : 'Mark Paid'}
                          </button>
                        ` : ''}
                        <button class="btn btn-ghost btn-xs" onclick="InvoicesScreen.printInvoice('${inv.id}')" title="Print / PDF">
                          🖨️
                        </button>
                        <button class="btn btn-ghost btn-xs" onclick="InvoicesScreen.deleteInvoice('${inv.id}')" title="Delete Invoice" style="color:#DC2626">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ─── Create Invoice Modal ───
  _formState: null,

  openCreateModal() {
    const projects = this._getProjects();
    if (projects.length === 0) {
      Modal.confirm(
        'No Projects Found',
        'Invoices are raised against projects. Create a project first, then come back to raise an invoice for it.',
        () => App.navigate('projects'),
        { confirmText: 'Go to Projects' }
      );
      return;
    }

    const today = new Date();
    const due = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    this._formState = {
      projectId: projects[0].id,
      clientName: '',
      clientAddress: '',
      clientGstin: '',
      description: '',
      issueDate: today.toISOString().split('T')[0],
      dueDate: due.toISOString().split('T')[0],
      gstRate: 18,
      notes: 'Payment due within 30 days of invoice date. Please quote the invoice number on all remittances.',
      items: [
        { description: '', quantity: 1, unit: 'Nos', rate: 0 }
      ]
    };

    const html = this._renderCreateModalBody();
    Modal.open('Create Invoice', html, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="InvoicesScreen.saveInvoice()" style="display:inline-flex;align-items:center;gap:6px">
        ${Icons.check} Create Invoice
      </button>
    `, { extraLarge: true });

    setTimeout(() => this._recalcForm(), 50);
  },

  _renderCreateModalBody() {
    const s = this._formState;
    const projects = this._getProjects();
    const selected = projects.find(p => p.id === s.projectId) || projects[0];

    return `
      <div style="display:flex;flex-direction:column;gap:16px;font-size:13px">

        <!-- Invoice Identity -->
        <div style="padding:12px 16px;background:linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%);border:1px solid #BFDBFE;border-radius:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:38px;height:38px;border-radius:8px;background:#2563EB;color:#FFF;display:flex;align-items:center;justify-content:center;font-size:18px">
              🧾
            </div>
            <div>
              <div style="font-weight:800;font-size:14.5px;color:#1E3A8A">NEW PROJECT INVOICE</div>
              <div style="font-size:11px;color:var(--color-text-muted)">
                ${Utils.escapeHtml(this._seller.legalName)} · GSTIN ${this._seller.gstin}
              </div>
            </div>
          </div>
          <span class="badge" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;font-size:11px;font-weight:700;padding:3px 10px">
            Invoice # auto-generated
          </span>
        </div>

        <!-- 1. Project & Client -->
        <div class="section-card no-pad" style="border:1px solid var(--color-border);border-radius:8px;padding:16px;background:var(--color-surface)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;border-bottom:1px solid var(--color-border);padding-bottom:10px">
            <span style="width:4px;height:16px;background:#4F46E5;border-radius:2px;display:inline-block"></span>
            <span style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:var(--color-text-primary)">
              Project &amp; Client Details
            </span>
          </div>

          <div class="form-group" style="margin-bottom:12px">
            <label class="form-label" style="font-weight:600;font-size:12px">Project <span style="color:#DC2626">*</span></label>
            <select class="form-control" id="inv-project" onchange="InvoicesScreen._onProjectChange(this.value)">
              ${projects.map(p => `
                <option value="${p.id}" ${s.projectId===p.id?'selected':''}>${p.name} (${Utils.humanize(p.status)})</option>
              `).join('')}
            </select>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px">
              ${selected ? `${selected.type || 'Project'} · Started ${Utils.formatDate(selected.startDate)} · ${selected.progress || 0}% complete` : ''}
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:12px;margin-bottom:10px">
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:600;font-size:12px">Client / Company Name <span style="color:#DC2626">*</span></label>
              <input type="text" class="form-control" id="inv-client-name" placeholder="e.g. Mumbai Metropolitan Region Development Authority"
                     value="${Utils.escapeHtml(s.clientName)}"
                     oninput="InvoicesScreen._formState.clientName = this.value">
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:600;font-size:12px">Client GSTIN / Tax ID</label>
              <input type="text" class="form-control" id="inv-client-gstin" placeholder="e.g. 27AAALM1234A1Z9"
                     value="${Utils.escapeHtml(s.clientGstin)}"
                     oninput="InvoicesScreen._formState.clientGstin = this.value">
            </div>
          </div>

          <div class="form-group" style="margin-bottom:0">
            <label class="form-label" style="font-weight:600;font-size:12px">Client Address</label>
            <input type="text" class="form-control" id="inv-client-address" placeholder="e.g. Bandra-Kurla Complex, Bandra (E), Mumbai — 400051"
                   value="${Utils.escapeHtml(s.clientAddress)}"
                   oninput="InvoicesScreen._formState.clientAddress = this.value">
          </div>
        </div>

        <!-- 2. Invoice Meta -->
        <div class="section-card no-pad" style="border:1px solid var(--color-border);border-radius:8px;padding:16px;background:var(--color-surface)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;border-bottom:1px solid var(--color-border);padding-bottom:10px">
            <span style="width:4px;height:16px;background:#2563EB;border-radius:2px;display:inline-block"></span>
            <span style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:var(--color-text-primary)">
              Invoice Details
            </span>
          </div>

          <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;margin-bottom:10px">
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:600;font-size:12px">Description / Milestone <span style="color:#DC2626">*</span></label>
              <input type="text" class="form-control" id="inv-description" placeholder="e.g. Monthly progress billing — September 2026"
                     value="${Utils.escapeHtml(s.description)}"
                     oninput="InvoicesScreen._formState.description = this.value">
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:600;font-size:12px">Issue Date</label>
              <input type="date" class="form-control" id="inv-issue-date" value="${s.issueDate}"
                     oninput="InvoicesScreen._formState.issueDate = this.value">
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:600;font-size:12px">Due Date</label>
              <input type="date" class="form-control" id="inv-due-date" value="${s.dueDate}"
                     oninput="InvoicesScreen._formState.dueDate = this.value">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 3fr;gap:12px">
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:600;font-size:12px">GST Rate %</label>
              <input type="number" class="form-control" id="inv-gst-rate" value="${s.gstRate}" min="0" max="28" step="0.5"
                     oninput="InvoicesScreen._formState.gstRate = parseFloat(this.value)||0; InvoicesScreen._recalcForm()">
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:600;font-size:12px">Notes / Terms</label>
              <input type="text" class="form-control" id="inv-notes" value="${Utils.escapeHtml(s.notes)}"
                     oninput="InvoicesScreen._formState.notes = this.value">
            </div>
          </div>
        </div>

        <!-- 3. Line Items -->
        <div class="section-card no-pad" style="border:1px solid var(--color-border);border-radius:8px;padding:16px;background:var(--color-surface)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid var(--color-border);padding-bottom:10px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="width:4px;height:16px;background:#059669;border-radius:2px;display:inline-block"></span>
              <span style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:var(--color-text-primary)">
                Line Items
              </span>
            </div>
            <button type="button" class="btn btn-outline btn-xs" onclick="InvoicesScreen._addItemRow()" style="font-weight:600">
              ${Icons.plus} Add Line
            </button>
          </div>

          <div style="overflow-x:auto">
            <table class="table" style="margin:0;font-size:12px">
              <thead>
                <tr style="background:var(--color-bg-page)">
                  <th style="min-width:260px;text-align:left">Description</th>
                  <th style="width:90px">Qty</th>
                  <th style="width:80px">Unit</th>
                  <th class="num" style="width:130px">Rate (₹)</th>
                  <th class="num" style="width:130px">Amount (₹)</th>
                  <th style="width:40px"></th>
                </tr>
              </thead>
              <tbody id="inv-items-tbody">
                ${this._renderItemRows()}
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:16px;padding-top:14px;border-top:1px solid var(--color-border);flex-wrap:wrap;gap:16px">
            <div style="flex:1;min-width:260px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:12px 14px">
              <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;color:#64748B;letter-spacing:0.5px;margin-bottom:4px">
                Amount in words (incl. GST)
              </div>
              <div id="inv-words-preview" style="font-size:12.5px;font-weight:600;color:#1E3A8A;line-height:1.5">
                Indian Rupees Zero Only (incl. GST).
              </div>
            </div>

            <div style="width:320px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:6px;padding:10px 14px;font-size:12px">
              <div style="display:flex;justify-content:space-between;padding:4px 0">
                <span style="color:var(--color-text-secondary)">Taxable Value:</span>
                <strong id="inv-sum-taxable">₹0</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding:4px 0;color:#059669">
                <span>Add: GST (<span id="inv-gst-label">${s.gstRate}</span>%):</span>
                <strong id="inv-sum-gst">₹0</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding:6px 0;border-top:2px solid var(--color-border);font-size:13.5px;font-weight:800;color:var(--color-text-primary)">
                <span>Total Payable:</span>
                <span id="inv-sum-total">₹0</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  _renderItemRows() {
    const items = (this._formState && this._formState.items) ? this._formState.items : [];
    return items.map((it, idx) => {
      const amount = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
      return `
        <tr style="border-bottom:1px solid var(--color-border)">
          <td style="padding:6px 8px">
            <input type="text" class="form-control" style="font-size:12px"
                   value="${Utils.escapeHtml(it.description || '')}" placeholder="Service / deliverable description"
                   oninput="InvoicesScreen._onItemFieldChange(${idx}, 'description', this.value)">
          </td>
          <td style="padding:6px 8px">
            <input type="number" class="form-control" style="text-align:right;font-size:12px" value="${it.quantity}" min="0" step="1"
                   oninput="InvoicesScreen._onItemFieldChange(${idx}, 'quantity', parseFloat(this.value)||0)">
          </td>
          <td style="padding:6px 8px">
            <input type="text" class="form-control" style="font-size:12px" value="${Utils.escapeHtml(it.unit || 'Nos')}"
                   oninput="InvoicesScreen._onItemFieldChange(${idx}, 'unit', this.value)">
          </td>
          <td class="num" style="padding:6px 8px">
            <input type="number" class="form-control" style="text-align:right;font-weight:600;font-size:12px" value="${it.rate}" min="0" step="100"
                   oninput="InvoicesScreen._onItemFieldChange(${idx}, 'rate', parseFloat(this.value)||0)">
          </td>
          <td class="num" id="item-amount-${idx}" style="padding:6px 8px;font-weight:700;font-size:12px;color:var(--color-primary-700);text-align:right">
            ${this._fmtINR(amount)}
          </td>
          <td style="padding:6px 8px;text-align:center">
            ${items.length > 1 ? `
              <button type="button" class="btn btn-ghost btn-xs" onclick="InvoicesScreen._removeItemRow(${idx})" title="Remove Line" style="color:#DC2626;padding:2px 6px">
                ✕
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
  },

  _onProjectChange(projectId) {
    if (!this._formState) return;
    this._formState.projectId = projectId;
    // Soft-fill client name from project description context if empty
    const proj = Store.getProject(projectId);
    if (proj && !this._formState.clientName) {
      const nameInput = document.getElementById('inv-client-name');
      if (nameInput) nameInput.focus();
    }
  },

  _addItemRow() {
    if (!this._formState) return;
    this._formState.items.push({ description: '', quantity: 1, unit: 'Nos', rate: 0 });
    const tbody = document.getElementById('inv-items-tbody');
    if (tbody) tbody.innerHTML = this._renderItemRows();
    this._recalcForm();
  },

  _removeItemRow(idx) {
    if (!this._formState || this._formState.items.length <= 1) return;
    this._formState.items.splice(idx, 1);
    const tbody = document.getElementById('inv-items-tbody');
    if (tbody) tbody.innerHTML = this._renderItemRows();
    this._recalcForm();
  },

  _onItemFieldChange(idx, field, value) {
    if (!this._formState || !this._formState.items[idx]) return;
    this._formState.items[idx][field] = value;
    const amountEl = document.getElementById(`item-amount-${idx}`);
    if (amountEl) {
      const it = this._formState.items[idx];
      amountEl.textContent = this._fmtINR((Number(it.quantity) || 0) * (Number(it.rate) || 0));
    }
    this._recalcForm();
  },

  _recalcForm() {
    if (!this._formState) return;
    const items = this._formState.items || [];
    const gstRate = Number(this._formState.gstRate) || 0;

    let taxable = 0;
    items.forEach(it => {
      taxable += (Number(it.quantity) || 0) * (Number(it.rate) || 0);
    });
    const gstAmount = Math.round(taxable * (gstRate / 100));
    const total = taxable + gstAmount;

    const elTaxable = document.getElementById('inv-sum-taxable');
    const elGst = document.getElementById('inv-sum-gst');
    const elTotal = document.getElementById('inv-sum-total');
    const elWords = document.getElementById('inv-words-preview');
    const elGstLabel = document.getElementById('inv-gst-label');

    if (elTaxable) elTaxable.textContent = this._fmtINR(taxable);
    if (elGst) elGst.textContent = this._fmtINR(gstAmount);
    if (elTotal) elTotal.textContent = this._fmtINR(total);
    if (elWords) elWords.textContent = `Indian Rupees ${this._numberToWords(total)} (incl. GST).`;
    if (elGstLabel) elGstLabel.textContent = gstRate;
  },

  saveInvoice() {
    const s = this._formState;
    if (!s) return;

    // Validate
    const clientName = (document.getElementById('inv-client-name')?.value || s.clientName || '').trim();
    if (!clientName) {
      Toast.show('Please enter the client / company name.', 'error', 3500);
      document.getElementById('inv-client-name')?.focus();
      return;
    }
    const description = (document.getElementById('inv-description')?.value || s.description || '').trim();
    if (!description) {
      Toast.show('Please enter a description or milestone for this invoice.', 'error', 3500);
      document.getElementById('inv-description')?.focus();
      return;
    }

    const proj = Store.getProject(s.projectId);
    if (!proj) {
      Toast.show('Selected project no longer exists. Please pick another project.', 'error', 4000);
      return;
    }

    const items = (s.items || [])
      .map(it => ({
        description: (it.description || '').trim(),
        quantity: Number(it.quantity) || 0,
        unit: it.unit || 'Nos',
        rate: Number(it.rate) || 0,
        amount: (Number(it.quantity) || 0) * (Number(it.rate) || 0)
      }))
      .filter(it => it.description && it.amount > 0);

    if (items.length === 0) {
      Toast.show('Add at least one line item with a description and amount.', 'error', 3500);
      return;
    }

    const gstRate = Number(s.gstRate) || 0;
    const taxable = items.reduce((sum, it) => sum + it.amount, 0);
    const gstAmount = Math.round(taxable * (gstRate / 100));
    const totalAmount = taxable + gstAmount;

    const inv = Store.createInvoice({
      projectId: s.projectId,
      projectName: proj.name,
      clientName: clientName,
      clientAddress: (document.getElementById('inv-client-address')?.value || s.clientAddress || '').trim(),
      clientGstin: (document.getElementById('inv-client-gstin')?.value || s.clientGstin || '').trim(),
      description: description,
      issueDate: document.getElementById('inv-issue-date')?.value || s.issueDate,
      dueDate: document.getElementById('inv-due-date')?.value || s.dueDate,
      gstRate: gstRate,
      notes: (document.getElementById('inv-notes')?.value || s.notes || '').trim(),
      items: items,
      taxableAmount: taxable,
      gstAmount: gstAmount,
      totalAmount: totalAmount,
      status: 'draft'
    });

    this._formState = null;
    Modal.closeAll();
    Toast.show(`Invoice ${inv.invoiceNumber} created for ${proj.name}.`, 'success', 4000);
    App.refresh();

    setTimeout(() => this.openPreview(inv.id), 200);
  },

  // ─── Status Workflow ───
  advanceStatus(id) {
    const inv = Store.getInvoice(id);
    if (!inv) return;
    const next = { draft: 'sent', sent: 'approved', approved: 'paid' }[inv.status];
    if (!next) return;
    Store.updateInvoice(id, { status: next });
    const meta = this._statusMeta(next);
    Toast.show(`Invoice ${inv.invoiceNumber || id} marked as ${meta.label}.`, 'success', 3000);
    App.refresh();
  },

  setStatus(id, status) {
    const inv = Store.getInvoice(id);
    if (!inv) return;
    Store.updateInvoice(id, { status });
    Toast.show(`Invoice ${inv.invoiceNumber || id} updated to ${this._statusMeta(status).label}.`, 'success', 3000);
    App.refresh();
  },

  deleteInvoice(id) {
    const inv = Store.getInvoice(id);
    if (!inv) return;
    Modal.confirm(
      'Delete Invoice',
      `Are you sure you want to delete invoice ${inv.invoiceNumber || id}? This cannot be undone.`,
      () => {
        Store.deleteInvoice(id);
        Toast.show('Invoice deleted.', 'info', 3000);
        App.refresh();
      },
      { danger: true, confirmText: 'Delete' }
    );
  },

  // ─── Invoice Preview (in-app document) ───
  openPreview(id) {
    const inv = Store.getInvoice(id);
    if (!inv) {
      Toast.show('Invoice not found.', 'error');
      return;
    }
    const meta = this._statusMeta(inv.status);
    const docHtml = this._renderInvoiceDocument(inv);

    Modal.open(`Invoice: ${inv.invoiceNumber || inv.id}`, `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:8px 12px;background:var(--color-bg-page);border-radius:6px;border:1px solid var(--color-border)">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="badge ${meta.badge}">${meta.label}</span>
            ${this._isOverdue(inv) ? '<span class="badge badge-high">Overdue</span>' : ''}
          </div>
          <span style="font-size:12px;color:var(--color-text-secondary)">
            ${inv.status !== 'paid' ? `Next: <strong>${inv.status === 'draft' ? 'Send to client' : inv.status === 'sent' ? 'Client approval' : 'Record payment'}</strong>` : 'Fully settled'}
          </span>
        </div>
        <div class="proforma-doc-wrapper">${docHtml}</div>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      ${inv.status !== 'paid' ? `
        <button class="btn btn-outline" onclick="Modal.closeAll(); InvoicesScreen.advanceStatus('${inv.id}')">
          ${inv.status === 'draft' ? 'Mark as Sent' : inv.status === 'sent' ? 'Approve Invoice' : 'Mark as Paid'}
        </button>
      ` : ''}
      <button class="btn btn-primary" onclick="InvoicesScreen.printInvoice('${inv.id}')">
        🖨️ Print / Save as PDF
      </button>
    `, { extraLarge: true });
  },

  // ─── Rendered Invoice Document (shared by preview & print) ───
  _renderInvoiceDocument(inv, forPrint = false) {
    const seller = this._seller;
    const items = Array.isArray(inv.items) ? inv.items : [];
    const taxable = Number(inv.taxableAmount) || items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const gstRate = Number(inv.gstRate) || 0;
    const gstAmount = Number(inv.gstAmount) || Math.round(taxable * (gstRate / 100));
    const total = Number(inv.totalAmount) || (taxable + gstAmount);
    const meta = this._statusMeta(inv.status);
    const proj = Store.getProject(inv.projectId);

    const wrapperStyle = forPrint
      ? ''
      : 'background:#FFF;border:1px solid var(--color-border);border-radius:8px;padding:24px;color:#0F172A;font-size:12px;line-height:1.5';

    return `
      <div class="inv-doc" style="${wrapperStyle}">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
          <div>
            <div style="font-size:18px;font-weight:800;color:#0F172A">${Utils.escapeHtml(seller.legalName)}</div>
            <div style="font-size:11px;color:#475569;margin-top:2px">
              ${Utils.escapeHtml(seller.addressLine1)}<br>
              ${Utils.escapeHtml(seller.addressLine2)}<br>
              GSTIN: <strong>${Utils.escapeHtml(seller.gstin)}</strong> · ${Utils.escapeHtml(seller.email)}
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:17px;font-weight:800;color:#1E3A8A;letter-spacing:0.5px">TAX INVOICE</div>
            <div style="font-size:12px;font-weight:700;color:#0F172A;margin-top:4px;font-family:var(--font-mono, monospace)">
              ${Utils.escapeHtml(inv.invoiceNumber || inv.id)}
            </div>
            <div style="margin-top:4px"><span class="badge ${meta.badge}" style="font-size:10px">${meta.label}</span></div>
          </div>
        </div>

        <div style="height:3px;background:linear-gradient(90deg, #2563EB 0%, #7C3AED 100%);border-radius:2px;margin:14px 0"></div>

        <!-- Meta row -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:14px">
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:10px 12px">
            <div style="font-size:9.5px;font-weight:800;color:#4F46E5;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Billed To</div>
            <div style="font-size:12px;font-weight:700;color:#0F172A">${Utils.escapeHtml(inv.clientName || '—')}</div>
            <div style="font-size:10.5px;color:#334155;line-height:1.45">
              ${inv.clientAddress ? Utils.escapeHtml(inv.clientAddress) + '<br>' : ''}
              ${inv.clientGstin ? 'GSTIN: ' + Utils.escapeHtml(inv.clientGstin) : ''}
            </div>
          </div>
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:10px 12px">
            <div style="font-size:9.5px;font-weight:800;color:#4F46E5;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Invoice Meta</div>
            <div style="font-size:11px;color:#334155;line-height:1.6">
              <div><span style="color:#64748B">Project:</span> <strong style="color:#0F172A">${Utils.escapeHtml(inv.projectName || (proj ? proj.name : '—'))}</strong></div>
              <div><span style="color:#64748B">Issue Date:</span> <strong>${Utils.formatDate(inv.issueDate)}</strong></div>
              <div><span style="color:#64748B">Due Date:</span> <strong style="color:${this._isOverdue(inv) ? '#DC2626' : '#0F172A'}">${Utils.formatDate(inv.dueDate)}</strong></div>
            </div>
          </div>
        </div>

        ${inv.description ? `
          <div style="margin-bottom:12px;font-size:11.5px;color:#334155">
            <span style="font-weight:700;color:#0F172A">For:</span> ${Utils.escapeHtml(inv.description)}
          </div>
        ` : ''}

        <!-- Items table -->
        <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px">
          <thead>
            <tr style="background:#1E3A8A;color:#FFF">
              <th style="text-align:left;padding:6px 8px">#</th>
              <th style="text-align:left;padding:6px 8px">Description</th>
              <th style="text-align:center;padding:6px 8px">Qty</th>
              <th style="text-align:center;padding:6px 8px">Unit</th>
              <th style="text-align:right;padding:6px 8px">Rate (₹)</th>
              <th style="text-align:right;padding:6px 8px">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx) => `
              <tr style="border-bottom:1px solid #E2E8F0">
                <td style="padding:5px 8px;color:#334155">${idx + 1}</td>
                <td style="padding:5px 8px;color:#334155">${Utils.escapeHtml(it.description || '')}</td>
                <td style="padding:5px 8px;text-align:center;color:#334155">${it.quantity || 0}</td>
                <td style="padding:5px 8px;text-align:center;color:#334155">${Utils.escapeHtml(it.unit || 'Nos')}</td>
                <td style="padding:5px 8px;text-align:right;color:#334155">${this._fmtINR(Number(it.rate) || 0)}</td>
                <td style="padding:5px 8px;text-align:right;font-weight:700;color:#0F172A">${this._fmtINR(Number(it.amount) || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap">
          <div style="flex:1;min-width:220px;font-size:10.5px;color:#334155;line-height:1.5">
            <div style="font-weight:700;color:#0F172A;margin-bottom:2px">Amount in words:</div>
            Indian Rupees ${this._numberToWords(total)} (incl. GST @ ${gstRate}%)
          </div>
          <div style="width:280px;font-size:11px">
            <div style="display:flex;justify-content:space-between;padding:3px 6px">
              <span style="color:#64748B">Taxable Value:</span><strong>${this._fmtINR(taxable)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 6px;color:#059669">
              <span>GST @ ${gstRate}%:</span><strong>+ ${this._fmtINR(gstAmount)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px;border-top:2px solid #CBD5E1;font-weight:800;font-size:12.5px;color:#0F172A">
              <span>Total Payable:</span><span>${this._fmtINR(total)}</span>
            </div>
          </div>
        </div>

        <!-- Terms -->
        <div style="margin-top:16px;padding-top:10px;border-top:1px solid #E2E8F0;font-size:10px;color:#475569;line-height:1.5">
          <div style="font-weight:700;color:#0F172A;margin-bottom:2px">Terms &amp; Conditions:</div>
          ${Utils.escapeHtml(inv.notes || 'Payment due within 30 days of invoice date.')}
        </div>

        <!-- Signature -->
        <div style="display:flex;justify-content:flex-end;margin-top:28px">
          <div style="text-align:center">
            <div style="width:160px;border-top:1px solid #94A3B8;padding-top:4px;font-size:10.5px;color:#334155;font-weight:600">
              For ${Utils.escapeHtml(seller.legalName)}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ─── Standalone Print (A4, window.print → PDF) ───
  printInvoice(id) {
    const inv = Store.getInvoice(id);
    if (!inv) {
      Toast.show('Invoice not found.', 'error');
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Tax Invoice - ${inv.invoiceNumber || inv.id}</title>
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @page { size: A4 portrait; margin: 0 !important; }
  html, body { margin: 0; padding: 0; background: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0F172A; }
  @media screen {
    body { background: #E2E8F0; padding: 20px 0 40px 0; }
    .no-print-toolbar { width: 210mm; max-width: 800px; margin: 0 auto 16px auto; padding: 10px 18px; background: #1E3A8A; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; color: #FFF; }
    .inv-page { background: #FFF; width: 210mm; max-width: 800px; min-height: 297mm; margin: 0 auto 24px auto; padding: 16mm; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 4px; }
  }
  @media print {
    body { background: #FFF !important; margin: 0 !important; padding: 0 !important; }
    .no-print, .no-print-toolbar { display: none !important; }
    .inv-page { box-shadow: none !important; margin: 0 !important; padding: 16mm !important; width: 210mm !important; max-width: 210mm !important; min-height: 297mm !important; page-break-after: avoid !important; }
  }
  .print-btn { background: #2563EB; color: #FFF; border: none; padding: 8px 18px; border-radius: 5px; font-weight: 700; cursor: pointer; font-size: 13px; }
  .close-btn { background: rgba(255,255,255,0.2); color: #FFF; border: none; padding: 8px 14px; border-radius: 5px; cursor: pointer; font-size: 13px; margin-left: 8px; }
</style>
</head>
<body>
  <div class="no-print-toolbar no-print">
    <div style="font-weight:700;font-size:13.5px">Tax Invoice · ${inv.invoiceNumber || inv.id}</div>
    <div>
      <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="close-btn" onclick="window.close()">✕ Close</button>
    </div>
  </div>
  <div class="inv-page">
    ${this._renderInvoiceDocument(inv, true)}
  </div>
  <script>
    window.onload = function() {
      setTimeout(() => { try { window.print(); } catch(e) {} }, 500);
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
  }
};
