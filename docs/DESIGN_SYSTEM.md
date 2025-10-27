# 🎨 EnvShield Design System
## Glassmorphism Foundation

---

## 1. BRAND IDENTITY

### Core Philosophy
- **Feel**: Secure • Transparent • Technical • Elegant
- **Visual Motif**: Frosted glass layers + accent glow lines
- **Aesthetic**: Premium SaaS (Linear, Vercel, Raycast)
- **Dual Mode**: Light & Dark with consistent brand colors

### Typography Stack
- **Headings**: Inter SemiBold (UI text)
- **Body**: Inter Regular (descriptions, labels)
- **Code/Keys**: JetBrains Mono Regular (terminal, values)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Icon System
- **Library**: Lucide React (line-based icons)
- **Style**: Minimal, 24px default size
- **Hover Effect**: Subtle glow (rgba(59, 130, 246, 0.3))
- **Color**: Inherit from text color, accent on interactive

---

## 2. COLOR SYSTEM

### Primary Brand Colors

| Color | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| **Primary** | #3B82F6 | #3B82F6 | Buttons, links, active states |
| **Secondary** | #06B6D4 | #06B6D4 | Accents, gradients, highlights |
| **Success** | #10B981 | #10B981 | Status badges, confirmations |
| **Warning** | #F59E0B | #F59E0B | Caution states, alerts |
| **Error** | #EF4444 | #EF4444 | Errors, destructive actions |

### Background & Glass Layers

#### Light Mode
| Layer | Color | Opacity | Usage |
|-------|-------|---------|-------|
| **Page Background** | #F4F6FB | 100% | App shell, base |
| **Glass Surface** | #FFFFFF | 55% | Main panels, cards |
| **Glass Hover** | #FFFFFF | 65% | Interactive glass |
| **Glass Border** | #FFFFFF | 25% | Panel outlines |
| **Input Background** | #FFFFFF | 80% | Form fields |

#### Dark Mode
| Layer | Color | Opacity | Usage |
|-------|-------|---------|-------|
| **Page Background** | #0E1117 | 100% | App shell, base |
| **Glass Surface** | #11192840 | 65% | Main panels, cards |
| **Glass Hover** | #11192852 | 75% | Interactive glass |
| **Glass Border** | #FFFFFF | 8% | Panel outlines |
| **Input Background** | #FFFFFF | 8% | Form fields |

### Text Colors

#### Light Mode
| Type | Color | Usage |
|------|-------|-------|
| **Primary Text** | #0A0F1F | Headings, key text |
| **Secondary Text** | #4B5563 | Descriptions, labels |
| **Muted Text** | #6B7280 | Disabled, hints |

#### Dark Mode
| Type | Color | Usage |
|------|-------|-------|
| **Primary Text** | #F9FAFB | Headings, key text |
| **Secondary Text** | #9CA3AF | Descriptions, labels |
| **Muted Text** | #6B7280 | Disabled, hints |

### Semantic Status Colors

```
Success:  #10B981 (Green)
Warning:  #F59E0B (Amber)
Error:    #EF4444 (Red)
Info:     #3B82F6 (Blue)
```

---

## 3. GLASSMORPHIC EFFECTS

### Backdrop Blur
```css
/* Light Mode */
backdrop-filter: blur(16px);

/* Dark Mode */
backdrop-filter: blur(18px);
```

### Border Specifications
```css
/* Light Mode */
border: 1px solid rgba(255, 255, 255, 0.25);

/* Dark Mode */
border: 1px solid rgba(255, 255, 255, 0.08);
```

### Shadow System

#### Light Mode
```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
```

#### Dark Mode
```css
box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
```

### Glow Effects
```css
/* Primary Glow */
box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);

/* Secondary Glow */
box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
```

---

## 4. SPACING & SIZING

### Spacing Scale (Tailwind)
```
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
```

### Border Radius
```
sm: 12px
md: 16px (default glass)
lg: 20px
```

