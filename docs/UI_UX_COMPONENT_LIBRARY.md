# CarrerSync — UI/UX Component Library Catalog
**Design System:** Mint, Aqua & Amber Corporate Edition  
**Target:** React 19 Frontend Components  
**Directory:** `client/src/components/ui/` & `client/src/components/charts/`  
**Accessibility:** WCAG 2.1 AA Compliant  

---

## 1. Overview

The CarrerSync Component Library provides a standardized, accessible, and cohesive suite of React primitives and complex composites designed specifically for institutional placement operations.

All components adhere strictly to the Mint & Aqua design system:
- High contrast Deep Forest (`#002020`) text.
- Luminous Mint (`#02E8A7`) and Aqua (`#11F1CF`) interactive states.
- Institutional Amber (`#FFC558`) warning and pending indicators.
- Seamless keyboard navigation with high-visibility `#02E8A7` focus rings.

---

## 2. Core UI Component Specifications

### 2.1 Buttons (`Button.jsx` & `IconButton.jsx`)
- **File:** `client/src/components/ui/Button.jsx`
- **Variants:**
  - `primary`: Background `#02E8A7`, text `#002020`, font weight bold, hover `#11F1CF`, active scale 0.98.
  - `secondary`: Background `#FFFFFF`, text `#002020`, border `#BACBC0`/50, hover `#BDF9F9`/30.
  - `aqua`: Background `#11F1CF`, text `#002020`, hover `#02E8A7`.
  - `amber`: Background `#FFC558`, text `#002020`, hover `#FBBF24`.
  - `navy`: Background `#002020`, text `#02E8A7`, hover `#003333`.
  - `outline`: Transparent background, border `#BACBC0`/60, text `#002020`, hover bg `#BDF9F9`/25.
  - `ghost`: Transparent background, text `#002020`, hover bg `#BDF9F9`/30.
  - `destructive`: Background `#FEE2E2`, border `#FCA5A5`, text `#991B1B`.
- **Sizes:** `xs` (24px height), `sm` (32px), `md` (40px), `lg` (48px).
- **Features:** Internal `<Link>` support via `to` prop, loading spinner with `loading={true}`, left/right icon injection.

### 2.2 Cards & Surfaces (`Card.jsx`)
- **File:** `client/src/components/ui/Card.jsx`
- **Variants:**
  - `surface` (default): Pure white background `#FFFFFF`, border `#BACBC0`/40, subtle elevation.
  - `container`: Tonal container background `#BDF9F9`/35, border `#02E8A7`/30.
  - `low`: Soft background `#C3FFFE`/40, border `#BACBC0`/30.
- **Props:** `hover` (adds translateY(-2px) and shadow transition), `interactive` (cursor pointer), `padded` (default true).

### 2.3 Status Badges & Chips (`StatusBadge.jsx` & `Badge.jsx`)
- **File:** `client/src/components/ui/StatusBadge.jsx`
- **Canonical Skill Lifecycle States:**
  1. `claimed`: Dashed border `#6B7B71`, text `#3B4A42`, background `#E2FFFE`.
  2. `observed`: Background `#C3FFFE`/60, text `#004D36`, border `#11F1CF`/50.
  3. `evidence_linked`: Background `#BDF9F9`/60, text `#004D36`, icon `ExternalLink`.
  4. `verified`: Background `#E6FAF4`, border `#02E8A7`/60, text `#004D36`, icon `CheckCircle2`.
  5. `expired`: Background `#FFF8E7`, border `#FFC558`/60, text `#B45309`, icon `AlertTriangle`.
- **Badge.jsx Variants:** `mint`, `aqua`, `amber`, `slate`, `rose`, `teal`.

### 2.4 Metrics & Statistics (`StatCard.jsx`)
- **File:** `client/src/components/ui/StatCard.jsx`
- **Props:** `title`, `value`, `subtitle`, `icon`, `trend` ('up' | 'down' | 'neutral'), `trendValue`, `color` ('mint' | 'aqua' | 'amber' | 'teal').
- **Styling:** Dynamic accent container, bold `#002020` headline, trend pill with semantic icon.

### 2.5 Form Controls (`Input.jsx` & `Select.jsx`)
- **Files:** `client/src/components/ui/Input.jsx`, `client/src/components/ui/Select.jsx`
- **Styling:**
  - Border `#BACBC0`, background `#FFFFFF`, text `#002020`.
  - Focus state: `border-[#02E8A7] ring-2 ring-[#02E8A7]/40 outline-none`.
  - Error state: `border-rose-300 ring-rose-200 text-rose-900`.
- **Features:** Floating labels, icon prefix/suffix, helper text, accessible ARIA invalid tagging.

### 2.6 Navigation & Hierarchy (`PageHeader.jsx`, `Breadcrumb.jsx`, `Tabs.jsx`)
- **PageHeader:** Dual-slot layout with title (`#002020` bold), subtitle (`#3B4A42`), breadcrumb navigation, and responsive action button toolbar.
- **Breadcrumb:** Home icon, chevron delimiters in `#BACBC0`, active current page in `#002020`.
- **Tabs:** Pill and underline formats. Active tab elevated with `#002020` font-bold on white with `#02E8A7`/40 border.

### 2.7 Data Tables (`DataTable.jsx`)
- **File:** `client/src/components/ui/DataTable.jsx`
- **Features:**
  - Column sorting with accessible indicator glyphs.
  - Table header styled with `#BDF9F9`/35 background and `#3B4A42` uppercase tracking.
  - Alternating or clean rows with hover `#E2FFFE`/40 highlight.
  - Integrated search filter, pagination controls, and empty state fallback.

### 2.8 Feedback & Overlay Dialogs (`Modal.jsx`, `Toast.jsx`, `ConfirmationDialog.jsx`)
- **Modal:** Accessible portal rendering, backdrop `#002020`/50 with blur, ESC key dismiss, focus trapping, header with close action.
- **ConfirmationDialog:** Consequential action confirmation modal with dangerous / warning / standard variants and custom CTA wording.
- **Toast:** Toast notification system (success in `#02E8A7` tint, info in `#11F1CF`, warning in `#FFC558`, error in rose).

### 2.9 Charting & Visualizations (`ChartContainer.jsx`, `chartTheme.js`)
- **Theme Colors:**
  - Primary Series: `#02E8A7` (Mint)
  - Secondary Series: `#11F1CF` (Aqua)
  - Highlight Series: `#FFC558` (Amber)
  - Dark Contrast: `#002020` (Deep Forest)
- **Container:** Standard card wrapper with header, key metric tags, responsive height, and interactive legend.
