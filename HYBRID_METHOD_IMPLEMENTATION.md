# 🎯 Метод #4 (Hybrid) - Детальная реализация для Webflow

## 📋 Архитектура решения

```
Webflow Site
  └── Любая страница (Designer)
      └── Canvas element [data-game="pig-rider"]
      
→ Page Settings (Custom Code)
  └── Загрузка внешних скриптов

→ External CDN (Cloudflare R2 / GitHub)
  ├── game.min.js (вся логика игры)
  ├── config.js (настройки игры)
  └── assets/
      ├── sprites/
      ├── sounds/
      └── atlas.json
```

### ✅ Преимущества этого подхода

1. **Гибкость**: Canvas можно добавить на ЛЮБУЮ страницу
2. **Чистота**: Минимум кода в Webflow
3. **Обновляемость**: Меняешь только файл на CDN
4. **Переиспользование**: Один скрипт для всех страниц
5. **Производительность**: Библиотеки кешируются браузером

---

## 🏗️ Шаг 1: Структура файлов на CDN

```
your-cdn.com/pig-rider/
├── libs/
│   ├── pixi.min.js           # 140KB
│   ├── gsap.min.js           # 50KB
│   └── pixi-sound.min.js     # 30KB
│
├── game.min.js               # Вся логика игры (50-100KB)
├── config.js                 # Настройки (5KB)
│
└── assets/
    ├── sprites/
    │   ├── atlas.json        # Sprite atlas metadata
    │   ├── atlas.png         # Все спрайты в одной текстуре
    │   └── ui/
    │       └── buttons.png
    │
    └── sounds/
        ├── collect.mp3
        ├── boost.mp3
        └── bgm.mp3
```

---

## 🎨 Шаг 2: Создание Canvas в Webflow Designer

### В Webflow Designer:

1. **Создай страницу** (например `/pig-rider`) или открой существующую
2. **Добавь Div Block** → дай класс `game-container`
3. **Внутри Div** добавь **HTML Embed** element
4. В HTML Embed вставь:

```html
<canvas 
  id="pig-rider-canvas" 
  data-game="pig-rider"
  data-config='{"width": 800, "height": 600, "debug": false}'
></canvas>
```

5. **Стилизация** в Designer (класс `.game-container`):

```
Display: Flex
Justify: Center
Align: Center
Min Height: 100vh
Background: Linear gradient (#FFE4C4 → #FFD4A4)
```

### Альтернатива без HTML Embed (чище):

Если не хочешь использовать HTML Embed, можно через **Custom Attributes**:

1. Добавь **Div Block** → класс `game-container`
2. Settings → Custom Attributes:
   - Attribute: `data-game`
   - Value: `pig-rider`
3. Div автоматически станет canvas через JS

---

## 📝 Шаг 3: Custom Code в Page Settings

### В Webflow: Page Settings → Custom Code

**В секции `<head>` (Before </head> tag):**

```html
<!-- Preload критичных ресурсов -->
<link rel="preload" href="https://cdn.yoursite.com/pig-rider/libs/pixi.min.js" as="script">
<link rel="preload" href="https://cdn.yoursite.com/pig-rider/game.min.js" as="script">
<link rel="preload" href="https://cdn.yoursite.com/pig-rider/assets/sprites/atlas.png" as="image">

<!-- Preconnect к CDN для быстрого DNS lookup -->
<link rel="preconnect" href="https://cdn.yoursite.com">
<link rel="dns-prefetch" href="https://cdn.yoursite.com">

<style>
  /* Стили для canvas */
  canvas[data-game="pig-rider"] {
    max-width: 100%;
    height: auto;
    display: block;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
  }
  
  /* Loading overlay */
  .game-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 10;
  }
  
  .game-loading.hidden {
    display: none;
  }
  
  /* Prevent iOS bounce */
  .game-container {
    overscroll-behavior: none;
  }
  
  /* Mobile optimization */
  @media (max-width: 768px) {
    canvas[data-game="pig-rider"] {
      width: 100vw !important;
      height: auto !important;
    }
  }
</style>
```

**В секции `<body>` (Before </body> tag):**