### Component Sizes
```
Button Height: 40px (md), 36px (sm), 48px (lg)
Input Height: 40px
Card Padding: 24px
Modal Max Width: 500px
Sidebar Width: 240px
```

---

## 5. TYPOGRAPHY SCALE

### Headings
```
H1: 32px / 40px (Inter SemiBold)
H2: 28px / 36px (Inter SemiBold)
H3: 24px / 32px (Inter SemiBold)
H4: 20px / 28px (Inter SemiBold)
H5: 18px / 26px (Inter Medium)
```

### Body Text
```
Large: 16px / 24px (Inter Regular)
Base: 14px / 22px (Inter Regular)
Small: 12px / 18px (Inter Regular)
```

### Code Text
```
Code Block: 13px / 20px (JetBrains Mono)
Inline Code: 12px (JetBrains Mono)
Terminal: 12px / 18px (JetBrains Mono)
```

---

## 6. ANIMATION SYSTEM

### Timing Functions
```
Fade: 300ms ease-in-out
Slide: 300ms ease-out
Spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1)
Modal: 300ms ease-out
Page Transition: 400ms ease-in-out
```

### Keyframe Animations
```
fadeIn: 0% opacity 0 → 100% opacity 1
slideIn: 0% translate(-20px) → 100% translate(0)
slideUp: 0% translate(0, 20px) → 100% translate(0)
glassReveal: blur(0px) → blur(16px)
shimmer: -1000px → 1000px (loading state)
```

### Interaction States
```
Hover: +150ms, scale(1.02), glow shadow
Active: scale(0.98), -100ms
Focus: glow border + outline
Disabled: opacity 0.5, no pointer events
Loading: shimmer animation
```

---

## 7. COMPONENT TOKENS

### Button Variants
```
Primary: Glass + Blue gradient + Glow hover
Secondary: Glass + Border + Cyan accent
Tertiary: Transparent + Text only
Danger: Glass + Red accent
Loading: Shimmer effect
```

### Input Variants
```
Default: Glass surface + border
Focus: Glow border (blue)
Error: Red glow + error text
Disabled: Opacity 0.5
Success: Green glow + checkmark
```

### Card Variants
```
Default: Glass + shadow
Hover: Lift effect + glow
Bordered: Blue border + glass
Interactive: Cursor pointer + hover state
```

---

## 8. TAILWIND CONFIGURATION REFERENCE

### Key Extends
```typescript
colors: {
  primary: '#3B82F6',
  secondary: '#06B6D4',
  glass: { light: 'rgba(255,255,255,0.55)', dark: 'rgba(17,25,40,0.65)' }
}

backdropBlur: {
  glass: '16px'
}

boxShadow: {
  'glass-light': '0 4px 12px rgba(0,0,0,0.08)',
  'glow-primary': '0 0 20px rgba(59,130,246,0.3)'
}

animation: {
  'fade-in': 'fadeIn 0.3s ease-in-out',
  'glass-reveal': 'glassReveal 0.4s ease-out'
}
```

---

## 9. ACCESSIBILITY

### Color Contrast
- Primary text on glass: 7:1+ (WCAG AAA)
- Secondary text: 4.5:1+ (WCAG AA)
- Interactive elements: 3:1+ minimum

### Focus States
- Visible focus ring (2px, primary color)
- Keyboard navigation support
- Screen reader labels on all interactive elements

### Motion
- Respect `prefers-reduced-motion`
- Disable animations for users who prefer reduced motion
- Provide static alternatives to animated content

---

## 10. DARK MODE IMPLEMENTATION

### CSS Strategy
```css
/* Use Tailwind dark: prefix */
.glass-card {
  @apply bg-glass-light dark:bg-glass-dark;
  @apply border-border-light dark:border-border-dark;
  @apply shadow-glass-light dark:shadow-glass-dark;
}
```

### Toggle Implementation
- Store preference in localStorage
- Sync with system preference on first visit
- Smooth transition between modes (300ms)
- No flash of wrong theme on page load

