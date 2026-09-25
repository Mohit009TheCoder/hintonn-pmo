// ─── Hintonn PMO — Firebase Firestore Seed Script ───
// Seeds ALL 15 collections with realistic EPC/PMO data
// Usage: node firebase-seed.js

const fs = require('fs');
const path = require('path');

let admin, db, FieldValue;

async function initFirebase() {
  const mod = await import('firebase-admin');
  admin = mod.default || mod;
  const { cert } = mod;

  const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, 'service-account.json'), 'utf8'));

  admin.initializeApp({
    credential: cert(serviceAccount),
    projectId: 'hintonn-pmo'
  });

  const firestoreMod = await import('firebase-admin/firestore');
  db = firestoreMod.getFirestore();
  FieldValue = firestoreMod.FieldValue;
}

// Helper: batch write
async function seedCollection(collectionName, items) {
  const batch = db.batch();
  items.forEach(item => {
    const ref = db.collection(collectionName).doc(String(item.id));
    batch.set(ref, item);
  });
  await batch.commit();
  console.log(`  ✅ ${collectionName}: ${items.length} documents`);
}

async function seedSingleDoc(collectionName, docId, data) {
  await db.collection(collectionName).doc(docId).set(data);
  console.log(`  ✅ ${collectionName}/${docId}: 1 document`);
}

