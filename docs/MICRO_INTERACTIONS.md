# ✨ Micro-Interactions & Animations
## Detailed Animation Specifications

---

## 1. BUTTON INTERACTIONS

### Primary Button States

**Default**:
- Background: Blue gradient
- Border: 1px solid rgba(255,255,255,0.25)
- Shadow: glass-light

**Hover**:
- Transform: translateY(-2px)
- Box-shadow: glow-primary (0 0 20px rgba(59,130,246,0.3))
- Transition: 150ms ease-out
- Cursor: pointer

**Active/Click**:
- Transform: scale(0.98)
- Transition: 100ms ease-in
- Box-shadow: inset 0 2px 4px rgba(0,0,0,0.2)

**Disabled**:
- Opacity: 0.5
- Cursor: not-allowed
- Pointer-events: none

**Loading**:
- Animation: shimmer 2s linear infinite
- Content: hidden
- Show spinner icon

### Secondary Button States

**Default**:
- Background: Glass surface
- Border: 1px solid rgba(6,182,212,0.3)
- Color: Cyan accent

**Hover**:
- Background: Glass hover
- Border-color: rgba(6,182,212,0.6)
- Box-shadow: glow-secondary
- Transition: 150ms ease-out

---

## 2. INPUT FIELD INTERACTIONS

### Text Input States

**Default**:
- Background: Glass surface
- Border: 1px solid rgba(255,255,255,0.25)
- Placeholder: Secondary text color

