# 🧩 Component Library
## Detailed Component Specifications & Variants

---

## 1. CORE UI PRIMITIVES

### Button Component

**Variants**:
- **Primary**: Blue gradient + glow hover
- **Secondary**: Glass border + cyan accent
- **Tertiary**: Text only, no background
- **Danger**: Red accent, destructive action
- **Ghost**: Transparent, hover highlight

**Sizes**:
- **sm**: 32px height, 12px font
- **md**: 40px height, 14px font (default)
- **lg**: 48px height, 16px font

**States**:
- Default
- Hover (lift + glow)
- Active (scale 0.98)
- Disabled (opacity 0.5)
- Loading (shimmer animation)

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}
```

---

### Input Component

**Variants**:
- **text**: Default text input
- **email**: Email validation
- **password**: Hidden text with reveal toggle
- **search**: Search icon + clear button
- **number**: Number validation

**States**:
- Default
- Focus (blue glow border)
- Error (red glow + error message)
- Disabled (opacity 0.5)
- Success (green checkmark)

**Props**:
```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'search' | 'number';
  placeholder?: string;
  value?: string;
  error?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClear?: () => void;
}
```

---

### Card Component

**Variants**:
- **default**: Glass surface + shadow
- **hover**: Lift effect on hover
- **bordered**: Blue border + glass
- **interactive**: Cursor pointer + hover state

**Props**:
```typescript
interface CardProps {
  variant?: 'default' | 'hover' | 'bordered' | 'interactive';
  className?: string;
  children: React.ReactNode;
}
```

---

### Badge Component

**Variants**:
- **default**: Gray background
- **primary**: Blue background
- **success**: Green background
- **warning**: Amber background
- **error**: Red background

**Sizes**:
- **sm**: 20px height
- **md**: 24px height (default)
- **lg**: 32px height

**Props**:
```typescript
interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}
```

---

### Modal Component

**Features**:
- Glass backdrop with blur
- Centered on screen
- Smooth fade-in animation
- Close on escape key
- Click outside to close (optional)

**Props**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdropClick?: boolean;
}
```

---

### Dropdown Component

**Features**:
- Glass menu with blur
- Keyboard navigation
- Click outside to close
- Position auto-adjust

**Props**:
```typescript
interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  onSelect: (item: DropdownItem) => void;
}

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  divider?: boolean;
  danger?: boolean;
}
```

---

### Tooltip Component

**Features**:
- Glass background
- Auto-position (top/bottom/left/right)
- Delay on hover (200ms)
- Arrow pointer

**Props**:
```typescript
interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactNode;
}
```

---

### Tabs Component

**Features**:
- Glass tab bar
- Active indicator (blue underline)
- Smooth transition
- Keyboard navigation

**Props**:
```typescript
interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}
```

---

### Table Component

**Features**:
- Glass container
- Striped rows
- Sortable columns
- Selectable rows (checkbox)
- Pagination

**Props**:
```typescript
interface TableProps {
  columns: Column[];
  data: any[];
  sortable?: boolean;
  selectable?: boolean;
  pagination?: boolean;
  onRowClick?: (row: any) => void;
}

interface Column {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}
```

---

### Toast Component

**Variants**:
- **success**: Green background
- **error**: Red background
- **warning**: Amber background
- **info**: Blue background

**Features**:
- Auto-dismiss (5s default)
- Action button (optional)
- Close button
- Glass background

**Props**:
```typescript
interface ToastProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}
```

---

### Skeleton Component

**Features**:
- Shimmer animation
- Matches component shape
- Glass background

**Props**:
```typescript
interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect';
  width?: string;
  height?: string;
  count?: number;
}
```

---

### Avatar Component

**Features**:
- Image or initials
- Multiple sizes
- Status indicator (online/offline)
- Fallback to initials

**Props**:
```typescript
interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'away';
}
```

---

## 2. LAYOUT COMPONENTS

### Navbar Component

**Structure**:
```
[Logo] [Links] [Theme Toggle] [User Menu]
```

**Features**:
- Fixed top position
- Glass background
- Sticky on scroll
- Mobile responsive (hamburger menu)

**Props**:
```typescript
interface NavbarProps {
  logo?: React.ReactNode;
  links?: NavLink[];
  onThemeToggle?: () => void;
  userMenu?: React.ReactNode;
}
```

---

### Sidebar Component

**Features**:
- 240px width (desktop)
- Glass background
- Active state highlighting
- Collapsible (mobile)
- User profile at bottom

**Props**:
```typescript
interface SidebarProps {
  items: SidebarItem[];
  activeItem?: string;
  onItemClick?: (item: SidebarItem) => void;
  userProfile?: UserProfile;
}
```

---

### DashboardShell Component

**Structure**:
```
┌──────────────────────────────┐
│ Navbar                       │
├──────────────────────────────┤
│ Sidebar │ Main Content       │
│         │                    │
└──────────────────────────────┘
```