```html
<!-- Загрузка библиотек -->
<script src="https://cdn.yoursite.com/pig-rider/libs/pixi.min.js" defer></script>
<script src="https://cdn.yoursite.com/pig-rider/libs/gsap.min.js" defer></script>

<!-- Конфигурация игры (можно inline для быстрого изменения) -->
<script>
  // Глобальная конфигурация игры
  window.PIG_RIDER_CONFIG = {
    cdnUrl: 'https://cdn.yoursite.com/pig-rider',
    
    // Game settings (можно менять без изменения game.js)
    targetScore: 500,
    difficulty: 1.0,
    enableSound: true,
    enableAnalytics: true,
    
    // Visual settings
    showFPS: false,
    particlesEnabled: true,
    
    // Analytics (если используешь GTM)
    analyticsId: 'UA-XXXXX-Y',
    
    // A/B testing (если нужно)
    variant: 'default' // 'easy', 'hard', 'custom'
  };
</script>

<!-- Основная логика игры -->
<script src="https://cdn.yoursite.com/pig-rider/game.min.js" defer></script>

<!-- Инициализация -->
<script>
  // Ждём загрузки всех скриптов
  window.addEventListener('load', function() {
    // Проверяем, что все библиотеки загружены
    if (typeof PIXI === 'undefined' || typeof gsap === 'undefined') {
      console.error('Libraries not loaded');
      return;
    }
    
    // Инициализируем игру
    if (window.PigRiderGame) {
      window.PigRiderGame.init();
    }
  });
</script>
```

---

## 🎮 Шаг 4: Структура game.js (External file)

Создай файл `game.js` со всей логикой игры:

