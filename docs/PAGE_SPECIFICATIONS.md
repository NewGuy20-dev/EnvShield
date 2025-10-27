# 📄 Page Specifications
## Detailed Layout & Component Breakdown

---

## 1. LANDING PAGE (Public)

### Purpose
First impression, brand showcase, conversion funnel

### Layout Structure
```
┌─────────────────────────────────────────────┐
│  Navigation Bar (Glass, Fixed)              │
├─────────────────────────────────────────────┤
│                                             │
│  HERO SECTION                               │
│  • Animated gradient background             │
│  • Main headline + subheading               │
│  • CTA buttons (Sign Up, View Docs)         │
│  • CLI preview window (glass card)          │
│                                             │
├─────────────────────────────────────────────┤
│  FEATURES SECTION                           │
│  • 3-column glass cards                     │
│  • Icons + title + description              │
│  • Hover lift effect                        │
│                                             │
├─────────────────────────────────────────────┤
│  HOW IT WORKS                               │
│  • Step-by-step timeline                    │
│  • Numbered steps with icons                │
│                                             │
├─────────────────────────────────────────────┤
│  TESTIMONIALS / SOCIAL PROOF                │
│  • Sliding glass cards                      │
│  • User avatars + quotes                    │
│                                             │
├─────────────────────────────────────────────┤
│  FINAL CTA SECTION                          │
│  • Large call-to-action                     │
│  • Email signup form                        │
│                                             │
├─────────────────────────────────────────────┤
│  FOOTER                                     │
│  • Links, social, copyright                 │
└─────────────────────────────────────────────┘
```

### Key Components
- **Navbar**: Logo (left) | Links (center) | CTA (right) | Theme toggle
- **Hero**: Gradient background + animated particles (Framer Motion)
- **Feature Cards**: Icon + title + description + hover glow
- **CLI Preview**: Terminal-style glass card with syntax highlighting
- **Stats Counter**: Animated numbers (secrets, teams, uptime)

### Interactions
- Smooth scroll animations
- Hover lift on cards (translateY -4px)
- Glow shadow on hover
- Fade-in on scroll

---

## 2. LOGIN PAGE

### Layout
```
┌─────────────────────────────────────────────┐
│  Full-screen gradient background            │
│  (Animated particles)                       │
│                                             │
│  ┌─────────────────────────────┐            │
│  │  GLASS LOGIN CARD           │            │
│  │  (max-w-md, centered)       │            │
│  │                             │            │
│  │  [EnvShield Logo]           │            │
│  │                             │            │
│  │  Welcome Back               │            │
│  │  Sign in to your account    │            │
│  │                             │            │
│  │  Email Input (Glass)        │            │
│  │  [user@example.com]         │            │
│  │                             │            │
│  │  Password Input (Glass)     │            │
│  │  [••••••••••]               │            │
│  │                             │            │
│  │  [✓] Remember me  [Forgot?] │            │
│  │                             │            │
│  │  [Sign In Button]           │            │
│  │  (Blue gradient, glow)      │            │
│  │                             │            │
│  │  ─────── OR ───────         │            │
│  │                             │            │
│  │  [GitHub] [Google]          │            │
│  │  (Glass buttons)            │            │
│  │                             │            │
│  │  No account? Sign up →      │            │
│  └─────────────────────────────┘            │
│                                             │
└─────────────────────────────────────────────┘
```

### Components
- **Glass Card**: Centered, max-w-md, blur backdrop
- **Input Fields**: Glass style, focus glow (blue)
- **Buttons**: Primary (gradient), Secondary (outline)
- **Error State**: Red glow + shake animation
- **Loading State**: Shimmer effect on button

### Validations
- Email format validation
- Password strength indicator
- Real-time error messages
- Disabled submit until valid

---

## 3. SIGNUP PAGE

### Layout
Similar to login but with additional fields:
```
Email Input
Password Input (with strength meter)
Confirm Password Input
Full Name Input
Company (optional)
Terms & Privacy Checkbox
[Create Account Button]
```

### Strength Meter
```
Weak:     Red (#EF4444)
Fair:     Amber (#F59E0B)
Good:     Blue (#3B82F6)
Strong:   Green (#10B981)
```

---

## 4. DASHBOARD HOME