**Features**:
- Responsive layout
- Sidebar toggle
- Main content area

---

### Footer Component

**Sections**:
- Links (Product, Company, Resources)
- Social icons
- Copyright
- Theme toggle

---

## 3. FEATURE COMPONENTS

### ProjectCard Component

**Display**:
```
┌─────────────────────────────────┐
│ [Icon] Project Name             │
│ Description text...             │
│                                 │
│ 3 Environments • 124 Variables  │
│ Updated 2 hours ago             │
│                                 │
│ 👤 👤 👤 +2                     │
│                                 │
│ [Open] [Settings ⋮]            │
└─────────────────────────────────┘
```

**Props**:
```typescript
interface ProjectCardProps {
  project: Project;
  onOpen?: () => void;
  onSettings?: () => void;
}
```

---

### VariableTable Component

**Columns**:
- Key (with lock icon)
- Value (masked)
- Updated (timestamp)
- Actions (menu)

**Features**:
- Search/filter
- Bulk actions
- Copy to clipboard
- Reveal/hide values
- Edit/delete actions

**Props**:
```typescript
interface VariableTableProps {
  variables: Variable[];
  environment: Environment;
  onEdit?: (variable: Variable) => void;
  onDelete?: (variable: Variable) => void;
  onImport?: () => void;
  onExport?: () => void;
}
```

---

### VariableRow Component

**Interactions**:
- Hover: Highlight + show actions
- Click key: Copy
- Click value: Reveal (if permission)
- Eye icon: Toggle visibility
- Menu: History, Duplicate, Delete

---

### AddVariableModal Component

**Fields**:
- Key (required, unique)
- Value (required)
- Description (optional)
- Generate random button
- From file button

**Validation**:
- No duplicate keys
- Value required
- Auto-encrypt indicator

---

### MemberList Component

**Display**:
```
┌──────────────────────────────────┐
│ AVATAR │ NAME │ EMAIL │ ROLE │ ⋮ │
├──────────────────────────────────┤
│   👤   │ John │ j@... │ OWNER│ ⋮ │
│   👤   │ Jane │ j@... │ ADMIN│ ⋮ │
└──────────────────────────────────┘
```

**Features**:
- Role badges (color-coded)
- Change role dropdown
- Remove member button
- Invite new member button

---

### AuditLogTable Component

**Columns**:
- Timestamp
- User (avatar + name)
- Action (description)
- Entity (project/environment/variable)
- IP Address (expandable)

**Features**:
- Timeline view
- Filter by action/user/date
- Export to CSV
- Real-time updates

---

### RoleBadge Component

**Roles**:
- **Owner**: Gold gradient
- **Admin**: Blue gradient
- **Developer**: Green gradient
- **Viewer**: Gray gradient

**Features**:
- Pill shape
- Icon + label
- Dropdown to change (if permission)

---

## 4. SHARED COMPONENTS

### EmptyState Component

**Display**:
```
┌─────────────────────────────┐
│                             │
│      [Large Icon]           │
│                             │
│   No Projects Yet           │
│   Create your first project │
│   to get started            │
│                             │
│   [Create Project Button]   │
│                             │
└─────────────────────────────┘
```

**Props**:
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}
```

---

### LoadingSpinner Component

**Variants**:
- **default**: Rotating circle
- **dots**: Bouncing dots
- **shimmer**: Shimmer animation

**Sizes**:
- **sm**: 24px
- **md**: 40px (default)
- **lg**: 64px

---

### ErrorBoundary Component

**Features**:
- Catch React errors
- Display error message
- Retry button
- Log to error tracking

---

### SearchBar Component

**Features**:
- Search icon
- Clear button
- Debounced search (300ms)
- Placeholder text

**Props**:
```typescript
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
}
```

---

### CommandPalette Component

**Trigger**: Cmd+K (Mac) / Ctrl+K (Windows)

**Features**:
- Quick navigation
- Command search
- Recent commands
- Keyboard shortcuts

**Commands**:
- Create project
- Create environment
- Add variable
- Go to project
- Settings
- Logout

---

### Breadcrumbs Component

**Display**:
```
Projects > MyApp > Production > Variables
```

**Features**:
- Clickable links
- Last item not clickable
- Separator icon

---

### StatusIndicator Component

**States**:
- **online**: Green dot
- **offline**: Gray dot
- **away**: Amber dot

**Props**:
```typescript
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'away';
  size?: 'sm' | 'md' | 'lg';
}
```

---

## 5. ANIMATION WRAPPERS

### FadeIn Component

**Props**:
```typescript
interface FadeInProps {
  duration?: number;
  delay?: number;
  children: React.ReactNode;
}
```

---

### SlideIn Component

**Props**:
```typescript
interface SlideInProps {
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  children: React.ReactNode;
}
```

---

### GlassReveal Component

**Features**:
- Blur animation
- Opacity fade
- Staggered children

---

### PageTransition Component

**Features**:
- Smooth page transitions
- Fade between pages
- Preserve scroll position

