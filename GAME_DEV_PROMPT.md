# 🎮 Pig Rider - Professional Game Development Brief

## 📋 Project Overview

You are tasked with creating a high-performance web-based endless runner game called "Pig Rider". This is a Subway Surfers-style game with vertical lane mechanics, rendered using PixiJS with optional Three.js integration for 3D elements.

**Performance Target**: 60 FPS on mid-range devices, 120 FPS on high-end devices
**Platform**: Web (desktop + mobile responsive)
**Technology Stack**: Vanilla JavaScript (ES6+), HTML5, CSS3, PixiJS 7.x, Three.js (optional)

---

## 🎯 Game Mechanics (Based on Screenshots)

### Core Gameplay
1. **Player Character**: An orange pig with a rider, flying continuously from left to right
2. **Vertical Control**: Player can move UP and DOWN across 3 horizontal lanes
3. **Endless Runner**: Auto-scrolling environment with procedurally generated obstacles
4. **Collection System**: Collect eggs (currency) - target shown as "79/200" in UI
5. **Obstacles**: Brick walls that must be avoided
6. **Power-ups**: "Mellow booster" that increases speed temporarily
7. **Special Enemies**: Small enemy characters (orange bat-like creatures)

### Win/Lose Conditions
- **Win**: Collect 500 eggs (as shown in start screen: "Collect 500 🥚")
- **Lose**: Collision with obstacles or enemies
- **Progression**: Game difficulty increases over time (speed, obstacle density)

### UI States (from screenshots)
1. **Start Screen**: "Want a pig ride?" with "Play now" button
2. **Game Screen**: HUD showing egg count (79/200), score indicator
3. **Power-up Modal**: "Yay! You caught a Mellow booster that speeds you up!" with "Cool, continue" button
4. **Victory Screen**: "You won! Ready to play IRL?" with "Book a demo" and "Try Again" buttons
5. **Game Over Screen**: "Ooops, That's hurt... Beat it IRL!" with same CTAs

