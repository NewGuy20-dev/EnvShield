# Onboarding System

## Overview
A beautiful, multi-step onboarding wizard that guides new users through initial setup. The wizard helps users create their first project and environment, ensuring a smooth first experience.

## Features

### ✨ Multi-Step Wizard
- **4 guided steps** with smooth animations
- **Progress indicator** showing current step
- **Back/Next navigation** with step validation
- **Skip option** for power users
- **Persistent data** across steps

### 🎯 Onboarding Steps

#### 1. Welcome Step
- Friendly greeting with user's name
- Overview of EnvShield features
- Quick feature highlights (Secure, Fast, Team-Ready)
- Estimated completion time

#### 2. Create Project Step
- Create first project with name and description
- Real-time API validation
- Error handling with helpful messages
- Tips for project organization

#### 3. Create Environment Step
- **Preset options**: Development, Staging, Production
- **Custom environment** creation
- One-click preset selection
- Environment descriptions

#### 4. Complete Step
- Success confirmation with celebration
- Quick stats summary
- **Optional CLI setup instructions** with copy button
- Next steps guidance
- Direct link to created project

## Technical Implementation

### Database Schema
```prisma
model User {
  id                  String   @id @default(cuid())
  email               String   @unique
  name                String?
  onboardingCompleted Boolean  @default(false) // ← New field
  // ... other fields
}
```

### Routes
```
app/
└── (onboarding)/
    ├── layout.tsx                          → Onboarding layout
    └── onboarding/
        └── page.tsx                        → Main onboarding page
```

### API Endpoints

#### GET /api/v1/user/onboarding-status
Check if user has completed onboarding:
```typescript
Response: {
  onboardingCompleted: boolean
}
```

#### POST /api/v1/user/complete-onboarding
Mark onboarding as completed:
```typescript
Response: {
  success: true,
  message: "Onboarding completed successfully"
}
```

### Components

```
components/onboarding/
├── onboarding-wizard.tsx                   → Main wizard component
└── steps/
    ├── welcome-step.tsx                    → Step 1: Welcome
    ├── create-project-step.tsx             → Step 2: Create Project
    ├── create-environment-step.tsx         → Step 3: Create Environment
    └── complete-step.tsx                   → Step 4: Complete
```

## User Flow

### New User Sign Up (OAuth or Email)
```
1. User completes OAuth/Email authentication
   ↓
2. SessionProvider checks onboarding status
   ↓
3. If onboardingCompleted = false:
   → Redirect to /onboarding
   ↓
4. User goes through 4-step wizard:
   - Welcome
   - Create Project
   - Create Environment  
   - Complete
   ↓
5. On completion:
   - Set onboardingCompleted = true
   - Redirect to /projects/{slug}
```

### Existing User Login
```
1. User logs in
   ↓
2. SessionProvider checks onboarding status
   ↓
3. If onboardingCompleted = true:
   → Redirect to /projects
```

## Authentication Integration

### Landing Page (`app/page.tsx`)
```typescript
// Checks onboarding status after detecting session
useEffect(() => {
  if (!isPending && session) {
    checkOnboardingStatus();
  }
}, [session, isPending]);

const checkOnboardingStatus = async () => {
  const response = await fetch('/api/v1/user/onboarding-status');
  const data = await response.json();
  
  if (!data.onboardingCompleted) {
    router.replace('/onboarding');
  } else {
    router.replace('/projects');
  }
};
```

### SessionProvider (`components/providers/SessionProvider.tsx`)
```typescript
// Redirects authenticated users from auth pages
if (session && (pathname === '/login' || pathname === '/register')) {
  checkOnboardingAndRedirect();
}

const checkOnboardingAndRedirect = async () => {
  const response = await fetch('/api/v1/user/onboarding-status');
  const data = await response.json();
  
  if (!data.onboardingCompleted) {
    router.push('/onboarding');
  } else {
    router.push('/projects');
  }
};
```

## Customization

### Adding New Steps
To add a new onboarding step:

1. **Create step component**:
```typescript
// components/onboarding/steps/my-new-step.tsx
export function MyNewStep({ onNext, onBack, stepData }: OnboardingStepProps) {
  return (
    <Card className="p-8">
      <h2>My New Step</h2>
      <Button onClick={() => onNext({ someData: 'value' })}>
        Next
      </Button>
    </Card>
  );
}
```

2. **Add to wizard**:
```typescript
// app/(onboarding)/onboarding/page.tsx
const ONBOARDING_STEPS: OnboardingStep[] = [
  // ... existing steps
  {
    id: "my-new-step",
    title: "New Step",
    description: "Description",
    component: MyNewStep,
  },
];
```

### Customizing Preset Environments
Edit presets in `create-environment-step.tsx`:

```typescript
const PRESET_ENVIRONMENTS = [
  { name: "Development", slug: "development", description: "Local development" },
  { name: "Staging", slug: "staging", description: "Pre-production testing" },
  { name: "Production", slug: "production", description: "Live environment" },
  // Add your custom presets
];
```

## Skip Functionality

Users can skip onboarding at any time:

1. **Skip button** in wizard footer
2. Calls `POST /api/v1/user/complete-onboarding`
3. Redirects to `/projects`
4. Can still create projects manually later

## Design Features

### Animations
- **Slide transitions** between steps (Framer Motion)
- **Progress bar** animation
- **Step indicator** scaling
- **Glow effects** on success state

### Responsive Design
- Mobile-first approach
- Stacked layouts on small screens
- Optimized touch targets
- Readable typography at all sizes

### Accessibility
- Keyboard navigation support
- Screen reader friendly
- Clear focus states
- Semantic HTML

## Testing Checklist

### New User Flow
- [ ] OAuth sign-in redirects to onboarding
- [ ] Email/password registration redirects to onboarding
- [ ] Welcome step shows correct user name
- [ ] Project creation works and validates input
- [ ] Environment presets work correctly
- [ ] Custom environment creation works
- [ ] Complete step shows correct project/environment names
- [ ] CLI commands show correct project slug
- [ ] "Go to Dashboard" redirects to created project
- [ ] onboardingCompleted flag is set correctly

### Existing User Flow
- [ ] Login does NOT show onboarding
- [ ] Direct `/onboarding` access for completed users redirects
- [ ] Dashboard access is immediate

### Skip Functionality
- [ ] Skip button visible and accessible
- [ ] Skip marks onboarding as completed
- [ ] Skip redirects to projects page
- [ ] No data loss when skipping

### Edge Cases
- [ ] API errors are handled gracefully
- [ ] Network failures show appropriate messages
- [ ] Duplicate project names are handled
- [ ] Invalid input is validated
- [ ] Back button preserves entered data

## Production Considerations

### Performance
- All onboarding components are client-side for interactivity
- API calls are optimized and cached where appropriate
- Animations use GPU acceleration
- Images and assets are optimized

### Security
- Onboarding routes require authentication
- API endpoints validate user permissions
- Input validation on both client and server
- No sensitive data in client state

### Analytics (Future Enhancement)
Consider tracking:
- Onboarding completion rate
- Drop-off points in wizard
- Time spent on each step
- Skip vs complete ratio
- First project/environment names (anonymized)

## Future Enhancements

- [ ] Add team invitation step
- [ ] Add first variable creation step
- [ ] CLI download/installation help
- [ ] Video tutorials in wizard
- [ ] Progress saving (resume later)
- [ ] Personalization questions
- [ ] Integration suggestions based on tech stack
- [ ] Email notification when setup complete
