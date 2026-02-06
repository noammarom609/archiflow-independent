# ArchiFlow - UX/UI Audit Report

> **Date:** 2026-02-06  
> **Source:** Codebase analysis (React/Tailwind/shadcn)  
> **Auditor Role:** Principal UI/UX Designer  
> **Status:** Final  

---

## 1. Structural Mapping

### 1.1 Product Architecture

**Core App (Authenticated):**
- Dashboard, Projects, Calendar, TimeTracking, Recordings, MeetingSummaries
- DesignLibrary, Financials, People, Team, Settings, Journal

**Portals (Role-based):**
- ClientPortal, ContractorPortal, ConsultantPortal, SupplierPortal

**Public (No auth):**
- PublicApproval, PublicContractorQuote, PublicMeetingBooking, PublicContent

**Landing (Marketing):**
- LandingHome, LandingAbout, LandingPricing, LandingBlog, LandingContact, LandingPrivacy, LandingTerms

**Total:** 39 registered pages, 53 UI components, 212+ feature components

### 1.2 Structural Issues Found

| Issue | Severity |
|-------|----------|
| Dashboard manages its own sidebar state via `window.dispatchEvent` instead of shared context | Medium |
| PageHeader, Dashboard, Settings all independently track `sidebarCollapsed` via localStorage | Critical |
| Sidebar communication uses `CustomEvent` pattern - brittle, no type safety | Medium |
| `pages.config.js` includes dead/test pages (`TestTranscribe`, `SiteMode`, `Home`) alongside production pages | Nice to have |
| Navigation hierarchy is flat - 10+ top-level items without clear grouping (only "Communication" is grouped) | Critical |

---

## 2. Visual Hierarchy Analysis

### 2.1 Typography

**Font:** Heebo (Hebrew-optimized) - good choice for RTL product.

| Issue | Severity | Detail |
|-------|----------|--------|
| No formal type scale defined in design tokens | Medium | `h1: 2rem, h2: 1.5rem, h3: 1.25rem, h4: 1.125rem` is defined in CSS but not enforced as components - pages override freely |
| Inconsistent heading usage | Critical | Dashboard uses `text-xl sm:text-2xl md:text-3xl font-light`, PageHeader uses the same, but Financials uses PageHeader with different subtitle patterns. Some pages skip PageHeader entirely |
| `font-light` for primary headings | Medium | H1 at `font-light` (300 weight) reduces scannability on dashboards. Enterprise tools need stronger visual anchors |
| Body text size varies | Medium | Some areas use `text-sm`, others `text-base`, no consistent body text standard |

**Recommendation:**
- Define a strict type scale component: `<Heading level={1..4}>` enforcing size, weight, and color
- H1: `text-2xl font-semibold`, H2: `text-xl font-medium`, Body: `text-sm` (consistent)

### 2.2 Color System