### Art Style
- Warm peachy/orange color palette (#FFE4C4, #FF8C42)
- Clean, minimalist SVG graphics
- Playful, casual aesthetic
- Cloud decorations in background
- Sparkle/star decorative elements

---

## 🏗️ Technical Architecture

### 1. Core Technologies

```javascript
// Technology Stack
{
  "core": {
    "runtime": "Vanilla JavaScript (ES6+ modules)",
    "rendering": "PixiJS 7.x (WebGL)",
    "3d_optional": "Three.js r150+",
    "bundler": "Vite 4.x",
    "language": "JavaScript (TypeScript optional but recommended)"
  },
  "libraries": {
    "animation": "GSAP 3.x (for UI tweens)",
    "audio": "@pixi/sound",
    "particles": "@pixi/particle-emitter",
    "collision": "Custom (spatial hashing)",
    "state": "Custom FSM (Finite State Machine)"
  },
  "tools": {
    "atlas_generation": "TexturePacker or @pixi/pack-loader",
    "optimization": "terser, imagemin",
    "testing": "Vitest (optional)"
  }
}
```

### 2. Project Structure

```
pig-rider-game/
├── public/
│   ├── index.html
│   └── assets/
│       ├── sprites/          # Original SVG files
│       │   ├── pig.svg
│       │   ├── rider.svg
│       │   ├── wall.svg
│       │   ├── egg.svg
│       │   ├── booster.svg
│       │   ├── enemy.svg
│       │   ├── cloud-*.svg
│       │   └── ui/
│       │       ├── button.svg
│       │       └── modal.svg
│       ├── atlas/            # Generated texture atlases
│       │   ├── game.json
│       │   └── game.png
│       └── sounds/
│           ├── collect.mp3
│           ├── boost.mp3
│           ├── collision.mp3
│           └── bgm.mp3
│
├── src/
│   ├── main.js              # Entry point
│   ├── config.js            # Game configuration
│   │
│   ├── core/
│   │   ├── Game.js          # Main game loop orchestrator
│   │   ├── Renderer.js      # PixiJS app wrapper
│   │   ├── AssetLoader.js   # Resource loading + caching
│   │   ├── SceneManager.js  # Scene transitions
│   │   └── StateMachine.js  # FSM for game states
│   │
│   ├── scenes/
│   │   ├── Scene.js         # Base scene class
│   │   ├── StartScene.js    # "Want a pig ride?"
│   │   ├── GameScene.js     # Main gameplay
│   │   └── EndScene.js      # Win/lose screens
│   │
│   ├── entities/
│   │   ├── Entity.js        # Base entity class
│   │   ├── Player.js        # Pig + rider
│   │   ├── Obstacle.js      # Walls
│   │   ├── Collectible.js   # Eggs
│   │   ├── PowerUp.js       # Boosters
│   │   ├── Enemy.js         # Flying enemies
│   │   └── Background.js    # Parallax clouds
│   │
│   ├── systems/
│   │   ├── InputSystem.js       # Keyboard + Touch
│   │   ├── PhysicsSystem.js     # Movement + gravity
│   │   ├── CollisionSystem.js   # Spatial hash collision detection
│   │   ├── SpawnSystem.js       # Procedural generation
│   │   ├── PoolManager.js       # Object pooling
│   │   └── ParticleSystem.js    # Effects
│   │
│   ├── ui/
│   │   ├── HUD.js           # Score, progress bar
│   │   ├── Modal.js         # Reusable modal component
│   │   └── Button.js        # Animated buttons
│   │
│   └── utils/
│       ├── SpatialHash.js   # Collision optimization
│       ├── Vector2.js       # 2D math
│       ├── Easing.js        # Custom easing functions
│       ├── Random.js        # Seeded RNG for replay
│       └── EventBus.js      # Decoupled communication
│
├── vite.config.js
├── package.json
└── README.md
```

---

## ⚡ Performance Optimization Strategies

### 1. Object Pooling Pattern

**Why**: Avoid GC pauses from frequent object creation/destruction

```javascript
/**
 * High-performance object pool with pre-warming
 * Used for: obstacles, collectibles, particles
 */
class ObjectPool {
  constructor(Factory, initialSize = 100, maxSize = 500) {
    this.Factory = Factory;
    this.available = [];
    this.active = new Set();
    this.maxSize = maxSize;
    
    // Pre-warm pool
    for (let i = 0; i < initialSize; i++) {
      this.available.push(new Factory());
    }
  }
  
  acquire(...args) {
    let obj;
    if (this.available.length > 0) {
      obj = this.available.pop();
    } else if (this.active.size < this.maxSize) {
      obj = new this.Factory();
    } else {
      console.warn('Pool exhausted, reusing oldest active object');
      obj = this.active.values().next().value;
      this.release(obj);
    }
    
    this.active.add(obj);
    obj.reset(...args);
    return obj;
  }
  
  release(obj) {
    if (this.active.delete(obj)) {
      obj.cleanup();
      this.available.push(obj);
    }
  }
  
  releaseAll() {
    this.active.forEach(obj => {
      obj.cleanup();
      this.available.push(obj);
    });
    this.active.clear();
  }
}
```

### 2. Spatial Hashing for Collision Detection

**Why**: O(1) collision checks instead of O(n²)

```javascript
/**
 * Spatial hash grid for efficient broad-phase collision detection
 * Reduces collision checks from O(n²) to O(n)
 */
class SpatialHash {
  constructor(cellSize = 128) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }
  
  clear() {
    this.grid.clear();
  }
  
  insert(entity) {
    const cells = this._getCells(entity);
    cells.forEach(key => {
      if (!this.grid.has(key)) {
        this.grid.set(key, []);
      }
      this.grid.get(key).push(entity);
    });
  }
  
  query(entity) {
    const cells = this._getCells(entity);
    const nearby = new Set();
    
    cells.forEach(key => {
      const bucket = this.grid.get(key);
      if (bucket) {
        bucket.forEach(other => {
          if (other !== entity) nearby.add(other);
        });
      }
    });
    
    return Array.from(nearby);
  }
  
  _getCells(entity) {
    const minX = Math.floor(entity.x / this.cellSize);
    const maxX = Math.floor((entity.x + entity.width) / this.cellSize);
    const minY = Math.floor(entity.y / this.cellSize);
    const maxY = Math.floor((entity.y + entity.height) / this.cellSize);
    
    const cells = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        cells.push(`${x},${y}`);
      }
    }
    return cells;
  }
}
```

### 3. Sprite Atlas & Batching

**Critical**: Single texture atlas to minimize draw calls

```javascript
/**
 * Asset loading with sprite atlas generation
 * All game sprites in ONE texture = ONE draw call batch
 */
class AssetLoader {
  constructor(app) {
    this.app = app;
    this.loader = PIXI.Assets;
  }
  
  async loadGameAssets() {
    // Option A: Pre-generated atlas (recommended)
    await this.loader.load({
      alias: 'gameAtlas',
      src: '/assets/atlas/game.json'
    });
    
    // Option B: Dynamic atlas from SVGs
    const svgAssets = {
      pig: '/assets/sprites/pig.svg',
      wall: '/assets/sprites/wall.svg',
      egg: '/assets/sprites/egg.svg',
      // ... all sprites
    };
    
    const textures = await this.loader.load(svgAssets);
    
    // Create sprite atlas at runtime (if not pre-generated)
    this.atlas = this._createAtlas(textures);
    
    return this.atlas;
  }
  
  _createAtlas(textures) {
    // Pack textures into single atlas
    // This is better done offline with TexturePacker
    const atlasSize = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = atlasSize;
    const ctx = canvas.getContext('2d');
    
    const atlas = new Map();
    let x = 0, y = 0, maxHeight = 0;
    
    Object.entries(textures).forEach(([name, texture]) => {
      const { width, height } = texture;
      
      if (x + width > atlasSize) {
        x = 0;
        y += maxHeight;
        maxHeight = 0;
      }
      
      ctx.drawImage(texture.baseTexture.resource.source, x, y);
      
      atlas.set(name, {
        texture: new PIXI.Texture(
          PIXI.BaseTexture.from(canvas),
          new PIXI.Rectangle(x, y, width, height)
        ),
        frame: { x, y, w: width, h: height }
      });
      
      x += width;
      maxHeight = Math.max(maxHeight, height);
    });
    
    return atlas;
  }
}
```

### 4. Fixed Timestep Game Loop

**Why**: Consistent physics regardless of frame rate

```javascript
/**
 * Fixed timestep game loop with interpolation
 * Guarantees deterministic physics at 60Hz
 */
class GameLoop {
  constructor(updateCallback, renderCallback) {
    this.update = updateCallback;
    this.render = renderCallback;
    
    this.targetFPS = 60;
    this.fixedDeltaTime = 1000 / this.targetFPS; // 16.67ms
    this.maxFrameTime = this.fixedDeltaTime * 5; // Prevent spiral of death
    
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.frameId = null;
    
    // Performance monitoring
    this.fps = 0;
    this.frameCount = 0;
    this.fpsTime = 0;
  }
  
  start() {
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.tick(this.lastTime);
  }
  
  stop() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }
  
  tick(currentTime) {
    this.frameId = requestAnimationFrame((time) => this.tick(time));
    
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Prevent spiral of death
    if (deltaTime > this.maxFrameTime) {
      deltaTime = this.maxFrameTime;
    }
    
    this.accumulator += deltaTime;
    
    // Fixed timestep updates (physics, game logic)
    while (this.accumulator >= this.fixedDeltaTime) {
      this.update(this.fixedDeltaTime / 1000); // Convert to seconds
      this.accumulator -= this.fixedDeltaTime;
    }
    
    // Interpolation factor for smooth rendering
    const alpha = this.accumulator / this.fixedDeltaTime;
    this.render(alpha);
    
    // FPS counter
    this.frameCount++;
    this.fpsTime += deltaTime;
    if (this.fpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTime = 0;
    }
  }
}
```

### 5. Efficient Rendering Pipeline

```javascript
/**
 * Optimized PixiJS renderer setup
 */
class Renderer {
  constructor(width, height) {
    this.app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0xFFE4C4, // Peachy background
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
      
      // Performance optimizations
      powerPreference: 'high-performance',
      sharedTicker: false, // Use custom game loop
      
      // WebGL options
      useContextAlpha: false,
      preserveDrawingBuffer: false,
      clearBeforeRender: true,
    });
    
    // Disable PixiJS ticker (we use custom loop)
    this.app.ticker.stop();
    
    // Enable batching
    this.app.renderer.plugins.batch.maxTextures = 16;
    
    // Setup containers
    this.stage = this.app.stage;
    this.setupLayers();
  }
  
  setupLayers() {
    // Layered rendering for proper z-ordering and culling
    this.layers = {
      background: new PIXI.Container(),  // Parallax clouds
      gameplay: new PIXI.Container(),    // Player, obstacles, collectibles
      particles: new PIXI.Container(),   // Effects
      ui: new PIXI.Container()           // HUD, modals
    };
    
    // Add in order (back to front)
    Object.values(this.layers).forEach(layer => {
      this.stage.addChild(layer);
    });
    
    // Enable culling for gameplay layer
    this.layers.gameplay.cullable = true;
    this.layers.gameplay.cullArea = new PIXI.Rectangle(
      -200, -200,
      this.app.screen.width + 400,
      this.app.screen.height + 400
    );
  }
  
  render() {
    this.app.renderer.render(this.stage);
  }
}
```

---

## 🎮 Core Game Systems Implementation

### 1. Player System

```javascript
/**
 * Player entity with lane-based movement
 */
class Player extends PIXI.Container {
  constructor(atlas) {
    super();
    
    // Visual setup
    this.pig = new PIXI.Sprite(atlas.get('pig').texture);
    this.rider = new PIXI.Sprite(atlas.get('rider').texture);
    this.addChild(this.pig, this.rider);
    
    // Physics properties
    this.lane = 1; // 0 = top, 1 = middle, 2 = bottom
    this.targetY = 0;
    this.velocityY = 0;
    this.laneSpeed = 500; // pixels per second
    
    // State
    this.invincible = false;
    this.boosted = false;
    this.baseSpeed = 300;
    this.speed = this.baseSpeed;
    
    // Collision box (tighter than visual bounds)
    this.hitbox = {
      width: this.pig.width * 0.7,
      height: this.pig.height * 0.7,
      offsetX: this.pig.width * 0.15,
      offsetY: this.pig.height * 0.15
    };
  }
  
  update(dt) {
    // Lane interpolation for smooth movement
    const lanePositions = [100, 300, 500]; // Y positions of lanes
    this.targetY = lanePositions[this.lane];
    
    const dy = this.targetY - this.y;
    this.velocityY = dy * this.laneSpeed * dt;
    this.y += this.velocityY * dt;
    
    // Slight bounce animation
    this.pig.rotation = Math.sin(Date.now() * 0.005) * 0.1;
    
    // Boost decay
    if (this.boosted) {
      this.boostTimer -= dt;
      if (this.boostTimer <= 0) {
        this.boosted = false;
        this.speed = this.baseSpeed;
      }
    }
  }
  
  moveUp() {
    if (this.lane > 0) {
      this.lane--;
      this.playMoveSound();
    }
  }
  
  moveDown() {
    if (this.lane < 2) {
      this.lane++;
      this.playMoveSound();
    }
  }
  
  applyBoost(duration = 5) {
    this.boosted = true;
    this.boostTimer = duration;
    this.speed = this.baseSpeed * 1.5;
    
    // Visual feedback
    this.tint = 0xFFFF00; // Yellow tint
    setTimeout(() => { this.tint = 0xFFFFFF; }, 200);
  }
  
  getCollisionBox() {
    return {
      x: this.x + this.hitbox.offsetX,
      y: this.y + this.hitbox.offsetY,
      width: this.hitbox.width,
      height: this.hitbox.height
    };
  }
  
  playMoveSound() {
    // Sound implementation
  }
}
```

### 2. Spawn System with Procedural Generation

```javascript
/**
 * Procedural level generation system
 * Generates balanced, playable patterns
 */
class SpawnSystem {
  constructor(pools, gameConfig) {
    this.pools = pools;
    this.config = gameConfig;
    
    this.spawnX = 1000; // Start spawning off-screen right
    this.minGap = 300;
    this.maxGap = 600;
    this.difficulty = 1.0;
    this.difficultyIncreaseRate = 0.0001;
    
    // Pattern generation
    this.patterns = this.loadPatterns();
    this.lastPattern = null;
  }
  
  update(dt, camera, entities) {
    // Spawn new obstacles when needed
    while (this.spawnX < camera.x + this.config.screenWidth + 500) {
      this.spawnWave(entities);
    }
    
    // Increase difficulty over time
    this.difficulty += this.difficultyIncreaseRate * dt;
  }
  
  spawnWave(entities) {
    const gap = this.randomGap();
    const pattern = this.selectPattern();
    
    // Spawn obstacles based on pattern
    pattern.lanes.forEach((hasObstacle, laneIndex) => {
      if (hasObstacle) {
        const obstacle = this.pools.obstacles.acquire();
        obstacle.init(this.spawnX, this.getLaneY(laneIndex));
        entities.push(obstacle);
      }
    });
    
    // Spawn collectibles (eggs)
    this.spawnCollectibles(pattern, gap, entities);
    
    // Spawn power-ups (random, based on difficulty)
    if (Math.random() < 0.1 + this.difficulty * 0.05) {
      this.spawnPowerUp(entities);
    }
    
    // Spawn enemies (less frequent)
    if (Math.random() < 0.05 + this.difficulty * 0.03) {
      this.spawnEnemy(entities);
    }
    
    this.spawnX += gap;
  }
  
  selectPattern() {
    // Select pattern ensuring at least one lane is free
    let pattern;
    do {
      pattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];
    } while (pattern.lanes.every(lane => lane) && pattern !== this.lastPattern);
    
    this.lastPattern = pattern;
    return pattern;
  }
  
  spawnCollectibles(pattern, gap, entities) {
    // Place eggs in free lanes
    pattern.lanes.forEach((hasObstacle, laneIndex) => {
      if (!hasObstacle && Math.random() < 0.7) {
        // Spawn trail of eggs
        const eggCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < eggCount; i++) {
          const egg = this.pools.collectibles.acquire();
          egg.init(
            this.spawnX + (gap / eggCount) * i,
            this.getLaneY(laneIndex)
          );
          entities.push(egg);
        }
      }
    });
  }
  
  spawnPowerUp(entities) {
    const powerup = this.pools.powerups.acquire();
    const lane = Math.floor(Math.random() * 3);
    powerup.init(this.spawnX, this.getLaneY(lane));
    entities.push(powerup);
  }
  
  spawnEnemy(entities) {
    const enemy = this.pools.enemies.acquire();
    const lane = Math.floor(Math.random() * 3);
    enemy.init(this.spawnX, this.getLaneY(lane));
    entities.push(enemy);
  }
  
  getLaneY(index) {
    const lanePositions = [100, 300, 500];
    return lanePositions[index];
  }
  
  randomGap() {
    // Gap decreases with difficulty
    const difficultyFactor = Math.max(0.5, 1 - this.difficulty * 0.1);
    return (this.minGap + Math.random() * (this.maxGap - this.minGap)) * difficultyFactor;
  }
  
  loadPatterns() {
    // Pre-defined patterns for variety
    // true = obstacle, false = free lane
    return [
      { lanes: [true, false, false] },   // Top blocked
      { lanes: [false, true, false] },   // Middle blocked
      { lanes: [false, false, true] },   // Bottom blocked
      { lanes: [true, true, false] },    // Top+middle blocked
      { lanes: [true, false, true] },    // Top+bottom blocked
      { lanes: [false, true, true] },    // Middle+bottom blocked
      { lanes: [false, false, false] },  // All free (rare)
    ];
  }
}
```

### 3. Collision System

```javascript
/**
 * High-performance collision detection
 * Uses spatial hashing + AABB checks
 */
class CollisionSystem {
  constructor() {
    this.spatialHash = new SpatialHash(128);
  }
  
  update(player, entities) {
    // Clear and rebuild spatial hash
    this.spatialHash.clear();
    entities.forEach(entity => {
      if (entity.collidable) {
        this.spatialHash.insert(entity);
      }
    });
    
    // Get nearby entities for player
    const nearby = this.spatialHash.query(player);
    
    // Check collisions
    nearby.forEach(entity => {
      if (this.checkAABB(player.getCollisionBox(), entity.getCollisionBox())) {
        this.handleCollision(player, entity);
      }
    });
  }
  
  checkAABB(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }
  
  handleCollision(player, entity) {
    if (entity.type === 'obstacle' || entity.type === 'enemy') {
      if (!player.invincible) {
        EventBus.emit('player:hit', entity);
      }
    } else if (entity.type === 'collectible') {
      EventBus.emit('collectible:collected', entity);
      entity.collect();
    } else if (entity.type === 'powerup') {
      EventBus.emit('powerup:collected', entity);
      player.applyBoost();
      entity.collect();
    }
  }
}
```

### 4. Input System

```javascript
/**
 * Unified input handling for keyboard + touch
 */
class InputSystem {
  constructor() {
    this.keys = new Map();
    this.touches = new Map();
    this.swipeThreshold = 50;
    
    this.setupKeyboard();
    this.setupTouch();
  }
  
  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys.set(e.code, true);
      
      // Immediate response for better feel
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        EventBus.emit('input:moveUp');
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        EventBus.emit('input:moveDown');
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }
  
  setupTouch() {
    let touchStartY = 0;
    
    window.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    });
    
    window.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevent scrolling
    }, { passive: false });
    
    window.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY;
      
      if (Math.abs(deltaY) > this.swipeThreshold) {
        if (deltaY > 0) {
          EventBus.emit('input:moveUp'); // Swipe up
        } else {
          EventBus.emit('input:moveDown'); // Swipe down
        }
      }
    });
    
    // Alternative: Tap top/bottom half of screen
    window.addEventListener('click', (e) => {
      const screenHeight = window.innerHeight;
      if (e.clientY < screenHeight / 2) {
        EventBus.emit('input:moveUp');
      } else {
        EventBus.emit('input:moveDown');
      }
    });
  }
  
  isKeyPressed(code) {
    return this.keys.has(code);
  }
}
```

### 5. Score & Progress System

```javascript
/**
 * Score management and win condition tracking
 */
class ScoreSystem {
  constructor(targetScore = 500) {
    this.score = 0;
    this.targetScore = targetScore;
    this.distance = 0;
    this.highScore = this.loadHighScore();
    
    EventBus.on('collectible:collected', () => this.addScore(1));
    EventBus.on('powerup:collected', () => this.addScore(5));
  }
  
  addScore(amount) {
    this.score += amount;
    EventBus.emit('score:updated', this.score);
    
    // Check win condition
    if (this.score >= this.targetScore) {
      EventBus.emit('game:won');
    }
    
    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
  }
  
  addDistance(amount) {
    this.distance += amount;
  }
  
  reset() {
    this.score = 0;
    this.distance = 0;
  }
  
  getProgress() {
    return Math.min(this.score / this.targetScore, 1.0);
  }
  
  loadHighScore() {
    return parseInt(localStorage.getItem('pigRiderHighScore') || '0');
  }
  
  saveHighScore() {
    localStorage.setItem('pigRiderHighScore', this.highScore.toString());
  }
}
```

---

## 🎨 UI/UX Implementation

### 1. Scene Management

```javascript
/**
 * Scene manager with transitions
 */
class SceneManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.currentScene = null;
    this.scenes = new Map();
    this.transitioning = false;
  }
  
  registerScene(name, scene) {
    this.scenes.set(name, scene);
  }
  
  async switchTo(sceneName, transition = 'fade', duration = 300) {
    if (this.transitioning) return;
    this.transitioning = true;
    
    const newScene = this.scenes.get(sceneName);
    if (!newScene) {
      console.error(`Scene ${sceneName} not found`);
      return;
    }
    
    // Transition out current scene
    if (this.currentScene) {
      await this.transitionOut(this.currentScene, transition, duration);
      this.currentScene.exit();
      this.renderer.layers.ui.removeChild(this.currentScene);
    }
    
    // Transition in new scene
    this.currentScene = newScene;
    this.currentScene.enter();
    this.renderer.layers.ui.addChild(this.currentScene);
    await this.transitionIn(this.currentScene, transition, duration);
    
    this.transitioning = false;
  }
  
  async transitionOut(scene, type, duration) {
    return new Promise(resolve => {
      if (type === 'fade') {
        gsap.to(scene, {
          alpha: 0,
          duration: duration / 1000,
          onComplete: resolve
        });
      } else if (type === 'slide') {
        gsap.to(scene, {
          x: -scene.width,
          duration: duration / 1000,
          ease: 'power2.in',
          onComplete: resolve
        });
      }
    });
  }
  
  async transitionIn(scene, type, duration) {
    return new Promise(resolve => {
      if (type === 'fade') {
        scene.alpha = 0;
        gsap.to(scene, {
          alpha: 1,
          duration: duration / 1000,
          onComplete: resolve
        });
      } else if (type === 'slide') {
        scene.x = scene.width;
        gsap.to(scene, {
          x: 0,
          duration: duration / 1000,
          ease: 'power2.out',
          onComplete: resolve
        });
      }
    });
  }
}
```

### 2. Modal Component

```javascript
/**
 * Reusable modal for power-ups, win/lose screens
 */
class Modal extends PIXI.Container {
  constructor(config) {
    super();
    
    // Overlay (semi-transparent background)
    this.overlay = new PIXI.Graphics();
    this.overlay.beginFill(0x000000, 0.5);
    this.overlay.drawRect(0, 0, window.innerWidth, window.innerHeight);
    this.overlay.endFill();
    this.overlay.interactive = true; // Block clicks
    this.addChild(this.overlay);
    
    // Modal background
    this.background = new PIXI.Graphics();
    this.background.beginFill(0xFFFFFF);
    this.background.drawRoundedRect(0, 0, 400, 300, 20);
    this.background.endFill();
    this.background.x = (window.innerWidth - 400) / 2;
    this.background.y = (window.innerHeight - 300) / 2;
    this.addChild(this.background);
    
    // Title
    this.title = new PIXI.Text(config.title, {
      fontFamily: 'Arial',
      fontSize: 48,
      fill: 0x000000,
      fontWeight: 'bold'
    });
    this.title.anchor.set(0.5);
    this.title.x = this.background.x + 200;
    this.title.y = this.background.y + 60;
    this.addChild(this.title);
    
    // Message
    this.message = new PIXI.Text(config.message, {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0x333333,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 350
    });
    this.message.anchor.set(0.5);
    this.message.x = this.background.x + 200;
    this.message.y = this.background.y + 140;
    this.addChild(this.message);
    
    // Button
    this.button = this.createButton(config.buttonText, config.onButtonClick);
    this.button.x = this.background.x + 100;
    this.button.y = this.background.y + 220;
    this.addChild(this.button);
  }
  
  createButton(text, onClick) {
    const button = new PIXI.Container();
    button.interactive = true;
    button.buttonMode = true;
    
    const bg = new PIXI.Graphics();
    bg.beginFill(0xFF6B35); // Orange
    bg.drawRoundedRect(0, 0, 200, 50, 10);
    bg.endFill();
    button.addChild(bg);
    
    const label = new PIXI.Text(text, {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0xFFFFFF,
      fontWeight: 'bold'
    });
    label.anchor.set(0.5);
    label.x = 100;
    label.y = 25;
    button.addChild(label);
    
    // Hover effects
    button.on('pointerover', () => {
      gsap.to(bg, { alpha: 0.8, duration: 0.2 });
      gsap.to(button.scale, { x: 1.05, y: 1.05, duration: 0.2 });
    });
    
    button.on('pointerout', () => {
      gsap.to(bg, { alpha: 1, duration: 0.2 });
      gsap.to(button.scale, { x: 1, y: 1, duration: 0.2 });
    });
    
    button.on('pointerdown', () => {
      gsap.to(button.scale, { x: 0.95, y: 0.95, duration: 0.1 });
    });
    
    button.on('pointerup', () => {
      gsap.to(button.scale, { x: 1, y: 1, duration: 0.1 });
      onClick();
    });
    
    return button;
  }
  
  show() {
    this.alpha = 0;
    this.visible = true;
    gsap.to(this, { alpha: 1, duration: 0.3 });
    
    // Bounce animation
    this.background.scale.set(0.5);
    gsap.to(this.background.scale, {
      x: 1,
      y: 1,
      duration: 0.4,
      ease: 'back.out(1.7)'
    });
  }
  
  hide(callback) {
    gsap.to(this, {
      alpha: 0,
      duration: 0.3,
      onComplete: () => {
        this.visible = false;
        if (callback) callback();
      }
    });
  }
}
```

### 3. HUD (Heads-Up Display)

```javascript
/**
 * In-game UI showing score and progress
 */
class HUD extends PIXI.Container {
  constructor() {
    super();
    
    // Score counter
    this.scoreIcon = new PIXI.Sprite(/* egg texture */);
    this.scoreIcon.x = 20;
    this.scoreIcon.y = 20;
    this.addChild(this.scoreIcon);
    
    this.scoreText = new PIXI.Text('0/500', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0x000000,
      fontWeight: 'bold'
    });
    this.scoreText.x = 60;
    this.scoreText.y = 20;
    this.addChild(this.scoreText);
    
    // Progress bar
    this.progressBarBg = new PIXI.Graphics();
    this.progressBarBg.beginFill(0xCCCCCC);
    this.progressBarBg.drawRoundedRect(0, 0, 200, 10, 5);
    this.progressBarBg.endFill();
    this.progressBarBg.x = window.innerWidth - 220;
    this.progressBarBg.y = 30;
    this.addChild(this.progressBarBg);
    
    this.progressBarFill = new PIXI.Graphics();
    this.progressBarFill.x = this.progressBarBg.x;
    this.progressBarFill.y = this.progressBarBg.y;
    this.addChild(this.progressBarFill);
    
    // Event listeners
    EventBus.on('score:updated', (score) => this.updateScore(score));
  }
  
  updateScore(score) {
    const targetScore = 500;
    this.scoreText.text = `${score}/${targetScore}`;
    
    // Update progress bar
    const progress = Math.min(score / targetScore, 1.0);
    this.progressBarFill.clear();
    this.progressBarFill.beginFill(0xFF6B35);
    this.progressBarFill.drawRoundedRect(0, 0, 200 * progress, 10, 5);
    this.progressBarFill.endFill();
    
    // Juice: bounce animation on score increase
    gsap.fromTo(this.scoreText.scale, 
      { x: 1.2, y: 1.2 },
      { x: 1, y: 1, duration: 0.2, ease: 'back.out' }
    );
  }
}
```

---

## 🎵 Audio System

```javascript
/**
 * Audio manager with spatial sound (optional)
 */
class AudioSystem {
  constructor() {
    this.sounds = new Map();
    this.music = null;
    this.volume = {
      master: 1.0,
      sfx: 0.8,
      music: 0.5
    };
    
    this.muted = false;
  }
  
  async load() {
    // Load with @pixi/sound
    const sounds = {
      collect: '/assets/sounds/collect.mp3',
      boost: '/assets/sounds/boost.mp3',
      collision: '/assets/sounds/collision.mp3',
      bgm: '/assets/sounds/bgm.mp3'
    };
    
    for (const [name, url] of Object.entries(sounds)) {
      const sound = await PIXI.sound.Sound.from(url);
      this.sounds.set(name, sound);
    }
    
    this.music = this.sounds.get('bgm');
  }
  
  playSFX(name) {
    if (this.muted) return;
    
    const sound = this.sounds.get(name);
    if (sound) {
      sound.play({
        volume: this.volume.sfx * this.volume.master
      });
    }
  }
  
  playMusic() {
    if (this.muted || !this.music) return;
    
    this.music.play({
      loop: true,
      volume: this.volume.music * this.volume.master
    });
  }
  
  stopMusic() {
    if (this.music) {
      this.music.stop();
    }
  }
  
  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusic();
    } else {
      this.playMusic();
    }
  }
}
```

---

## 📊 Game Configuration

```javascript
/**
 * Centralized game configuration
 * Easy to tweak for game design iteration
 */
export const GameConfig = {
  // Display
  width: 800,
  height: 600,
  targetFPS: 60,
  
  // Player
  player: {
    baseSpeed: 300,      // pixels per second
    boostSpeed: 450,
    boostDuration: 5,    // seconds
    laneTransitionSpeed: 500,
    invincibilityDuration: 2
  },
  
  // Lanes
  lanes: {
    count: 3,
    positions: [100, 300, 500] // Y coordinates
  },
  
  // Spawning
  spawn: {
    initialGap: 600,
    minGap: 300,
    maxGap: 800,
    difficultyIncreaseRate: 0.0001,
    obstacleChance: 0.6,
    collectibleChance: 0.7,
    powerupChance: 0.1,
    enemyChance: 0.05
  },
  
  // Scoring
  score: {
    targetScore: 500,
    collectibleValue: 1,
    powerupValue: 5,
    enemyValue: 10
  },
  
  // Physics
  physics: {
    gravity: 0.5,
    terminalVelocity: 15
  },
  
  // Camera
  camera: {
    smoothing: 0.1,
    offsetX: 200 // Player offset from left edge
  },
  
  // Object pooling
  pools: {
    obstacles: 100,
    collectibles: 200,
    powerups: 20,
    enemies: 50,
    particles: 500
  }
};
```

---

## 🚀 Main Game Class

```javascript
/**
 * Main game orchestrator
 */
class PigRiderGame {
  constructor(container) {
    this.container = container;
    
    // Initialize core systems
    this.renderer = new Renderer(GameConfig.width, GameConfig.height);
    this.assetLoader = new AssetLoader(this.renderer.app);
    this.sceneManager = new SceneManager(this.renderer);
    this.audioSystem = new AudioSystem();
    
    // Initialize game systems
    this.inputSystem = new InputSystem();
    this.physicsSystem = new PhysicsSystem();
    this.collisionSystem = new CollisionSystem();
    this.spawnSystem = null; // Initialized per game session
    this.scoreSystem = new ScoreSystem(GameConfig.score.targetScore);
    
    // Object pools
    this.pools = this.createPools();
    
    // Game state
    this.state = 'loading'; // loading, menu, playing, paused, ended
    this.entities = [];
    this.camera = { x: 0, y: 0 };
    
    // Game loop
    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha)
    );
    
    // Mount to DOM
    this.container.appendChild(this.renderer.app.view);
    
    // Initialize
    this.init();
  }
  
  async init() {
    // Load assets
    this.state = 'loading';
    await this.assetLoader.loadGameAssets();
    await this.audioSystem.load();
    
    // Create scenes
    this.createScenes();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Start with menu
    this.state = 'menu';
    await this.sceneManager.switchTo('start');
  }
  
  createPools() {
    return {
      obstacles: new ObjectPool(
        () => new Obstacle(this.assetLoader.atlas),
        GameConfig.pools.obstacles
      ),
      collectibles: new ObjectPool(
        () => new Collectible(this.assetLoader.atlas),
        GameConfig.pools.collectibles
      ),
      powerups: new ObjectPool(
        () => new PowerUp(this.assetLoader.atlas),
        GameConfig.pools.powerups
      ),
      enemies: new ObjectPool(
        () => new Enemy(this.assetLoader.atlas),
        GameConfig.pools.enemies
      )
    };
  }
  
  createScenes() {
    const startScene = new StartScene(this);
    const gameScene = new GameScene(this);
    const endScene = new EndScene(this);
    
    this.sceneManager.registerScene('start', startScene);
    this.sceneManager.registerScene('game', gameScene);
    this.sceneManager.registerScene('end', endScene);
  }
  
  setupEventListeners() {
    EventBus.on('game:start', () => this.startGame());
    EventBus.on('game:won', () => this.endGame(true));
    EventBus.on('player:hit', () => this.endGame(false));
    EventBus.on('game:restart', () => this.restartGame());
  }
  
  async startGame() {
    this.state = 'playing';
    
    // Reset everything
    this.entities = [];
    this.camera = { x: 0, y: 0 };
    this.scoreSystem.reset();
    
    // Create player
    this.player = new Player(this.assetLoader.atlas);
    this.player.x = GameConfig.camera.offsetX;
    this.player.y = GameConfig.lanes.positions[1];
    this.renderer.layers.gameplay.addChild(this.player);
    
    // Create spawn system
    this.spawnSystem = new SpawnSystem(this.pools, GameConfig);
    
    // Create HUD
    this.hud = new HUD();
    this.renderer.layers.ui.addChild(this.hud);
    
    // Start game loop
    this.audioSystem.playMusic();
    this.gameLoop.start();
    
    // Switch to game scene
    await this.sceneManager.switchTo('game');
  }
  
  update(dt) {
    if (this.state !== 'playing') return;
    
    // Update player
    this.player.update(dt);
    
    // Update camera (follows player loosely)
    this.camera.x += (this.player.x - this.camera.x - GameConfig.camera.offsetX) * GameConfig.camera.smoothing;
    this.renderer.layers.gameplay.x = -this.camera.x;
    
    // Update spawn system
    this.spawnSystem.update(dt, this.camera, this.entities);
    
    // Update all entities
    this.entities.forEach(entity => entity.update(dt));
    
    // Remove off-screen entities
    this.cleanupEntities();
    
    // Collision detection
    this.collisionSystem.update(this.player, this.entities);
    
    // Update score
    this.scoreSystem.addDistance(this.player.speed * dt);
  }
  
  render(alpha) {
    this.renderer.render();
  }
  
  cleanupEntities() {
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      
      // Remove if far off-screen left
      if (entity.x < this.camera.x - 200) {
        this.entities.splice(i, 1);
        this.renderer.layers.gameplay.removeChild(entity);
        
        // Return to pool
        const poolName = entity.type + 's';
        if (this.pools[poolName]) {
          this.pools[poolName].release(entity);
        }
      }
    }
  }
  
  endGame(won) {
    this.state = 'ended';
    this.gameLoop.stop();
    this.audioSystem.stopMusic();
    
    // Show end modal
    const modal = new Modal({
      title: won ? 'You won!' : 'Ooops, That\'s hurt...',
      message: won ? 'Ready to play IRL?' : 'Beat it IRL!',
      buttonText: won ? 'Book a demo' : 'Try Again',
      onButtonClick: () => {
        if (won) {
          window.location.href = '/book-demo';
        } else {
          EventBus.emit('game:restart');
        }
      }
    });
    
    this.renderer.layers.ui.addChild(modal);
    modal.show();
  }
  
  async restartGame() {
    // Clean up current game
    this.renderer.layers.gameplay.removeChildren();
    this.renderer.layers.ui.removeChildren();
    
    // Release all pooled objects
    Object.values(this.pools).forEach(pool => pool.releaseAll());
    
    // Start new game
    await this.startGame();
  }
  
  destroy() {
    this.gameLoop.stop();
    this.audioSystem.stopMusic();
    this.renderer.app.destroy(true);
  }
}

// Entry point
const game = new PigRiderGame(document.getElementById('game-container'));
```

---

## 🎨 Visual Polish & Juice

### Particle Effects
```javascript
/**
 * Particle system for visual feedback
 */
class ParticleEffect {
  static createCollectEffect(x, y, container) {
    // Burst of sparkles when collecting egg
    for (let i = 0; i < 10; i++) {
      const particle = new PIXI.Graphics();
      particle.beginFill(0xFFD700);
      particle.drawStar(0, 0, 4, 5);
      particle.endFill();
      particle.x = x;
      particle.y = y;
      
      container.addChild(particle);
      
      const angle = (Math.PI * 2 * i) / 10;
      const speed = 100 + Math.random() * 100;
      
      gsap.to(particle, {
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          container.removeChild(particle);
          particle.destroy();
        }
      });
    }
  }
  
  static createBoostTrail(player, container) {
    // Speed lines when boosted
    const trail = new PIXI.Graphics();
    trail.lineStyle(2, 0xFFFFFF, 0.5);
    
    for (let i = 0; i < 5; i++) {
      const length = 50 + Math.random() * 50;
      trail.moveTo(player.x, player.y + i * 10);
      trail.lineTo(player.x - length, player.y + i * 10);
    }
    
    container.addChild(trail);
    
    gsap.to(trail, {
      alpha: 0,
      duration: 0.3,
      onComplete: () => {
        container.removeChild(trail);
        trail.destroy();
      }
    });
  }
}
```

### Screen Shake
```javascript
class CameraEffects {
  static shake(camera, intensity = 10, duration = 0.3) {
    const originalX = camera.x;
    const originalY = camera.y;
    
    gsap.to(camera, {
      x: originalX + Math.random() * intensity - intensity / 2,
      y: originalY + Math.random() * intensity - intensity / 2,
      duration: 0.05,
      repeat: Math.floor(duration / 0.05),
      yoyo: true,
      onComplete: () => {
        camera.x = originalX;
        camera.y = originalY;
      }
    });
  }
}
```

---

## 🔧 Build & Deployment

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ['pixi.js'],
          gsap: ['gsap']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
});
```

### Package.json

```json
{
  "name": "pig-rider-game",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .js"
  },
  "dependencies": {
    "pixi.js": "^7.3.0",
    "@pixi/sound": "^5.2.0",
    "@pixi/particle-emitter": "^5.0.8",
    "gsap": "^3.12.0"
  },
  "devDependencies": {
    "vite": "^4.5.0",
    "eslint": "^8.50.0",
    "terser": "^5.20.0"
  }
}
```

---

## 📱 Mobile Optimization

### Responsive Design
```javascript
class ResponsiveManager {
  constructor(app) {
    this.app = app;
    this.baseWidth = GameConfig.width;
    this.baseHeight = GameConfig.height;
    
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }
  
