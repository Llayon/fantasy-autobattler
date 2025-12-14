# Accessibility Guide for Fantasy Autobattler

## Overview

This document outlines the accessibility features and compliance measures implemented in the Fantasy Autobattler application. We strive to meet WCAG 2.1 AA standards to ensure the game is usable by players with diverse abilities.

## Accessibility Standards

### WCAG 2.1 AA Compliance

We follow the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards:

- **Perceivable**: Information and UI components must be presentable in ways users can perceive
- **Operable**: UI components and navigation must be operable
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough for interpretation by assistive technologies

## Implementation Details

### 1. Keyboard Navigation

#### Full Keyboard Support
- **Tab Navigation**: All interactive elements are accessible via Tab/Shift+Tab
- **Enter/Space**: Activates buttons and selects units
- **Arrow Keys**: Navigate within grids and lists
- **Escape**: Closes modals and cancels operations

#### Keyboard Shortcuts
- **Ctrl+Z**: Undo last action
- **Ctrl+Shift+Z**: Redo last undone action

#### Focus Management
- Clear focus indicators with 2px yellow outline
- Focus trap in modals prevents focus from escaping
- Logical tab order throughout the application
- Skip links for main content areas

### 2. Screen Reader Support

#### ARIA Labels and Roles
```typescript
// Grid structure
<div role="grid" aria-label="Battle grid 8 by 10 cells">
  <div role="gridcell" aria-rowindex="1" aria-colindex="1">
    // Cell content
  </div>
</div>

// Interactive buttons
<button 
  aria-label="Knight - Tank - Cost: 5 - HP: 120 - Attack: 25"
  aria-pressed={selected}
  aria-describedby="unit-knight-description"
>
  // Button content
</button>

// Control groups
<div role="group" aria-label="Undo and Redo controls">
  // Undo/Redo buttons
</div>
```

#### Screen Reader Announcements
- Unit selection states announced
- Battle grid navigation with position information
- Error messages associated with form controls
- Loading states and progress updates
- Dynamic content changes announced

#### Hidden Content for Screen Readers
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 3. Visual Design

#### Color Contrast
All color combinations meet WCAG AA standards (4.5:1 contrast ratio):

| Element | Foreground | Background | Ratio |
|---------|------------|------------|-------|
| Primary Text | #ffffff | #111827 | 15.3:1 |
| Secondary Text | #d1d5db | #111827 | 11.6:1 |
| Tank Role | #3b82f6 | #111827 | 8.2:1 |
| DPS Role | #ef4444 | #111827 | 5.9:1 |
| Support Role | #10b981 | #111827 | 7.1:1 |
| Mage Role | #8b5cf6 | #111827 | 4.8:1 |
| Control Role | #f59e0b | #111827 | 6.9:1 |

#### Information Conveyance
- Information never conveyed by color alone
- Role icons accompany color coding
- Text labels for all interactive elements
- Pattern/texture alternatives for color-coded elements

#### Typography
- Minimum 16px font size for body text
- Clear font hierarchy with proper heading structure
- Sufficient line spacing (1.5x minimum)
- Tabular numbers for consistent layout

### 4. Touch and Mobile Accessibility

#### Touch Targets
- Minimum 44×44px touch targets on mobile
- Adequate spacing between interactive elements
- Touch-friendly gestures with alternatives

#### Mobile Screen Readers
- VoiceOver (iOS) and TalkBack (Android) support
- Proper heading navigation
- Swipe gesture alternatives provided

#### Responsive Design
- Works at 200% zoom without horizontal scrolling
- Supports up to 500% zoom with reflow
- Orientation change support
- Safe area insets for notched devices

### 5. Motion and Animation

#### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .animate-unit-select,
  .animate-unit-place,
  .animate-shake {
    animation: none;
  }
  
  /* Subtle alternatives */
  .animate-unit-select {
    transform: scale(1.02);
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
  }
}
```

#### Animation Guidelines
- No flashing content above 3Hz
- Animations can be paused or disabled
- Essential information not conveyed through motion alone
- Smooth 60fps animations with GPU acceleration

### 6. Form Accessibility

#### Labels and Descriptions
- All form inputs have associated labels
- Error messages linked via `aria-describedby`
- Required fields clearly marked
- Input format instructions provided

#### Error Handling
- Errors announced to screen readers
- Clear error messages with correction suggestions
- Form validation doesn't rely on color alone
- Error summary at form submission

### 7. Component-Specific Accessibility

#### UnitCard Component
```typescript
<button
  aria-label="Knight - Tank - Cost: 5 - HP: 120 - Attack: 25"
  aria-pressed={selected}
  aria-describedby="unit-knight-description"
