---
name: FinTrace Core
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#004f35'
  on-tertiary: '#ffffff'
  tertiary-container: '#006948'
  on-tertiary-container: '#76eab6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-dense: 0.5rem
  margin: 1.5rem
  margin-compact: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system establishes an institutional-grade, hyper-rigorous visual environment built specifically for forensic accountants, compliance officers, and anti-money laundering (AML) investigators. 

### Brand Personality & Tone
- **Forensic Precision:** Every pixel, boundary, and value communicates unyielding mathematical accuracy. Nothing is decorative; every UI artifact carries evidentiary weight.
- **Immediate Institutional Trust:** Evokes the operational authority of Bloomberg Terminal, federal auditing consoles, and quantitative risk engines, modernized into an ultra-clean SaaS interface.
- **Decisive & Uncluttered:** Cognitive friction is eliminated through disciplined visual hierarchy, high density without overcrowding, and strict tabular organization.
- **Calm Resilience Under Pressure:** Avoids alarmist UI treatments. Critical findings are highlighted with surgical color alerts rather than overwhelming noise.

### Design Movement
- **Corporate & Precision Utilitarianism:** Rooted in Swiss typographic clarity combined with modern financial engineering ergonomics. The interface leverages flat surface-tiering, hairline micro-borders (`1px`), tightly disciplined spacing rhythms, and high-legibility tabular alignment to handle thousands of micro-transaction vectors without user fatigue.

## Colors

The color architecture is built around neutral, low-strain canvas surfaces, high-contrast typography, a singular purposeful audit blue, and strict semantic indicators for risk categorization.

### Surface & Foundation Tokens
- **Canvas Base (`#F8FAFC`):** Primary application backdrop providing low eye fatigue over long investigation sessions.
- **Surface Layer 1 (`#FFFFFF`):** High-clarity white for cards, data grids, inspection panels, and modular worksheets.
- **Surface Layer 2 (`#F1F5F9`):** Subdued surface for table header bars, frozen columns, disabled inputs, and secondary badges.
- **Subtle Hairline Borders (`#E2E8F0`):** Single-pixel perimeter framing to delineate audit boundaries with absolute clarity. Dark mode equivalent shifts to `#334155`.

### Text & Semantic Scale
- **Text Primary (`#0F172A`):** Deep slate/navy for primary values, table text, headers, and audit trails.
- **Text Secondary (`#475569`):** Controlled neutral for metadata tags, table column labels, and peripheral timestamps.
- **Text Tertiary / Muted (`#94A3B8`):** Inactive indicators, empty states, and minor secondary IDs.

### Brand & Interactive Accent
- **Primary Audit Blue (`#1D4ED8`):** Reserved strictly for primary callouts, active drill-downs, query actions, and selected investigation nodes.
- **Interactive Blue Hover (`#1E40AF`):** Press state and elevated focal elements.
- **Focus Ring / Outline (`#93C5FD`):** Accessible, WCAG AAA-compliant keyboard navigation ring with 2px offset.

### Evidence & Semantic Risk Palette
- **High Risk / Critical Flag (`#DC2626`):** Reserved for sanctioned entities, anomalous wash trading, and confirmed fraudulent beneficiaries. Paired with soft tint background `#FEF2F2`.
- **Medium Risk / Anomaly Alert (`#D97706`):** Used for atypical velocity, velocity spikes, and unverified shell corporate routing. Paired with soft tint background `#FFFBEB`.
- **Low Risk / Clear Audit (`#059669`):** Applied to cleared ledgers, verified entity credentials, and passed compliance checks. Paired with soft tint background `#ECFDF5`.
- **Informational / Machine Inferred (`#0284C7`):** Machine learning confidence scores and synthetic relationship linkages. Paired with `#F0F9FF`.

## Typography

Typography governs the efficiency of the investigative workflow. The typographic hierarchy utilizes `Inter` for interface structure, labels, and analytical narratives, while `JetBrains Mono` handles all numerical, tabular, cryptographic, and identifier representations.

