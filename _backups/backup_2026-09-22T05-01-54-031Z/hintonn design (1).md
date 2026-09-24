# Hintonn AI — Design System

> **Hintonn AI — AI Automation & Intelligence**
>
> Premium, light-first enterprise AI software built around a distinctive blue-to-purple intelligence gradient, clean white surfaces, and a confident modern wordmark.

---

## 1. Design Direction

Hintonn AI is a premium AI operating system for business.

The visual language is based directly on the current Hintonn AI logo:

- Geometric hexagonal **H** symbol
- Blue → violet/purple gradient
- White Hintonn wordmark
- Blue → violet gradient on **AI**
- High-contrast, technological, intelligent visual identity

The product UI should translate this identity into a **bright, clean, premium SaaS interface**.

### Core principles

1. **Light first** — white and soft neutral surfaces dominate.
2. **Intelligence through gradient** — blue/purple identifies AI functionality.
3. **Geometry** — structured shapes, precise spacing, controlled radii.
4. **Clarity** — information hierarchy is more important than decoration.
5. **Premium restraint** — gradients are accents, not backgrounds everywhere.
6. **Trust** — business-critical information must remain calm and readable.
7. **AI-native** — AI functionality should be visibly identifiable but never mysterious.

---

# 2. Absolute Background Rule

## NO DARK UI BACKGROUNDS

The Hintonn AI product interface must **not use black, near-black, navy, charcoal, or dark gradient backgrounds** for any major UI section.

This applies to:

- App shell
- Sidebar
- Header
- Dashboard
- Cards
- Hero sections
- AI panels
- Automation canvas
- Chat
- Inbox
- Calls
- Meetings
- Modals
- Drawers
- Empty states
- Footer
- Tables

Dark colors may be used for text, icons, borders, and small controls.

The logo itself may retain its supplied black presentation background when displayed as an external brand asset, but **the application UI remains light**.

---

# 3. Logo System

## 3.1 Primary Logo

The current logo consists of:

- Geometric hexagonal H symbol
- Blue-to-purple gradient outline
- White `Hintonn` wordmark
- Blue-to-purple gradient `AI` wordmark

The logo is the primary source of the product's visual identity.

## 3.2 Logo Geometry

The H mark should always retain:

- Hexagonal outer geometry
- Centered H
- Consistent stroke
- Blue-to-purple progression
- Geometric proportions

Do not redraw the mark into a rounded or generic AI icon.

## 3.3 Logo Variants

The design system should support:

### Primary horizontal logo
Use for:
- Marketing
- Product login
- Brand pages
- Documentation

### Symbol only
Use for:
- App icon
- Favicon
- Collapsed sidebar
- AI agent avatar
- Small navigation contexts

### Light-background product logo
For the application, create a light-background-compatible version:

- H mark: blue → violet gradient
- `Hintonn`: deep neutral text
- `AI`: blue → violet gradient

Do **not** place the black-background logo directly inside the main white dashboard unless the black background is intentionally part of the image asset.

---

# 4. Brand Color System

The old yellow-centric Hinton palette is replaced by the logo's **blue → violet intelligence palette**.

## 4.1 Primary Blue

```text
blue-50      #EFF6FF
blue-100     #DBEAFE
blue-200     #BFDBFE
blue-300     #93C5FD
blue-400     #60A5FA
blue-500     #3B82F6
blue-600     #2563EB
blue-700     #1D4ED8
blue-800     #1E40AF
```

Primary product blue:

```text
#2563EB
```

Use for:

- Primary actions
- Links
- Active states
- Interactive controls
- AI activity
- Charts
- Focus states

---

# 5. AI Violet System

```text
violet-50     #FAF5FF
violet-100    #F3E8FF
violet-200    #E9D5FF
violet-300    #D8B4FE
violet-400    #C084FC
violet-500    #A855F7
violet-600    #9333EA
violet-700    #7E22CE
violet-800    #6B21A8
```

