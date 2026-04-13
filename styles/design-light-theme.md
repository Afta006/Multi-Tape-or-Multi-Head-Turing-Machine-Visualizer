# Design System Specification: The Technical Architect

## 1. Overview & Creative North Star
This design system is built to transform complex computational logic into a high-end editorial experience. Moving away from the "default" look of early-web visualizers, we embrace a Creative North Star defined as **"The Precision Lab."**

The aesthetic is rooted in the intersection of high-end developer tooling (think Vercel) and precision hardware interfaces. We replace rigid, claustrophobic grids with **intentional asymmetry and tonal depth**. By utilizing extreme typographic contrast—pairing the technical geometry of *Space Grotesk* with the functional clarity of *Inter*—we create a hierarchy that feels authoritative yet breathable. The layout is designed to feel like a series of layered instruments on a clean workbench, rather than a flat webpage.

---

## 2. Colors
Our palette moves beyond generic "Green/White" into a sophisticated spectrum of emeralds, deep slates, and tiered neutrals.

### The "No-Line" Rule
To achieve a premium, custom feel, designers are **prohibited from using 1px solid high-contrast borders** for sectioning. Structural boundaries must be defined solely through:
- **Background Color Shifts:** A `surface-container-low` (`#f2f4f6`) panel sitting on a `background` (`#f7f9fb`) base.
- **Subtle Tonal Transitions:** Using depth to define where the visualizer ends and the controls begin.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper.
- **Base Layer:** `surface` (`#f7f9fb`)
- **Main Panels:** `surface-container-low` (`#f2f4f6`)
- **Interactive Cards/Cells:** `surface-container-lowest` (`#ffffff`) for maximum lift.
- **Overlays/Modals:** `surface-container-high` (`#e6e8ea`)

### The "Glass & Gradient" Rule
For primary actions (like "Run") or active state nodes, use a subtle linear gradient transitioning from `primary` (`#006948`) to `primary_container` (`#00855d`). This provides a visual "soul" and polished depth. Floating elements should utilize **Glassmorphism**: semi-transparent surface colors with a `backdrop-blur` of 8px-12px to soften the technical edge.

---

## 3. Typography
We use a dual-font strategy to balance character with utility.

* **Display & Headlines (Space Grotesk):** Used for "The Machine State" and primary headers. The wide apertures and geometric forms of Space Grotesk signal a modern, technical tool.
* *Example:* `headline-lg` for the current state (e.g., **State: q0**).
* **Body & Labels (Inter):** Used for logic, code inputs, and secondary labels. Inter’s neutral tall x-height ensures maximum readability for complex strings.
* *Example:* `body-sm` for the Turing "Production Rules" to ensure long-form logic remains scannable.

---

## 4. Elevation & Depth
In this design system, elevation is an environmental property, not a drop-shadow effect.

* **The Layering Principle:** Avoid the "card on grey" cliché. Instead, stack your surfaces. An input area (`surface-container-lowest`) should sit inside a control sidebar (`surface-container-low`). The 2-4% difference in luminosity creates enough contrast for the eye without adding visual noise.
* **Ambient Shadows:** If a "floating" element is required (like the Turing Head or a Tooltip), use an extra-diffused shadow.
* *Spec:* `0px 8px 24px rgba(25, 28, 30, 0.06)`. The shadow color is a tinted version of `on_surface` to mimic natural ambient light.
* **The "Ghost Border" Fallback:** If a container requires a border for accessibility (e.g., active input fields), use the `outline_variant` (`#bccac0`) at **20% opacity**. Never use 100% opaque borders.
* **Glassmorphism:** Use `surface_bright` at 80% opacity with a blur for top navigation or floating toolbars to allow the machine's nodes to bleed through the background, making the UI feel integrated.

---

## 5. Components

### The Turing Node (State)
Nodes should not be flat circles.
- **Inactive:** Use `surface-container-highest` (`#e0e3e5`) with a `label-md` center-aligned text in `on_surface_variant`.
- **Active/Current:** Use the signature gradient (Primary to Primary Container). Text shifts to `on_primary` (`#ffffff`). Use a 2px `outline` (`#6d7a72`) set 4px away from the node to create a "halo" effect.

### Buttons
- **Primary (Run/Step):** Gradient fill. `lg` (`0.5rem`) roundedness. No border.
- **Secondary (Reset/Layout):** `surface-container-high` fill with `primary` text. This ensures they feel interactive but subservient to the "Run" action.
- **Tertiary:** No fill, `on_surface_variant` text, appearing only on hover with a `surface-container-low` background.

### Tape Cells
- **Styling:** Use `surface-container-lowest` for the cell background.
- **Separation:** Forbid divider lines. Use `1.5` (`0.375rem`) spacing between cells. The "Head" should be indicated by a `tertiary` (`#4648d4`) underline or a glassmorphic overlay.

### Input Fields & Code Editors
- **Background:** `surface-container-low`.
- **Border:** Ghost Border (20% `outline_variant`).
- **Focus State:** Transition the border to 100% `primary` with a 2px outer glow of `primary_fixed_dim` at 30% opacity.

### Edge Labels (Transitions)
- **Neutral Logic:** Change the previous reddish label to `on_secondary_container` (`#5c647a`). This feels like a "technical note" rather than an error, maintaining the professional aesthetic.

---

## 6. Do's and Don'ts

### Do
* **Do** use `20` (`5rem`) or `24` (`6rem`) spacing for major section gaps to let the "Technical Tool" breathe.
* **Do** use `tertiary` (`#4648d4`) for non-critical information like "Edge Labels" or "Tape Indices" to distinguish them from "Primary Logic" (Emerald).
* **Do** apply `xl` (`0.75rem`) roundedness to large panels and `md` (`0.375rem`) to smaller components like buttons and chips.

### Don't
* **Don't** use pure `#000000` for text. Always use `on_background` (`#191c1e`) for better readability against the off-white `background`.
* **Don't** use standard 1px dividers to separate the tape from the graph. Use a vertical spacing of `8` (`2rem`) to create a clear "content break."
* **Don't** use high-saturation reds for anything other than a terminal error. The system relies on the sophistication of Emerald and Indigo.