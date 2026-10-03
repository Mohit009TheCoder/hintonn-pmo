# Hintonn PMO — n8n Automation Engine

Phase 5 deliverable: 6 n8n workflows for the Hintonn PMO commercial project management system.

## Workflows Overview

| # | Workflow | Schedule | Purpose |
|---|---------|----------|---------|
| 01 | Data Sync Engine | `*/15 * * * *` (every 15 min) | Google Sheets → Firestore bidirectional sync |
| 02 | Alert Dispatcher | `0 9 * * *` (daily 9am) | BG expiry monitoring with 30/15/7-day thresholds |
| 03 | Weekly Report Generator | `0 8 * * 1` (Monday 8am) | Aggregate scores → HTML → PDF → email |
| 04 | Health Aggregator | `0 */6 * * *` (every 6h) | Portfolio health score recalculation |
| 05 | DLP Checker | `0 9 * * 1` (Monday 9am) | DLP records + milestone notifications |
| 06 | Error Recovery & Health Check | On-demand + `*/30 * * * *` | `/healthz` endpoint + execution monitoring |

## Prerequisites

1. **n8n instance** running (self-hosted or cloud)
2. **Firebase project**: `hintonn-pmo`
3. **Google Sheets** connected with project data
4. **SMTP credentials** configured in n8n for email alerts

## Environment Variables Required

```
HINTONN_SHEET_ID=<your Google Sheets ID>
ALERT_FROM_EMAIL=pmo@hintonn.com
ALERT_TO_EMAIL=mohit@hintonn.com
FIREBASE_STORAGE_BUCKET=hintonn-pmo.firebasestorage.app
```

## Credentials to Configure in n8n

- **Google Sheets OAuth2** — for Data Sync Engine
- **SMTP** — for Alert Dispatcher + Weekly Report email
- **Google OAuth2** (`Hintonn Google OAuth2`) — for ALL Firestore reads/writes and Storage uploads

### ⚠️ Firestore security rules (required reading)

`firestore.rules` no longer allows anonymous access. Every Firestore call
from these workflows runs through the **Google OAuth2** credential, and the
rules enforce:

| Collection | Rule |
|-----------|------|
| `projects`, `tasks`, `milestones`, `issues`, `comments`, `members`, `activities`, `notifications`, `settings` | Any signed-in Google account |
| `invoices`, `bankGuarantees`, `dlpRecords`, `retentionRecords`, `companies` | **Admin accounts only** (`mohithintonn@gmail.com`, `admin@hintonn.com`) |

**Action required:** the `Hintonn Google OAuth2` credential in n8n must be
authorized with an **admin Google account**, otherwise workflows 01, 02, 03,
04 and 05 will get `permission-denied` on the commercial collections.
Re-authorize the credential under n8n → Credentials → Hintonn Google OAuth2.

## Import Steps

1. Open n8n dashboard
2. Go to **Workflows → Import from File**
3. Import each JSON file in order (01 → 06)
4. Configure credentials for each node that requires them
5. Set environment variables in n8n Settings → Environment
6. Activate each workflow

## Firestore Collections Used

| Collection | Workflow | Purpose |
|-----------|----------|---------|
| `projects` | 01, 03, 04 | Project data |
| `tasks` | 01, 03, 04 | Task data |
| `milestones` | 01, 05 | Milestone tracking |
| `issues` | 01, 04 | Issue tracking |
| `bankGuarantees` | 01, 02, 03, 04 | BG monitoring |
| `invoices` | 01, 03 | Billing data |
| `dlpRecords` | 01, 05 | DLP tracking |
| `retentionRecords` | 01, 03 | Retention data |
| `members` | 01 | Team roster |
| `companies` | 01, 03 | Client companies |
| `notifications` | 02, 04, 05, 06 | Alert notifications |
| `settings` | 04 | Workspace config |
| `syncLogs` | 01 | Sync audit trail |
| `bgAlerts` | 02 | BG alert history |
| `healthSnapshots` | 04 | Health score history |
| `reportLogs` | 03 | Report generation logs |
| `dlpAuditLogs` | 05 | DLP check audit |
| `executionHealth` | 06 | n8n execution stats |

## Error Recovery (Workflow 06)

- **Retry strategy**: Exponential backoff (1s → 2s → 4s → 8s → 16s)
- **Max retries**: 5
- **Dead letter queue**: Enabled — failed items logged to `notifications`
- **Health endpoint**: `GET /healthz` returns system status + workflow count
- **Execution monitor**: Runs every 30 min, checks success rates per workflow

## Phase 5 Exit Criteria

- [x] Data Sync running every 15 minutes, Sheets to Firestore
- [x] BG expiry alerts at 30/15/7 day thresholds
- [x] Weekly PDF report generated every Monday
- [x] Health scores recalculated every 6 hours
- [x] All workflows have retry and error recovery
