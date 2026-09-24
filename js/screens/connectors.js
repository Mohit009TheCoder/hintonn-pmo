// ─── Connectors Screen Component (Integrations, Data Sources & Knowledge Layer Ingestion) ───
const ConnectorsScreen = {
  // Connector Status & Configuration State
  state: {
    // Section A: Notifications
    fcm: {
      status: 'active', // 'active' | 'inactive'
      projectId: 'hintonn-pmo-enterprise',
      senderId: '849204918231',
      serverKey: '••••••••••••••••••••••••••••••••••••••••',
      pushEnabled: true,
      incidentAlerts: true
    },
    // Section B: Webhooks
    webhooks: {
      status: 'configured', // 'configured' | 'inactive'
      url: 'https://api.hintonn.com/v1/webhooks/events',
      secretKey: 'whsec_••••••••••••••••••••••••••••',
      events: ['task.created', 'issue.escalated', 'milestone.completed', 'invoice.approved'],
      retryCount: 3
    },
    // Section C: Data Sources
    sheets: {
      status: 'connected', // 'connected' | 'syncing' | 'error'
      lastSynced: '10 minutes ago',
      sheetName: 'EPC_Commercial_Master_Ledger',
      recordCount: 428
    },
    jira: {
      connected: false,
      workspaceUrl: '',
      apiToken: '',
      projectKey: 'PMO'
    },
    slack: {
      connected: false,
      workspaceUrl: '',
      botToken: '',
      channel: '#pmo-updates'
    },
    // Files State
    files: [
      {
        id: 'f1',
        name: 'EPC_Commercial_Schedule_v2.xlsx',
        ext: 'XLSX',
        size: '2.4 MB',
        uploadedAt: '2 hours ago',
        status: 'Processed in Knowledge Layer'
      },
      {
        id: 'f2',
        name: 'Site_Audit_Report.pdf',
        ext: 'PDF',
        size: '5.8 MB',
        uploadedAt: '1 day ago',
        status: 'Processed in Knowledge Layer'
      },
      {
        id: 'f3',
        name: 'Technical_Specifications_Contract.docx',
        ext: 'DOCX',
        size: '1.2 MB',
        uploadedAt: '3 days ago',
        status: 'Processed in Knowledge Layer'
      },
      {
        id: 'f4',
        name: 'Vendor_Procurement_Register.csv',
        ext: 'CSV',
        size: '840 KB',
        uploadedAt: '5 days ago',
        status: 'Processed in Knowledge Layer'
      },
      {
        id: 'f5',
        name: 'Project_Architecture_Overview.pptx',
        ext: 'PPTX',
        size: '14.6 MB',
        uploadedAt: '1 week ago',
        status: 'Processed in Knowledge Layer'
      }
    ]
  },

  // Main Screen Renderer
  render() {
    return `
      <div class="screen-content connectors-screen" id="connectors" style="padding: 24px 28px; max-width: 1400px; margin: 0 auto; box-sizing: border-box;">
        
        <!-- Page Header -->
        <div class="screen-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <h1 style="font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--color-text-primary); margin: 0; letter-spacing: -0.02em;">Connectors</h1>
              <span class="badge" style="background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; font-weight: 600; font-size: 11.5px; padding: 3px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 5px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #2563EB;"></span>
                Knowledge Ingestion Active
              </span>
            </div>
            <p style="font-size: 14px; color: var(--color-text-secondary); margin: 0; line-height: 1.5;">Connect your tools, data sources, and services to bring project information into PMS.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="ConnectorsScreen.syncAllSources(this)" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
              ${Icons.refresh || ''}
              <span>Sync All Sources</span>
            </button>
          </div>
        </div>

        <!-- 3 Clearly Separated Sections -->
        <div style="display: flex; flex-direction: column; gap: 32px;">

          <!-- ════════════════════════════════════════════════════════════════════
               SECTION A: Notifications
               ════════════════════════════════════════════════════════════════════ -->
          <section class="connector-section" id="section-notifications">
            <div class="section-title-wrap" style="margin-bottom: 14px;">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #2563EB; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #2563EB;"></span>
                Section A: Notifications
              </div>
              <h2 style="font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin: 0;">Push Notifications & Alerting</h2>
            </div>

            <div class="connector-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 16px;">
              ${this._renderFcmCard()}
            </div>
          </section>

          <!-- ════════════════════════════════════════════════════════════════════
               SECTION B: Webhooks
               ════════════════════════════════════════════════════════════════════ -->
          <section class="connector-section" id="section-webhooks">
            <div class="section-title-wrap" style="margin-bottom: 14px;">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #7C3AED; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #7C3AED;"></span>
                Section B: Webhooks
              </div>
              <h2 style="font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin: 0;">System Event Listeners & Automation</h2>
            </div>

            <div class="connector-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 16px;">
              ${this._renderWebhooksCard()}
            </div>
          </section>

          <!-- ════════════════════════════════════════════════════════════════════
               SECTION C: Data Sources
               ════════════════════════════════════════════════════════════════════ -->
          <section class="connector-section" id="section-datasources">
            <div class="section-title-wrap" style="margin-bottom: 14px;">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #2563EB; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #2563EB;"></span>
                Section C: Data Sources
              </div>
              <h2 style="font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin: 0;">External Integrations & Document Repositories</h2>
            </div>

            <div class="connector-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px;">
              ${this._renderGoogleSheetsCard()}
              ${this._renderJiraCard()}
              ${this._renderSlackCard()}
              ${this._renderFilesCard()}
            </div>
          </section>

          <!-- ════════════════════════════════════════════════════════════════════
               3. Polished File Connector Interface (Files Component)
               ════════════════════════════════════════════════════════════════════ -->
          <section class="connector-section" id="section-file-interface" style="background: var(--color-surface, #FFFFFF); border: 1px solid var(--color-border, #E2E8F0); border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(15,23,42,0.03);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; width: 100%;">
              <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 280px;">
                <div class="file-section-icon-wrap" style="width: 40px !important; height: 40px !important; min-width: 40px !important; min-height: 40px !important; max-width: 40px !important; max-height: 40px !important; background-color: #EFF6FF; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px !important; height: 24px !important; min-width: 24px !important; min-height: 24px !important; max-width: 24px !important; max-height: 24px !important; color: #2563EB; flex-shrink: 0; display: block;">
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                    <path d="M12 10v6"></path>
                    <path d="m9 13 3-3 3 3"></path>
                  </svg>
                </div>
                <div style="flex: 1; min-width: 0;">
                  <h3 style="font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 2px 0;">
                    Project Documents &amp; Knowledge Base Files
                  </h3>
                  <p style="font-size: 13px; color: var(--color-text-muted); margin: 0;">Upload project documentation, commercial schedules, and contract specs to vectorize for AI Assistant context.</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                <span class="badge" style="background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 12px;">
                  <span id="files-count-badge">${this.state.files.length}</span> Indexed Files
                </span>
              </div>
            </div>

            <!-- Drag & Drop Zone -->
            <div 
              class="file-dropzone" 
              id="file-dropzone-container"
              onclick="ConnectorsScreen.triggerFilePicker()"
              ondragover="ConnectorsScreen.handleDragOver(event)"
              ondragleave="ConnectorsScreen.handleDragLeave(event)"
              ondrop="ConnectorsScreen.handleDrop(event)"
              style="border: 2px dashed #CBD5E1; border-radius: 10px; background: #F8FAFC; padding: 32px 20px; text-align: center; cursor: pointer; transition: all 0.2s ease; margin-bottom: 24px;"
            >
              <input type="file" id="connector-file-picker" multiple accept=".pdf,.docx,.xlsx,.csv,.pptx" style="display: none;" onchange="ConnectorsScreen.handleFilesSelected(event)" />
              <div class="dropzone-icon-wrap" style="width: 48px; height: 48px; min-width: 48px; border-radius: 50%; background: #EFF6FF; color: #2563EB; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto; flex-shrink: 0;">
                <svg style="width: 28px; height: 28px; max-width: 28px; max-height: 28px; color: #2563EB; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div style="font-size: 14.5px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 6px;">
                Drag and drop files here, or <span style="color: #2563EB; text-decoration: underline;">click to browse</span>
              </div>
              <div style="display: flex; justify-content: center; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 10px;">
                <span style="font-size: 11px; font-weight: 600; color: #475569; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px; padding: 2px 8px;">PDF</span>
                <span style="font-size: 11px; font-weight: 600; color: #475569; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px; padding: 2px 8px;">DOCX</span>
                <span style="font-size: 11px; font-weight: 600; color: #475569; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px; padding: 2px 8px;">XLSX</span>
                <span style="font-size: 11px; font-weight: 600; color: #475569; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px; padding: 2px 8px;">CSV</span>
                <span style="font-size: 11px; font-weight: 600; color: #475569; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px; padding: 2px 8px;">PPTX</span>
              </div>
              <div style="font-size: 11.5px; color: #94A3B8; margin-top: 8px;">Supported formats up to 50MB each • AES-256 Vector Encryption</div>
            </div>

            <!-- Mock Interactive File List -->
            <div id="connector-files-list-container">
              ${this._renderFileList()}
            </div>
          </section>

          <!-- ════════════════════════════════════════════════════════════════════
               4. Knowledge Layer Data Flow Section (Bottom Footer Component)
               ════════════════════════════════════════════════════════════════════ -->
          <footer class="data-flow-section" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 22px 24px; box-sizing: border-box;">
            <div style="margin-bottom: 16px;">
              <h3 style="font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 4px 0;">Data Flow Architecture</h3>
              <p style="font-size: 13px; color: var(--color-text-secondary); margin: 0;">Connected project information is processed through the Knowledge Layer and made available to the AI Assistant.</p>
            </div>

            <!-- Visual Flow Diagram -->
            <div class="flow-diagram-container" style="display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
              
              <!-- Step 1: Connected Sources -->
              <div class="flow-step-card" style="flex: 1; min-width: 220px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                  <div class="connector-icon-wrap" style="width: 32px; height: 32px; min-width: 32px; border-radius: 6px; background: #EFF6FF; color: #2563EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <svg style="width: 18px; height: 18px; max-width: 18px; max-height: 18px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                  </div>
                  <span style="font-size: 13.5px; font-weight: 700; color: var(--color-text-primary);">Connected Sources</span>
                </div>
                <div style="font-size: 12px; color: var(--color-text-muted); line-height: 1.4;">
                  Google Sheets, Files, Webhooks, Jira, Slack
                </div>
              </div>

              <!-- Directional Arrow 1 -->
              <div class="flow-arrow" style="color: #7C3AED; font-size: 20px; font-weight: 800; display: flex; align-items: center; justify-content: center; padding: 0 4px;">
                <svg style="width: 22px; height: 22px;" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>

              <!-- Step 2: Knowledge Layer -->
              <div class="flow-step-card" style="flex: 1; min-width: 220px; background: #FFFFFF; border: 1px solid #DDD6FE; border-radius: 8px; padding: 14px 16px; box-shadow: 0 1px 2px rgba(124,58,237,0.05);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                  <div class="connector-icon-wrap" style="width: 32px; height: 32px; min-width: 32px; border-radius: 6px; background: #F5F3FF; color: #7C3AED; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <svg style="width: 18px; height: 18px; max-width: 18px; max-height: 18px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
                  </div>
                  <span style="font-size: 13.5px; font-weight: 700; color: #7C3AED;">Knowledge Layer</span>
                </div>
                <div style="font-size: 12px; color: var(--color-text-muted); line-height: 1.4;">
                  Processing, Vector Chunking & Semantic Indexing
                </div>
              </div>

              <!-- Directional Arrow 2 -->
              <div class="flow-arrow" style="color: #7C3AED; font-size: 20px; font-weight: 800; display: flex; align-items: center; justify-content: center; padding: 0 4px;">
                <svg style="width: 22px; height: 22px;" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>

              <!-- Step 3: AI Assistant -->
              <div class="flow-step-card" style="flex: 1; min-width: 220px; background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 14px 16px; box-shadow: 0 1px 2px rgba(37,99,235,0.05);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                  <div class="connector-icon-wrap" style="width: 32px; height: 32px; min-width: 32px; border-radius: 6px; background: #EFF6FF; color: #2563EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <svg style="width: 18px; height: 18px; max-width: 18px; max-height: 18px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/><circle cx="9" cy="13" r="1" fill="currentColor"/><circle cx="15" cy="13" r="1" fill="currentColor"/><path d="M9.5 17h5"/></svg>
                  </div>
                  <span style="font-size: 13.5px; font-weight: 700; color: #2563EB;">AI Assistant</span>
                </div>
                <div style="font-size: 12px; color: var(--color-text-muted); line-height: 1.4;">
                  Real-time Copilot Context & Intelligent Agent Actions
                </div>
              </div>

            </div>
          </footer>

        </div>
      </div>
    `;
  },

  // ─── Section A Cards ───
  _renderFcmCard() {
    return `
      <div class="section-card connector-card" style="background:var(--color-surface, #FFFFFF);border:1px solid var(--color-border, #E2E8F0);border-radius:10px;padding:20px;box-shadow:0 1px 3px rgba(15,23,42,0.03);display:flex;flex-direction:column;justify-content:space-between;gap:16px;">
        <div>
          <div class="connector-card-header" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:12px;min-width:0;">
              <div class="connector-icon-wrap" style="width:44px;height:44px;min-width:44px;border-radius:10px;background:#EFF6FF;color:#2563EB;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg style="width:24px;height:24px;max-width:24px;max-height:24px;object-fit:contain;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div style="min-width:0;">
                <h3 style="font-size:15px;font-weight:700;color:var(--color-text-primary);margin:0 0 2px 0;">Internal Notifications</h3>
                <span style="font-size:12px;color:var(--color-text-muted);font-weight:500;">Firebase Cloud Messaging (FCM)</span>
              </div>
            </div>
            <span class="badge" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;font-weight:600;font-size:11.5px;padding:3px 10px;border-radius:12px;display:inline-flex;align-items:center;gap:5px;flex-shrink:0;">
              <span style="width:6px;height:6px;border-radius:50%;background:#2563EB;"></span>
              Active
            </span>
          </div>

          <p style="font-size:13.5px;color:var(--color-text-secondary);margin:0 0 14px 0;line-height:1.5;">
            Real-time push notifications and event dispatching across project teams.
          </p>

          <div style="display:flex;align-items:center;gap:12px;font-size:12px;color:var(--color-text-muted);background:#F8FAFC;padding:8px 12px;border-radius:6px;border:1px solid #E2E8F0;">
            <span>Project: <strong style="color:var(--color-text-primary);">${this.state.fcm.projectId}</strong></span>
            <span>•</span>
            <span>Push: <strong style="color:#166534;">Enabled</strong></span>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="ConnectorsScreen.openFcmModal()" style="font-weight:600;">
            Configure
          </button>
        </div>
      </div>
    `;
  },

  // ─── Section B Cards ───
  _renderWebhooksCard() {
    return `
      <div class="section-card connector-card" style="background:var(--color-surface, #FFFFFF);border:1px solid var(--color-border, #E2E8F0);border-radius:10px;padding:20px;box-shadow:0 1px 3px rgba(15,23,42,0.03);display:flex;flex-direction:column;justify-content:space-between;gap:16px;">
        <div>
          <div class="connector-card-header" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:12px;min-width:0;">
              <div class="connector-icon-wrap" style="width:44px;height:44px;min-width:44px;border-radius:10px;background:#F5F3FF;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg style="width:24px;height:24px;max-width:24px;max-height:24px;object-fit:contain;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c0-2.21 1.79-4 4-4h5.99c1.1 0 1.95-.94 2.48-1.9A4 4 0 0 1 22 13c0 2.21-1.79 4-4 4z"/><circle cx="6" cy="17" r="1"/><circle cx="18" cy="13" r="1"/><circle cx="12" cy="7" r="1"/><path d="M12 7V2"/>
                </svg>
              </div>
              <div style="min-width:0;">
                <h3 style="font-size:15px;font-weight:700;color:var(--color-text-primary);margin:0 0 2px 0;">System Alerts</h3>
                <span style="font-size:12px;color:var(--color-text-muted);font-weight:500;">Internal Webhooks</span>
              </div>
            </div>
            <span class="badge" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;font-weight:600;font-size:11.5px;padding:3px 10px;border-radius:12px;display:inline-flex;align-items:center;gap:5px;flex-shrink:0;">
              <span style="width:6px;height:6px;border-radius:50%;background:#2563EB;"></span>
              Configured
            </span>
          </div>

          <p style="font-size:13.5px;color:var(--color-text-secondary);margin:0 0 14px 0;line-height:1.5;">
            HTTP callbacks for real-time external system event listening and automation.
          </p>

          <div style="display:flex;align-items:center;gap:12px;font-size:12px;color:var(--color-text-muted);background:#F8FAFC;padding:8px 12px;border-radius:6px;border:1px solid #E2E8F0;">
            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Endpoint: <strong style="color:var(--color-text-primary);">${this.state.webhooks.url}</strong></span>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="ConnectorsScreen.openWebhooksModal()" style="font-weight:600;">
            Manage Webhooks
          </button>
        </div>
      </div>
    `;
  },

  // ─── Section C Cards ───
  _renderGoogleSheetsCard() {
    return `
      <div class="section-card connector-card" style="background:var(--color-surface, #FFFFFF);border:1px solid var(--color-border, #E2E8F0);border-radius:10px;padding:20px;box-shadow:0 1px 3px rgba(15,23,42,0.03);display:flex;flex-direction:column;justify-content:space-between;gap:16px;">
        <div>
          <div class="connector-card-header" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:12px;min-width:0;">
              <div class="connector-icon-wrap" style="width:44px;height:44px;min-width:44px;border-radius:10px;background:#ECFDF5;color:#059669;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg style="width:24px;height:24px;max-width:24px;max-height:24px;object-fit:contain;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M12 13v8"/>
                </svg>
              </div>
              <div style="min-width:0;">
                <h3 style="font-size:15px;font-weight:700;color:var(--color-text-primary);margin:0 0 2px 0;">Google Sheets</h3>
                <span style="font-size:12px;color:var(--color-text-muted);font-weight:500;">Sheets API / Import Source</span>
              </div>
            </div>
            <span class="badge" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;font-weight:600;font-size:11.5px;padding:3px 10px;border-radius:12px;display:inline-flex;align-items:center;gap:5px;flex-shrink:0;">
              <span style="width:6px;height:6px;border-radius:50%;background:#2563EB;"></span>
              Connected
            </span>
          </div>

          <p style="font-size:13.5px;color:var(--color-text-secondary);margin:0 0 12px 0;line-height:1.5;">
            Live project data synchronization and commercial schedule import source.
          </p>

          <div style="font-size:12px;color:var(--color-text-muted);">
            Last synced: <strong style="color:var(--color-text-primary);">${this.state.sheets.lastSynced}</strong> (${this.state.sheets.recordCount} rows)
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;">
          <button type="button" class="btn btn-outline btn-sm" id="btn-sync-sheets" onclick="ConnectorsScreen.syncGoogleSheets(this)" style="display:inline-flex;align-items:center;gap:6px;font-weight:600;">
            ${Icons.refresh || ''}
            <span>Sync Now</span>
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="ConnectorsScreen.openSheetModal()" style="font-weight:600;">
            Manage
          </button>
        </div>
      </div>
    `;
  },

  _renderJiraCard() {
    const isConn = this.state.jira.connected;
    return `
      <div class="section-card connector-card" style="background:var(--color-surface, #FFFFFF);border:1px solid var(--color-border, #E2E8F0);border-radius:10px;padding:20px;box-shadow:0 1px 3px rgba(15,23,42,0.03);display:flex;flex-direction:column;justify-content:space-between;gap:16px;">
        <div>
          <div class="connector-card-header" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:12px;min-width:0;">
              <div class="connector-icon-wrap" style="width:44px;height:44px;min-width:44px;border-radius:10px;background:#EFF6FF;color:#2563EB;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg style="width:24px;height:24px;max-width:24px;max-height:24px;object-fit:contain;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div style="min-width:0;">
                <h3 style="font-size:15px;font-weight:700;color:var(--color-text-primary);margin:0 0 2px 0;">Jira</h3>
                <span style="font-size:12px;color:var(--color-text-muted);font-weight:500;">Issue Tracker / Atlassian</span>
              </div>
            </div>
            ${isConn ? `
              <span class="badge" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;font-weight:600;font-size:11.5px;padding:3px 10px;border-radius:12px;display:inline-flex;align-items:center;gap:5px;flex-shrink:0;">
                <span style="width:6px;height:6px;border-radius:50%;background:#2563EB;"></span>
                Connected
              </span>
            ` : `
              <span class="badge" style="background:#F8FAFC;color:#64748B;border:1px solid #E2E8F0;font-weight:600;font-size:11.5px;padding:3px 10px;border-radius:12px;flex-shrink:0;">
                Available
              </span>
            `}
          </div>

          <p style="font-size:13.5px;color:var(--color-text-secondary);margin:0 0 12px 0;line-height:1.5;">
            Import issues, epics, and sprint progress into PMS milestones.
          </p>

          <div style="font-size:12px;color:var(--color-text-muted);">
            ${isConn ? `Workspace: <strong style="color:var(--color-text-primary);">${this.state.jira.workspaceUrl || 'atlassian.net'}</strong>` : 'Direct two-way sync for sprint tracking'}
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;">
          <button type="button" class="btn ${isConn ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="ConnectorsScreen.openJiraModal()" style="font-weight:600;">
            ${isConn ? 'Manage' : 'Connect'}
          </button>
        </div>
      </div>
    `;
  },

  _renderSlackCard() {
    const isConn = this.state.slack.connected;
    return `
      <div class="section-card connector-card" style="background:var(--color-surface, #FFFFFF);border:1px solid var(--color-border, #E2E8F0);border-radius:10px;padding:20px;box-shadow:0 1px 3px rgba(15,23,42,0.03);display:flex;flex-direction:column;justify-content:space-between;gap:16px;">
        <div>
          <div class="connector-card-header" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:12px;min-width:0;">
              <div class="connector-icon-wrap" style="width:44px;height:44px;min-width:44px;border-radius:10px;background:#F5F3FF;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg style="width:24px;height:24px;max-width:24px;max-height:24px;object-fit:contain;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div style="min-width:0;">
                <h3 style="font-size:15px;font-weight:700;color:var(--color-text-primary);margin:0 0 2px 0;">Slack</h3>
                <span style="font-size:12px;color:var(--color-text-muted);font-weight:500;">Team Chat & Incident Feeds</span>
              </div>
            </div>
            ${isConn ? `
              <span class="badge" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;font-weight:600;font-size:11.5px;padding:3px 10px;border-radius:12px;display:inline-flex;align-items:center;gap:5px;flex-shrink:0;">
                <span style="width:6px;height:6px;border-radius:50%;background:#2563EB;"></span>
                Connected
              </span>
            ` : `
              <span class="badge" style="background:#F8FAFC;color:#64748B;border:1px solid #E2E8F0;font-weight:600;font-size:11.5px;padding:3px 10px;border-radius:12px;flex-shrink:0;">
                Available
              </span>
            `}
          </div>

          <p style="font-size:13.5px;color:var(--color-text-secondary);margin:0 0 12px 0;line-height:1.5;">
            Sync channel conversations and automated daily task updates.
          </p>

          <div style="font-size:12px;color:var(--color-text-muted);">
            ${isConn ? `Channel: <strong style="color:var(--color-text-primary);">${this.state.slack.channel || '#pmo-updates'}</strong>` : 'Automated daily standup broadcasts'}
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;">
          <button type="button" class="btn ${isConn ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="ConnectorsScreen.openSlackModal()" style="font-weight:600;">
            ${isConn ? 'Manage' : 'Connect'}
          </button>
        </div>
      </div>
    `;
  },

  _renderFilesCard() {
    return `
      <div class="section-card connector-card" style="background:var(--color-surface, #FFFFFF);border:1px solid var(--color-border, #E2E8F0);border-radius:10px;padding:20px;box-shadow:0 1px 3px rgba(15,23,42,0.03);display:flex;flex-direction:column;justify-content:space-between;gap:16px;">
        <div>
          <div class="connector-card-header" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:12px;min-width:0;">
              <div class="connector-icon-wrap" style="width:44px;height:44px;min-width:44px;border-radius:10px;background:#EFF6FF;color:#2563EB;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg style="width:24px;height:24px;max-width:24px;max-height:24px;object-fit:contain;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M12 10v6"/><path d="m9 13 3-3 3 3"/>
                </svg>
              </div>
              <div style="min-width:0;">
                <h3 style="font-size:15px;font-weight:700;color:var(--color-text-primary);margin:0 0 2px 0;">Files</h3>
                <span style="font-size:12px;color:var(--color-text-muted);font-weight:500;">Document Repository</span>
              </div>
            </div>
            <span class="badge" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;font-weight:600;font-size:11.5px;padding:3px 10px;border-radius:12px;display:inline-flex;align-items:center;gap:5px;flex-shrink:0;">
              <span style="width:6px;height:6px;border-radius:50%;background:#2563EB;"></span>
              Active Source
            </span>
          </div>

          <p style="font-size:13.5px;color:var(--color-text-secondary);margin:0 0 12px 0;line-height:1.5;">
            Upload project documentation, commercial schedules, and contract specs.
          </p>

          <div style="font-size:12px;color:var(--color-text-muted);">
            <strong style="color:var(--color-text-primary);">${this.state.files.length} documents</strong> processed into vector memory
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;">
          <button type="button" class="btn btn-primary btn-sm" onclick="ConnectorsScreen.scrollToUpload()" style="font-weight:600;display:inline-flex;align-items:center;gap:6px;">
            ${Icons.upload || ''}
            <span>Upload Files</span>
          </button>
        </div>
      </div>
    `;
  },

  // ─── Render File List ───
  _renderFileList() {
    if (!this.state.files || this.state.files.length === 0) {
      return `
        <div style="text-align:center;padding:32px 20px;color:var(--color-text-muted);font-size:14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
          No files uploaded yet. Drag and drop your project documents above.
        </div>
      `;
    }

    const badgeStyles = {
      PDF: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
      XLSX: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
      CSV: { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
      DOCX: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
      PPTX: { bg: '#FFF7ED', color: '#EA580C', border: '#FFEDD5' }
    };

    return `
      <div style="overflow-x:auto;">
        <table class="table" style="width:100%;border-collapse:collapse;text-align:left;font-size:13.5px;">
          <thead>
            <tr style="border-bottom:1px solid var(--color-border);color:var(--color-text-muted);font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">
              <th style="padding:10px 14px;font-weight:600;">File Name</th>
              <th style="padding:10px 14px;font-weight:600;">Size</th>
              <th style="padding:10px 14px;font-weight:600;">Uploaded</th>
              <th style="padding:10px 14px;font-weight:600;">Knowledge State</th>
              <th style="padding:10px 14px;font-weight:600;text-align:right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${this.state.files.map(f => {
              const b = badgeStyles[f.ext] || { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
              return `
                <tr style="border-bottom:1px solid var(--color-border-subtle);transition:background 0.15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='transparent'">
                  <td style="padding:12px 14px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <span style="background:${b.bg};color:${b.color};border:1px solid ${b.border};font-size:10.5px;font-weight:800;padding:2px 6px;border-radius:4px;letter-spacing:0.03em;">
                        ${f.ext}
                      </span>
                      <span style="font-weight:600;color:var(--color-text-primary);">${f.name}</span>
                    </div>
                  </td>
                  <td style="padding:12px 14px;color:var(--color-text-secondary);font-size:13px;">${f.size}</td>
                  <td style="padding:12px 14px;color:var(--color-text-muted);font-size:13px;">${f.uploadedAt}</td>
                  <td style="padding:12px 14px;">
                    <span style="display:inline-flex;align-items:center;gap:6px;background:#F0FDF4;color:#166534;border:1px solid #BBF7D0;font-size:11.5px;font-weight:600;padding:3px 10px;border-radius:12px;">
                      <svg style="width:12px;height:12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      ${f.status}
                    </span>
                  </td>
                  <td style="padding:12px 14px;text-align:right;">
                    <button 
                      type="button" 
                      class="btn btn-ghost btn-icon btn-sm" 
                      onclick="ConnectorsScreen.openDeleteFileModal('${f.id}')"
                      title="Remove file from Knowledge Layer"
                      style="color:#94A3B8;transition:color 0.15s;"
                      onmouseover="this.style.color='#DC2626'"
                      onmouseout="this.style.color='#94A3B8'"
                    >
                      <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // ─── Modals & Interactivity ───

  // Scroll to file upload section
  scrollToUpload() {
    const el = document.getElementById('section-file-interface');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      const dropzone = document.getElementById('file-dropzone-container');
      if (dropzone) {
        dropzone.style.borderColor = '#2563EB';
        dropzone.style.background = '#EFF6FF';
        setTimeout(() => {
          dropzone.style.borderColor = '#CBD5E1';
          dropzone.style.background = '#F8FAFC';
        }, 800);
      }
    }
  },

  triggerFilePicker() {
    const picker = document.getElementById('connector-file-picker');
    if (picker) picker.click();
  },

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const el = document.getElementById('file-dropzone-container');
    if (el) {
      el.style.borderColor = '#2563EB';
      el.style.background = '#EFF6FF';
    }
  },

  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const el = document.getElementById('file-dropzone-container');
    if (el) {
      el.style.borderColor = '#CBD5E1';
      el.style.background = '#F8FAFC';
    }
  },

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.handleDragLeave(e);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      this._processAddedFiles(e.dataTransfer.files);
    }
  },

  handleFilesSelected(e) {
    if (e.target && e.target.files && e.target.files.length > 0) {
      this._processAddedFiles(e.target.files);
      e.target.value = '';
    }
  },

  _processAddedFiles(fileList) {
    const newFiles = Array.from(fileList).map(file => {
      const parts = file.name.split('.');
      const ext = parts.length > 1 ? parts.pop().toUpperCase() : 'DOC';
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = file.size < 1024 * 1024 ? `${Math.round(file.size / 1024)} KB` : `${sizeMb} MB`;
      return {
        id: 'f-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: file.name,
        ext: ext,
        size: sizeStr,
        uploadedAt: 'Just now',
        status: 'Processed in Knowledge Layer'
      };
    });

    this.state.files = [...newFiles, ...this.state.files];
    Toast.show(`Uploaded and indexed ${newFiles.length} file(s) into Knowledge Layer`, 'success');
    this._refreshFileList();
  },

  _refreshFileList() {
    const container = document.getElementById('connector-files-list-container');
    const badge = document.getElementById('files-count-badge');
    if (container) container.innerHTML = this._renderFileList();
    if (badge) badge.textContent = this.state.files.length;
  },

  openDeleteFileModal(fileId) {
    const file = this.state.files.find(f => f.id === fileId);
    if (!file) return;

    Modal.confirm(
      'Remove File from Knowledge Base',
      `Are you sure you want to remove <strong>${file.name}</strong>? This document will be unindexed from the AI Assistant context memory.`,
      () => {
        this.state.files = this.state.files.filter(f => f.id !== fileId);
        Toast.show(`Removed ${file.name} from Knowledge Layer`, 'success');
        this._refreshFileList();
      },
      { confirmText: 'Remove File', danger: true }
    );
  },

  // 1. Firebase Cloud Messaging Modal
  openFcmModal() {
    const fcm = this.state.fcm;
    const body = `
      <form id="fcm-config-form" onsubmit="event.preventDefault(); ConnectorsScreen.saveFcmConfig(this);" style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group" style="text-align:left;">
          <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Firebase Project ID</label>
          <input type="text" id="fcm-project-id" class="form-input" value="${fcm.projectId}" required style="width:100%;height:40px;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;" />
        </div>

        <div class="form-group" style="text-align:left;">
          <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">FCM Sender ID</label>
          <input type="text" id="fcm-sender-id" class="form-input" value="${fcm.senderId}" required style="width:100%;height:40px;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;" />
        </div>

        <div class="form-group" style="text-align:left;">
          <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Server API Key / Service Account</label>
          <input type="password" id="fcm-server-key" class="form-input" value="${fcm.serverKey}" style="width:100%;height:40px;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;" />
        </div>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--color-text-primary);cursor:pointer;">
            <input type="checkbox" id="fcm-push-toggle" ${fcm.pushEnabled ? 'checked' : ''} />
            <span>Enable real-time push notifications for assigned tasks</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--color-text-primary);cursor:pointer;">
            <input type="checkbox" id="fcm-incident-toggle" ${fcm.incidentAlerts ? 'checked' : ''} />
            <span>Dispatch high-priority incident and blocker broadcasts</span>
          </label>
        </div>
      </form>
    `;

    const footer = `
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-primary" onclick="document.getElementById('fcm-config-form').requestSubmit()">Save Configuration</button>
    `;

    Modal.open('Configure Firebase Cloud Messaging (FCM)', body, footer);
  },

  saveFcmConfig(form) {
    const projectId = document.getElementById('fcm-project-id').value.trim();
    const senderId = document.getElementById('fcm-sender-id').value.trim();
    const pushEnabled = document.getElementById('fcm-push-toggle').checked;
    const incidentAlerts = document.getElementById('fcm-incident-toggle').checked;

    this.state.fcm.projectId = projectId || this.state.fcm.projectId;
    this.state.fcm.senderId = senderId || this.state.fcm.senderId;
    this.state.fcm.pushEnabled = pushEnabled;
    this.state.fcm.incidentAlerts = incidentAlerts;

    Modal.closeAll();
    Toast.show('Firebase Cloud Messaging settings updated successfully', 'success');
    if (App.currentScreen === 'connectors') App.refresh();
  },

  // 2. Webhooks Configuration Modal
  openWebhooksModal() {
    const wh = this.state.webhooks;
    const body = `
      <form id="webhook-config-form" onsubmit="event.preventDefault(); ConnectorsScreen.saveWebhooksConfig(this);" style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group" style="text-align:left;">
          <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Webhook Destination URL</label>
          <input type="url" id="wh-url" class="form-input" value="${wh.url}" required style="width:100%;height:40px;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;" />
        </div>

        <div class="form-group" style="text-align:left;">
          <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Secret Signing Key (HMAC-SHA256)</label>
          <input type="text" id="wh-secret" class="form-input" value="${wh.secretKey}" style="width:100%;height:40px;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;font-family:monospace;" />
        </div>

        <div style="text-align:left;">
          <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:8px;">Subscribed Events</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#F8FAFC;padding:12px;border-radius:8px;border:1px solid #E2E8F0;font-size:12.5px;">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" checked /> task.created</label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" checked /> issue.escalated</label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" checked /> milestone.completed</label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" checked /> invoice.approved</label>
          </div>
        </div>
      </form>
    `;

    const footer = `
      <button type="button" class="btn btn-secondary" onclick="ConnectorsScreen.testWebhookPing()">Send Test Ping</button>
      <div style="flex:1;"></div>
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-primary" onclick="document.getElementById('webhook-config-form').requestSubmit()">Save Webhook</button>
    `;

    Modal.open('Manage Webhooks & Event Dispatches', body, footer, { large: true });
  },

  testWebhookPing() {
    Toast.show('Test ping dispatched: HTTP 200 OK received (84ms)', 'success');
  },

  saveWebhooksConfig(form) {
    const url = document.getElementById('wh-url').value.trim();
    if (url) this.state.webhooks.url = url;
    Modal.closeAll();
    Toast.show('Webhook listener endpoint and payload rules saved', 'success');
    if (App.currentScreen === 'connectors') App.refresh();
  },

  // 3. Google Sheets Modal & Sync
  openSheetModal() {
    const sheets = this.state.sheets;
    const body = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px 14px;font-size:13px;color:#166534;">
          <strong>Active Spreadsheet:</strong> ${sheets.sheetName} (${sheets.recordCount} rows synchronized)
        </div>
        <div class="form-group" style="text-align:left;">
          <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Google Sheet Document URL or ID</label>
          <input type="text" class="form-input" value="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit" style="width:100%;height:40px;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;" />
        </div>
        <div class="form-group" style="text-align:left;">
          <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Sync Schedule</label>
          <select class="form-select" style="width:100%;height:40px;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;">
            <option value="15">Every 15 minutes (Real-time)</option>
            <option value="60">Hourly</option>
            <option value="daily">Daily at 00:00 UTC</option>
          </select>
        </div>
      </div>
    `;

    const footer = `
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Close</button>
      <button type="button" class="btn btn-primary" onclick="Modal.closeAll(); Toast.show('Google Sheets configuration saved', 'success');">Save Settings</button>
    `;

    Modal.open('Manage Google Sheets Data Source', body, footer);
  },

  syncGoogleSheets(btnEl) {
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerHTML = `<span class="animate-spin" style="display:inline-block;animation:spin 1s linear infinite;">⟳</span> Syncing...`;
    }
    setTimeout(() => {
      this.state.sheets.lastSynced = 'Just now';
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerHTML = `${Icons.refresh || ''} <span>Sync Now</span>`;
      }
      Toast.show('Google Sheets synchronized: 428 records updated in Knowledge Layer', 'success');
      if (App.currentScreen === 'connectors') App.refresh();
    }, 900);
  },

  // 4. Jira Connection Modal
  openJiraModal() {
    const isConn = this.state.jira.connected;
    const body = `
      <form id="jira-connection-form" onsubmit="event.preventDefault(); ConnectorsScreen.saveJiraConnection(this);" style="display:flex;flex-direction:column;gap:14px;">
        <p style="font-size:13.5px;color:var(--color-text-secondary);margin:0;">
          Authenticate Atlassian Jira to map epics, stories, and sprint tasks directly into PMS milestones.
        </p>

        <div class="form-group" style="text-align:left;">
          <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Jira Workspace Domain</label>
          <input type="text" id="jira-domain" class="form-input" placeholder="e.g. hintonn-tech.atlassian.net" value="${this.state.jira.workspaceUrl || 'hintonn-team.atlassian.net'}" required style="width:100%;height:40px;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;" />
        </div>

        <div class="form-group" style="text-align:left;">
          <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Atlassian API Token / OAuth Key</label>
          <input type="password" id="jira-token" class="form-input" placeholder="Enter API token" value="${this.state.jira.apiToken || '••••••••••••••••••••'}" required style="width:100%;height:40px;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;" />
        </div>

        <div class="form-group" style="text-align:left;">
          <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Target Project Key</label>
          <input type="text" id="jira-key" class="form-input" value="${this.state.jira.projectKey || 'PMO'}" required style="width:100%;height:40px;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;" />
        </div>
      </form>
    `;

    const footer = `
      ${isConn ? `
        <button type="button" class="btn btn-danger" onclick="ConnectorsScreen.disconnectJira()">Disconnect</button>
      ` : ''}
      <div style="flex:1;"></div>
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-primary" onclick="document.getElementById('jira-connection-form').requestSubmit()">${isConn ? 'Update Connection' : 'Save Connection'}</button>
    `;

    Modal.open(isConn ? 'Manage Jira Connection' : 'Connect Jira Workspace', body, footer);
  },

  saveJiraConnection(form) {
    const domain = document.getElementById('jira-domain').value.trim();
    const token = document.getElementById('jira-token').value.trim();
    const key = document.getElementById('jira-key').value.trim();

    this.state.jira.connected = true;
    this.state.jira.workspaceUrl = domain;
    this.state.jira.apiToken = token;
    this.state.jira.projectKey = key;

    Modal.closeAll();
    Toast.show('Jira Workspace connected: Sprint & Issue sync enabled', 'success');
    if (App.currentScreen === 'connectors') App.refresh();
  },

  disconnectJira() {
    this.state.jira.connected = false;
    Modal.closeAll();
    Toast.show('Jira connection deactivated', 'info');
    if (App.currentScreen === 'connectors') App.refresh();
  },

  // 5. Slack Connection Modal
  openSlackModal() {
    const isConn = this.state.slack.connected;
    const body = `
      <form id="slack-connection-form" onsubmit="event.preventDefault(); ConnectorsScreen.saveSlackConnection(this);" style="display:flex;flex-direction:column;gap:14px;">
        <p style="font-size:13.5px;color:var(--color-text-secondary);margin:0;">
          Connect your Slack workspace for automated daily task summaries and team event dispatching.
        </p>

        <div class="form-group" style="text-align:left;">
          <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Slack Workspace URL</label>
          <input type="text" id="slack-domain" class="form-input" placeholder="e.g. hintonn.slack.com" value="${this.state.slack.workspaceUrl || 'hintonn-ai.slack.com'}" required style="width:100%;height:40px;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;" />
        </div>

        <div class="form-group" style="text-align:left;">
          <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Bot User OAuth Token (xoxb-...)</label>
          <input type="password" id="slack-token" class="form-input" placeholder="xoxb-..." value="${this.state.slack.botToken || 'xoxb-948291048102-••••••••••••'}" required style="width:100%;height:40px;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;" />
        </div>

        <div class="form-group" style="text-align:left;">
          <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Broadcast Channel</label>
          <input type="text" id="slack-channel" class="form-input" value="${this.state.slack.channel || '#pmo-updates'}" required style="width:100%;height:40px;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;" />
        </div>
      </form>
    `;

    const footer = `
      ${isConn ? `
        <button type="button" class="btn btn-danger" onclick="ConnectorsScreen.disconnectSlack()">Disconnect</button>
      ` : ''}
      <div style="flex:1;"></div>
      <button type="button" class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button type="button" class="btn btn-primary" onclick="document.getElementById('slack-connection-form').requestSubmit()">${isConn ? 'Update Channel' : 'Save Connection'}</button>
    `;

    Modal.open(isConn ? 'Manage Slack Connection' : 'Connect Slack Workspace', body, footer);
  },

  saveSlackConnection(form) {
    const domain = document.getElementById('slack-domain').value.trim();
    const token = document.getElementById('slack-token').value.trim();
    const channel = document.getElementById('slack-channel').value.trim();

    this.state.slack.connected = true;
    this.state.slack.workspaceUrl = domain;
    this.state.slack.botToken = token;
    this.state.slack.channel = channel;

    Modal.closeAll();
    Toast.show(`Slack Workspace connected to ${channel}`, 'success');
    if (App.currentScreen === 'connectors') App.refresh();
  },

  disconnectSlack() {
    this.state.slack.connected = false;
    Modal.closeAll();
    Toast.show('Slack workspace disconnected', 'info');
    if (App.currentScreen === 'connectors') App.refresh();
  },

  // Sync All Sources
  syncAllSources(btnEl) {
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerHTML = `<span class="animate-spin" style="display:inline-block;animation:spin 1s linear infinite;">⟳</span> Syncing...`;
    }
    setTimeout(() => {
      this.state.sheets.lastSynced = 'Just now';
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerHTML = `${Icons.refresh || ''} <span>Sync All Sources</span>`;
      }
      Toast.show('All active connectors and knowledge repositories synchronized', 'success');
      if (App.currentScreen === 'connectors') App.refresh();
    }, 1000);
  }
};