### Layout
```
┌──────────────────────────────────────────────────────┐
│  Sidebar │ Main Content                              │
│          │                                            │
│  [Logo]  │  ┌─────────────────────────────────┐      │
│          │  │ Welcome Back, [Name]!           │      │
│  Projects│  │ [Quick Actions: + Project]      │      │
│  Tokens  │  └─────────────────────────────────┘      │
│  Settings│                                            │
│          │  STATS OVERVIEW (3-column)                │
│  [Theme] │  ┌──────────┬──────────┬──────────┐      │
│          │  │Projects  │Variables │Activity  │      │
│          │  │   12     │   487    │   156    │      │
│          │  └──────────┴──────────┴──────────┘      │
│          │                                            │
│          │  RECENT PROJECTS (Grid)                   │
│          │  ┌─────────────┬─────────────┐           │
│          │  │ Project A   │ Project B   │           │
│          │  │ Glass Card  │ Glass Card  │           │
│          │  └─────────────┴─────────────┘           │
│          │                                            │
│          │  RECENT ACTIVITY (Timeline)               │
│          │  ┌─────────────────────────────────┐      │
│          │  │ • User X updated variable Y     │      │
│          │  │ • User Z created environment W  │      │
│          │  └─────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

### Sidebar
- Width: 240px
- Glass background with blur
- Active state: Gradient highlight + glow
- Hover: Opacity increase
- User avatar + dropdown at bottom

### Stats Cards
- 3-column grid
- Glass cards with number animation
- Icon + metric + label
- Subtle gradient background

### Project Cards
- Grid layout (3 columns desktop, 1 mobile)
- Hover: Lift effect (translateY -4px)
- Shows: Name, env count, last updated
- Action menu (⋮) top-right

### Activity Timeline
- Vertical timeline with dots
- Glass container
- Avatar + action + timestamp
- Color-coded by action type

---

## 5. PROJECTS PAGE

### Layout
```
┌──────────────────────────────────────────────────────┐
│  Sidebar │ Projects                                  │
│          │                                            │
│          │  ┌────────────────────────────────┐       │
│          │  │ 🔍 Search | Filter | + New    │       │
│          │  └────────────────────────────────┘       │
│          │                                            │
│          │  PROJECT GRID (3 columns)                 │
│          │  ┌─────────┬─────────┬─────────┐         │
│          │  │Project 1│Project 2│Project 3│         │
│          │  │         │         │         │         │
│          │  │3 envs   │5 envs   │2 envs   │         │
│          │  │124 vars │89 vars  │45 vars  │         │
│          │  │         │         │         │         │
│          │  │[Open]   │[Open]   │[Open]   │         │
│          │  └─────────┴─────────┴─────────┘         │
│          │                                            │
│          │  [Load More / Pagination]                 │
└──────────────────────────────────────────────────────┘
```

### Project Card Details
```
┌─────────────────────────────────┐
│  [Project Icon] Project Name    │
│  Description text...            │
│                                 │
│  3 Environments • 124 Variables │
│  Updated 2 hours ago            │
│                                 │
│  👤 👤 👤 +2                    │
│  (Team member avatars)          │
│                                 │
│  [Open] [Settings ⋮]           │
└─────────────────────────────────┘
```

### Interactions
- Glass card with hover glow
- Team avatars stack overlap
- Dropdown menu: Edit, Members, Settings, Delete
- Search filters by name/description
- Sort by: Created, Updated, Name

---

## 6. VARIABLE MANAGEMENT PAGE (CRITICAL)

### Layout
```
┌──────────────────────────────────────────────────────┐
│  Breadcrumb: Projects > MyApp > Production           │
├──────────────────────────────────────────────────────┤
│  ENVIRONMENT TABS                                    │
│  [Development] [Staging] [Production*]               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐     │
│  │ 🔍 Search | Filter | [Import] [Export] [+]│     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  GLASS TABLE CONTAINER                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ KEY      │ VALUE      │ UPDATED   │ ⋮      │   │
│  ├──────────────────────────────────────────────┤   │
│  │ 🔒 API_K │ ••••••••   │ 2h ago    │ ⋮      │   │
│  │ 🔒 DB_UR │ ••••••••   │ 1d ago    │ ⋮      │   │
│  │ 🔒 SECRET│ ••••••••   │ 3d ago    │ ⋮      │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  87 variables • Last sync: 5 min ago                │
└──────────────────────────────────────────────────────┘
```

### Variable Row Interactions
- **Hover**: Highlight row with subtle glow
- **Click Key**: Copy to clipboard
- **Click Value**: 
  - If permission: Show decrypted value
  - Else: "No permission" tooltip
- **Eye Icon**: Toggle reveal/hide
- **Copy Icon**: Copy to clipboard + toast
- **Edit Icon**: Open edit modal
- **Menu (⋮)**: History, Duplicate, Delete

### Add/Edit Variable Modal
```
┌─────────────────────────────────┐
│  Add Variable                   │
├─────────────────────────────────┤
│  Key                            │
│  [Input: API_KEY]               │
│                                 │
│  Value                          │
│  [Input: sk_live_...]           │
│  [Generate Random] [From File]  │
│                                 │
│  Description (optional)         │
│  [Textarea]                     │
│                                 │
│  🔒 Auto-encrypted AES-256      │
│                                 │
│  [Cancel] [Add Variable]        │
└─────────────────────────────────┘
```

### Import Modal
- Drag-drop zone for .env file
- Preview parsed variables
- Conflict resolution UI
- Bulk add confirmation

### Export Options
- Download as .env file
- Copy to clipboard
- Share link (encrypted)

---

## 7. TEAM MEMBERS PAGE

### Layout
```
┌──────────────────────────────────────────────────────┐
│  Project Settings > Team Members                     │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐     │
│  │ 🔍 Search | [+ Invite Member]              │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ AVATAR │ NAME    │ EMAIL     │ ROLE  │ ⋮    │   │
│  ├──────────────────────────────────────────────┤   │
│  │   👤   │ John    │ john@...  │ OWNER │ ⋮    │   │
│  │   👤   │ Jane    │ jane@...  │ ADMIN │ ⋮    │   │
│  │   👤   │ Bob     │ bob@...   │ DEV   │ ⋮    │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Role Badges
- Pill-shaped with glass effect
- Color-coded:
  - Owner: Gold gradient
  - Admin: Blue gradient
  - Developer: Green gradient
  - Viewer: Gray gradient
