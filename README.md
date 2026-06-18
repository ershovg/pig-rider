# Pig Rider

An endless runner game built with **PixiJS** (WebGL), designed to embed into Webflow pages. Steer the pig across three lanes, collect coins, dodge obstacles, and trigger booster mode.

## Tech stack

- **PixiJS 8** (WebGL) — game rendering
- **Vite** — dev server and bundling
- **Vanilla JS** + HTML/CSS — UI layer, no framework

## Architecture

Two ideas drive the design:

**Hybrid rendering.** Game objects (player, obstacles, coins, effects) render in PixiJS/WebGL. All UI — start screen, HUD, modals, end screens — is plain HTML/CSS driven by a `UIController`. The two layers talk through a small `EventBus`. This keeps the interface fully stylable in Webflow without touching the canvas.

**Modular monolith.** Code is organized by feature (domain), not by technical layer. Each feature owns its entities, spawners, and managers in one folder, and stays loosely coupled through shared utilities and public APIs.

```
src/
├── core/        # PixiJS renderer, fixed-timestep game loop, asset loader
├── shared/      # config (constants), EventBus, object pool, math utils
├── features/    # player, obstacles, coins, booster, collision, sound,
│                # spawning, progression, rendering, effects, ui, ...
├── Game.js      # orchestrator — composes the feature modules
├── main.js      # entry: local dev
└── webflow.js   # entry: Webflow bundle (expects PixiJS from CDN)
```

Performance notes: object pooling avoids GC pauses, a fixed timestep (60 FPS) with interpolation keeps physics stable across frame rates, and assets load in the background so the start screen paints fast.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000, hot reload
```

Build:

```bash
npm run build          # standalone bundle → dist/game.min.js
npm run build:webflow  # Webflow bundle   → dist/game.bundle.js (PixiJS external)
```

## Webflow integration

**1. Load PixiJS** — Project Settings → Custom Code → Head:

```html
<script src="https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"></script>
```

**2. Load the game** — Page Settings → Custom Code → before `</body>`:

```html
<script src="https://cdn.jsdelivr.net/gh/ershovg/pig-rider@main/dist/game.bundle.js"></script>
```

**3. Add the markup** the game hooks into:

```html
<div id="game-root">
  <div class="game-ui game-start">
    <a game-btn-start href="#">Play now</a>
  </div>
  <div class="game-ui game-running" style="display: none;">
    <span game-counter>0</span>/500
  </div>
  <canvas id="game-canvas"></canvas>
</div>
```

Required selectors: `#game-canvas`, `.game-ui.game-start`, `.game-ui.game-running`, `[game-btn-start]`, `[game-counter]`.

## Configuration

Override any default from `src/shared/config/constants.js` at runtime — no rebuild needed. Add this *after* the game script:

```html
<script>
  window.GAME_CONFIG = {
    TARGET_COINS: 300,   // win condition
    GAME_SPEED: 1.5,     // starting speed
    PLAYER: { SIZE: 200 }
  };
</script>
```

## License

ISC