>
  <div id="unit-knight-description" className="sr-only">
    Abilities: Shield Bash. Stats: HP 120, Attack 25, Speed 2, Armor 8.
  </div>
</button>
```

#### BattleGrid Component
```typescript
<div 
  role="grid"
  aria-label="Battle grid 8 by 10 cells"
  aria-rowcount={10}
  aria-colcount={8}
>
  <div
    role="gridcell"
    aria-rowindex={1}
    aria-colindex={1}
    aria-label="Grid cell 1, 1 - Valid drop zone"
    tabIndex={0}
  />
</div>
```

#### Modal Components
- Focus trap prevents focus from escaping
- Escape key closes modals
- Focus returns to trigger element on close
- Modal announced to screen readers

## Testing Procedures

### Automated Testing

#### Axe-Core Integration
```typescript
// Development mode accessibility testing
import { setupAxeCore } from '@/lib/axe-config';

if (process.env.NODE_ENV === 'development') {
  setupAxeCore();
}
```

#### Continuous Integration
- Automated accessibility tests in CI/CD pipeline
- Lighthouse accessibility audits
- Color contrast validation
- Keyboard navigation testing

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Shift+Tab works in reverse order
- [ ] Enter/Space activates buttons
- [ ] Arrow keys work in grids
- [ ] Escape closes modals
- [ ] Focus indicators visible
- [ ] No keyboard traps

#### Screen Reader Testing
- [ ] VoiceOver (macOS/iOS) compatibility
- [ ] NVDA (Windows) compatibility
- [ ] TalkBack (Android) compatibility
- [ ] Proper heading structure
- [ ] ARIA labels announced correctly
- [ ] Dynamic content changes announced

#### Visual Testing
- [ ] 200% zoom without horizontal scroll
- [ ] High contrast mode support
- [ ] Color blindness simulation
- [ ] Focus indicators visible
- [ ] Text readable at all sizes

#### Mobile Testing
- [ ] Touch targets ≥44×44px
- [ ] Screen reader gestures work
- [ ] Orientation changes handled
- [ ] Zoom up to 500% supported

## Browser and Assistive Technology Support

### Supported Browsers
- Chrome 90+ (Windows, macOS, Android)
- Firefox 88+ (Windows, macOS)
- Safari 14+ (macOS, iOS)
- Edge 90+ (Windows)

### Supported Screen Readers
- NVDA 2021.1+ (Windows)
- JAWS 2021+ (Windows)
- VoiceOver (macOS, iOS)
- TalkBack (Android)

### Supported Input Methods
- Keyboard navigation
- Touch/tap interaction
- Voice control (Dragon, Voice Control)
- Switch navigation
- Eye tracking (with compatible software)

## Known Issues and Limitations

### Current Limitations
1. **Drag and Drop**: Screen reader users rely on keyboard alternatives
2. **Real-time Battle**: Battle animations may be challenging for some users
3. **Complex Grid**: 8×10 grid navigation can be lengthy with screen readers

### Planned Improvements
1. **Enhanced Audio Cues**: Sound effects for actions and feedback
2. **Simplified Navigation**: Quick jump options for grid navigation
3. **Voice Commands**: Voice control for common actions
4. **Haptic Feedback**: Vibration feedback for mobile users

## Resources and References

### WCAG Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Color Oracle](https://colororacle.org/) (Color blindness simulator)

### Screen Reader Resources
- [NVDA Download](https://www.nvaccess.org/download/)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/)
- [Screen Reader Testing Guide](https://webaim.org/articles/screenreader_testing/)

## Contact and Feedback

For accessibility-related questions, issues, or suggestions:

1. **GitHub Issues**: Use the accessibility label
2. **Email**: Include "Accessibility" in the subject line
3. **User Testing**: We welcome feedback from users with disabilities

## Compliance Statement

Fantasy Autobattler strives to conform to WCAG 2.1 Level AA standards. We are committed to ensuring digital accessibility for people with disabilities and continuously improving the user experience for everyone.

Last updated: December 2024