```javascript
/**
 * Pig Rider Game - Main Entry Point
 * Version: 1.0.0
 */

(function() {
  'use strict';
  
  // Namespace для избежания конфликтов с Webflow
  window.PigRiderGame = window.PigRiderGame || {};
  
  const Game = {
    config: null,
    app: null,
    canvas: null,
    assets: {},
    state: 'loading', // loading, menu, playing, paused, ended
    
    /**
     * Инициализация игры
     */
    init: function() {
      console.log('🐷 Pig Rider Game initializing...');
      
      // Получаем конфиг
      this.config = window.PIG_RIDER_CONFIG || this.getDefaultConfig();
      
      // Находим canvas
      this.canvas = document.querySelector('canvas[data-game="pig-rider"]');
      
      if (!this.canvas) {
        // Если canvas не найден, создаём из div
        const container = document.querySelector('[data-game="pig-rider"]');
        if (container) {
          this.canvas = document.createElement('canvas');
          this.canvas.id = 'pig-rider-canvas';
          container.appendChild(this.canvas);
        } else {
          console.error('Game container not found');
          return;
        }
      }
      
      // Показываем loading screen
      this.showLoadingScreen();
      
      // Инициализируем PixiJS
      this.initPixi();
      
      // Загружаем ресурсы
      this.loadAssets().then(() => {
        this.onAssetsLoaded();
      }).catch((error) => {
        console.error('Asset loading failed:', error);
        this.showError('Failed to load game assets');
      });
    },
    
    /**
     * Инициализация PixiJS приложения
     */
    initPixi: function() {
      // Получаем размеры из data-атрибутов или конфига
      const dataConfig = this.canvas.getAttribute('data-config');
      const customConfig = dataConfig ? JSON.parse(dataConfig) : {};
      
      const width = customConfig.width || this.config.width || 800;
      const height = customConfig.height || this.config.height || 600;
      
      this.app = new PIXI.Application({
        view: this.canvas,
        width: width,
        height: height,
        backgroundColor: 0xFFE4C4,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      
      // Отключаем дефолтный ticker (используем свой game loop)
      this.app.ticker.stop();
      
      // Setup layers
      this.setupLayers();
      
      // Responsive resize
      this.setupResponsive();
    },
    
    /**
     * Setup rendering layers
     */
    setupLayers: function() {
      this.layers = {
        background: new PIXI.Container(),
        gameplay: new PIXI.Container(),
        particles: new PIXI.Container(),
        ui: new PIXI.Container()
      };
      
      Object.values(this.layers).forEach(layer => {
        this.app.stage.addChild(layer);
      });
    },
    
    /**
     * Responsive canvas
     */
    setupResponsive: function() {
      const resize = () => {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const scale = Math.min(
          containerWidth / this.app.screen.width,
          containerHeight / this.app.screen.height
        );
        
        this.canvas.style.width = (this.app.screen.width * scale) + 'px';
        this.canvas.style.height = (this.app.screen.height * scale) + 'px';
      };
      
      window.addEventListener('resize', resize);
      resize();
    },
    
    /**
     * Загрузка всех ресурсов
     */
    loadAssets: async function() {
      const baseUrl = this.config.cdnUrl;
      
      // Список ресурсов для загрузки
      const assetsToLoad = {
        // Sprite atlas
        atlas: `${baseUrl}/assets/sprites/atlas.json`,
        
        // Sounds (если включены)
        ...(this.config.enableSound && {
          collect: `${baseUrl}/assets/sounds/collect.mp3`,
          boost: `${baseUrl}/assets/sounds/boost.mp3`,
          collision: `${baseUrl}/assets/sounds/collision.mp3`,
          bgm: `${baseUrl}/assets/sounds/bgm.mp3`,
        })
      };
      
      // Progress tracking
      let loaded = 0;
      const total = Object.keys(assetsToLoad).length;
      
      PIXI.Assets.loader.onProgress.add((loader) => {
        loaded = loader.progress;
        this.updateLoadProgress(loaded);
      });
      
      // Load all assets
      this.assets = await PIXI.Assets.load(assetsToLoad);
      
      return this.assets;
    },
    
    /**
     * Вызывается когда все ресурсы загружены
     */
    onAssetsLoaded: function() {
      console.log('✅ Assets loaded successfully');
      
      this.hideLoadingScreen();
      
      // Инициализируем игровые системы
      this.initGameSystems();
      
      // Показываем стартовый экран
      this.showStartScreen();
    },
    
    /**
     * Инициализация игровых систем
     */
    initGameSystems: function() {
      // Создаём менеджеры и системы
      this.poolManager = new PoolManager();
      this.inputSystem = new InputSystem();
      this.collisionSystem = new CollisionSystem();
      this.scoreSystem = new ScoreSystem(this.config.targetScore);
      
      if (this.config.enableSound) {
        this.audioSystem = new AudioSystem(this.assets);
      }
      
      if (this.config.enableAnalytics) {
        this.analyticsSystem = new AnalyticsSystem(this.config.analyticsId);
      }
      
      // Event listeners
      this.setupEventListeners();
    },
    
    /**
     * Event listeners
     */
    setupEventListeners: function() {
      // Game events
      window.addEventListener('game:start', () => this.startGame());
      window.addEventListener('game:won', () => this.endGame(true));
      window.addEventListener('game:lost', () => this.endGame(false));
      window.addEventListener('game:restart', () => this.restartGame());
      
      // Input events
      window.addEventListener('input:moveUp', () => {
        if (this.player) this.player.moveUp();
      });
      
      window.addEventListener('input:moveDown', () => {
        if (this.player) this.player.moveDown();
      });
      
      // Analytics events
      if (this.config.enableAnalytics) {
        window.addEventListener('collectible:collected', (e) => {
          this.analyticsSystem.track('collect_egg', { score: e.detail.score });
        });
      }
    },
    
    /**
     * Показать стартовый экран
     */
    showStartScreen: function() {
      this.state = 'menu';
      
      const startScreen = new StartScreen(this.app.screen);
      startScreen.onPlayClick = () => {
        this.layers.ui.removeChild(startScreen);
        window.dispatchEvent(new Event('game:start'));
      };
      
      this.layers.ui.addChild(startScreen);
    },
    
    /**
     * Старт игры
     */
    startGame: function() {
      console.log('🎮 Starting game...');
      this.state = 'playing';
      
      // Reset everything
      this.entities = [];
      this.scoreSystem.reset();
      
      // Create player
      this.player = new Player(this.assets.atlas);
      this.player.x = 200;
      this.player.y = 300;
      this.layers.gameplay.addChild(this.player);
      
      // Create spawn system
      this.spawnSystem = new SpawnSystem(this.poolManager, this.config);
      
      // Create HUD
      this.hud = new HUD();
      this.layers.ui.addChild(this.hud);
      
      // Start game loop
      this.startGameLoop();
      
      // Start music
      if (this.audioSystem) {
        this.audioSystem.playMusic();
      }
      
      // Track game start
      if (this.analyticsSystem) {
        this.analyticsSystem.track('game_start');
      }
    },
    
    /**
     * Game loop
     */
    startGameLoop: function() {
      let lastTime = performance.now();
      const targetFPS = 60;
      const fixedDeltaTime = 1000 / targetFPS;
      let accumulator = 0;
      
      const loop = (currentTime) => {
        if (this.state !== 'playing') return;
        
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        accumulator += deltaTime;
        
        // Fixed timestep updates
        while (accumulator >= fixedDeltaTime) {
          this.update(fixedDeltaTime / 1000); // convert to seconds
          accumulator -= fixedDeltaTime;
        }
        
        // Render
        this.render();
        
        requestAnimationFrame(loop);
      };
      
      requestAnimationFrame(loop);
    },
    
    /**
     * Update игровой логики
     */
    update: function(dt) {
      // Update player
      if (this.player) {
        this.player.update(dt);
      }
      
      // Update spawn system
      if (this.spawnSystem) {
        this.spawnSystem.update(dt, this.camera, this.entities);
      }
      
      // Update all entities
      this.entities.forEach(entity => entity.update(dt));
      
      // Collision detection
      if (this.collisionSystem) {
        this.collisionSystem.update(this.player, this.entities);
      }
      
      // Cleanup off-screen entities
      this.cleanupEntities();
      
      // Show FPS if debug mode
      if (this.config.showFPS) {
        this.showFPS(1 / dt);
      }
    },
    
    /**
     * Render
     */
    render: function() {
      this.app.renderer.render(this.app.stage);
    },
    
    /**
     * Cleanup off-screen entities
     */
    cleanupEntities: function() {
      // Implementation from prompt
      // Remove entities that are off-screen left
      // Return to pool
    },
    
    /**
     * End game
     */
    endGame: function(won) {
      console.log(won ? '🎉 You won!' : '💥 Game over');
      this.state = 'ended';
      
      // Stop music
      if (this.audioSystem) {
        this.audioSystem.stopMusic();
      }
      
      // Show end screen
      const endScreen = new EndScreen(won, this.scoreSystem.score);
      endScreen.onRestartClick = () => {
        this.layers.ui.removeChild(endScreen);
        window.dispatchEvent(new Event('game:restart'));
      };
      
      this.layers.ui.addChild(endScreen);
      
      // Analytics
      if (this.analyticsSystem) {
        this.analyticsSystem.track(won ? 'game_won' : 'game_lost', {
          score: this.scoreSystem.score,
          time: Date.now()
        });
      }
    },
    
    /**
     * Restart game
     */
    restartGame: function() {
      // Cleanup
      this.layers.gameplay.removeChildren();
      this.layers.ui.removeChildren();
      
      // Release all pooled objects
      this.poolManager.releaseAll();
      
      // Restart
      this.startGame();
    },
    
    /**
     * Loading screen
     */
    showLoadingScreen: function() {
      const container = this.canvas.parentElement;
      
      const loading = document.createElement('div');
      loading.className = 'game-loading';
      loading.innerHTML = `
        <div style="text-align: center;">
          <h2>🐷 Loading Pig Rider...</h2>
          <div style="width: 200px; height: 20px; background: #ccc; border-radius: 10px; margin: 20px auto; overflow: hidden;">
            <div id="load-progress" style="width: 0%; height: 100%; background: #FF6B35; transition: width 0.3s;"></div>
          </div>
        </div>
      `;
      
      container.appendChild(loading);
    },
    
    hideLoadingScreen: function() {
      const loading = document.querySelector('.game-loading');
      if (loading) {
        loading.classList.add('hidden');
        setTimeout(() => loading.remove(), 300);
      }
    },
    
    updateLoadProgress: function(percent) {
      const bar = document.getElementById('load-progress');
      if (bar) {
        bar.style.width = percent + '%';
      }
    },
    
    showError: function(message) {
      const container = this.canvas.parentElement;
      container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <h2>❌ Error</h2>
          <p>${message}</p>
          <button onclick="location.reload()">Reload</button>
        </div>
      `;
    },
    
    showFPS: function(fps) {
      // Debug FPS counter
      if (!this.fpsText) {
        this.fpsText = new PIXI.Text('', { fill: 0xFFFFFF, fontSize: 20 });
        this.fpsText.x = 10;
        this.fpsText.y = 10;
        this.layers.ui.addChild(this.fpsText);
      }
      this.fpsText.text = `FPS: ${Math.round(fps)}`;
    },
    
    /**
     * Default config
     */
    getDefaultConfig: function() {
      return {
        cdnUrl: 'https://cdn.yoursite.com/pig-rider',
        width: 800,
        height: 600,
        targetScore: 500,
        difficulty: 1.0,
        enableSound: true,
        enableAnalytics: false,
        showFPS: false,
        particlesEnabled: true
      };
    }
  };
  
  // Экспорт в глобальную область
  window.PigRiderGame = Game;
  
  // Auto-init если DOM уже загружен
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Не auto-init, ждём вызова из Custom Code
    });
  }
})();

