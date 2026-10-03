// ESLint flat config — Hintonn PMO
// Run: npx eslint js/ tests/ functions/index.js
const js = require('@eslint/js');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'functions/node_modules/**',
      '_backups/**',
      'js/screens/login.js.bak'
    ]
  },
  js.configs.recommended,
  {
    files: ['js/**/*.js', 'tests/**/*.js', '*.js', 'functions/index.js', 'firebase-messaging-sw.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        // Browser
        window: 'readonly', document: 'readonly', navigator: 'readonly',
        localStorage: 'readonly', sessionStorage: 'readonly',
        console: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly',
        setInterval: 'readonly', clearInterval: 'readonly',
        fetch: 'readonly', location: 'readonly', event: 'readonly',
        confirm: 'readonly', alert: 'readonly', prompt: 'readonly',
        requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
        requestIdleCallback: 'readonly', matchMedia: 'readonly',
        getComputedStyle: 'readonly', history: 'readonly',
        IntersectionObserver: 'readonly', ResizeObserver: 'readonly',
        MutationObserver: 'readonly', DOMParser: 'readonly',
        Blob: 'readonly', File: 'readonly', FileReader: 'readonly',
        URL: 'readonly', crypto: 'readonly', queueMicrotask: 'readonly',
        structuredClone: 'readonly', btoa: 'readonly', atob: 'readonly',
        Firebase: 'readonly', firebase: 'readonly',
        self: 'readonly', importScripts: 'readonly', Notification: 'readonly',
        caches: 'readonly', ServiceWorkerGlobalScope: 'readonly',
        // App globals (cross-file)
        Utils: 'writable', App: 'writable', Store: 'writable', Auth: 'writable',
        FirebaseAuth: 'writable', FCM: 'writable',
        LoginScreen: 'writable', DashboardScreen: 'writable', BillingScreen: 'writable',
        RetentionScreen: 'writable', BankGuaranteesScreen: 'writable', DLPTimelinesScreen: 'writable',
        ProjectsScreen: 'writable', ProjectDetailScreen: 'writable', TasksScreen: 'writable',
        TimelineScreen: 'writable', TeamScreen: 'writable', CalendarScreen: 'writable',
        ReportsScreen: 'writable', IssuesScreen: 'writable', MilestonesScreen: 'writable',
        AIAssistantScreen: 'writable', ConnectorsScreen: 'writable', NotificationsScreen: 'writable',
        SettingsScreen: 'writable', UserApprovalsScreen: 'writable',
        Icons: 'writable', Sidebar: 'writable', Topbar: 'writable',
        Modal: 'writable', Toast: 'writable', Command: 'writable', Utils_: 'writable',
        appState: 'writable', globalThis: 'readonly', module: 'writable',
        require: 'writable', process: 'readonly', __dirname: 'readonly', exports: 'writable'
      }
    },
    rules: {
      'no-redeclare': 'off',
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-console': 'off',
      eqeqeq: ['warn', 'smart'],
      'no-useless-assignment': 'warn',
      'no-constant-condition': 'warn',
      'no-useless-escape': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn'
    }
  },
  {
    files: ['functions/index.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { console: 'readonly', process: 'readonly' }
    }
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: { require: 'readonly', module: 'writable', process: 'readonly', __dirname: 'readonly' }
    }
  }
];
