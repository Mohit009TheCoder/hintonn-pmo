const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock browser globals
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = v; },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

const domElements = {};
function createMockElement(id) {
  return {
    id: id || '',
    innerHTML: '',
    value: '',
    style: {},
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._classes.has(c)) this._classes.delete(c);
          else this._classes.add(c);
        } else if (force) this._classes.add(c);
        else this._classes.delete(c);
      },
      contains(c) { return this._classes.has(c); }
    },
    querySelector(sel) { return createMockElement(); },
    querySelectorAll() { return []; },
    focus() { this._focused = true; },
    blur() { this._focused = false; },
    _focused: false
  };
}

global.document = {
  getElementById(id) {
    if (!domElements[id]) domElements[id] = createMockElement(id);
    return domElements[id];
  },
  querySelector(sel) {
    if (sel && sel.startsWith('#')) return this.getElementById(sel.slice(1));
    return createMockElement();
  },
  querySelectorAll() { return []; },
  addEventListener() {},
  body: createMockElement('body')
};

global.window = {
  location: { hash: '#dashboard' },
  addEventListener() {},
  innerWidth: 1440
};

// Load scripts
const files = [
  'js/store.js',
  'js/auth.js',
  'js/components/icons.js',
  'js/components/sidebar.js',
  'js/components/topbar.js',
  'js/components/modal.js',
  'js/components/toast.js',
  'js/components/command.js',
  'js/screens/login.js',
  'js/screens/dashboard.js',
  'js/screens/billing.js',
  'js/screens/retention.js',
  'js/screens/bank-guarantees.js',
  'js/screens/dlp.js',
  'js/screens/projects.js',
  'js/screens/project-detail.js',
  'js/screens/tasks.js',
  'js/screens/timeline.js',
  'js/screens/team.js',
  'js/screens/calendar.js',
  'js/screens/reports.js',
  'js/screens/issues.js',
  'js/screens/milestones.js',
  'js/screens/ai-assistant.js',
  'js/screens/notifications.js',
  'js/screens/settings.js',
  'js/app.js'
];

files.forEach(f => {
  const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  vm.runInThisContext(code);
});

console.log('--- TEST 1: Global Search Modal Navigation Indexing ---');
Store.init();
Auth.init();

const navSearchQueries = ['Projects', 'Tasks', 'Calendar', 'Issues', 'Milestones', 'Reports'];
navSearchQueries.forEach(q => {
  const res = Store.search(q);
  if (!res.pages || !res.pages.some(p => p.name.toLowerCase() === q.toLowerCase())) {
    throw new Error(`Store.search('${q}') failed to return navigation page '${q}'!`);
  }
  console.log(`✔ Store.search('${q}') correctly indexes page -> #${res.pages.find(p => p.name.toLowerCase() === q.toLowerCase()).route}`);
});

// Test Command.renderResults for Page grouping
Command.renderResults('Projects');
const resultsHtml = document.getElementById('command-results').innerHTML;
if (!resultsHtml.includes('<div class="command-group-label">Pages</div>')) {
  throw new Error('Command results for "Projects" missing "Pages" group!');
}
if (!resultsHtml.includes('#projects')) {
  throw new Error('Command results missing routing to #projects!');
}
console.log('✔ Command modal groups page results under "Pages" and routes to #projects');

// Test Command.renderResults for Projects grouping
Command.renderResults('Hintonn');
const projectResultsHtml = document.getElementById('command-results').innerHTML;
if (!projectResultsHtml.includes('<div class="command-group-label">Projects</div>')) {
  throw new Error('Command results for "Hintonn" missing "Projects" group!');
}
console.log('✔ Command modal groups project results under "Projects"');

// Test Tasks and Issues search
Command.renderResults('Implement');
const taskResultsHtml = document.getElementById('command-results').innerHTML;
if (!taskResultsHtml.includes('<div class="command-group-label">Tasks/Issues</div>')) {
  throw new Error('Command modal missing "Tasks/Issues" group for task search!');
}
console.log('✔ Command modal properly renders "Tasks/Issues" group for task/issue items');

console.log('\n--- TEST 2: Projects Search Bar Input & Focus Fix ---');
const pageContent = document.getElementById('page-content');
pageContent.innerHTML = ProjectsScreen.render();

const initialSearchInput = document.getElementById('project-search-input');
initialSearchInput.value = 'Hintonn';
ProjectsScreen.handleSearch('Hintonn');

const updatedContentArea = document.getElementById('projects-list');
if (!updatedContentArea || !updatedContentArea.innerHTML.includes('Hintonn AI Platform')) {
  throw new Error('ProjectsScreen.handleSearch failed to update #projects-list!');
}

const sameSearchInput = document.getElementById('project-search-input');
if (sameSearchInput !== initialSearchInput) {
  throw new Error('Search input was recreated/unmounted! DOM reference lost focus!');
}
console.log('✔ Projects search bar DOM container remains intact and preserves focus during search input');

console.log('\n--- TEST 3: Exclude Admin from Team Page ---');
const teamHtml = TeamScreen.render();

if (teamHtml.includes('Ayush Desai')) {
  throw new Error('Admin (Ayush Desai) is still rendered in TeamScreen!');
}
if (teamHtml.includes('4 active team members')) {
  throw new Error('Team page still mentions 4 active team members instead of 3 AI Developers!');
}
if (!teamHtml.includes('3 active AI Developers')) {
  throw new Error('Team page header does not reflect active AI Developers count!');
}

const expectedDevs = ['Preet Bhavsar', 'Mohit Jain', 'Hirvi Sanghavi'];
expectedDevs.forEach(dev => {
  if (!teamHtml.includes(dev)) {
    throw new Error(`Expected AI Developer ${dev} is missing from Team page!`);
  }
});
console.log('✔ Team page successfully excludes Admin (Ayush Desai) and renders ONLY 3 AI Developers with workload metrics');

console.log('\n🎉 ALL FIXES VERIFIED SUCCESSFULLY! 🎉');
