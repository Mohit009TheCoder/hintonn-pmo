// ─── AI Assistant (PM Copilot) Screen — RBAC-Aware ───
const AIAssistantScreen = {
  _messages: null,
  _currentUserId: null,

  _getCurrentUser() {
    if (typeof Auth !== 'undefined' && Auth.getCurrentUser()) {
      return Auth.getCurrentUser();
    }
    const storedId = (typeof Store !== 'undefined' && Store.getSettings()?.currentUser) || 'm1';
    const member = typeof Store !== 'undefined' ? Store.getMember(storedId) : null;
    return member || { id: 'ayush', memberId: 'm1', name: 'Ayush Desai', role: 'Admin', initials: 'AD', color: '#2563EB' };
  },

  // ─── RBAC-scoped data helper ───
  _getScopedData() {
    const user = this._getCurrentUser();
    const isAdmin = user.role === 'Admin';
    const allTasks = Store.getTasks();
    const allProjects = Store.getProjects();
    const allIssues = Store.getIssues();
    const allMilestones = Store.getMilestones();
    const allMembers = Store.getMembers();

    // Resolve the user's member ID for matching
    const memberId = user.memberId || user.id || '';
    const memberRecord = Store.getMember(memberId) || Store.getMember(user.id);

    // Non-admin: filter to only their assigned / associated data
    let tasks, projects, issues, milestones;

    if (isAdmin) {
      tasks = allTasks;
      projects = allProjects;
      issues = allIssues;
      milestones = allMilestones;
    } else {
      // Tasks assigned to this user (by memberId or id)
      tasks = allTasks.filter(t =>
        t.assigneeId === memberId ||
        t.assigneeId === user.id ||
        (memberRecord && t.assigneeId === memberRecord.id)
      );

      // Projects containing user's tasks OR where user is a member
      const myProjectIds = new Set(tasks.map(t => t.projectId));
      allProjects.forEach(p => {
        if (p.memberIds && p.memberIds.includes(memberId)) myProjectIds.add(p.id);
      });
      projects = allProjects.filter(p => myProjectIds.has(p.id));

      // Issues in user's projects OR assigned to user
      const projectIds = new Set(projects.map(p => p.id));
      issues = allIssues.filter(i =>
        projectIds.has(i.projectId) ||
        i.assigneeId === memberId ||
        i.assigneeId === user.id
      );

      // Milestones in user's projects
      milestones = allMilestones.filter(m => projectIds.has(m.projectId));
    }

    // Build scoped stats
    const now = new Date();
    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length,
      overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
      openIssues: issues.filter(i => i.status === 'open').length,
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter(m => m.status === 'completed').length,
      inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
      todoTasks: tasks.filter(t => t.status === 'todo').length,
      reviewTasks: tasks.filter(t => t.status === 'review').length,
    };

    return { user, isAdmin, tasks, projects, issues, milestones, allMembers, stats, memberId, memberRecord };
  },

  // ─── Init welcome message with RBAC-scoped data ───
  _initMessages() {
    const currentUser = this._getCurrentUser();
    const userId = currentUser.id || currentUser.memberId || currentUser.name || 'user';

    if (!this._messages || this._currentUserId !== userId) {
      this._currentUserId = userId;
      const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'User';
      const { isAdmin, stats, tasks, projects } = this._getScopedData();
      const completionPct = stats.totalTasks ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0;

      const roleLabel = isAdmin ? 'Administrator' : 'Developer';
      const scopeNote = isAdmin ? '' : ' (your scope only)';

      this._messages = [
        {
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Hello **${firstName}**! I am your Hintonn AI Project Copilot (${roleLabel} mode). I actively monitor your **${stats.activeProjects} active projects${scopeNote}**, **${stats.totalTasks} tasks${scopeNote}**, and team workflows.`,
          cards: [
            {
              type: 'summary',
              title: `Workspace Health${scopeNote}`,
              items: [
                `${stats.activeProjects} active projects (${stats.totalProjects} total)`,
                `${stats.completedTasks}/${stats.totalTasks} tasks completed (${completionPct}%)`,
                `${stats.overdueTasks} overdue tasks needing resolution`,
                `${stats.openIssues} open issues requiring review`
              ]
            }
          ]
        }
      ];
    }
  },

  render() {
    this._initMessages();
    const { isAdmin } = this._getScopedData();

    // Role-specific quick actions
    const adminPrompts = [
      { label: 'What needs my attention?', query: 'What needs my attention?' },
      { label: 'Team workload overview', query: 'Team workload overview' },
      { label: 'Show overdue tasks', query: 'Show overdue tasks' },
      { label: 'Summarize all projects', query: 'Summarize all projects' },
      { label: 'Show upcoming deadlines', query: 'Show upcoming deadlines' },
      { label: 'Show blocked tasks & issues', query: 'Show blocked tasks & issues' },
      { label: 'Project status breakdown', query: 'Project status breakdown' },
      { label: 'Team member activity', query: 'Team member activity' },
    ];
    const devPrompts = [
      { label: 'What are my tasks?', query: 'What are my tasks?' },
      { label: 'My overdue tasks', query: 'My overdue tasks' },
      { label: 'My project progress', query: 'My project progress' },
      { label: 'Show my upcoming deadlines', query: 'Show my upcoming deadlines' },
      { label: 'My open issues', query: 'My open issues' },
      { label: 'Summarize my work', query: 'Summarize my work' },
    ];
    const prompts = isAdmin ? adminPrompts : devPrompts;

    return `
      <div class="page-header" style="margin-bottom:16px">
        <div class="page-header-left">
          <div style="display:flex;align-items:center;gap:8px">
            <h1>AI Assistant</h1>
            <span class="badge badge-active" style="font-size:11px">${isAdmin ? 'Admin Intelligence' : 'Developer Copilot'}</span>
          </div>
          <p>Your project management copilot for real-time tracking, risk detection, and workflow analysis</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" onclick="AIAssistantScreen.clearChat()">
            ${Icons.refresh} Reset Conversation
          </button>
        </div>
      </div>

      <!-- Quick Action Prompt Tray -->
      <div class="ai-prompts-tray">
        <div class="ai-prompts-label">Suggested Inquiries:</div>
        <div class="ai-prompts-list">
          ${prompts.map(p => `
            <button class="ai-prompt-chip" onclick="AIAssistantScreen.sendPrompt('${p.query}')">${p.label}</button>
          `).join('')}
        </div>
      </div>

      <!-- Copilot Chat Container -->
      <div class="ai-chat-card">
        <div class="ai-chat-messages" id="ai-chat-messages">
          ${this._messages.map(m => this._renderMessage(m)).join('')}
        </div>

        <!-- Input Box -->
        <div class="ai-chat-input-bar">
          <form onsubmit="event.preventDefault(); AIAssistantScreen.onSubmitInput();" style="display:flex;width:100%;gap:10px">
            <input 
              type="text" 
              id="ai-assistant-input" 
              class="form-input ai-input-field" 
              placeholder="Ask about projects, tasks, team, deadlines, or risks..." 
              autocomplete="off"
            />
            <button type="submit" class="btn btn-primary" style="padding:0 20px">
              Send
            </button>
          </form>
        </div>
      </div>
    `;
  },

  _renderMessage(m) {
    const isAssistant = m.sender === 'assistant';
    const currentUser = this._getCurrentUser();
    const userInitials = currentUser ? (currentUser.initials || (currentUser.name ? currentUser.name.split(' ').map(w=>w[0]).join('').slice(0,2) : 'U')) : 'U';
    const userName = currentUser ? currentUser.name : 'User';
    return `
      <div class="ai-msg-row ${isAssistant ? 'msg-assistant' : 'msg-user'}">
        <div class="ai-msg-avatar ${isAssistant ? 'avatar-ai' : 'avatar-user'}" ${!isAssistant && currentUser.color ? `style="background:${currentUser.color}"` : ''}>
          ${isAssistant ? 'HI' : userInitials}
        </div>
        <div class="ai-msg-bubble">
          <div class="ai-msg-header">
            <span class="ai-msg-author">${isAssistant ? 'Hintonn Copilot' : userName}</span>
            <span class="ai-msg-time">${m.time}</span>
          </div>
          <div class="ai-msg-content">${this._formatMarkdown(m.text)}</div>
          
          ${m.cards && m.cards.length ? `
            <div class="ai-msg-cards">
              ${m.cards.map(c => this._renderCard(c)).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  _renderCard(c) {
    if (c.type === 'summary') {
      return `
        <div class="ai-card-summary">
          <div class="ai-card-title">${c.title}</div>
          <ul class="ai-card-list">
            ${c.items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    if (c.type === 'task-list') {
      return `
        <div class="ai-card-tasks">
          <div class="ai-card-title">${c.title}</div>
          <div class="ai-card-task-items">
            ${c.tasks.map(t => {
              const proj = Store.getProject(t.projectId);
              const m = Store.getMember(t.assigneeId);
              return `
                <div class="ai-card-task-row" onclick="TasksScreen.openDetailModal('${t.id}')">
                  <span class="priority-dot priority-${t.priority}"></span>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:600;color:var(--color-text-primary);font-size:13px">${t.title}</div>
                    <div style="font-size:11.5px;color:var(--color-text-muted)">${proj ? proj.name : 'No project'} · Due: ${t.dueDate ? Utils.formatDate(t.dueDate) : 'None'}</div>
                  </div>
                  <span class="badge badge-${t.status}" style="font-size:11px">${Utils.humanize(t.status)}</span>
                  ${m ? `<span class="badge" style="background:var(--color-bg-subtle);font-size:11px">${m.name}</span>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
    if (c.type === 'project-list') {
      return `
        <div class="ai-card-projects">
          <div class="ai-card-title">${c.title}</div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
            ${c.projects.map(p => `
              <div class="ai-card-project-row" onclick="App.navigate('project-detail','${p.id}')">
                <div style="flex:1">
                  <div style="font-weight:600;font-size:13.5px;color:var(--color-text-primary)">${p.name}</div>
                  <div style="font-size:11.5px;color:var(--color-text-muted)">${p.type || 'Project'} · ${Store.getTasks(p.id).length} tasks · ${Store.getMilestones(p.id).length} milestones</div>
                </div>
                <div style="width:130px;display:flex;align-items:center;gap:8px">
                  <div class="progress-bar progress-blue" style="flex:1">
                    <div class="progress-bar-fill" style="width:${p.progress}%"></div>
                  </div>
                  <span style="font-size:12px;font-weight:700;color:var(--color-text-primary)">${p.progress}%</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    if (c.type === 'issue-list') {
      return `
        <div class="ai-card-issues">
          <div class="ai-card-title">${c.title}</div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">
            ${c.issues.map(i => {
              const p = Store.getProject(i.projectId);
              return `
                <div class="ai-card-issue-row" onclick="App.navigate('issues')">
                  <span class="badge badge-${i.priority}" style="font-size:10.5px">${Utils.humanize(i.priority)}</span>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:12.5px;color:var(--color-text-primary)">${i.title}</div>
                    <div style="font-size:11px;color:var(--color-text-muted)">${p ? p.name : ''} · ${i.description || ''}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
    if (c.type === 'team-list') {
      return `
        <div class="ai-card-issues">
          <div class="ai-card-title">${c.title}</div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">
            ${c.members.map(m => `
              <div class="ai-card-task-row">
                <span style="width:28px;height:28px;border-radius:50%;background:${m.color || '#64748B'};display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700">${m.initials || '?'}</span>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:13px;color:var(--color-text-primary)">${m.name}</div>
                  <div style="font-size:11.5px;color:var(--color-text-muted)">${m.role || 'Member'} · ${m.activeTasks || 0} active tasks</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    return '';
  },

  _formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  },

  sendPrompt(promptText) {
    const input = document.getElementById('ai-assistant-input');
    if (input) input.value = promptText;
    this.onSubmitInput();
  },

  onSubmitInput() {
    const input = document.getElementById('ai-assistant-input');
    if (!input) return;
    const query = input.value.trim();
    if (!query) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message
    this._messages.push({ sender: 'user', time, text: query });

    input.value = '';
    this._scrollBottom();

    // Process intelligence query with RBAC filtering
    setTimeout(() => {
      const response = this._processQuery(query);
      this._messages.push({
        sender: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: response.text,
        cards: response.cards || []
      });
      this.refresh();
    }, 150);
  },

  // ─── Core Query Engine (RBAC-Filtered) ───
  _processQuery(rawQuery) {
    const q = rawQuery.toLowerCase();
    const { isAdmin, tasks, projects, issues, milestones, allMembers, stats, user, memberId, memberRecord } = this._getScopedData();
    const now = new Date();
    const firstName = user.name ? user.name.split(' ')[0] : 'User';
    const scopeNote = isAdmin ? '' : ' in your scope';

    // ═══════════════════════════════════════════════
    // 1. "What needs my attention?" / "attention" / "risks" / "action items"
    // ═══════════════════════════════════════════════
    if (q.includes('attention') || q.includes('risk') || q.includes('action item') || q.includes('priorit')) {
      const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now);
      const openIssues = issues.filter(i => i.status === 'open');
      const lowProgressProjects = projects.filter(p => p.status === 'active' && p.progress < 40);

      if (overdueTasks.length === 0 && openIssues.length === 0 && lowProgressProjects.length === 0) {
        return { text: `Great news, **${firstName}**! No critical risks detected${scopeNote}. All tasks are on track and all issues are resolved.` };
      }

      return {
        text: `Here is your consolidated risk assessment${scopeNote}:`,
        cards: [
          {
            type: 'summary',
            title: 'Critical Health Alerts',
            items: [
              `<strong>${overdueTasks.length} Overdue Tasks</strong> requiring immediate action.`,
              `<strong>${openIssues.length} Open Issues</strong> flagged for review.`,
              `<strong>${lowProgressProjects.length} Low-Velocity Projects</strong> (<40% progress).`
            ]
          },
          ...(overdueTasks.length ? [{ type: 'task-list', title: 'Overdue Tasks', tasks: overdueTasks.slice(0, 10) }] : []),
          ...(openIssues.length ? [{ type: 'issue-list', title: 'Open Issues', issues: openIssues.slice(0, 5) }] : [])
        ]
      };
    }

    // ═══════════════════════════════════════════════
    // 2. "Show overdue tasks" / "overdue" / "late"
    // ═══════════════════════════════════════════════
    if (q.includes('overdue') || q.includes('late') || q.includes('missed')) {
      // Non-admin: only THEIR overdue tasks
      const myOverdue = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now);
      if (myOverdue.length === 0) {
        return { text: `Great news! You have **no overdue tasks**${scopeNote}. Everything is on schedule.` };
      }
      return {
        text: `Found **${myOverdue.length} overdue tasks**${scopeNote} that need attention:`,
        cards: [{ type: 'task-list', title: 'Overdue Tasks', tasks: myOverdue.slice(0, 15) }]
      };
    }

    // ═══════════════════════════════════════════════
    // 3. "What are my tasks?" / "my tasks" / "my work"
    // ═══════════════════════════════════════════════
    if (q.includes('my task') || q.includes('my work') || q.includes('assigned to me') || q === 'what are my tasks?' || q.includes('what are my tasks')) {
      if (isAdmin) {
        // Admin sees all tasks overview
        const byStatus = {
          'todo': tasks.filter(t => t.status === 'todo'),
          'in-progress': tasks.filter(t => t.status === 'in-progress'),
          'review': tasks.filter(t => t.status === 'review'),
          'done': tasks.filter(t => t.status === 'done')
        };
        return {
          text: `As Admin, you have oversight of **${tasks.length} total tasks** across all projects:`,
          cards: [
            {
              type: 'summary',
              title: 'Task Distribution by Status',
              items: [
                `<strong>${byStatus['todo'].length}</strong> To-Do (not started)`,
                `<strong>${byStatus['in-progress'].length}</strong> In Progress`,
                `<strong>${byStatus['review'].length}</strong> In Review`,
                `<strong>${byStatus['done'].length}</strong> Completed`
              ]
            },
            ...(byStatus['in-progress'].length ? [{ type: 'task-list', title: 'Currently In Progress', tasks: byStatus['in-progress'].slice(0, 8) }] : [])
          ]
        };
      }
      // Developer sees only their tasks
      const active = tasks.filter(t => t.status !== 'done');
      const done = tasks.filter(t => t.status === 'done');
      return {
        text: `You have **${tasks.length} tasks**${scopeNote} — **${active.length} active**, **${done.length} completed**.`,
        cards: [
          ...(active.length ? [{ type: 'task-list', title: 'Your Active Tasks', tasks: active.slice(0, 10) }] : []),
          ...(done.length ? [{ type: 'task-list', title: 'Completed Tasks', tasks: done.slice(0, 5) }] : [])
        ]
      };
    }

    // ═══════════════════════════════════════════════
    // 4. "Summarize my projects" / "all projects" / "projects"
    // ═══════════════════════════════════════════════
    if (q.includes('summarize') && q.includes('project') || q.includes('all projects') || q.includes('summarize my project') || (q.includes('project') && q.includes('summary'))) {
      const active = projects.filter(p => p.status === 'active');
      const completed = projects.filter(p => p.status === 'completed');
      const completionPct = stats.totalTasks ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0;
      return {
        text: `**${projects.length} projects**${scopeNote} — **${active.length} active**, **${completed.length} completed**. Overall task completion: **${completionPct}%**.`,
        cards: [{ type: 'project-list', title: `Projects${scopeNote}`, projects: projects }]
      };
    }

    // ═══════════════════════════════════════════════
    // 5. "Show upcoming deadlines" / "deadlines" / "milestones"
    // ═══════════════════════════════════════════════
    if (q.includes('deadline') || q.includes('upcoming') || q.includes('due soon') || q.includes('milestone')) {
      const pendingMilestones = milestones.filter(m => m.status !== 'completed');
      const upcomingTasks = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) >= now).sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 8);

      if (pendingMilestones.length === 0 && upcomingTasks.length === 0) {
        return { text: `No upcoming milestones or deadlines${scopeNote}. You're all clear!` };
      }

      return {
        text: `Here are upcoming milestones and deadlines${scopeNote}:`,
        cards: [
          ...(pendingMilestones.length ? [{
            type: 'summary',
            title: 'Upcoming Milestones',
            items: pendingMilestones.map(m => {
              const p = Store.getProject(m.projectId);
              return `<strong>${m.name}</strong> (${p ? p.name : 'No project'}) · Due: <strong>${Utils.formatDate(m.dueDate)}</strong>`;
            })
          }] : []),
          ...(upcomingTasks.length ? [{ type: 'task-list', title: 'Next Tasks Due', tasks: upcomingTasks }] : [])
        ]
      };
    }

    // ═══════════════════════════════════════════════
    // 6. "Show blocked tasks" / "issues" / "blocked"
    // ═══════════════════════════════════════════════
    if (q.includes('blocked') || q.includes('issue') || q.includes('bug') || q.includes('blocker')) {
      // Non-admin: only issues in their projects
      const openIssues = issues.filter(i => i.status === 'open');
      if (openIssues.length === 0) {
        return { text: `No open issues or blockers${scopeNote}. All clear!` };
      }
      return {
        text: `**${openIssues.length} open issues** found${scopeNote}:`,
        cards: [{ type: 'issue-list', title: 'Unresolved Issues', issues: openIssues.slice(0, 10) }]
      };
    }

    // ═══════════════════════════════════════════════
    // 7. "Summarize today's activity" / "activity" / "recent"
    // ═══════════════════════════════════════════════
    if (q.includes('activity') || q.includes('recent') || q.includes('today') || q.includes('update')) {
      const activities = Store.getActivities(8);
      // Non-admin: filter to activities in their projects
      const myProjectIds = new Set(projects.map(p => p.id));
      const filteredActivities = isAdmin ? activities : activities.filter(a => !a.projectId || myProjectIds.has(a.projectId));

      if (filteredActivities.length === 0) {
        return { text: `No recent activity${scopeNote}.` };
      }
      return {
        text: `Recent activity${scopeNote}:`,
        cards: [{
          type: 'summary',
          title: 'Recent Activity Stream',
          items: filteredActivities.map(a => `${a.html} <span style="color:var(--color-text-muted);font-size:11px">(${Utils.timeAgo(a.createdAt)})</span>`)
        }]
      };
    }

    // ═══════════════════════════════════════════════
    // 8. "Show project progress" / "progress"
    // ═══════════════════════════════════════════════
    if (q.includes('progress') || q.includes('completion') || (q.includes('status') && q.includes('project'))) {
      return {
        text: `Project progress${scopeNote}:`,
        cards: [{ type: 'project-list', title: 'Project Progress', projects: projects }]
      };
    }

    // ═══════════════════════════════════════════════
    // 9. Admin: "Team workload" / "team" / "members" / "who is"
    // ═══════════════════════════════════════════════
    if (q.includes('team') || q.includes('workload') || q.includes('member') || q.includes('who is') || q.includes('assignee')) {
      // Get members with their task counts
      const membersWithTasks = allMembers.filter(m => m.role !== 'Admin').map(m => {
        const memberTasks = tasks.filter(t => t.assigneeId === m.id);
        return {
          ...m,
          activeTasks: memberTasks.filter(t => t.status !== 'done').length,
          completedTasks: memberTasks.filter(t => t.status === 'done').length,
          totalTasks: memberTasks.length
        };
      }).sort((a, b) => b.activeTasks - a.activeTasks);

      if (!isAdmin) {
        // Non-admin: show their own task load info
        const myActive = tasks.filter(t => t.status !== 'done').length;
        const myDone = tasks.filter(t => t.status === 'done').length;
        return {
          text: `Your workload: **${myActive} active tasks**, **${myDone} completed** across **${projects.length} projects**.`,
          cards: [
            {
              type: 'summary',
              title: 'Your Workload Summary',
              items: [
                `${myActive} active tasks assigned to you`,
                `${myDone} tasks completed`,
                `${projects.length} projects in scope`,
                stats.overdueTasks ? `${stats.overdueTasks} overdue items` : 'No overdue items'
              ]
            }
          ]
        };
      }

      // Admin: full team view
      return {
        text: `Team workload overview — **${membersWithTasks.length} team members** across all projects:`,
        cards: [
          {
            type: 'team-list',
            title: 'Team Members & Workload',
            members: membersWithTasks
          },
          {
            type: 'summary',
            title: 'Workload Distribution',
            items: membersWithTasks.map(m =>
              `<strong>${m.name}</strong>: ${m.activeTasks} active / ${m.totalTasks} total tasks`
            )
          }
        ]
      };
    }

    // ═══════════════════════════════════════════════
    // 10. "My overdue" / "project status breakdown"
    // ═══════════════════════════════════════════════
    if (q.includes('status') || q.includes('breakdown') || q.includes('summary') || q.includes('overview')) {
      const breakdown = {
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        done: tasks.filter(t => t.status === 'done').length
      };
      const projStatus = {
        active: projects.filter(p => p.status === 'active').length,
        planning: projects.filter(p => p.status === 'planning').length,
        completed: projects.filter(p => p.status === 'completed').length,
      };
      const completionPct = stats.totalTasks ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0;

      return {
        text: `Status breakdown${scopeNote}:`,
        cards: [{
          type: 'summary',
          title: 'Workspace Status Overview',
          items: [
            `**Tasks:** ${breakdown.todo} To-Do · ${breakdown.inProgress} In Progress · ${breakdown.review} In Review · ${breakdown.done} Done (${completionPct}% complete)`,
            `**Projects:** ${projStatus.active} Active · ${projStatus.planning} Planning · ${projStatus.completed} Completed`,
            `**Milestones:** ${stats.completedMilestones}/${stats.totalMilestones} completed`,
            `**Issues:** ${stats.openIssues} open issues`
          ]
        }]
      };
    }

    // ═══════════════════════════════════════════════
    // 11. "My overdue" specifically
    // ═══════════════════════════════════════════════
    if (q.includes('my overdue')) {
      const myOverdue = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now);
      if (myOverdue.length === 0) return { text: `No overdue tasks${scopeNote}. You're on track!` };
      return {
        text: `**${myOverdue.length} overdue tasks**${scopeNote}:`,
        cards: [{ type: 'task-list', title: 'Your Overdue Tasks', tasks: myOverdue.slice(0, 10) }]
      };
    }

    // ═══════════════════════════════════════════════
    // 12. "My open issues" specifically
    // ═══════════════════════════════════════════════
    if (q.includes('my issue') || q.includes('my open')) {
      const myOpenIssues = issues.filter(i => i.status === 'open');
      if (myOpenIssues.length === 0) return { text: `No open issues${scopeNote}.` };
      return {
        text: `**${myOpenIssues.length} open issues**${scopeNote}:`,
        cards: [{ type: 'issue-list', title: 'Your Open Issues', issues: myOpenIssues.slice(0, 10) }]
      };
    }

    // ═══════════════════════════════════════════════
    // 13. My project progress specifically
    // ═══════════════════════════════════════════════
    if (q.includes('my project')) {
      if (projects.length === 0) return { text: `No projects assigned to you yet.` };
      return {
        text: `Your projects${scopeNote}:`,
        cards: [{ type: 'project-list', title: 'Your Projects', projects: projects }]
      };
    }

    // ═══════════════════════════════════════════════
    // 14. Summarize my work (non-admin)
    // ═══════════════════════════════════════════════
    if (q.includes('summarize my') || q.includes('my summary')) {
      const active = tasks.filter(t => t.status !== 'done');
      const done = tasks.filter(t => t.status === 'done');
      const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now);
      return {
        text: `Here's your work summary, **${firstName}**:`,
        cards: [
          {
            type: 'summary',
            title: 'Your Work Summary',
            items: [
              `${projects.length} project(s) in scope`,
              `${active.length} active tasks, ${done.length} completed`,
              overdue.length ? `${overdue.length} overdue tasks` : 'No overdue tasks',
              `${issues.filter(i => i.status === 'open').length} open issues`
            ]
          },
          ...(active.length ? [{ type: 'task-list', title: 'Active Tasks', tasks: active.slice(0, 5) }] : [])
        ]
      };
    }

    // ═══════════════════════════════════════════════
    // 15. "Team member activity" (admin)
    // ═══════════════════════════════════════════════
    if (q.includes('team member') || q.includes('member activity')) {
      if (!isAdmin) return { text: `Team member details are only available for Admin users.` };
      const members = allMembers.filter(m => m.role !== 'Admin');
      return {
        text: `Team member overview:`,
        cards: [{
          type: 'team-list',
          title: 'All Team Members',
          members: members.map(m => ({
            ...m,
            activeTasks: tasks.filter(t => t.assigneeId === m.id && t.status !== 'done').length,
            totalTasks: tasks.filter(t => t.assigneeId === m.id).length
          }))
        }]
      };
    }

    // ═══════════════════════════════════════════════
    // 16. General search fallback
    // ═══════════════════════════════════════════════
    const searchRes = Store.search(q);
    // Scope search results for non-admin
    const projectIds = new Set(projects.map(p => p.id));
    let filteredSearch = searchRes;
    if (!isAdmin) {
      filteredSearch = {
        tasks: searchRes.tasks.filter(t => projectIds.has(t.projectId)),
        projects: searchRes.projects.filter(p => projectIds.has(p.id)),
        issues: searchRes.issues.filter(i => projectIds.has(i.projectId)),
      };
    }
    if (filteredSearch.tasks.length || filteredSearch.projects.length || filteredSearch.issues.length) {
      return {
        text: `Found records matching **"${rawQuery}"**${scopeNote}:`,
        cards: [
          ...(filteredSearch.projects.length ? [{ type: 'project-list', title: 'Matching Projects', projects: filteredSearch.projects }] : []),
          ...(filteredSearch.tasks.length ? [{ type: 'task-list', title: 'Matching Tasks', tasks: filteredSearch.tasks.slice(0, 10) }] : []),
          ...(filteredSearch.issues.length ? [{ type: 'issue-list', title: 'Matching Issues', issues: filteredSearch.issues.slice(0, 5) }] : [])
        ]
      };
    }

    // ═══════════════════════════════════════════════
    // 17. Default helpful response
    // ═══════════════════════════════════════════════
    const adminHelp = [
      `"What needs my attention?" — Consolidates overdue tasks, open issues, and project risks.`,
      `"Team workload overview" — See all team members and their task distribution.`,
      `"Show overdue tasks" — Lists all overdue items with direct action cards.`,
      `"Project status breakdown" — Overview of all projects by status.`,
      `"Summarize all projects" — Full project listing with progress bars.`
    ];
    const devHelp = [
      `"What are my tasks?" — Lists all tasks assigned to you.`,
      `"My overdue tasks" — Overdue tasks in your scope.`,
      `"My project progress" — Projects you're working on.`,
      `"Show my upcoming deadlines" — Upcoming milestones and task deadlines.`,
      `"My open issues" — Issues in your projects.`
    ];

    return {
      text: `I processed your inquiry: *"${rawQuery}"*\n\nYou can click the suggested prompts above, or try:`,
      cards: [{
        type: 'summary',
        title: 'Available Queries',
        items: (isAdmin ? adminHelp : devHelp).map(h => `<strong>${h}</strong>`)
      }]
    };
  },

  clearChat() {
    this._messages = null;
    this._currentUserId = null;
    this.refresh();
  },

  refresh() {
    const content = document.getElementById('page-content');
    if (content && App.currentScreen === 'ai-assistant') {
      content.innerHTML = this.render();
      this._scrollBottom();
    }
  },

  _scrollBottom() {
    setTimeout(() => {
      const container = document.getElementById('ai-chat-messages');
      if (container) container.scrollTop = container.scrollHeight;
    }, 40);
  }
};
