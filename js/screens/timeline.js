// ─── Executive Macro-Level Gantt Chart Screen ───
const TimelineScreen = {
  _viewScale: 'month', // 'day' | 'week' | 'month' (default: 'month')
  _activeStage: 'all', // 'all' | 'execution' | 'dlp' | 'planning'
  _search: '',
  _expandedProjects: {}, // Project IDs expanded in left column

  // Getter/Setter for backwards compatibility with tests and scripts
  get _scale() { return this._viewScale; },
  set _scale(val) { this._viewScale = val; },

  // Commercial EPC Packages Data — now loaded dynamically from Store
  _projects: [],

  // ─── Build timeline projects from Store data ───
  _loadFromStore() {
    if (typeof Store === 'undefined') return;
    const storeProjects = Store.getProjects();
    const storeTasks = Store.getTasks();
    const storeMilestones = Store.getMilestones();

    this._projects = storeProjects.map((p, idx) => {
      // Derive stage from status
      const stageMap = { 'planning': 'planning', 'active': 'execution', 'execution': 'execution', 'completed': 'dlp', 'on-hold': 'planning' };
      const stage = stageMap[p.status] || 'planning';
      const stageLabels = { 'execution': 'Execution / Construction', 'dlp': 'Handover & DLP Timelines', 'planning': 'Planning / Design' };
      const stagePillClasses = { 'execution': 'stage-pill-exec', 'dlp': 'stage-pill-dlp', 'planning': 'stage-pill-plan' };
      const barClasses = { 'execution': 'stage-exec', 'dlp': 'stage-dlp', 'planning': 'stage-plan' };
      const fillClasses = { 'execution': 'fill-exec', 'dlp': 'fill-dlp', 'planning': 'fill-plan' };

      // Get tasks for this project
      const projTasks = storeTasks.filter(t => t.projectId === p.id);
      const doneTasks = projTasks.filter(t => t.status === 'done');
      const progress = projTasks.length > 0 ? Math.round((doneTasks.length / projTasks.length) * 100) : (p.progress || 0);

      // Get milestones for this project
      const projMilestones = storeMilestones.filter(m => m.projectId === p.id);

      // Build phases from tasks grouped by status
      const statusGroups = { 'todo': [], 'in-progress': [], 'review': [], 'done': [] };
      projTasks.forEach(t => { if (statusGroups[t.status]) statusGroups[t.status].push(t); });
      const phases = [];
      const startDate = p.startDate || new Date().toISOString().split('T')[0];
      const endDate = p.endDate || new Date(Date.now() + 90*86400000).toISOString().split('T')[0];

      if (projTasks.length > 0) {
        // Create phases from task groups
        Object.entries(statusGroups).forEach(([status, tasks]) => {
          if (tasks.length === 0) return;
          const phaseProgress = status === 'done' ? 100 : status === 'review' ? 75 : status === 'in-progress' ? 40 : 0;
          phases.push({
            id: `ph-${p.id}-${status}`,
            name: `${Utils.humanize(status)} Tasks`,
            start: startDate,
            end: endDate,
            progress: phaseProgress,
            stage: stage,
            assigneeIds: [...new Set(tasks.map(t => t.assigneeId).filter(Boolean))]
          });
        });
      } else {
        phases.push({ id: `ph-${p.id}-default`, name: 'Project Duration', start: startDate, end: endDate, progress: progress, stage: stage, assigneeIds: p.memberIds || [] });
      }

      // Build milestones
      const milestones = projMilestones.map(m => ({
        id: m.id,
        name: m.name,
        date: m.dueDate || startDate,
        status: m.status === 'completed' ? 'completed' : 'upcoming',
        isPulse: m.status !== 'completed',
        priority: 'normal',
        color: m.status === 'completed' ? '#059669' : '#2563EB'
      }));

      // Package number
      const packageNo = `PKG-${String(idx + 1).padStart(2, '0')}`;

      return {
        id: p.id,
        packageNo,
        name: p.name,
        stage,
        stageLabel: stageLabels[stage] || 'Planning / Design',
        stagePillClass: stagePillClasses[stage] || 'stage-pill-plan',
        barClass: barClasses[stage] || 'stage-plan',
        fillClass: fillClasses[stage] || 'fill-plan',
        contractValue: p.description || '₹0',
        progress,
        startDate,
        endDate,
        bgExpiry: '',
        assigneeIds: p.memberIds || [],
        phases,
        milestones
      };
    });
  },

  // ─── Time Windows Config (Dynamic based on project dates) ───
  _getWindow() {
    // Compute date range from actual projects
    const projects = this._projects.length > 0 ? this._projects : [];
    let minDate = new Date();
    let maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);

    if (projects.length > 0) {
      const dates = projects.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]).filter(d => !isNaN(d.getTime()));
      if (dates.length > 0) {
        minDate = new Date(Math.min(...dates));
        maxDate = new Date(Math.max(...dates));
        // Add 1 month buffer on each side
        minDate.setMonth(minDate.getMonth() - 1);
        maxDate.setMonth(maxDate.getMonth() + 1);
      }
    }

    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    if (this._viewScale === 'day') {
      // Day view: show current month dynamically
      const now = new Date();
      const dayStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const dayEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const daysInMonth = dayEnd.getDate();
      const days = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(today.getFullYear(), today.getMonth(), d);
        days.push({ num: d, day: dayNames[dt.getDay()], isToday: d === today.getDate() && dt.getMonth() === today.getMonth() });
      }
      return { key: 'day', start: dayStart, end: dayEnd, totalDays: daysInMonth, days };
    } else if (this._viewScale === 'week') {
      // Week view: 12 weeks from project start or today
      const weekStart = projects.length > 0 ? new Date(minDate) : new Date(today);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 84);
      const weeks = [];
      for (let w = 0; w < 12; w++) {
        const ws = new Date(weekStart);
        ws.setDate(ws.getDate() + w * 7);
        const we = new Date(ws);
        we.setDate(we.getDate() + 6);
        const isCurrent = today >= ws && today <= we;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        weeks.push({
          key: `w${w+1}`, label: `Week ${w+1}`,
          range: `${monthNames[ws.getMonth()]} ${ws.getDate()} - ${monthNames[we.getMonth()]} ${we.getDate()}`,
          isCurrent
        });
      }
      return { key: 'week', start: weekStart, end: weekEnd, totalDays: 84, weeks };
    } else {
      // Month view: from min to max project dates
      const months = [];
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      while (cursor <= maxDate) {
        const isCurrent = cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();
        const daysInM = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
        months.push({ key: `${monthNames[cursor.getMonth()]}-${cursor.getFullYear()}`, label: `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`, days: daysInM, isCurrent });
        cursor.setMonth(cursor.getMonth() + 1);
      }
      if (months.length === 0) {
        months.push({ key: `${monthNames[today.getMonth()]}-${today.getFullYear()}`, label: `${monthNames[today.getMonth()]} ${today.getFullYear()}`, days: 30, isCurrent: true });
      }
      return { key: 'month', start: minDate, end: maxDate, totalDays, months };
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
      'm2': { id: 'm2', name: 'Preet Bhavsar', initials: 'PB', color: '#9333EA', role: 'AI Developer' },
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
    this._loadFromStore();
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
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const now = new Date();
    if (headerTitle) {
      if (this._viewScale === 'day') headerTitle.textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()} Daily Sprint & Task Grid`;
      else if (this._viewScale === 'week') headerTitle.textContent = '12-Week Commercial Execution Roadmap';
      else headerTitle.textContent = 'Commercial EPC 6-Month Horizon';
    }

    if (container) {
      const data = this._getFilteredData();
      container.innerHTML = this._renderGanttGrid(data.list);
      // Auto-scroll to today after render
      requestAnimationFrame(() => this.scrollToToday());
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
    if (!canvas) return;
    // Try today marker first
    const todayMarker = document.querySelector('.timeline-macro-today-line');
    if (todayMarker) {
      const markerLeft = todayMarker.offsetLeft;
      canvas.scrollTo({ left: Math.max(0, markerLeft - canvas.clientWidth / 3), behavior: 'smooth' });
      return;
    }
    // Fallback: scroll to 70% of canvas width (near today for current date)
    const totalWidth = canvas.scrollWidth - canvas.clientWidth;
    if (totalWidth > 0) {
      canvas.scrollTo({ left: totalWidth * 0.7, behavior: 'smooth' });
    }
  },

  // ─── Coordinate Conversion Helpers ───
  _getTodayPositionPercent() {
    const today = new Date();
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
      'Handover & DLP Timelines': '#9333EA',
      'Planning / Design': '#64748B'
    };
    const stageColor = stageColors[data.stage] || '#2563EB';

    const assigneesHtml = data.assignees && data.assignees.length > 0 ? `
      <div class="timeline-tt-row" style="align-items:flex-start">
        <span>Team:</span>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">
          ${data.assignees.map(a => `
            <span style="display:inline-flex;align-items:center;gap:4px;font-size:10.5px;padding:2px 7px;border-radius:4px;background:var(--neutral-100);color:var(--color-text-primary);border:1px solid var(--color-border)">
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
        <span class="timeline-tt-stage" style="background:${stageColor}18; color:${stageColor}; border:1px solid ${stageColor}40">${data.stageLabel || data.stage}</span>
      </div>
      <div class="timeline-tt-row">
        <span>Commercial Package:</span>
        <span><strong>${data.packageNo || 'Package'}</strong> (${data.contractValue || '₹0'})</span>
      </div>
      <div class="timeline-tt-row">
        <span>Overall Completion:</span>
        <div style="display:flex;align-items:center;gap:6px">
          <div style="width:60px;height:6px;background:var(--neutral-200);border-radius:3px;overflow:hidden">
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
        <span style="color:var(--color-text-primary);font-weight:600">${data.durationDays || '90'} Days</span>
      </div>
      <div class="timeline-tt-divider"></div>
      ${data.bgExpiry ? `
        <div class="timeline-tt-row">
          <span>Bank Guarantee:</span>
          <span style="color:var(--color-text-secondary)">${data.bgExpiry}</span>
        </div>
      ` : ''}
      ${assigneesHtml}
      ${data.activeMilestone ? `
        <div class="timeline-tt-row" style="margin-top:6px;padding-top:6px;border-top:1px dashed var(--color-border)">
          <span style="color:var(--color-primary);font-weight:600">◆ Milestone:</span>
          <span style="color:var(--color-primary-700);font-weight:600">${data.activeMilestone}</span>
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

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const now = new Date();
    const horizonTitles = {
      day: `${monthNames[now.getMonth()]} ${now.getFullYear()} Daily Sprint & Task Grid`,
      week: '12-Week Commercial Execution Roadmap',
      month: 'Commercial EPC 6-Month Horizon'
    };
    const currentHorizonTitle = horizonTitles[this._viewScale] || horizonTitles.month;

    const html = `
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
                <span class="timeline-legend-bar" style="background:linear-gradient(135deg, #2563EB 0%, #9333EA 100%)"></span>
                <span>Handover & DLP</span>
              </div>
              <div class="timeline-legend-item">
                <span class="timeline-legend-bar" style="background:#64748B"></span>
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
    // Schedule auto-scroll to today after DOM insertion
    setTimeout(() => this.scrollToToday(), 100);
    return html;
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
            <div class="timeline-macro-today-badge">TODAY</div>
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
            <div class="timeline-macro-today-badge">TODAY</div>
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
            <div class="timeline-macro-today-badge">TODAY</div>
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
                  
                  <!-- Clean Solid Bar with Subtle Inner Progress Fill -->
                  <div class="timeline-bar-slim ${p.barClass}">
                    <div class="timeline-bar-fill ${p.fillClass}" style="width:${p.progress}%"></div>
                  </div>
                  <span class="timeline-bar-progress-text">${p.progress}%</span>
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
                        </div>
                        <span class="timeline-bar-progress-text">${ph.progress}%</span>
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
