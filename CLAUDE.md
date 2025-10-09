# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Style & Agent Usage

**IMPORTANT**: Follow these rules for agent usage and workflow:

- **Never automatically start dev server or run tests** unless explicitly requested by the user
- **Never automatically run build commands** after making code changes - wait for user's request
- **Use agents only when explicitly asked** by the user (e.g., "review this code", "debug this issue")
- **Don't be overly proactive** with testing - make changes, explain them, and let the user decide when to test
- When user asks "how to do X", answer first - don't immediately jump into implementation
- Only run commands that are directly requested or clearly necessary for the current task

This ensures you work **with** the user, not ahead of them.

## Project Overview

**Pig Rider** is an endless runner game built with PixiJS for Webflow integration. The game features a pig character navigating three lanes, collecting coins while avoiding obstacles. The architecture separates WebGL rendering (PixiJS) from UI (HTML/CSS), making it ideal for Webflow deployment.

## Build Commands

### Development
```bash
npm run dev          # Start dev server at localhost:3000 with hot reload
```

### Production Builds
```bash
npm run build        # Standard build → dist/game.min.js
npm run build:webflow # Webflow-specific build → dist/game.bundle.js
npm run preview      # Preview production build locally
```

**Important**:
- `build:webflow` creates an IIFE bundle that expects PixiJS to be loaded via CDN
- Regular `build` includes all dependencies inline
- Both builds use Terser for minification with source maps enabled

## Architecture

### Entry Points

The project has **two entry points** for different deployment targets:

1. **Local Development**: `src/main.js`
   - Full standalone development
   - All dependencies bundled
   - Used with `npm run dev`

2. **Webflow Integration**: `src/webflow.js`
   - Expects PixiJS loaded from CDN
   - Exposes `window.PigRiderGame` globally
   - Merges custom config from `window.GAME_CONFIG` if provided
   - Used with `npm run build:webflow`

### Core Architecture Pattern

The game follows a **hybrid rendering architecture**:

- **PixiJS (WebGL)**: Game entities only (player, obstacles, coins, decorative elements)
- **HTML/CSS**: All UI screens (start, HUD, modals, end screens)
- **Communication**: EventBus connects Canvas ↔ HTML UI

This separation enables easy styling through CSS and seamless Webflow integration.

### Directory Structure

```
src/
├── config/              # Game configuration
│   ├── constants.js     # All game constants (TARGET_COINS, speeds, sizes)
│   └── env.js          # Environment variables (API keys)
│
├── core/               # PixiJS engine core
│   ├── AssetLoader.js  # Handles all asset loading
│   ├── Renderer.js     # PixiJS renderer setup
│   └── GameLoop.js     # Fixed timestep game loop (60 FPS)
│
├── entities/           # Game objects
│   ├── Player.js       # Player character (3-lane movement)
│   ├── Obstacle.js     # Barriers
│   ├── Coin.js         # Collectibles
│   ├── Booster.js      # Power-up collectibles
│   ├── Star.js         # Decorative stars
│   └── Cloud.js        # Decorative clouds
│
├── systems/            # Game systems
│   ├── SpawnSystem.js       # Object pooling + spawning logic
│   ├── CollisionSystem.js   # AABB collision detection
│   └── DifficultyManager.js # Progressive difficulty scaling
│
├── ui/                 # HTML UI management
│   ├── UIController.js # Controls all HTML screens/modals
│   └── AIBotModal.js   # ElevenLabs AI bot integration (optional)
│
├── services/
│   └── ElevenLabsService.js # AI voice service (optional)
│
├── animations/         # GSAP animations
│   ├── gsap-clouds.js  # Cloud animations
│   ├── gsap-stars.js   # Star animations
│   └── gsap-buttons.js # Button animations
│
├── utils/
│   ├── EventBus.js     # Event communication system
│   ├── MathUtils.js    # Math helpers (AABB, random)
│   └── ObjectPool.js   # Object pooling for performance
│
├── Game.js             # Main game orchestrator
├── main.js             # Entry point for local dev
└── webflow.js          # Entry point for Webflow bundle
```

## Key Systems

### 1. Spawn System

**Location**: `src/systems/SpawnSystem.js`

Uses object pooling for all entities (obstacles, coins, stars, clouds, boosters). Key features:

- **Lane Safety**: Never blocks all three lanes simultaneously with obstacles
- **Booster Mode**: During booster activation, clears all obstacles and spawns dense coin trails on a single lane that switches every 2 seconds
- **Difficulty Integration**: Spawn intervals adjusted by DifficultyManager based on score
- **Decorative Elements**: Manages non-interactive elements (stars, clouds) separately from gameplay objects

Important methods:
- `fillLaneWithCoins(lane)` - Instantly spawns 20 coins in a lane (used for booster mode)
- `clearAllObstacles()` - Removes all obstacles (used when booster activates)
- `getBlockedLanes()` - Ensures at least one lane is always passable

### 2. Booster Mechanic

**Locations**: `src/Game.js` (lines 350-409), `src/entities/Booster.js`

Booster flow:
1. Player collects booster → game pauses → modal shows
2. User confirms → all obstacles cleared
3. One random lane fills with dense coins
4. Every 2 seconds, lane switches (3 switches total = 6 seconds)
5. After 6 seconds: booster ends, 5-second cooldown before next booster spawns

State management in `Game.js`:
- `isBoosterActive` - Current booster status
- `boosterTimeRemaining` - Countdown timer
- `boosterCurrentLane` - Active lane (0, 1, or 2)
- `boosterCooldownTimer` - Prevents immediate respawn
- `preBoosterSnapshot` - Saves difficulty state to restore after booster

