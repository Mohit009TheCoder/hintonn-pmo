// ─── Commercial PMO & EPC Executive Dashboard ───
const DashboardScreen = {
  // Commercial Data Model & Calculations
  _getCommercialData() {
    const rawProjects = Store.getProjects();
    const settings = Store.getSettings();

    // Mapping project IDs to specialized Commercial & EPC metrics
    const commercialProfiles = {
      p1: {
        packageCode: 'PKG-01 · Core EPC Phase 1',
        commercialStage: 'Execution',
        stageClass: 'stage-execution',
        contractValue: 5800000,
        contractValueFormatted: '$5.8M',
        contractValueExact: '$5,800,000',
        pendingInvoices: 720000,
        pendingInvoicesFormatted: '$720K',
        pendingInvoicesExact: '$720,000',
        retentionHeld: 290000,
        retentionHeldFormatted: '$290K',
        retentionHeldExact: '$290,000',
        retentionPct: '5%',
        releaseDueDate: '2027-03-15',
        releaseDueDateFormatted: 'Mar 15, 2027',
        releaseStatus: 'On Schedule',
        releaseStatusBadge: 'badge-active',
        milestoneCount: 4,
        bgRef: 'BG-2026-001',
        bgType: 'Performance Guarantee',
        bgAmount: '$580,000',
        bgExpiryDate: '2026-10-16',
        bgDaysLeft: 24,
        bgRisk: 'critical',
        bgRiskLabel: 'Critical (< 30d)',
        issuingBank: 'Standard Chartered Bank'
      },
      p2: {
        packageCode: 'PKG-02 · Substation Package',
        commercialStage: 'Design',
        stageClass: 'stage-design',
        contractValue: 3400000,
        contractValueFormatted: '$3.4M',
        contractValueExact: '$3,400,000',
        pendingInvoices: 410000,
        pendingInvoicesFormatted: '$410K',
        pendingInvoicesExact: '$410,000',
        retentionHeld: 170000,
        retentionHeldFormatted: '$170K',
        retentionHeldExact: '$170,000',
        retentionPct: '5%',
        releaseDueDate: '2026-11-30',
        releaseDueDateFormatted: 'Nov 30, 2026',
        releaseStatus: 'Under Review',
        releaseStatusBadge: 'badge-review',
        milestoneCount: 3,
        bgRef: 'BG-2026-014',
        bgType: 'Performance Guarantee',
        bgAmount: '$340,000',
        bgExpiryDate: '2026-11-13',
        bgDaysLeft: 52,
        bgRisk: 'warning',
        bgRiskLabel: 'Warning (52d)',
        issuingBank: 'Barclays Corporate'
      },
      p3: {
        packageCode: 'PKG-03 · Utilities & Balance of Plant',
        commercialStage: 'Execution',
        stageClass: 'stage-execution',
        contractValue: 2100000,
        contractValueFormatted: '$2.1M',
        contractValueExact: '$2,100,000',
        pendingInvoices: 280000,
        pendingInvoicesFormatted: '$280K',
        pendingInvoicesExact: '$280,000',
        retentionHeld: 105000,
        retentionHeldFormatted: '$105K',
        retentionHeldExact: '$105,000',
        retentionPct: '5%',
        releaseDueDate: '2027-05-20',
        releaseDueDateFormatted: 'May 20, 2027',
        releaseStatus: 'On Schedule',
        releaseStatusBadge: 'badge-active',
        milestoneCount: 2,
        bgRef: 'BG-2026-022',
        bgType: 'Advance Payment Guarantee',
        bgAmount: '$210,000',
        bgExpiryDate: '2027-01-20',
        bgDaysLeft: 120,
        bgRisk: 'safe',
        bgRiskLabel: 'Safe (120d)',
        issuingBank: 'Citibank N.A.'
      },
      p4: {
        packageCode: 'PKG-04 · SCADA & Grid Automation',
        commercialStage: 'Execution',
        stageClass: 'stage-execution',
        contractValue: 1500000,
        contractValueFormatted: '$1.5M',
        contractValueExact: '$1,500,000',
        pendingInvoices: 190000,
        pendingInvoicesFormatted: '$190K',
        pendingInvoicesExact: '$190,000',
        retentionHeld: 75000,
        retentionHeldFormatted: '$75K',
        retentionHeldExact: '$75,000',
        retentionPct: '5%',
        releaseDueDate: '2027-08-15',
        releaseDueDateFormatted: 'Aug 15, 2027',
        releaseStatus: 'On Schedule',
        releaseStatusBadge: 'badge-active',
        milestoneCount: 2,
        bgRef: 'BG-2026-035',
        bgType: 'Performance Guarantee',
        bgAmount: '$150,000',
        bgExpiryDate: '2027-03-22',
        bgDaysLeft: 180,
        bgRisk: 'safe',
        bgRiskLabel: 'Safe (180d)',
        issuingBank: 'Standard Chartered Bank'
      },
      p5: {
        packageCode: 'PKG-05 · Civil & Site Facilities',
        commercialStage: 'DLP & Handover',
        stageClass: 'stage-dlp',
        contractValue: 1400000,
        contractValueFormatted: '$1.4M',
        contractValueExact: '$1,400,000',
        pendingInvoices: 0,
        pendingInvoicesFormatted: '$0',
        pendingInvoicesExact: '$0 (Certified)',
        retentionHeld: 140000,
        retentionHeldFormatted: '$140K',
        retentionHeldExact: '$140,000',
        retentionPct: '10%',
        releaseDueDate: '2026-10-30',
        releaseDueDateFormatted: 'Oct 30, 2026',
        releaseStatus: 'Release Initiated',
        releaseStatusBadge: 'badge-in-progress',
        milestoneCount: 2,
        bgRef: 'BG-2025-091',
        bgType: 'Defects Liability (DLP) BG',
        bgAmount: '$140,000',
        bgExpiryDate: '2026-10-30',
        bgDaysLeft: 38,
        bgRisk: 'warning',
        bgRiskLabel: 'DLP Exit (38d)',
        issuingBank: 'HSBC Commercial'
      }
    };

    const projects = rawProjects.map(p => {
      const comm = commercialProfiles[p.id] || {
        packageCode: 'PKG-GEN · General Works',
        commercialStage: 'Execution',
        stageClass: 'stage-execution',
        contractValue: 1000000,
        contractValueFormatted: '$1.0M',
        contractValueExact: '$1,000,000',
        pendingInvoices: 100000,
        pendingInvoicesFormatted: '$100K',
        pendingInvoicesExact: '$100,000',
        retentionHeld: 50000,
        retentionHeldFormatted: '$50K',
        retentionHeldExact: '$50,000',
        retentionPct: '5%',
        releaseDueDate: '2027-01-01',
        releaseDueDateFormatted: 'Jan 1, 2027',
        releaseStatus: 'On Schedule',
        releaseStatusBadge: 'badge-active',
        milestoneCount: Store.getMilestones(p.id).length || 2,
        bgRef: 'BG-2026-GEN',
        bgType: 'Performance Guarantee',
        bgAmount: '$100,000',
        bgExpiryDate: '2027-06-30',
        bgDaysLeft: 180,
        bgRisk: 'safe',
        bgRiskLabel: 'Safe',
        issuingBank: 'Standard Chartered'
      };
      return { ...p, commercial: comm };
    });

    // Aggregate summary figures
    const totalPortfolioValue = '$14.2M';
    const activeCount = projects.filter(p => p.status === 'active' || p.status === 'planning' || p.status === 'completed').length;
    const totalPendingValue = '$1.8M';
    const totalContractValue = '$14.2M';
    const totalActiveBGs = 12;
    const bgsExpiring30Days = 2;
    const retentionBalanceHeld = '$450K';
    const projectsInDLP = 3;

    // BG & DLP Timeline Monitor List (Precision Executive Format)
    const bgTimeline = [
      {
        bgId: 'BG-2026-001',
        type: 'Performance Guarantee',
        projectName: 'Hintonn AI Core Platform',
        projectId: 'p1',
        amount: '$580,000',
        expiryDate: 'Oct 16, 2026',
        daysLeft: 24,
        riskBadgeClass: 'badge-high',
        riskText: 'Critical · 24d',
        bank: 'Standard Chartered'
      },
      {
        bgId: 'BG-2025-091',
        type: 'Defects Liability (DLP)',
        projectName: 'Website & Site Facilities Package',
        projectId: 'p5',
        amount: '$140,000',
        expiryDate: 'Oct 30, 2026',
        daysLeft: 38,
        riskBadgeClass: 'badge-medium',
        riskText: 'DLP Exit · 38d',
        bank: 'HSBC Commercial'
      },
      {
        bgId: 'BG-2026-014',
        type: 'Performance Guarantee',
        projectName: 'Client Substation Package',
        projectId: 'p2',
        amount: '$340,000',
        expiryDate: 'Nov 13, 2026',
        daysLeft: 52,
        riskBadgeClass: 'badge-medium',
        riskText: 'Warning · 52d',
        bank: 'Barclays Corporate'
      },
      {
        bgId: 'BG-2026-022',
        type: 'Advance Payment BG',
        projectName: 'Facility Balance & Utilities',
        projectId: 'p3',
        amount: '$210,000',
        expiryDate: 'Jan 20, 2027',
        daysLeft: 120,
        riskBadgeClass: 'badge-active',
        riskText: 'Safe · 120d',
        bank: 'Citibank N.A.'
      }
    ];

    // Real-Time PMO Automated Activity Logs in Core Theme
    const pmoActivities = [
      {
        type: 'shield',
        icon: Icons.shield,
        html: '<strong>BG extension request sent</strong> for Project Alpha (Substation Package - <code>BG-2026-001</code>)',
        time: '12m ago',
        tag: 'Automated'
      },
      {
        type: 'fileText',
        icon: Icons.fileText,
        html: '<strong>Automated sync:</strong> Invoice #104 status updated (<strong>$410,000</strong> pending client certification)',
        time: '45m ago',
        tag: 'ERP Sync'
      },
      {
        type: 'target',
        icon: Icons.target,
        html: '<strong>DLP sign-off notice issued</strong> for Website & Site Facilities (38 days to exit audit)',
        time: '2h ago',
        tag: 'DLP Audit'
      },
      {
        type: 'checkSquare',
        icon: Icons.checkSquare,
        html: '<strong>Milestone certified:</strong> 68% EPC Execution stage completion for <strong>Hintonn AI Core Platform</strong>',
        time: '4h ago',
        tag: 'Milestone'
      },
      {
        type: 'shield',
        icon: Icons.shield,
        html: '<strong>Bank Guarantee BG-2026-035 verified:</strong> Active standing with Standard Chartered Bank',
        time: '1d ago',
        tag: 'Bank Sync'
      },
      {
        type: 'dollarSign',
        icon: Icons.dollarSign,
        html: '<strong>Retention release draft prepared:</strong> $140,000 tranche queued for Project PKG-05',
        time: '2d ago',
        tag: 'Retention'
      }
    ];

    // Dynamic Portfolio Health Score Calculation: (((OnTrack * 1.0) + (DLP * 0.9) + (AtRisk * 0.5)) / TotalProjects) * 100
    let onTrackCount = 0;
    let atRiskCount = 0;
    let dlpCount = 0;

    projects.forEach(p => {
      if (p.commercial.commercialStage === 'DLP & Handover' || p.status === 'completed' || p.id === 'p5') {
        dlpCount++;
      } else if (p.id === 'p2' || p.status === 'blocked' || p.status === 'delayed') {
        atRiskCount++;
      } else {
        onTrackCount++;
      }
    });

    const totalProjects = projects.length || 1;
    const rawHealthScore = (((onTrackCount * 1.0) + (dlpCount * 0.9) + (atRiskCount * 0.5)) / totalProjects) * 100;
    const healthScore = rawHealthScore.toFixed(1);
    const healthStatusLabel = rawHealthScore >= 80 ? 'Optimal' : rawHealthScore >= 70 ? 'Stable' : 'Attention Needed';

    const onTrackPct = ((onTrackCount / totalProjects) * 100).toFixed(1);
    const atRiskPct = ((atRiskCount / totalProjects) * 100).toFixed(1);
    const dlpPct = ((dlpCount / totalProjects) * 100).toFixed(1);

    return {
      projects,
      totalPortfolioValue,
      activeCount,
      totalPendingValue,
      totalContractValue,
      totalActiveBGs,
      bgsExpiring30Days,
      retentionBalanceHeld,
      projectsInDLP,
      bgTimeline,
      pmoActivities,
      settings,
      onTrackCount,
      atRiskCount,
      dlpCount,
      totalProjects,
      rawHealthScore,
      healthScore,
      healthStatusLabel,
      onTrackPct,
      atRiskPct,
      dlpPct
    };
  },

  render(filter = null) {
    const user = (typeof Auth !== 'undefined' && Auth.getCurrentUser()) || {
      id: 'ayush',
      memberId: 'm1',
      name: 'Ayush Desai',
      role: 'Admin'
    };

    if (user.role === 'Admin') {
      return this._renderAdminDashboard(user);
    } else {
      return this._renderDeveloperDashboard(user);
    }
  },

  // ─── 1. Admin Executive Portfolio Dashboard ───
  _renderAdminDashboard(user) {
    const data = this._getCommercialData();
    const now = new Date();
    const timeGreeting = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';
    const firstName = user.name ? user.name.split(' ')[0] : 'Ayush';
    const assignees = Store.getAssignees();
    const allTasks = Store.getTasks();

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Good ${timeGreeting}, ${firstName}</h1>
          <p>Commercial PMO & EPC Executive Dashboard · Real-time portfolio, Bank Guarantee risk & retention tracking.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="DashboardScreen.openCommercialAudit()">
            ${Icons.fileText} Commercial Audit
          </button>
          <button class="btn btn-ai" onclick="App.openCommand()">
            ${Icons.bot} Ask Hintonn Agent
          </button>
        </div>
      </div>

      <!-- Portfolio Health Score Segmented Bar Component -->
      <div class="portfolio-health-card section-card" style="margin-bottom:20px;padding:16px 20px">
        <div class="portfolio-health-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:10px">
          <div class="portfolio-health-title" style="font-size:14.5px;font-weight:700;color:var(--color-text-primary);display:flex;align-items:center;gap:8px">
            <span>Portfolio Health Score:</span>
            <strong style="color:var(--color-primary-700)">${data.healthScore}% ${data.healthStatusLabel}</strong>
          </div>
          <div class="portfolio-health-counts" style="font-size:12.5px;font-weight:600;color:var(--color-text-muted);display:flex;align-items:center;gap:6px">
            <span style="color:#2563EB;font-weight:700">${data.onTrackCount} On-Track</span>
            <span>·</span>
            <span style="color:#475569;font-weight:700">${data.atRiskCount} At-Risk</span>
            <span>·</span>
            <span style="color:#7C3AED;font-weight:700">${data.dlpCount} In DLP</span>
          </div>
        </div>
        
        <div class="portfolio-health-bar" style="height:10px;border-radius:6px;overflow:hidden;display:flex;gap:3px;background:var(--color-bg-page)">
          <div class="portfolio-health-segment on-track" style="width:${data.onTrackPct}%;background:#2563EB;border-radius:4px" title="${data.onTrackCount} On-Track (${data.onTrackPct}%)"></div>
          <div class="portfolio-health-segment at-risk" style="width:${data.atRiskPct}%;background:#475569;border-radius:4px" title="${data.atRiskCount} At-Risk (${data.atRiskPct}%)"></div>
          <div class="portfolio-health-segment dlp" style="width:${data.dlpPct}%;background:#7C3AED;border-radius:4px" title="${data.dlpCount} In DLP (${data.dlpPct}%)"></div>
        </div>
      </div>

      <!-- Top 4 KPI Cards (Commercial Portfolio Overview) -->
      <div class="kpi-grid">
        <!-- Card 1: Active Projects & Portfolio Value -->
        <div class="kpi-card" onclick="App.navigate('projects')" style="cursor:pointer">
          <div class="kpi-header">
            <span class="kpi-label">Active Projects</span>
            <div class="kpi-icon-wrap">${Icons.folder}</div>
          </div>
          <div class="kpi-value">${data.activeCount} Active</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-primary-700)">
            ${data.activeCount} Active Projects | ${data.totalPortfolioValue} Total Portfolio
          </div>
        </div>

        <!-- Card 2: Pending Invoices -->
        <div class="kpi-card" onclick="App.navigate('billing')" style="cursor:pointer">
          <div class="kpi-header">
            <span class="kpi-label">Pending Invoices</span>
            <div class="kpi-icon-wrap">${Icons.fileText}</div>
          </div>
          <div class="kpi-value">${data.totalPendingValue}</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-primary-700)">
            ${data.totalPendingValue} Pending / ${data.totalContractValue} Total
          </div>
        </div>

        <!-- Card 3: BG Expiry Risk -->
        <div class="kpi-card" onclick="App.navigate('bank-guarantees')" style="cursor:pointer">
          <div class="kpi-header">
            <span class="kpi-label">BG Expiry Risk</span>
            <div class="kpi-icon-wrap">${Icons.shield}</div>
          </div>
          <div class="kpi-value">${data.totalActiveBGs} Active BGs</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-ai-700)">
            <span class="badge badge-high" style="font-size:10px;padding:2px 7px;margin-right:4px;font-weight:600">Action Needed</span>
            12 Active BGs | 2 Expiring &lt; 30 Days
          </div>
        </div>

        <!-- Card 4: Retention & DLP Status -->
        <div class="kpi-card" onclick="App.navigate('retention')" style="cursor:pointer">
          <div class="kpi-header">
            <span class="kpi-label">Retention & DLP Status</span>
            <div class="kpi-icon-wrap">${Icons.target}</div>
          </div>
          <div class="kpi-value">${data.retentionBalanceHeld}</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
            ${data.retentionBalanceHeld} Retention Held | ${data.projectsInDLP} Projects in DLP
          </div>
        </div>
      </div>

      <!-- Middle Panels: Project Commercial Progress & BG/DLP Timeline Monitor -->
      <div class="content-grid content-grid-2-1" style="margin-bottom:24px">
        <!-- Left Panel: Project Commercial Progress -->
        <div class="section-card">
          <div class="section-card-header">
            <h3>${Icons.folder} Project Commercial Progress</h3>
            <a href="#projects" class="btn btn-ghost btn-sm">View EPC Portfolio →</a>
          </div>
          <div class="section-card-body" style="padding:10px 20px">
            ${data.projects.slice(0, 5).map(p => `
              <div class="project-progress-row" onclick="App.navigate('project-detail','${p.id}')">
                <div class="project-progress-meta">
                  <div class="project-progress-name" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                    <span>${p.name}</span>
                    <span class="commercial-stage-tag ${p.commercial.stageClass}">${p.commercial.commercialStage}</span>
                  </div>
                  <div class="project-progress-sub">
                    ${p.commercial.contractValueFormatted} Contract · ${p.commercial.packageCode} · ${p.commercial.milestoneCount} milestones · ${p.commercial.pendingInvoicesFormatted} pending
                  </div>
                </div>
                <div class="project-progress-bar-wrap">
                  <div class="progress-bar progress-blue" style="flex:1">
                    <div class="progress-bar-fill" style="width:${p.progress}%"></div>
                  </div>
                  <span class="project-progress-pct">${p.progress}%</span>
                </div>
              </div>`).join('') || '<div class="empty-state" style="padding:32px"><p>No active projects</p></div>'}
          </div>
        </div>

        <!-- Right Panel: BG & DLP Timeline Monitor -->
        <div class="section-card">
          <div class="section-card-header">
            <h3>${Icons.shield} BG & DLP Timeline Monitor</h3>
            <span class="badge badge-high" style="font-size:11px">2 Action Needed</span>
          </div>
          <div class="section-card-body" style="padding:12px 16px">
            <div style="margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
              <div>
                <div style="font-size:14px;font-weight:700;color:var(--color-text-primary);line-height:1.2">12 Active Guarantees</div>
                <div style="font-size:11px;color:var(--color-text-muted);margin-top:1px">Next expiry in 24 days</div>
              </div>
              <button class="btn btn-outline btn-xs" onclick="DashboardScreen.openBatchRenewal()">
                Renew All Due
              </button>
            </div>

            <!-- Precision Executive Micro-Cards -->
            <div class="bg-timeline-list">
              ${data.bgTimeline.map(bg => `
                <div class="bg-timeline-card">
                  <div class="bg-card-header">
                    <div class="bg-card-id-wrap">
                      <span class="bg-micro-icon">${Icons.shield}</span>
                      <span class="bg-id-text">${bg.bgId}</span>
                    </div>
                    <span class="badge ${bg.riskBadgeClass}">${bg.riskText}</span>
                  </div>
                  <div class="bg-card-body">
                    <div class="bg-card-project" title="${bg.projectName}">${bg.projectName}</div>
                    <div class="bg-card-value">${bg.amount} · ${bg.type}</div>
                  </div>
                  <div class="bg-card-footer">
                    <div class="bg-card-date">
                      ${Icons.clock}
                      <span>Due: <strong>${bg.expiryDate}</strong></span>
                    </div>
                    <button class="btn btn-outline btn-xs" 
                            onclick="DashboardScreen.requestRenewal('${bg.bgId}', '${bg.projectName.replace(/'/g, "\\'")}', '${bg.amount}', '${bg.type}')">
                      Renew
                    </button>
                  </div>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Panels: Commercial Table & Overall Team Workload + Activity -->
      <div class="content-grid content-grid-2-1">
        <!-- Left Table: Commercial & Retention Summary Table -->
        <div class="section-card">
          <div class="section-card-header">
            <h3>${Icons.fileText} Commercial & Retention Summary Table</h3>
            <a href="#reports" class="btn btn-ghost btn-sm">Full Ledger Report →</a>
          </div>
          <div class="section-card-body no-pad">
            <div class="table-wrap">
              <table class="table commercial-table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th class="num">Contract Value</th>
                    <th class="num">Pending Invoices</th>
                    <th class="num">Retention Held</th>
                    <th>Release Due Date</th>
                    <th class="center">Release Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.projects.map(p => `
                    <tr>
                      <td>
                        <div class="commercial-project-title" onclick="App.navigate('project-detail','${p.id}')">
                          ${p.name}
                        </div>
                        <div class="commercial-project-code">${p.commercial.packageCode}</div>
                      </td>
                      <td class="num" style="font-weight:600;color:var(--color-text-primary)">
                        ${p.commercial.contractValueExact}
                      </td>
                      <td class="num" style="font-weight:600;color:var(--color-text-primary)">
                        ${p.commercial.pendingInvoicesExact}
                      </td>
                      <td class="num" style="font-weight:600;color:var(--color-text-secondary)">
                        ${p.commercial.retentionHeldExact} <span style="font-size:11px;color:var(--color-text-muted)">(${p.commercial.retentionPct})</span>
                      </td>
                      <td style="font-size:12.5px;color:var(--color-text-secondary);white-space:nowrap">
                        ${p.commercial.releaseDueDateFormatted}
                      </td>
                      <td class="center">
                        <span class="badge ${p.commercial.releaseStatusBadge}">${p.commercial.releaseStatus}</span>
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Side: Overall Team Workload & PMO Real-Time Activity -->
        <div style="display:flex;flex-direction:column;gap:20px">
          <!-- Overall Team Workload (Company-Wide Team Allocation) -->
          <div class="section-card">
            <div class="section-card-header">
              <h3>${Icons.users} Overall Team Workload</h3>
              <a href="#team" class="btn btn-ghost btn-sm">Team Roster →</a>
            </div>
            <div class="section-card-body" style="padding:14px 18px">
              ${assignees.map(dev => {
                const devTasks = allTasks.filter(t => t.assigneeId === dev.id || t.assigneeId === dev.userId || (dev.id === 'm2' && t.assigneeId === 'preet') || (dev.id === 'm3' && t.assigneeId === 'mohit') || (dev.id === 'm4' && t.assigneeId === 'hirvi'));
                const active = devTasks.filter(t => t.status !== 'done').length;
                const done = devTasks.filter(t => t.status === 'done').length;
                const total = devTasks.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return `
                  <div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--color-border-subtle)">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                      <div style="display:flex;align-items:center;gap:8px">
                        <div class="avatar avatar-sm" style="background:${dev.color};font-weight:700;font-size:11px">${dev.initials || dev.name.slice(0,2)}</div>
                        <div>
                          <div style="font-size:13px;font-weight:700;color:var(--color-text-primary)">${dev.name}</div>
                          <div style="font-size:11px;color:var(--color-text-muted)">${dev.role}</div>
                        </div>
                      </div>
                      <div style="text-align:right">
                        <div style="font-size:12px;font-weight:700;color:var(--color-text-primary)">${active} Active · ${done} Done</div>
                        <div style="font-size:10.5px;color:var(--color-text-muted)">${pct}% Velocity</div>
                      </div>
                    </div>
                    <div class="progress-bar progress-blue" style="height:6px">
                      <div class="progress-bar-fill" style="width:${pct}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- PMO Real-Time Automated Activity -->
          <div class="section-card">
            <div class="section-card-header">
              <h3>${Icons.activity} PMO Automated Activity</h3>
              <span class="badge badge-active" style="font-size:11px">Real-Time</span>
            </div>
            <div class="section-card-body" style="padding:10px 18px">
              <div class="activity-feed">
                ${data.pmoActivities.slice(0, 4).map(a => `
                  <div class="activity-item">
                    <div class="activity-icon ${a.type}" style="display:flex;align-items:center;justify-content:center">
                      ${a.icon}
                    </div>
                    <div>
                      <div class="activity-text" style="font-size:12.5px;line-height:1.45">${a.html}</div>
                      <div class="activity-time" style="margin-top:3px;display:flex;align-items:center;gap:6px">
                        <span>${a.time}</span>
                        <span style="display:inline-block;width:3px;height:3px;border-radius:50%;background:var(--color-text-disabled)"></span>
                        <span style="font-size:10.5px;font-weight:600;color:var(--color-primary-700)">${a.tag}</span>
                      </div>
                    </div>
                  </div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ─── 2. Personalized AI Developer Dashboard ───
  _renderDeveloperDashboard(user) {
    const allTasks = Store.getTasks();
    const allIssues = Store.getIssues();
    const allProjects = Store.getProjects();
    const now = new Date();
    const timeGreeting = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';
    const firstName = user.name ? user.name.split(' ')[0] : 'there';
    const todayStr = now.toISOString().split('T')[0];

    // Helper: Determine if item is assigned to current user
    const isAssigned = (item) => {
      if (!item) return false;
      return item.assigneeId === user.id ||
             item.assigneeId === user.memberId ||
             (user.id === 'preet' && item.assigneeId === 'm2') ||
             (user.id === 'mohit' && item.assigneeId === 'm3') ||
             (user.id === 'hirvi' && item.assigneeId === 'm4') ||
             (user.memberId === 'm2' && item.assigneeId === 'preet') ||
             (user.memberId === 'm3' && item.assigneeId === 'mohit') ||
             (user.memberId === 'm4' && item.assigneeId === 'hirvi');
    };

    // Personalized Metrics strictly filtered by currentUser.id / memberId
    const userTasks = allTasks.filter(t => isAssigned(t));
    const activeTasks = userTasks.filter(t => t.status !== 'done');
    const completedTasks = userTasks.filter(t => t.status === 'done');
    const overdueTasks = activeTasks.filter(t => Utils.isOverdue(t.dueDate));
    const userIssues = allIssues.filter(i => isAssigned(i) && i.status === 'open');
    const completionRate = userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 0;

    // "My Remaining Work" sorted strictly by urgency: Overdue -> High Priority -> Due Today -> Due Soon
    const sortedRemaining = [...activeTasks].sort((a, b) => {
      const aOverdue = Utils.isOverdue(a.dueDate);
      const bOverdue = Utils.isOverdue(b.dueDate);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      const aHigh = a.priority === 'high';
      const bHigh = b.priority === 'high';
      if (aHigh && !bHigh) return -1;
      if (!aHigh && bHigh) return 1;

      const aToday = a.dueDate === todayStr;
      const bToday = b.dueDate === todayStr;
      if (aToday && !bToday) return -1;
      if (!aToday && bToday) return 1;

      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });

    // "My Projects": Projects containing tasks assigned to currentUser.id
    const userProjectIds = new Set(userTasks.map(t => t.projectId));
    const userProjects = allProjects.filter(p => userProjectIds.has(p.id));

    // "My Upcoming Deadlines": Chronological list of task/issue due dates assigned to currentUser.id
    const deadlines = [
      ...activeTasks.filter(t => t.dueDate).map(t => ({
        id: t.id,
        itemType: 'task',
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
        projectId: t.projectId,
        status: t.status
      })),
      ...userIssues.map(i => ({
        id: i.id,
        itemType: 'issue',
        title: i.title,
        dueDate: i.createdAt ? i.createdAt.split('T')[0] : todayStr,
        priority: i.priority,
        projectId: i.projectId,
        status: i.status
      }))
    ].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

    // Status breakdown for workload distribution
    const statusCounts = {
      'in-progress': userTasks.filter(t => t.status === 'in-progress').length,
      review: userTasks.filter(t => t.status === 'review').length,
      todo: userTasks.filter(t => t.status === 'todo').length,
      done: completedTasks.length
    };

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Good ${timeGreeting}, ${firstName}</h1>
          <p>AI Developer Workspace · Real-time task execution, active deadlines & remaining sprint work.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="TasksScreen.openCreateModal()">
            ${Icons.plus} New Task
          </button>
          <button class="btn btn-ai" onclick="App.openCommand()">
            ${Icons.bot} Ask Hintonn Agent
          </button>
        </div>
      </div>

      <!-- Top 4 Developer KPI Cards strictly for currentUser -->
      <div class="kpi-grid">
        <!-- Card 1: My Active Tasks -->
        <div class="kpi-card" onclick="App.navigate('tasks')" style="cursor:pointer">
          <div class="kpi-header">
            <span class="kpi-label">My Active Tasks</span>
            <div class="kpi-icon-wrap">${Icons.checkSquare}</div>
          </div>
          <div class="kpi-value">${activeTasks.length} Active</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-primary-700)">
            ${userTasks.length} Assigned Tasks · Active Work
          </div>
        </div>

        <!-- Card 2: My Completed Tasks -->
        <div class="kpi-card" onclick="App.navigate('tasks')" style="cursor:pointer">
          <div class="kpi-header">
            <span class="kpi-label">My Completed Tasks</span>
            <div class="kpi-icon-wrap">${Icons.check}</div>
          </div>
          <div class="kpi-value">${completedTasks.length} Done</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-primary-700)">
            ${completionRate}% Completion Rate
          </div>
        </div>

        <!-- Card 3: My Overdue Tasks -->
        <div class="kpi-card" onclick="App.navigate('tasks')" style="cursor:pointer">
          <div class="kpi-header">
            <span class="kpi-label">My Overdue Tasks</span>
            <div class="kpi-icon-wrap">${Icons.alertCircle}</div>
          </div>
          <div class="kpi-value">${overdueTasks.length} Overdue</div>
          <div class="kpi-change neutral" style="font-weight:600;color:${overdueTasks.length > 0 ? 'var(--color-ai-700)' : 'var(--color-text-secondary)'}">
            ${overdueTasks.length > 0 ? '<span class="badge badge-high" style="font-size:10px;padding:2px 7px;margin-right:4px">Urgent</span> Action Required' : 'All Tasks On Schedule'}
          </div>
        </div>

        <!-- Card 4: My Open Issues & Workload -->
        <div class="kpi-card" onclick="App.navigate('issues')" style="cursor:pointer">
          <div class="kpi-header">
            <span class="kpi-label">My Open Issues & Workload</span>
            <div class="kpi-icon-wrap">${Icons.target}</div>
          </div>
          <div class="kpi-value">${userIssues.length} Open Issues</div>
          <div class="kpi-change neutral" style="font-weight:600;color:var(--color-text-secondary)">
            ${activeTasks.length + userIssues.length} Total Workload Units
          </div>
        </div>
      </div>

      <!-- Middle Grid: My Remaining Work (Left 2fr) & My Projects (Right 1fr) -->
      <div class="content-grid content-grid-2-1" style="margin-bottom:24px">
        <!-- Left Panel: My Remaining Work -->
        <div class="section-card">
          <div class="section-card-header">
            <div style="display:flex;align-items:center;gap:8px">
              <h3>${Icons.clock} My Remaining Work</h3>
              <span class="badge badge-active" style="font-size:11px">${sortedRemaining.length} Incomplete</span>
            </div>
            <a href="#tasks" class="btn btn-ghost btn-sm">All Tasks →</a>
          </div>
          <div class="section-card-body" style="padding:12px 18px">
            ${sortedRemaining.length > 0 ? `
              <div style="display:flex;flex-direction:column;gap:8px">
                ${sortedRemaining.map(t => {
                  const p = Store.getProject(t.projectId);
                  const isOverdue = Utils.isOverdue(t.dueDate);
                  const isToday = t.dueDate === todayStr;
                  return `
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);gap:12px;transition:box-shadow 0.15s ease">
                      <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
                        <span class="priority-dot priority-${t.priority}"></span>
                        <div style="min-width:0;flex:1">
                          <div style="font-size:13.5px;font-weight:600;color:var(--color-text-primary);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" onclick="TasksScreen.openDetailModal('${t.id}')">
                            ${t.title}
                          </div>
                          <div style="display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--color-text-muted);margin-top:2px">
                            ${p ? `<span>${p.name}</span>` : ''}
                            <span>•</span>
                            <span class="badge badge-${t.priority}" style="font-size:10px;padding:1px 6px">${Utils.humanize(t.priority)}</span>
                          </div>
                        </div>
                      </div>

                      <div style="display:flex;align-items:center;gap:10px">
                        <div style="font-size:12px;text-align:right">
                          <span style="font-weight:600;color:${isOverdue ? 'var(--color-error-600)' : isToday ? 'var(--color-ai-700)' : 'var(--color-text-secondary)'}">
                            ${t.dueDate ? Utils.formatDate(t.dueDate) : 'No Date'}
                          </span>
                          ${isOverdue ? '<div style="font-size:10px;color:var(--color-error-600);font-weight:700">OVERDUE</div>' : ''}
                          ${isToday ? '<div style="font-size:10px;color:var(--color-ai-700);font-weight:700">DUE TODAY</div>' : ''}
                        </div>
                        <select class="form-select" style="height:30px;font-size:11.5px;padding:0 24px 0 8px;width:auto;border-radius:6px" onchange="DashboardScreen.updateTaskStatus('${t.id}', this.value)">
                          ${['todo','in-progress','review','done'].map(s => `<option value="${s}" ${t.status===s?'selected':''}>${Utils.humanize(s)}</option>`).join('')}
                        </select>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="empty-state" style="padding:32px">
                <div class="empty-state-icon">${Icons.check}</div>
                <h3>All Caught Up!</h3>
                <p>You have no pending tasks remaining. Great job!</p>
              </div>
            `}
          </div>
        </div>

        <!-- Right Panel: My Projects -->
        <div class="section-card">
          <div class="section-card-header">
            <h3>${Icons.folder} My Projects</h3>
            <span class="badge badge-active" style="font-size:11px">${userProjects.length} Active</span>
          </div>
          <div class="section-card-body" style="padding:12px 16px">
            ${userProjects.length > 0 ? `
              <div style="display:flex;flex-direction:column;gap:12px">
                ${userProjects.map(p => {
                  const pUserTasks = userTasks.filter(t => t.projectId === p.id);
                  const pUserDone = pUserTasks.filter(t => t.status === 'done').length;
                  const pUserPct = pUserTasks.length > 0 ? Math.round((pUserDone / pUserTasks.length) * 100) : 0;
                  return `
                    <div style="padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-bg-page);cursor:pointer;transition:transform 0.15s ease" onclick="App.navigate('project-detail','${p.id}')">
                      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                        <span style="font-size:13.5px;font-weight:700;color:var(--color-text-primary)">${p.name}</span>
                        <span class="badge badge-${p.status}" style="font-size:10px;padding:1px 6px">${Utils.humanize(p.status)}</span>
                      </div>
                      <div style="font-size:11.5px;color:var(--color-text-muted);margin-bottom:8px">
                        ${p.type} · ${pUserDone}/${pUserTasks.length} tasks completed
                      </div>
                      <div class="progress-bar progress-blue" style="height:6px">
                        <div class="progress-bar-fill" style="width:${pUserPct}%"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div style="text-align:center;padding:24px;color:var(--color-text-muted);font-size:13px">
                No active projects assigned
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Bottom Grid: My Upcoming Deadlines (Left 2fr) & My Workload & Focus (Right 1fr) -->
      <div class="content-grid content-grid-2-1">
        <!-- Left Panel: My Upcoming Deadlines -->
        <div class="section-card">
          <div class="section-card-header">
            <h3>${Icons.calendar} My Upcoming Deadlines</h3>
            <span class="badge badge-active" style="font-size:11px">${deadlines.length} Upcoming</span>
          </div>
          <div class="section-card-body" style="padding:12px 18px">
            ${deadlines.length > 0 ? `
              <div style="display:flex;flex-direction:column;gap:8px">
                ${deadlines.slice(0, 6).map(d => {
                  const p = Store.getProject(d.projectId);
                  const isOverdue = Utils.isOverdue(d.dueDate);
                  const isToday = d.dueDate === todayStr;
                  return `
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);gap:12px">
                      <div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1">
                        <div style="width:36px;height:36px;border-radius:8px;background:${isOverdue ? '#FEE2E2' : 'var(--color-primary-50)'};color:${isOverdue ? '#DC2626' : 'var(--color-primary-700)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                          ${d.itemType === 'issue' ? Icons.alertCircle : Icons.calendar}
                        </div>
                        <div style="min-width:0;flex:1">
                          <div style="font-size:13px;font-weight:600;color:var(--color-text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                            ${d.title}
                          </div>
                          <div style="font-size:11px;color:var(--color-text-muted);display:flex;align-items:center;gap:6px;margin-top:2px">
                            <span>${p ? p.name : 'Workspace'}</span>
                            <span>•</span>
                            <span style="text-transform:capitalize">${d.itemType}</span>
                          </div>
                        </div>
                      </div>

                      <div style="text-align:right">
                        <div style="font-size:12px;font-weight:700;color:${isOverdue ? 'var(--color-error-600)' : isToday ? 'var(--color-ai-700)' : 'var(--color-text-primary)'}">
                          ${Utils.formatDate(d.dueDate)}
                        </div>
                        <div style="font-size:10px;font-weight:600;color:${isOverdue ? 'var(--color-error-600)' : isToday ? 'var(--color-ai-700)' : 'var(--color-text-muted)'}">
                          ${isOverdue ? 'OVERDUE' : isToday ? 'DUE TODAY' : 'Upcoming'}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div style="text-align:center;padding:24px;color:var(--color-text-muted);font-size:13px">
                No upcoming deadlines on schedule
              </div>
            `}
          </div>
        </div>

        <!-- Right Panel: My Workload & Focus Distribution -->
        <div class="section-card">
          <div class="section-card-header">
            <h3>${Icons.barChart} My Workload & Focus</h3>
            <span class="badge badge-active" style="font-size:11px">${userTasks.length} Tasks</span>
          </div>
          <div class="section-card-body" style="padding:14px 18px">
            <!-- Status Breakdown -->
            <div style="margin-bottom:18px">
              <div style="font-size:11.5px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:8px">Status Breakdown</div>
              <div style="display:flex;flex-direction:column;gap:6px">
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px">
                  <span style="color:var(--color-text-secondary)">In Progress</span>
                  <strong style="color:var(--color-primary-700)">${statusCounts['in-progress']}</strong>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px">
                  <span style="color:var(--color-text-secondary)">Under Review</span>
                  <strong style="color:var(--color-ai-700)">${statusCounts.review}</strong>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px">
                  <span style="color:var(--color-text-secondary)">To Do / Backlog</span>
                  <strong>${statusCounts.todo}</strong>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px">
                  <span style="color:var(--color-text-secondary)">Completed</span>
                  <strong style="color:var(--color-success-700, #15803D)">${statusCounts.done}</strong>
                </div>
              </div>
            </div>

            <!-- Open Issues Card -->
            <div style="padding:12px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md)">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                <span style="font-size:12.5px;font-weight:700;color:var(--color-text-primary)">Open Issues</span>
                <span class="badge ${userIssues.length > 0 ? 'badge-high' : 'badge-active'}" style="font-size:10px">${userIssues.length} Assigned</span>
              </div>
              <p style="font-size:11.5px;color:var(--color-text-muted);margin:0 0 8px 0">Active blockers assigned to your profile</p>
              <a href="#issues" class="btn btn-outline btn-xs" style="width:100%;justify-content:center">View Open Issues →</a>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  updateTaskStatus(taskId, status) {
    Store.updateTask(taskId, { status });
    Toast.show(`Task moved to ${Utils.humanize(status)}`);
    App.refresh();
  },

  _getUserName(id) {
    const m = Store.getMember(id);
    return m ? m.name.split(' ')[0] : 'there';
  },

  // Interactive Action: Request Bank Guarantee Renewal
  requestRenewal(bgId, projectName, amount, type) {
    const formHtml = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <p style="font-size:13.5px;color:var(--color-text-secondary);line-height:1.5">
          Initiate an automated renewal & extension request for <strong>${bgId}</strong> with the issuing commercial bank.
        </p>
        <div style="background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:12px 14px;font-size:12.5px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><span style="color:var(--color-text-muted)">Guarantee ID:</span> <strong style="color:var(--color-text-primary)">${bgId}</strong></div>
          <div><span style="color:var(--color-text-muted)">Amount:</span> <strong style="color:var(--color-text-primary)">${amount}</strong></div>
          <div><span style="color:var(--color-text-muted)">Project:</span> <strong style="color:var(--color-text-primary)">${projectName}</strong></div>
          <div><span style="color:var(--color-text-muted)">Guarantee Type:</span> <strong style="color:var(--color-text-primary)">${type}</strong></div>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12.5px;font-weight:600">Extension Period</label>
          <select class="form-control" id="renewal-period">
            <option value="90">90 Days Extension (Standard EPC)</option>
            <option value="180">180 Days Extension (6 Months)</option>
            <option value="365">365 Days Extension (1 Year / DLP Period)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12.5px;font-weight:600">Commercial Notes / Reference</label>
          <textarea class="form-control" id="renewal-notes" rows="2" placeholder="e.g., Extension requested as per EPC Clause 14.2 due to phase milestone schedule shift."></textarea>
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" onclick="Modal.closeAll()">Cancel</button>
      <button class="btn btn-primary" onclick="DashboardScreen._submitRenewal('${bgId}')">
        ${Icons.check} Submit Renewal Request
      </button>
    `;

    Modal.open(`Request Renewal: ${bgId}`, formHtml, footerHtml);
  },

  _submitRenewal(bgId) {
    Modal.closeAll();
    Toast.show(`Renewal request dispatched for ${bgId}. PMO ledger updated & issuing bank notified.`, 'success', 4000);
  },

  openBatchRenewal() {
    Modal.confirm(
      'Batch BG Renewal Request',
      'Are you sure you want to trigger automated renewal notices for all 2 Bank Guarantees expiring within 60 days (BG-2026-001 and BG-2025-091)?',
      () => {
        Toast.show('Batch renewal requests submitted for 2 active Bank Guarantees.', 'success', 4000);
      },
      { confirmText: 'Dispatched Renewals' }
    );
  },

  openCommercialAudit() {
    const auditHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;font-size:13px;line-height:1.5;color:var(--color-text-secondary)">
        <div style="display:flex;align-items:center;gap:10px;padding:12px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:var(--radius-md)">
          <div style="color:#15803D">${Icons.check}</div>
          <div style="color:#15803D;font-weight:600">EPC Commercial Portfolio Health: 94.2% Optimized</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md)">
            <div style="font-size:11px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase">Total Portfolio Value</div>
            <div style="font-size:18px;font-weight:700;color:var(--color-text-primary);margin-top:2px">$14,200,000</div>
            <div style="font-size:11.5px;color:var(--color-text-muted)">5 Active EPC Packages</div>
          </div>
          <div style="padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md)">
            <div style="font-size:11px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase">Pending Invoices</div>
            <div style="font-size:18px;font-weight:700;color:var(--color-text-primary);margin-top:2px">$1,800,000</div>
            <div style="font-size:11.5px;color:var(--color-text-muted)">12.7% of Portfolio under billing</div>
          </div>
        </div>
        <div style="padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md)">
          <div style="font-size:12px;font-weight:700;color:var(--color-text-primary);margin-bottom:6px">AI PMO Recommendations:</div>
          <ul style="padding-left:18px;margin:0;display:flex;flex-direction:column;gap:4px">
            <li>Dispatch BG renewal for <strong>BG-2026-001 ($580K)</strong> before Oct 01 to prevent bank forfeiture grace period.</li>
            <li>Initiate final DLP exit inspection on <strong>Website & Facilities</strong> to release $140K retention tranche.</li>
            <li>Follow up on Invoice #104 ($410K) milestone certification with client PM.</li>
          </ul>
        </div>
      </div>
    `;

    Modal.open('EPC Commercial Portfolio Audit', auditHtml, `<button class="btn btn-primary" onclick="Modal.closeAll()">Done</button>`, { large: true });
  }
};
