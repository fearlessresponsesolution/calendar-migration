---
name: Shift Calendar
description: Shift scheduling and coverage management for a cyber operations team.
colors:
  console-dark: "#1a1a2e"
  ops-panel: "#16213e"
  base-dark: "#0f172a"
  panel-border: "#334155"
  ink: "#e2e8f0"
  ink-muted: "#94a3b8"
  signal-blue: "#3b82f6"
  alert-red: "#ef4444"
  warn-amber: "#f59e0b"
  confirm-green: "#10b981"
typography:
  headline:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  micro:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  xs: "3px"
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-sm:
    backgroundColor: "{colors.ops-panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "5px 12px"
  button-sm-hover:
    backgroundColor: "{colors.panel-border}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "5px 12px"
  button-primary:
    backgroundColor: "#1d4ed8"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "5px 12px"
  button-primary-hover:
    backgroundColor: "#2563eb"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "5px 12px"
  form-input:
    backgroundColor: "{colors.ops-panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "5px 8px"
  item-row:
    backgroundColor: "{colors.ops-panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 10px"
---

# Design System: Shift Calendar

## 1. Overview

**Creative North Star: "The Shift Log"**

The Shift Calendar's visual language is derived from operational record-keeping: the authoritative log of who was on watch, when, and at what coverage level. Every element on screen is accountable data, not decoration. The interface should feel like the roster board at the start of a shift handover: precise, complete, instantly readable, and trusted by the people who depend on it.

The palette is console dark — the color of a terminal at rest. The deep navy backgrounds (`#1a1a2e` through `#0f172a`) are not dramatic; they are the operational default for a team that works across all hours under controlled lighting. The accent blue (`#3b82f6`) is the signal color: it marks active states, current selection, and primary actions. It appears sparingly so its presence carries meaning.