// ===========================================
// ИГРОВЫЕ КЛАССЫ (из промпта)
// ===========================================

class Player {
  // Implementation from GAME_DEV_PROMPT.md
}

class PoolManager {
  // Implementation from GAME_DEV_PROMPT.md
}

class InputSystem {
  // Implementation from GAME_DEV_PROMPT.md
}

class CollisionSystem {
  // Implementation from GAME_DEV_PROMPT.md
}

class SpawnSystem {
  // Implementation from GAME_DEV_PROMPT.md
}

class ScoreSystem {
  // Implementation from GAME_DEV_PROMPT.md
}

class AudioSystem {
  // Implementation from GAME_DEV_PROMPT.md
}

class AnalyticsSystem {
  constructor(analyticsId) {
    this.analyticsId = analyticsId;
  }
  
  track(event, data = {}) {
    // Google Analytics
    if (window.gtag) {
      gtag('event', event, {
        'event_category': 'Game',
        ...data
      });
    }
    
    // Custom analytics
    console.log('📊 Analytics:', event, data);
  }
}

class StartScreen extends PIXI.Container {
  // Implementation from GAME_DEV_PROMPT.md
}

class EndScreen extends PIXI.Container {
  // Implementation from GAME_DEV_PROMPT.md
}

class HUD extends PIXI.Container {
  // Implementation from GAME_DEV_PROMPT.md
}
```

---

## 📦 Шаг 5: Минификация и деплой на CDN

### A. Минификация game.js

```bash
# Установи terser
npm install -g terser

