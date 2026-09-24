// ─── AI Assistant (PM Copilot) Screen ───
const AIAssistantScreen = {
  _messages: null,
  _currentUserId: null,

  _getCurrentUser() {
    if (typeof Auth !== 'undefined' && Auth.getCurrentUser()) {
      return Auth.getCurrentUser();
    }
    const storedId = (typeof Store !== 'undefined' && Store.getSettings()?.currentUser) || 'm1';
    const member = typeof Store !== 'undefined' ? Store.getMember(storedId) : null;
    return member || {
      id: 'ayush',
      memberId: 'm1',
      name: 'Ayush Desai',
      role: 'Admin',
      initials: 'AD',
      color: '#2563EB'
    };
  },

  _initMessages() {
    const currentUser = this._getCurrentUser();
    const userId = currentUser.id || currentUser.memberId || currentUser.name || 'user';

    if (!this._messages || this._currentUserId !== userId) {
      this._currentUserId = userId;
      const firstName = currentUser.firstName || (currentUser.name ? currentUser.name.split(' ')[0] : 'User');
      const isAdmin = currentUser.role === 'Admin';
      const stats = Store.getStats();

      let activeProjectsCount, totalProjectsCount, totalTasksCount, completedTasksCount, overdueTasksCount, openIssuesCount;

      if (isAdmin) {
        activeProjectsCount = stats.activeProjects;
        totalProjectsCount = stats.totalProjects;
        totalTasksCount = stats.totalTasks;
        completedTasksCount = stats.completedTasks;
        overdueTasksCount = stats.overdueTasks;
        openIssuesCount = stats.openIssues;
      } else {
        const userMemberId = currentUser.memberId || (currentUser.id === 'preet' ? 'm2' : currentUser.id === 'mohit' ? 'm3' : currentUser.id === 'hirvi' ? 'm4' : '');
        const myTasks = Store.getTasks().filter(t => 
          t.assigneeId === currentUser.id ||
          (userMemberId && t.assigneeId === userMemberId) ||
          (currentUser.id === 'preet' && t.assigneeId === 'm2') ||
          (currentUser.id === 'mohit' && t.assigneeId === 'm3') ||
          (currentUser.id === 'hirvi' && t.assigneeId === 'm4') ||
          (currentUser.memberId === 'm2' && t.assigneeId === 'preet') ||
          (currentUser.memberId === 'm3' && t.assigneeId === 'mohit') ||
          (currentUser.memberId === 'm4' && t.assigneeId === 'hirvi')
        );
        const myProjectIds = new Set(myTasks.map(t => t.projectId));
        const myProjects = Store.getProjects().filter(p => myProjectIds.has(p.id) || (p.memberIds && p.memberIds.includes(userMemberId)));

        activeProjectsCount = myProjects.filter(p => p.status === 'active').length;
        totalProjectsCount = myProjects.length;
        totalTasksCount = myTasks.length;
        completedTasksCount = myTasks.filter(t => t.status === 'done').length;
        overdueTasksCount = myTasks.filter(t => t.status !== 'done' && Utils.isOverdue(t.dueDate)).length;
        openIssuesCount = Store.getIssues().filter(i => 
          (i.assigneeId === currentUser.id || (userMemberId && i.assigneeId === userMemberId) ||
           (currentUser.id === 'preet' && i.assigneeId === 'm2') ||
           (currentUser.id === 'mohit' && i.assigneeId === 'm3') ||
           (currentUser.id === 'hirvi' && i.assigneeId === 'm4')) && i.status === 'open'
        ).length;
      }

      const completionPct = totalTasksCount ? Math.round(completedTasksCount / totalTasksCount * 100) : 0;

      this._messages = [
        {
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Hello ${firstName}! I am your Hintonn AI Project Copilot. I actively monitor your **${activeProjectsCount} active projects**, **${totalTasksCount} tasks**, and team workflows.`,
          cards: [
            {
              type: 'summary',
              title: 'Workspace Health Overview',
              items: [
                `${activeProjectsCount} active projects (${totalProjectsCount} total${!isAdmin ? ' in scope' : ''})`,
                `${completedTasksCount}/${totalTasksCount} tasks completed (${completionPct}%)`,
                `${overdueTasksCount} overdue tasks needing resolution`,
                `${openIssuesCount} open issues requiring technical review`
              ]
            }
          ]
        }
      ];
    }
  },

  render() {
    this._initMessages();

    return `
      <div class="page-header" style="margin-bottom:16px">
        <div class="page-header-left">
          <div style="display:flex;align-items:center;gap:8px">
            <h1>AI Assistant</h1>
            <span class="badge badge-active" style="font-size:11px">Local Intelligence Engine</span>
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
          <button class="ai-prompt-chip" onclick="AIAssistantScreen.sendPrompt('What needs my attention?')">What needs my attention?</button>
          <button class="ai-prompt-chip" onclick="AIAssistantScreen.sendPrompt('Show overdue tasks')">Show overdue tasks</button>
          <button class="ai-prompt-chip" onclick="AIAssistantScreen.sendPrompt('Summarize my projects')">Summarize my projects</button>
          <button class="ai-prompt-chip" onclick="AIAssistantScreen.sendPrompt('Show upcoming deadlines')">Show upcoming deadlines</button>
          <button class="ai-prompt-chip" onclick="AIAssistantScreen.sendPrompt('Show blocked tasks & issues')">Show blocked tasks & issues</button>
          <button class="ai-prompt-chip" onclick="AIAssistantScreen.sendPrompt('Summarize today\\'s activity')">Summarize today's activity</button>
          <button class="ai-prompt-chip" onclick="AIAssistantScreen.sendPrompt('Show project progress')">Show project progress</button>
          <button class="ai-prompt-chip" onclick="TasksScreen.openCreateModal()">+ Create a task</button>
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
              placeholder="Ask about projects, overdue tasks, team workload, deadlines, or risks..." 
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
    const userInitials = currentUser ? (currentUser.initials || (currentUser.name ? currentUser.name.split(' ').map(w=>w[0]).join('').slice(0,2) : 'AD')) : 'AD';
    const userName = currentUser ? currentUser.name : 'Ayush Desai';
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
                  <div style="font-size:11.5px;color:var(--color-text-muted)">${p.type} · ${Store.getTasks(p.id).length} tasks · ${Store.getMilestones(p.id).length} milestones</div>
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
                    <div style="font-size:11px;color:var(--color-text-muted)">${p ? p.name : ''} · ${i.description}</div>
                  </div>
                </div>
              `;
            }).join('')}
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
    this._messages.push({
      sender: 'user',
      time,
      text: query
    });

    input.value = '';
    this._scrollBottom();

    // Process intelligence query locally
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

  _processQuery(rawQuery) {
    const q = rawQuery.toLowerCase();
    const tasks = Store.getTasks();
    const projects = Store.getProjects();
    const milestones = Store.getMilestones();
    const issues = Store.getIssues();
    const stats = Store.getStats();

    // 1. "What needs my attention?" / "Attention" / "Risks" / "Action items"
    if (q.includes('attention') || q.includes('risk') || q.includes('action item') || q.includes('priorit')) {
      const overdueTasks = tasks.filter(t => t.status !== 'done' && Utils.isOverdue(t.dueDate));
      const openIssues = issues.filter(i => i.status === 'open');
      const lowProgressProjects = projects.filter(p => p.status === 'active' && p.progress < 40);

      return {
        text: `Here is a consolidated risk and attention assessment for your workspace:`,
        cards: [
          {
            type: 'summary',
            title: 'Critical Health Alerts',
            items: [
              `<strong>${overdueTasks.length} Overdue Tasks</strong> requiring immediate status update or re-assignment.`,
              `<strong>${openIssues.length} Open Technical Issues</strong> flagged in active repositories.`,
              `<strong>${lowProgressProjects.length} Active Projects with Low Velocity</strong> (<40% progress).`
            ]
          },
          ...(overdueTasks.length ? [{
            type: 'task-list',
            title: 'Overdue Tasks',
            tasks: overdueTasks
          }] : []),
          ...(openIssues.length ? [{
            type: 'issue-list',
            title: 'Open Technical Issues',
            issues: openIssues
          }] : [])
        ]
      };
    }

    // 2. "Show overdue tasks" / "overdue"
    if (q.includes('overdue') || q.includes('late') || q.includes('missed')) {
      const overdueTasks = tasks.filter(t => t.status !== 'done' && Utils.isOverdue(t.dueDate));
      if (overdueTasks.length === 0) {
        return {
          text: `Great news! There are currently **no overdue tasks** across all active projects. Everything is running on schedule.`
        };
      }
      return {
        text: `Found **${overdueTasks.length} overdue tasks** that missed their target due date:`,
        cards: [
          {
            type: 'task-list',
            title: 'Overdue Tasks',
            tasks: overdueTasks
          }
        ]
      };
    }

    // 3. "Summarize my projects" / "projects summary" / "projects"
    if (q.includes('summarize my projects') || q.includes('summarize project') || q.includes('all projects') || (q.includes('project') && q.includes('summary'))) {
      const active = projects.filter(p => p.status === 'active');
      return {
        text: `You have **${projects.length} total projects** in the workspace (**${active.length} active**). Overall task completion rate is **${stats.totalTasks ? Math.round(stats.completedTasks/stats.totalTasks*100) : 0}%**.`,
        cards: [
          {
            type: 'project-list',
            title: 'Active & Planned Projects',
            projects: projects
          }
        ]
      };
    }

    // 4. "Show upcoming deadlines" / "deadlines" / "milestones"
    if (q.includes('deadline') || q.includes('upcoming') || q.includes('due soon') || q.includes('milestone')) {
      const pendingMilestones = milestones.filter(m => m.status !== 'completed');
      const upcomingTasks = tasks.filter(t => t.status !== 'done' && t.dueDate && !Utils.isOverdue(t.dueDate)).slice(0, 5);

      return {
        text: `Here are the upcoming major milestones and task targets approaching on the schedule:`,
        cards: [
          {
            type: 'summary',
            title: 'Upcoming Milestones',
            items: pendingMilestones.map(m => {
              const p = Store.getProject(m.projectId);
              return `<strong>${m.name}</strong> (${p ? p.name : ''}) · Due: <strong>${Utils.formatDate(m.dueDate)}</strong>`;
            })
          },
          {
            type: 'task-list',
            title: 'Next Tasks Due',
            tasks: upcomingTasks
          }
        ]
      };
    }

    // 5. "Show blocked tasks" / "issues" / "blocked"
    if (q.includes('blocked') || q.includes('issue') || q.includes('bug') || q.includes('blocker')) {
      const openIssues = issues.filter(i => i.status === 'open');
      return {
        text: `There are **${openIssues.length} open issues** currently tracked across projects:`,
        cards: [
          {
            type: 'issue-list',
            title: 'Unresolved Issues & Blockers',
            issues: openIssues
          }
        ]
      };
    }

    // 6. "Summarize today's activity" / "activity" / "recent"
    if (q.includes('activity') || q.includes('recent') || q.includes('today') || q.includes('update')) {
      const activities = Store.getActivities(6);
      return {
        text: `Here is a summary of recent actions and audit log updates across your workspace:`,
        cards: [
          {
            type: 'summary',
            title: 'Recent Activity Stream',
            items: activities.map(a => `${a.html} <span style="color:var(--color-text-muted);font-size:11px">(${Utils.timeAgo(a.createdAt)})</span>`)
          }
        ]
      };
    }

    // 7. "Show project progress" / "progress"
    if (q.includes('progress') || q.includes('completion') || q.includes('status')) {
      return {
        text: `Current aggregate project completion stats:`,
        cards: [
          {
            type: 'project-list',
            title: 'Project Progress Status',
            projects: projects
          }
        ]
      };
    }

    // 8. General search / fallback query matching
    const searchRes = Store.search(q);
    if (searchRes.tasks.length || searchRes.projects.length || searchRes.issues.length) {
      return {
        text: `Found relevant records matching **"${rawQuery}"**:`,
        cards: [
          ...(searchRes.projects.length ? [{
            type: 'project-list',
            title: 'Matching Projects',
            projects: searchRes.projects
          }] : []),
          ...(searchRes.tasks.length ? [{
            type: 'task-list',
            title: 'Matching Tasks',
            tasks: searchRes.tasks
          }] : []),
          ...(searchRes.issues.length ? [{
            type: 'issue-list',
            title: 'Matching Issues',
            issues: searchRes.issues
          }] : [])
        ]
      };
    }

    // Default polite response with helpful query capabilities
    return {
      text: `I processed your inquiry: *"I am analyzing '${rawQuery}' across workspace records."*\n\nYou can click any of the suggested prompt pills above or ask for **"overdue tasks"**, **"projects summary"**, **"upcoming deadlines"**, or **"risks and attention"**.`,
      cards: [
        {
          type: 'summary',
          title: 'Available Analytical Inquiries',
          items: [
            `<strong>"What needs my attention?"</strong> — Consolidates overdue tasks, open issues, and project risks.`,
            `<strong>"Show overdue tasks"</strong> — Lists all overdue items with direct action cards.`,
            `<strong>"Summarize my projects"</strong> — Overview of active and completed projects.`,
            `<strong>"Show upcoming deadlines"</strong> — Upcoming milestone timeline dates.`
          ]
        }
      ]
    };
  },

  clearChat() {
    this._messages = null;
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
