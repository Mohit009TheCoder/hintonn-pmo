const { execSync } = require('child_process');

const tests = [
  'scratch/verify_features.js',
  'scratch/test_tasks_and_connectors.js',
  'scratch/test_reports_and_rbac.js',
  'scratch/test_multi_assignee_and_shared_visibility.js',
  'scratch/test_admin_personal_tasks_and_team_cards.js',
  'scratch/test_admin_layout_privacy_and_realtime_sync.js',
  'scratch/test_admin_task_review_and_notification.js',
  'scratch/test_tasks_list_view.js'
];

for (const t of tests) {
  console.log(`\n================== RUNNING: ${t} ==================`);
  try {
    const out = execSync(`node "${t}"`, { encoding: 'utf8' });
    console.log(out);
  } catch (err) {
    console.error(`FAILED: ${t}`);
    console.error(err.stdout || err.message);
    process.exit(1);
  }
}

console.log('\n======================================================');
console.log('✅ ALL TEST SUITES PASSED SUCCESSFULLY WITH 100% SUCCESS RATE');
console.log('======================================================');