# Минифицируй
terser game.js \
  --compress \
  --mangle \
  --output game.min.js \
  --source-map "url='game.min.js.map'"

# Результат: game.min.js (~50-70KB)
```

### B. Деплой на CDN (Рекомендую Cloudflare R2)

**Вариант 1: Cloudflare R2 (Рекомендую)**

```bash
# 1. Создай R2 bucket на cloudflare.com
# 2. Установи Wrangler CLI
npm install -g wrangler

# 3. Login
wrangler login

# 4. Upload files
wrangler r2 object put pig-rider/game.min.js --file game.min.js
wrangler r2 object put pig-rider/libs/pixi.min.js --file pixi.min.js
wrangler r2 object put pig-rider/assets/sprites/atlas.png --file atlas.png

# 5. Enable public access
# Dashboard → R2 → твой bucket → Settings → Public Access
```

**Вариант 2: GitHub + jsDelivr (Бесплатно)**

```bash
# 1. Создай public GitHub repo: pig-rider-assets
# 2. Структура:
pig-rider-assets/
├── game.min.js
├── libs/
│   ├── pixi.min.js
│   └── gsap.min.js
└── assets/
    ├── sprites/
    └── sounds/

# 3. Commit & push
git add .
git commit -m "Deploy game assets"
git push origin main

# 4. URL через jsDelivr:
https://cdn.jsdelivr.net/gh/username/pig-rider-assets@main/game.min.js
https://cdn.jsdelivr.net/gh/username/pig-rider-assets@main/libs/pixi.min.js
```

**Вариант 3: Vercel (с custom domain)**

```bash
# 1. Создай проект со статикой
mkdir pig-rider-cdn
cd pig-rider-cdn