Primary AI violet:

```text
#9333EA
```

Use for:

- AI reasoning
- AI-generated content
- AI agents
- AI recommendations
- Intelligence indicators
- AI automation nodes
- Advanced analytics

---

# 6. Hintonn Intelligence Gradient

The signature gradient is the most important visual element derived from the logo.

## Primary gradient

```css
linear-gradient(135deg, #1683FF 0%, #2563EB 48%, #9333EA 100%);
```

Alternative more saturated brand gradient:

```css
linear-gradient(135deg, #0088FF 0%, #3867FF 45%, #8B2CF5 100%);
```

Use the gradient for:

- AI iconography
- AI badges
- Logo
- Active AI indicators
- AI progress
- Small decorative accents
- Selected headings
- Data visualization highlights
- Agent identity
- Premium feature highlights

Do not use the gradient as the entire application background.

---

# 7. Gradient Rules

### Correct

```text
White page
     ↓
White card
     ↓
Small blue/purple AI indicator
     ↓
Gradient icon or accent
```

### Incorrect

```text
Entire page
████████████████
blue/purple gradient
```

The gradient is a **brand signal**, not a replacement for the UI surface.

---

# 8. Neutral System

```text
neutral-0       #FFFFFF
neutral-25      #FCFCFD
neutral-50      #F8FAFC
neutral-100     #F1F5F9
neutral-150     #EEF2F7
neutral-200     #E2E8F0
neutral-300     #CBD5E1
neutral-400     #94A3B8
neutral-500     #64748B
neutral-600     #475569
neutral-700     #334155
neutral-800     #1E293B
neutral-900     #0F172A
```

Use:

- `#FFFFFF` for primary surfaces
- `#F8FAFC` for page backgrounds
- `#F1F5F9` for subtle sections
- `#E2E8F0` for borders
- `#0F172A` for primary text

`neutral-900` is a text color, never a large background.

---

# 9. Semantic Colors

## Success

```text
success-50    #ECFDF5
success-100   #D1FAE5
success-500   #10B981
success-600   #059669
success-700   #047857
```

## Warning

```text
warning-50    #FFFBEB
warning-100   #FEF3C7
warning-500   #F59E0B
warning-600   #D97706
```

## Error

```text
error-50      #FEF2F2
error-100     #FEE2E2
error-500     #EF4444
error-600     #DC2626
```

## Information

Use the primary blue scale.

---

# 10. Color Meaning

| Color | Meaning |
|---|---|
| Blue | Action, system, intelligence |
| Violet | AI, reasoning, generation |
| Blue → Violet | Hintonn AI identity |
| Green | Success, healthy, completed |
| Amber | Attention, pending, warning |
| Red | Error, failed, destructive |
| Neutral | Structure, content, metadata |

Do not use arbitrary colors for status.

---

# 11. Typography

## Primary Product Typeface

**Inter**

Use for:

- Navigation
- Body
- Tables
- Forms
- Buttons
- Metadata
- Labels
- Product UI

## Display Typeface

**Manrope**

Use for:

- Hero headlines
- Major page headings
- KPI numbers
- Feature titles
- Large dashboard statements

## Technical Typeface

**JetBrains Mono**

Use for:

- API keys
- Code
- Technical values
- Workflow expressions
- Developer-facing configuration

### Font stack

```css
font-family:
Inter,
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif;
```

Display:

```css
font-family:
Manrope,
Inter,
system-ui,
sans-serif;
```

---

# 12. Typography Scale