- Dropdown to change role (if permission)

### Invite Modal
- Email input with validation
- Role selector (radio buttons)
- Permission preview
- Send invitation button

---

## 8. AUDIT LOGS PAGE

### Layout
```
┌──────────────────────────────────────────────────────┐
│  Audit Logs                                          │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐     │
│  │ Date Range | User | Action | [Export CSV]  │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  TIMELINE VIEW                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │ ● 2024-10-27 12:30 PM                       │   │
│  │   👤 John Doe updated DB_URL                │   │
│  │   Production • IP: 192.168.1.1              │   │
│  │                                              │   │
│  │ ● 2024-10-27 11:15 AM                       │   │
│  │   👤 Jane Smith created environment         │   │
│  │   Staging • IP: 192.168.1.5                 │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Features
- Timeline dots color-coded by severity
- Expandable entries for metadata
- Real-time updates (polling/websocket)
- Export to CSV/JSON
- Infinite scroll

---

## 9. API TOKENS PAGE

### Layout
```
┌──────────────────────────────────────────────────────┐
│  API Tokens                                          │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐     │
│  │ 🔍 Search | [+ Create Token]               │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ NAME        │ CREATED    │ LAST USED │ ⋮    │   │
│  ├──────────────────────────────────────────────┤   │
│  │ Production  │ 2 weeks ago│ 5 min ago │ ⋮    │   │
│  │ Dev Token   │ 1 month ago│ 1 day ago │ ⋮    │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Token Card
- Name, created date, last used
- Copy button (one-time reveal)
- Revoke button
- Expiration indicator

---

## 10. USER SETTINGS PAGE

### Tabs
1. **Profile**: Name, email, avatar
2. **Security**: Password change, 2FA setup
3. **Preferences**: Theme, notifications, language

### Layout
```
┌──────────────────────────────────────────────────────┐
│  Settings                                            │
├──────────────────────────────────────────────────────┤
│  [Profile] [Security] [Preferences]                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  PROFILE TAB                                         │
│  ┌────────────────────────────────────────────┐     │
│  │ Avatar Upload                              │     │
│  │ Full Name: [Input]                         │     │
│  │ Email: [Input]                             │     │
│  │ [Save Changes]                             │     │
│  └────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────┘
```

