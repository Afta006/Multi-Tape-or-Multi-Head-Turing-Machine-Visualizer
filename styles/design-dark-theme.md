# Design System: The Obsidian Monolith

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Architect"**

This design system is not a standard dashboard; it is a high-precision instrument. We are moving away from the "browser-tab" aesthetic toward a "Terminal-Editorial" hybrid. The goal is to make the user feel they are peering into a high-density, high-value technical engine.

To break the "template" look, we lean into **intentional asymmetry**. Primary data visualizations should dominate the layout with aggressive scale, while meta-data and controls are tucked into "Low-Density Zones" using small-scale labels. We utilize high-contrast typography scales—pairing massive, technical headers with microscopic, hyper-legible utility text—to create a sense of professional authority.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is built on a foundation of absolute darkness, utilizing the "Obsidian" depth model.

### Surface Hierarchy & Nesting
We define space through "Lustre," not lines.
- **Base Layer:** Use `surface_container_lowest` (#000000) for the global backdrop.
- **Primary Workspaces:** Use `surface` (#0e0e0e) for the main visualization stage.
- **Nested Controls:** Use `surface_container` (#1a1919) for side panels.
- **Floating Inspectors:** Use `surface_container_highest` (#262626) for detail overlays.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders for sectioning are prohibited.
Boundary definition must be achieved through:
1. **Background Shifts:** A `surface_container_low` (#131313) sidebar sitting directly against a `surface` (#0e0e0e) main area.
2. **Tonal Transitions:** Using the `surface_bright` (#2c2c2c) token as a subtle top-edge highlight (0.5px) to simulate a light-catching "bevel" rather than a box.

### The "Glass & Gradient" Rule
To prevent the UI from feeling "flat," use **Glassmorphism** for floating nodes and modals. Use the `surface_variant` (#262626) with a 60% opacity and a `24px` backdrop blur.
**Signature Texture:** Primary actions should never be flat. Apply a subtle linear gradient from `primary_container` (#06b77f) to `primary` (#69f6b8) at a 135-degree angle to give nodes a pressurized, luminous feel.

---

## 3. Typography: Technical Editorial
We utilize a dual-font strategy to balance character with utility.

- **The Voice (Space Grotesk):** Used for all `display`, `headline`, and `label` roles. Its idiosyncratic geometry gives the tool its "Technical Visualizer" soul.
- *Usage:* Large `display-lg` (3.5rem) should be used for state changes or primary metrics, set with `-0.04em` letter spacing.
- **The Engine (Manrope):** Used for all `body` and `title` roles. Manrope provides the high-legibility required for dense data streams.
- *Usage:* `body-sm` (0.75rem) is the workhorse for data tables and node descriptions.

**Hierarchy Strategy:** Brand identity is conveyed through extreme scale contrast. A `display-sm` header (2.25rem) should often sit adjacent to a `label-sm` (0.6875rem) descriptor to create an "Architectural Blueprints" vibe.

---

## 4. Elevation & Depth: Atmospheric Pressure
In a pure black environment, shadows don't exist—glows do.

- **The Layering Principle:** Instead of standard "Drop Shadows," we use **Inner Luminescence**. To lift a card, give it a `surface_container_high` (#201f1f) fill and a 1px top border of `outline_variant` (#494847) at 20% opacity.
- **Ambient Glows:** For "floating" active nodes, use a "Bloom" effect. Instead of a black shadow, use a shadow with the `primary` (#69f6b8) color at 10% opacity, a `20px` blur, and `0px` spread.
- **The "Ghost Border" Fallback:** If a container requires a border for accessibility, use the `outline_variant` token at **15% opacity**. It should feel like a suggestion of a line, not a constraint.
- **Depth through Blur:** Use `surface_container_lowest` (#000000) for the background and layer a `secondary_container` (#006b56) radial gradient at 5% opacity behind active nodes to create "Atmospheric Depth."

---

## 5. Components: Precision Primitives

### Buttons
- **Primary:** Gradient fill (`primary_container` to `primary`). No border. `Space Grotesk` Medium.
- **Secondary:** Transparent fill, `Ghost Border` (15% `outline_variant`). On hover, transition to 10% `primary` background opacity.
- **Tertiary:** Pure text using `label-md`. Underlined only on hover with a 2px `primary` offset.

### Input Fields
- **Default State:** Background `surface_container_low` (#131313), no border, `sm` (0.125rem) radius.
- **Active State:** A subtle 1px "Glow Border" using `primary_dim` (#58e7ab).
- **Validation:** Error states use `error` (#ff716c) but must include a 4% `error_container` fill to "wash" the input area in a warning tone.

### Cards & Lists
- **Rule:** Forbid divider lines.
- **Separation:** Use `spacing-4` (1.4rem) of vertical whitespace or toggle between `surface` and `surface_container_low` backgrounds to denote list item change.
- **Interaction:** On hover, a list item should shift to `surface_bright` (#2c2c2c) at 5% opacity.

### Technical Nodes (Custom Component)
- **Structure:** `surface_container_highest` (#262626) background, `0.25rem` radius.
- **Status:** Use a `primary` (#69f6b8) 4x4px glowing dot in the top right corner to indicate "Active" status.

---

## 6. Do's and Don'ts

### Do:
- **Do** use `0.5` and `1` spacing units for micro-adjustments in technical data.
- **Do** lean into "Pure Black" (#000000) for high-contrast editorial moments.
- **Do** use `secondary_fixed` (#5afcd2) for syntax highlighting or code snippets to differentiate from UI actions.

### Don't:
- **Don't** use `9999px` (full) roundedness for anything other than status chips. It breaks the "Technical/Architectural" feel. Use `sm` (0.125rem) or `md` (0.375rem).
- **Don't** use grey shadows. If you need depth, use a darker surface color or a colored bloom.
- **Don't** center-align technical data. Keep everything on a rigid, left-aligned editorial grid to maintain a "Developer Tool" efficiency.