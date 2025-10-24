# 🐷 Pig Rider Game

Endless runner game built with PixiJS for Webflow integration.

**Architecture:** Modular Monolith (Feature-Based) following SOLID principles.

## ✨ Latest Updates

- **October 2025:** Full restructure to Modular Monolith architecture
- 14 feature modules organized by domain
- Improved code organization and maintainability
- All features working: music, animations, effects

## 📁 Project Structure

**Modular Monolith Architecture** - organized by features (domains), not technical layers.

```
pig-rider-game/
├── src/
│   ├── core/                      # PixiJS Engine
│   │   ├── Renderer.js
│   │   ├── GameLoop.js
│   │   └── AssetLoader.js
│   │
│   ├── shared/                    # Shared utilities
│   │   ├── config/
│   │   │   └── constants.js       # Overridable game config
│   │   └── utils/
│   │       ├── EventBus.js
│   │       ├── MathUtils.js
│   │       └── ObjectPool.js
│   │
│   ├── features/                  # 🎯 Feature Modules (14 domains)
│   │   ├── player/               # Player mechanics
│   │   │   ├── entities/
│   │   │   └── controllers/
│   │   │
│   │   ├── booster/              # Power-ups
│   │   │   ├── entities/
│   │   │   ├── manager/
│   │   │   └── spawner/
│   │   │
│   │   ├── obstacles/            # Obstacles
│   │   │   ├── entities/
│   │   │   ├── spawner/
│   │   │   └── patterns/
│   │   │
│   │   ├── coins/                # Coin collection
│   │   │   ├── entities/
│   │   │   ├── spawner/
│   │   │   └── effects/
│   │   │
│   │   ├── collision/            # Collision detection
│   │   │   ├── system/
│   │   │   ├── handler/
│   │   │   └── effects/
│   │   │
│   │   ├── sound/                # Audio system
│   │   │   ├── manager/
│   │   │   ├── core/
│   │   │   └── states/
│   │   │
│   │   ├── spawning/             # Spawn orchestration
│   │   ├── progression/          # Difficulty & lifecycle
│   │   ├── rendering/            # Culling & interpolation
│   │   ├── effects/              # Visual effects
│   │   ├── decoration/           # Clouds & stars
│   │   ├── monitoring/           # Performance
│   │   ├── state/                # State management
│   │   └── ui/                   # HTML/CSS UI
│   │
│   ├── Game.js                   # Main orchestrator
│   ├── main.js                   # Entry: local dev
│   └── webflow.js                # Entry: Webflow bundle
│
├── public/
│   └── assets/
│       ├── sprites/              # PNG & animated spritesheets
│       │   ├── pig_rider.png
│       │   ├── coin.png
│       │   ├── coin-collect.json # Animated effect
│       │   ├── boom.json         # Collision effect
│       │   └── ...
│       ├── sounds/               # Audio files
│       └── music/                # Background music
│
├── dist/                         # Build output
│   ├── game.min.js               # Standard build (451 KB)
│   └── game.bundle.js            # Webflow build (128 KB)
│
└── vite.config.js
```

### 🎯 Why Modular Architecture?

- **Easy to find:** All booster-related code in `features/booster/`
- **Easy to add:** New feature = new folder in `features/`
- **Easy to maintain:** Changes isolated to feature modules
- **SOLID compliant:** Each module has single responsibility

## 🚀 Development

### Local Development
```bash
npm install
npm run dev
```
Opens `http://localhost:3000` with hot reload.

### Build for Webflow
```bash
npm run build:webflow
```
Creates `dist/game.bundle.js` ready for Webflow.

## 🌐 Webflow Integration

### 1. Upload sprites to Webflow Assets
Upload all PNG files from `public/assets/sprites/` to your Webflow project assets.

### 2. Add PixiJS CDN
In Webflow Project Settings → Custom Code → Head Code:
```html
<script src="https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"></script>
```

### 3. Add Game Bundle
In Webflow Page Settings → Custom Code → Before </body> tag:
```html
<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/pig-rider-game@main/dist/game.bundle.js"></script>
```

### 4. (Optional) Override Config
Add custom settings in the same page, AFTER the bundle:
```html
<script>
  window.GAME_CONFIG = {
    TARGET_COINS: 300,    // Change goal without rebuilding
    GAME_SPEED: 1.5,      // Adjust game speed
    PLAYER: {
      START_X: 400
    }
  };
</script>
```

## 🎮 Webflow HTML Structure

Your Webflow page should have this structure:

```html
<div id="game-root">
  <!-- Start Screen -->
  <div class="game-ui game-start">
    <h2>Want a pig ride?</h2>
    <a game-btn-start href="#" class="btn">Play now</a>
  </div>

  <!-- Running Screen (HUD) -->
  <div class="game-ui game-running" style="display: none;">
    <div class="game-counter">
      <span game-counter>0</span>/500
    </div>
  </div>

  <!-- PixiJS Canvas -->
  <canvas id="game-canvas"></canvas>
</div>
```