**Focus**:
- Border-color: Primary blue (#3B82F6)
- Box-shadow: 0 0 0 3px rgba(59,130,246,0.1)
- Transition: 200ms ease-out
- Outline: none

**Error**:
- Border-color: Error red (#EF4444)
- Box-shadow: 0 0 0 3px rgba(239,68,68,0.1)
- Error message: Red text below input
- Animation: shake 0.3s ease-in-out

**Success**:
- Border-color: Success green (#10B981)
- Show checkmark icon
- Box-shadow: 0 0 0 3px rgba(16,185,129,0.1)

**Disabled**:
- Background: Opacity 0.5
- Cursor: not-allowed
- Color: Muted text

### Password Input

**Default**: Masked (••••••••)

**Reveal Toggle**:
- Eye icon on right side
- Click to show/hide
- Smooth transition
- Tooltip: "Show password" / "Hide password"

---

## 3. CARD INTERACTIONS

### Hover Effects

**Lift Effect**:
- Transform: translateY(-4px)
- Box-shadow: Increase blur (12px → 20px)
- Transition: 200ms cubic-bezier(0.34, 1.56, 0.64, 1)

**Glow Effect**:
- Box-shadow: Add glow-primary
- Border-color: Increase opacity
- Transition: 150ms ease-out

**Interactive Card**:
- Cursor: pointer
- Combine lift + glow on hover
- Scale: 1.02 on hover (optional)

---

## 4. MODAL INTERACTIONS

### Open Animation

**Backdrop**:
- Opacity: 0 → 1
- Duration: 300ms ease-out
- Background: rgba(0,0,0,0.5)

**Modal Content**:
- Transform: scale(0.95) → scale(1)
- Opacity: 0 → 1
- Duration: 300ms ease-out
- Blur: 0px → 16px (backdrop)

### Close Animation

**Reverse of open**:
- Scale: 1 → 0.95
- Opacity: 1 → 0
- Duration: 200ms ease-in

### Stagger Children

If modal has multiple fields:
- First field: 0ms delay
- Second field: 50ms delay
- Third field: 100ms delay
- etc.

---

## 5. DROPDOWN INTERACTIONS

### Open Animation

**Menu**:
- Transform: scaleY(0) → scaleY(1)
- Opacity: 0 → 1
- Transform-origin: top
- Duration: 150ms ease-out

### Item Hover

**Each Item**:
- Background: Opacity increase
- Transform: translateX(4px)
- Transition: 100ms ease-out

### Close Animation

**Reverse of open**:
- ScaleY: 1 → 0
- Opacity: 1 → 0
- Duration: 100ms ease-in

---

## 6. TOAST NOTIFICATIONS

### Appear Animation

**Toast**:
- Transform: translateX(400px) → translateX(0)
- Opacity: 0 → 1
- Duration: 300ms ease-out
- Easing: cubic-bezier(0.34, 1.56, 0.64, 1)

### Dismiss Animation

**Toast**:
- Transform: translateX(0) → translateX(400px)
- Opacity: 1 → 0
- Duration: 200ms ease-in

### Auto-dismiss

- Appear: 300ms
- Display: 5000ms
- Dismiss: 200ms
- Total: 5500ms

### Stacked Toasts

- Each new toast: translateY(-100px) for existing toasts
- Transition: 200ms ease-out
- Max stack: 3 toasts

---

## 7. PAGE TRANSITIONS

### Route Change

**Outgoing Page**:
- Opacity: 1 → 0
- Duration: 200ms ease-in

**Incoming Page**:
- Opacity: 0 → 1
- Duration: 300ms ease-out
- Delay: 100ms (slight overlap)

### Preserve Scroll

- Save scroll position on route change
- Restore on back navigation
- Smooth scroll to top on forward navigation

---

## 8. LOADING STATES

### Skeleton Animation

**Shimmer Effect**:
```css
animation: shimmer 2s linear infinite;
background: linear-gradient(
  90deg,
  rgba(255,255,255,0.1) 0%,
  rgba(255,255,255,0.3) 50%,
  rgba(255,255,255,0.1) 100%
);
background-size: 200% 100%;
```

### Spinner Animation

**Rotating Circle**:
- Transform: rotate(0deg) → rotate(360deg)
- Duration: 1s linear infinite
- Color: Primary blue

**Bouncing Dots**:
- 3 dots
- Each dot: scale(1) → scale(1.2) → scale(1)
- Staggered timing: 0ms, 150ms, 300ms
- Duration: 600ms ease-in-out infinite

---

## 9. TABLE INTERACTIONS

### Row Hover

**Highlight**:
- Background: Opacity increase (0.02)
- Transition: 100ms ease-out
- Show action buttons

### Row Selection

**Checkbox**:
- Scale: 0 → 1 on check
- Duration: 150ms ease-out
- Color: Primary blue

**Row Highlight**:
- Background: Primary blue with 0.1 opacity
- Transition: 100ms ease-out

### Sorting

**Column Header Click**:
- Arrow icon: Rotate 180deg
- Duration: 200ms ease-out
- Table rows: Fade out → Fade in
- Duration: 300ms ease-in-out

---

## 10. FORM VALIDATION

### Real-time Validation

**As User Types**:
- Debounce: 300ms
- Show validation icon (checkmark/cross)
- Color: Green (valid) / Red (invalid)
- Transition: 150ms ease-out

### Error Message

**Appear**:
- Opacity: 0 → 1
- Transform: translateY(-8px) → translateY(0)
- Duration: 200ms ease-out

**Disappear**:
- Opacity: 1 → 0
- Transform: translateY(0) → translateY(-8px)
- Duration: 150ms ease-in

### Field Shake (on error)

```css
animation: shake 0.3s ease-in-out;
```

**Keyframes**:
- 0%: translateX(0)
- 25%: translateX(-4px)
- 50%: translateX(4px)
- 75%: translateX(-4px)
- 100%: translateX(0)

---

## 11. COPY TO CLIPBOARD

### Button Click

**Icon Animation**:
- Default: Copy icon
- On click: Checkmark icon
- Duration: 100ms ease-out
- Revert after 2s

**Toast Notification**:
- Show: "Copied to clipboard"
- Auto-dismiss: 3s

### Keyboard Shortcut

**Cmd+C / Ctrl+C**:
- Trigger copy
- Show toast
- Same animation as button

---

## 12. REVEAL/HIDE VALUE

### Eye Icon Toggle

**Default**: Eye with slash (hidden)

**On Click**:
- Icon: Eye with slash → Eye open
- Duration: 150ms ease-out
- Value: Masked → Decrypted
- Transition: 200ms ease-out

### Permission Denied

**Tooltip**:
- Appear: 200ms ease-out
- Text: "You don't have permission to view this value"
- Icon: Lock with slash
- Color: Error red

---

## 13. THEME TOGGLE

### Light to Dark

**Transition**:
- Duration: 300ms ease-in-out
- All colors: Fade to dark variants
- No page reload
- Smooth transition (no flash)

### Dark to Light

**Transition**:
- Duration: 300ms ease-in-out
- All colors: Fade to light variants
- No page reload

### Toggle Button

**Click Animation**:
- Icon: Rotate 180deg
- Duration: 300ms ease-out
- Background: Slight highlight

---

## 14. SEARCH & FILTER

### Search Input

**Focus**:
- Border: Blue glow
- Box-shadow: glow-primary
- Transition: 150ms ease-out

**Clear Button**:
- Appear: Opacity 0 → 1
- Duration: 100ms ease-out
- Click: Clear input + animation

### Filter Dropdown

**Open**:
- Menu: ScaleY(0) → ScaleY(1)
- Duration: 150ms ease-out

**Selection**:
- Checkmark: Scale 0 → 1
- Duration: 150ms ease-out
- Row highlight: Fade in
- Duration: 200ms ease-out

---

## 15. BREADCRUMB NAVIGATION

### Hover on Link

**Link**:
- Color: Primary blue
- Text-decoration: underline
- Transition: 100ms ease-out

**Arrow Separator**:
- Opacity: Increase
- Transition: 100ms ease-out

---

## 16. AVATAR STACK

### Hover

**Stack**:
- Expand avatars (spread out)
- Duration: 200ms ease-out
- Show names in tooltip

**Individual Avatar**:
- Scale: 1 → 1.1
- Duration: 150ms ease-out

---

## 17. STATUS INDICATOR

### Online/Offline Pulse

**Online**:
- Green dot
- Pulse animation (optional):
  - Scale: 1 → 1.2 → 1
  - Duration: 2s ease-in-out infinite

**Offline**:
- Gray dot
- No animation

**Away**:
- Amber dot
- Pulse animation (slower)

---

## 18. ENVIRONMENT TABS

### Tab Switch

**Active Tab**:
- Underline: Slide to new position
- Duration: 200ms ease-out
- Content: Fade out → Fade in
- Duration: 300ms ease-in-out

**Inactive Tab**:
- Opacity: 0.6
- Hover: Opacity 0.8
- Transition: 100ms ease-out

---

## 19. VARIABLE TABLE ROW

### Reveal Value

**Eye Icon Click**:
- Icon: Eye closed → Eye open
- Duration: 150ms ease-out
- Value: Masked → Decrypted
- Transition: 200ms ease-out

### Copy Value

**Copy Icon Click**:
- Icon: Copy → Checkmark
- Duration: 100ms ease-out
- Toast: "Copied to clipboard"
- Revert icon after 2s

### Edit/Delete

**Menu Click**:
- Menu: ScaleY(0) → ScaleY(1)
- Duration: 150ms ease-out
- Items: Staggered (0ms, 50ms, 100ms)

---

## 20. ACCESSIBILITY CONSIDERATIONS

### Respect prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus Indicators

- Visible focus ring (2px, primary color)
- Keyboard navigation support
- No hidden focus states

### Motion Sensitivity

- Avoid rapid flashing
- Avoid parallax effects
- Keep animations under 2 seconds
- Provide static alternatives

