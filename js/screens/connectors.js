// ─── Connectors Screen (Data Sources, Webhooks, Notifications & Knowledge Layer Hub) ───
const ConnectorsScreen = {
  _tab: 'all',
  _searchQuery: '',
  _isUploading: false,
  _uploadProgress: 0,
  _isSyncingAll: false,

  _connections: {
    firebase: {
      id: 'firebase',
      category: 'notifications',
      name: 'Internal Notifications',
      service: '',
      icon: 'inbox',
      status: 'connected',
      statusLabel: 'Active · Real-time Push',
      description: 'Push critical project notifications, milestone alerts, and high-priority commercial triggers across team channels.',
      meta: [
        { label: 'Endpoints', value: '3 Active Channels' },
        { label: 'Latency', value: '38ms' },
        { label: 'Last Dispatch', value: 'Just now' }
      ],
      topics: ['task-updates', 'commercial-alerts', 'system-health', 'pmo-critical'],
      serverKey: 'AAAA9z...k3P8wX'
    },
    webhooks: {
      id: 'webhooks',
      category: 'webhooks',
      name: 'System Alerts',
      service: 'Internal Webhooks',
      icon: 'webhook',
      status: 'connected',
      statusLabel: 'Active · Delivering',
      description: 'Dispatches real-time JSON event payloads on project milestones, task state changes, and commercial deadlines to internal endpoints.',
      meta: [
        { label: 'Subscribed Events', value: '5 System Events' },
        { label: 'Success Rate', value: '99.9%' },
        { label: 'Last Dispatch', value: '4m ago' }
      ],
      endpoint: 'https://api.internal.hintonn.com/hooks/v1/pms-events',
      events: ['project.created', 'task.status_changed', 'milestone.completed', 'issue.raised', 'bg.expiry_warning']
    },
    sheets: {
      id: 'sheets',
      category: 'datasources',
      name: 'Google Sheets',
      service: 'Sheets API / Import Source',
      icon: 'googleSheets',
      status: 'connected',
      statusLabel: 'Connected · Hourly Sync',
      description: 'Sync project data from your PMO master sheets.',
      meta: [
        { label: 'Imported Rows', value: '1,420 Records' },
        { label: 'Last Sync', value: '18m ago' }
      ],
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      syncInterval: 'Hourly'
    },
    jira: {
      id: 'jira',
      category: 'datasources',
      name: 'Jira Software',
      service: 'Atlassian Cloud & Server',
      icon: 'jira',
      status: 'available',
      statusLabel: 'Available · Not Connected',
      description: 'Sync Jira projects, issues, tasks, and milestones with PMS.',
      meta: [
        { label: 'Data Scope', value: 'Projects & Issues' },
        { label: 'Sync', value: 'On Connect' }
      ],
      domain: '',
      projectKey: ''
    },
    slack: {
      id: 'slack',
      category: 'datasources',
      name: 'Slack Workspace',
      service: 'Slack Bot & PMO Channels',
      icon: 'slack',
      status: 'available',
      statusLabel: 'Available · Not Connected',
      description: 'Connect Slack channels to bring project conversations and updates into PMS.',
      meta: [
        { label: 'Channels', value: '#pmo-alerts, #project-alpha' },
        { label: 'AI Interaction', value: 'Enabled' }
      ],
      workspace: '',
      channel: '#pmo-alerts'
    },
    files: {
      id: 'files',
      category: 'datasources',
      name: 'Project Files & Documents',
      service: 'Document Ingestion Pipeline',
      icon: 'fileText',
      status: 'connected',
      statusLabel: 'Ingestion Active',
      description: 'Upload project documents and make their information available to the Knowledge Layer and AI Assistant.',
      meta: [
        { label: 'Indexed Files', value: '5 Documents' },
        { label: 'Supported Types', value: 'PDF, DOCX, XLSX, etc.' }
      ]
    }
  },

  _filesList: [
    {
      id: 'f-1',
      name: 'Hintonn_EPC_Project_Charter_v2.4.pdf',
      type: 'pdf',
      size: '3.8 MB',
      uploadedAt: '2026-09-23T14:30:00Z',
      status: 'synced',
      statusText: 'Synced to Knowledge Layer',
      chunks: 142,
      category: 'Project Charter'
    },
    {
      id: 'f-2',
      name: 'Q3_Commercial_Retention_Register.xlsx',
      type: 'xlsx',
      size: '1.2 MB',
      uploadedAt: '2026-09-24T06:15:00Z',
      status: 'synced',
      statusText: 'Synced to Knowledge Layer',
      chunks: 68,
      category: 'Commercial Data'
    },
    {
      id: 'f-3',
      name: 'Site_Safety_Inspection_Protocol_2026.docx',
      type: 'docx',
      size: '890 KB',
      uploadedAt: '2026-09-22T09:40:00Z',
      status: 'synced',
      statusText: 'Synced to Knowledge Layer',
      chunks: 48,
      category: 'Compliance & Safety'
    },
    {
      id: 'f-4',
      name: 'Milestone_Execution_Schedule_Phase3.pptx',
      type: 'pptx',
      size: '5.4 MB',
      uploadedAt: '2026-09-21T18:20:00Z',
      status: 'synced',
      statusText: 'Synced to Knowledge Layer',
      chunks: 96,
      category: 'Planning & Milestones'
    },
    {
      id: 'f-5',
      name: 'Subcontractor_Vendor_Rate_Master.csv',
      type: 'csv',
      size: '340 KB',
      uploadedAt: '2026-09-20T11:10:00Z',
      status: 'synced',
      statusText: 'Synced to Knowledge Layer',
      chunks: 36,
      category: 'Commercial Rates'
    }
  ],

  render() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';

    // If non-admin is somehow on webhooks tab, fallback to 'all'
    if (!isAdmin && this._tab === 'webhooks') {
      this._tab = 'all';
    }

    const connectionsList = isAdmin
      ? Object.values(this._connections)
      : Object.values(this._connections).filter(c => c.id !== 'webhooks');
    const totalConnectorsCount = connectionsList.length;
    const activeCount = connectionsList.filter(c => c.status === 'connected').length;
    const totalFiles = this._filesList.length;

    return `
      <div class="connectors-page-container">
        
        <!-- Header -->
        <div class="page-header" style="margin-bottom: 20px;">
          <div class="page-header-left">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <h1>Connectors</h1>
              <span class="badge badge-primary" style="font-size: 11px; padding: 3px 9px;">Enterprise Integration Hub</span>
              <span class="badge" style="background: var(--color-surface-active); color: var(--color-primary); font-size: 11px; border: 1px solid var(--color-border-brand);">${activeCount} Active</span>
            </div>
            <p>Connect your tools, data sources, and services to bring project information into PMS.</p>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-secondary btn-sm" onclick="ConnectorsScreen.openPipelineLogsModal()">
              ${Icons.activity} Integration Logs
            </button>
            <button class="btn btn-primary btn-sm" onclick="ConnectorsScreen.triggerSyncAll()" ${this._isSyncingAll ? 'disabled' : ''}>
              ${this._isSyncingAll ? '<span class="spinner" style="width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 0.8s linear infinite;"></span>' : Icons.refresh}
              <span>${this._isSyncingAll ? 'Synchronizing Sources...' : 'Sync All Sources'}</span>
            </button>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="connectors-kpi-grid">
          <div class="connector-kpi-card">
            <div class="kpi-icon-wrap" style="background: var(--color-primary-50); color: var(--color-primary);">
              ${Icons.connectors}
            </div>
            <div class="kpi-info">
              <div class="kpi-label">Active Connections</div>
              <div class="kpi-value">${activeCount} <span class="kpi-subtext">of ${totalConnectorsCount} connected</span></div>
            </div>
          </div>
          <div class="connector-kpi-card">
            <div class="kpi-icon-wrap" style="background: #FAF5FF; color: var(--color-ai);">
              ${Icons.fileText}
            </div>
            <div class="kpi-info">
              <div class="kpi-label">Indexed Documents</div>
              <div class="kpi-value">${totalFiles} <span class="kpi-subtext">Documents indexed</span></div>
            </div>
          </div>
          <div class="connector-kpi-card">
            <div class="kpi-icon-wrap" style="background: #EFF6FF; color: #1D4ED8;">
              ${Icons.database}
            </div>
            <div class="kpi-info">
              <div class="kpi-label">Knowledge Items</div>
              <div class="kpi-value">12,480 <span class="kpi-subtext">Items available to AI</span></div>
            </div>
          </div>
          <div class="connector-kpi-card">
            <div class="kpi-icon-wrap" style="background: var(--color-surface-active); color: var(--color-primary);">
              ${Icons.zap}
            </div>
            <div class="kpi-info">
              <div class="kpi-label">Pipeline Health</div>
              <div class="kpi-value">99.9% <span class="kpi-subtext" style="color:var(--color-primary);">Operational</span></div>
            </div>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="connectors-toolbar">
          <div class="connectors-tabs">
            <button class="connector-tab-btn ${this._tab === 'all' ? 'active' : ''}" onclick="ConnectorsScreen.setTab('all')">
              All Connectors (${totalConnectorsCount})
            </button>
            <button class="connector-tab-btn ${this._tab === 'datasources' ? 'active' : ''}" onclick="ConnectorsScreen.setTab('datasources')">
              Data Sources (4)
            </button>
            <button class="connector-tab-btn ${this._tab === 'notifications' ? 'active' : ''}" onclick="ConnectorsScreen.setTab('notifications')">
              Notifications (1)
            </button>
            ${isAdmin ? `
              <button class="connector-tab-btn ${this._tab === 'webhooks' ? 'active' : ''}" onclick="ConnectorsScreen.setTab('webhooks')">
                Webhooks (1)
              </button>
            ` : ''}
          </div>
          <div class="connectors-search-box">
            ${Icons.search}
            <input 
              type="text" 
              placeholder="Filter connectors or files..." 
              value="${this._searchQuery}" 
              oninput="ConnectorsScreen.onSearch(this.value)"
            />
            ${this._searchQuery ? `<button class="search-clear-btn" onclick="ConnectorsScreen.onSearch('')" style="display:flex;align-items:center;background:none;border:none;cursor:pointer;color:var(--color-text-muted);">${Icons.x}</button>` : ''}
          </div>
        </div>

        <!-- Section 1: Data Sources -->
        ${this._shouldShowSection('datasources') ? this._renderDataSourcesSection('01') : ''}

        <!-- Section 2: Notifications -->
        ${this._shouldShowSection('notifications') ? this._renderNotificationsSection('02') : ''}

        <!-- Section 3: Webhooks (Admin Only) -->
        ${isAdmin && this._shouldShowSection('webhooks') ? this._renderWebhooksSection('03') : ''}

        <!-- Files Upload & Document Manager Section -->
        ${this._shouldShowFilesArea() ? this._renderFilesUploadSection(isAdmin ? '04' : '03') : ''}

        <!-- Knowledge Layer Architecture Pipeline Section -->
        ${this._renderKnowledgeLayerSection(isAdmin)}

      </div>
    `;
  },

  _shouldShowSection(sectionName) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    if (sectionName === 'webhooks' && !isAdmin) return false;
    if (this._tab !== 'all' && this._tab !== sectionName) return false;
    if (!this._searchQuery) return true;
    const query = this._searchQuery.toLowerCase();
    
    if (sectionName === 'notifications') {
      return this._matchesSearch(this._connections.firebase, query);
    }
    if (sectionName === 'webhooks') {
      return isAdmin && this._matchesSearch(this._connections.webhooks, query);
    }
    if (sectionName === 'datasources') {
      return ['sheets', 'jira', 'slack', 'files'].some(k => this._matchesSearch(this._connections[k], query));
    }
    return true;
  },

  _shouldShowFilesArea() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const isAdmin = currentUser && currentUser.role === 'Admin';
    if (this._tab === 'notifications' || (isAdmin && this._tab === 'webhooks')) return false;
    if (!this._searchQuery) return true;
    const query = this._searchQuery.toLowerCase();
    if (this._matchesSearch(this._connections.files, query)) return true;
    return this._filesList.some(f => f.name.toLowerCase().includes(query) || f.type.toLowerCase().includes(query));
  },

  _matchesSearch(item, query) {
    if (!item) return false;
    return item.name.toLowerCase().includes(query) ||
      item.service.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);
  },

  _renderNotificationsSection(sectionNumber = '02') {
    const fcm = this._connections.firebase;
    return `
      <div class="connector-group-section">
        <div class="connector-group-header">
          <div class="group-title-wrap">
            <div class="group-indicator-pill">${sectionNumber}</div>
            <div>
              <h2 class="group-title">Notifications</h2>
              <p class="group-subtitle">Outbound notification dispatch and team push alerts</p>
            </div>
          </div>
          <span class="badge badge-primary" style="font-size: 11px;">1 Active Service</span>
        </div>

        <div class="connector-cards-grid">
          ${this._renderConnectorCard(fcm, `
            <button class="btn btn-secondary btn-sm" onclick="ConnectorsScreen.testFCMPush()">
              ${Icons.zap} Send Test Push
            </button>
            <button class="btn btn-primary btn-sm" onclick="ConnectorsScreen.openFCMModal()">
              ${Icons.settings} Configure
            </button>
          `)}
        </div>
      </div>
    `;
  },

  _renderWebhooksSection(sectionNumber = '03') {
    const wh = this._connections.webhooks;
    return `
      <div class="connector-group-section">
        <div class="connector-group-header">
          <div class="group-title-wrap">
            <div class="group-indicator-pill">${sectionNumber}</div>
            <div>
              <h2 class="group-title">Webhooks</h2>
              <p class="group-subtitle">Event streaming and real-time payload integration for PMS lifecycle events</p>
            </div>
          </div>
          <span class="badge badge-primary" style="font-size: 11px;">1 Active Service</span>
        </div>

        <div class="connector-cards-grid">
          ${this._renderConnectorCard(wh, `
            <button class="btn btn-secondary btn-sm" onclick="ConnectorsScreen.testWebhookEvent()">
              ${Icons.zap} Dispatch Event
            </button>
            <button class="btn btn-primary btn-sm" onclick="ConnectorsScreen.openWebhookModal()">
              ${Icons.settings} Manage Webhooks
            </button>
          `)}
        </div>
      </div>
    `;
  },

  _renderDataSourcesSection(sectionNumber = '01') {
    const sheets = this._connections.sheets;
    const jira = this._connections.jira;
    const slack = this._connections.slack;
    const files = this._connections.files;

    return `
      <div class="connector-group-section">
        <div class="connector-group-header">
          <div class="group-title-wrap">
            <div class="group-indicator-pill">${sectionNumber}</div>
            <div>
              <h2 class="group-title">Data Sources</h2>
              <p class="group-subtitle">Connect external project management repositories, spreadsheets, chat tools, and files</p>
            </div>
          </div>
          <span class="badge badge-primary" style="font-size: 11px;">4 Connectors</span>
        </div>

        <div class="connector-cards-grid connector-grid-2cols">
          
          <!-- Google Sheets Card -->
          ${this._renderConnectorCard(sheets, `
            <button class="btn btn-secondary btn-sm" onclick="ConnectorsScreen.openSheetsModal()">
              ${Icons.settings} Configure
            </button>
            <button class="btn btn-primary btn-sm" onclick="ConnectorsScreen.triggerSingleSync('sheets')">
              ${Icons.refresh} Sync Now
            </button>
          `)}

          <!-- Jira Card -->
          ${this._renderConnectorCard(jira, `
            ${jira.status === 'connected' ? `
              <button class="btn btn-secondary btn-sm" onclick="ConnectorsScreen.openJiraModal()">
                ${Icons.settings} Manage
              </button>
              <button class="btn btn-primary btn-sm" onclick="ConnectorsScreen.triggerSingleSync('jira')">
                ${Icons.refresh} Sync Epics
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="ConnectorsScreen.openJiraModal()">
                ${Icons.link} Connect Jira
              </button>
            `}
          `)}

          <!-- Slack Card -->
          ${this._renderConnectorCard(slack, `
            ${slack.status === 'connected' ? `
              <button class="btn btn-secondary btn-sm" onclick="ConnectorsScreen.openSlackModal()">
                ${Icons.settings} Manage
              </button>
              <button class="btn btn-primary btn-sm" onclick="ConnectorsScreen.testSlackMessage()">
                ${Icons.zap} Test Alert
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="ConnectorsScreen.openSlackModal()">
                ${Icons.link} Connect Slack
              </button>
            `}
          `)}

          <!-- Files Connector Card -->
          ${this._renderConnectorCard(files, `
            <button class="btn btn-secondary btn-sm" onclick="ConnectorsScreen.scrollToUpload()">
              ${Icons.folder} View Files (${this._filesList.length})
            </button>
            <button class="btn btn-primary btn-sm" onclick="ConnectorsScreen.triggerBrowseFile()">
              ${Icons.upload} Upload Files
            </button>
          `)}

        </div>
      </div>
    `;
  },

  _renderConnectorCard(connector, actionsHtml) {
    const isConnected = connector.status === 'connected';
    const iconSvg = Icons[connector.icon] || Icons.connectors;

    return `
      <div class="connector-card ${isConnected ? 'is-connected' : 'is-available'}" id="connector-card-${connector.id}">
        
        <div class="connector-card-top">
          <div class="connector-icon-badge ${isConnected ? 'active-icon' : 'neutral-icon'}">
            ${iconSvg}
          </div>
          <div class="connector-header-text">
            ${connector.service ? `<div class="connector-service-tag">${connector.service}</div>` : ''}
            <h3 class="connector-card-title">${connector.name}</h3>
          </div>
          <div class="connector-status-badge ${isConnected ? 'status-connected' : 'status-available'}">
            <span class="status-dot-pulse"></span>
            <span>${connector.statusLabel}</span>
          </div>
        </div>

        <p class="connector-card-desc">${connector.description}</p>

        <div class="connector-meta-grid">
          ${(connector.meta || []).map(m => `
            <div class="connector-meta-item">
              <span class="meta-item-label">${m.label}</span>
              <span class="meta-item-val">${m.value}</span>
            </div>
          `).join('')}
        </div>

        <div class="connector-card-footer">
          <div class="connector-card-status-info">
            ${isConnected ? `
              <span class="footer-indicator connected">
                ${Icons.checkCircle} Linked & Monitored
              </span>
            ` : `
              <span class="footer-indicator available">
                ${Icons.link} Ready for integration
              </span>
            `}
          </div>
          <div class="connector-card-actions">
            ${actionsHtml}
          </div>
        </div>

      </div>
    `;
  },

  _renderFilesUploadSection(sectionNumber = '04') {
    return `
      <div class="connector-group-section" id="files-upload-section">
        <div class="connector-group-header">
          <div class="group-title-wrap">
            <div class="group-indicator-pill">${sectionNumber}</div>
            <div>
              <h2 class="group-title">Document Repository & File Ingestion</h2>
              <p class="group-subtitle">Upload project deliverables, specifications, contracts, and matrices to feed the AI Knowledge Layer</p>
            </div>
          </div>
          <span class="badge" style="background:var(--color-primary-50);color:var(--color-primary);border:1px solid var(--color-border-brand);font-size:11px;">
            ${this._filesList.length} Documents Indexed
          </span>
        </div>

        <!-- Drag and Drop Box -->
        <div 
          class="connector-upload-dropzone ${this._isUploading ? 'uploading' : ''}" 
          id="connector-dropzone"
          ondragover="ConnectorsScreen.onDragOver(event)"
          ondragleave="ConnectorsScreen.onDragLeave(event)"
          ondrop="ConnectorsScreen.onDropFile(event)"
          onclick="ConnectorsScreen.triggerBrowseFile()"
        >
          <input 
            type="file" 
            id="connector-hidden-file-input" 
            style="display:none" 
            multiple 
            accept=".pdf,.docx,.xlsx,.csv,.pptx"
            onchange="ConnectorsScreen.onFileInputChange(event)"
          />

          <div class="dropzone-inner">
            <div class="dropzone-icon-circle">
              ${this._isUploading ? '<span class="spinner" style="width:24px;height:24px;border:3px solid var(--color-primary);border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 0.8s linear infinite;"></span>' : Icons.upload}
            </div>

            <div class="dropzone-text-block">
              <div class="dropzone-title">
                ${this._isUploading ? `Vectorizing & Processing Documents... (${this._uploadProgress}%)` : 'Drag and drop project files here, or <span class="dropzone-browse-link">browse files</span>'}
              </div>
              <div class="dropzone-subtitle">
                Automated OCR parsing & vector chunking supported for <strong>PDF, DOCX, XLSX, CSV, PPTX</strong> (up to 50MB)
              </div>
            </div>

            <div class="supported-badges-row">
              <span class="type-pill pill-pdf">PDF</span>
              <span class="type-pill pill-docx">DOCX</span>
              <span class="type-pill pill-xlsx">XLSX</span>
              <span class="type-pill pill-csv">CSV</span>
              <span class="type-pill pill-pptx">PPTX</span>
            </div>
          </div>

          ${this._isUploading ? `
            <div class="dropzone-progress-wrap">
              <div class="dropzone-progress-bar" style="width: ${this._uploadProgress}%"></div>
            </div>
          ` : ''}
        </div>

        <!-- Files List Table -->
        <div class="connector-files-card">
          <div class="files-card-header">
            <div style="display:flex;align-items:center;gap:10px">
              <h3 style="font-size:15px;font-weight:700;margin:0">Ingested Project Files</h3>
              <span class="badge badge-primary" style="font-size:11px">${this._filesList.length} Active in Knowledge Layer</span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="ConnectorsScreen.reindexAllFiles()">
              ${Icons.refresh} Re-index All Chunks
            </button>
          </div>

          <div class="connector-table-responsive">
            <table class="connector-files-table">
              <thead>
                <tr>
                  <th class="col-name">Document Name</th>
                  <th class="col-category">Category</th>
                  <th class="col-type">File Format</th>
                  <th class="col-size">Size</th>
                  <th class="col-chunks">Vector Chunks</th>
                  <th class="col-status">Status</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this._filesList.map(file => `
                  <tr id="file-row-${file.id}">
                    <td class="col-name">
                      <div class="file-name-cell">
                        <span class="file-type-icon ${file.type}">
                          ${this._getFileIcon(file.type)}
                        </span>
                        <div>
                          <div class="file-title-text">${file.name}</div>
                          <div class="file-date-subtext">Uploaded ${Utils.timeAgo(file.uploadedAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td class="col-category">
                      <span class="file-category-badge">${file.category || 'General'}</span>
                    </td>
                    <td class="col-type">
                      <span class="type-pill pill-${file.type}" style="font-size:11px">${file.type.toUpperCase()}</span>
                    </td>
                    <td class="col-size"><span class="file-size-text">${file.size}</span></td>
                    <td class="col-chunks">
                      <span class="vector-chunks-pill">
                        ${Icons.database} ${file.chunks} chunks
                      </span>
                    </td>
                    <td class="col-status">
                      <span class="file-status-tag ${file.status}">
                        ${file.status === 'synced' ? '<span class="status-check">✓</span>' : '<span class="status-dot"></span>'}
                        <span>${file.status === 'synced' ? 'Synced to Knowledge Layer' : (file.statusText || 'Synced to Knowledge Layer')}</span>
                      </span>
                    </td>
                    <td class="col-actions">
                      <div class="file-action-buttons">
                        <button type="button" class="file-action-btn file-action-view" title="View Document Details" onclick="ConnectorsScreen.openFilePreviewModal('${file.id}')" aria-label="View Details">
                          ${Icons.fileText}
                        </button>
                        <button type="button" class="file-action-btn file-action-sync" title="Sync / Re-index Vector Chunks" onclick="ConnectorsScreen.reindexFile('${file.id}')" aria-label="Sync">
                          ${Icons.refresh}
                        </button>
                        <button type="button" class="file-action-btn file-action-delete" title="Delete Document" onclick="ConnectorsScreen.removeFile('${file.id}')" aria-label="Delete">
                          ${Icons.trash}
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  _getFileIcon(type) {
    switch (type.toLowerCase()) {
      case 'pdf': return Icons.filePdf || Icons.fileText;
      case 'docx': return Icons.fileDocx || Icons.fileText;
      case 'xlsx': return Icons.fileXlsx || Icons.fileText;
      case 'csv': return Icons.fileCsv || Icons.fileText;
      case 'pptx': return Icons.filePptx || Icons.fileText;
      default: return Icons.file;
    }
  },

  _renderKnowledgeLayerSection(isAdmin = true) {
    const sourcesDetail = isAdmin
      ? 'FCM · Webhooks · Google Sheets · Jira · Slack · Files'
      : 'FCM · Google Sheets · Jira · Slack · Files';
    const streamCount = isAdmin ? '6 Data Streams' : '5 Data Streams';

    return `
      <div class="knowledge-layer-section">
        <div class="knowledge-layer-card">
          
          <div class="knowledge-layer-header">
            <div class="knowledge-badge-wrap">
              <span class="knowledge-pill">Intelligent Data Pipeline</span>
              <span class="knowledge-status-indicator">
                <span class="pulse-dot"></span> Active Vector Retrieval
              </span>
            </div>
            <h2 class="knowledge-card-title">Knowledge Layer & Data Flow</h2>
            <p class="knowledge-card-desc">
              Connected project information is processed through the Knowledge Layer and made available to the AI Assistant.
            </p>
          </div>

          <!-- Visual Flow Diagram -->
          <div class="knowledge-flow-diagram">
            
            <!-- Step 1: Connected Sources -->
            <div class="flow-step-box">
              <div class="flow-step-icon" style="background:var(--color-primary-50);color:var(--color-primary);">
                ${Icons.connectors}
              </div>
              <div class="flow-step-content">
                <div class="flow-step-tag">Step 1</div>
                <div class="flow-step-name">Connected Sources</div>
                <div class="flow-step-detail">${sourcesDetail}</div>
              </div>
              <div class="flow-step-status">
                <span class="flow-status-dot"></span> ${streamCount}
              </div>
            </div>

            <!-- Arrow 1 -->
            <div class="flow-connector-arrow">
              <div class="arrow-line"></div>
              <div class="arrow-tip">${Icons.chevronRight}</div>
            </div>

            <!-- Step 2: Knowledge Layer -->
            <div class="flow-step-box active-pulse-node">
              <div class="flow-step-icon" style="background:#FAF5FF;color:var(--color-ai);">
                ${Icons.database}
              </div>
              <div class="flow-step-content">
                <div class="flow-step-tag">Step 2</div>
                <div class="flow-step-name">Knowledge Layer</div>
                <div class="flow-step-detail">Parsing · Semantic Chunking · Vector Embeddings · RAG</div>
              </div>
              <div class="flow-step-status">
                <span class="flow-status-dot"></span> 12,480 Vectors
              </div>
            </div>

            <!-- Arrow 2 -->
            <div class="flow-connector-arrow">
              <div class="arrow-line"></div>
              <div class="arrow-tip">${Icons.chevronRight}</div>
            </div>

            <!-- Step 3: AI Assistant -->
            <div class="flow-step-box">
              <div class="flow-step-icon" style="background:#EFF6FF;color:#1D4ED8;">
                ${Icons.assistant}
              </div>
              <div class="flow-step-content">
                <div class="flow-step-tag">Step 3</div>
                <div class="flow-step-name">AI Assistant</div>
                <div class="flow-step-detail">Contextual Grounding · PM Copilot · Automated Insights</div>
              </div>
              <div class="flow-step-status">
                <span class="flow-status-dot"></span> Copilot Ready
              </div>
            </div>

          </div>

          <!-- Bottom Footer Action -->
          <div class="knowledge-layer-footer">
            <div class="knowledge-footer-info">
              <div style="font-size:13.5px;font-weight:600;color:var(--color-text-primary)">
                Ready for Natural Language Project Inquiries
              </div>
              <div style="font-size:12.5px;color:var(--color-text-muted)">
                Ask the AI Assistant questions grounded in your synchronized documents, spreadsheets, and task backlogs.
              </div>
            </div>
            <div class="knowledge-footer-actions">
              <button class="btn btn-primary btn-sm" onclick="App.navigate('ai-assistant')">
                ${Icons.assistant} Ask AI Copilot
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  // ─── Interaction Handlers & Filtering ───

  setTab(tab) {
    this._tab = tab;
    this.refresh();
  },

  onSearch(val) {
    this._searchQuery = (val || '').trim();
    this.refresh();
  },

  refresh() {
    const content = document.getElementById('page-content');
    if (content && App.currentScreen === 'connectors') {
      content.innerHTML = this.render();
    }
  },

  scrollToUpload() {
    const el = document.getElementById('files-upload-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  },

  // ─── Drag & Drop / File Selection ───

  triggerBrowseFile() {
    const input = document.getElementById('connector-hidden-file-input');
    if (input) input.click();
  },

  onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('connector-dropzone');
    if (dropzone) dropzone.classList.add('drag-over');
  },

  onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('connector-dropzone');
    if (dropzone) dropzone.classList.remove('drag-over');
  },

  onDropFile(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('connector-dropzone');
    if (dropzone) dropzone.classList.remove('drag-over');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      this.handleSelectedFiles(Array.from(e.dataTransfer.files));
    }
  },

  onFileInputChange(e) {
    if (e.target && e.target.files && e.target.files.length > 0) {
      this.handleSelectedFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  },

  handleSelectedFiles(files) {
    if (!files || files.length === 0) return;

    this._isUploading = true;
    this._uploadProgress = 10;
    this.refresh();

    const allowedExtensions = ['pdf', 'docx', 'xlsx', 'csv', 'pptx'];

    let interval = setInterval(() => {
      this._uploadProgress += 20;
      if (this._uploadProgress >= 100) {
        clearInterval(interval);
        this._isUploading = false;
        this._uploadProgress = 0;

        files.forEach((f, idx) => {
          const ext = f.name.split('.').pop().toLowerCase();
          const validExt = allowedExtensions.includes(ext) ? ext : 'pdf';
          const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
          const formattedSize = f.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.max(12, Math.round(f.size / 1024))} KB`;

          const newFile = {
            id: 'f-' + Date.now() + '-' + idx,
            name: f.name,
            type: validExt,
            size: formattedSize,
            uploadedAt: new Date().toISOString(),
            status: 'synced',
            statusText: 'Synced to Knowledge Layer',
            chunks: Math.floor(Math.random() * 80) + 20,
            category: 'Uploaded Document'
          };
          this._filesList.unshift(newFile);
        });

        Toast.show(`Successfully ingested and vectorized ${files.length} document${files.length > 1 ? 's' : ''}`, 'success');
        this.refresh();
      } else {
        this.refresh();
      }
    }, 250);
  },

  removeFile(fileId) {
    const file = this._filesList.find(f => f.id === fileId);
    if (!file) return;

    Modal.confirm(
      'Remove Document',
      `Are you sure you want to remove <strong>${file.name}</strong> from the Knowledge Layer? Its ${file.chunks} vector chunks will be un-indexed.`,
      () => {
        this._filesList = this._filesList.filter(f => f.id !== fileId);
        Toast.show(`Document "${file.name}" removed from Knowledge Layer`, 'info');
        this.refresh();
      },
      { danger: true, confirmText: 'Remove Document' }
    );
  },

  reindexFile(fileId) {
    const file = this._filesList.find(f => f.id === fileId);
    if (!file) return;

    file.status = 'syncing';
    file.statusText = 'Re-vectorizing...';
    this.refresh();

    setTimeout(() => {
      file.status = 'synced';
      file.statusText = 'Synced to Knowledge Layer';
      file.uploadedAt = new Date().toISOString();
      Toast.show(`Re-indexed ${file.chunks} vector chunks for "${file.name}"`, 'success');
      this.refresh();
    }, 900);
  },

  reindexAllFiles() {
    Toast.show('Re-indexing all document vector embeddings...', 'info');
    setTimeout(() => {
      this._filesList.forEach(f => {
        f.status = 'synced';
        f.statusText = 'Synced to Knowledge Layer';
      });
      Toast.show(`All ${this._filesList.length} documents re-synchronized with Knowledge Layer`, 'success');
      this.refresh();
    }, 1000);
  },

  // ─── Sync All Sources Handlers ───

  triggerSyncAll() {
    if (this._isSyncingAll) return;
    this._isSyncingAll = true;
    this.refresh();
    Toast.show('Initiating global data synchronization across all connected sources...', 'info');

    setTimeout(() => {
      this._isSyncingAll = false;
      const sheetsSync = this._connections.sheets.meta.find(m => m.label.toLowerCase().includes('sync'));
      if (sheetsSync) sheetsSync.value = 'Just now';
      if (this._connections.webhooks.meta[2]) this._connections.webhooks.meta[2].value = 'Just now';
      if (this._connections.firebase.meta[2]) this._connections.firebase.meta[2].value = 'Just now';
      Toast.show('All active connectors and Knowledge Layer vector embeddings synchronized!', 'success');
      this.refresh();
    }, 1400);
  },

  triggerSingleSync(connectorId) {
    const connector = this._connections[connectorId];
    if (!connector) return;

    Toast.show(`Synchronizing ${connector.name} with Knowledge Layer...`, 'info');
    setTimeout(() => {
      if (connector.meta && connector.meta.length > 0) {
        const syncItem = connector.meta.find(m => m.label.toLowerCase().includes('sync') || m.label.toLowerCase().includes('last'));
        if (syncItem) syncItem.value = 'Just now';
      }
      Toast.show(`${connector.name} synchronization complete!`, 'success');
      this.refresh();
    }, 900);
  },

  // ─── Interactive Modals for Each Connector ───

  openFCMModal() {
    const fcm = this._connections.firebase;
    const body = `
      <div style="font-size:13.5px;color:var(--color-text-secondary);margin-bottom:18px;line-height:1.5">
        Configure internal notification channels and topic subscription rules for instant push notifications to project managers and AI developers.
      </div>

      <div class="form-group">
        <label class="form-label">Project Service Account / API Key</label>
        <input type="password" class="form-input" id="fcm-key" value="${fcm.serverKey}" placeholder="AIzaSy...">
        <div style="font-size:11.5px;color:var(--color-text-muted);margin-top:4px">Key is encrypted with AES-256 in memory</div>
      </div>

      <div class="form-group">
        <label class="form-label">Subscribed Push Notification Topics</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
          ${fcm.topics.map(topic => `
            <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:var(--color-primary-50);color:var(--color-primary-700);border:1px solid var(--color-primary-200);border-radius:var(--radius-pill);font-size:12px;font-weight:600">
              ${topic}
            </span>
          `).join('')}
        </div>
      </div>

      <div class="form-group" style="margin-top:16px">
        <label class="form-label">Alert Dispatch Priority</label>
        <select class="form-select">
          <option value="high" selected>High Priority (Immediate delivery with sound & badge)</option>
          <option value="normal">Normal (Batched delivery)</option>
        </select>
      </div>

      <div style="padding:12px 14px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);margin-top:16px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--color-text-primary)">Connection Health Status</div>
            <div style="font-size:12px;color:var(--color-text-muted)">3 Mobile & Web endpoints receiving notification signals</div>
          </div>
          <span class="badge badge-primary" style="font-size:11px">Connected</span>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-secondary" onclick="ConnectorsScreen.testFCMPush();Modal.closeAll();">${Icons.zap} Send Test Signal</button>
      <button class="btn btn-primary" onclick="Toast.show('Notification settings updated', 'success');Modal.closeAll();">Save Changes</button>
    `;

    Modal.open('Internal Notifications — Dispatch Settings', body, footer, { large: true });
  },

  testFCMPush() {
    Toast.show('Pushing test notification to subscribed devices...', 'info');
    setTimeout(() => {
      Store._addNotification('system', 'System Test Alert: Real-time messaging signal verified successfully');
      Toast.show('Test push notification received!', 'success');
      App.updateNotifDot();
    }, 600);
  },

  openWebhookModal() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    if (!currentUser || currentUser.role !== 'Admin') {
      if (typeof Toast !== 'undefined') Toast.show('Only administrators can configure webhooks.', 'error');
      return;
    }
    const wh = this._connections.webhooks;
    const body = `
      <div style="font-size:13.5px;color:var(--color-text-secondary);margin-bottom:18px;line-height:1.5">
        Configure internal webhook endpoints to deliver structured JSON payloads whenever milestone deadlines, tasks, or commercial events occur.
      </div>

      <div class="form-group">
        <label class="form-label">Webhook Destination URL</label>
        <input type="text" class="form-input" id="wh-endpoint" value="${wh.endpoint}" placeholder="https://api.domain.com/hooks">
      </div>

      <div class="form-group">
        <label class="form-label">Signing Secret</label>
        <input type="password" class="form-input" value="whsec_8f9a2b4c1e0d3f2e1a7b" readonly>
      </div>

      <div class="form-group">
        <label class="form-label">Subscribed Events</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" checked style="accent-color:var(--color-primary)"> <code>project.created</code>
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" checked style="accent-color:var(--color-primary)"> <code>task.status_changed</code>
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" checked style="accent-color:var(--color-primary)"> <code>milestone.completed</code>
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" checked style="accent-color:var(--color-primary)"> <code>issue.raised</code>
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" checked style="accent-color:var(--color-primary)"> <code>bg.expiry_warning</code>
          </label>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-secondary" onclick="ConnectorsScreen.testWebhookEvent();Modal.closeAll();">${Icons.zap} Test Payload</button>
      <button class="btn btn-primary" onclick="Toast.show('Webhook configuration saved', 'success');Modal.closeAll();">Save Webhook</button>
    `;

    Modal.open('System Alerts — Internal Webhooks', body, footer, { large: true });
  },

  testWebhookEvent() {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    if (!currentUser || currentUser.role !== 'Admin') {
      if (typeof Toast !== 'undefined') Toast.show('Only administrators can test webhooks.', 'error');
      return;
    }
    Toast.show('Dispatching simulated event payload: "task.status_changed"...', 'info');
    setTimeout(() => {
      Toast.show('HTTP 200 OK — Webhook endpoint responded in 42ms', 'success');
    }, 600);
  },

  openSheetsModal() {
    const sheets = this._connections.sheets;
    const body = `
      <div style="font-size:13.5px;color:var(--color-text-secondary);margin-bottom:18px;line-height:1.5">
        Manage Google Sheets bi-directional integration for PMO task registers, milestone schedules, and retention tracking.
      </div>

      <div class="form-group">
        <label class="form-label">Google Sheet URL / ID</label>
        <input type="text" class="form-input" id="sheet-url" value="${sheets.sheetUrl}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Target Sheet Tab</label>
          <input type="text" class="form-input" value="PMO_Master_Register_2026">
        </div>
        <div class="form-group">
          <label class="form-label">Automated Sync Frequency</label>
          <select class="form-select">
            <option value="hourly" selected>Every Hour</option>
            <option value="realtime">Real-time on Sheet Edit</option>
            <option value="daily">Daily at 08:00 AM</option>
          </select>
        </div>
      </div>

      <div style="padding:12px 14px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);margin-top:10px">
        <div style="font-size:13px;font-weight:600;margin-bottom:4px;color:var(--color-text-primary)">Column Schema Mapping</div>
        <div style="font-size:12px;color:var(--color-text-muted)">Columns A-H mapped to Project Name, Task ID, Assignee, Start Date, Due Date, Progress, Status</div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-primary" onclick="ConnectorsScreen.triggerSingleSync('sheets');Modal.closeAll();">${Icons.refresh} Sync Now</button>
    `;

    Modal.open('Google Sheets — Import Source & Sheets API', body, footer, { large: true });
  },

  openJiraModal() {
    const jira = this._connections.jira;
    const isConnected = jira.status === 'connected';

    if (isConnected) {
      const body = `
        <div style="font-size:13.5px;color:var(--color-text-secondary);margin-bottom:18px;line-height:1.5">
          Jira Cloud is currently linked and actively synchronizing engineering tasks and bug reports.
        </div>

        <div class="form-group">
          <label class="form-label">Connected Atlassian Domain</label>
          <input type="text" class="form-input" value="${jira.domain || 'hintonn-ai.atlassian.net'}" readonly>
        </div>

        <div class="form-group">
          <label class="form-label">Target Project Key</label>
          <input type="text" class="form-input" value="${jira.projectKey || 'HIN-PMS'}" readonly>
        </div>

        <div style="padding:12px 14px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:13px;font-weight:600">Sync Status</span>
            <span class="badge badge-primary" style="font-size:11px">Synchronized</span>
          </div>
        </div>
      `;

      const footer = `
        <button class="btn btn-danger" onclick="ConnectorsScreen.disconnectJira();Modal.closeAll();">Disconnect Jira</button>
        <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
        <button class="btn btn-primary" onclick="ConnectorsScreen.triggerSingleSync('jira');Modal.closeAll();">${Icons.refresh} Sync Now</button>
      `;

      Modal.open('Jira Software Integration', body, footer);
    } else {
      const body = `
        <div style="font-size:13.5px;color:var(--color-text-secondary);margin-bottom:18px;line-height:1.5">
          Connect your Atlassian Jira workspace to import sprints, backlog issues, and synchronize task progress with PMS.
        </div>

        <div class="form-group">
          <label class="form-label">Atlassian Domain / URL</label>
          <input type="text" class="form-input" id="jira-domain" placeholder="e.g. company.atlassian.net" value="hintonn-ai.atlassian.net">
        </div>

        <div class="form-group">
          <label class="form-label">Atlassian Email</label>
          <input type="email" class="form-input" id="jira-email" placeholder="name@company.com" value="ayush@hintonn.com">
        </div>

        <div class="form-group">
          <label class="form-label">API Token / OAuth Key</label>
          <input type="password" class="form-input" id="jira-token" placeholder="Enter Jira API Token" value="jira_pat_9a8b7c6d5e4f">
        </div>

        <div class="form-group">
          <label class="form-label">Project Key to Sync</label>
          <input type="text" class="form-input" id="jira-key" placeholder="e.g. EPC, PMS, DEV" value="PMS">
        </div>
      `;

      const footer = `
        <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
        <button class="btn btn-primary" onclick="ConnectorsScreen.connectJira();Modal.closeAll();">${Icons.link} Authorize & Connect Jira</button>
      `;

      Modal.open('Connect Jira Software', body, footer);
    }
  },

  connectJira() {
    const domain = document.getElementById('jira-domain')?.value || 'hintonn-ai.atlassian.net';
    const key = document.getElementById('jira-key')?.value || 'PMS';

    Toast.show('Authenticating with Atlassian Cloud OAuth...', 'info');
    setTimeout(() => {
      this._connections.jira.status = 'connected';
      this._connections.jira.statusLabel = 'Connected · Bi-directional';
      this._connections.jira.domain = domain;
      this._connections.jira.projectKey = key;
      this._connections.jira.meta = [
        { label: 'Data Scope', value: `Project: ${key}` },
        { label: 'Sync', value: 'Active' }
      ];
      Toast.show('Jira Software connected successfully!', 'success');
      this.refresh();
    }, 800);
  },

  disconnectJira() {
    this._connections.jira.status = 'available';
    this._connections.jira.statusLabel = 'Available · Not Connected';
    this._connections.jira.meta = [
      { label: 'Data Scope', value: 'Projects & Issues' },
      { label: 'Sync', value: 'On Connect' }
    ];
    Toast.show('Jira disconnected', 'info');
    this.refresh();
  },

  openSlackModal() {
    const slack = this._connections.slack;
    const isConnected = slack.status === 'connected';

    if (isConnected) {
      const body = `
        <div style="font-size:13.5px;color:var(--color-text-secondary);margin-bottom:18px;line-height:1.5">
          Slack workspace is connected. Project milestone alerts and Copilot query dispatches are active.
        </div>

        <div class="form-group">
          <label class="form-label">Connected Workspace</label>
          <input type="text" class="form-input" value="${slack.workspace || 'Hintonn AI Workspace'}" readonly>
        </div>

        <div class="form-group">
          <label class="form-label">Primary Notification Channel</label>
          <input type="text" class="form-input" value="${slack.channel || '#pmo-alerts'}" readonly>
        </div>
      `;

      const footer = `
        <button class="btn btn-danger" onclick="ConnectorsScreen.disconnectSlack();Modal.closeAll();">Disconnect Slack</button>
        <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
        <button class="btn btn-primary" onclick="ConnectorsScreen.testSlackMessage();Modal.closeAll();">${Icons.zap} Test Message</button>
      `;

      Modal.open('Slack Workspace Integration', body, footer);
    } else {
      const body = `
        <div style="font-size:13.5px;color:var(--color-text-secondary);margin-bottom:18px;line-height:1.5">
          Connect your Slack workspace to receive automated milestone notifications and allow team members to query the AI Copilot inside Slack.
        </div>

        <div class="form-group">
          <label class="form-label">Slack Workspace Name</label>
          <input type="text" class="form-input" id="slack-workspace" placeholder="e.g. Hintonn Workspace" value="Hintonn AI Workspace">
        </div>

        <div class="form-group">
          <label class="form-label">Bot OAuth Token</label>
          <input type="password" class="form-input" id="slack-token" placeholder="xoxb-..." value="xoxb-982138719283-pms">
        </div>

        <div class="form-group">
          <label class="form-label">Broadcast Channel</label>
          <select class="form-select" id="slack-channel">
            <option value="#pmo-alerts" selected>#pmo-alerts</option>
            <option value="#project-alpha">#project-alpha</option>
            <option value="#general">#general</option>
          </select>
        </div>
      `;

      const footer = `
        <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
        <button class="btn btn-primary" onclick="ConnectorsScreen.connectSlack();Modal.closeAll();">${Icons.link} Authorize & Connect Slack</button>
      `;

      Modal.open('Connect Slack Workspace', body, footer);
    }
  },

  connectSlack() {
    const ws = document.getElementById('slack-workspace')?.value || 'Hintonn AI Workspace';
    const ch = document.getElementById('slack-channel')?.value || '#pmo-alerts';

    Toast.show('Verifying Slack Bot OAuth tokens...', 'info');
    setTimeout(() => {
      this._connections.slack.status = 'connected';
      this._connections.slack.statusLabel = 'Active · Bot Streaming';
      this._connections.slack.workspace = ws;
      this._connections.slack.channel = ch;
      this._connections.slack.meta = [
        { label: 'Channels', value: ch },
        { label: 'AI Interaction', value: 'Enabled' }
      ];
      Toast.show(`Slack connected to ${ch}!`, 'success');
      this.refresh();
    }, 800);
  },

  disconnectSlack() {
    this._connections.slack.status = 'available';
    this._connections.slack.statusLabel = 'Available · Not Connected';
    this._connections.slack.meta = [
      { label: 'Channels', value: '#pmo-alerts, #project-alpha' },
      { label: 'AI Interaction', value: 'Enabled' }
    ];
    Toast.show('Slack disconnected', 'info');
    this.refresh();
  },

  testSlackMessage() {
    Toast.show('Posting test message to Slack channel #pmo-alerts...', 'info');
    setTimeout(() => {
      Toast.show('Slack message delivered successfully!', 'success');
    }, 600);
  },

  openFilePreviewModal(fileId) {
    const file = this._filesList.find(f => f.id === fileId);
    if (!file) return;

    const body = `
      <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--color-bg-page);border-radius:var(--radius-md);margin-bottom:18px;border:1px solid var(--color-border)">
        <span class="file-type-icon ${file.type}" style="width:40px;height:40px;font-size:18px;display:flex;align-items:center;justify-content:center;border-radius:8px">
          ${this._getFileIcon(file.type)}
        </span>
        <div>
          <div style="font-size:15px;font-weight:700;color:var(--color-text-primary)">${file.name}</div>
          <div style="font-size:12.5px;color:var(--color-text-muted)">${file.category} · ${file.size} · Uploaded ${Utils.timeAgo(file.uploadedAt)}</div>
        </div>
      </div>

      <div style="font-size:13px;font-weight:700;color:var(--color-text-primary);margin-bottom:8px">
        Knowledge Layer Vector Breakdown
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:18px">
        <div style="padding:10px 12px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div style="font-size:11px;color:var(--color-text-muted)">Vector Chunks</div>
          <div style="font-size:16px;font-weight:700;color:var(--color-primary)">${file.chunks} Chunks</div>
        </div>
        <div style="padding:10px 12px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div style="font-size:11px;color:var(--color-text-muted)">Embedding Dimension</div>
          <div style="font-size:16px;font-weight:700;color:var(--color-ai)">1536 dim</div>
        </div>
        <div style="padding:10px 12px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div style="font-size:11px;color:var(--color-text-muted)">RAG Query Status</div>
          <div style="font-size:16px;font-weight:700;color:var(--color-primary)">Ready</div>
        </div>
      </div>

      <div style="font-size:13px;font-weight:700;color:var(--color-text-primary);margin-bottom:8px">
        Extracted Context Excerpt
      </div>
      <div style="padding:12px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);font-family:var(--font-mono);font-size:12px;color:var(--color-text-secondary);max-height:140px;overflow-y:auto;line-height:1.6">
        [Chunk #1]: Project Charter — EPC Phase 2 Delivery Scope, Milestone Targets, Resource Allocation Matrices, Retention Security Clauses, and Guarantee Schedules. Synchronized with Knowledge Graph node #KN-${file.id.toUpperCase()}.
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button class="btn btn-primary" onclick="ConnectorsScreen.reindexFile('${file.id}');Modal.closeAll();">${Icons.refresh} Re-index</button>
    `;

    Modal.open(`Document Details — ${file.name}`, body, footer, { large: true });
  },

  openPipelineLogsModal() {
    const logs = [
      { time: 'Just now', source: 'Firebase Cloud Messaging', event: 'Push notification ping dispatched', status: '200 OK' },
      { time: '2m ago', source: 'Internal Webhooks', event: 'Dispatched task.status_changed to endpoint', status: '200 OK' },
      { time: '18m ago', source: 'Google Sheets', event: 'Ingested 1,420 rows from PMO Master Register', status: 'Success' },
      { time: '1h ago', source: 'Document Repository', event: 'Parsed & vectorized Hintonn_EPC_Project_Charter_v2.4.pdf', status: 'Indexed' }
    ];

    const body = `
      <div style="font-size:13.5px;color:var(--color-text-secondary);margin-bottom:14px">
        Real-time execution log of inbound connector ingestion and outbound event signals.
      </div>
      <div style="border:1px solid var(--color-border);border-radius:var(--radius-md);overflow:hidden">
        <table class="connector-files-table" style="font-size:12.5px">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Connector</th>
              <th>Event Description</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => `
              <tr>
                <td style="color:var(--color-text-muted);font-family:var(--font-mono)">${l.time}</td>
                <td style="font-weight:600">${l.source}</td>
                <td>${l.event}</td>
                <td><span class="badge badge-primary" style="font-size:10px">${l.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    const footer = `<button class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>`;
    Modal.open('Integration Pipeline Execution Logs', body, footer, { large: true });
  }
};