| Token | Size | Line Height | Font |
|---|---:|---:|---|
| Display XL | 64px | 72px | Manrope 800 |
| Display | 52px | 60px | Manrope 800 |
| H1 | 40px | 48px | Manrope 700 |
| H2 | 32px | 40px | Manrope 700 |
| H3 | 24px | 32px | Manrope 700 |
| H4 | 20px | 28px | Inter 600 |
| H5 | 18px | 24px | Inter 600 |
| Body Large | 16px | 24px | Inter 400 |
| Body | 14px | 20px | Inter 400 |
| Body Medium | 14px | 20px | Inter 500 |
| Small | 13px | 18px | Inter 400 |
| Caption | 12px | 16px | Inter 500 |
| Micro | 11px | 14px | Inter 500 |

---

# 13. Spacing

Use a 4px base with an 8px primary rhythm.

```text
space-1     4px
space-2     8px
space-3     12px
space-4     16px
space-5     20px
space-6     24px
space-8     32px
space-10    40px
space-12    48px
space-16    64px
space-20    80px
space-24    96px
```

---

# 14. Radius

```text
radius-xs       4px
radius-sm       6px
radius-md       10px
radius-lg       14px
radius-xl       18px
radius-2xl      24px
radius-pill     999px
```

Recommended:

- Inputs: 10px
- Buttons: 10px
- Cards: 14px
- Feature cards: 18px
- Modals: 18px
- Pills: 999px

---

# 15. Borders

Primary:

```text
#E2E8F0
```

Strong:

```text
#CBD5E1
```

AI:

```text
#D8B4FE
```

Brand:

```text
#93C5FD
```

Borders should be subtle and never visually dominate.

---

# 16. Shadows

```css
shadow-sm:
0 1px 2px rgba(15, 23, 42, 0.04);

shadow-md:
0 4px 14px rgba(15, 23, 42, 0.06);

shadow-lg:
0 12px 32px rgba(15, 23, 42, 0.08);

shadow-xl:
0 20px 48px rgba(15, 23, 42, 0.10);
```

Prefer borders over heavy shadows.

---

# 17. Application Shell

```text
┌──────────────────────────────────────────────────────┐
│ H  Hintonn AI    │ Search       Notifications  User │
├──────────────────┼───────────────────────────────────┤
│ Overview         │                                   │
│ Inbox            │             Main Content          │
│ Leads            │                                   │
│ AI Agents        │                                   │
│ Automations      │                                   │
│ Calls            │                                   │
│ Analytics        │                                   │
│                  │                                   │
│ Settings         │                                   │
└──────────────────┴───────────────────────────────────┘
```

Everything remains light.

---

# 18. Sidebar

Width:

```text
240px – 264px
```

Background:

```text
#FFFFFF
```

Border:

```text
1px solid #E2E8F0
```

## Sidebar identity

At the top:

- H symbol
- `Hintonn AI` wordmark
- Workspace selector

For compact navigation, use the hexagonal H mark alone.

## Navigation

```text
Overview
Inbox
Conversations
Leads
Contacts

INTELLIGENCE
AI Agents
Automations
Knowledge

OPERATIONS
Calls
Meetings
Tasks

INSIGHTS
Analytics
Reports

Settings
```

## Active state

Use a light blue/violet tint:

```text
background: #EFF6FF
color: #1D4ED8
```

For AI-specific navigation:

```text
background: #FAF5FF
color: #7E22CE
```

Never use a dark sidebar.

---

# 19. Header

Height:

```text
64px – 72px
```

Background:

```text
#FFFFFF
```

Border:

```text
#E2E8F0
```

Elements:

- Breadcrumb/page title
- Global search
- Command shortcut
- Notifications
- Help
- Profile

---

# 20. Global Search

```text
⌕  Search anything...                 ⌘ K
```

Search should cover:

- Leads
- Conversations
- Contacts
- AI agents
- Automations
- Calls
- Meetings
- Knowledge
- Settings

AI search may support natural language.

---

# 21. Buttons

## Primary

```text
background: #2563EB
color: #FFFFFF
```

## AI Primary

```text
background: linear-gradient(135deg, #2563EB, #9333EA)
color: #FFFFFF
```

Use AI gradient buttons only for actions that genuinely invoke AI.

