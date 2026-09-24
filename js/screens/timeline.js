// ─── Executive Macro-Level Gantt Chart Screen ───
const TimelineScreen = {
  _viewScale: 'month', // 'day' | 'week' | 'month' (default: 'month')
  _activeStage: 'all', // 'all' | 'execution' | 'dlp' | 'planning'
  _search: '',
  _expandedProjects: {}, // Project IDs expanded in left column

  // Getter/Setter for backwards compatibility with tests and scripts
  get _scale() { return this._viewScale; },
  set _scale(val) { this._viewScale = val; },

  // Commercial EPC Packages Data
  _projects: [
    {
      id: 'p1',
      packageNo: 'PKG-01',
      name: 'Main Substation EPC',
      stage: 'execution',
      stageLabel: 'Execution / Construction',
      stagePillClass: 'stage-pill-exec',
      barClass: 'stage-exec',
      fillClass: 'fill-exec',
      contractValue: '$5.4M',
      progress: 68,
      startDate: '2026-07-01',
      endDate: '2026-12-31',
      bgExpiry: 'Jan 15, 2027 (PBG $1.42M)',
      assigneeIds: ['m2', 'm3'],
      phases: [
        { id: 'ph1-1', name: 'Engineering & Procurement', start: '2026-07-01', end: '2026-08-31', progress: 100, stage: 'execution', assigneeIds: ['m2'] },
        { id: 'ph1-2', name: 'Substation Erection & Civil', start: '2026-09-01', end: '2026-10-31', progress: 75, stage: 'execution', assigneeIds: ['m3'] },
        { id: 'ph1-3', name: 'Testing & Commissioning', start: '2026-11-01', end: '2026-12-31', progress: 10, stage: 'execution', assigneeIds: ['m2', 'm4'] }
      ],
      milestones: [
        { id: 'ms1-1', name: 'Transformer Arrival & Base Seating', date: '2026-09-28', status: 'active-sep', isPulse: true, priority: 'high', color: '#DC2626' },
        { id: 'ms1-2', name: 'Energization Milestone', date: '2026-12-15', status: 'upcoming', isPulse: false, priority: 'normal', color: '#059669' }
      ]
    },
    {
      id: 'p2',
      packageNo: 'PKG-02',
      name: 'Civil & Site Facilities',
      stage: 'execution',
      stageLabel: 'Execution / Construction',
      stagePillClass: 'stage-pill-exec',
      barClass: 'stage-exec',
      fillClass: 'fill-exec',
      contractValue: '$3.8M',
      progress: 42,
      startDate: '2026-08-15',
      endDate: '2026-11-30',
      bgExpiry: 'Dec 15, 2026 (PBG $680K)',
      assigneeIds: ['m3', 'm4'],
      phases: [
        { id: 'ph2-1', name: 'Earthworks & Foundation', start: '2026-08-15', end: '2026-09-30', progress: 80, stage: 'execution', assigneeIds: ['m3'] },
        { id: 'ph2-2', name: 'Superstructure & Cladding', start: '2026-10-01', end: '2026-11-30', progress: 15, stage: 'execution', assigneeIds: ['m4'] }
      ],
      milestones: [
        { id: 'ms2-1', name: 'Foundation Plinth Inspection', date: '2026-09-24', status: 'active-sep', isPulse: true, priority: 'normal', color: '#059669' },
        { id: 'ms2-2', name: 'Roof Truss Structural Lock', date: '2026-10-25', status: 'upcoming', isPulse: false, priority: 'normal', color: '#059669' }
      ]
    },
    {
      id: 'p3',
      packageNo: 'PKG-03',
      name: 'HVAC & Utilities Package',
      stage: 'planning',
      stageLabel: 'Planning / Design',
      stagePillClass: 'stage-pill-plan',
      barClass: 'stage-plan',
      fillClass: 'fill-plan',
      contractValue: '$2.1M',
      progress: 15,
      startDate: '2026-09-15',
      endDate: '2027-01-31',
      bgExpiry: 'Feb 28, 2027 (ABG $280K)',
      assigneeIds: ['m2', 'm4'],
      phases: [
        { id: 'ph3-1', name: 'Detailed Design Approval', start: '2026-09-15', end: '2026-10-15', progress: 40, stage: 'planning', assigneeIds: ['m2'] },
        { id: 'ph3-2', name: 'Ductwork & Piping Fab', start: '2026-10-16', end: '2026-12-15', progress: 0, stage: 'planning', assigneeIds: ['m4'] },
        { id: 'ph3-3', name: 'Chiller Unit Installation', start: '2026-12-16', end: '2027-01-31', progress: 0, stage: 'planning', assigneeIds: ['m2'] }
      ],
      milestones: [
        { id: 'ms3-1', name: 'Design Baseline Approval', date: '2026-10-10', status: 'upcoming', isPulse: false, priority: 'normal', color: '#059669' }
      ]
    },
    {
      id: 'p4',
      packageNo: 'PKG-04',
      name: 'Automation & SCADA',
      stage: 'dlp',
      stageLabel: 'Handover & DLP Timelines',
      stagePillClass: 'stage-pill-dlp',
      barClass: 'stage-dlp',
      fillClass: 'fill-dlp',
      contractValue: '$1.6M',
      progress: 90,
      startDate: '2026-06-01',
      endDate: '2026-11-15',
      bgExpiry: 'Nov 30, 2026 (PBG $320K)',
      assigneeIds: ['m2', 'm3', 'm4'],
      phases: [
        { id: 'ph4-1', name: 'SCADA Logic FAT', start: '2026-06-01', end: '2026-07-31', progress: 100, stage: 'dlp', assigneeIds: ['m2'] },
        { id: 'ph4-2', name: 'Site SAT & Integration', start: '2026-08-01', end: '2026-09-30', progress: 95, stage: 'dlp', assigneeIds: ['m3'] },
        { id: 'ph4-3', name: 'Handover & Trial Ops', start: '2026-10-01', end: '2026-11-15', progress: 20, stage: 'dlp', assigneeIds: ['m4'] }
      ],
      milestones: [
        { id: 'ms4-1', name: 'SAT Verification Sign-off', date: '2026-09-30', status: 'active-sep', isPulse: true, priority: 'high', color: '#DC2626' },
        { id: 'ms4-2', name: 'Taking-Over Certificate (TOC)', date: '2026-11-15', status: 'upcoming', isPulse: false, priority: 'normal', color: '#059669' }
      ]
    },
    {
      id: 'p5',
      packageNo: 'PKG-05',
      name: 'Transmission Line Package',
      stage: 'dlp',
      stageLabel: 'Handover & DLP Timelines',
      stagePillClass: 'stage-pill-dlp',
      barClass: 'stage-dlp',
      fillClass: 'fill-dlp',
      contractValue: '$1.3M',
      progress: 100,
      startDate: '2026-05-01',
      endDate: '2027-02-28',
      bgExpiry: 'Mar 31, 2027 (MBG $190K)',
      assigneeIds: ['m3'],
      phases: [
        { id: 'ph5-1', name: 'Final Handover / TOC', start: '2026-05-01', end: '2026-08-31', progress: 100, stage: 'dlp', assigneeIds: ['m3'] },
        { id: 'ph5-2', name: 'Defect Liability Period (DLP)', start: '2026-09-01', end: '2027-02-28', progress: 25, stage: 'dlp', assigneeIds: ['m3'] }
      ],
      milestones: [
        { id: 'ms5-1', name: 'Quarterly DLP Defect Audit', date: '2026-11-15', status: 'upcoming', isPulse: false, priority: 'normal', color: '#059669' },
        { id: 'ms5-2', name: 'Final DLP Discharge & Retention Release', date: '2027-02-28', status: 'upcoming', isPulse: false, priority: 'normal', color: '#059669' }
      ]
    }
  ],

  // ─── Time Windows Config ───
  _getWindow() {
    if (this._viewScale === 'day') {
      return {
        key: 'day',
        start: new Date(2026, 8, 1, 0, 0, 0),     // Sept 1, 2026
        end: new Date(2026, 8, 30, 23, 59, 59),   // Sept 30, 2026
        totalDays: 30,
        days: [
          { num: 1, day: 'Tue', isToday: false },
          { num: 2, day: 'Wed', isToday: false },
          { num: 3, day: 'Thu', isToday: false },
          { num: 4, day: 'Fri', isToday: false },
          { num: 5, day: 'Sat', isToday: false },
          { num: 6, day: 'Sun', isToday: false },
          { num: 7, day: 'Mon', isToday: false },
          { num: 8, day: 'Tue', isToday: false },
          { num: 9, day: 'Wed', isToday: false },
          { num: 10, day: 'Thu', isToday: false },
          { num: 11, day: 'Fri', isToday: false },
          { num: 12, day: 'Sat', isToday: false },
          { num: 13, day: 'Sun', isToday: false },
          { num: 14, day: 'Mon', isToday: false },
          { num: 15, day: 'Tue', isToday: false },
          { num: 16, day: 'Wed', isToday: false },
          { num: 17, day: 'Thu', isToday: false },
          { num: 18, day: 'Fri', isToday: false },
          { num: 19, day: 'Sat', isToday: false },
          { num: 20, day: 'Sun', isToday: false },
          { num: 21, day: 'Mon', isToday: false },
          { num: 22, day: 'Tue', isToday: false },
          { num: 23, day: 'Wed', isToday: true },  // TODAY
          { num: 24, day: 'Thu', isToday: false },
          { num: 25, day: 'Fri', isToday: false },
          { num: 26, day: 'Sat', isToday: false },
          { num: 27, day: 'Sun', isToday: false },
          { num: 28, day: 'Mon', isToday: false },
          { num: 29, day: 'Tue', isToday: false },
          { num: 30, day: 'Wed', isToday: false }
        ]
      };
    } else if (this._viewScale === 'week') {
      return {
        key: 'week',
        start: new Date(2026, 8, 1, 0, 0, 0),     // Sept 1, 2026
        end: new Date(2026, 10, 24, 23, 59, 59),  // Nov 24, 2026 (12 weeks = 84 days)
        totalDays: 84,
        weeks: [
          { key: 'w1', label: 'Week 1', range: 'Sep 1 - Sep 7', isCurrent: false },
          { key: 'w2', label: 'Week 2', range: 'Sep 8 - Sep 14', isCurrent: false },
          { key: 'w3', label: 'Week 3', range: 'Sep 15 - Sep 21', isCurrent: false },
          { key: 'w4', label: 'Week 4', range: 'Sep 22 - Sep 28', isCurrent: true }, // TODAY
          { key: 'w5', label: 'Week 5', range: 'Sep 29 - Oct 5', isCurrent: false },
          { key: 'w6', label: 'Week 6', range: 'Oct 6 - Oct 12', isCurrent: false },
          { key: 'w7', label: 'Week 7', range: 'Oct 13 - Oct 19', isCurrent: false },
          { key: 'w8', label: 'Week 8', range: 'Oct 20 - Oct 26', isCurrent: false },
          { key: 'w9', label: 'Week 9', range: 'Oct 27 - Nov 2', isCurrent: false },
          { key: 'w10', label: 'Week 10', range: 'Nov 3 - Nov 9', isCurrent: false },
          { key: 'w11', label: 'Week 11', range: 'Nov 10 - Nov 16', isCurrent: false },
          { key: 'w12', label: 'Week 12', range: 'Nov 17 - Nov 24', isCurrent: false }
        ]
      };
    } else {
      // Month View (Default 6-Month Horizon)
      return {
        key: 'month',
        start: new Date(2026, 8, 1, 0, 0, 0),   // Sept 1, 2026
        end: new Date(2027, 1, 28, 23, 59, 59), // Feb 28, 2027
        totalDays: 181,
        months: [
          { key: 'sep', label: 'SEP 2026', days: 30, isCurrent: true },
          { key: 'oct', label: 'OCT 2026', days: 31, isCurrent: false },
          { key: 'nov', label: 'NOV 2026', days: 30, isCurrent: false },
          { key: 'dec', label: 'DEC 2026', days: 31, isCurrent: false },
          { key: 'jan', label: 'JAN 2027', days: 31, isCurrent: false },
          { key: 'feb', label: 'FEB 2027', days: 28, isCurrent: false }
        ]
      };
    }
  },

  // Backwards compatibility reference
  get _window() {
    return this._getWindow();
  },

  // ─── Team Members Helper ───
  _getMember(id) {
    if (typeof Store !== 'undefined' && Store.getMember) {
      const m = Store.getMember(id);
      if (m) return m;
    }
    const fallback = {
      'm1': { id: 'm1', name: 'Ayush Desai', initials: 'AD', color: '#2563EB', role: 'Admin' },
      'm2': { id: 'm2', name: 'Preet Bhavsar', initials: 'PB', color: '#7C3AED', role: 'AI Developer' },
      'm3': { id: 'm3', name: 'Mohit Jain', initials: 'MJ', color: '#4F46E5', role: 'AI Developer' },
      'm4': { id: 'm4', name: 'Hirvi Sanghavi', initials: 'HS', color: '#1D4ED8', role: 'AI Developer' }
    };
    return fallback[id] || { id, name: id, initials: id.slice(0, 2).toUpperCase(), color: '#64748B', role: 'Member' };
  },

  _renderAvatars(memberIds) {
    if (!memberIds || memberIds.length === 0) return '';
    return `
      <div class="timeline-assignees-stack">
        ${memberIds.map(id => {
          const m = this._getMember(id);
          return `<span class="timeline-assignee-avatar" style="background:${m.color}" title="${m.name} (${m.role || 'Assignee'})">${m.initials}</span>`;
        }).join('')}
      </div>
    `;
  },

  _getDurationDays(startStr, endStr) {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  },

  // ─── Filter & Search Handlers ───
  _getFilteredData() {
    let list = this._projects;

    if (this._activeStage !== 'all') {
      list = list.filter(p => p.stage === this._activeStage);
    }

    if (this._search) {
      const q = this._search.toLowerCase().trim();
      list = list.filter(p => {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesPkg = p.packageNo.toLowerCase().includes(q);
        const matchesPhase = p.phases && p.phases.some(ph => ph.name.toLowerCase().includes(q));
        const matchesMilestone = p.milestones && p.milestones.some(ms => ms.name.toLowerCase().includes(q));
        const matchesAssignee = p.assigneeIds && p.assigneeIds.some(id => {
          const m = this._getMember(id);
          return m && m.name.toLowerCase().includes(q);
        });
        return matchesName || matchesPkg || matchesPhase || matchesMilestone || matchesAssignee;
      });
    }

    return {
      list,
      total: this._projects.length,
      filtered: list.length
    };
  },

  toggleProject(projectId) {
    this._expandedProjects[projectId] = !this._expandedProjects[projectId];
    this.updateTimelineContainer();
  },

  setScale(scale) {
    if (['day', 'week', 'month'].includes(scale)) {
      this._viewScale = scale;
      if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
        const buttons = document.querySelectorAll('.timeline-scale-tab');
        if (buttons && buttons.forEach) {
          buttons.forEach(b => {
            const s = b.getAttribute ? b.getAttribute('data-scale') : null;
            if (s === scale) b.classList.add('active');
            else b.classList.remove('active');
          });
        }
      }
      this.updateTimelineContainer();
    }
  },

  setStage(stage) {
    this._activeStage = stage;
    if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
      const buttons = document.querySelectorAll('.timeline-stage-tab');
      if (buttons && buttons.forEach) {
        buttons.forEach(b => {
          const s = b.getAttribute ? b.getAttribute('data-stage') : null;
          if (s === stage) b.classList.add('active');
          else b.classList.remove('active');
        });
      }
    }
    this.updateTimelineContainer();
  },

  setSearch(q) {
    this._search = q;
    const clearBtn = document.getElementById('timeline-search-clear');
    if (clearBtn) {
      if (q) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }
    this.updateTimelineContainer();
  },

  clearSearch() {
    this._search = '';
    const input = document.getElementById('timeline-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    const clearBtn = document.getElementById('timeline-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.updateTimelineContainer();
  },

  updateTimelineContainer() {
    const container = document.getElementById('timeline-gantt-wrapper');
    const headerTitle = document.getElementById('timeline-horizon-title');
    if (headerTitle) {
      if (this._viewScale === 'day') headerTitle.textContent = 'September 2026 Daily Sprint & Task Grid';
      else if (this._viewScale === 'week') headerTitle.textContent = '12-Week Commercial Execution Roadmap';
      else headerTitle.textContent = 'Commercial EPC 6-Month Horizon';
    }

    if (container) {
      const data = this._getFilteredData();
      container.innerHTML = this._renderGanttGrid(data.list);
    } else {
      this.refresh();
    }
  },

  refresh() {
    const content = document.getElementById('page-content');
    if (content && App.currentScreen === 'timeline') {
      content.innerHTML = this.render();
    }
  },

  scrollToToday() {
    const canvas = document.querySelector('.timeline-macro-canvas');
    const todayMarker = document.querySelector('.timeline-macro-today-line');
    if (canvas && todayMarker) {
      const markerLeft = todayMarker.offsetLeft;
      canvas.scrollTo({ left: Math.max(0, markerLeft - canvas.clientWidth / 2), behavior: 'smooth' });
    }
  },

  // ─── Coordinate Conversion Helpers ───
  _getTodayPositionPercent() {
    const today = new Date(2026, 8, 23, 12, 0, 0); // Sept 23, 2026
    const win = this._getWindow();
    const diffDays = (today - win.start) / (1000 * 60 * 60 * 24);
    const pct = (diffDays / win.totalDays) * 100;
    return Math.max(0, Math.min(100, pct));
  },

  _dateToPercent(dStr) {
    const d = new Date(dStr + 'T12:00:00');
    const win = this._getWindow();
    const diffDays = (d - win.start) / (1000 * 60 * 60 * 24);
    const pct = (diffDays / win.totalDays) * 100;
    return Math.max(0, Math.min(100, pct));
  },

  _rangeToPercent(startStr, endStr) {
    const startD = new Date(startStr + 'T00:00:00');
    const endD = new Date(endStr + 'T23:59:59');
    const win = this._getWindow();
    const winStart = win.start;
    const winEnd = win.end;

    // Out of range check
    if (endD < winStart || startD > winEnd) {
      return { left: 0, width: 0, visible: false };
    }

    const effectiveStart = startD < winStart ? winStart : startD;
    const effectiveEnd = endD > winEnd ? winEnd : endD;

    const leftDays = (effectiveStart - winStart) / (1000 * 60 * 60 * 24);
    const durDays = (effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24);

    const leftPct = (leftDays / win.totalDays) * 100;
    const widthPct = (durDays / win.totalDays) * 100;

    return {
      left: Math.max(0, Math.min(99.5, leftPct)),
      width: Math.max(1.5, Math.min(100 - leftPct, widthPct)),
      visible: true
    };
  },

  // ─── Floating Glassmorphism Tooltip Handlers ───
  showTooltip(e, dataJsonStr) {
    let tooltip = document.getElementById('timeline-glass-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'timeline-glass-tooltip';
      tooltip.className = 'timeline-glass-tooltip';
      document.body.appendChild(tooltip);
    }

    let data;
    try {
      data = typeof dataJsonStr === 'string' ? JSON.parse(decodeURIComponent(dataJsonStr)) : dataJsonStr;
    } catch (err) {
      return;
    }

    const stageColors = {
      'Execution / Construction': '#2563EB',
      'Handover & DLP Timelines': '#7C3AED',
      'Planning / Design': '#475569'
    };
    const stageColor = stageColors[data.stage] || '#2563EB';

    const assigneesHtml = data.assignees && data.assignees.length > 0 ? `
      <div class="timeline-tt-row" style="align-items:flex-start">
        <span>Team:</span>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">
          ${data.assignees.map(a => `
            <span style="display:inline-flex;align-items:center;gap:3px;font-size:10.5px;padding:1px 6px;border-radius:4px;background:rgba(255,255,255,0.08);color:#E2E8F0">
              <span style="width:6px;height:6px;border-radius:50%;background:${a.color}"></span>
              ${a.name}
            </span>
          `).join('')}
        </div>
      </div>
    ` : '';

    tooltip.innerHTML = `
      <div class="timeline-tt-header">
        <span>${data.name}</span>
        <span class="timeline-tt-stage" style="background:${stageColor}25; color:${stageColor}; border:1px solid ${stageColor}55">${data.stageLabel || data.stage}</span>
      </div>
      <div class="timeline-tt-row">
        <span>Commercial Package:</span>
        <span><strong>${data.packageNo || 'EPC Package'}</strong> (${data.contractValue || '$3.8M'})</span>
      </div>
      <div class="timeline-tt-row">
        <span>Overall Completion:</span>
        <div style="display:flex;align-items:center;gap:6px">
          <div style="width:60px;height:6px;background:rgba(255,255,255,0.15);border-radius:3px;overflow:hidden">
            <div style="width:${data.progress}%;height:100%;background:${stageColor};border-radius:3px"></div>
          </div>
          <span style="color:${stageColor};font-weight:700">${data.progress}%</span>
        </div>
      </div>
      <div class="timeline-tt-row">
        <span>Schedule Range:</span>
        <span>${data.startDate} → ${data.endDate}</span>
      </div>
      <div class="timeline-tt-row">
        <span>Total Duration:</span>
        <span style="color:#F1F5F9;font-weight:600">${data.durationDays || '90'} Days</span>
      </div>
      <div class="timeline-tt-divider"></div>
      ${data.bgExpiry ? `
        <div class="timeline-tt-row">
          <span>Bank Guarantee:</span>
          <span style="color:#CBD5E1">${data.bgExpiry}</span>
        </div>
      ` : ''}
      ${assigneesHtml}
      ${data.activeMilestone ? `
        <div class="timeline-tt-row" style="margin-top:6px;padding-top:6px;border-top:1px dashed rgba(255,255,255,0.15)">
          <span style="color:#FCD34D">◆ Milestone:</span>
          <span style="color:#60A5FA;font-weight:600">${data.activeMilestone}</span>
        </div>
      ` : ''}
    `;

    tooltip.classList.add('visible');
    this.moveTooltip(e);
  },

  moveTooltip(e) {
    const tooltip = document.getElementById('timeline-glass-tooltip');
    if (tooltip && tooltip.classList.contains('visible')) {
      const x = e.clientX;
      const y = e.clientY;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    }
  },

  hideTooltip() {
    const tooltip = document.getElementById('timeline-glass-tooltip');
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  },

  // ─── Main Render Handler ───
  render() {
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    if (user && user.role !== 'Admin') {
      return `
        <div class="access-restricted-wrapper" style="min-height:75vh;display:flex;align-items:center;justify-content:center;padding:32px 20px;box-sizing:border-box;">
          <div class="section-card access-restricted-card" style="max-width:520px;width:100%;text-align:center;padding:48px 36px;box-shadow:var(--shadow-md);border-radius:12px;background:var(--color-surface);border:1px solid var(--color-border);box-sizing:border-box;">
            <div style="width:64px;height:64px;border-radius:50%;background:#FEF2F2;border:1px solid #FECACA;color:#DC2626;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
              <svg style="width:30px;height:30px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--color-text-primary);margin:0 0 12px 0;">Access Restricted</h2>
            <p style="font-size:14px;color:var(--color-text-secondary);line-height:1.6;margin:0 0 24px 0;">
              Executive Timeline & Gantt view is reserved for Admin. Please contact Ayush Desai (Admin) for elevated access.
            </p>
            <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:var(--radius-pill);font-size:12px;color:var(--color-text-muted);margin-bottom:28px;">
              <span>Role Level:</span>
              <span style="font-weight:600;color:var(--color-primary-700);">AI Developer</span>
            </div>
            <div>
              <button type="button" class="btn btn-primary" onclick="App.navigate('dashboard')" style="padding:0 24px;height:42px;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:8px;margin:0 auto;border-radius:8px;cursor:pointer;">
                <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      `;
    }

    const filteredData = this._getFilteredData();
    const list = filteredData.list;

    const horizonTitles = {
      day: 'September 2026 Daily Sprint & Task Grid',
      week: '12-Week Commercial Execution Roadmap',
      month: 'Commercial EPC 6-Month Horizon'
    };
    const currentHorizonTitle = horizonTitles[this._viewScale] || horizonTitles.month;

    return `
      <div class="timeline-screen" id="timeline">
        
        <!-- Page Header & Time Scale Selector Toolbar -->
        <div class="page-header" style="margin-bottom:16px">
          <div class="page-header-left">
            <div style="display:flex;align-items:center;gap:10px">
              <h1>Timeline & Executive Gantt</h1>
              <span class="badge badge-primary" style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;">Admin Suite</span>
            </div>
            <p>Multi-scale EPC execution roadmap, commercial horizon tracking, and active milestone monitor</p>
          </div>
          <div class="page-header-actions" style="display:flex;align-items:center;gap:12px">
            
            <!-- Time Scale Selector Toggle Group [ Day | Week | Month ] -->
            <div class="timeline-scale-tabs" role="tablist" aria-label="Timeline scale selector">
              <button class="timeline-scale-tab ${this._viewScale==='day'?'active':''}" data-scale="day" onclick="TimelineScreen.setScale('day')" role="tab" aria-selected="${this._viewScale==='day'}">Day</button>
              <button class="timeline-scale-tab ${this._viewScale==='week'?'active':''}" data-scale="week" onclick="TimelineScreen.setScale('week')" role="tab" aria-selected="${this._viewScale==='week'}">Week</button>
              <button class="timeline-scale-tab ${this._viewScale==='month'?'active':''}" data-scale="month" onclick="TimelineScreen.setScale('month')" role="tab" aria-selected="${this._viewScale==='month'}">Month</button>
            </div>

            <button class="btn btn-secondary btn-sm" onclick="App.navigate('bg')">
              ${Icons.shield} Bank Guarantees
            </button>
            <button class="btn btn-primary btn-sm" onclick="TasksScreen.openCreateModal()">
              ${Icons.plus} New EPC Milestone
            </button>
          </div>
        </div>

        <!-- Main Executive Macro Gantt Card -->
        <div class="timeline-macro-card">
          
          <!-- Header & Legend Bar -->
          <div class="timeline-macro-header">
            <div class="timeline-macro-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
              <h3 id="timeline-horizon-title">${currentHorizonTitle}</h3>
            </div>
            <div class="timeline-macro-legend">
              <div class="timeline-legend-item">
                <span class="timeline-legend-bar" style="background:#2563EB"></span>
                <span>Execution / Construction</span>
              </div>
              <div class="timeline-legend-item">
                <span class="timeline-legend-bar" style="background:#7C3AED"></span>
                <span>Handover & DLP</span>
              </div>
              <div class="timeline-legend-item">
                <span class="timeline-legend-bar" style="background:#475569"></span>
                <span>Planning / Design</span>
              </div>
            </div>
          </div>

          <!-- Filter & Search Controls -->
          <div class="timeline-macro-controls">
            <div class="timeline-stage-tabs">
              <button class="timeline-stage-tab ${this._activeStage==='all'?'active':''}" data-stage="all" onclick="TimelineScreen.setStage('all')">All Packages (${this._projects.length})</button>
              <button class="timeline-stage-tab ${this._activeStage==='execution'?'active':''}" data-stage="execution" onclick="TimelineScreen.setStage('execution')">Execution</button>
              <button class="timeline-stage-tab ${this._activeStage==='dlp'?'active':''}" data-stage="dlp" onclick="TimelineScreen.setStage('dlp')">Handover & DLP</button>
              <button class="timeline-stage-tab ${this._activeStage==='planning'?'active':''}" data-stage="planning" onclick="TimelineScreen.setStage('planning')">Planning</button>
            </div>
            <div style="flex:1"></div>
            
            <button class="btn btn-ghost btn-sm" onclick="TimelineScreen.scrollToToday()" style="font-size:12px;display:inline-flex;align-items:center;gap:4px">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Jump to Today
            </button>

            <div class="search-input-wrap" style="width:260px">
              <span class="search-icon">${Icons.search}</span>
              <input type="text" id="timeline-search-input" class="form-input search-input" placeholder="Search package or milestone..." value="${this._search}" oninput="TimelineScreen.setSearch(this.value)">
              <button type="button" id="timeline-search-clear" class="search-clear-btn ${this._search ? '' : 'hidden'}" onclick="TimelineScreen.clearSearch()" title="Clear search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <!-- Gantt Grid Layout Wrapper -->
          <div id="timeline-gantt-wrapper">
            ${this._renderGanttGrid(list)}
          </div>

        </div>

      </div>
    `;
  },

  // ─── Dispatcher to multi-scale Gantt grid renderer ───
  _renderGanttGrid(list) {
    if (this._viewScale === 'day') {
      return this._renderDayView(list);
    } else if (this._viewScale === 'week') {
      return this._renderWeekView(list);
    } else {
      return this._renderMonthView(list);
    }
  },

  // Backwards compatibility
  _renderMacroGantt(list) {
    return this._renderGanttGrid(list);
  },

  // ─── 1. Day View Renderer (Granular daily grid for Sept 2026) ───
  _renderDayView(list) {
    const win = this._getWindow();
    const todayLeftPct = this._getTodayPositionPercent();

    return `
      <div class="timeline-macro-container timeline-day-view">
        
        <!-- Left Fixed Column: 300px -->
        ${this._renderLeftSidebar(list)}

        <!-- Right Daily Canvas -->
        <div class="timeline-macro-canvas timeline-day-canvas">
          
          <!-- 30-Day Grid Header -->
          <div class="timeline-macro-grid-header timeline-day-grid-header">
            ${win.days.map(d => `
              <div class="timeline-macro-col-header timeline-day-col-header ${d.isToday ? 'today-col' : ''}">
                <span class="timeline-day-weekday">${d.day[0]}</span>
                <span class="timeline-day-num ${d.isToday ? 'today-badge' : ''}">${d.num}</span>
              </div>
            `).join('')}
          </div>

          <!-- Background Vertical Grid Lines -->
          <div class="timeline-macro-grid-bg timeline-day-grid-bg">
            ${win.days.map(d => `
              <div class="timeline-grid-vertical-line ${d.isToday ? 'today-line-bg' : ''}"></div>
            `).join('')}
          </div>

          <!-- Today Marker Line -->
          <div class="timeline-macro-today-line" style="left:${todayLeftPct}%">
            <div class="timeline-macro-today-badge">SEP 2026</div>
          </div>

          <!-- Body Rows -->
          ${this._renderCanvasRows(list)}

        </div>
      </div>
    `;
  },

  // ─── 2. Week View Renderer (12-Week Roadmap) ───
  _renderWeekView(list) {
    const win = this._getWindow();
    const todayLeftPct = this._getTodayPositionPercent();

    return `
      <div class="timeline-macro-container timeline-week-view">
        
        <!-- Left Fixed Column: 300px -->
        ${this._renderLeftSidebar(list)}

        <!-- Right Multi-Week Canvas -->
        <div class="timeline-macro-canvas timeline-week-canvas">
          
          <!-- 12-Week Grid Header -->
          <div class="timeline-macro-grid-header timeline-week-grid-header">
            ${win.weeks.map(w => `
              <div class="timeline-macro-col-header timeline-week-col-header ${w.isCurrent ? 'today-col' : ''}">
                <div class="timeline-week-title-wrap">
                  <span class="timeline-week-label ${w.isCurrent ? 'today-badge' : ''}">${w.label}</span>
                  <span class="timeline-week-range">${w.range}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Background Vertical Grid Lines -->
          <div class="timeline-macro-grid-bg timeline-week-grid-bg">
            ${win.weeks.map(w => `
              <div class="timeline-grid-vertical-line ${w.isCurrent ? 'today-line-bg' : ''}"></div>
            `).join('')}
          </div>

          <!-- Today Marker Line -->
          <div class="timeline-macro-today-line" style="left:${todayLeftPct}%">
            <div class="timeline-macro-today-badge">SEP 2026</div>
          </div>

          <!-- Body Rows -->
          ${this._renderCanvasRows(list)}

        </div>
      </div>
    `;
  },

  // ─── 3. Month View Renderer (Macro 6-Month Executive Schedule) ───
  _renderMonthView(list) {
    const win = this._getWindow();
    const todayLeftPct = this._getTodayPositionPercent();

    return `
      <div class="timeline-macro-container timeline-month-view">
        
        <!-- Left Fixed Column: 300px -->
        ${this._renderLeftSidebar(list)}

        <!-- Right 6-Month Viewport Grid Canvas (100% Width) -->
        <div class="timeline-macro-canvas timeline-month-canvas">
          
          <!-- 6-Month Columns Header -->
          <div class="timeline-macro-grid-header timeline-month-grid-header">
            ${win.months.map(m => `
              <div class="timeline-macro-col-header">
                ${m.isCurrent ? `
                  <span class="timeline-col-current-badge">${m.label}</span>
                ` : `
                  <span>${m.label}</span>
                `}
              </div>
            `).join('')}
          </div>

          <!-- Background Vertical Grid Lines -->
          <div class="timeline-macro-grid-bg timeline-month-grid-bg">
            ${win.months.map(() => `
              <div class="timeline-grid-vertical-line"></div>
            `).join('')}
          </div>

          <!-- Today Marker Line -->
          <div class="timeline-macro-today-line" style="left:${todayLeftPct}%">
            <div class="timeline-macro-today-badge">SEP 2026</div>
          </div>

          <!-- Body Rows -->
          ${this._renderCanvasRows(list)}

        </div>
      </div>
    `;
  },

  // ─── Left Sidebar Renderer (Fixed 300px with Project, Package, Status, Assignees) ───
  _renderLeftSidebar(list) {
    return `
      <div class="timeline-macro-sidebar">
        <div class="timeline-sidebar-col-header">
          <span>PROJECT & PACKAGE</span>
          <span>STATUS / TEAM</span>
        </div>
        <div class="timeline-sidebar-body">
          ${list.map(p => {
            const isExpanded = !!this._expandedProjects[p.id];
            return `
              <div class="timeline-project-row ${isExpanded ? 'expanded' : ''}" onclick="TimelineScreen.toggleProject('${p.id}')">
                <div class="timeline-project-info">
                  <span class="timeline-expand-arrow" title="${isExpanded ? 'Collapse phases' : 'Expand phases'}">${isExpanded ? '▼' : '▶'}</span>
                  <span class="timeline-pkg-badge">${p.packageNo}</span>
                  <span class="timeline-project-name" title="${p.name}">${p.name}</span>
                </div>
                <div class="timeline-project-meta-right">
                  <span class="timeline-stage-pill ${p.stagePillClass}">${p.stageLabel.split('/')[0].trim()}</span>
                  ${this._renderAvatars(p.assigneeIds)}
                </div>
              </div>
              
              ${isExpanded ? `
                ${p.phases.map(ph => `
                  <div class="timeline-phase-row">
                    <span class="timeline-phase-name" title="${ph.name}">└─ ${ph.name}</span>
                    <div class="timeline-phase-meta-right">
                      <span class="timeline-phase-pct">${ph.progress}%</span>
                      ${this._renderAvatars(ph.assigneeIds)}
                    </div>
                  </div>
                `).join('')}
              ` : ''}
            `;
          }).join('') || '<div style="padding:32px 20px;text-align:center;color:var(--color-text-muted);font-size:13px">No commercial packages match filter</div>'}
        </div>
      </div>
    `;
  },

  // ─── Right Canvas Body Rows Renderer ───
  _renderCanvasRows(list) {
    return `
      <div class="timeline-macro-body">
        ${list.map(p => {
          const isExpanded = !!this._expandedProjects[p.id];
          const pRange = this._rangeToPercent(p.startDate, p.endDate);
          const activeSepMilestone = p.milestones.find(m => m.status === 'active-sep');
          const durationDays = this._getDurationDays(p.startDate, p.endDate);
          const assignees = (p.assigneeIds || []).map(id => this._getMember(id));

          const tooltipData = encodeURIComponent(JSON.stringify({
            name: p.name,
            packageNo: p.packageNo,
            stage: p.stageLabel,
            stageLabel: p.stageLabel,
            progress: p.progress,
            contractValue: p.contractValue,
            startDate: p.startDate,
            endDate: p.endDate,
            durationDays: durationDays,
            bgExpiry: p.bgExpiry,
            assignees: assignees,
            activeMilestone: activeSepMilestone ? `${activeSepMilestone.name} (${activeSepMilestone.date})` : null
          }));

          return `
            <!-- Project Gantt Row -->
            <div class="timeline-macro-canvas-row">
              ${pRange.visible ? `
                <div class="timeline-bar-wrapper"
                     style="left:${pRange.left}%; width:${pRange.width}%"
                     onmouseenter="TimelineScreen.showTooltip(event, '${tooltipData}')"
                     onmousemove="TimelineScreen.moveTooltip(event)"
                     onmouseleave="TimelineScreen.hideTooltip()">
                  
                  <!-- Clean Solid Bar with Subtle Inner Progress Fill (Zero Overlay Icons) -->
                  <div class="timeline-bar-slim ${p.barClass}">
                    <div class="timeline-bar-fill ${p.fillClass}" style="width:${p.progress}%"></div>
                    <span class="timeline-bar-progress-text">${p.progress}%</span>
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Sub-Phase Canvas Rows (when expanded) -->
            ${isExpanded ? `
              ${p.phases.map(ph => {
                const phRange = this._rangeToPercent(ph.start, ph.end);
                const phDuration = this._getDurationDays(ph.start, ph.end);
                const phAssignees = (ph.assigneeIds || []).map(id => this._getMember(id));

                const phTooltip = encodeURIComponent(JSON.stringify({
                  name: `${p.name} ➔ ${ph.name}`,
                  packageNo: p.packageNo,
                  stage: p.stageLabel,
                  stageLabel: 'Phase Workstream',
                  progress: ph.progress,
                  contractValue: p.contractValue,
                  startDate: ph.start,
                  endDate: ph.end,
                  durationDays: phDuration,
                  bgExpiry: p.bgExpiry,
                  assignees: phAssignees
                }));

                return `
                  <div class="timeline-macro-canvas-phase-row">
                    ${phRange.visible ? `
                      <div class="timeline-bar-wrapper"
                           style="left:${phRange.left}%; width:${phRange.width}%"
                           onmouseenter="TimelineScreen.showTooltip(event, '${phTooltip}')"
                           onmousemove="TimelineScreen.moveTooltip(event)"
                           onmouseleave="TimelineScreen.hideTooltip()">
                        <div class="timeline-bar-phase-slim ${p.barClass}">
                          <div class="timeline-bar-fill ${p.fillClass}" style="width:${ph.progress}%"></div>
                          <span class="timeline-bar-progress-text">${ph.progress}%</span>
                        </div>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            ` : ''}
          `;
        }).join('')}
      </div>
    `;
  }
};
