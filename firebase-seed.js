/**
 * Hintonn PMO — Full Firestore Seed Script
 * Seeds ALL 15 collections with realistic EPC/PMO data
 * Usage: node firebase-seed.js
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const mod = await import('firebase-admin');
  const admin = mod.default || mod;
  const { cert } = mod;

  const serviceAccount = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'service-account.json'), 'utf8')
  );

  try {
    admin.initializeApp({ credential: cert(serviceAccount), projectId: 'hintonn-pmo' });
  } catch (e) { /* already initialized */ }

  const firestoreMod = await import('firebase-admin/firestore');
  const db = firestoreMod.getFirestore();
  const FieldValue = firestoreMod.FieldValue;
  const Timestamp = firestoreMod.Timestamp;

  console.log('\n🔥 Hintonn PMO — Seeding Firestore (hintonn-pmo)\n');

  // ─── Helpers ───
  async function seedCollection(name, items) {
    const batch = db.batch();
    items.forEach(item => {
      const ref = db.collection(name).doc(String(item.id));
      batch.set(ref, item);
    });
    await batch.commit();
    console.log(`  ✅ ${name}: ${items.length} documents`);
  }

  async function seedSingleDoc(collection, docId, data) {
    await db.collection(collection).doc(docId).set(data);
    console.log(`  ✅ ${collection}/${docId}: 1 document`);
  }

  const now = new Date().toISOString();
  const ts = (d) => Timestamp.fromDate(new Date(d));

  // ═══════════════════════════════════════════════
  // 1. MEMBERS
  // ═══════════════════════════════════════════════
  const members = [
    { id: 'm1', name: 'Ayush Desai', role: 'Admin', designation: 'Admin & Founder', email: 'ayush@hintonn.com', initials: 'AD', color: '#6366F1', activeTasks: 0, completedTasks: 0, hoursLogged: 0, createdAt: now, updatedAt: now },
    { id: 'm2', name: 'Preet Hintonn', role: 'Project Manager', designation: 'Senior Project Manager', email: 'preethintonn@gmail.com', initials: 'PH', color: '#2563EB', activeTasks: 4, completedTasks: 12, hoursLogged: 320, createdAt: now, updatedAt: now },
    { id: 'm3', name: 'Mohit Jain', role: 'Admin', designation: 'Executive PMO & Lead', email: 'mohithintonn@gmail.com', initials: 'MJ', color: '#4F46E5', activeTasks: 3, completedTasks: 18, hoursLogged: 480, createdAt: now, updatedAt: now },
    { id: 'm4', name: 'Hirvi Hintonn', role: 'PMO', designation: 'PMO Analyst', email: 'hirvihintonn@gmail.com', initials: 'HH', color: '#7C3AED', activeTasks: 5, completedTasks: 8, hoursLogged: 210, createdAt: now, updatedAt: now },
    { id: 'm5', name: 'Riya Sharma', role: 'Contractor', designation: 'Site Engineer', email: 'riya.sharma@buildcon.in', initials: 'RS', color: '#059669', activeTasks: 3, completedTasks: 6, hoursLogged: 180, createdAt: now, updatedAt: now },
    { id: 'm6', name: 'Arjun Mehta', role: 'Finance', designation: 'Finance Manager', email: 'arjun@hintonn.com', initials: 'AM', color: '#D97706', activeTasks: 2, completedTasks: 5, hoursLogged: 140, createdAt: now, updatedAt: now },
    { id: 'm7', name: 'Sneha Patil', role: 'PMO', designation: 'Quality & Compliance Lead', email: 'sneha@hintonn.com', initials: 'SP', color: '#EC4899', activeTasks: 2, completedTasks: 9, hoursLogged: 260, createdAt: now, updatedAt: now },
  ];

  // ═══════════════════════════════════════════════
  // 2. PROJECTS
  // ═══════════════════════════════════════════════
  const projects = [
    {
      id: 'p1', name: 'Mumbai Metro Line 3 — Elevated Section', description: 'Construction of 12.4 km elevated viaduct for Metro Line 3 corridor including 8 elevated stations. PMC contract with MMRDA.', type: 'Infrastructure',
      status: 'active', priority: 'high', progress: 62, startDate: '2025-06-01', endDate: '2027-03-31',
      memberIds: ['m2', 'm3', 'm4', 'm5'], taskIds: [], milestoneIds: [], issueIds: [],
      tags: ['metro', 'infrastructure', 'government', 'mumbai'], healthScore: 71, completionPercent: 62,
      createdAt: now, updatedAt: now
    },
    {
      id: 'p2', name: 'Pune IT Park — Phase 2 Expansion', description: 'Design-build of 2,80,000 sq ft commercial IT park campus with 3 towers, green building certification, and smart infrastructure.', type: 'Commercial',
      status: 'active', priority: 'high', progress: 45, startDate: '2025-09-15', endDate: '2027-06-30',
      memberIds: ['m2', 'm3', 'm7'], taskIds: [], milestoneIds: [], issueIds: [],
      tags: ['commercial', 'it-park', 'green-building', 'pune'], healthScore: 68, completionPercent: 45,
      createdAt: now, updatedAt: now
    },
    {
      id: 'p3', name: 'Nagpur Smart City — Water Supply Network', description: 'Underground water distribution network across 4 zones with SCADA integration, metering, and real-time monitoring.', type: 'Infrastructure',
      status: 'active', priority: 'medium', progress: 78, startDate: '2025-01-10', endDate: '2026-12-31',
      memberIds: ['m3', 'm4', 'm5', 'm7'], taskIds: [], milestoneIds: [], issueIds: [],
      tags: ['smart-city', 'water', 'nagpur', 'government'], healthScore: 82, completionPercent: 78,
      createdAt: now, updatedAt: now
    },
    {
      id: 'p4', name: 'Hintonn AI — PMO Platform Development', description: 'Internal SaaS product development — full-stack PMO platform with AI copilot, real-time collaboration, and enterprise RBAC.', type: 'Software',
      status: 'active', priority: 'critical', progress: 55, startDate: '2025-04-01', endDate: '2026-12-15',
      memberIds: ['m2', 'm3', 'm4'], taskIds: [], milestoneIds: [], issueIds: [],
      tags: ['software', 'ai', 'saas', 'internal'], healthScore: 65, completionPercent: 55,
      createdAt: now, updatedAt: now
    },
    {
      id: 'p5', name: 'Ahmedabad Railway Station Redevelopment', description: 'Heritage-sensitive redevelopment of Ahmedabad Junction — modern terminal with heritage facade retention.', type: 'Infrastructure',
      status: 'planning', priority: 'medium', progress: 12, startDate: '2026-01-15', endDate: '2028-06-30',
      memberIds: ['m2', 'm5'], taskIds: [], milestoneIds: [], issueIds: [],
      tags: ['railway', 'heritage', 'ahmedabad', 'government'], healthScore: 45, completionPercent: 12,
      createdAt: now, updatedAt: now
    },
    {
      id: 'p6', name: 'Thane Creek Bridge — Structural Audit', description: 'Structural health assessment and load rating of the existing Thane Creek Bridge with seismic analysis.', type: 'Consulting',
      status: 'completed', priority: 'low', progress: 100, startDate: '2025-03-01', endDate: '2025-11-30',
      memberIds: ['m3', 'm7'], taskIds: [], milestoneIds: [], issueIds: [],
      tags: ['bridge', 'audit', 'structural', 'thane'], healthScore: 95, completionPercent: 100,
      createdAt: now, updatedAt: now
    },
  ];

  // ═══════════════════════════════════════════════
  // 3. TASKS
  // ═══════════════════════════════════════════════
  const tasks = [
    // --- Mumbai Metro ---
    { id: 't1', projectId: 'p1', title: 'Station Dwg 30% Review', description: 'Review 30% station structural drawings for 4 elevated stations.', isPersonal: false, completed: false, status: 'in-progress', priority: 'high', assigneeId: 'm4', assigneeIds: ['m4'], creatorId: 'm2', createdBy: 'Preet Hintonn', subtasks: [{id:'st1',title:'Structural Dwg',completed:true},{id:'st2',title:'Architectural Dwg',completed:false}], startDate: '2026-09-01', dueDate: '2026-10-15', tags: ['engineering', 'review'], order: 0, createdAt: now, updatedAt: now },
    { id: 't2', projectId: 'p1', title: 'Piling Progress — Pier P42-P58', description: 'Drive bored piles from Pier P42 to P58 section. 32 piles pending.', isPersonal: false, completed: false, status: 'in-progress', priority: 'critical', assigneeId: 'm5', assigneeIds: ['m5'], creatorId: 'm3', createdBy: 'Mohit Jain', subtasks: [], startDate: '2026-09-10', dueDate: '2026-10-30', tags: ['piling', 'critical-path'], order: 1, createdAt: now, updatedAt: now },
    { id: 't3', projectId: 'p1', title: 'Monthly Progress Report — Sep', description: 'Compile September monthly progress report for MMRDA review meeting.', isPersonal: false, completed: false, status: 'todo', priority: 'medium', assigneeId: 'm4', assigneeIds: ['m4'], creatorId: 'm2', createdBy: 'Preet Hintonn', subtasks: [{id:'st3',title:'Civil Progress',completed:false},{id:'st4',title:'Financial Summary',completed:false}], startDate: '2026-09-25', dueDate: '2026-10-05', tags: ['report', 'monthly'], order: 2, createdAt: now, updatedAt: now },
    { id: 't4', projectId: 'p1', title: 'Elevation Survey — Station 5-8', description: 'Topographical survey for elevated corridor between Station 5 to Station 8 alignment.', isPersonal: false, completed: true, status: 'done', priority: 'medium', assigneeId: 'm5', assigneeIds: ['m5'], creatorId: 'm3', createdBy: 'Mohit Jain', subtasks: [{id:'st5',title:'Field Survey',completed:true},{id:'st6',title:'Data Processing',completed:true}], startDate: '2026-08-01', dueDate: '2026-09-10', tags: ['survey'], order: 3, createdAt: now, updatedAt: now },

    // --- Pune IT Park ---
    { id: 't5', projectId: 'p2', title: 'Tower B — Foundation RCC', description: 'Reinforced concrete foundation works for Tower B — 3 basement levels.', isPersonal: false, completed: false, status: 'in-progress', priority: 'high', assigneeId: 'm5', assigneeIds: ['m5'], creatorId: 'm2', createdBy: 'Preet Hintonn', subtasks: [{id:'st7',title:'PCC',completed:true},{id:'st8',title:'RCC Mat',completed:false}], startDate: '2026-09-05', dueDate: '2026-11-15', tags: ['rcc', 'foundation'], order: 0, createdAt: now, updatedAt: now },
    { id: 't6', projectId: 'p2', title: 'GRIHA Certification Docs', description: 'Compile GRIHA 5-star green building certification documentation.', isPersonal: false, completed: false, status: 'todo', priority: 'medium', assigneeId: 'm7', assigneeIds: ['m7'], creatorId: 'm3', createdBy: 'Mohit Jain', subtasks: [], startDate: '2026-10-01', dueDate: '2026-12-31', tags: ['green', 'griha', 'certification'], order: 1, createdAt: now, updatedAt: now },
    { id: 't7', projectId: 'p2', title: 'MEP Coordination Meeting', description: 'Resolve clashes between structural and MEP services in Tower A basement.', isPersonal: false, completed: false, status: 'todo', priority: 'high', assigneeId: 'm4', assigneeIds: ['m4'], creatorId: 'm2', createdBy: 'Preet Hintonn', subtasks: [], startDate: '2026-09-28', dueDate: '2026-10-02', tags: ['mep', 'coordination'], order: 2, createdAt: now, updatedAt: now },

    // --- Nagpur Water ---
    { id: 't8', projectId: 'p3', title: 'Zone 3 — Pipe Laying 80%', description: 'Complete HDPE pipe laying for Zone 3 distribution network.', isPersonal: false, completed: false, status: 'in-progress', priority: 'high', assigneeId: 'm5', assigneeIds: ['m5'], creatorId: 'm3', createdBy: 'Mohit Jain', subtasks: [{id:'st9',title:'Pipe Supply',completed:true},{id:'st10',title:'Trenching',completed:true},{id:'st11',title:'Pipe Laying',completed:false},{id:'st12',title:'Backfill',completed:false}], startDate: '2026-08-15', dueDate: '2026-10-31', tags: ['pipe', 'zone-3'], order: 0, createdAt: now, updatedAt: now },
    { id: 't9', projectId: 'p3', title: 'SCADA Integration Testing', description: 'End-to-end SCADA integration test for Zone 1 and Zone 2 meters.', isPersonal: false, completed: true, status: 'done', priority: 'high', assigneeId: 'm7', assigneeIds: ['m7'], creatorId: 'm3', createdBy: 'Mohit Jain', subtasks: [{id:'st13',title:'Hardware Setup',completed:true},{id:'st14',title:'Software Config',completed:true},{id:'st15',title:'Integration Test',completed:true}], startDate: '2026-07-01', dueDate: '2026-09-15', tags: ['scada', 'testing'], order: 1, createdAt: now, updatedAt: now },

    // --- Hintonn PMO ---
    { id: 't10', projectId: 'p4', title: 'Firebase Backend — Seed Data', description: 'Populate Firestore with realistic EPC/PMO seed data across all 15 collections.', isPersonal: false, completed: false, status: 'todo', priority: 'high', assigneeId: 'm3', assigneeIds: ['m3'], creatorId: 'm3', createdBy: 'Mohit Jain', subtasks: [{id:'st16',title:'Define schemas',completed:true},{id:'st17',title:'Write seed script',completed:false}], startDate: '2026-09-28', dueDate: '2026-09-30', tags: ['firebase', 'backend', 'seed'], order: 0, createdAt: now, updatedAt: now },
    { id: 't11', projectId: 'p4', title: 'Dashboard Screen — Real-time KPIs', description: 'Wire dashboard KPI cards to live Firestore data with onSnapshot.', isPersonal: false, completed: false, status: 'in-progress', priority: 'critical', assigneeId: 'm3', assigneeIds: ['m3'], creatorId: 'm3', createdBy: 'Mohit Jain', subtasks: [{id:'st18',title:'KPI queries',completed:true},{id:'st19',title:'Chart rendering',completed:false}], startDate: '2026-09-20', dueDate: '2026-10-10', tags: ['dashboard', 'realtime'], order: 1, createdAt: now, updatedAt: now },
    { id: 't12', projectId: 'p4', title: 'RBAC — Role Permissions Matrix', description: 'Define and implement granular role-based access control for all 6 roles.', isPersonal: false, completed: true, status: 'done', priority: 'high', assigneeId: 'm4', assigneeIds: ['m4'], creatorId: 'm3', createdBy: 'Mohit Jain', subtasks: [{id:'st20',title:'Matrix Design',completed:true},{id:'st21',title:'Implementation',completed:true},{id:'st22',title:'Testing',completed:true}], startDate: '2026-08-01', dueDate: '2026-09-01', tags: ['rbac', 'auth'], order: 2, createdAt: now, updatedAt: now },

    // --- Ahmedabad ---
    { id: 't13', projectId: 'p5', title: 'Heritage Assessment Report', description: 'Prepare heritage impact assessment for the existing station facade.', isPersonal: false, completed: false, status: 'todo', priority: 'medium', assigneeId: 'm7', assigneeIds: ['m7'], creatorId: 'm2', createdBy: 'Preet Hintonn', subtasks: [], startDate: '2026-10-01', dueDate: '2026-12-15', tags: ['heritage', 'assessment'], order: 0, createdAt: now, updatedAt: now },

    // --- Thane Bridge (completed) ---
    { id: 't14', projectId: 'p6', title: 'Load Rating Calculation', description: 'Complete load rating per IRC standards for all 14 spans.', isPersonal: false, completed: true, status: 'done', priority: 'medium', assigneeId: 'm3', assigneeIds: ['m3'], creatorId: 'm3', createdBy: 'Mohit Jain', subtasks: [{id:'st23',title:'Span 1-7',completed:true},{id:'st24',title:'Span 8-14',completed:true}], startDate: '2025-08-01', dueDate: '2025-10-15', tags: ['load-rating', 'structural'], order: 0, createdAt: now, updatedAt: now },
    { id: 't15', projectId: 'p6', title: 'Final Audit Report Submission', description: 'Submit comprehensive structural audit report to Maharashtra PWD.', isPersonal: false, completed: true, status: 'done', priority: 'high', assigneeId: 'm3', assigneeIds: ['m3'], creatorId: 'm3', createdBy: 'Mohit Jain', subtasks: [{id:'st25',title:'Draft',completed:true},{id:'st26',title:'Review',completed:true},{id:'st27',title:'Submit',completed:true}], startDate: '2025-10-15', dueDate: '2025-11-30', tags: ['audit', 'final'], order: 1, createdAt: now, updatedAt: now },
  ];

  // Link taskIds to projects
  const taskIdsByProject = {};
  tasks.forEach(t => {
    if (!taskIdsByProject[t.projectId]) taskIdsByProject[t.projectId] = [];
    taskIdsByProject[t.projectId].push(t.id);
  });
  for (const [pid, tids] of Object.entries(taskIdsByProject)) {
    const proj = projects.find(p => p.id === pid);
    if (proj) proj.taskIds = tids;
  }

  // ═══════════════════════════════════════════════
  // 4. MILESTONES
  // ═══════════════════════════════════════════════
  const milestones = [
    { id: 'ms1', projectId: 'p1', name: 'Piling Completion — Section A', dueDate: '2026-12-31', status: 'in-progress', taskIds: ['t2'], description: 'Complete all piling for Section A (P42-P58)', createdAt: now },
    { id: 'ms2', projectId: 'p1', name: 'Station Structural — 60%', dueDate: '2027-02-28', status: 'pending', taskIds: ['t1'], description: 'Reach 60% structural completion on all 8 stations', createdAt: now },
    { id: 'ms3', projectId: 'p1', name: 'Viaduct Launch — 50%', dueDate: '2027-01-31', status: 'pending', taskIds: [], description: 'Launch girder for 50% of the elevated corridor', createdAt: now },
    { id: 'ms4', projectId: 'p2', name: 'Tower A — Topping Out', dueDate: '2026-11-30', status: 'in-progress', taskIds: ['t5'], description: 'Complete structural framework for Tower A', createdAt: now },
    { id: 'ms5', projectId: 'p2', name: 'GRIHA Submission', dueDate: '2027-01-15', status: 'pending', taskIds: ['t6'], description: 'Submit GRIHA 5-star certification application', createdAt: now },
    { id: 'ms6', projectId: 'p3', name: 'Zone 3 — Complete Laying', dueDate: '2026-10-31', status: 'in-progress', taskIds: ['t8'], description: 'Finish HDPE pipe laying for Zone 3', createdAt: now },
    { id: 'ms7', projectId: 'p3', name: 'SCADA Go-Live', dueDate: '2026-11-15', status: 'completed', taskIds: ['t9'], description: 'Full SCADA system operational across Zone 1-2', createdAt: now },
    { id: 'ms8', projectId: 'p4', name: 'MVP Launch', dueDate: '2026-12-15', status: 'in-progress', taskIds: ['t10', 't11'], description: 'Ship MVP of Hintonn PMO platform', createdAt: now },
    { id: 'ms9', projectId: 'p5', name: 'Heritage Approval', dueDate: '2027-03-31', status: 'pending', taskIds: ['t13'], description: 'Obtain heritage committee approval for redevelopment', createdAt: now },
    { id: 'ms10', projectId: 'p6', name: 'Report Submitted', dueDate: '2025-11-30', status: 'completed', taskIds: ['t15'], description: 'Final audit report submitted to PWD', createdAt: now },
  ];

  // Link milestoneIds to projects
  const msIdsByProject = {};
  milestones.forEach(m => {
    if (!msIdsByProject[m.projectId]) msIdsByProject[m.projectId] = [];
    msIdsByProject[m.projectId].push(m.id);
  });
  for (const [pid, mids] of Object.entries(msIdsByProject)) {
    const proj = projects.find(p => p.id === pid);
    if (proj) proj.milestoneIds = mids;
  }

  // ═══════════════════════════════════════════════
  // 5. ISSUES
  // ═══════════════════════════════════════════════
  const issues = [
    { id: 'i1', projectId: 'p1', title: 'Pile P48 — Rebar Corrosion Detected', description: 'Rebar corrosion observed in bored pile P48 during integrity testing. Requires remedial action.', status: 'open', priority: 'high', assigneeId: 'm5', createdAt: now, updatedAt: now },
    { id: 'i2', projectId: 'p1', title: 'Land Acquisition Delay — Zone 2', description: 'MMRDA land acquisition for Zone 2 alignment behind schedule by 4 weeks.', status: 'open', priority: 'critical', assigneeId: 'm2', createdAt: now, updatedAt: now },
    { id: 'i3', projectId: 'p2', title: 'MEP Clash — Basement Level B2', description: 'Major clash between fire services duct and structural beam at B2 level — Tower A.', status: 'open', priority: 'high', assigneeId: 'm4', createdAt: now, updatedAt: now },
    { id: 'i4', projectId: 'p2', title: 'Concrete Mix Design — Deviation', description: 'M30 concrete cubes from Batch 47 showing 5% lower strength than design mix.', status: 'in-progress', priority: 'medium', assigneeId: 'm7', createdAt: now, updatedAt: now },
    { id: 'i5', projectId: 'p3', title: 'SCADA Signal Loss — Meter M-142', description: 'Intermittent SCADA signal loss from pressure transmitter M-142 in Zone 2.', status: 'resolved', priority: 'medium', assigneeId: 'm7', createdAt: now, updatedAt: now },
    { id: 'i6', projectId: 'p4', title: 'Firebase Auth — Popup Blocker Issue', description: 'Google sign-in popup blocked on Safari and Firefox — needs redirect fallback.', status: 'open', priority: 'high', assigneeId: 'm3', createdAt: now, updatedAt: now },
  ];

  // Link issueIds to projects
  const issueIdsByProject = {};
  issues.forEach(i => {
    if (!issueIdsByProject[i.projectId]) issueIdsByProject[i.projectId] = [];
    issueIdsByProject[i.projectId].push(i.id);
  });
  for (const [pid, iids] of Object.entries(issueIdsByProject)) {
    const proj = projects.find(p => p.id === pid);
    if (proj) proj.issueIds = iids;
  }

  // ═══════════════════════════════════════════════
  // 6. COMPANIES
  // ═══════════════════════════════════════════════
  const companies = [
    { id: 'c1', name: 'MMRDA (Mumbai Metropolitan Region Development Authority)', contactPerson: 'Shri V. Subhash', totalContractValue: '₹142.5 Cr', activePackage: 'PMC — Elevated Section', totalBilledFormatted: '₹68,20,00,000', totalPendingFormatted: '₹74,30,00,000', paymentStatus: 'Partial', paymentStatusBadge: 'warning', billsCountText: '12 Bills', hasRevisions: false, createdAt: now, updatedAt: now },
    { id: 'c2', name: 'Pune Metropolitan Region Development Authority', contactPerson: 'Dr. Anil Kokne', totalContractValue: '₹87.2 Cr', activePackage: 'Design-Build — IT Park', totalBilledFormatted: '₹32,60,00,000', totalPendingFormatted: '₹54,60,00,000', paymentStatus: 'Pending', paymentStatusBadge: 'error', billsCountText: '8 Bills', hasRevisions: true, createdAt: now, updatedAt: now },
    { id: 'c3', name: 'Nagpur Smart & Sustainable City Development Corporation', contactPerson: 'Shri Radhakrishnan B', totalContractValue: '₹56.8 Cr', activePackage: 'Water Supply Network', totalBilledFormatted: '₹41,20,00,000', totalPendingFormatted: '₹15,60,00,000', paymentStatus: 'On Track', paymentStatusBadge: 'success', billsCountText: '15 Bills', hasRevisions: false, createdAt: now, updatedAt: now },
    { id: 'c4', name: 'Hintonn AI (Internal)', contactPerson: 'Ayush Desai', totalContractValue: '₹8.5 Cr', activePackage: 'PMO Platform', totalBilledFormatted: '₹3,80,00,000', totalPendingFormatted: '₹4,70,00,000', paymentStatus: 'Internal', paymentStatusBadge: 'info', billsCountText: '5 Bills', hasRevisions: false, createdAt: now, updatedAt: now },
    { id: 'c5', name: 'Indian Railways — Western Zone', contactPerson: 'Shri Rajesh Agrawal', totalContractValue: '₹210 Cr', activePackage: 'Station Redevelopment', totalBilledFormatted: '₹0', totalPendingFormatted: '₹210,00,00,000', paymentStatus: 'Not Started', paymentStatusBadge: 'neutral', billsCountText: '0 Bills', hasRevisions: false, createdAt: now, updatedAt: now },
  ];

  // ═══════════════════════════════════════════════
  // 7. INVOICES
  // ═══════════════════════════════════════════════
  const invoices = [
    { id: 'inv1', billNumber: 'MMRDA/INV/2026-09/001', projectName: 'Mumbai Metro Line 3', milestone: 'Monthly Progress — September', amountDue: 12500000, amountPaid: 0, status: 'pending', dueDate: '2026-10-15', assigneeId: 'm6', createdAt: now, updatedAt: now },
    { id: 'inv2', billNumber: 'MMRDA/INV/2026-08/001', projectName: 'Mumbai Metro Line 3', milestone: 'Monthly Progress — August', amountDue: 11800000, amountPaid: 11800000, status: 'paid', dueDate: '2026-09-15', assigneeId: 'm6', createdAt: now, updatedAt: now },
    { id: 'inv3', billNumber: 'PUNE/INV/2026-09/001', projectName: 'Pune IT Park — Phase 2', milestone: 'Foundation Works — Tower B', amountDue: 8500000, amountPaid: 0, status: 'pending', dueDate: '2026-10-30', assigneeId: 'm6', createdAt: now, updatedAt: now },
    { id: 'inv4', billNumber: 'NAGPUR/INV/2026-09/001', projectName: 'Nagpur Smart City — Water Supply', milestone: 'Zone 3 — Pipe Laying 70%', amountDue: 4200000, amountPaid: 4200000, status: 'paid', dueDate: '2026-09-30', assigneeId: 'm6', createdAt: now, updatedAt: now },
    { id: 'inv5', billNumber: 'NAGPUR/INV/2026-08/001', projectName: 'Nagpur Smart City — Water Supply', milestone: 'SCADA Integration — Zone 1-2', amountDue: 3600000, amountPaid: 3600000, status: 'paid', dueDate: '2026-09-15', assigneeId: 'm6', createdAt: now, updatedAt: now },
    { id: 'inv6', billNumber: 'MMRDA/INV/2026-07/001', projectName: 'Mumbai Metro Line 3', milestone: 'Monthly Progress — July', amountDue: 10200000, amountPaid: 10200000, status: 'paid', dueDate: '2026-08-15', assigneeId: 'm6', createdAt: now, updatedAt: now },
  ];

  // ═══════════════════════════════════════════════
  // 8. BANK GUARANTEES
  // ═══════════════════════════════════════════════
  const bankGuarantees = [
    { id: 'bg1', ref: 'BG/MMRDA/PBG/001', projectName: 'Mumbai Metro Line 3', type: 'Performance BG', bank: 'State Bank of India', amount: 14250000, issueDate: '2025-06-01', expiryDate: '2027-06-01', status: 'active', daysLeft: 610, risk: 'safe', createdAt: now, updatedAt: now },
    { id: 'bg2', ref: 'BG/MMRDA/ABG/001', projectName: 'Mumbai Metro Line 3', type: 'Advance BG', bank: 'HDFC Bank', amount: 28500000, issueDate: '2025-06-15', expiryDate: '2026-12-15', status: 'active', daysLeft: 77, risk: 'warning', createdAt: now, updatedAt: now },
    { id: 'bg3', ref: 'BG/PUNE/PBG/001', projectName: 'Pune IT Park — Phase 2', type: 'Performance BG', bank: 'ICICI Bank', amount: 8720000, issueDate: '2025-09-15', expiryDate: '2027-09-15', status: 'active', daysLeft: 716, risk: 'safe', createdAt: now, updatedAt: now },
    { id: 'bg4', ref: 'BG/NAGPUR/PBG/001', projectName: 'Nagpur Smart City', type: 'Performance BG', bank: 'Bank of Baroda', amount: 5680000, issueDate: '2025-01-10', expiryDate: '2026-06-30', status: 'expired', daysLeft: 0, risk: 'expired', createdAt: now, updatedAt: now },
    { id: 'bg5', ref: 'BG/NAGPUR/MBG/001', projectName: 'Nagpur Smart City', type: 'Retention BG', bank: 'Punjab National Bank', amount: 2840000, issueDate: '2025-07-01', expiryDate: '2027-01-01', status: 'active', daysLeft: 459, risk: 'safe', createdAt: now, updatedAt: now },
    { id: 'bg6', ref: 'BG/PUNE/ABG/001', projectName: 'Pune IT Park — Phase 2', type: 'Advance BG', bank: 'Axis Bank', amount: 17440000, issueDate: '2025-09-20', expiryDate: '2026-10-15', status: 'active', daysLeft: 16, risk: 'critical', createdAt: now, updatedAt: now },
  ];

  // ═══════════════════════════════════════════════
  // 9. DLP RECORDS — real-world, tied to actual projects (p3, p6)
  //    Retention figures cross-linked with retentionRecords (ret2, ret4)
  // ═══════════════════════════════════════════════
  const dlpRecords = [
    {
      id: 'dlp1', projectId: 'p6', projectName: 'Thane Creek Bridge — Structural Audit',
      packageCode: 'PKG-06', contractor: 'Hintonn AI Consulting',
      handoverDate: '2025-11-30', dlpDuration: '12 Months (DLP)', warrantyMonths: 12,
      dlpExpiry: '2026-11-30', openDefects: 1, closedDefects: 4, readiness: 85,
      warrantyValue: '₹4,20,000', retentionAmount: '₹2,10,000',
      handoverStatus: 'DLP Active', statusLabel: 'In Progress',
      defectClaims: [
        { id: 'dc1', description: 'Expansion joint sealant peeling at Span 6 — re-application required', severity: 'Minor', sla: '7 Days', status: 'open', raisedBy: 'Mohit Jain', raisedAt: '2026-09-12' }
      ],
      createdAt: now, updatedAt: now
    },
    {
      id: 'dlp2', projectId: 'p3', projectName: 'Nagpur Smart City — Water Supply Network',
      packageCode: 'PKG-03', contractor: 'BuildCon Infrastructure',
      handoverDate: '2026-08-15', dlpDuration: '24 Months (DLP)', warrantyMonths: 24,
      dlpExpiry: '2028-08-15', openDefects: 2, closedDefects: 1, readiness: 75,
      warrantyValue: '₹2,84,00,000', retentionAmount: '₹1,42,00,000',
      handoverStatus: 'DLP Active', statusLabel: 'In Progress',
      defectClaims: [
        { id: 'dc2', description: 'Leak at HDPE fusion joint Ch-4+350, Zone 3 — hydrostatic test failure', severity: 'Critical', sla: '24 Hours', status: 'open', raisedBy: 'Mohit Jain', raisedAt: '2026-09-18' },
        { id: 'dc3', description: 'SCADA pressure transmitter M-142 reading drift — recalibration required', severity: 'Moderate', sla: '48 Hours', status: 'open', raisedBy: 'Preet Hintonn', raisedAt: '2026-09-24' }
      ],
      createdAt: now, updatedAt: now
    },
  ];

  // ═══════════════════════════════════════════════
  // 10. RETENTION RECORDS
  // ═══════════════════════════════════════════════
  const retentionRecords = [
    { id: 'ret1', projectName: 'Mumbai Metro Line 3', projectId: 'p1', clientName: 'MMRDA', retentionPercent: 5, contractValue: 1425000000, retentionAmount: 71250000, releasedAmount: 28500000, pendingRelease: 42750000, status: 'Partial', releaseDate: '2027-06-30', remarks: '5% retention — released in 2 tranches post DLP', createdAt: now, updatedAt: now },
    { id: 'ret2', projectName: 'Nagpur Smart City — Water Supply', projectId: 'p3', clientName: 'Nagpur Smart City Corp', retentionPercent: 5, contractValue: 568000000, retentionAmount: 28400000, releasedAmount: 14200000, pendingRelease: 14200000, status: 'Partial', releaseDate: '2026-12-31', remarks: 'First tranche released on SCADA go-live', createdAt: now, updatedAt: now },
    { id: 'ret3', projectName: 'Pune IT Park — Phase 2', projectId: 'p2', clientName: 'Pune MIRADA', retentionPercent: 5, contractValue: 872000000, retentionAmount: 43600000, releasedAmount: 0, pendingRelease: 43600000, status: 'Held', releaseDate: '2027-09-30', remarks: 'No release yet — project in progress', createdAt: now, updatedAt: now },
    { id: 'ret4', projectName: 'Thane Creek Bridge Audit', projectId: 'p6', clientName: 'Maharashtra PWD', retentionPercent: 10, contractValue: 4200000, retentionAmount: 420000, releasedAmount: 420000, pendingRelease: 0, status: 'Released', releaseDate: '2026-03-31', remarks: 'Full retention released after DLP completion', createdAt: now, updatedAt: now },
  ];

  // ═══════════════════════════════════════════════
  // 11. COMMENTS
  // ═══════════════════════════════════════════════
  const comments = [
    { id: 'cm1', taskId: 't2', authorId: 'm5', text: 'Pile P44 completed — 18m depth, no refusal. Moving to P45 tomorrow.', createdAt: '2026-09-27T14:30:00.000Z' },
    { id: 'cm2', taskId: 't2', authorId: 'm3', text: 'Good progress. Please ensure P46-P48 section gets integrity testing before backfill.', createdAt: '2026-09-27T16:45:00.000Z' },
    { id: 'cm3', taskId: 't1', authorId: 'm4', text: 'Structural review at 80% — few comments from consultant pending.', createdAt: '2026-09-26T10:00:00.000Z' },
    { id: 'cm4', taskId: 't5', authorId: 'm5', text: 'PCC pour completed for Tower B foundation mat. RCC scheduled for Oct 5.', createdAt: '2026-09-25T11:20:00.000Z' },
    { id: 'cm5', taskId: 't11', authorId: 'm3', text: 'KPI cards now pull live from Firestore. Need to add chart rendering next.', createdAt: '2026-09-28T09:00:00.000Z' },
    { id: 'cm6', taskId: 't8', authorId: 'm5', text: 'Zone 3 — 75% pipe laying done. Remaining 25% should finish by Oct 20.', createdAt: '2026-09-27T08:30:00.000Z' },
  ];

  // ═══════════════════════════════════════════════
  // 12. ACTIVITIES
  // ═══════════════════════════════════════════════
  const activities = [
    { id: 'a1', type: 'project', html: '<strong>Created project</strong> Mumbai Metro Line 3 — Elevated Section', createdAt: '2026-06-01T10:00:00.000Z' },
    { id: 'a2', type: 'project', html: '<strong>Created project</strong> Pune IT Park — Phase 2 Expansion', createdAt: '2026-09-15T10:00:00.000Z' },
    { id: 'a3', type: 'task', html: 'Moved <strong>Piling Progress — Pier P42-P58</strong> to in-progress', createdAt: '2026-09-27T14:30:00.000Z' },
    { id: 'a4', type: 'invoice', html: '<strong>New Invoice</strong> — MMRDA/INV/2026-09/001 created for Mumbai Metro Line 3 (₹1,25,00,000)', createdAt: '2026-09-28T09:15:00.000Z' },
    { id: 'a5', type: 'issue', html: 'Created issue <strong>Pile P48 — Rebar Corrosion Detected</strong> in Mumbai Metro Line 3', createdAt: '2026-09-26T16:00:00.000Z' },
    { id: 'a6', type: 'bankGuarantee', html: 'Registered BG <strong>BG/PUNE/ABG/001</strong> — Pune IT Park', createdAt: '2026-09-20T11:00:00.000Z' },
    { id: 'a7', type: 'task', html: '<strong>Created personal task</strong> Firebase Backend — Seed Data', createdAt: '2026-09-28T08:00:00.000Z' },
    { id: 'a8', type: 'milestone', html: 'Updated milestone <strong>SCADA Go-Live</strong> — status changed to completed', createdAt: '2026-09-15T17:00:00.000Z' },
    { id: 'a9', type: 'member', html: 'Added team member <strong>Sneha Patil</strong> as Quality & Compliance Lead', createdAt: '2026-07-15T10:00:00.000Z' },
    { id: 'a10', type: 'project', html: '<strong>Completed project</strong> Thane Creek Bridge — Structural Audit', createdAt: '2025-11-30T18:00:00.000Z' },
  ];

  // ═══════════════════════════════════════════════
  // 13. NOTIFICATIONS
  // ═══════════════════════════════════════════════
  const notifications = [
    { id: 'n1', type: 'bankGuarantee', text: 'BG BG/PUNE/ABG/001 expires in 16 days — CRITICAL', read: false, userId: 'all', bgId: 'bg6', createdAt: '2026-09-28T09:00:00.000Z' },
    { id: 'n2', type: 'invoice', text: 'New invoice created: MMRDA/INV/2026-09/001 for Mumbai Metro Line 3 — ₹1,25,00,000', read: false, userId: 'all', invoiceId: 'inv1', createdAt: '2026-09-28T09:15:00.000Z' },
    { id: 'n3', type: 'issue', text: 'New issue: Pile P48 — Rebar Corrosion Detected', read: false, userId: 'all', createdAt: '2026-09-26T16:00:00.000Z' },
    { id: 'n4', type: 'task', text: 'Mohit Jain created task Firebase Backend — Seed Data', read: true, userId: 'all', createdAt: '2026-09-28T08:00:00.000Z' },
    { id: 'n5', type: 'project', text: 'New project created: Ahmedabad Railway Station Redevelopment', read: true, userId: 'all', createdAt: '2026-01-15T10:00:00.000Z' },
    { id: 'n6', type: 'dlpExpiry', text: 'DLP record for Thane Creek Bridge Audit expires in 761 days', read: true, userId: 'all', dlpId: 'dlp1', createdAt: '2026-09-22T09:00:00.000Z' },
    { id: 'n7', type: 'bankGuarantee', text: 'BG BG/NAGPUR/PBG/001 has expired — Action needed', read: false, userId: 'all', bgId: 'bg4', createdAt: '2026-09-20T09:00:00.000Z' },
  ];

  // ═══════════════════════════════════════════════
  // 14. SETTINGS (workspace_settings)
  // ═══════════════════════════════════════════════
  const settings = {
    workspaceName: 'Hintonn AI',
    currentUser: 'm3',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    dateFormat: 'DD-MMM-YYYY',
    language: 'en',
    theme: 'light',
    notifications: { email: true, push: true, slack: false },
    integrations: { n8n: true, firebase: true, deepgram: true, groq: true },
    notificationPrefs: {
      pushEnabled: false,
      bgExpiryAlerts: true,
      invoiceNotifications: true,
      dlpAlerts: true,
      healthScoreAlerts: true,
      taskUpdates: true,
      milestoneUpdates: true
    },
    portfolioHealthScore: 72,
    onTrackCount: 2,
    atRiskCount: 2,
    criticalCount: 0,
    totalProjects: 6,
    updatedAt: now
  };

  // ═══════════════════════════════════════════════
  // 15. USERS (auth records)
  // ═══════════════════════════════════════════════
  const users = [
    { uid: 'seed_mohit2', name: 'Mohit Jain', email: 'mohithintonn@gmail.com', photoURL: null, role: 'Admin', isActive: true, isRejected: false, provider: 'google', createdAt: ts('2025-04-01'), lastLogin: ts('2026-09-28') },
    { uid: 'seed_preet1', name: 'Preet Hintonn', email: 'preethintonn@gmail.com', photoURL: null, role: 'Project Manager', isActive: true, isRejected: false, provider: 'google', createdAt: ts('2025-06-01'), lastLogin: ts('2026-09-27') },
    { uid: 'seed_hirvi1', name: 'Hirvi Hintonn', email: 'hirvihintonn@gmail.com', photoURL: null, role: 'PMO', isActive: true, isRejected: false, provider: 'google', createdAt: ts('2025-07-01'), lastLogin: ts('2026-09-26') },
    { uid: 'seed_ayush1', name: 'Ayush Desai', email: 'ayush@hintonn.com', photoURL: null, role: 'Admin', isActive: true, isRejected: false, provider: 'password', createdAt: ts('2025-04-01'), lastLogin: ts('2026-09-20') },
  ];

  // ═══════════════════════════════════════════════
  // SEED ALL COLLECTIONS
  // ═══════════════════════════════════════════════
  console.log('\n🚀 Seeding Firestore...\n');

  await seedCollection('members', members);
  await seedCollection('projects', projects);
  await seedCollection('tasks', tasks);
  await seedCollection('milestones', milestones);
  await seedCollection('issues', issues);
  await seedCollection('companies', companies);
  await seedCollection('invoices', invoices);
  await seedCollection('bankGuarantees', bankGuarantees);
  await seedCollection('dlpRecords', dlpRecords);
  await seedCollection('retentionRecords', retentionRecords);
  await seedCollection('comments', comments);
  await seedCollection('activities', activities);
  await seedCollection('notifications', notifications);
  await seedSingleDoc('settings', 'workspace_settings', settings);
  await seedCollection('users', users);

  // Summary
  console.log('\n🎉 All 15 Firestore collections seeded successfully!');
  console.log('   Collections: members, projects, tasks, milestones, issues, companies,');
  console.log('   invoices, bankGuarantees, dlpRecords, retentionRecords, comments,');
  console.log('   activities, notifications, settings, users');
  console.log('\n📊 Data Summary:');
  console.log(`   Members:              ${members.length}`);
  console.log(`   Projects:             ${projects.length}`);
  console.log(`   Tasks:                ${tasks.length}`);
  console.log(`   Milestones:           ${milestones.length}`);
  console.log(`   Issues:               ${issues.length}`);
  console.log(`   Companies:            ${companies.length}`);
  console.log(`   Invoices:             ${invoices.length}`);
  console.log(`   Bank Guarantees:      ${bankGuarantees.length}`);
  console.log(`   DLP Records:          ${dlpRecords.length}`);
  console.log(`   Retention Records:    ${retentionRecords.length}`);
  console.log(`   Comments:             ${comments.length}`);
  console.log(`   Activities:           ${activities.length}`);
  console.log(`   Notifications:        ${notifications.length}`);
  console.log(`   Settings:             1 (workspace_settings)`);
  console.log(`   Users:                ${users.length}`);
  console.log(`   ─────────────────────────────`);
  const total = members.length + projects.length + tasks.length + milestones.length + issues.length + companies.length + invoices.length + bankGuarantees.length + dlpRecords.length + retentionRecords.length + comments.length + activities.length + notifications.length + 1 + users.length;
  console.log(`   TOTAL:                ${total} documents\n`);
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
