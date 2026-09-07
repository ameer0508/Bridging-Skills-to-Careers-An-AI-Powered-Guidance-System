# SkillBridge — Experience Design System Architecture & Specification (Phase Ω.2)

> **Document Version:** `2.0.0-Ω.2`  
> **Target Audience:** Frontend Engineers, Design System Engineers, Motion Designers, UX Architects  
> **Status:** Production Hardened & Standardized  

---

## 1. Motion Philosophy & Principles

Motion in SkillBridge is not decorative; it is **communicative and intentional**. Every motion preset, spring physics curve, and transition communicates software state, intelligence, and system confidence.

### Core Motion Principles

1. **Purposeful Velocity:**  
   Animations must communicate real progress. Instant feedback on click, organic deceleration on transition.
2. **Physically Grounded Spring Mechanics:**  
   Components utilize spring physics (`stiffness`, `damping`, `mass`) rather than linear or static transitions. Rebound is calibrated to feel crisp, not floaty.
3. **Data Authenticity:**  
   Animations must mirror real backend state transitions (React Query query status, mutations, user authentication state). No artificial or fake delay loops.
4. **Context Continuity:**  
   Navigation uses shared spatial layout transitions so users maintain orientation across state changes.

---

## 2. Lighting System Rules & Profiles

Lighting in SkillBridge establishes visual hierarchy and surfaces depth without clutter. Components opt into one of seven standardized lighting profiles defined in `lightingProfiles.ts`.

| Profile Name | Usage & Intent | Specular Opacity | Border Color (Dark / Light) |
| :--- | :--- | :--- | :--- |
| `softAmbient` | Secondary containers, background cards | 4% | `rgba(255, 255, 255, 0.08)` / `rgba(0, 0, 0, 0.06)` |
| `heroSpotlight` | Primary CTA, key hero widgets, AI highlights | 15% | `rgba(129, 140, 248, 0.3)` / `rgba(99, 102, 241, 0.25)` |
| `glassReflection` | Frosted glass modals, floating cards | 12% | `rgba(255, 255, 255, 0.12)` / `rgba(255, 255, 255, 0.5)` |
| `surfaceReflection` | Structural elevated panels | 6% | `rgba(255, 255, 255, 0.07)` / `rgba(0, 0, 0, 0.08)` |
| `edgeGlow` | Focused/active form elements, selected cards | 10% | `rgba(99, 102, 241, 0.8)` / `rgba(99, 102, 241, 0.6)` |
| `commandCenterGlow` | Core AI workspace, initialization stage | 20% | `rgba(168, 85, 247, 0.4)` / `rgba(168, 85, 247, 0.3)` |
| `accentLighting` | Notifications, status highlights | 8% | `rgba(56, 189, 248, 0.4)` / `rgba(14, 165, 233, 0.3)` |

---

## 3. Animation Timing & Durations

All animation durations are centralized in `experienceMotion.ts`. Hardcoded millisecond constants inside components are strictly prohibited.

- **`micro` (120ms):** Instant micro-feedback (button presses, toggle switches).
- **`fast` (200ms):** Tooltips, popover reveals, dropdown expansions.
- **`normal` (350ms):** Card hover elevation, list item stagger, modal fade-in.
- **`moderate` (500ms):** Drawer slide-in, background color transitions.
- **`slow` (800ms):** Section scroll reveals, page layout shifts.
- **`organic` (1200ms):** AI thinking orb pulse, progress bar catch-up.
- **`ambient` (4000ms+):** Background mesh spin, continuous text gradient shimmer.

---

## 4. Glassmorphism & Specular Reflection Guidelines

Glass components (`GlassCard`, `GlassLoadingOverlay`, `LightingSurface`) must follow strict contrast and backdrop blur rules to maintain 60 FPS performance:

1. **Backdrop Blur Budget:** Use `backdrop-filter: blur(12px)` for default glass and `blur(20px)` for modal overlays. Never stack more than two overlapping glass surfaces.
2. **Specular Overlay:** A subtle linear gradient (`from-white/10 to-transparent`) is layered above the glass surface to simulate ambient light reflection.
3. **Contrast Compliance:** Glass backgrounds in dark mode use `rgba(22, 28, 45, 0.6)` to satisfy WCAG AA contrast against text elements.

---

## 5. Interaction Principles: Hover, Focus & Click Behaviors

Every interactive surface MUST follow these standard states:

- **Hover:** Subtle -3px to -4px Y-axis translate with spring snappy tension (`stiffness: 450, damping: 28`). Light reflection opacity increases by +10%.
- **Active / Press:** Scale compression to `0.98` with -1px Y-axis translate.
- **Focus:** Visible 2px outline focus ring with `--color-border-focus` (`rgba(99, 102, 241, 0.8)`). Keyboard navigation using `Tab` key must trigger explicit focus outlines.

---

## 6. Real-Time Initialization State Machine Orchestration

SkillBridge transitions after authentication using a 5-phase initialization state machine managed by `ExperienceContext`:

```
┌─────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌──────────────────────┐    ┌─────────┐
│  idle   │ ──►│ authenticating  │ ──►│  initializing   │ ──►│ context_activating   │ ──►│  ready  │
└─────────┘    └─────────────────┘    └─────────────────┘    └──────────────────────┘    └─────────┘
```

1. **`idle`:** User is outside authenticated zone.
2. **`authenticating`:** Auth login/token validation in progress.
3. **`initializing`:** Auth query completed. AI workspace environment initializing. Real user profile and skill data loaded from backend.
4. **`context_activating`:** Career intelligence data and recommendations loaded. Background evolves smoothly.
5. **`ready`:** Dashboard is revealed and interactive state activated.

---

## 7. Performance Standards & Frame Budget

To maintain a rock-solid **60 FPS** on all desktop and mobile devices:

- **GPU Acceleration:** All motion components manipulate exclusively `transform` and `opacity`.
- **Low Performance Mode:** Auto-detected when hardware concurrency $\le 2$ or sampled FPS drops below 40 FPS. Drops heavy radial blurs and background canvas animations.
- **RequestAnimationFrame Throttling:** Cursor tracking and numerical counters use RAF loops with passive event listeners to eliminate layout thrashing.

---

## 8. Accessibility & Reduced Motion Protocols

- **System Preference Override:** When `prefers-reduced-motion: reduce` is active, `useExperience().reducedMotion` evaluates to `true`. All motion components bypass spring physics and render instant or static opacity reveals.
- **Screen Reader Support:** All interactive elements (`SpotlightCard`, `InteractiveCard`, `PrimaryCTA`) include appropriate `role`, `aria-busy`, `aria-live`, and keyboard event handlers (`Enter` & `Space`).