Examples:

- Ask AI
- Generate
- Create AI Agent
- Analyze
- Build with AI

## Secondary

```text
background: #FFFFFF
border: #CBD5E1
color: #334155
```

## Tertiary

Transparent with blue text.

## Destructive

Use red.

---

# 22. AI Buttons

AI buttons may include the hexagonal H symbol or sparkle icon.

Example:

```text
[ ✦ Ask Hintonn ]
[ ✦ Analyze ]
[ ✦ Generate ]
```

AI buttons should not be everywhere.

---

# 23. Cards

Default:

```text
background: #FFFFFF
border: 1px solid #E2E8F0
border-radius: 14px
```

Padding:

```text
20px – 24px
```

AI cards may use:

```text
background: #FAF5FF
border: #E9D5FF
```

or a very subtle blue/violet gradient tint.

Never use dark AI cards.

---

# 24. KPI Cards

Structure:

```text
Metric
2,481

↑ 18.4%

Supporting context
```

Large numbers:

- Manrope
- 28–40px
- 700–800 weight

AI metrics may use a tiny gradient icon.

---

# 25. Dashboard

The primary dashboard should answer:

1. What is happening?
2. What changed?
3. What needs attention?
4. What is AI doing?
5. What should I do next?

Recommended layout:

```text
Good morning, Ayush

[Leads] [Conversations] [AI Actions] [Qualified]

────────────────────────────────────────────

Lead Performance          AI Activity

Chart                     AI summary
                          Agent activity

────────────────────────────────────────────

Pipeline                  Needs Attention

────────────────────────────────────────────

Recent Leads              Recent Activity
```

---

# 26. AI Activity Panel

AI activity is a signature Hintonn component.

Example:

```text
┌──────────────────────────────────────┐
│ ✦ AI Activity                        │
│                                      │
│ 124 conversations handled            │
│ 82% resolved automatically            │
│                                      │
│ Sales Agent      18 leads qualified  │
│ Support Agent     9 issues resolved  │
│ Research Agent   31 profiles enriched│
└──────────────────────────────────────┘
```

Use blue/violet accents.

---

# 27. AI Agent Cards

```text
┌─────────────────────────────────────┐
│ ✦ Sales Qualification Agent         │
│                                     │
│ Qualifies inbound opportunities.    │
│                                     │
│ ● Active                            │
│                                     │
│ WhatsApp  Email  Voice              │
│                                     │
│ 1,284 actions      94.7% success    │
│                                     │
│ [Open Agent]                        │
└─────────────────────────────────────┘
```

AI agent identity can use the Hintonn gradient.

---

# 28. AI Agent Icon

The preferred AI agent icon is the **hexagonal H mark**.

Use:

- Full mark for large cards
- Simplified H for small cards
- Gradient outline for active AI
- Soft blue/violet background

Example:

```text
┌─────────┐
│   H     │
└─────────┘
```

Do not replace the identity with generic robot heads unless required by context.

---

# 29. AI Conversation

Human content:

```text
#FFFFFF
```

AI content:

```text
#F8F5FF
```

AI messages may have a subtle violet left border or gradient indicator.

AI actions should expose:

- Suggested action
- Reason
- Source/context
- Approve
- Edit
- Dismiss

---

# 30. Inbox

Desktop:

```text
┌──────────────┬─────────────────────┬────────────────┐
│ Conversations│ Conversation        │ Context        │
│              │                     │                │
│ Lead A       │ Messages            │ AI Summary     │
│ Lead B       │                     │ Lead details   │
│ Lead C       │                     │ Actions        │
└──────────────┴─────────────────────┴────────────────┘
```

The UI remains white/light gray throughout.

---

# 31. Automation Builder

Automation should communicate:

```text
Trigger
   ↓
Condition
   ↓
AI Decision
   ↓
Action
   ↓
Result
```

Canvas:

```text
#F8FAFC
```

Node:

```text
#FFFFFF
border: #E2E8F0
```

AI node:

```text
background: #FAF5FF
border: #D8B4FE
```

Connections:

- Blue
- Violet
- Gradient

Never use a dark automation canvas.

---

# 32. Voice Calling

The voice UI should feature the Hintonn H mark.

```text
              ┌─────────┐
              │    H    │
              └─────────┘

            Sales Agent

             Listening

          ▁▂▃▅▆▅▃▂▁▂▃▅

       [Mute] [Hold] [End]
```

Use:

- Blue/violet waveform
- Light surface
- Gradient activity indicator
- Live transcript
- AI state
- Call summary

---

# 33. Meeting UI

Include:

- Participants
- Live transcript
- AI assistant
- Notes
- Action items
- Recording
- Summary
- Follow-ups

AI assistant uses the H mark.

---

# 34. Analytics

Analytics should be clean and information-dense.

Preferred chart palette:

```text
Blue       #2563EB
Violet     #9333EA
Gradient   #2563EB → #9333EA
Green      #10B981
Amber      #F59E0B
Red        #EF4444
```

Charts remain on white/light-neutral backgrounds.

---

# 35. Data Visualization

Use the gradient sparingly.

Good:

- One highlighted data series
- AI metric
- Selected point
- Progress
- Highlighted KPI

Avoid turning every chart into a rainbow.

---

# 36. Status System

```text
● Active
● Processing
● Waiting
● Needs Review
● Completed
● Paused
● Failed
```

AI processing:

```text
✦ AI Processing
```

Use semantic colors plus text/icon so color is never the only signal.

---

# 37. Modals

Background:

```text
#FFFFFF
```

Radius:

```text
18px
```

Shadow:

```text
shadow-xl
```

Structure:

```text
Title
Description

Content

────────────

[Cancel] [Action]
```

AI modal:

```text
✦ Hintonn AI
```

with a subtle blue/violet accent.

---

# 38. Empty States

Use:

- H mark
- Minimal geometric illustration
- Short explanation
- Primary action

Example:

```text
        H

No automations yet

Create your first workflow and let
Hintonn handle repetitive work.

[ Create automation ]
```

---

# 39. Loading

Use skeletons.

```text
████████████
██████
████████████████
```

Skeleton:

```text
#E2E8F0
```

AI loading may use a subtle animated blue-violet shimmer.

---

# 40. Iconography

Use a consistent outline icon system.

Characteristics:

- 1.5–2px stroke
- Rounded ends
- Simple geometry
- 16–24px default size

The hexagonal H mark remains the unique brand icon.

---

# 41. Illustrations

Illustrations should use:

- White
- Soft neutrals
- Blue
- Violet
- Blue-violet gradients

Visual language:

- Geometric
- Technical
- Minimal
- Precise
- Abstract rather than cartoonish

Use the hexagon as a recurring geometric motif.

---

# 42. Hexagon Motif

The logo's hexagon can become a secondary design language.

Use subtly in:

- AI icons
- Empty states
- Decorative backgrounds
- Agent avatars
- Workflow nodes
- Feature illustrations
- Loading states

Do not place large hexagons everywhere.

---

# 43. Background Motifs

Optional decorative background:

```text
white / #F8FAFC base
+
very low-opacity geometric hexagons
+
subtle blue/violet radial glow
```

Example:

```css
background:
radial-gradient(
  circle at 80% 10%,
  rgba(59,130,246,.08),
  transparent 32%
),
#F8FAFC;
```

The glow must remain subtle.

---

# 44. Responsive Design

## Desktop

- 240–264px sidebar
- Multi-column dashboard
- Full AI context panels

## Tablet

- Collapsible sidebar
- Reduced dashboard columns
- Condensed tables

## Mobile

- Navigation drawer/bottom navigation
- Single-column cards
- Full-screen details
- 44px+ touch targets