### 3. Configuration System

**Location**: `src/config/constants.js`

All game parameters are centralized and can be overridden via `window.GAME_CONFIG` in Webflow:

```javascript
window.GAME_CONFIG = {
  TARGET_COINS: 300,           // Change win condition
  GAME_SPEED: 1.5,            // Adjust base speed
  BOOSTER_DURATION: 8,        // Extend booster time
  PLAYER: { SIZE: 200 }       // Resize player
};
```

Asset paths use `window.GAME_ASSETS_URL` for CDN flexibility.

### 4. UI Controller

**Location**: `src/ui/UIController.js`

Manages all HTML screens without touching PixiJS:

- `showStartScreen()` / `hideStartScreen()`
- `showHUD()` / `hideHUD()`
- `updateCoinCount(current, target)`
- `showBoosterModal()` - Returns Promise that resolves when user clicks continue
- `showWinScreen(score)` / `showLoseScreen(score)`
- `addBoosterClass()` / `removeBoosterClass()` - Adds visual effects to HTML during booster

### 5. Game Loop

**Location**: `src/core/GameLoop.js`

Fixed timestep loop (60 FPS) with interpolation support:
- Update: Fixed 16.67ms timesteps
- Render: Variable rate with alpha for interpolation
- Handles pause/resume without drift

## Webflow Integration

### HTML Structure Required

The game expects this structure in Webflow (see `index.html`):

```html
<div id="game-root">
  <!-- Start Screen -->
  <div class="game-ui game-start">
    <a game-btn-start href="#">Play now</a>
  </div>

  <!-- Game HUD -->
  <div class="game-ui game-running" style="display: none;">
    <span game-counter>0</span>/500
  </div>

  <!-- PixiJS Canvas -->
  <canvas id="game-canvas"></canvas>
</div>
```

### Required Selectors

- `#game-canvas` - PixiJS canvas element
- `.game-ui.game-start` - Start screen
- `.game-ui.game-running` - HUD during gameplay
- `[game-btn-start]` - Start button
- `[game-counter]` - Coin counter text element

### CDN Setup for Webflow

In Webflow Page Settings → Custom Code:

**Head**:
```html
<script src="https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"></script>
```

**Before `</body>`**:
```html
<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/pig-rider-game@main/dist/game.bundle.js"></script>
```

### Asset Loading

Assets are loaded from `/assets/sprites/` by default. Override in Webflow:

```html
<script>
  window.GAME_ASSETS_URL = 'https://uploads-ssl.webflow.com/YOUR-SITE-ID';
</script>
```

## Development Guidelines

### When Adding New Entities

1. Create class in `src/entities/` extending base pattern (see `Coin.js` or `Obstacle.js`)
2. Implement: `activate(lane, x)`, `update(dt, speed)`, `deactivate()`, `isActive()`, `getHitbox()`
3. Add pool to `SpawnSystem.js` constructor
4. Add spawn logic in `SpawnSystem.js` update method
5. Update collision detection in `CollisionSystem.js` if needed

### When Modifying Game Balance

Edit `src/config/constants.js`:
- `TARGET_COINS` - Win condition
- `GAME_SPEED`, `MAX_SPEED`, `SPEED_INCREMENT` - Speed progression
- `OBSTACLE.MIN_DISTANCE`, `MAX_DISTANCE` - Spawn spacing
- `BOOSTER_DURATION`, `BOOSTER_LANE_SWITCH_INTERVAL` - Booster mechanics

### When Adding UI Screens

1. Add HTML structure to `index.html`
2. Add show/hide methods to `UIController.js`
3. Call from `Game.js` state transitions
4. Use EventBus for Canvas ↔ UI communication if needed

### Testing Webflow Build

```bash
npm run build:webflow
# Verify dist/game.bundle.js exists
# Check that PixiJS is marked as external (not bundled)
# Test in local HTML file with PixiJS CDN before deploying
```

## ElevenLabs Integration (Optional)

If `ELEVENLABS_API_KEY` is set in `.env`, the AI bot modal will activate on game start. Users can interact with an AI character before playing. This feature is optional and gracefully disabled if no API key is provided.

## Performance Notes

- Object pooling prevents GC pauses (pools in SpawnSystem)
- Fixed timestep prevents physics issues across different frame rates
- AABB collision detection with spatial optimization
- Vite's Terser minification reduces bundle to ~50-100KB (excluding PixiJS)
- PixiJS via CDN enables browser caching across pages

## Common Tasks

### Change Target Score
Edit `src/config/constants.js`:
```javascript
TARGET_COINS: 500 // Change from 200 to 500
```

### Adjust Difficulty Curve
Edit `src/systems/DifficultyManager.js` thresholds and intervals.

### Add New Asset
1. Add PNG to `public/assets/sprites/`
2. Add path to `ASSET_PATHS` in `src/config/constants.js`
3. Load in `src/core/AssetLoader.js`

### Debug Collision Issues
Check hitbox rendering by adding visualization to collision system. Hitboxes are scaled (player: 0.7x, obstacles: 0.8x, coins: 0.6x).

## Build Output

- **Standard build**: `dist/game.min.js` + assets (standalone)
- **Webflow build**: `dist/game.bundle.js` (expects PixiJS CDN)
- Source maps enabled in both modes for debugging
- Console logs preserved in Webflow builds for production debugging