  resize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const scale = Math.min(
      screenWidth / this.baseWidth,
      screenHeight / this.baseHeight
    );
    
    this.app.renderer.resize(
      Math.floor(screenWidth),
      Math.floor(screenHeight)
    );
    
    this.app.stage.scale.set(scale);
    
    // Center stage
    this.app.stage.x = (screenWidth - this.baseWidth * scale) / 2;
    this.app.stage.y = (screenHeight - this.baseHeight * scale) / 2;
  }
}
```

### Performance Mode
```javascript
class PerformanceManager {
  constructor(app) {
    this.app = app;
    this.checkPerformance();
  }
  
  checkPerformance() {
    // Detect device capabilities
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency <= 4;
    
    if (isMobile || isLowEnd) {
      this.enableLowPerformanceMode();
    }
  }
  
  enableLowPerformanceMode() {
    // Reduce visual effects
    GameConfig.particles.enabled = false;
    
    // Lower texture resolution
    this.app.renderer.resolution = 1;
    
    // Disable antialiasing
    this.app.renderer.antialias = false;
    
    console.log('Low performance mode enabled');
  }
}
```

---

## 🧪 Testing Checklist

### Functional Testing
- [ ] Player moves up/down correctly
- [ ] Collision detection accurate
- [ ] Score increments properly
- [ ] Power-ups apply boost
- [ ] Win condition triggers at 500 eggs
- [ ] Lose condition triggers on collision
- [ ] Modal animations smooth
- [ ] Sounds play correctly
- [ ] High score saves

### Performance Testing
- [ ] 60 FPS maintained on target devices
- [ ] No memory leaks (check DevTools)
- [ ] Object pooling working (no GC spikes)
- [ ] Texture atlas loaded (single drawcall batch)
- [ ] No console errors

### Cross-browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (desktop + iOS)
- [ ] Mobile browsers

### Accessibility
- [ ] Keyboard controls work
- [ ] Touch controls work
- [ ] Color contrast sufficient
- [ ] Sounds can be muted

---

## 📈 Optimization Metrics

**Target Performance:**
- FPS: 60 (locked)
- Draw calls: <10 per frame
- Memory usage: <50MB
- Load time: <2 seconds
- Bundle size: <500KB (gzipped)

**Monitoring:**
```javascript
class PerformanceMonitor {
  constructor() {
    this.stats = {
      fps: 0,
      drawCalls: 0,
      entities: 0,
      memory: 0
    };
  }
  
