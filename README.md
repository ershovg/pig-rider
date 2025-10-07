# 🐷 Pig Rider Game

Endless runner game built with PixiJS for Webflow integration.

## 📁 Project Structure

```
pig-rider-game/
├── src/
│   ├── config/              # Game configuration
│   │   ├── constants.js     # Game constants (overridable)
│   │   └── env.js           # Environment variables
│   │
│   ├── core/                # Core game engine (PixiJS)
│   │   ├── AssetLoader.js   # Asset loading
│   │   ├── GameLoop.js      # Game loop
│   │   └── Renderer.js      # PixiJS renderer
│   │
│   ├── entities/            # Game entities
│   │   ├── Player.js        # Pig character
│   │   ├── Obstacle.js      # Obstacles
│   │   └── Coin.js          # Collectible coins
│   │
│   ├── systems/             # Game systems
│   │   ├── SpawnSystem.js   # Object spawning
│   │   └── CollisionSystem.js # Collision detection
│   │
│   ├── ui/                  # UI controller (Webflow)
│   │   ├── UIController.js  # HTML element management
│   │   └── AIBotModal.js    # AI bot (optional)
│   │
│   ├── services/            # External services
│   │   └── ElevenLabsService.js # AI voice (optional)
│   │
│   ├── utils/               # Utilities
│   │   ├── EventBus.js
│   │   ├── MathUtils.js
│   │   └── ObjectPool.js
│   │
│   ├── animations/          # GSAP animations
│   │   ├── gsap-clouds.js
│   │   ├── gsap-stars.js
│   │   └── gsap-buttons.js
│   │
│   ├── Game.js              # Main game class
│   ├── main.js              # Entry point for local development
│   └── webflow.js           # 🎯 Entry point for Webflow bundle
│
├── public/
│   └── assets/
│       └── sprites/         # PNG sprites (@2x)
│           ├── pig_rider.png
│           ├── barier_base.png
│           ├── coin.png
│           └── ...
│
├── dist/                    # 📦 Build output
│   ├── game.bundle.js       # For Webflow
│   └── game.bundle.js.map   # Source map
│
└── vite.config.js
```

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
You can override any value from `src/config/constants.js` via `window.GAME_CONFIG`:

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

All sprites must be PNG @2x resolution:
- `pig_rider.png` - Player character
- `barier_base.png` - Small obstacle
- `barier_large.png` - Large obstacle
- `coin.png` - Regular coin
- `coin_star.png` - Special coin
- `booster.png` - Booster item
- `star.png` - Decoration
- `cloud.png` - Background element

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

## 📄 License

ISC
