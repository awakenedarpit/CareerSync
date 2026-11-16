---
name: CareerSync
colors:
  surface: '#e2fffe'
  surface-dim: '#aae5e5'
  surface-bright: '#e2fffe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#c3fffe'
  surface-container: '#bdf9f9'
  surface-container-high: '#b8f3f3'
  surface-container-highest: '#b2eded'
  on-surface: '#002020'
  on-surface-variant: '#3e494a'
  inverse-surface: '#003737'
  inverse-on-surface: '#c0fcfc'
  outline: '#6e797b'
  outline-variant: '#bdc9ca'
  surface-tint: '#006973'
  primary: '#006973'
  on-primary: '#ffffff'
  primary-container: '#89eefc'
  on-primary-container: '#006d77'
  inverse-primary: '#6fd5e3'
  secondary: '#006b5b'
  on-secondary: '#ffffff'
  secondary-container: '#2dfad8'
  on-secondary-container: '#00705f'
  tertiary: '#7d5800'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffd99a'
  on-tertiary-container: '#815b00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#90f1ff'
  primary-fixed-dim: '#6fd5e3'
  on-primary-fixed: '#001f23'
  on-primary-fixed-variant: '#004f57'
  secondary-fixed: '#34fddb'
  secondary-fixed-dim: '#00dfbf'
  on-secondary-fixed: '#00201a'
  on-secondary-fixed-variant: '#005144'
  tertiary-fixed: '#ffdea9'
  tertiary-fixed-dim: '#f6bd51'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5e4100'
  background: '#e2fffe'
  on-background: '#002020'
  surface-variant: '#b2eded'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

# CareerSync — Design System Document

## 1. Brand & Style
The design system adopts a **Modern / Corporate** aesthetic with a fresh, vibrant twist provided by a digital-first mint green primary palette. It projects reliability, efficiency, and clarity, while leveraging high-contrast accents and crisp typography to maintain user engagement. The overall mood is professional yet progressive, designed to inspire trust and swift navigation.

---

## 2. Colors & Tokens
The color palette is built for clarity and high-contrast usability in a light mode environment.

- **Primary (`#89eefc` / `#006973`):** A bright, luminous cyan-mint driving key interactive elements, primary actions, and brand focal points (`primary-container: #89eefc`, `on-primary-container: #006d77`, `primary: #006973`).
- **Secondary (`#11f1cf` / `#006b5b` / `#2dfad8`):** A vibrant aqua-mint offering supportive structural contrast and secondary hierarchy.
- **Tertiary (`#ffc558` / `#ffd99a` / `#7d5800`):** A warm amber/gold used intentionally for highlights, warnings, certifications, and accent badges.
- **Neutral (`#b6f1f1` / `#b2eded`):** A cool, tinted cyan-gray neutral used for text, borders, and subtle surface variations.
- **Surfaces:**
  - `surface`: `#e2fffe`
  - `surface-dim`: `#aae5e5`
  - `surface-bright`: `#e2fffe`
  - `surface-container-lowest`: `#ffffff`
  - `surface-container-low`: `#c3fffe`
  - `surface-container`: `#bdf9f9`
  - `surface-container-high`: `#b8f3f3`
  - `surface-container-highest`: `#b2eded`
- **Text & Outlines:**
  - `on-surface`: `#002020` (Deep Forest)
  - `on-surface-variant`: `#3e494a`
  - `outline`: `#6e797b`
  - `outline-variant`: `#bdc9ca`
- **Error States:**
  - `error`: `#ba1a1a`
  - `error-container`: `#ffdad6`
  - `on-error-container`: `#93000a`

---

## 3. Typography Hierarchy
**Inter** is utilized across all typographic roles—headlines, body copy, and labels—ensuring a clean, highly legible, and unified typographic hierarchy.
- **Headline Large (`headline-lg`):** Inter, 32px, Font Weight 600, Line Height 40px, tight tracking for strong spatial command.
- **Body Medium (`body-md`):** Inter, 16px, Font Weight 400, Line Height 24px, optimized for comfortable reading across dashboards.
- **Label Small (`label-sm`):** Inter, 12px, Font Weight 500, Line Height 16px, crisp and tracking-adjusted for badges, table metadata, and UI controls.

---

## 4. Layout & Spacing Scale
A structured layout framework governs the interface using a predictable spacing scale:
- **Gutters & Margins:** Fluid columns with standard 1rem (`16px`) gutters and 1.5rem (`24px`) outer margins maintain generous breathing room.
- **Component Scale Tokens:**
  - `space-xs`: `0.25rem` (`4px`)
  - `space-sm`: `0.5rem` (`8px`)
  - `space-md`: `1rem` (`16px`)
  - `space-lg`: `1.5rem` (`24px`)
  - `space-xl`: `2rem` (`32px`)

---

## 5. Elevation & Depth
Elevation is achieved through a hybrid approach combining **tonal surface layers** and **subtle ambient shadows**:
- Surfaces step smoothly from canvas `background: #e2fffe` to container levels: `#c3fffe` (low) → `#bdf9f9` (container) → `#b8f3f3` (high) → `#ffffff` (elevated white cards).
- Depth relies on distinct background contrast and soft borders (`#bdc9ca` at 18-40% opacity) rather than heavy drop shadows.

---

## 6. Shapes & Rounded Scale
The design system employs a **Rounded** shape language:
- `sm`: `0.25rem` (`4px`) — small chips, micro-controls
- `DEFAULT`: `0.5rem` (`8px`) — buttons, inputs, select triggers
- `md`: `0.75rem` (`12px`) — cards, table wrappers
- `lg`: `1rem` (`16px`) — large containers, modal dialogs
- `xl`: `1.5rem` (`24px`) — spotlight hero cards, feature blocks
- `full`: `9999px` — status pills, avatar containers, rounded action icons

---

## 7. Component Styling Guidelines
- **Buttons:** Feature rounded corners (`0.5rem`), with primary actions styled in vibrant cyan-mint (`#89eefc` / `#02E8A7`) with `#002020` bold text and clear focus rings.
- **Cards:** Clean surfaces bounded by soft neutral borders (`#bdc9ca`) or subtle tonal shifts, utilizing `rounded-lg` (`1rem`) corners.
- **Input Fields:** Clear outlines using neutral tones, shifting to cyan-mint accents (`#89eefc` / `#02E8A7`) upon focus.
- **Checkboxes & Radios:** Consistent with the rounded aesthetic, adopting distinct checked states using the primary shade.
- **Chips & Badges:** Compact elements leveraging secondary (`#11f1cf`) and tertiary (`#ffc558`) tones for categorical data tagging.