# 2. Структура:
public/
├── game.min.js
├── libs/
└── assets/

# 3. Deploy
npx vercel --prod

# 4. Custom domain (по желанию)
# Dashboard → Settings → Domains → Add: cdn.yoursite.com
```

---

## 🎛️ Шаг 6: Конфигурация игры (config.js)

Создай отдельный `config.js` для гибкой настройки:

```javascript
/**
 * Pig Rider Game Configuration
 * Можно менять без пересборки game.js
 */
window.PIG_RIDER_CONFIG = {
  // CDN настройки
  cdnUrl: 'https://cdn.yoursite.com/pig-rider',
  
  // Игровая механика
  gameplay: {
    targetScore: 500,           // Очков для победы
    difficulty: 1.0,            // Базовая сложность (0.5 - 2.0)
    difficultyIncrease: 0.0001, // Увеличение сложности
    
    player: {
      baseSpeed: 300,           // Базовая скорость
      boostSpeed: 450,          // Скорость с бустером
      boostDuration: 5,         // Длительность буста (сек)
      laneTransitionSpeed: 500
    },
    
    spawn: {
      minGap: 300,              // Минимальный gap между препятствиями
      maxGap: 600,              // Максимальный gap
      obstacleChance: 0.6,      // Шанс препятствия
      collectibleChance: 0.7,   // Шанс яйца
      powerupChance: 0.1        // Шанс бустера
    },
    
    scoring: {
      eggValue: 1,              // Очки за яйцо
      powerupValue: 5,          // Очки за бустер
      distanceMultiplier: 0.1   // Очки за дистанцию
    }
  },
  
  // Визуальные настройки
  visual: {
    width: 800,
    height: 600,
    backgroundColor: 0xFFE4C4,
    particlesEnabled: true,
    showFPS: false              // Debug mode
  },
  
  // Аудио
  audio: {
    enabled: true,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    muted: false
  },
  
  // Аналитика
  analytics: {
    enabled: true,
    provider: 'gtag',           // 'gtag', 'mixpanel', 'custom'
    trackingId: 'UA-XXXXX-Y',
    
    events: {
      gameStart: true,
      gameComplete: true,
      collectItem: false,        // Не трекать каждое яйцо
      powerupUsed: true
    }
  },
  
  // A/B тестирование (если нужно)
  experiments: {
    variant: 'default',         // 'easy', 'hard', 'custom'
    
    variants: {
      easy: {
        targetScore: 300,
        difficultyIncrease: 0.00005
      },
      hard: {
        targetScore: 1000,
        difficultyIncrease: 0.0002
      }
    }
  },
  
  // Локализация (если мультиязычность)
  locale: 'en',                 // 'en', 'ru', 'es'
  
  // Feature flags
  features: {
    leaderboard: false,         // Пока не реализовано
    achievements: false,
    dailyChallenge: false,
    multiplayer: false
  }
};
```

---

## 🚀 Шаг 7: Финальная интеграция в Webflow

### Вариант A: На отдельной странице `/pig-rider`

1. **Designer**: Создай страницу `/pig-rider`
2. **Добавь Section** с классом `game-section`
3. **Внутри Section** добавь Div → класс `game-container`
4. **Внутри Div** добавь HTML Embed:

```html
<canvas id="pig-rider-canvas" data-game="pig-rider"></canvas>
```

5. **Page Settings → Custom Code** → добавь код из Шага 3

### Вариант B: На существующей странице (как часть контента)

1. **Designer**: Открой любую страницу (например, `/features`)
2. **В нужном месте** добавь Section
3. **Repeat steps 3-5** из Варианта A

Теперь игра может быть на **любой странице**!

### Вариант C: Popup/Modal игра

```html
<!-- Trigger button в Designer -->
<div class="play-game-btn">Play Pig Rider</div>

<!-- Modal (HTML Embed) -->
<div id="game-modal" class="modal" style="display: none;">
  <div class="modal-content">
    <span class="close">&times;</span>
    <canvas id="pig-rider-canvas" data-game="pig-rider"></canvas>
  </div>
</div>