### Typographic Principles
- **Dense Legibility:** Default body size is calibrated to `13px` with a tightly paired `18px` line height. This increases the total visible audit trail on a standard 1080p monitor by ~28% compared to standard consumer web defaults.
- **Tabular Figures:** All number displays within `Inter` must have CSS `font-variant-numeric: tabular-nums` active by default, ensuring numerical digits align vertically across table columns.
- **Dedicated Technical Monospace:** Account hashes, SWIFT/BIC codes, transaction UUIDs, IP endpoints, and micro-currency amounts must use `JetBrains Mono`. This prevents letterform ambiguity (such as `0` versus `O`, or `1` versus `l`) during high-stakes forensic inspection.
- **Letter Spacing Discipline:** Tight tracking on headings (`-0.01em` to `-0.02em`) preserves visual weight, while micro labels (`11px`) feature expanded tracking (`+0.03em`) for immediate scannability.

## Layout & Spacing

The layout model is anchored by an information-dense, full-viewport dashboard engine designed to maximize horizontal workspace for multi-column data grids and entity-relationship investigation graphs.

### Grid & Layout Structure
- **Master Workspace Engine:** 12-column fluid grid system pinned inside a zero-margin shell with collapsible navigation rails (64px collapsed, 240px expanded).
- **Dual Column Density:**
  - **Standard Grid:** `1rem` (16px) gutters for overview dashboards, case queues, and executive audit summaries.
  - **Dense Ledger Grid:** `0.5rem` (8px) gutters for ledger drill-downs, cross-account transfer matrices, and split inspector panels.
- **Panels & Dividers:** Vertical split-screens maintain a minimum 60/40 ratio between primary investigative ledgers and contextual sidebars (explainability breakdowns, entity details).

### Breakpoints & Reflow Behavior
- **Desktop Ultrawide (>1440px):** 3-panel layout: Main Navigation (iconic/compact), Investigation Canvas (graph + transaction matrix), and Forensic Explainability Panel (pinned right, 380px fixed).
- **Desktop Standard (1024px - 1439px):** 2-panel layout: Navigation collapses to iconic rail. Forensic Explainability Panel converts into an overlay drawer or toggled bottom sheet.
- **Tablet / Mobile Fallback (<1023px):** Data tables adopt horizontal scroll containers with frozen primary columns (Beneficiary ID, Amount). Graph models fall back to sequential transaction list views with expandable risk badges.

## Elevation & Depth

To maintain forensic clarity and avoid distracting visual artifacts, the design system minimizes heavy drop shadows. Depth is communicated primarily through **tonal layering** and **low-contrast micro-outlines**.

### Elevation Stack
- **Level 0 (Base Canvas):** Background `#F8FAFC`. Zero elevation, zero shadows.
- **Level 1 (Cards, Worksheets, Tables):** Background `#FFFFFF`, border `1px solid #E2E8F0`. Flat elevation. Visual separation is achieved strictly through perimeter borders.
- **Level 2 (Active Focus Panels, Hovered Data Rows):** Background `#FFFFFF`, border `1px solid #CBD5E1`, shadow `0 1px 3px 0 rgba(15, 23, 42, 0.05)`.
- **Level 3 (Dropdowns, Filter Menus, Cell Inspector Popovers):** Background `#FFFFFF`, border `1px solid #CBD5E1`, shadow `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 4 (Forensic Audit Modals & Transaction Overlays):** Background `#FFFFFF`, border `1px solid #94A3B8`, shadow `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)`. Backdrop is covered by a 40% `#0F172A` scrim with `backdrop-filter: blur(2px)`.

## Shapes

The design system adopts a **Level 1 (Soft)** shape geometry. Surfaces emphasize strict rectangular structure with subtle 4px (`0.25rem`) rounded corners to soften digital fatigue while preserving a disciplined, engineering-grade contour.