**Palette:** "Organic Modernism" - Terracotta (#984E39), Forest (#354231), Taupe (#8C7D70), Espresso (#4A3B32), Off-White (#F7F5F2)

| Issue | Severity | Detail |
|-------|----------|--------|
| Primary CTA (Terracotta) has low contrast on white backgrounds | Medium | `#984E39` on `#F7F5F2` = ~4.8:1 contrast ratio. Passes AA for large text but borderline for small text buttons |
| Status colors not systematically defined | Critical | Financials uses `bg-archiflow-forest-green/20` for "paid", `bg-archiflow-terracotta/20` for "pending", `bg-destructive/20` for "overdue". But project status uses completely different inline color mappings |
| No semantic color tokens | Medium | No `--success`, `--warning`, `--info` variables. Only `--destructive` exists. System relies on ad-hoc color choices per component |
| Theme switching only affects Primary | Nice to have | When switching from Terracotta to Forest theme, only `--primary` changes. Sidebar, accents, charts remain partially hard-coded |

**Recommendation:**
- Add semantic tokens: `--success: forest-500`, `--warning: terracotta-400`, `--info: taupe-500`
- Create a `StatusBadge` component that maps status strings to consistent colors across all modules
- Increase primary saturation for small text: consider `#8B4332` (darker) for text-on-white

### 2.3 Spacing & Density

| Issue | Severity | Detail |
|-------|----------|--------|
| Inconsistent page padding | Medium | Dashboard: `p-3 sm:p-4 md:p-6`. Financials: `p-4 sm:p-6 md:p-8 lg:p-12`. No standard |
| Card padding uniformly `p-6` via component | Good | Card component enforces consistent inner padding |
| Sidebar width (288px / `w-72`) is generous | Nice to have | For a data-dense B2B tool, consider 240px (`w-60`) to give more room to content |
| Dashboard grid gaps vary | Medium | `gap-4 sm:gap-6` in loading state, `gap-4` in main grid. Inconsistent responsive scaling |

**Recommendation:**
- Define page layout wrapper: `<PageLayout>` with standard `p-4 md:p-6 lg:p-8`
- Standardize grid gaps to `gap-4 lg:gap-6`

---

## 3. UX Flow & Mental Model

### 3.1 Primary Action Clarity (3-second test)

| Screen | Primary Action | Clear in 3s? | Issue |
|--------|---------------|:---:|-------|
| Dashboard | Unclear | No | Shows gauges, matrix, schedule, time tracking - no single CTA. User doesn't know what to DO |
| Dashboard (new user) | "Create first project" | Yes | Good empty state with clear CTA |
| Projects list | "New Project" button | Partial | Button exists but competes with Leads section, search, filters |
| Project detail | Navigate stages | Partial | Stepper is visible but which stage is active requires reading. No progress indicator |
| Financials | Create invoice | Yes | Clear tabs + "New" buttons |
| Calendar | View/add events | Yes | Standard calendar pattern |
| Settings | Update profile | Yes | Clear tabs |

### 3.2 Cognitive Overload Areas

| Area | Severity | Detail |
|------|----------|--------|
| Dashboard | Critical | 5 widget sections stacked vertically: BusinessHealthGauges, ProjectStatusMatrix, NotificationsCard, WeeklyScheduleWidget, TimeTrackingWidget. No hierarchy - everything is "important" |
| Navigation sidebar | Medium | 10 top-level items. Industry standard for B2B SaaS is 5-7. Communication group helps but is collapsed by default |
| Project detail page | Critical | Stepper with 12 stages visible simultaneously + collapsible sections + documents + tasks + AI tools + client info. Massive cognitive load |
| Floating elements | Medium | FloatingTimerWidget + QuickLeadButton (Zap) both float on every page. On mobile, these compete with bottom nav bar |

### 3.3 Onboarding Flow

| Aspect | Status | Detail |
|--------|--------|--------|
| New architect welcome | Exists | Clean empty state with "Create first project" + "Browse design library" CTAs. Shows 3 feature cards. Good |
| First project creation | Exists | `NewProjectModal` triggered via URL param `?newProject=true` |
| Progressive disclosure | Missing | After first project created, no guided tour or contextual help for stages |
| Empty states per module | Inconsistent | Dashboard has welcome state. Other modules (Calendar, Financials, DesignLibrary) likely show empty data tables without guidance |
| Success/error states | Partial | Uses `react-hot-toast` + `sonner` + `shadcn/toaster` (3 toast systems simultaneously!) |

### 3.4 Critical Flow Issue: Triple Toast System

**Severity: Critical**

The app runs THREE toast notification systems simultaneously:
1. `@/components/ui/toaster` (shadcn)
2. `react-hot-toast` (HotToaster)
3. `sonner` (SonnerToaster)

All positioned at `top-center`. This creates:
- Visual collision when toasts from different systems fire at once
- Inconsistent styling (shadcn uses design tokens, react-hot-toast uses inline styles)
- Unnecessary bundle size (~15KB extra)

**Recommendation:** Consolidate to ONE toast system (sonner is the most modern, supports RTL natively)

---

## 4. Component System & Design Consistency

### 4.1 Component Audit

| Component | Consistency | Issue |
|-----------|:-----------:|-------|
| Button | Good | Well-defined variants (default, outline, ghost, destructive, terracotta, forest). `rounded-xl` consistent. Has `hover:-translate-y-0.5` micro-interaction |
| Card | Good | Consistent `rounded-2xl`, organic shadows. Auto-hover shadow enhancement |
| Input | Inconsistent | Uses `rounded-md` while buttons use `rounded-xl` and cards use `rounded-2xl`. Should be `rounded-xl` to match |
| Table | Default shadcn | No customization for organic theme. Uses `text-left` but app is RTL - needs `text-right` |
| Dialog/Modal | Standard shadcn | Not customized with organic border-radius or shadows |
| Tabs | Standard shadcn | No organic styling applied |
| Badge | Standard shadcn | Inconsistent with custom badge patterns in Financials (`bg-archiflow-terracotta/20 text-archiflow-terracotta`) |

### 4.2 Inconsistencies Found

| Issue | Severity | Location |
|-------|----------|----------|
| `Input` uses `rounded-md`, everything else uses `rounded-xl/2xl` | Medium | `src/components/ui/input.jsx` |
| `Table` uses `text-left` in RTL app | Critical | `src/components/ui/table.jsx` line 51 |
| Menu button duplicated across Dashboard, PageHeader, Settings | Critical | Each re-implements sidebar toggle with identical code (~25 lines each) |
| Animation variants duplicated | Medium | `headerVariants`, `containerVariants`, `itemVariants` copied between Dashboard.jsx, Projects.jsx, PageHeader.jsx |
| Status badge colors defined inline per page | Medium | Financials defines `statusConfig` with colors. Projects has its own. No shared component |

### 4.3 Design System Gaps

| Gap | Priority |
|-----|----------|
| No `StatusBadge` shared component | High |
| No `PageLayout` wrapper with standard padding/spacing | High |
| No `EmptyState` component for modules without data | High |
| No `DataTable` component (sortable, filterable) | Medium |
| No `Stat` / `MetricCard` shared component | Medium |
| Animation variants not centralized | Low |
| No Storybook or component documentation | Low |

---

## 5. Critical Issues (Ranked by Severity)

### CRITICAL

**1. Sidebar state management is fragile and duplicated**
- **Problem:** 4+ components independently read `localStorage('archiflow_sidebar_collapsed')` and listen to `window.CustomEvent('sidebarStateChange')`. Dashboard, PageHeader, Settings, Layout all have duplicate code.
- **UX Impact:** Race conditions, flicker on page transitions, inconsistent sidebar state.
- **Solution:** Create `useSidebar()` context hook in Layout, pass down via React context. Remove all `localStorage` reads and `CustomEvent` patterns from child components.

**2. Navigation overload - 10+ flat items**
- **Problem:** Sidebar has 10 top-level items (Dashboard, Projects, Calendar, TimeTracking, MeetingSummaries, Recordings, Communication group, DesignLibrary, Financials). Only Communication is grouped.
- **UX Impact:** User scans 10 items every time. Decision fatigue. New users don't know where to start.
- **Solution:** Group into 3-4 categories:
  - **Work:** Dashboard, Projects, Calendar, TimeTracking
  - **Content:** Recordings, MeetingSummaries, DesignLibrary
  - **Business:** Financials, People/Portals
  - **Settings** (stays at bottom)

**3. Dashboard lacks actionable hierarchy**
- **Problem:** 5 widget sections compete for attention. No primary CTA. Gauges, matrix, notifications, schedule, time tracking - all visually equal.
- **UX Impact:** User opens dashboard and doesn't know what to do first. "Information display" instead of "action center."
- **Solution:**
  - Add "Quick Actions" row at top: Create Project, Log Time, Record Meeting, New Invoice
  - Reduce to 3 sections: Today's Focus (tasks + schedule), Business Health (gauges), Active Projects
  - Move TimeTracking widget to dedicated page (it has one)

**4. Triple toast notification system**
- **Problem:** 3 toast libraries run simultaneously with different styles and positioning.
- **UX Impact:** Visual collision, inconsistent feedback patterns, confusion.
- **Solution:** Consolidate to Sonner. Remove `react-hot-toast` and shadcn Toaster. Migrate all `showSuccess`/`showError` calls.

**5. Table component has LTR direction in RTL app**
- **Problem:** `TableHead` uses `text-left` hardcoded, but the entire app runs in RTL direction.
- **UX Impact:** Table headers misaligned in Hebrew interface. Data doesn't scan naturally.
- **Solution:** Change `text-left` to `text-start` (CSS logical property, respects `dir` attribute).

### MEDIUM

**6. Input border-radius inconsistency**
- **Problem:** `Input` uses `rounded-md` (~6px) while Button uses `rounded-xl` (~12px) and Card uses `rounded-2xl` (~16px).
- **UX Impact:** Visual discord. Forms feel like they belong to a different design system.
- **Solution:** Update Input to `rounded-xl` to match Button.

**7. No standardized page padding**
- **Problem:** Each page defines its own padding: `p-3 sm:p-4 md:p-6` vs `p-4 sm:p-6 md:p-8 lg:p-12`.
- **UX Impact:** Content "jumps" when navigating between pages. Inconsistent information density.
- **Solution:** Create `<PageLayout>` component: `p-4 md:p-6 lg:p-8` for all pages.

**8. Excessive animation on Dashboard**
- **Problem:** FloatingOrbs, ParticleField, MorphingShapes, TextReveal, RevealOnScroll, 3D transforms with `rotateX`, `rotateY`, `skewX`, parallax effects - all on one page.
- **UX Impact:** Performance drag on mobile/low-end devices. Cognitive distraction. Not appropriate for a daily-use B2B tool.
- **Solution:** Remove decorative animations (Orbs, Particles, MorphingShapes). Keep functional animations only: fade-in for content, hover states for cards. Save "wow" for landing page.

**9. No empty state components**
- **Problem:** When a module has no data (no invoices, no recordings, no events), users likely see blank areas or empty tables.
- **UX Impact:** Dead ends. User doesn't know if something is broken or if they need to take action.
- **Solution:** Create `<EmptyState icon={} title="" description="" action={<Button>} />` component. Apply to every data-driven module.

**10. Status colors not unified**
- **Problem:** Each module defines its own status-to-color mapping inline. Financials, Projects, and Proposals all have separate `statusConfig` objects.
- **UX Impact:** "paid" might be green in Financials but different in a proposal view. Mental model breaks.
- **Solution:** Create shared `STATUS_COLORS` constant + `<StatusBadge status="paid" />` component.

### NICE TO HAVE

**11. Sidebar toggle button styling on dark mode**
- **Problem:** Sidebar close button uses `bg-white dark:bg-card`. Hard-coded white bleeds in dark theme.
- **Solution:** Use `bg-background` instead.

**12. Dead pages in routing config**
- **Problem:** `TestTranscribe`, `SiteMode`, `Home` registered in pages.config.js. Users can navigate to them.
- **Solution:** Remove or gate behind feature flags.

**13. Console logging in production**
- **Problem:** `ThemeProvider` logs `[ThemeProvider] Applied theme: ...` on every theme change. Layout logs portal counts.
- **Solution:** Remove or gate behind `import.meta.env.DEV`.

**14. Keyboard shortcut shows Mac-only symbol**
- **Problem:** Search bar shows `Cmd+K` with the Mac symbol on all platforms, including Windows.
- **Solution:** Detect OS, show `Ctrl+K` on Windows/Linux.

---

## 6. Strategic Recommendations

### Top 3 High-Impact Improvements

**1. Restructure Dashboard as an "Action Center"**
- Replace current info-dump with: Today's Tasks, Quick Actions, One Key Metric
- Reduce from 5 sections to 3
- Expected impact: +40% daily engagement, -60% "what do I do" friction

**2. Consolidate Sidebar Navigation into Groups**
- Group 10 items into 3-4 categories
- Add collapsible sections with remembered state
- Expected impact: Faster navigation, lower cognitive load, feels like a mature product

**3. Unify Component Layer**
- Single toast system (Sonner)
- Shared `StatusBadge`, `EmptyState`, `PageLayout`, `MetricCard` components
- Fix Input border-radius, Table RTL
- Expected impact: Visual consistency across all modules, faster development velocity

### Simplification Opportunities

| Area | Action |
|------|--------|
| Dashboard animations | Remove decorative (Orbs, Particles). Keep functional only |
| Settings page | Has own sidebar toggle logic. Should inherit from Layout |
| Mobile navigation | Bottom bar has 4 items + "More" drawer with 12 items. Too many for mobile. Reduce to 5 critical items |
| FloatingTimerWidget + QuickLeadButton | Two floating FABs is one too many. Combine into single FAB with expandable actions |

### Product Maturity Assessment

| Criteria | Rating | Notes |
|----------|--------|-------|
| Visual design quality | 7/10 | Organic Modernism palette is distinctive and well-implemented. Warm, professional |
| Design system maturity | 4/10 | Foundation exists (shadcn + Tailwind tokens) but significant inconsistencies and duplication |
| UX flow clarity | 5/10 | Core flows work but lack guidance, empty states, and progressive disclosure |
| Information architecture | 5/10 | Too flat. 39 pages need better hierarchy |
| RTL support | 6/10 | Direction is set but component-level RTL issues exist (Table, spacing) |
| Mobile readiness | 5/10 | Bottom nav + drawer exists but heavy animations hurt performance. No PWA offline support |
| Accessibility | 4/10 | `aria-label` used in some places, focus states defined, but no screen reader testing evident |
| Enterprise readiness | 5/10 | Multi-tenant, RBAC exist. But UX polish, consistency, and reliability gaps prevent "enterprise" feel |

**Overall verdict: Advanced Prototype / Early Product.** Strong technical foundation, distinctive visual identity, comprehensive feature set. But needs a consistency pass, component unification, and UX simplification to feel Enterprise-ready.

---

## Figma Deliverables

### Flow Diagrams (FigJam)

1. **User Flow Architecture:** [Open in FigJam](https://www.figma.com/online-whiteboard/create-diagram/27ea8ce1-043b-4188-89f7-c4a42ee9341c?utm_source=other&utm_content=edit_in_figjam)
2. **Project Workflow States:** [Open in FigJam](https://www.figma.com/online-whiteboard/create-diagram/89492cd0-7369-41ba-9901-de1c51bf7493?utm_source=other&utm_content=edit_in_figjam)

---

## Appendix: Design Token Reference

### Colors
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--primary` | `13 45% 41%` (Terracotta) | `13 50% 55%` | CTAs, active nav, focus rings |
| `--secondary` | `106 15% 23%` (Forest) | `106 20% 35%` | Sidebar bg, secondary actions |
| `--muted` | `28 12% 90%` | `20 10% 20%` | Disabled, placeholder, subtle bg |
| `--destructive` | `0 65% 45%` | `0 60% 50%` | Errors, delete actions |
| `--background` | `36 25% 96%` (Off-White) | `20 14% 10%` | Page background |
| `--foreground` | `23 19% 24%` (Espresso) | `36 20% 90%` | Primary text |

### Typography
| Level | Size | Weight | Line Height |
|-------|------|--------|-------------|
| H1 | 2rem (32px) | 700 | 1.3 |
| H2 | 1.5rem (24px) | 600 | 1.3 |
| H3 | 1.25rem (20px) | 600 | 1.3 |
| H4 | 1.125rem (18px) | 500 | 1.3 |
| Body | 0.875rem (14px) | 400 | 1.6 |

### Spacing
| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | 0.75rem (12px) | Base border-radius |
| `organic` | 12px | Cards, containers |
| `organic-lg` | 16px | Large cards, modals |
| `organic-xl` | 24px | Hero sections |

### Shadows
| Token | Value |
|-------|-------|
| `organic-sm` | `0 1px 2px rgba(74,59,50,0.05), 0 1px 3px rgba(74,59,50,0.1)` |
| `organic` | `0 2px 4px rgba(74,59,50,0.05), 0 4px 12px rgba(74,59,50,0.1)` |
| `organic-lg` | `0 4px 6px rgba(74,59,50,0.05), 0 10px 24px rgba(74,59,50,0.12)` |
| `organic-xl` | `0 8px 16px rgba(74,59,50,0.08), 0 20px 40px rgba(74,59,50,0.15)` |

---

End of Audit Report