<!-- Custom Code -->
<script>
document.querySelector('.play-game-btn').addEventListener('click', function() {
  document.getElementById('game-modal').style.display = 'block';
  
  // Init game when modal opens
  if (window.PigRiderGame && !window.PigRiderGame.app) {
    window.PigRiderGame.init();
  }
});

document.querySelector('.close').addEventListener('click', function() {
  document.getElementById('game-modal').style.display = 'none';
});
</script>
```

---

## 📊 Шаг 8: Performance monitoring

Добавь в `config.js` или inline в Custom Code:

```javascript
// Performance monitoring
if (window.PIG_RIDER_CONFIG.visual.showFPS) {
  const stats = {
    fps: 0,
    loadTime: 0,
    memoryUsed: 0
  };
  
  // Measure load time
  window.addEventListener('load', () => {
    stats.loadTime = performance.now();
    console.log(`⚡ Game loaded in ${stats.loadTime}ms`);
    
    // Send to analytics
    if (window.gtag) {
      gtag('event', 'timing_complete', {
        name: 'load',
        value: Math.round(stats.loadTime),
        event_category: 'Game Performance'
      });
    }
  });
  
  // Monitor memory (Chrome only)
  if (performance.memory) {
    setInterval(() => {
      stats.memoryUsed = Math.round(performance.memory.usedJSHeapSize / 1048576);
      console.log(`💾 Memory: ${stats.memoryUsed}MB`);
    }, 10000);
  }
}
```

---

## ✅ Checklist перед публикацией

### В Webflow Designer:
- [ ] Canvas element добавлен на страницу
- [ ] Класс `.game-container` стилизован
- [ ] Responsive breakpoints настроены

### В Page Settings → Custom Code:
- [ ] Preload директивы для критичных файлов
- [ ] Загрузка PixiJS, GSAP
- [ ] Загрузка game.min.js
- [ ] Inline config (PIG_RIDER_CONFIG)
- [ ] Init script в конце

### На CDN:
- [ ] game.min.js загружен и доступен
- [ ] Все библиотеки (pixi, gsap) загружены
- [ ] Assets (sprites, sounds) загружены
- [ ] CORS headers настроены (если нужно)
- [ ] Gzip compression включен

### Testing:
- [ ] Desktop Chrome/Firefox/Safari
- [ ] Mobile iOS Safari
- [ ] Mobile Android Chrome
- [ ] 60 FPS на всех устройствах
- [ ] Touch controls работают
- [ ] Звуки воспроизводятся (после user interaction)
- [ ] Analytics events отправляются

---

## 🎛️ Как обновлять игру (Zero downtime)

```bash
# 1. Внеси изменения в game.js локально
# 2. Тестируй локально
# 3. Минифицируй
terser game.js -o game.min.js --compress --mangle

# 4. Версионирование (опционально)
cp game.min.js game.v2.min.js

# 5. Загрузи на CDN
wrangler r2 object put pig-rider/game.min.js --file game.min.js

# 6. Если версионирование - обнови URL в Webflow Custom Code
# Иначе - пользователи получат обновление при следующей загрузке (cache)

# 7. Invalidate CDN cache (Cloudflare)
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://cdn.yoursite.com/pig-rider/game.min.js"]}'
```

---

## 💰 Примерная стоимость решения

```
CDN Hosting (Cloudflare R2):
- Storage: 10GB free
- Bandwidth: $0.36/GB после free tier
- Для игры ~2-3MB assets = ~$0-5/месяц при среднем трафике

Webflow Plan:
- Уже есть у вас (Core/CMS/Business)
- $0 дополнительно

Total: ~$0-5/месяц
```

---

## 🎯 Итого: Что получаем

✅ **Максимальная гибкость**: Игру можно вставить КУДА УГОДНО на сайте
✅ **Чистый Webflow**: Минимум кода в Designer
✅ **Легко обновлять**: Просто меняешь файл на CDN
✅ **Производительность**: PixiJS 60 FPS
✅ **Конфигурируемость**: config.js для быстрых изменений
✅ **Analytics**: Tracking всех событий
✅ **Mobile-ready**: Touch controls из коробки

---

Вопросы по реализации? Поехали дальше! 🚀