  update(app, entities) {
    this.stats.fps = Math.round(app.ticker.FPS);
    this.stats.drawCalls = app.renderer.plugins.batch.currentBatchSize;
    this.stats.entities = entities.length;
    
    if (performance.memory) {
      this.stats.memory = Math.round(performance.memory.usedJSHeapSize / 1048576);
    }
  }
  
  render() {
    // Display in dev mode
    if (import.meta.env.DEV) {
      console.table(this.stats);
    }
  }
}
```

---

## 🎯 Final Implementation Notes

### Priority Features (MVP)
1. ✅ Player movement (up/down)
2. ✅ Obstacle avoidance
3. ✅ Collectible system (eggs)
4. ✅ Power-ups (booster)
5. ✅ Score tracking
6. ✅ Win/lose conditions
7. ✅ Start/end screens
8. ✅ Mobile support

### Post-MVP Features
- 🔄 Leaderboards (backend required)
- 🔄 Multiple skins/themes
- 🔄 Daily challenges
- 🔄 Sound effects library
- 🔄 Tutorial mode
- 🔄 Achievements system
- 🔄 Three.js 3D version

### Known Gotchas
1. **PixiJS Ticker**: Disable default ticker, use custom loop
2. **iOS Audio**: Requires user interaction before playing sounds
3. **Touch Events**: Prevent default to avoid scrolling
4. **Memory**: Always return objects to pools, never just removeChild
5. **Texture Atlas**: Generate offline with TexturePacker for best results

---

## 📚 Resources

- PixiJS Docs: https://pixijs.download/release/docs/index.html
- PixiJS Examples: https://pixijs.io/examples/
- GSAP Docs: https://greensock.com/docs/
- Game Programming Patterns: https://gameprogrammingpatterns.com/

---

**Implementation Time Estimate**: 3-5 days for senior developer
**Lines of Code**: ~3000-4000 LOC
**Bundle Size**: ~400KB (minified + gzipped)

Good luck building your game! 🚀🐷