---

# 45. Motion

```text
fast        150ms
standard    200ms
comfortable 300ms
slow        400ms
```

Use for:

- Navigation
- Panels
- Hover
- AI activity
- Status changes
- Charts

AI activity may use a soft gradient shimmer.

No excessive bounce or flashy motion.

---

# 46. Accessibility

Target WCAG 2.2 AA.

Requirements:

- Keyboard navigation
- Visible focus states
- Semantic markup
- Screen-reader labels
- Sufficient contrast
- Minimum 44px touch targets
- Color + text for statuses
- Reduced-motion support

---

# 47. Component States

Every component must define:

```text
Default
Hover
Focus
Active
Selected
Disabled
Loading
Success
Error
```

---

# 48. Focus State

Default:

```css
box-shadow:
0 0 0 3px #DBEAFE;
```

AI focus:

```css
box-shadow:
0 0 0 3px #E9D5FF;
```

---

# 49. Design Tokens

```css
:root {
  --bg: #F8FAFC;
  --surface: #FFFFFF;
  --surface-soft: #F1F5F9;

  --text: #0F172A;
  --text-secondary: #475569;
  --text-muted: #64748B;

  --border: #E2E8F0;
  --border-strong: #CBD5E1;

  --blue: #2563EB;
  --blue-soft: #DBEAFE;

  --violet: #9333EA;
  --violet-soft: #F3E8FF;

  --gradient:
    linear-gradient(
      135deg,
      #1683FF 0%,
      #2563EB 48%,
      #9333EA 100%
    );

  --success: #059669;
  --warning: #D97706;
  --error: #DC2626;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --radius-2xl: 24px;
}
```

---

# 50. Brand Usage Summary

## Blue

**Primary product interaction**

Use for:

- Buttons
- Links
- Navigation
- Active states
- Charts
- System activity

## Violet

**AI intelligence**

Use for:

- AI agents
- AI reasoning
- Generation
- AI recommendations

## Blue → Violet

**Hintonn AI signature**

Use for:

- Logo
- AI highlights
- Premium AI actions
- Agent identity
- Special AI metrics

## Neutral

**Business interface**

Use for:

- Backgrounds
- Cards
- Tables
- Structure
- Typography

---

# 51. Do

- Keep the UI bright.
- Use white as the primary surface.
- Use blue and violet as the new brand identity.
- Use the hexagonal H as the core product symbol.
- Use gradients selectively.
- Use Manrope for display typography.
- Use Inter for product UI.
- Make AI functionality visually recognizable.
- Keep dashboards information-dense but calm.
- Use geometric details derived from the logo.

---

# 52. Don't

- Do not use black UI backgrounds.
- Do not use dark dashboards.
- Do not use dark sidebars.
- Do not use yellow as the primary brand color.
- Do not replace the logo's blue/violet identity with arbitrary colors.
- Do not overuse gradients.
- Do not use neon cyberpunk backgrounds.
- Do not use generic robot imagery as the primary AI identity.
- Do not use excessive glassmorphism.
- Do not use heavy shadows.
- Do not make every element colorful.
- Do not use the gradient as a full-page background.

---

# 53. Final Product Philosophy

Hintonn AI should feel like:

> **A calm, intelligent command center where AI does the operational work and humans stay in control.**

The visual hierarchy is:

```text
WHITE
  ↓
NEUTRAL STRUCTURE
  ↓
BLUE INTERACTION
  ↓
VIOLET INTELLIGENCE
  ↓
BLUE → VIOLET HINTONN AI SIGNATURE
```

The logo establishes the identity.

The hexagon establishes the geometry.

Blue establishes action.

Violet establishes intelligence.

The gradient establishes the Hintonn AI signature.

White and neutral surfaces establish trust and usability.

The result should be a **bright, premium, geometric, AI-native business operating system** — never a dark or cyberpunk interface.
