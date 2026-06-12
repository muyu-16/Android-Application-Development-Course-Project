---
name: Frontend Responsive Design Standards
description: Build responsive, mobile-first layouts using fluid containers, flexible units, media queries, and touch-friendly design that works across all screen sizes. Use this skill when creating or modifying UI layouts, responsive grids, breakpoint styles, mobile navigation, or any interface that needs to adapt to different screen sizes. Apply when working with responsive CSS, media queries, viewport settings, flexbox/grid layouts, mobile-first styling, breakpoint definitions (mobile, tablet, desktop), touch target sizing, relative units (rem, em, %), image optimization for different screens, or testing layouts across multiple devices. Use for any task involving multi-device support, responsive design patterns, or adaptive layouts.
---
# Frontend Responsive Design Standards

**Rule:** Mobile-first development with consistent breakpoints, fluid layouts, relative units, and touch-friendly targets.

## When to use this skill
- When creating or modifying layouts that need to work on mobile, tablet, and desktop
- When implementing mobile-first design patterns starting with mobile layout
- When writing media queries or breakpoint-specific styles
- When using flexible units (rem, em, %) instead of fixed pixels for scalability
- When implementing fluid layouts with percentage-based widths or flexbox/grid
- When ensuring touch targets meet minimum size requirements (44x44px) for mobile
- When optimizing images and assets for different screen sizes and mobile networks
- When testing UI across multiple device sizes and breakpoints
- When maintaining readable typography across all screen sizes
- When prioritizing content display on smaller screens through layout decisions
- When using responsive design utilities in CSS frameworks (Tailwind, Bootstrap responsive classes)

## Mobile-First Development - Mandatory
**Always start with mobile layout, then enhance for larger screens.**

Bad (desktop-first):
```css
.container {
  width: 1200px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}
@media (max-width: 768px) {
  .container {
    width: 100%;
    grid-template-columns: 1fr;
  }
}
```

Good (mobile-first):
```css
.container {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .container {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    grid-template-columns: repeat(4, 1fr);
  }
}
```

## Standard Breakpoints
Tailwind: `sm:640px` `md:768px` `lg:1024px` `xl:1280px` `2xl:1536px`
Bootstrap: `sm:576px` `md:768px` `lg:992px` `xl:1200px` `xxl:1400px`

## Fluid Layouts
- Use `width: 100%` + `max-width` instead of fixed widths
- Flexbox: `flex: 1`, `flex-grow`, `flex-shrink`
- Grid: `1fr`, `minmax()`, `auto-fit`, `auto-fill`
- Container queries: `@container (min-width: 400px)`

## Relative Units
- `rem` for font sizes, spacing
- `em` for component-relative sizing
- `%` for widths
- `px` only for borders (1px)
- `clamp()` for fluid typography

## Touch Targets
- Minimum 44x44px (iOS) / 48x48px (Android)
- Spacing between interactive elements: min 8px

## Typography
- Body: 16px (1rem) minimum
- Line height: 1.5 body, 1.2 headings
- Line length: 45-75 chars (`max-width: 65ch`)

## Verification Checklist
- [ ] Started with mobile layout
- [ ] Used project standard breakpoints
- [ ] Fluid layouts (no fixed widths)
- [ ] Relative units (rem/em)
- [ ] Touch targets ≥ 44x44px
- [ ] Typography readable without zoom
- [ ] Content prioritized on mobile
- [ ] Images optimized for different sizes
- [ ] No horizontal scrolling on mobile