### Required Selectors:
- `.game-ui.game-start` - Start screen
- `.game-ui.game-running` - Game HUD
- `[game-btn-start]` - Start button
- `[game-counter]` - Coin counter text
- `#game-canvas` - PixiJS canvas

## 📦 CDN Options

### Option 1: jsDelivr (Recommended)
```html
<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/pig-rider-game@main/dist/game.bundle.js"></script>
```
- ✅ Fast CDN
- ✅ Auto-updates when you push to GitHub
- ⏱️ ~5 min cache delay

### Option 2: GitHub Raw (For testing)
```html
<script src="https://raw.githubusercontent.com/YOUR-USERNAME/pig-rider-game/main/dist/game.bundle.js"></script>
```
- ✅ Instant updates
- ❌ Slower than CDN
- ⚠️ Only for testing, not production

### Option 3: Self-hosted
Upload `dist/game.bundle.js` to your own server.

## 🔧 Configuration

### Overridable Constants
You can override any value from `src/shared/config/constants.js` via `window.GAME_CONFIG`:

```javascript
window.GAME_CONFIG = {
  TARGET_COINS: 500,        // Win condition
  GAME_SPEED: 1.0,          // Initial speed
  MAX_SPEED: 2.5,           // Maximum speed
  SPEED_INCREMENT: 0.0005,  // Speed increase rate

  PLAYER: {
    START_X: 300,           // Player X position
    SIZE: 150               // Player sprite size
  },

  OBSTACLE: {
    MIN_DISTANCE: 800,      // Min distance between obstacles
    MAX_DISTANCE: 1400,     // Max distance
    SIZE: 120               // Obstacle sprite size
  },

  COIN: {
    MIN_DISTANCE: 400,
    MAX_DISTANCE: 800,
    SIZE: 60,
    VALUE: 1                // Points per coin
  }
};
```

## 🎨 Asset Requirements

### Sprites (PNG @2x resolution):
- `pig_rider.png` - Player character
- `barier_base.png` - Small obstacle
- `barier_large.png` - Large obstacle
- `coin.png` - Regular coin
- `coin_star.png` - Special coin
- `booster.png` - Booster item
- `star.png` - Decoration
- `cloud.png` - Background element

### Animated Spritesheets (JSON + PNG):
- `coin-collect.json` + `coin-collect.png` - Coin collect effect (4 frames)
- `boom.json` + `boom.png` - Collision explosion (6 frames)
- `player-animated.json` + `player-animated.png` - Player animations
- `booster-animated.json` + `booster-animated.png` - Booster animations

### Audio Assets:
- `main-music.mp3` - Gameplay background music
- `bonus-music.mp3` - Booster mode music
- `coin.mp3` - Coin collection sound effect

## 📝 Deployment Workflow

1. **Develop locally:**
   ```bash
   npm run dev
   ```

2. **Build for Webflow:**
   ```bash
   npm run build:webflow
   ```

3. **Commit and push:**
   ```bash
   git add dist/game.bundle.js
   git commit -m "Update game bundle"
   git push origin main
   ```

4. **Update Webflow:**
   - jsDelivr automatically updates in ~5 minutes
   - Or use versioned URL: `@v1.0.0` instead of `@main`

## 🐛 Debugging

### In Browser Console:
```javascript
// Access game instance
window.PigRiderGame

// Pause/Resume
window.PigRiderGame.pause()
window.PigRiderGame.resume()

// Restart
window.PigRiderGame.restartGame()
```

### Check if PixiJS loaded:
```javascript
console.log(typeof PIXI) // Should output "object"
```

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Detailed development guide and architecture documentation
- **[RESTRUCTURE_SUMMARY.md](RESTRUCTURE_SUMMARY.md)** - Modular monolith migration report
- **[HOTFIX_REPORT.md](HOTFIX_REPORT.md)** - Critical bug fixes after migration

## 🤝 Community & Support

- **[💬 Discussions](https://github.com/GeorgeStudio96/pig-rider/discussions)** - Общие вопросы, идеи, обсуждения
- **[🐛 Issues](https://github.com/GeorgeStudio96/pig-rider/issues)** - Баги и конкретные задачи
- **[📖 Testing Guide](/.github/CONTRIBUTING.md)** - Как помочь с тестированием

### Key Concepts

- **Modular Architecture:** Features organized by domain, not technical layers
- **SOLID Principles:** Every module follows Single Responsibility Principle
- **Hybrid Rendering:** PixiJS for game objects, HTML/CSS for UI
- **Object Pooling:** Performance optimization for spawned objects
- **Fixed Timestep:** 60 FPS game loop with interpolation

## 🎮 Game Features

- **Endless Runner:** Infinite side-scrolling gameplay
- **3-Lane System:** Player can move between 3 horizontal lanes
- **Coin Collection:** Collect coins to reach target score
- **Obstacles:** Avoid various obstacles (small/large)
- **Power-ups:** Booster mode with increased coin spawns
- **Dynamic Difficulty:** Game speed increases with score
- **Visual Effects:** Animated coin collection and collision effects
- **Music System:** Dynamic music with state-based transitions
- **Performance Monitoring:** Built-in performance stats (Shift+P)

## 📄 License

ISC
