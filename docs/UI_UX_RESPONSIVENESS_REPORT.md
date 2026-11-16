# CarrerSync — UI/UX Responsiveness & Device Adaptation Report
**Platform:** CarrerSync Agentic Placement Intelligence  
**Test Matrix:** Mobile (320px - 640px), Tablet (640px - 1024px), Desktop (1024px - 1280px), Ultra-Wide (1280px+)  
**Status:** Validated  

---

## 1. Executive Summary

The CarrerSync user interface was audited and refined across all major viewport breakpoints to ensure seamless functionality on mobile devices, tablets, and desktop workstations. 

Placement officers frequently manage drives on laptops, recruiters evaluate candidates on large external monitors, and students view alerts and complete mock interviews on tablets or mobile phones. The design guarantees full feature availability without layout breakdown across all viewport tiers.

---

## 2. Breakpoint Architecture & Strategies

### 2.1 Viewport Breakpoint Specifications

| Viewport Tier | Pixel Range | Primary Navigation Pattern | Layout Strategy |
| :--- | :--- | :--- | :--- |
| **Mobile Compact** | 320px – 480px | Bottom/Slide Drawer Navigation | Single-column stacked cards, collapsed tables |
| **Mobile Standard** | 480px – 640px | Slide Drawer Navigation | 1 to 2 column adaptive grid |
| **Tablet Portrait** | 640px – 840px | Slide Drawer Navigation with badge icon | 2-column adaptive layout |
| **Tablet Landscape** | 840px – 1024px | Collapsible Sidebar (64px mini / 256px expanded) | 2 to 3 column grid |
| **Desktop Standard** | 1024px – 1440px | Persistent Left Sidebar (256px fixed) | 3-column / 4-column balanced grid |
| **Desktop Wide** | 1440px+ | Persistent Left Sidebar with Max-W 7xl Centered Container | Controlled max-width layout preventing eye strain |

---

## 3. Responsive Component Behaviors

### 3.1 Global Shell & Navigation
- **Sidebar (`Sidebar.jsx`):**
  - **Mobile (< 1024px):** Rendered as an off-canvas drawer controlled by `isOpen` state and backdrop click dismiss. Uses CSS transitions `translate-x-0` and `-translate-x-full`.
  - **Desktop (>= 1024px):** Fixed left navigation (256px width) with sticky position, enabling uninhibited scroll of the primary workspace.
- **Topbar (`Topbar.jsx`):**
  - **Mobile:** Search input collapses to a compact search icon or modal trigger. Role switcher collapses to a pill badge.
  - **Desktop:** Full search bar with keyboard shortcut hint (`⌘K`), quick role switcher, notification drawer trigger, and user profile popover.

### 3.2 Data Tables (`DataTable.jsx`)
- Tables utilize `overflow-x-auto` wrapped in rounded card containers (`border-[#BACBC0]/40`).
- Critical identifiers (Candidate Name, Roll Number, Drive Name) remain sticky on the left column during horizontal scroll on small mobile viewports.
- Pagination controls wrap gracefully on small screens without overlapping page numbers.

### 3.3 Form Layouts & Inputs
- All form grids dynamically switch from `grid-cols-1` on mobile to `grid-cols-2` or `grid-cols-3` on tablet and desktop.
- Touch target sizes for all inputs, buttons, and clickable list items meet the recommended minimum of **44px × 44px** on touch devices.

### 3.4 Modal Dialogs & Drawers
- On viewports < 640px, modals expand to `w-full` with 16px horizontal margins or transition into bottom sheets (`bottom-0 rounded-b-none rounded-t-2xl`).
- On viewports >= 640px, modals are centered with max-width limits (`sm:max-w-lg`, `sm:max-w-2xl`).

---

## 4. Verification Matrix

| Viewport | Component Tested | Result | Verification Notes |
| :--- | :--- | :--- | :--- |
| **375px (iPhone SE)** | Student Overview | PASS | Single-column cards, no horizontal bleed, buttons wrap neatly |
| **390px (iPhone 14)** | Student Profile Edit | PASS | Tab navigation scrolls horizontally, form inputs full width |
| **768px (iPad Mini)** | TPO Verification Portal | PASS | Two-column evidence inspect, modal dialogs centered |
| **820px (iPad Air)** | Knowledge Graph Visualizer | PASS | Cytoscape graph canvas scales responsively |
| **1024px (Desktop Small)**| Recruiter Discovery | PASS | Sidebar docks on left, 3-column candidate cards |
| **1440px (MacBook Pro)**| All Views | PASS | Centered max-w-7xl content container, zero layout stretching |
| **1920px (Full HD Monitor)**| All Views | PASS | Crisp margins, optimal line-lengths (< 80 characters for text) |