This system explicitly rejects the look of consumer scheduling tools (Google Calendar's bright multi-color event grid), the warm-neutral productized-SaaS aesthetic, and any decorative chrome that competes with the schedule data. The tool should disappear into the task. Operators should not notice the UI; they should notice the shift.

**Key Characteristics:**
- Flat tonal depth: three named surface levels instead of shadows
- Dense, fixed-size typography on a consistent 10-16px scale
- Semantic color roles for status (danger, warn, success, accent) — never decorative
- Member identity carried through per-member color dots and role badges, not typography variation
- Controls are distinctly interactive at rest: bordered, surfaced, and immediately recognizable

## 2. Colors

The palette is a compressed monochromatic navy with four punctuation colors for status. Hue variation within the neutral layer is minimal by design; the per-operator color swatches (defined per member) provide the only hue variation inside the calendar grid.

### Primary

- **Signal Blue** (`#3b82f6`): The single interactive accent. Used on focused/active state buttons, the today-cell border, selected toggle states, and primary action fills. Appears on 15% or less of any screen at rest.

### Neutral

- **Console Dark** (`#1a1a2e`): The base viewport background. The floor of the visual stack. Nothing renders on this directly at rest; it is always the outermost surface layer visible between components.
- **Ops Panel** (`#16213e`): Primary content surface. Default background for calendar cells (implied), `.item-row` elements, button default state, and form inputs. The color operators spend most of their time looking at.
- **Base Dark** (`#0f172a`): The header bar, modal interiors, sidebar toolbars, and select controls. Slightly darker than Ops Panel; used where panels need to recede behind active content.
- **Panel Border** (`#334155`): All dividing lines. Used as the sole `border-color` on cards, inputs, modal edges, and section separators. Consistency here is load-bearing; a mismatched border breaks the visual contract.
- **Ink** (`#e2e8f0`): Primary text. All body copy, headings, button labels, and interactive labels at rest.
- **Ink Muted** (`#94a3b8`): Secondary text. Form field labels, metadata, timestamps, placeholder text. Subordinate to Ink — never used where the reader needs to act.

### Status

- **Alert Red** (`#ef4444`): Destructive actions (delete), error feedback, and critical conditions.
- **Warn Amber** (`#f59e0b`): Conflict indicators, session-expiry alerts, and unassigned shift outlines. The amber dashed border on ShiftBar is the established visual grammar for "a gap in coverage exists."
- **Confirm Green** (`#10b981`): Success feedback and positive status confirmation.

### Named Rules

**The Signal Rule.** Signal Blue (`#3b82f6`) marks interactive state and current selection only. It does not appear as a background fill on inactive elements, as a decorative stripe, or as text color on static content. When it is absent, the user is looking at data. When it appears, something is active or actionable.

**The Member Color Rule.** Per-operator color swatches are the only source of hue variation within the calendar grid. These colors are data, not decoration. Never introduce additional hue variety into the neutral surface layer; let the member colors do their work.

## 3. Typography

**UI Font:** Geist Sans (`system-ui, sans-serif` fallback)
**Data / Mono Font:** Geist Mono (`ui-monospace, monospace` fallback)

**Character:** A single geometric sans carries all scales from micro badges to the app title. Geist Sans is clean enough for dense operational data and distinct enough at small sizes to remain legible across the 10-16px range this interface uses. Geist Mono is reserved for time values and fixed-width data where character alignment aids scanning.

### Hierarchy

- **Headline** (700, 16px, line-height 1.25): The app-level identifier. "Shift Calendar" in the header and the login page title. One instance per viewport.
- **Title** (600, 15px, line-height 1.3): Modal and panel headings. Distinguishes a modal's subject from its body content.
- **Body** (400, 14px, line-height 1.5): Standard UI text. Panel descriptions, member names in editors, shift detail text.
- **Label** (400, 13px, line-height 1.4): Form field labels, button text, compact list items, tab labels. The workhorse scale.
- **Micro** (600, 11px, line-height 1.2): Badge text, cert-level indicators, role abbreviations. Always weighted to offset the reduced size. Used sparingly — information density is already high at this scale.
- **Mono** (400, 12px, line-height 1.5): Time strings (`0600–1400`) and other fixed-width values where column alignment matters.

### Named Rules

**The Fixed-Scale Rule.** No fluid (`clamp()`-based) type sizes. Operators view this tool on consistent workstation monitors. Fluid headings that shrink in a narrow side panel introduce noise without serving the task.

**The Weight-as-Hierarchy Rule.** The size ratio between adjacent levels is deliberately tight (1.0-1.1x). Weight contrast (400 vs 600 vs 700) carries the hierarchy, not size alone. Do not increase font sizes to create emphasis; use weight or Ink vs Ink Muted.

## 4. Elevation

The system is flat by default. Depth is expressed through tonal layering: three named surface levels (Console Dark → Ops Panel → Base Dark) create spatial hierarchy without shadows. Components at rest cast no shadow.

The one exception is the modal overlay panel, which uses `box-shadow: 0 8px 40px rgba(0,0,0,0.5)` to lift it visibly above the `rgba(0,0,0,0.65)` dimmed backdrop. This is the only shadow in the system.

### Shadow Vocabulary

- **Modal lift** (`0 8px 40px rgba(0,0,0,0.5)`): Applied only to modal panel containers over the backdrop. Not available to cards, dropdowns, or inline components.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Only the modal panel uses a shadow, and only because the backdrop color requires it. Cards, buttons, inputs, and panels use Panel Border and background tonal difference to communicate structure. A new component that needs a shadow is a component that needs to be reconsidered.

## 5. Components

Controls should read as structured and legible at rest: bordered, surfaced, instantly recognizable as interactive. They are instruments, not decoration.

### Buttons

- **Shape:** 6px radius (`rounded.md`). Consistent across all variants.
- **Default (btn-sm):** `ops-panel` background, `ink` text, 1px `panel-border` border. Padding: 5px 12px. Font: label scale (13px, 400). Transition: `background-color 150ms`.
- **Hover:** Background shifts to `panel-border` (`#334155`). Text remains `ink`.
- **Focus:** 2px solid `signal-blue` outline at 2px offset.
- **Disabled:** 50% opacity, `not-allowed` cursor.
- **Primary (filled):** `#1d4ed8` (blue-700) background, white text. Reserved for the dominant action in a context ("Add Shift", "Save assignments"). Hover shifts to `#2563eb` (blue-600).
- **Destructive (text):** `alert-red` text, no background, no border. Used inline in dense list rows ("Delete" beside a shift). Hover lightens to `#fca5a5`.
- **Active / selected toggle:** `signal-blue` border and `signal-blue` text over `ops-panel` background. Background may receive `rgba(59,130,246,0.1)` tint on hover.

### Inputs and Selects

- **Style:** `ops-panel` background, 1px `panel-border` border, 6px radius. Font: label scale (13px).
- **Focus:** Border color transitions to `signal-blue`. No glow, no box-shadow.
- **Placeholder:** `ink-muted`. Must hit 4.5:1 contrast — verify before extending.
- **Select controls:** Same styling. `base-dark` background in contexts where they appear over a darker surface (settings sidebar, admin preview).

### Bordered Panels

The system's primary container pattern. Used for shift editor rows, member list sections, and settings area containers.

- **Corner style:** 6px radius (`rounded.md`)
- **Background:** `ops-panel` (`#16213e`)
- **Border:** 1px solid `panel-border` (`#334155`)
- **Shadow:** None (Flat-By-Default Rule)
- **Padding:** 16px for modal sections; 8-10px for compact list rows

### Item Row

A compact list item. Background is `ops-panel`, 6px radius, 8-10px padding, 8px gap between elements. Used for member lists, role lists, and any repeating row of structured data.

### Modal Overlay

- **Backdrop:** `rgba(0,0,0,0.65)`, full viewport, `z-index: 50`.
- **Panel:** Max-width 672px, max-height 85vh, `base-dark` background, 1px `panel-border` border, 8px radius, modal-lift shadow.
- **Header row:** `borderBottom: 1px solid panel-border`; title at title scale (15px, 600); close glyph (`×`) in `ink-muted`, no border or background.
- **Close hover:** `ink`.

### Navigation Header

- **Background:** `base-dark` (`#0f172a`), full width, 1px `panel-border` bottom border.
- **Padding:** 10px 16px.
- **App title:** Headline scale (16px, 700), `ink`.
- **Action buttons:** `btn-sm` style. Active toggles adopt `signal-blue` border and text. Conflict count: `alert-red` pill with white text, inline on the button.

### ShiftBar (Signature Component)

The core data unit of the calendar grid. Renders as a compact pill inside a day cell.

- **Assigned shift:** Member's color at `cc` opacity (80%) as background; white text; 3px radius; 3px/5px padding.
- **Unassigned shift:** Transparent background; 1px dashed `warn-amber` border; `warn-amber` text. Signals a coverage gap immediately.
- **Member pills within the bar:** 8px color dot, truncated first name, optional role abbreviation badge. Hover on a pill: `rgba(255,255,255,0.15)` background, no border added.
- **Role badge within pill:** Role color at 20% opacity background, role color text, 3px radius, 9px font.

### Status Badges

Inline chips for cert levels, role tags, and conflict counts.

- **Conflict / danger badge:** `alert-red` background, white text, 10px radius pill, micro scale (11px, 600). Rendered inline on the Conflicts button.
- **Role tag:** `base-dark` background, `panel-border` border, `ink-muted` text. 3px radius, micro scale (10px). Unobtrusive; subordinate to the member's color identity.
- **Cert-level badge:** Color derived from cert level value. 3px radius, micro scale (11px, 600).

## 6. Do's and Don'ts

### Do:

- **Do** use the three-level surface stack (Console Dark → Ops Panel → Base Dark) to imply depth. Maintain the order; do not introduce a fourth tonal level.
- **Do** restrict Signal Blue to interactive state and current selection. Its rarity is the point; overuse collapses the semantic system.
- **Do** use Panel Border (`#334155`) as the single border color across all components. Consistency here is structural, not stylistic.
- **Do** verify all body-scale text hits 4.5:1 contrast against its surface. Ink Muted (`#94a3b8`) on Ops Panel (`#16213e`) is the tightest pair in the system — confirm it before extending the pattern.
- **Do** use Warn Amber and the dashed border on unassigned ShiftBars. This visual grammar is established; keep it consistent across any new shift-like component.
- **Do** keep all font sizes within the defined scale (10-16px). No new sizes; no fluid scaling.
- **Do** specify all interactive states (default, hover, focus, active, disabled) for any new component. Half-specified controls are not production-ready.
- **Do** resolve all color references to the named CSS token set (`--bg`, `--surface`, `--surface2`, `--border`, `--text`, `--text-muted`, `--accent`, `--danger`, `--warn`, `--success`). No raw Tailwind color utilities (`bg-gray-700`, `text-gray-300`) in components — they are design debt, not design decisions.

### Don't:

- **Don't** introduce shadows on cards, panels, or buttons. The modal-lift shadow is the only shadow in the system. If you think a component needs a shadow, reconsider the component.
- **Don't** let the interface look unfinished or inconsistent. This is a tool operators trust at shift handover. Placeholder metadata ("Create Next App"), mismatched color values, and ad-hoc hardcoded hex colors undermine that trust.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on any component. Use a background tint or a full border instead.
- **Don't** use gradient text (`background-clip: text` with a gradient background). Solid Ink or Signal Blue only.
- **Don't** add decorative motion. The only transitions in the system are `background-color` on hover (150ms). No entrance animations, no page-load choreography, no scroll-driven reveals. Operators are in flow; they should not wait for the UI.
- **Don't** use display fonts or decorative typefaces in UI labels, buttons, or data fields. Geist Sans across all scales; Geist Mono for time and fixed-width values only.
- **Don't** build consumer calendar aesthetics (bright per-category colors, event bubbles, day-view time grids). This is a roster tool, not a personal scheduling app.
- **Don't** use `bg-gray-700`, `text-gray-300`, or any raw Tailwind gray utilities alongside the CSS token system. All color must flow through the named tokens. Mixing the two systems creates drift that compounds across every new component.