async function main() {
  await initFirebase();
  console.log('\n🔥 Hintonn PMO — Seeding Firestore (hintonn-pmo)\n');

  // ═══════════════════════════════════════════════
  // 1. MEMBERS
  // ═══════════════════════════════════════════════
  const members = [
    { id: 'm1', name: 'Ayush Desai', role: 'AI Developer', designation: 'AI Core Engineering', color: '#2563EB', email: 'ayush@hintonn.com', initials: 'AD', activeTasks: 4, completedTasks: 12, hoursLogged: 186 },
    { id: 'm2', name: 'Preet Bhavsar', role: 'AI Developer', designation: 'AI Core Engineering', color: '#7C3AED', email: 'preet@hintonn.com', initials: 'PB', activeTasks: 3, completedTasks: 9, hoursLogged: 142 },
    { id: 'm3', name: 'Mohit Jain', role: 'Admin', designation: 'Executive PMO & Lead', color: '#4F46E5', email: 'mohit@hintonn.com', initials: 'MJ', activeTasks: 0, completedTasks: 28, hoursLogged: 310 },
    { id: 'm4', name: 'Hirvi Sanghavi', role: 'AI Developer', designation: 'LoRA Research & Telemetry', color: '#1D4ED8', email: 'hirvi@hintonn.com', initials: 'HS', activeTasks: 5, completedTasks: 7, hoursLogged: 124 },
  ];
  await seedCollection('members', members);

  // ═══════════════════════════════════════════════
  // 2. PROJECTS
  // ═══════════════════════════════════════════════
  const projects = [
    {
      id: 'p1', name: 'Hintonn AI Operating System', description: 'Enterprise AI orchestration platform with autonomous agent workflows, multi-model routing, and real-time telemetry.', type: 'AI Platform', status: 'active', priority: 'high', progress: 68,
      startDate: '2026-06-01', endDate: '2026-12-31', memberIds: ['m1', 'm2', 'm3', 'm4'], taskIds: [], milestoneIds: [], issueIds: [],
      tags: ['ai', 'platform', 'core'], createdAt: '2026-06-01T09:00:00.000Z', updatedAt: '2026-09-20T14:30:00.000Z'
    },
    {
      id: 'p2', name: 'WhatsApp Business Automation', description: 'n8n-powered WhatsApp auto-reply engine with AI classification, scheduling, and Firebase-backed session management.', type: 'Automation', status: 'active', priority: 'high', progress: 45,
      startDate: '2026-07-15', endDate: '2026-11-30', memberIds: ['m1', 'm2', 'm4'], taskIds: [], milestoneIds: [], issueIds: [],
      tags: ['whatsapp', 'automation', 'n8n'], createdAt: '2026-07-15T10:00:00.000Z', updatedAt: '2026-09-18T16:45:00.000Z'
    },
    {
      id: 'p3', name: 'PMO Dashboard v2.0', description: 'Commercial EPC project management dashboard with billing, retention, BG tracking, and DLP timeline management.', type: 'Business', status: 'active', priority: 'medium', progress: 82,
      startDate: '2026-05-01', endDate: '2026-10-15', memberIds: ['m1', 'm3'], taskIds: [], milestoneIds: [], issueIds: [],
      tags: ['pmo', 'dashboard', 'epc'], createdAt: '2026-05-01T08:00:00.000Z', updatedAt: '2026-09-22T11:00:00.000Z'
    },
    {
      id: 'p4', name: 'LoRA Fine-tuning Pipeline', description: 'Automated LoRA adapter training pipeline with W&B experiment tracking, quantization (GGUF/GPTQ), and model registry.', type: 'ML/Ops', status: 'planning', priority: 'medium', progress: 15,
      startDate: '2026-09-01', endDate: '2027-02-28', memberIds: ['m2', 'm4'], taskIds: [], milestoneIds: [], issueIds: [],
      tags: ['lora', 'ml', 'training'], createdAt: '2026-09-01T09:00:00.000Z', updatedAt: '2026-09-15T10:30:00.000Z'
    },
    {
      id: 'p5', name: 'Voice AI Integration', description: 'Deepgram Nova-3 STT + Aura TTS integration with LiveKit real-time voice calling and Groq LLM inference.', type: 'AI Platform', status: 'active', priority: 'high', progress: 35,
      startDate: '2026-08-01', endDate: '2026-12-15', memberIds: ['m1', 'm4'], taskIds: [], milestoneIds: [], issueIds: [],
      tags: ['voice', 'stt', 'tts', 'livekit'], createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-09-19T15:20:00.000Z'
    }
  ];
  await seedCollection('projects', projects);

  // ═══════════════════════════════════════════════
  // 3. TASKS (comprehensive Kanban data)
  // ═══════════════════════════════════════════════
  const tasks = [
    // Project 1: Hintonn AI OS
    { id: 't1', projectId: 'p1', title: 'Implement multi-model router with fallback chains', description: 'Build a router that selects optimal LLM (Groq/OpenAI/DeepSeek) based on latency, cost, and task complexity.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-06-05', dueDate: '2026-07-15', tags: ['core', 'llm'], order: 0, createdAt: '2026-06-05T09:00:00.000Z', updatedAt: '2026-07-10T16:00:00.000Z' },
    { id: 't2', projectId: 'p1', title: 'Build agent orchestration engine', description: 'Design and implement the autonomous agent workflow engine with parallel task execution.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-06-10', dueDate: '2026-08-01', tags: ['core', 'agents'], order: 1, createdAt: '2026-06-10T09:00:00.000Z', updatedAt: '2026-07-28T14:00:00.000Z' },
    { id: 't3', projectId: 'p1', title: 'Implement real-time telemetry dashboard', description: 'Build live metrics panel showing agent activity, model usage, token counts, and latency.', status: 'in-progress', priority: 'medium', assigneeId: 'm2', startDate: '2026-08-01', dueDate: '2026-09-30', tags: ['telemetry', 'ui'], order: 2, createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-09-15T11:00:00.000Z' },
    { id: 't4', projectId: 'p1', title: 'Design persistent memory system', description: 'Implement cross-session memory with context compression and skill-based knowledge storage.', status: 'done', priority: 'high', assigneeId: 'm2', startDate: '2026-07-01', dueDate: '2026-08-15', tags: ['memory', 'core'], order: 3, createdAt: '2026-07-01T09:00:00.000Z', updatedAt: '2026-08-10T17:00:00.000Z' },
    { id: 't5', projectId: 'p1', title: 'Build plugin system with hot-reload', description: 'Allow dynamic loading/unloading of skill plugins without restart.', status: 'todo', priority: 'medium', assigneeId: 'm1', startDate: '2026-09-15', dueDate: '2026-10-31', tags: ['plugins', 'core'], order: 4, createdAt: '2026-09-15T09:00:00.000Z', updatedAt: '2026-09-15T09:00:00.000Z' },
    { id: 't6', projectId: 'p1', title: 'Implement RBAC permission matrix', description: 'Role-based access control for Admin, PM, Developer, Finance, and Contractor roles.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-06-20', dueDate: '2026-07-20', tags: ['security', 'auth'], order: 5, createdAt: '2026-06-20T09:00:00.000Z', updatedAt: '2026-07-18T15:00:00.000Z' },
    { id: 't7', projectId: 'p1', title: 'Build universal search engine', description: 'Global search with synonym mapping, entity matching, and keyboard shortcut (⌘K).', status: 'done', priority: 'medium', assigneeId: 'm2', startDate: '2026-07-10', dueDate: '2026-08-05', tags: ['search', 'ux'], order: 6, createdAt: '2026-07-10T10:00:00.000Z', updatedAt: '2026-08-03T12:00:00.000Z' },

    // Project 2: WhatsApp Automation
    { id: 't8', projectId: 'p2', title: 'Setup n8n workflow engine on VPS', description: 'Deploy n8n on Hostinger VPS with webhook endpoints and MySQL backend.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-07-15', dueDate: '2026-07-30', tags: ['n8n', 'infra'], order: 0, createdAt: '2026-07-15T10:00:00.000Z', updatedAt: '2026-07-28T16:00:00.000Z' },
    { id: 't9', projectId: 'p2', title: 'Build AI message classifier', description: 'Classify incoming WhatsApp messages into categories (inquiry, complaint, booking, spam) using Groq Llama 3.3.', status: 'in-progress', priority: 'high', assigneeId: 'm2', startDate: '2026-08-01', dueDate: '2026-09-15', tags: ['ai', 'classification'], order: 1, createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-09-10T14:00:00.000Z' },
    { id: 't10', projectId: 'p2', title: 'Implement auto-reply scheduling engine', description: 'Time-based auto-reply rules with business hours, holidays, and escalation paths.', status: 'todo', priority: 'medium', assigneeId: 'm4', startDate: '2026-09-10', dueDate: '2026-10-15', tags: ['scheduling', 'automation'], order: 2, createdAt: '2026-09-10T09:00:00.000Z', updatedAt: '2026-09-10T09:00:00.000Z' },
    { id: 't11', projectId: 'p2', title: 'Build Firebase session manager', description: 'Persistent conversation sessions in Firestore with message history and context window.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-08-05', dueDate: '2026-08-25', tags: ['firebase', 'sessions'], order: 3, createdAt: '2026-08-05T09:00:00.000Z', updatedAt: '2026-08-22T17:00:00.000Z' },
    { id: 't12', projectId: 'p2', title: 'Design WhatsApp Business API integration', description: 'Meta Cloud API integration with template messages, media handling, and read receipts.', status: 'in-progress', priority: 'high', assigneeId: 'm2', startDate: '2026-08-15', dueDate: '2026-09-30', tags: ['whatsapp', 'api'], order: 4, createdAt: '2026-08-15T10:00:00.000Z', updatedAt: '2026-09-12T11:00:00.000Z' },

    // Project 3: PMO Dashboard
    { id: 't13', projectId: 'p3', title: 'Build commercial billing module', description: 'Multi-version invoice tracking with bill revision history and company-level aggregation.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-05-05', dueDate: '2026-06-15', tags: ['billing', 'commercial'], order: 0, createdAt: '2026-05-05T09:00:00.000Z', updatedAt: '2026-06-12T16:00:00.000Z' },
    { id: 't14', projectId: 'p3', title: 'Implement bank guarantee tracker', description: 'BG registration with expiry risk monitoring (critical/warning/safe) and batch renewal workflows.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-05-20', dueDate: '2026-06-30', tags: ['bg', 'commercial'], order: 1, createdAt: '2026-05-20T09:00:00.000Z', updatedAt: '2026-06-28T14:00:00.000Z' },
    { id: 't15', projectId: 'p3', title: 'Build retention summary ledger', description: 'Retention money tracking with tranche maturity schedules and DLP release triggers.', status: 'done', priority: 'medium', assigneeId: 'm1', startDate: '2026-06-01', dueDate: '2026-07-10', tags: ['retention', 'commercial'], order: 2, createdAt: '2026-06-01T09:00:00.000Z', updatedAt: '2026-07-08T15:00:00.000Z' },
    { id: 't16', projectId: 'p3', title: 'Implement DLP timeline management', description: 'Post-handover warranty tracking with defect claims, exit audits, and countdown timers.', status: 'done', priority: 'medium', assigneeId: 'm1', startDate: '2026-06-15', dueDate: '2026-07-25', tags: ['dlp', 'commercial'], order: 3, createdAt: '2026-06-15T09:00:00.000Z', updatedAt: '2026-07-22T12:00:00.000Z' },
    { id: 't17', projectId: 'p3', title: 'Add AI copilot assistant panel', description: 'Context-aware AI assistant with project insights, risk analysis, and natural language queries.', status: 'in-progress', priority: 'high', assigneeId: 'm2', startDate: '2026-08-01', dueDate: '2026-09-30', tags: ['ai', 'assistant'], order: 4, createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-09-18T14:00:00.000Z' },
    { id: 't18', projectId: 'p3', title: 'Build executive Gantt timeline', description: 'Interactive Gantt chart with drag-resize, dependency arrows, and critical path highlighting.', status: 'done', priority: 'medium', assigneeId: 'm1', startDate: '2026-07-01', dueDate: '2026-08-10', tags: ['timeline', 'gantt'], order: 5, createdAt: '2026-07-01T09:00:00.000Z', updatedAt: '2026-08-08T16:00:00.000Z' },

    // Project 4: LoRA Pipeline
    { id: 't19', projectId: 'p4', title: 'Setup training infrastructure', description: 'Provision GPU instances, configure CUDA environment, and setup model storage.', status: 'todo', priority: 'high', assigneeId: 'm4', startDate: '2026-09-05', dueDate: '2026-09-30', tags: ['infra', 'gpu'], order: 0, createdAt: '2026-09-05T09:00:00.000Z', updatedAt: '2026-09-05T09:00:00.000Z' },
    { id: 't20', projectId: 'p4', title: 'Build dataset preparation pipeline', description: 'Automated data cleaning, formatting, and tokenization for LoRA training datasets.', status: 'in-progress', priority: 'high', assigneeId: 'm4', startDate: '2026-09-10', dueDate: '2026-10-15', tags: ['data', 'pipeline'], order: 1, createdAt: '2026-09-10T09:00:00.000Z', updatedAt: '2026-09-20T11:00:00.000Z' },
    { id: 't21', projectId: 'p4', title: 'Integrate W&B experiment tracking', description: 'Setup Weights & Biases logging for training runs, hyperparameter sweeps, and model comparisons.', status: 'todo', priority: 'medium', assigneeId: 'm2', startDate: '2026-10-01', dueDate: '2026-10-31', tags: ['wandb', 'tracking'], order: 2, createdAt: '2026-10-01T09:00:00.000Z', updatedAt: '2026-10-01T09:00:00.000Z' },

    // Project 5: Voice AI
    { id: 't22', projectId: 'p5', title: 'Integrate Deepgram Nova-3 STT', description: 'Real-time speech-to-text with streaming transcription and speaker diarization.', status: 'done', priority: 'high', assigneeId: 'm1', startDate: '2026-08-05', dueDate: '2026-08-25', tags: ['stt', 'deepgram'], order: 0, createdAt: '2026-08-05T09:00:00.000Z', updatedAt: '2026-08-22T16:00:00.000Z' },
    { id: 't23', projectId: 'p5', title: 'Integrate Deepgram Aura TTS', description: 'Natural voice synthesis with emotion control and streaming audio output.', status: 'in-progress', priority: 'high', assigneeId: 'm4', startDate: '2026-08-20', dueDate: '2026-09-20', tags: ['tts', 'deepgram'], order: 1, createdAt: '2026-08-20T09:00:00.000Z', updatedAt: '2026-09-15T14:00:00.000Z' },
    { id: 't24', projectId: 'p5', title: 'Build LiveKit voice room integration', description: 'Real-time voice calling with LiveKit Cloud, agent dispatch, and room management.', status: 'todo', priority: 'high', assigneeId: 'm1', startDate: '2026-09-15', dueDate: '2026-10-31', tags: ['livekit', 'voice'], order: 2, createdAt: '2026-09-15T09:00:00.000Z', updatedAt: '2026-09-15T09:00:00.000Z' },
    { id: 't25', projectId: 'p5', title: 'Implement Groq LLM for voice responses', description: 'Ultra-low latency inference with Groq Llama 3.3 70B for real-time voice conversations.', status: 'todo', priority: 'medium', assigneeId: 'm2', startDate: '2026-10-01', dueDate: '2026-11-15', tags: ['groq', 'llm', 'voice'], order: 3, createdAt: '2026-10-01T09:00:00.000Z', updatedAt: '2026-10-01T09:00:00.000Z' },
  ];
  await seedCollection('tasks', tasks);

  // Update project taskIds
  const taskIdsByProject = {};
  tasks.forEach(t => {
    if (!taskIdsByProject[t.projectId]) taskIdsByProject[t.projectId] = [];
    taskIdsByProject[t.projectId].push(t.id);
  });
  for (const [pid, tids] of Object.entries(taskIdsByProject)) {
    await db.collection('projects').doc(pid).update({ taskIds: tids });
  }
  console.log('  ✅ Project taskIds linked');

  // ═══════════════════════════════════════════════
  // 4. MILESTONES
  // ═══════════════════════════════════════════════
  const milestones = [
    { id: 'ms1', projectId: 'p1', name: 'Alpha Release — Core Agent Engine', dueDate: '2026-08-01', status: 'completed', taskIds: ['t1', 't2'], createdAt: '2026-06-01T09:00:00.000Z' },
    { id: 'ms2', projectId: 'p1', name: 'Beta Release — Telemetry & Memory', dueDate: '2026-10-15', status: 'in-progress', taskIds: ['t3', 't4', 't5'], createdAt: '2026-06-01T09:00:00.000Z' },
    { id: 'ms3', projectId: 'p1', name: 'GA Release — Full Platform', dueDate: '2026-12-31', status: 'pending', taskIds: [], createdAt: '2026-06-01T09:00:00.000Z' },
    { id: 'ms4', projectId: 'p2', name: 'MVP — Basic Auto-Reply', dueDate: '2026-08-30', status: 'completed', taskIds: ['t8', 't11'], createdAt: '2026-07-15T10:00:00.000Z' },
    { id: 'ms5', projectId: 'p2', name: 'v1.0 — AI Classification & Scheduling', dueDate: '2026-10-31', status: 'in-progress', taskIds: ['t9', 't10', 't12'], createdAt: '2026-07-15T10:00:00.000Z' },
    { id: 'ms6', projectId: 'p3', name: 'Commercial Modules Complete', dueDate: '2026-07-31', status: 'completed', taskIds: ['t13', 't14', 't15', 't16'], createdAt: '2026-05-01T08:00:00.000Z' },
    { id: 'ms7', projectId: 'p3', name: 'AI Copilot Integration', dueDate: '2026-09-30', status: 'in-progress', taskIds: ['t17'], createdAt: '2026-05-01T08:00:00.000Z' },
    { id: 'ms8', projectId: 'p4', name: 'Infrastructure Ready', dueDate: '2026-09-30', status: 'pending', taskIds: ['t19'], createdAt: '2026-09-01T09:00:00.000Z' },
    { id: 'ms9', projectId: 'p5', name: 'Voice Pipeline Alpha', dueDate: '2026-09-30', status: 'in-progress', taskIds: ['t22', 't23'], createdAt: '2026-08-01T10:00:00.000Z' },
  ];
  await seedCollection('milestones', milestones);

  const msIdsByProject = {};
  milestones.forEach(m => {
    if (!msIdsByProject[m.projectId]) msIdsByProject[m.projectId] = [];
    msIdsByProject[m.projectId].push(m.id);
  });
  for (const [pid, mids] of Object.entries(msIdsByProject)) {
    await db.collection('projects').doc(pid).update({ milestoneIds: mids });
  }
  console.log('  ✅ Project milestoneIds linked');

  // ═══════════════════════════════════════════════
  // 5. ISSUES
  // ═══════════════════════════════════════════════
  const issues = [
    { id: 'i1', projectId: 'p1', title: 'Memory leak in agent orchestrator after 500+ runs', description: 'Heap usage grows unbounded when agents spawn sub-agents recursively. Need to implement cleanup hooks.', status: 'open', priority: 'high', assigneeId: 'm1', createdAt: '2026-09-10T14:00:00.000Z', updatedAt: '2026-09-15T10:00:00.000Z' },
    { id: 'i2', projectId: 'p1', title: 'Context compression drops skill references', description: 'When context exceeds token limit, compressed version loses skill file paths causing reload failures.', status: 'open', priority: 'medium', assigneeId: 'm2', createdAt: '2026-09-12T11:00:00.000Z', updatedAt: '2026-09-12T11:00:00.000Z' },
    { id: 'i3', projectId: 'p2', title: 'WhatsApp webhook timeout on slow networks', description: 'Meta requires 200 response within 5s. Current processing takes 6-8s on complex AI classification.', status: 'in-progress', priority: 'high', assigneeId: 'm2', createdAt: '2026-09-08T16:00:00.000Z', updatedAt: '2026-09-14T09:00:00.000Z' },
    { id: 'i4', projectId: 'p2', title: 'Session context overflow on long conversations', description: 'Conversations > 50 messages cause context window overflow in Groq API calls.', status: 'open', priority: 'medium', assigneeId: 'm4', createdAt: '2026-09-15T10:00:00.000Z', updatedAt: '2026-09-15T10:00:00.000Z' },
    { id: 'i5', projectId: 'p3', title: 'Billing amount parsing fails for ₹1Cr+ values', description: 'Indian crore/lakh notation parsing breaks when values exceed 1 crore (7+ digits).', status: 'closed', priority: 'high', assigneeId: 'm1', createdAt: '2026-08-20T14:00:00.000Z', updatedAt: '2026-08-25T16:00:00.000Z' },
    { id: 'i6', projectId: 'p5', title: 'Deepgram streaming cuts off mid-sentence', description: 'WebSocket connection drops after ~30s of continuous streaming transcription.', status: 'open', priority: 'high', assigneeId: 'm1', createdAt: '2026-09-18T11:00:00.000Z', updatedAt: '2026-09-18T11:00:00.000Z' },
  ];
  await seedCollection('issues', issues);

  const issueIdsByProject = {};
  issues.forEach(i => {
    if (!issueIdsByProject[i.projectId]) issueIdsByProject[i.projectId] = [];
    issueIdsByProject[i.projectId].push(i.id);
  });
  for (const [pid, iids] of Object.entries(issueIdsByProject)) {
    await db.collection('projects').doc(pid).update({ issueIds: iids });
  }
  console.log('  ✅ Project issueIds linked');

  // ═══════════════════════════════════════════════
  // 6. COMPANIES
  // ═══════════════════════════════════════════════
  const companies = [
    { id: 'c1', name: 'Apex Power & Energy Corp', contactPerson: 'Rohan Verma (VP Commercial)', totalContractValue: '₹48,34,00,000', activePackage: 'PKG-01 · Core EPC Phase 1', totalBilledFormatted: '₹16,12,80,000', totalPendingFormatted: '₹6,04,80,000', paymentStatus: 'Partially Paid', paymentStatusBadge: 'badge-medium', billsCountText: '3 Bills Issued · 2 Revisions', hasRevisions: true, createdAt: '2026-01-15T09:00:00.000Z', updatedAt: '2026-09-20T14:00:00.000Z' },
    { id: 'c2', name: 'Vertex Grid Utilities Ltd', contactPerson: 'Deepak Shinde (Lead Engineer)', totalContractValue: '₹28,56,00,000', activePackage: 'PKG-02 · Substation Package', totalBilledFormatted: '₹10,58,40,000', totalPendingFormatted: '₹3,44,40,000', paymentStatus: 'Partially Paid', paymentStatusBadge: 'badge-medium', billsCountText: '2 Bills Issued · 1 Revision', hasRevisions: true, createdAt: '2026-02-01T09:00:00.000Z', updatedAt: '2026-09-18T11:00:00.000Z' },
    { id: 'c3', name: 'Northern Powertech Systems', contactPerson: 'Sunil Mehta (Procurement Head)', totalContractValue: '₹17,64,00,000', activePackage: 'PKG-03 · Utilities & Balance of Plant', totalBilledFormatted: '₹2,35,20,000', totalPendingFormatted: '₹2,35,20,000', paymentStatus: 'Pending Release', paymentStatusBadge: 'badge-review', billsCountText: '1 Active Bill', hasRevisions: false, createdAt: '2026-03-10T09:00:00.000Z', updatedAt: '2026-09-15T10:00:00.000Z' },
    { id: 'c4', name: 'Solaris Infra Concessions', contactPerson: 'Vikram Sen (Director Projects)', totalContractValue: '₹12,60,00,000', activePackage: 'PKG-04 · SCADA & Grid Automation', totalBilledFormatted: '₹8,73,60,000', totalPendingFormatted: '₹1,59,60,000', paymentStatus: 'Partially Paid', paymentStatusBadge: 'badge-medium', billsCountText: '2 Active Bills · 1 Revision', hasRevisions: true, createdAt: '2026-04-01T09:00:00.000Z', updatedAt: '2026-09-19T15:00:00.000Z' },
    { id: 'c5', name: 'Metro Rail Transmission Authority', contactPerson: 'Anand Kulkarni (General Manager)', totalContractValue: '₹11,76,00,000', activePackage: 'PKG-05 · Civil & Site Facilities', totalBilledFormatted: '₹5,46,00,000', totalPendingFormatted: '₹0', paymentStatus: 'Paid', paymentStatusBadge: 'badge-completed', billsCountText: '1 Settled Bill', hasRevisions: false, createdAt: '2026-01-20T09:00:00.000Z', updatedAt: '2026-09-10T12:00:00.000Z' },
  ];
  await seedCollection('companies', companies);

  // ═══════════════════════════════════════════════
  // 7. INVOICES
  // ═══════════════════════════════════════════════
  const invoices = [
    { id: 'inv-001', companyId: 'c1', companyName: 'Apex Power & Energy Corp', projectId: 'p1', projectName: 'Hintonn AI Operating System', milestone: 'Milestone 1 — Foundation', billNumber: 'BILL-2026-001', version: 'v1.0', isRevised: false, status: 'paid', amountDue: '₹5,37,60,000', taxAmount: '₹96,76,800', deductions: '₹26,88,000', netPayable: '₹6,07,48,800', contractValue: '₹48,34,00,000', dueDate: '2026-07-15', paidDate: '2026-07-28', versionHistory: [{ version: 'v1.0', date: '2026-06-30', baseAmount: '₹5,37,60,000', tax: '₹96,76,800', deductions: '₹26,88,000', netPayable: '₹6,07,48,800', status: 'paid' }], createdAt: '2026-06-30T09:00:00.000Z', updatedAt: '2026-07-28T14:00:00.000Z' },
    { id: 'inv-002', companyId: 'c1', companyName: 'Apex Power & Energy Corp', projectId: 'p1', projectName: 'Hintonn AI Operating System', milestone: 'Milestone 2 — Core Platform', billNumber: 'BILL-2026-002', version: 'v2.1', isRevised: true, status: 'pending-client', amountDue: '₹10,75,20,000', taxAmount: '₹1,93,53,600', deductions: '₹53,76,000', netPayable: '₹12,14,97,600', contractValue: '₹48,34,00,000', dueDate: '2026-09-30', paidDate: '', versionHistory: [{ version: 'v1.0', date: '2026-08-15', baseAmount: '₹9,66,80,000', tax: '₹1,74,02,400', deductions: '₹48,34,000', netPayable: '₹10,92,48,400', status: 'revised' }, { version: 'v2.1', date: '2026-09-01', baseAmount: '₹10,75,20,000', tax: '₹1,93,53,600', deductions: '₹53,76,000', netPayable: '₹12,14,97,600', status: 'pending-client' }], createdAt: '2026-08-15T09:00:00.000Z', updatedAt: '2026-09-01T10:00:00.000Z' },
    { id: 'inv-003', companyId: 'c2', companyName: 'Vertex Grid Utilities Ltd', projectId: 'p2', projectName: 'WhatsApp Business Automation', milestone: 'Phase 1 — API Integration', billNumber: 'BILL-2026-003', version: 'v1.0', isRevised: false, status: 'paid', amountDue: '₹5,29,20,000', taxAmount: '₹95,25,600', deductions: '₹26,46,000', netPayable: '₹5,97,99,600', contractValue: '₹28,56,00,000', dueDate: '2026-08-15', paidDate: '2026-08-30', versionHistory: [{ version: 'v1.0', date: '2026-07-31', baseAmount: '₹5,29,20,000', tax: '₹95,25,600', deductions: '₹26,46,000', netPayable: '₹5,97,99,600', status: 'paid' }], createdAt: '2026-07-31T09:00:00.000Z', updatedAt: '2026-08-30T16:00:00.000Z' },
    { id: 'inv-004', companyId: 'c2', companyName: 'Vertex Grid Utilities Ltd', projectId: 'p2', projectName: 'WhatsApp Business Automation', milestone: 'Phase 2 — AI Engine', billNumber: 'BILL-2026-004', version: 'v1.0', isRevised: false, status: 'under-certification', amountDue: '₹5,29,20,000', taxAmount: '₹95,25,600', deductions: '₹26,46,000', netPayable: '₹5,97,99,600', contractValue: '₹28,56,00,000', dueDate: '2026-10-15', paidDate: '', versionHistory: [{ version: 'v1.0', date: '2026-09-15', baseAmount: '₹5,29,20,000', tax: '₹95,25,600', deductions: '₹26,46,000', netPayable: '₹5,97,99,600', status: 'under-certification' }], createdAt: '2026-09-15T09:00:00.000Z', updatedAt: '2026-09-15T09:00:00.000Z' },
    { id: 'inv-005', companyId: 'c3', companyName: 'Northern Powertech Systems', projectId: 'p3', projectName: 'PMO Dashboard v2.0', milestone: 'Milestone 1 — Commercial Modules', billNumber: 'BILL-2026-005', version: 'v1.0', isRevised: false, status: 'pending-client', amountDue: '₹2,35,20,000', taxAmount: '₹42,33,600', deductions: '₹11,76,000', netPayable: '₹2,65,77,600', contractValue: '₹17,64,00,000', dueDate: '2026-10-30', paidDate: '', versionHistory: [{ version: 'v1.0', date: '2026-09-10', baseAmount: '₹2,35,20,000', tax: '₹42,33,600', deductions: '₹11,76,000', netPayable: '₹2,65,77,600', status: 'pending-client' }], createdAt: '2026-09-10T09:00:00.000Z', updatedAt: '2026-09-10T09:00:00.000Z' },
    { id: 'inv-006', companyId: 'c4', companyName: 'Solaris Infra Concessions', projectId: 'p4', projectName: 'LoRA Fine-tuning Pipeline', milestone: 'Phase 1 — Infrastructure', billNumber: 'BILL-2026-006', version: 'v1.0', isRevised: false, status: 'paid', amountDue: '₹4,36,80,000', taxAmount: '₹78,62,400', deductions: '₹21,84,000', netPayable: '₹4,93,58,400', contractValue: '₹12,60,00,000', dueDate: '2026-08-30', paidDate: '2026-09-12', versionHistory: [{ version: 'v1.0', date: '2026-08-15', baseAmount: '₹4,36,80,000', tax: '₹78,62,400', deductions: '₹21,84,000', netPayable: '₹4,93,58,400', status: 'paid' }], createdAt: '2026-08-15T09:00:00.000Z', updatedAt: '2026-09-12T10:00:00.000Z' },
    { id: 'inv-007', companyId: 'c4', companyName: 'Solaris Infra Concessions', projectId: 'p4', projectName: 'LoRA Fine-tuning Pipeline', milestone: 'Phase 2 — Training Pipeline', billNumber: 'BILL-2026-007', version: 'v2.0', isRevised: true, status: 'pending-client', amountDue: '₹4,36,80,000', taxAmount: '₹78,62,400', deductions: '₹21,84,000', netPayable: '₹4,93,58,400', contractValue: '₹12,60,00,000', dueDate: '2026-11-30', paidDate: '', versionHistory: [{ version: 'v1.0', date: '2026-09-20', baseAmount: '₹3,78,00,000', tax: '₹68,04,000', deductions: '₹18,90,000', netPayable: '₹4,27,14,000', status: 'revised' }, { version: 'v2.0', date: '2026-09-25', baseAmount: '₹4,36,80,000', tax: '₹78,62,400', deductions: '₹21,84,000', netPayable: '₹4,93,58,400', status: 'pending-client' }], createdAt: '2026-09-20T09:00:00.000Z', updatedAt: '2026-09-25T10:00:00.000Z' },
    { id: 'inv-008', companyId: 'c5', companyName: 'Metro Rail Transmission Authority', projectId: 'p5', projectName: 'Voice AI Integration', milestone: 'Final Settlement', billNumber: 'BILL-2026-008', version: 'v1.0', isRevised: false, status: 'paid', amountDue: '₹5,46,00,000', taxAmount: '₹98,28,000', deductions: '₹27,30,000', netPayable: '₹6,16,98,000', contractValue: '₹11,76,00,000', dueDate: '2026-07-15', paidDate: '2026-07-20', versionHistory: [{ version: 'v1.0', date: '2026-06-30', baseAmount: '₹5,46,00,000', tax: '₹98,28,000', deductions: '₹27,30,000', netPayable: '₹6,16,98,000', status: 'paid' }], createdAt: '2026-06-30T09:00:00.000Z', updatedAt: '2026-07-20T14:00:00.000Z' },
  ];
  await seedCollection('invoices', invoices);

  // ═══════════════════════════════════════════════
  // 8. BANK GUARANTEES
  // ═══════════════════════════════════════════════
  const bankGuarantees = [
    { id: 'bg1', ref: 'BG-2026-001', type: 'Performance BG (PBG)', projectId: 'p1', projectName: 'Hintonn AI Operating System', companyName: 'Apex Power & Energy Corp', amount: '₹4,83,40,000', issuedDate: '2026-01-20', expiryDate: '2026-10-20', daysLeft: 25, status: 'active', risk: 'critical', issuingBank: 'State Bank of India', beneficiary: 'Apex Power & Energy Corp', createdAt: '2026-01-20T09:00:00.000Z', updatedAt: '2026-09-25T10:00:00.000Z' },
    { id: 'bg2', ref: 'BG-2026-002', type: 'Advance Payment BG (ABG)', projectId: 'p2', projectName: 'WhatsApp Business Automation', companyName: 'Vertex Grid Utilities Ltd', amount: '₹2,85,60,000', issuedDate: '2026-03-15', expiryDate: '2026-12-15', daysLeft: 81, status: 'active', risk: 'safe', issuingBank: 'HDFC Bank', beneficiary: 'Vertex Grid Utilities Ltd', createdAt: '2026-03-15T09:00:00.000Z', updatedAt: '2026-09-25T10:00:00.000Z' },
    { id: 'bg3', ref: 'BG-2026-003', type: 'Performance BG (PBG)', projectId: 'p3', projectName: 'PMO Dashboard v2.0', companyName: 'Northern Powertech Systems', amount: '₹1,76,40,000', issuedDate: '2026-04-10', expiryDate: '2026-11-10', daysLeft: 46, status: 'active', risk: 'warning', issuingBank: 'ICICI Bank', beneficiary: 'Northern Powertech Systems', createdAt: '2026-04-10T09:00:00.000Z', updatedAt: '2026-09-25T10:00:00.000Z' },
    { id: 'bg4', ref: 'BG-2026-004', type: 'Mobilization BG (MBG)', projectId: 'p4', projectName: 'LoRA Fine-tuning Pipeline', companyName: 'Solaris Infra Concessions', amount: '₹1,26,00,000', issuedDate: '2026-05-01', expiryDate: '2026-11-01', daysLeft: 37, status: 'active', risk: 'warning', issuingBank: 'Axis Bank', beneficiary: 'Solaris Infra Concessions', createdAt: '2026-05-01T09:00:00.000Z', updatedAt: '2026-09-25T10:00:00.000Z' },
    { id: 'bg5', ref: 'BG-2026-005', type: 'Defects Liability BG (DLP)', projectId: 'p5', projectName: 'Voice AI Integration', companyName: 'Metro Rail Transmission Authority', amount: '₹1,17,60,000', issuedDate: '2026-02-01', expiryDate: '2026-08-01', daysLeft: 0, status: 'released', risk: 'safe', issuingBank: 'Punjab National Bank', beneficiary: 'Metro Rail Transmission Authority', createdAt: '2026-02-01T09:00:00.000Z', updatedAt: '2026-08-01T09:00:00.000Z' },
  ];
  await seedCollection('bankGuarantees', bankGuarantees);

  // ═══════════════════════════════════════════════
  // 9. DLP RECORDS
  // ═══════════════════════════════════════════════
  const dlpRecords = [
    { id: 'dlp1', projectId: 'p1', projectName: 'Hintonn AI Operating System', packageCode: 'PKG-01', companyName: 'Apex Power & Energy Corp', handoverDate: '2026-06-30', dlpStartDate: '2026-07-01', dlpExpiry: '2027-06-30', dlpPeriod: '12 months', countdownDays: 278, readiness: 65, warrantyValue: '₹4,83,40,000', openDefects: 3, resolvedDefects: 7, statusLabel: 'In Progress', lastInspection: '2026-09-15', nextInspection: '2026-12-15', createdAt: '2026-07-01T09:00:00.000Z', updatedAt: '2026-09-20T10:00:00.000Z' },
    { id: 'dlp2', projectId: 'p5', projectName: 'Voice AI Integration', packageCode: 'PKG-05', companyName: 'Metro Rail Transmission Authority', handoverDate: '2026-05-15', dlpStartDate: '2026-05-16', dlpExpiry: '2026-11-15', dlpPeriod: '6 months', countdownDays: 51, readiness: 92, warrantyValue: '₹1,17,60,000', openDefects: 1, resolvedDefects: 11, statusLabel: 'Exit Pending', lastInspection: '2026-09-01', nextInspection: '2026-10-15', createdAt: '2026-05-16T09:00:00.000Z', updatedAt: '2026-09-20T10:00:00.000Z' },
    { id: 'dlp3', projectId: 'p3', projectName: 'PMO Dashboard v2.0', packageCode: 'PKG-03', companyName: 'Northern Powertech Systems', handoverDate: '2026-08-01', dlpStartDate: '2026-08-02', dlpExpiry: '2027-08-01', dlpPeriod: '12 months', countdownDays: 310, readiness: 40, warrantyValue: '₹1,76,40,000', openDefects: 5, resolvedDefects: 3, statusLabel: 'Active Monitoring', lastInspection: '2026-09-10', nextInspection: '2026-12-10', createdAt: '2026-08-02T09:00:00.000Z', updatedAt: '2026-09-20T10:00:00.000Z' },
  ];
  await seedCollection('dlpRecords', dlpRecords);

  // ═══════════════════════════════════════════════
  // 10. RETENTION RECORDS
  // ═══════════════════════════════════════════════
  const retentionRecords = [
    { id: 'ret1', projectId: 'p1', projectName: 'Hintonn AI Operating System', packageCode: 'PKG-01', companyName: 'Apex Power & Energy Corp', retentionPct: '5%', retentionHeld: '₹2,41,70,000', totalContractValue: '₹48,34,00,000', trancheNumber: 1, releaseDueDate: '2027-01-15', status: 'on-schedule', statusLabel: 'On Schedule', dlpLinked: true, createdAt: '2026-06-30T09:00:00.000Z', updatedAt: '2026-09-20T10:00:00.000Z' },
    { id: 'ret2', projectId: 'p2', projectName: 'WhatsApp Business Automation', packageCode: 'PKG-02', companyName: 'Vertex Grid Utilities Ltd', retentionPct: '5%', retentionHeld: '₹1,42,80,000', totalContractValue: '₹28,56,00,000', trancheNumber: 1, releaseDueDate: '2027-03-15', status: 'on-schedule', statusLabel: 'On Schedule', dlpLinked: true, createdAt: '2026-08-30T09:00:00.000Z', updatedAt: '2026-09-20T10:00:00.000Z' },
    { id: 'ret3', projectId: 'p3', projectName: 'PMO Dashboard v2.0', packageCode: 'PKG-03', companyName: 'Northern Powertech Systems', retentionPct: '10%', retentionHeld: '₹1,76,40,000', totalContractValue: '₹17,64,00,000', trancheNumber: 1, releaseDueDate: '2026-10-30', status: 'release-initiated', statusLabel: 'Release Initiated', dlpLinked: false, createdAt: '2026-09-10T09:00:00.000Z', updatedAt: '2026-09-25T10:00:00.000Z' },
    { id: 'ret4', projectId: 'p5', projectName: 'Voice AI Integration', packageCode: 'PKG-05', companyName: 'Metro Rail Transmission Authority', retentionPct: '5%', retentionHeld: '₹58,80,000', totalContractValue: '₹11,76,00,000', trancheNumber: 2, releaseDueDate: '2026-11-15', status: 'under-review', statusLabel: 'Under Review', dlpLinked: true, createdAt: '2026-07-20T09:00:00.000Z', updatedAt: '2026-09-20T10:00:00.000Z' },
  ];
  await seedCollection('retentionRecords', retentionRecords);

  // ═══════════════════════════════════════════════
  // 11. COMMENTS
  // ═══════════════════════════════════════════════
  const comments = [
    { id: 'cmt1', taskId: 't1', authorId: 'm1', text: 'Router now supports Groq, OpenAI, and DeepSeek with automatic fallback. Latency under 200ms for 95th percentile.', createdAt: '2026-07-08T14:00:00.000Z' },
    { id: 'cmt2', taskId: 't2', authorId: 'm1', text: 'Agent orchestrator handles up to 10 parallel sub-agents. Memory cleanup hooks added on completion.', createdAt: '2026-07-25T16:00:00.000Z' },
    { id: 'cmt3', taskId: 't3', authorId: 'm2', text: 'Telemetry panel showing real-time agent activity. Need to add token usage charts next.', createdAt: '2026-09-10T11:00:00.000Z' },
    { id: 'cmt4', taskId: 't9', authorId: 'm2', text: 'Classification accuracy at 89% on test set. Working on edge cases for mixed-language messages.', createdAt: '2026-09-05T15:00:00.000Z' },
    { id: 'cmt5', taskId: 't17', authorId: 'm2', text: 'AI copilot now understands project context. Can answer questions about tasks, milestones, and billing.', createdAt: '2026-09-15T14:00:00.000Z' },
    { id: 'cmt6', taskId: 't13', authorId: 'm1', text: 'Billing module supports multi-version invoices with full revision history. ₹ symbol rendering fixed.', createdAt: '2026-06-10T16:00:00.000Z' },
    { id: 'cmt7', taskId: 't22', authorId: 'm1', text: 'Nova-3 streaming transcription working well. Average latency 180ms. Speaker diarization needs tuning.', createdAt: '2026-08-20T16:00:00.000Z' },
    { id: 'cmt8', taskId: 't20', authorId: 'm4', text: 'Dataset pipeline handles JSONL, CSV, and Parquet formats. Auto-cleaning removes duplicates and malformed entries.', createdAt: '2026-09-18T11:00:00.000Z' },
  ];
  await seedCollection('comments', comments);

  // ═══════════════════════════════════════════════
  // 12. ACTIVITIES
  // ═══════════════════════════════════════════════
  const activities = [
    { id: 'act1', type: 'task', html: 'Moved <strong>Implement multi-model router</strong> to done', createdAt: '2026-07-10T16:00:00.000Z' },
    { id: 'act2', type: 'task', html: 'Moved <strong>Build agent orchestration engine</strong> to done', createdAt: '2026-07-28T14:00:00.000Z' },
    { id: 'act3', type: 'milestone', html: 'Completed milestone <strong>Alpha Release — Core Agent Engine</strong>', createdAt: '2026-08-01T09:00:00.000Z' },
    { id: 'act4', type: 'project', html: 'Created project <strong>LoRA Fine-tuning Pipeline</strong>', createdAt: '2026-09-01T09:00:00.000Z' },
    { id: 'act5', type: 'invoice', html: 'Created invoice <strong>BILL-2026-005</strong> for PMO Dashboard v2.0', createdAt: '2026-09-10T09:00:00.000Z' },
    { id: 'act6', type: 'issue', html: 'Created issue <strong>Memory leak in agent orchestrator</strong> in Hintonn AI OS', createdAt: '2026-09-10T14:00:00.000Z' },
    { id: 'act7', type: 'task', html: 'Created task <strong>Build LiveKit voice room integration</strong> in Voice AI', createdAt: '2026-09-15T09:00:00.000Z' },
    { id: 'act8', type: 'bankGuarantee', html: 'Registered BG <strong>BG-2026-004</strong> — LoRA Fine-tuning Pipeline', createdAt: '2026-05-01T09:00:00.000Z' },
    { id: 'act9', type: 'retentionRecord', html: 'Created retention record for <strong>Voice AI Integration</strong>', createdAt: '2026-07-20T09:00:00.000Z' },
    { id: 'act10', type: 'dlpRecord', html: 'Created DLP record for <strong>PMO Dashboard v2.0</strong>', createdAt: '2026-08-02T09:00:00.000Z' },
  ];
  await seedCollection('activities', activities);

  // ═══════════════════════════════════════════════
  // 13. NOTIFICATIONS
  // ═══════════════════════════════════════════════
  const notifications = [
    { id: 'n1', type: 'task', text: 'Task "Implement real-time telemetry dashboard" assigned to Preet moved to in-progress', read: false, createdAt: '2026-09-20T14:00:00.000Z' },
    { id: 'n2', type: 'issue', text: 'New issue: Memory leak in agent orchestrator after 500+ runs', read: false, createdAt: '2026-09-10T14:00:00.000Z' },
    { id: 'n3', type: 'invoice', text: 'Invoice BILL-2026-007 revised to v2.0 for Solaris Infra Concessions', read: false, createdAt: '2026-09-25T10:00:00.000Z' },
    { id: 'n4', type: 'project', text: 'New project created: LoRA Fine-tuning Pipeline', read: true, createdAt: '2026-09-01T09:00:00.000Z' },
    { id: 'n5', type: 'bankGuarantee', text: 'BG-2026-001 expiry in 25 days — Action needed (Critical)', read: false, createdAt: '2026-09-25T08:00:00.000Z' },
    { id: 'n6', type: 'task', text: 'Task "Build dataset preparation pipeline" assigned to Hirvi is in-progress', read: true, createdAt: '2026-09-20T11:00:00.000Z' },
    { id: 'n7', type: 'milestone', text: 'Milestone "MVP — Basic Auto-Reply" completed in WhatsApp Automation', read: true, createdAt: '2026-08-30T16:00:00.000Z' },
  ];
  await seedCollection('notifications', notifications);

  // ═══════════════════════════════════════════════
  // 14. SETTINGS
  // ═══════════════════════════════════════════════
  await seedSingleDoc('settings', 'workspace_settings', {
    workspaceName: 'Hintonn AI',
    currentUser: 'm3',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    dateFormat: 'DD-MMM-YYYY',
    language: 'en',
    theme: 'light',
    notifications: { email: true, push: true, slack: false },
    integrations: { n8n: true, firebase: true, deepgram: true, groq: true },
    updatedAt: new Date().toISOString()
  });

  // ═══════════════════════════════════════════════
  // 15. USERS (auth records)
  // ═══════════════════════════════════════════════
  const users = [
    { uid: 'seed_mohit', name: 'Mohit Jain', email: 'mohithintonn@gmail.com', photoURL: null, role: 'Admin', isActive: true, provider: 'google', createdAt: FieldValue.serverTimestamp(), lastLogin: FieldValue.serverTimestamp() },
    { uid: 'seed_ayush', name: 'Ayush Desai', email: 'ayushhintonn@gmail.com', photoURL: null, role: 'AI Developer', isActive: true, provider: 'google', createdAt: FieldValue.serverTimestamp(), lastLogin: FieldValue.serverTimestamp() },
    { uid: 'seed_preet', name: 'Preet Bhavsar', email: 'preethintonn@gmail.com', photoURL: null, role: 'AI Developer', isActive: true, provider: 'google', createdAt: FieldValue.serverTimestamp(), lastLogin: FieldValue.serverTimestamp() },
    { uid: 'seed_hirvi', name: 'Hirvi Sanghavi', email: 'hirvihintonn@gmail.com', photoURL: null, role: 'AI Developer', isActive: true, provider: 'google', createdAt: FieldValue.serverTimestamp(), lastLogin: FieldValue.serverTimestamp() },
  ];
  await seedCollection('users', users);

  console.log('\n🎉 All 15 Firestore collections seeded successfully!');
  console.log('   Collections: members, projects, tasks, milestones, issues, companies, invoices, bankGuarantees, dlpRecords, retentionRecords, comments, activities, notifications, settings, users\n');
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});