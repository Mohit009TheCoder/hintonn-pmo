<div align="center">

# 🏗️ HINTONN PMO

### Enterprise Project Management Office Platform

**Built by [Hintonn AI](https://hintonn.com) · NeLabs**

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

*A full-stack, real-time project management platform with AI copilot, commercial billing, bank guarantee tracking, and enterprise-grade access control — powered by Firebase Cloud Firestore.*

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Screens](#-screens)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Authentication & Access Control](#-authentication--access-control)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core PMO
| Feature | Description |
|---------|-------------|
| **Executive Dashboard** | Real-time KPIs, project health, overdue alerts, team workload overview |
| **Project Management** | Full project lifecycle — planning, active, completed with progress tracking |
| **Kanban Task Board** | Drag-and-drop tasks with priority, status pipeline (Todo → In Progress → Review → Done) |
| **Timeline & Gantt** | Executive timeline view with milestone tracking |
| **Calendar** | Schedule view with deadline visualization |
| **Issues Tracker** | Issue reporting, assignment, and resolution tracking |
| **Milestones** | Project milestone management with due dates and completion tracking |
| **Team & Workload** | Member profiles, workload distribution, per-project task breakdown |

### Commercial & Financial
| Feature | Description |
|---------|-------------|
| **Billing & Invoices** | Invoice management with project-linked billing |
| **Bank Guarantees (BG)** | Performance BG, advance BG, retention BG tracking with expiry alerts |
| **Retention Summary** | Retention money tracking across projects |
| **DLP Timelines** | Defect Liability Period management with warranty tracking |

### Enterprise
| Feature | Description |
|---------|-------------|
| **AI Assistant** | Hintonn AI Copilot for natural language queries across all modules |
| **User Approvals & Access Control** | Admin approval workflow for new user registration |
| **Role-Based Access Control (RBAC)** | Granular permissions per module based on user roles |
| **Real-time Notifications** | In-app notification system with Firebase Cloud Functions |
| **Firebase Cloud Sync** | Real-time data synchronization across devices via Firestore |
| **Connectors** | Integration points for external tools (Jira, Slack, Webhooks) |
| **Audit Logs** | Admin audit trail for compliance |

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Login    │  │ Dashboard│  │  Tasks   │  │  AI    │ │
│  │  Auth     │  │ Projects │  │ Calendar │  │ Copilot│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       │              │              │             │      │
│  ┌────┴──────────────┴──────────────┴─────────────┴───┐ │
│  │              App Router + Screen Engine             │ │
│  └────────────────────┬───────────────────────────────┘ │
│                       │                                  │
│  ┌────────────────────┴───────────────────────────────┐ │
│  │          Store (localStorage + Firestore)          │ │
│  └────────────────────┬───────────────────────────────┘ │
└───────────────────────┼─────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │   Firebase Services   │
            ├───────────────────────┤
            │  🔐 Firebase Auth     │
            │  📦 Cloud Firestore   │
            │  ☁️  Cloud Functions   │
            │  📨 FCM (Push)        │
            │  🌐 Firebase Hosting  │
            └───────────────────────┘
```

### Data Flow
- **Real-time sync** — Firestore `onSnapshot` listeners push changes to all connected clients instantly
- **Offline support** — localStorage cache ensures the app works offline; changes sync when reconnected
- **Security** — Firestore rules enforce admin-only access to sensitive collections; users can only read/write their own documents

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| **Styling** | Custom CSS with design tokens (CSS variables) |
| **Backend** | Firebase Cloud Firestore (NoSQL), Firebase Cloud Functions (Node.js) |
| **Authentication** | Firebase Auth — Google OAuth + Email/Password |
| **Real-time** | Firestore `onSnapshot` listeners |
| **Notifications** | Firebase Cloud Messaging (FCM) |
| **Hosting** | Firebase Hosting / Static file server |
| **Package Manager** | npm |
| **Runtime** | Node.js 18+ (for functions and local dev) |

---

## 📱 Screens

| # | Screen | Route | Description |
|---|--------|-------|-------------|
| 1 | **Login / Sign Up** | `#login` | Email/Password + Google OAuth authentication |
| 2 | **Dashboard** | `#dashboard` | Executive overview with KPIs, charts, alerts |
| 3 | **Projects** | `#projects` | Project portfolio with filtering and search |
| 4 | **Project Detail** | `#project-detail/:id` | Individual project view with tasks, milestones, issues |
| 5 | **Tasks** | `#tasks` | Kanban board with drag-and-drop |
| 6 | **Calendar** | `#calendar` | Schedule and deadline visualization |
| 7 | **Timeline** | `#timeline` | Executive Gantt chart (Admin only) |
| 8 | **Team** | `#team` | Member workload and assignment view |
| 9 | **Issues** | `#issues` | Issue tracker with priority and status |
| 10 | **Milestones** | `#milestones` | Milestone tracking across projects |
| 11 | **Reports** | `#reports` | Analytics and performance reports |
| 12 | **AI Assistant** | `#ai-assistant` | Hintonn AI Copilot chat |
| 13 | **Notifications** | `#notifications` | Activity feed and system alerts |
| 14 | **Billing** | `#billing` | Invoice management (Admin/Finance) |
| 15 | **Retention** | `#retention` | Retention money tracking (Admin/Finance) |
| 16 | **Bank Guarantees** | `#bg` | BG tracking with expiry alerts (Admin/Finance) |
| 17 | **DLP Timelines** | `#dlp` | Defect liability period management (Admin/PMO) |
| 18 | **Connectors** | `#connectors` | External integrations (Admin) |
| 19 | **Settings** | `#settings` | Profile and workspace settings (Admin) |
| 20 | **User Approvals** | `#user-approvals` | Access control and user approval (Admin) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18 or higher
- **npm** 9 or higher
- **Firebase account** (for deployment)
- **Google Cloud** project with Firestore enabled

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/Mohit009TheCoder/hintonn-pmo.git
cd hintonn-pmo

# 2. Install dependencies
npm install

# 3. Start local development server
node scratch/serve.js

# 4. Open in browser
open http://localhost:3000
```

### Default Admin Credentials
| Field | Value |
|-------|-------|
| **Email** | `mohithintonn@gmail.com` |
| **Password** | `Mohit@123` |

---

## ⚙️ Configuration

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable the following services:
   - **Authentication** → Email/Password + Google Sign-In
   - **Cloud Firestore** → Create database (start in test mode, then apply rules)
   - **Cloud Functions** → Deploy functions from `/functions` directory
   - **Firebase Hosting** → Deploy static files

3. Update Firebase config in `js/firebase-auth.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

4. Update service account in `service-account.json` (for Cloud Functions)

### Firestore Security Rules

The app uses custom Firestore rules (`firestore.rules`):

```
/users/{userId}     → Admin: full access | User: read/write own doc
/{document=**}      → Authenticated users: read/write
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes (for functions) |
| `SERVICE_ACCOUNT_KEY` | Path to service account JSON | Yes (for seed/deploy) |

---

## 🔐 Authentication & Access Control

### User Roles

| Role | Code | Access Level |
|------|------|-------------|
| **Admin** | `ADMIN` | Full system access, user management, settings |
| **Project Manager** | `PM` | Projects, tasks, team, reports, AI assistant |
| **PMO** | `PMO` | All modules + DLP, retention, bank guarantees |
| **Finance** | `FIN` | Billing, invoices, retention, bank guarantees |
| **Contractor** | `CTR` | Projects, tasks, team, bank guarantees |
| **AI Developer** | `DEV` | Standard workspace access |

### Approval Workflow

```
New User Signs Up
       │
       ▼
  ┌─────────────┐
  │  PENDING     │  ← User sees "Access Request Pending"
  │  (isActive:  │
  │   false)     │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  ADMIN       │  ← Admin sees request in Notifications
  │  REVIEWS     │     + User Approvals panel
  └──────┬──────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│APPROVED│ │REJECTED│
│(login) │ │(blocked)│
└────────┘ └────────┘
```

- **Pre-approved emails** (bypass approval): `mohithintonn@gmail.com`, `hirvihintonn@gmail.com`, `preethintonn@gmail.com`
- **Admin Direct Add**: Admin can add users directly (auto-approved)
- **Cross-device sync**: Approval status syncs in real-time via Firestore

---

## 📁 Project Structure

```
HINTONN PMO/
├── index.html                    # Main SPA entry point
├── firebase.json                 # Firebase hosting & functions config
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Firestore composite indexes
├── package.json                  # Node.js dependencies
├── service-account.json          # Firebase service account (private)
│
├── css/                          # Stylesheets
│   ├── tokens.css                # Design tokens (colors, spacing, fonts)
│   ├── base.css                  # Reset and base styles
│   ├── layout.css                # Layout grid, sidebar, topbar
│   ├── components.css            # Buttons, cards, modals, forms
│   └── login.css                 # Authentication page styles
│
├── js/                           # Application JavaScript
│   ├── app.js                    # Main app controller, routing, utilities
│   ├── auth.js                   # Authentication, user management, RBAC
│   ├── firebase-auth.js          # Firebase Auth integration (Google + Email)
│   ├── store.js                  # Data store (localStorage + Firestore sync)
│   ├── fcm.js                    # Firebase Cloud Messaging setup
│   │
│   ├── components/               # Reusable UI components
│   │   ├── command.js            # Command palette (Cmd+K)
│   │   ├── icons.js              # SVG icon library
│   │   ├── modal.js              # Modal dialog system
│   │   ├── sidebar.js            # Navigation sidebar
│   │   ├── toast.js              # Toast notifications
│   │   └── topbar.js             # Top navigation bar
│   │
│   └── screens/                  # Screen modules (20 screens)
│       ├── login.js              # Authentication screens
│       ├── dashboard.js          # Executive dashboard
│       ├── projects.js           # Project portfolio
│       ├── project-detail.js     # Individual project view
│       ├── tasks.js              # Kanban task board
│       ├── calendar.js           # Calendar view
│       ├── timeline.js           # Gantt chart
│       ├── team.js               # Team workload
│       ├── issues.js             # Issue tracker
│       ├── milestones.js         # Milestone tracking
│       ├── reports.js            # Analytics & reports
│       ├── ai-assistant.js       # AI copilot chat
│       ├── notifications.js      # Notification center
│       ├── billing.js            # Invoice management
│       ├── bank-guarantees.js    # BG tracking
│       ├── retention.js          # Retention summary
│       ├── dlp.js                # DLP timelines
│       ├── connectors.js         # External integrations
│       ├── settings.js           # Workspace settings
│       └── user-approvals.js     # User approval & access control
│
├── functions/                    # Firebase Cloud Functions
│   ├── index.js                  # Function definitions
│   └── node_modules/             # Server-side dependencies
│
├── assets/                       # Static assets
│   ├── hintonn-logo.png          # Brand logo
│   └── hintonn-official-logo.png # Official logo
│
├── n8n-workflows/                # n8n automation workflows
│   ├── 01-data-sync-engine.json
│   ├── 02-alert-dispatcher.json
│   ├── 03-weekly-report-generator.json
│   ├── 04-health-aggregator.json
│   ├── 05-dlp-checker.json
│   └── 06-error-recovery-healthcheck.json
│
├── scratch/                      # Dev utilities
│   ├── serve.js                  # Local development server
│   └── test_*.js                 # Test scripts
│
├── _backups/                     # Project backups
└── wipe-db.js                    # Database reset utility
```

---

## 🚢 Deployment

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
firebase deploy --only functions
```

### Full Deploy

```bash
firebase deploy
```

### Local Production Server

```bash
node scratch/serve.js
# Server runs at http://localhost:3000
```

---

## 🔄 n8n Workflows

The project includes 6 n8n automation workflows:

| # | Workflow | Description |
|---|----------|-------------|
| 01 | **Data Sync Engine** | Bi-directional data synchronization |
| 02 | **Alert Dispatcher** | Push notifications and email alerts |
| 03 | **Weekly Report Generator** | Automated weekly status reports |
| 04 | **Health Aggregator** | System health monitoring |
| 05 | **DLP Checker** | Defect liability period expiry monitoring |
| 06 | **Error Recovery** | Health check and error recovery |

---

## 🧪 Testing

```bash
# Run test suite
node scratch/test_complete_suite.js

# Run specific tests
node scratch/test_screens.js
node scratch/test_fixes.js
node scratch/test_isolation_and_privacy.js
```

---

## 📄 License

ISC License — Copyright (c) 2026 Hintonn AI / NeLabs

---

<div align="center">

**Built with by [Hintonn AI](https://hintonn.com)**

*Enterprise Project Management, Reimagined with AI*

</div>
