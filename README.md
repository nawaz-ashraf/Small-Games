# PLAY ARENA — Promotional Gaming Platform

An event-ready, browser-based promotional gaming platform featuring a participant registration system, central game dashboard, and three interactive games.

---

## 📁 Project Structure

```text
play-arena/
│
├── index.html                  # Semantic application markup and asset links
├── README.md                   # Setup instructions and architectural documentation
│
├── css/                        # Modular stylesheet architecture
│   ├── variables.css           # Design tokens, color palette, typography & shadows
│   ├── reset.css               # Box-sizing, browser defaults, typography base
│   ├── layout.css              # Screen transitions, festive banner, ambient canvas
│   ├── components.css          # Reusable buttons, cards, badges, modals, toasts, panels
│   ├── registration.css        # Registration form layout, inputs, consent checkbox
│   ├── dashboard.css           # Game selection grid, participant stats, card previews
│   ├── precision-stop.css      # Diya Stop Challenge square arena, track & target styles
│   ├── light-pong.css          # Pong canvas court, paddle controls, pause overlay
│   ├── jigsaw-puzzle.css       # Jigsaw puzzle board, piece tray, toolbar, hints
│   └── responsive.css          # Mobile, tablet, and desktop media query adaptations
│
├── js/                         # Native ES Modules architecture
│   ├── app.js                  # Main entry point & application coordinator
│   ├── state.js                # Centralized state management (participant, scores)
│   ├── navigation.js           # Screen routing & lifecycle cleanup orchestration
│   ├── registration.js         # Input validation & participant session creation
│   ├── dashboard.js            # Dashboard rendering, quick stats & card navigation
│   │
│   ├── games/                  # Independent game engines
│   │   ├── precision-stop.js   # Diya Stop Challenge timing engine, 60fps loop & scoring
│   │   ├── light-pong.js       # Light Pong canvas physics, collision detection & AI
│   │   └── jigsaw-puzzle.js    # Jigsaw piece generator, bezier clipping & drag-and-drop
│   │
│   └── utils/                  # Reusable helper utilities
│       ├── dom.js              # Toasts, modals & festive particle confetti canvas
│       ├── storage.js          # sessionStorage persistence for participant & scores
│       └── scoring.js          # Formatting helpers (time, numbers)
│
└── assets/
    └── images/                 # Standalone vector illustrations & previews
        ├── diya.svg            # Ornate 3D metallic Diya lamp illustration
        ├── light-pong-preview.svg # Vector preview for Light Pong card
        └── puzzle-preview.svg  # Vector preview for Jigsaw Puzzle card
```

---

## 🚀 Running the Project Locally

Because the application uses native JavaScript **ES Modules** (`import` / `export`), modern web browsers require it to be served over HTTP rather than opened directly via `file://` (which triggers local CORS restrictions).

### Option 1: Python HTTP Server (Recommended, No Installation Needed)
If you have Python installed:

```bash
# Python 3
python3 -m http.server 8000
```

Then open your browser to:
**[http://localhost:8000](http://localhost:8000)**

### Option 2: Node.js (npx serve or http-server)
If you have Node.js installed:

```bash
npx serve .
# or
npx http-server -p 8000
```

---

## 🎮 Included Features & Games

1. **Participant Registration**
   - Full name, phone number, optional email, and terms consent.
   - Real-time inline field validation and shake animations for invalid attempts.
   - Session storage persistence across page reloads.

2. **Game Selection Dashboard**
   - Visitor profile badge and initials avatar.
   - Quick stats tracker showing best scores for all three games.
   - Interactive game cards with live hover effects and keyboard navigation (<kbd>Enter</kbd> / <kbd>Space</kbd>).
   - Session reset dialog with confirmation modal.

3. **Diya Stop Challenge (Target Match Arcade)**
   - Spacious, well-proportioned square arena with etched mandala watermark.
   - Ornate 3D festive Diya lamp with metallic gold gradients, engravings, and vibrant multi-layered flame.
   - Holographic target silhouette with precision alignment reticle.
   - Multi-round progression (5 rounds) with Easy, Medium, Hard difficulty levels.
   - 60 FPS animation loop with real-time distance and normalized percentage scoring.
   - Large tactile arcade STOP button with Spacebar and Enter keyboard support.

4. **Light Pong**
   - Single-player arcade reflex game on HTML5 canvas.
   - Keyboard (<kbd>W</kbd>/<kbd>S</kbd>, <kbd>↑</kbd>/<kbd>↓</kbd>), mouse move, and touch controls for mobile.
   - Dynamic CPU opponent tracking and speed escalation as rally count rises.
   - Pause / Resume and game over states.

5. **Jigsaw Puzzle**
   - Dynamic SVG and canvas pattern rendering with festive Diwali artwork.
   - Piece generation using cubic Bézier curves for realistic interlocking tabs and blanks.
   - HTML5 pointer drag-and-drop piece snapping to board grid.
   - Interactive toolbar: Auto-arrange tray, Edge pieces filter, Hint reveal, Preview reference modal, and Reset.
   - Timer, difficulty selection (Easy 3×3, Medium 4×4, Hard 5×5), and performance rating.

6. **Festive Theme & Ambient Visuals**
   - Golden ornamental retail header banner with filigree badge and ribbon wings.
   - Full-screen ambient confetti and sparkle particle engine.
   - Corner diya lighting with soft floor glow.
