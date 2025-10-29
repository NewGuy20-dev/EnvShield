# EnvShield Frontend UI/UX & Missing Logic - Detailed Implementation Plan

**Version**: 1.0  
**Last Updated**: 2025-10-28  
**Status**: Active Implementation

---

## 📊 Project Overview

Implement a complete, production-ready glassmorphic UI/UX for EnvShield following the detailed specifications in the docs, plus all missing backend logic for authentication, API routes, and data management.

**Timeline**: 8-10 weeks  
**Team Size**: 1-2 developers  
**Sprints**: 2-week iterations

---

## 🎯 PHASE 0: Foundation & Design System (Week 1)

### Status: ✅ COMPLETED

### 0.1 Tailwind Configuration & Design Tokens
**Files**: `tailwind.config.ts`, `app/globals.css`

**✅ Tasks Completed**:
- [x] Configure custom colors (primary #3B82F6, secondary #06B6D4, glass surfaces)
- [x] Add backdrop blur utilities (16px for light, 18px for dark)
- [x] Define box shadows (glass-light, glass-dark, glow-primary, glow-secondary)
- [x] Configure border radius tokens (sm: 12px, md: 16px, lg: 20px)
- [x] Add animation keyframes (fadeIn, slideIn, slideUp, shimmer, glassReveal)
- [x] Set up font families (Inter for UI, JetBrains Mono for code)
- [x] Create CSS variables for theme switching
- [x] Implement dark mode classes with proper transitions

### 0.2 Theme Provider System
**Files**: `lib/theme-provider.tsx`, `components/shared/theme-toggle.tsx`

**✅ Tasks Completed**:
- [x] Create React context for light/dark/system theme modes
- [x] Implement localStorage persistence
- [x] Add system preference detection
- [x] Prevent flash of wrong theme on page load
- [x] Build animated theme toggle button (moon/sun icons)
- [x] Add smooth 300ms transitions between modes

### 0.3 Core UI Primitives (10 Components)
**Directory**: `components/ui/`

**✅ Components Created**:
1. [x] **Button** (`button.tsx`): 5 variants (primary, secondary, tertiary, danger, ghost), 3 sizes, loading/disabled states
2. [x] **Input** (`input.tsx`): Text/email/password/search/number types, focus glow, error states, icon support, password reveal toggle
3. [x] **Card** (`card.tsx`): Default/hover/bordered/interactive variants with glass effects + subcomponents
4. [x] **Badge** (`badge.tsx`): 5 color variants, 3 sizes, icon support
5. [x] **Modal** (`modal.tsx`): Backdrop blur, escape to close, click outside, smooth animations
6. [x] **Skeleton** (`skeleton.tsx`): Shimmer animation, multiple variants
7. [x] **Avatar** (`avatar.tsx`): Image/initials, sizes, status indicator (online/offline/away)

**TODO - Remaining UI Primitives**:
- [ ] Dropdown (`dropdown.tsx`): Keyboard navigation, auto-positioning, glass menu
- [ ] Tooltip (`tooltip.tsx`): 4 positions, delay, glass background
- [ ] Tabs (`tabs.tsx`): Animated underline, keyboard navigation
- [ ] Table (`table.tsx`): Columns, sorting, selectable rows, pagination
- [ ] Toast (`toast.tsx`): Auto-dismiss notifications

### 0.4 Layout Components
**Directory**: `components/layout/`

**TODO**:
- [ ] Navbar (`navbar.tsx`): Fixed top, glass background, logo, links, theme toggle, user menu
- [ ] Sidebar (`sidebar.tsx`): 240px width, collapsible, active state, user profile at bottom
- [ ] DashboardShell (`dashboard-shell.tsx`): Navbar + Sidebar + Content area, responsive
- [ ] Footer (`footer.tsx`): Links, social, copyright

### 0.5 Shared Components
**Directory**: `components/shared/`

**✅ Completed**:
- [x] EmptyState (`empty-state.tsx`): Icon, title, description, CTA button
- [x] LoadingSpinner (`loading-spinner.tsx`): 3 variants (circle, dots, shimmer)
- [x] ThemeToggle (`theme-toggle.tsx`): Light/dark theme switching

**TODO**:
- [ ] ErrorBoundary (`error-boundary.tsx`): Catch errors, retry button
- [ ] Breadcrumbs (`breadcrumbs.tsx`): Clickable links, separators
- [ ] SearchBar (`search-bar.tsx`): Debounced search (300ms), clear button
- [ ] CommandPalette (`command-palette.tsx`): Cmd+K trigger, quick navigation

### 0.6 Animation Wrappers
**Directory**: `components/animations/`

**TODO**:
- [ ] FadeIn (`fade-in.tsx`): Configurable duration/delay
- [ ] SlideIn (`slide-in.tsx`): 4 directions
- [ ] GlassReveal (`glass-reveal.tsx`): Blur + opacity animation
- [ ] PageTransition (`page-transition.tsx`): Route change animations

### 0.7 Landing Page
**File**: `app/page.tsx`

**✅ Completed**:
- [x] Full-screen glassmorphic navbar with logo and CTAs
- [x] Hero section with gradient backgrounds and animated particles
- [x] Features section (6 cards with hover lift effects)
- [x] CLI preview terminal card
- [x] Final CTA section
- [x] Footer with branding
- [x] Responsive design (mobile, tablet, desktop)

**Status**: Landing page is stunning with full animations and dark/light mode support.

---

## 🔐 PHASE 1: Authentication System (Weeks 2-3)

### Status: ⏳ NOT STARTED

### 1.1 Better Auth Integration
**Files**: `lib/betterAuth.ts`, `lib/auth-middleware.ts`

**Tasks**:
- [ ] Install and configure Better Auth SDK
- [ ] Create auth wrapper functions (createUser, verifyPassword, createSession, invalidateSession)
- [ ] Implement session cookie management
- [ ] Build API token authentication for CLI
- [ ] Create `getAuthenticatedUserFromRequest` middleware (checks Bearer token then session)
- [ ] Add bcrypt for token hashing

### 1.2 Authentication Pages
**Directory**: `app/(auth)/`

**Pages to Create**:

1. **Login** (`login/page.tsx`):
   - Full-screen gradient background with animated particles
   - Centered glass card (max-w-md)
   - Email/password inputs with validation
   - Remember me checkbox
   - Forgot password link
   - Social auth buttons (GitHub, Google)
   - Error shake animation
   - Loading shimmer on submit

2. **Signup** (`register/page.tsx`):
   - Similar glass card layout
   - Email, password, confirm password, name inputs
   - Real-time password strength meter (Weak/Fair/Good/Strong)
   - Terms & privacy checkbox
   - Form validation with Zod
   - Success redirect to dashboard

3. **Forgot Password** (`forgot-password/page.tsx`):
   - Email input
   - Send reset link button
   - Success message

4. **Verify Email** (`verify-email/page.tsx`):
   - 6-digit code input
   - Resend button with timer
   - Auto-submit on complete

### 1.3 Authentication API Routes
**Directory**: `app/api/v1/auth/`

**Routes to Create**:
- [ ] `POST /register`: Create user with bcrypt password hash
- [ ] `POST /login`: Verify credentials, create session cookie
- [ ] `POST /logout`: Invalidate session
- [ ] `POST /password-reset`: Send reset email
- [ ] `POST /verify-email`: Verify email code
- [ ] `GET /session`: Get current session info

### 1.4 CLI Authentication
**Directory**: `app/api/v1/cli/`

**Routes to Create**:
- [ ] `POST /auth`: Verify email/password, generate API token (prefix: esh_), hash with bcrypt, store in DB
- [ ] `GET /whoami`: Return user + token info from Bearer token

### 1.5 Protected Routes Middleware
**File**: `middleware.ts`

**Tasks**:
- [ ] Check authentication on all dashboard routes
- [ ] Redirect to /login with return URL
- [ ] Allow public routes (/, /login, /register)

---

## 📁 PHASE 2: Project Management (Weeks 4-5)

### Status: ⏳ NOT STARTED

### 2.1 Dashboard Home Page
**File**: `app/(dashboard)/page.tsx`

**Components**:
- [ ] Welcome banner with user name
- [ ] Quick action buttons (+ New Project)
- [ ] 3 stat cards (Projects count, Variables count, Activity count) with animated numbers
- [ ] Recent projects grid (3 columns, glass cards)
- [ ] Activity timeline (vertical timeline with dots, avatars)

### 2.2 Projects List Page
**File**: `app/(dashboard)/projects/page.tsx`

**Features**:
- [ ] Search bar with debounce (300ms)
- [ ] Filter dropdown (status, date)
- [ ] Sort options (name, created, updated)
- [ ] Project grid (3 columns desktop, 1 mobile)
- [ ] Pagination or infinite scroll
- [ ] Empty state with CTA
- [ ] Loading skeletons

### 2.3 Project Card Component
**File**: `components/features/projects/project-card.tsx`

**Display**:
- [ ] Project icon/avatar
- [ ] Name + description (truncated)
- [ ] Environment count badge
- [ ] Variable count badge
- [ ] Last updated timestamp
- [ ] Team member avatars (stacked overlap)
- [ ] Action menu (⋮): Edit, Members, Settings, Delete
- [ ] Hover: lift effect (translateY -4px) + glow shadow

### 2.4 Create Project Modal
**File**: `components/features/projects/create-project-modal.tsx`

**Fields**:
- [ ] Project name (required, unique validation)
- [ ] Description (optional)
- [ ] Auto-generate slug from name
- [ ] Cancel/Create buttons
- [ ] Success toast
- [ ] Zod validation

### 2.5 Project Detail & Settings
**Files**:
- [ ] `app/(dashboard)/projects/[slug]/page.tsx`
- [ ] `app/(dashboard)/projects/[slug]/settings/page.tsx`

**Features**:
- [ ] Tabs: Overview | Environments | Members | Settings | Audit
- [ ] Edit project name/description
- [ ] Delete project (with confirmation modal)
- [ ] Export project data

### 2.6 Team Members Management
**File**: `app/(dashboard)/projects/[slug]/members/page.tsx`

**Components**:
- [ ] Members table (avatar, name, email, role badge, actions)
- [ ] Search members
- [ ] Invite member button → modal
- [ ] Role badges (Owner: gold, Admin: blue, Developer: green, Viewer: gray)
- [ ] Change role dropdown (if permission)
- [ ] Remove member button

**Invite Modal**:
- [ ] Email input with validation
- [ ] Role selector (radio buttons)
- [ ] Permission preview
- [ ] Send invitation

### 2.7 Project API Routes
**Directory**: `app/api/v1/projects/`

**Routes to Create**:
- [ ] `GET /`: List user's projects with role and environments
- [ ] `POST /`: Create project, add user as OWNER
- [ ] `GET /[id]`: Get project details with members/environments
- [ ] `PATCH /[id]`: Update project (OWNER/ADMIN)
- [ ] `DELETE /[id]`: Delete project (OWNER only)
- [ ] `POST /[id]/members`: Invite member (OWNER/ADMIN)
- [ ] `PATCH /[id]/members/[memberId]`: Update role (OWNER)
- [ ] `DELETE /[id]/members/[memberId]`: Remove member (OWNER/ADMIN)

**Validation**:
- [ ] Use Zod schemas for request validation
- [ ] Check permissions with `lib/permissions.ts`
- [ ] Log all actions to audit table

---

## 🔑 PHASE 3: Variable Management (Weeks 6-7)

### Status: ⏳ NOT STARTED

### 3.1 Environment Management
**Files**:
- [ ] `app/api/v1/environments/route.ts`
- [ ] `app/api/v1/environments/[id]/route.ts`

**Routes to Create**:
- [ ] `GET /projects/[projectId]/environments`: List environments
- [ ] `POST /projects/[projectId]/environments`: Create (OWNER/ADMIN)
- [ ] `PATCH /environments/[id]`: Update (OWNER/ADMIN)
- [ ] `DELETE /environments/[id]`: Delete (OWNER)

### 3.2 Variables Page
**File**: `app/(dashboard)/projects/[slug]/environments/[envSlug]/page.tsx`

**Layout**:
- [ ] Breadcrumb navigation (Projects > Project > Environment)
- [ ] Environment tabs (Dev, Staging, Production)
- [ ] Search bar
- [ ] Filter dropdown
- [ ] Import/Export buttons
- [ ] Add variable button
- [ ] Variable table
- [ ] Status: "87 variables • Last sync: 5 min ago"

### 3.3 Variable Table Component
**File**: `components/features/variables/variable-table.tsx`

**Columns**:
- [ ] 🔒 Key (clickable to copy)
- [ ] Value (masked: ••••••••)
- [ ] Updated (timestamp)
- [ ] Actions (⋮ menu)

**Row Interactions**:
- [ ] Hover: highlight row with subtle glow
- [ ] Click key: copy to clipboard + toast
- [ ] Eye icon: toggle reveal/hide (if permission)
- [ ] Copy icon: copy value
- [ ] Edit icon: open edit modal
- [ ] Menu: History, Duplicate, Delete

### 3.4 Add/Edit Variable Modals
**Files**:
- [ ] `components/features/variables/add-variable-modal.tsx`
- [ ] `components/features/variables/edit-variable-modal.tsx`

**Add Modal Fields**:
- [ ] Key input (required, unique, regex: [A-Z0-9_]+)
- [ ] Value input (required, multiline)
- [ ] Description textarea (optional)
- [ ] Generate random button
- [ ] From file button
- [ ] 🔒 "Auto-encrypted AES-256" indicator

**Edit Modal**:
- [ ] Key (read-only)
- [ ] Value (editable)
- [ ] Description (editable)
- [ ] Show history button

### 3.5 Import/Export Functionality
**Components**:
- [ ] `components/features/variables/import-modal.tsx`
- [ ] `components/features/variables/export-dropdown.tsx`

**Import**:
- [ ] Drag-drop zone for .env file
- [ ] Parse KEY=VALUE format
- [ ] Show preview table
- [ ] Conflict resolution (Skip/Replace/Merge)
- [ ] Bulk import confirmation

**Export**:
- [ ] Format selector (CSV, JSON, .env)
- [ ] Download button
- [ ] Copy to clipboard
- [ ] Share encrypted link

### 3.6 Variable History
**File**: `app/(dashboard)/projects/[slug]/environments/[envSlug]/history/page.tsx`

**Features**:
- [ ] Timeline view of all changes
- [ ] Filter by variable/user/date
- [ ] Show old vs new value (decrypted if permission)
- [ ] Revert to previous version button
- [ ] Pagination

### 3.7 Variables API Routes
**Directory**: `app/api/v1/variables/`

**Routes to Create**:
- [ ] `GET /projects/[projectId]/environments/[envId]/variables`: List (decrypt=true for OWNER/ADMIN/DEVELOPER)
- [ ] `POST /projects/[projectId]/environments/[envId]/variables`: Create, encrypt value, log to audit
- [ ] `PATCH /variables/[id]`: Update, create history entry, encrypt new value
- [ ] `DELETE /variables/[id]`: Soft delete, log to audit
- [ ] `GET /variables/[id]/history`: Get change history
- [ ] `POST /variables/import`: Bulk import from .env
- [ ] `GET /variables/export`: Export to format

**Encryption Flow**:
1. Receive plaintext value from frontend
2. Call `encryptForStorage(value)` from `lib/encryption.ts`
3. Store encrypted JSON in DB
4. On decrypt request: check permission, call `decryptFromStorage(stored)`
5. Return decrypted value only to authorized users

### 3.8 Permission Checks
**Every Variable Operation**:
- [ ] View masked: All members (VIEWER+)
- [ ] View decrypted: OWNER/ADMIN/DEVELOPER
- [ ] Create/Edit/Delete: OWNER/ADMIN/DEVELOPER
- [ ] View history: OWNER/ADMIN/DEVELOPER
- [ ] Revert: OWNER/ADMIN

---

## 📊 PHASE 4: Audit & Tokens (Week 8)

### Status: ⏳ NOT STARTED

### 4.1 Audit Logs Page
**File**: `app/(dashboard)/projects/[slug]/audit/page.tsx`

**Features**:
- [ ] Timeline view with colored dots (severity-based)
- [ ] Filter by action type (dropdown)
- [ ] Filter by user (dropdown)
- [ ] Date range picker
- [ ] Search by entity
- [ ] Export to CSV button
- [ ] Real-time updates (polling every 30s)
- [ ] Infinite scroll or pagination

**Timeline Entry**:
- [ ] Timestamp
- [ ] User avatar + name
- [ ] Action description ("John updated DB_URL")
- [ ] Entity (Environment, Variable)
- [ ] IP address (expandable)
- [ ] User agent (expandable)
- [ ] Metadata JSON (expandable)

### 4.2 Audit Logging Implementation
**File**: `lib/audit.ts`

**Function**: `createAuditLog`
- [ ] Parameters: projectId, userId, action, entityType, entityId, metadata, req
- [ ] Extract IP address from req.headers
- [ ] Extract user agent from req.headers
- [ ] Insert into audit_logs table
- [ ] Call after every sensitive operation

**Actions to Log**:
- [ ] User login/logout
- [ ] Project created/updated/deleted
- [ ] Environment created/updated/deleted
- [ ] Variable created/updated/deleted/viewed
- [ ] Member invited/role changed/removed
- [ ] API token created/revoked

### 4.3 API Tokens Page
**File**: `app/(dashboard)/tokens/page.tsx`

**Features**:
- [ ] Tokens list table
- [ ] Search tokens
- [ ] Create token button → modal
- [ ] Token columns: Name, Created, Last Used, Expires, Actions
- [ ] Copy button (one-time reveal)
- [ ] Revoke button (with confirmation)

### 4.4 Create Token Modal
**File**: `components/features/tokens/create-token-modal.tsx`

**Fields**:
- [ ] Token name (required)
- [ ] Expiration selector (30d, 90d, 1y, never)
- [ ] Scopes checkboxes (read, write, admin)
- [ ] Create button
- [ ] Show token once (with copy button)
- [ ] Warning: "Save this token, you won't see it again"

### 4.5 API Tokens Routes
**Directory**: `app/api/v1/tokens/`

**Routes to Create**:
- [ ] `GET /`: List user's tokens (with last used)
- [ ] `POST /`: Create token, hash with bcrypt, return plaintext once
- [ ] `DELETE /[id]`: Revoke token (set expiresAt to now)

### 4.6 User Settings Page
**File**: `app/(dashboard)/settings/page.tsx`

**Tabs**:
1. **Profile**: Avatar upload, name edit, email display
2. **Security**: Change password, 2FA setup
3. **Preferences**: Theme (light/dark/auto), notifications, language

---

## ✨ PHASE 5: Polish & Missing Features (Weeks 9-10)

### Status: ⏳ NOT STARTED

### 5.1 Remaining UI Components

**TODO - Dropdown, Tooltip, Tabs, Table, Toast**:
- [ ] Dropdown (`components/ui/dropdown.tsx`): Keyboard navigation, auto-positioning
- [ ] Tooltip (`components/ui/tooltip.tsx`): 4 positions, delay, glass bg
- [ ] Tabs (`components/ui/tabs.tsx`): Animated underline
- [ ] Table (`components/ui/table.tsx`): Columns, sorting, pagination
- [ ] Toast (`components/ui/toast.tsx`): Auto-dismiss notifications

### 5.2 Layout Components

**TODO - Navbar, Sidebar, DashboardShell**:
- [ ] Navbar (`components/layout/navbar.tsx`)
- [ ] Sidebar (`components/layout/sidebar.tsx`)
- [ ] DashboardShell (`components/layout/dashboard-shell.tsx`)

### 5.3 CLI Pull/Push Routes
**Directory**: `app/api/v1/cli/`

**Routes to Create**:
- [ ] `POST /pull`: Receive projectSlug + environment, return decrypted variables array
- [ ] `POST /push`: Receive projectSlug + environment + variables array, compute diff, encrypt and save

### 5.4 Micro-interactions
**Implement across all components**:
- [ ] Button hover: translateY(-2px) + glow
- [ ] Button active: scale(0.98)
- [ ] Card hover: translateY(-4px) + increased shadow
- [ ] Input focus: blue glow border
- [ ] Error input: red glow + shake animation
- [ ] Copy success: icon change (copy → checkmark) for 2s
- [ ] Toast animations: slide in from right
- [ ] Modal animations: backdrop fade + content scale
- [ ] Skeleton shimmer: gradient animation
- [ ] Page transitions: fade out → fade in

### 5.5 Accessibility Improvements
- [ ] All buttons have aria-labels
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus indicators (2px primary ring)
- [ ] Screen reader labels
- [ ] Color contrast WCAG AA compliance
- [ ] Respect prefers-reduced-motion

### 5.6 Error Handling
- [ ] Global error boundary
- [ ] API error toasts
- [ ] Network error messages
- [ ] 404 page (glass card with back button)
- [ ] 500 page (glass card with retry)
- [ ] Form validation errors
- [ ] Loading states on all async operations

### 5.7 Performance Optimizations
- [ ] Code splitting by route
- [ ] Dynamic imports for heavy components
- [ ] Image optimization (Next.js Image component)
- [ ] Font optimization (Google Fonts with display swap)
- [ ] Lazy load modals
- [ ] Debounce search inputs (300ms)
- [ ] Memoize expensive computations
- [ ] Virtual scrolling for long lists

### 5.8 Testing
- [ ] Unit tests for utilities (encryption, permissions)
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows (login, create project, add variable)

### 5.9 Deployment
- [ ] Configure environment variables in Vercel
- [ ] Run Prisma migrations on deploy
- [ ] Set up error tracking (Sentry)
- [ ] Configure monitoring
- [ ] Set up CI/CD (GitHub Actions)

---

## 📋 Implementation Order Summary

```
Week 1:  Design system, UI primitives, layout components (COMPLETED)
Week 2-3: Authentication (Better Auth, pages, API routes)
Week 4-5: Projects (CRUD, team management, API routes)
Week 6-7: Variables (CRUD, encryption, import/export, history)
Week 8:   Audit logs, API tokens, user settings
Week 9-10: Landing page, polish, testing, deployment
```

---

## 🔄 Dependency Map

```
Phase 0 (Foundation) ✅
    ↓
Phase 1 (Auth & Layout)
    ↓
Phase 2 (Projects) ← Can start in parallel with Phase 1
    ↓
Phase 3 (Variables) ← Depends on Phase 2
    ↓
Phase 4 (Audit & Tokens) ← Can start in parallel with Phase 3
    ↓
Phase 5 (Polish & Deploy) ← Depends on all previous phases
```

---

## 🎯 Success Criteria

### Phase 0 ✅
- [x] All components render correctly
- [x] Theme switching works smoothly
- [x] No console errors

### Phase 1
- [ ] Login/signup flow works end-to-end
- [ ] Protected routes redirect unauthenticated users
- [ ] Dashboard loads with correct layout
- [ ] Theme persists across sessions

### Phase 2
- [ ] Create/edit/delete projects works
- [ ] Invite members works
- [ ] Role-based UI updates correctly
- [ ] Permissions enforced on backend

### Phase 3
- [ ] Add/edit/delete variables works
- [ ] Import/export .env files works
- [ ] Encryption/decryption works
- [ ] History tracking works
- [ ] Permissions enforced (viewer can't edit)

### Phase 4
- [ ] Audit logs display correctly
- [ ] API tokens can be created/revoked
- [ ] User settings can be updated
- [ ] Real-time updates work

### Phase 5
- [ ] All tests pass
- [ ] Performance metrics meet targets
- [ ] Accessibility audit passes
- [ ] No critical bugs
- [ ] Production deployment successful

---

## 🚨 Critical Implementation Notes

1. **Never store plaintext secrets** in logs or error messages
2. **Check permissions** on every API route using `lib/permissions.ts`
3. **Log all sensitive operations** to audit table
4. **Encrypt before storage** using `encryptForStorage`
5. **Decrypt only for authorized users** with proper role checks
6. **Hash API tokens** with bcrypt before storing (cost factor 12)
7. **Validate all inputs** with Zod schemas
8. **Handle errors gracefully** with user-friendly messages
9. **Test permission boundaries** (can viewer edit? no!)
10. **Implement rate limiting** on auth endpoints

---

## 📊 Progress Tracking

**Completed**: 1/5 phases  
**In Progress**: 0 tasks  
**Total Tasks**: ~150+  
**Estimated Burn Rate**: 15-20 tasks/week

---

## 📝 Notes

- **Parallel Development**: Phases 2 and 4 can run in parallel with earlier phases
- **Code Review**: Implement peer review for all PRs
- **Testing**: Write tests as you go, not after
- **Documentation**: Keep docs updated with code changes
- **Feedback**: Get user feedback early and often

---

## 🎨 Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Custom CSS for glassmorphism
- **UI Components**: Custom built with Lucide React icons
- **State Management**: React Context (theme), Server State (API)
- **Validation**: Zod schemas
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **Encryption**: AES-256-GCM (Node.js crypto)
- **Deployment**: Vercel
- **CLI**: Commander, Axios, Chalk, Ora, Inquirer

---

## 📞 Contact & Questions

For questions or clarifications on this implementation plan, refer to:
- `docs/MAIN_DOC.md` - Core project documentation
- `docs/DESIGN_SYSTEM.md` - Design tokens and brand guidelines
- `docs/COMPONENT_LIBRARY.md` - Component specifications
- `docs/PAGE_SPECIFICATIONS.md` - Page layouts and interactions
- `docs/MICRO_INTERACTIONS.md` - Animation and micro-interaction details

