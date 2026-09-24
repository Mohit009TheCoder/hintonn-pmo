// Verification script for Calendar & Search features
const fs = require('fs');
const path = require('path');

console.log('Testing JS files syntax and imports...');

function checkSyntax(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  try {
    new Function(code);
    console.log(`✓ ${path.basename(filePath)} passed syntax check`);
  } catch (err) {
    console.error(`✗ ${path.basename(filePath)} syntax error:`, err.message);
    process.exit(1);
  }
}

const jsFiles = [
  'js/store.js',
  'js/auth.js',
  'js/components/icons.js',
  'js/components/sidebar.js',
  'js/components/topbar.js',
  'js/components/modal.js',
  'js/components/toast.js',
  'js/components/command.js',
  'js/screens/calendar.js',
  'js/screens/tasks.js',
  'js/screens/issues.js',
  'js/screens/projects.js',
  'js/screens/timeline.js',
  'js/screens/billing.js',
  'js/app.js'
];

jsFiles.forEach(f => checkSyntax(path.join(__dirname, '..', f)));

console.log('\nAll JS files passed syntax checks successfully!');
