# 🎉 PartyGlass — iOS 26 Liquid Glass Party Game App

## Design Specification v1.0

---

## 1. Design Philosophy

**"Glass that breathes with the party."**

PartyGlass reimagines social party games through iOS 26's Liquid Glass design language. Every surface is a sheet of living glass — translucent, refractive, responsive to touch and motion. The app disappears into the background of the party, letting the games and people take center stage.

**Key differentiation:** No fake textures, no heavy shadows, no decorative gradients. Depth is achieved purely through glass refraction, concentric layering, and dynamic light response.

---

## 2. Liquid Glass Surface Hierarchy

| Level | Glass Variant | Usage | Corner Radius |
|-------|--------------|-------|---------------|
| **L1 — Background** | `ultraThinMaterial` | Full-screen backdrop, 0pt from safe area edges | 0pt |
| **L2 — Cards & Panels** | `.glassEffect(.regular)` | Game cards, score panels, option lists | 20pt continuous |
| **L3 — Controls** | `.glassEffect(.regular.interactive().tint(accent))` | Buttons, toggles, sliders | 999pt (pill) |
| **L4 — Floating** | `.glassEffect(.clear)` | Dynamic Island extensions, overlays, toasts | 20pt |

- L1 provides atmospheric depth through refractive blur
- L2 cards float above the background with specular glass edges
- L3 controls respond to touch with interactive shimmer + scale bounce
- L4 clear glass overlays media without obscuring content

---

## 3. Design Tokens

### 3.1 Color Palette

```swift
// Core
let background     = Color.black       // Pure black default
let surfaceLight   = Color.white       // Pure white for light mode
let accent         = Color.blue        // #0A84FF systemBlue

// Glass Tints
let glassTint      = Color.blue.opacity(0.15)   // Subtle blue tint on glass
let glassHighlight = Color.white.opacity(0.3)   // Specular edge highlight
let glassStroke    = Color.white.opacity(0.1)    // Glass edge border

// Semantic
let winColor       = Color.green       // #30D158
let loseColor      = Color.red         // #FF453A
let drawColor      = Color.orange      // #FF9F0A
let chipGold       = Color.yellow      // #FFD60A

// Text on Glass
let textPrimary    = Color.white       // Primary text on glass
let textSecondary  = Color.white.opacity(0.65)  // Secondary text
let textTertiary   = Color.white.opacity(0.35)  // Placeholder
```

### 3.2 Typography

| Style | Font | Size | Weight | Tracking |
|-------|------|------|--------|----------|
| **Large Title** | SF Pro Display | 34pt | Bold | -0.5pt |
| **Title 1** | SF Pro Display | 28pt | Semibold | -0.3pt |
| **Title 2** | SF Pro Display | 22pt | Semibold | 0pt |
| **Headline** | SF Pro Display | 17pt | Semibold | 0pt |
| **Body** | SF Pro Text | 17pt | Regular | 0pt |
| **Callout** | SF Pro Text | 16pt | Regular | 0pt |
| **Subheadline** | SF Pro Text | 15pt | Regular | 0pt |
| **Footnote** | SF Pro Text | 13pt | Regular | 0pt |
| **Caption 1** | SF Pro Text | 12pt | Regular | 0pt |
| **Score Number** | SF Pro Rounded | 48-96pt | Bold | -1pt |
| **Game Title** | SF Pro Display Rounded | 20pt | Bold | 0pt |

### 3.3 Spacing

```
Margin:      20pt (minimum from safe area)
Inter-card:  16pt
Card padding: 20pt
Stack spacing: 12pt
Content gap:  8pt
```

### 3.4 Corner Radius

```
Cards & panels:    20pt continuous
Buttons:           999pt (pill)
Floating elements: 20pt
Sheet:             40pt (top continuous corners)
```

---

## 4. Dynamic Island Integration

PartyGlass uses the Dynamic Island as a live activity hub:

- **Idle state:** Shows app icon + "PartyGlass" 
- **Active game:** Shows current game type icon + score
- **Winner animation:** Expands with Liquid Glass morph to celebrate
- **Chip updates:** Shows chip delta with animated number

```swift
// Dynamic Island activity configuration
struct PartyGlassActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var gameType: GameType
        var currentScore: String
        var chipDelta: Int?
    }
    var appName: String = "PartyGlass"
}
```

---

## 5. Navigation Architecture

```
┌─────────────────────────────────────┐
│           Home Screen                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ RPS  │ │ T/D  │ │Wheel │ │ Dice │ │
│  └──────┘ └──────┘ └──────┘ └──────┘ │
│          ┌──────────┐                │
│          │  Chips   │                │
│          └──────────┘                │
├─────────────────────────────────────┤
│         Bottom Tab Bar (L2 Glass)    │
│  🎮  🎭  🎡  🎲  💰                 │
└─────────────────────────────────────┘
```

---

## 6. Micro-Interactions

| Interaction | Trigger | Response |
|------------|---------|----------|
| **Glass Press** | Touch down on interactive glass | Scale 0.96 + shimmer sweep |
| **Card Enter** | Screen appear | Staggered fade + slide up (0.1s delay per card) |
| **Win Burst** | Round win | Glass particles + Dynamic Island expansion |
| **Shake** | Dice roll | Device haptic + glass ripple on dice face |
| **Spin** | Wheel spin | Rotation spring + tick haptic per segment |
| **Morph** | Navigation | GlassEffectContainer morphing between states |

---

## 7. Sound Design (Haptics)

- **Button tap:** Soft impact (0.3s)
- **Card flip:** Medium impact (0.5s)
- **Win celebration:** Success notification + haptic sequence
- **Dice roll:** Tick haptic sequence (3-6 ticks)
- **Wheel spin:** Continuous light haptic, heavy on stop
- **Chip add/remove:** Discrete notification per increment
