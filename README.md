# 🐷 Pig Rider - Endless Runner Game

Endless runner game built with PixiJS and GSAP. Collect 500 eggs while avoiding obstacles!

## 📁 Project Structure

```
game/
├── src/
│   ├── config/
│   │   └── constants.js          # Game configuration
│   ├── core/
│   │   ├── AssetLoader.js        # Asset loading system
│   │   ├── GameLoop.js           # Fixed timestep game loop
│   │   └── Renderer.js           # PixiJS renderer wrapper
│   ├── entities/
│   │   ├── Player.js             # Player with lane-based movement
│   │   ├── Obstacle.js           # Obstacle entity
│   │   └── Coin.js               # Coin entity with animations
│   ├── systems/
│   │   ├── SpawnSystem.js        # Object spawning with pooling
│   │   └── CollisionSystem.js    # Collision detection with spatial hashing
│   ├── ui/
│   │   ├── HUD.js                # Heads-up display
│   │   ├── StartModal.js         # Start screen
│   │   └── EndModal.js           # End screen (win/lose)
│   ├── utils/
│   │   ├── MathUtils.js          # Math helper functions
│   │   └── ObjectPool.js         # Object pooling utility
│   ├── Game.js                   # Main game orchestrator
│   └── main.js                   # Entry point
├── public/
│   └── assets/
│       ├── sprites/              # SVG game assets
│       └── audio/                # Audio files (to be added)
├── index.html                    # Development HTML
├── vite.config.js                # Build configuration
└── webflow-integration.html      # Webflow integration guide

```

## 🚀 Getting Started

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Start dev server:**
```bash
npm run dev
```

3. **Open browser:**
Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

This creates:
- `dist/game.min.js` - Minified game bundle
- `dist/assets/` - Optimized assets

## 🎮 Controls

- **↑** or **W** - Move up one lane
- **↓** or **S** - Move down one lane
- **Space** - Start game / Restart

## 🏗️ Architecture

### Core Systems

**GameLoop** - Fixed timestep (60 FPS) with interpolation
- Prevents physics variations on different framerates
- Separates update and render logic

**Renderer** - PixiJS wrapper with responsive canvas
- Auto-scaling based on container size
- Maintains 16:9 aspect ratio

**AssetLoader** - Centralized asset management
- Preloads all sprites before game start
- Texture caching for performance

### Entity System

**Player** - Lane-based movement with GSAP animations
- 3 horizontal lanes (top, middle, bottom)
- Smooth transitions between lanes
- Keyboard input handling

**Obstacle** - Barriers to avoid
- Object pooling for memory efficiency
- Configurable spawn intervals

**Coin** - Collectibles with rotation animation
- Collection animation (scale + fade)
- Pooled for performance

### Game Systems

**SpawnSystem** - Manages entity spawning
- Object pooling for obstacles and coins
- Dynamic spawn rates based on game speed
- Lane-based distribution

**CollisionSystem** - Efficient collision detection
- Spatial hashing grid for optimization
- AABB collision checks
- Separate handling for obstacles and coins

## 📊 Performance Features

✅ **Object Pooling** - Reuse entities instead of creating/destroying
✅ **Spatial Hashing** - Only check nearby objects for collisions
✅ **Fixed Timestep** - Consistent physics regardless of framerate
✅ **Asset Preloading** - All assets loaded before gameplay
✅ **Efficient Rendering** - PixiJS WebGL renderer

## 🌐 Webflow Integration

See [webflow-integration.html](webflow-integration.html) for detailed instructions.

### Quick Steps:

1. Add CDN libraries to Webflow Project Settings
2. Build game: `npm run build`
3. Upload `dist/game.min.js` to your hosting (AWS S3, Cloudflare, etc.)
4. Add canvas element in Webflow Designer
5. Load game script with your CDN URL

Detailed guide with checklist included in `webflow-integration.html`.

## 🎨 Customization

### Game Configuration

Edit `src/config/constants.js`:

```javascript
CONFIG = {
  TARGET_EGGS: 500,           // Win condition
  GAME_SPEED: 1.0,            // Starting speed
  MAX_SPEED: 2.5,             // Maximum speed cap
  SPEED_INCREMENT: 0.0005,    // How fast speed increases
  // ... more settings
}
```

### Visual Styling

- Replace SVG assets in `public/assets/sprites/`
- Modify UI text styles in `src/ui/*.js`
- Update colors and fonts to match brand

### Audio (Coming Soon)

Placeholder ready in:
- `src/core/AssetLoader.js` - Audio loading
- `src/entities/Coin.js` - Coin collect sound
- Background music integration point

## 🔧 Tech Stack

- **PixiJS 8** - WebGL rendering engine
- **GSAP 3** - Animation library
- **Vite** - Build tool and dev server
- **Terser** - JavaScript minification

## 📝 TODO

- [ ] Add background music and SFX
- [ ] Implement brand styling
- [ ] Add more visual effects (particles, trails)
- [ ] Leaderboard integration
- [ ] Mobile touch controls
- [ ] Progressive difficulty system

## 📄 License

ISC

---

Built with ❤️ for Webflow integration