### Radius Assignments
- **Micro Radius (`0.125rem` / 2px):** Badges, risk score tags, and inline cell markers.
- **Standard UI Radius (`0.25rem` / 4px):** Primary buttons, input fields, dropdown trigger buttons, check targets, and table action pills.
- **Container Radius (`0.375rem` / 6px):** Metric scorecards, transaction ledger card enclosures, and modal window perimeters.
- **Pills / Full Circles:** Strictly prohibited for functional containers. Permitted only for circular entity avatars or micro status dots (6px × 6px).

## Components

### Buttons
- **Primary Audit Action:** Background `#1D4ED8`, text `#FFFFFF`, border none, radius `4px`, padding `6px 12px`, font `Inter 13px / 600`. Hover: `#1E40AF`. Active: `#1E3A8A`.
- **Secondary / Export:** Background `#FFFFFF`, text `#0F172A`, border `1px solid #E2E8F0`, hover: background `#F8FAFC`, border `#CBD5E1`.
- **Destructive / Flag Case:** Background `#FEF2F2`, text `#DC2626`, border `1px solid #FECACA`, hover: background `#FEE2E2`.
- **Micro-Action (In-Table):** Height `24px`, padding `0 8px`, font `11px / 500`. Minimizes visual bloat inside dense row records.

### Chips & Risk Badges
- **Format:** Height `20px`, padding `0 6px`, radius `2px`, font `JetBrains Mono 11px / 500`.
- **Verified / Low Risk:** Background `#ECFDF5`, text `#047857`, border `1px solid #A7F3D0`. Dot indicator `#059669`.
- **Warning / Medium Risk:** Background `#FFFBEB`, text `#B45309`, border `1px solid #FDE68A`. Dot indicator `#D97706`.
- **Critical / Sanction Risk:** Background `#FEF2F2`, text `#B91C1C`, border `1px solid #FECACA`. Dot indicator `#DC2626`.

### Audit Tables & Data Grids
- **Header:** Height `32px`, background `#F8FAFC`, border-bottom `1px solid #CBD5E1`, text `#475569`, font `Inter 11px / 600`, text-transform `uppercase`, tracking `0.04em`.
- **Rows:** Height `36px` (compact density) or `44px` (standard density). Alternating striping is disabled; rows rely on subtle `1px solid #F1F5F9` bottom divider. Hover state: `#F8FAFC`. Selected state: `#EFF6FF` with `2px` left border in `#1D4ED8`.
- **Numeric & Technical Alignment:** All financial amounts, dates, and scores align flush-right using `JetBrains Mono`. Entity names and narration descriptions align flush-left in `Inter`.

### Input Fields & Filters
- **Form Controls:** Background `#FFFFFF`, border `1px solid #CBD5E1`, radius `4px`, height `32px`, padding `0 10px`, font `Inter 13px / 400`, placeholder `#94A3B8`. Focus: border `1px solid #1D4ED8`, ring `2px rgba(29, 78, 216, 0.15)`.
- **Filter Tags Bar:** Inline segmented pills containing label, active comparator, and removal cross icon. Background `#F1F5F9`, border `1px solid #E2E8F0`.

### Selection Controls (Checkboxes & Radios)
- **Checkbox:** Square `14px × 14px`, border `1px solid #94A3B8`, radius `2px`. Checked state: background `#1D4ED8`, border `#1D4ED8`, white check icon. Indeterminate state uses horizontal minus bar.

### Metric Cards & Scorecards
- **Layout:** Background `#FFFFFF`, border `1px solid #E2E8F0`, radius `6px`, padding `12px 16px`.
- **Content Flow:** Upper label (`Inter 11px / 500 #64748B`), primary numeric readout (`JetBrains Mono 24px / 700 #0F172A`), footer trend delta with inline percentage tag and micro confidence badge.

### Explainability Panels (AI / Heuristic Drill-Down)
- **Structure:** Pinned auxiliary pane with header indicating model confidence, rule-matching logic, and evidentiary citations.
- **Factor List:** Horizontal bars showing feature contribution weights (e.g., Velocity Spike: +42%, Circular Routing: +38%). High-risk factors render in crimson `#DC2626`, normalizing factors in slate `#64748B`.