// Game Configuration Constants
export const CONFIG = {
  // Canvas
  CANVAS_WIDTH: 1920,
  CANVAS_HEIGHT: 1080,

  // Game - Configurable variables
  TARGET_COINS: 200,        // Целевое количество монет для победы

  // Booster settings
  BOOSTER_DURATION: 6,                // Длительность бустера в секундах (3 переключения × 2 сек)
  BOOSTER_LANE_SWITCH_INTERVAL: 2,    // Интервал смены линии во время бустера (секунды)
  BOOSTER_COIN_SPAWN_INTERVAL: 0.08,  // Очень частый спавн монет во время бустера (секунды)
  BOOSTER_COOLDOWN_DURATION: 5,       // Cooldown после окончания бустера перед новым спавном (секунды)

  // Speed Progression System (Hybrid: Gradual + Fixed Booster)
  GAME_SPEED: 1.0,              // Начальная скорость
  MAX_SPEED: 2.5,               // Максимальная скорость (достигается постепенно + во время бустера)
  SPEED_INCREMENT: 0.0005,      // Постепенный прирост скорости каждый фрейм (60 FPS)

  // Lanes
  LANES: {
    TOP: 0,
    MIDDLE: 1,
    BOTTOM: 2,
    Y_POSITIONS: [270, 540, 810], // Y coordinates for 3 lanes
    TOTAL: 3
  },

  // Player
  PLAYER: {
    START_X: 300,
    SWITCH_DURATION: 0.15, // GSAP animation duration in seconds (deprecated, используется physics)
    SIZE: 260,  // 130×2 для @2x качества на Retina (было 150)

    PHYSICS: {
      MAX_SPEED: 3000,       // Максимальная скорость движения между полосами (px/s)
      ACCELERATION: 12000,   // Ускорение при движении (px/s²)
      FRICTION: 0.85,        // Коэффициент торможения при приближении к цели (0-1)
      BRAKE_DISTANCE: 50     // Дистанция начала торможения (px)
    }
  },

  // Obstacles
  OBSTACLE: {
    MIN_DISTANCE: 1000,    // 🔴 Increased from 800 to reduce spawn frequency
    MAX_DISTANCE: 1600,    // 🔴 Increased from 1400 for better spacing
    SIZE: 280, // Ширина барьера в пикселях (высота масштабируется пропорционально)
    POOL_SIZE: 30          // 🔴 Increased from 20 to prevent pool exhaustion
  },

  // Coins
  COIN: {
    MIN_DISTANCE: 400,
    MAX_DISTANCE: 800,
    SIZE: 60,
    POOL_SIZE: 80, // Увеличен для поддержки множества монет во время бустера
    VALUE: 1
  },

  // Booster (cup with animated wings)
  BOOSTER: {
    SIZE: 180, // Размер кубка в пикселях (можно менять: 50, 65, 70, 80, 90, 100, 150...)
    POOL_SIZE: 5
  },

  // Collision
  COLLISION: {
    GRID_CELL_SIZE: 200,
    PLAYER_HITBOX_SCALE: 0.7,
    OBSTACLE_HITBOX_SCALE: 0.8,
    COIN_HITBOX_SCALE: 0.6
  },

  // Performance
  FIXED_TIMESTEP: 1000 / 60, // 60 FPS physics updates (можно увеличить до 120 для еще большей плавности)
  CULLING: {
    LEFT_MULTIPLIER: 0.08,     // Левая граница: 8% ширины канваса за левым краем (оптимально для маленьких окон)
    RIGHT_MULTIPLIER: 1.15,    // Правая граница: 115% ширины канваса (15% за правым)
    TIME_BUDGET_MS: 1,         // Максимальное время на culling операцию (мс)
    DECORATION_INTERVAL: 5,    // Culling декораций каждые N frames
    THRESHOLD: -200            // Оставляем -200 для лучшего визуального качества (объекты полностью уходят за экран)
  },

  INTERPOLATION: {
    ENABLED: true  // Можно отключить для дебага (увидеть "чистые" physics позиции)
  }
};

// Base URL для ассетов (переопределяется через window.GAME_ASSETS_URL)
const getAssetPath = (path) => {
  const baseUrl = typeof window !== 'undefined' && window.GAME_ASSETS_URL
    ? window.GAME_ASSETS_URL
    : '';
  return baseUrl + path;
};

export const ASSET_PATHS = {
  // AVIF спрайты
  // Player: используем только анимированные спрайтшиты (JSON + AVIF)
  get PLAYER_ANIMATED() { return getAssetPath('/assets/sprites/hryusha-flying.json'); }, // Sprite sheet анимация свиньи (обычная)
  get PLAYER_ANIMATED_BOOST() { return getAssetPath('/assets/sprites/hryusha-boost.json'); }, // Sprite sheet анимация свиньи (бустер)
  get OBSTACLE_BASE() { return getAssetPath('/assets/sprites/barier_base.avif'); },
  get OBSTACLE_LARGE() { return getAssetPath('/assets/sprites/barier_large.avif'); },
  get COIN() { return getAssetPath('/assets/sprites/coin.avif'); },
  get COIN_COLLECT_EFFECT() { return getAssetPath('/assets/sprites/coin-collect.json'); }, // Анимация сбора монеты (4 кадра)
  get COLLISION_EFFECT() { return getAssetPath('/assets/sprites/boom.json'); }, // Эффект взрыва при столкновении (6 кадров)
  get BOOSTER() { return getAssetPath('/assets/sprites/cup.json'); }, // Анимированный спрайтшит кубка с крыльями
  get STAR() { return getAssetPath('/assets/sprites/star.avif'); },
  get CLOUD() { return getAssetPath('/assets/sprites/cloud.avif'); },

  // Audio - Оптимизированные OGG форматы
  get MUSIC_MAIN() { return getAssetPath('/assets/sounds/Music level/Just Funky.ogg'); },
  get MUSIC_BONUS() { return getAssetPath('/assets/sounds/Music Bonus/MusicBonus.ogg'); },

  // Sound Effects
  get SFX_COIN() { return getAssetPath('/assets/sounds/Sounds/CoinCollect/Coin.ogg'); },
  get SFX_BOOSTER_COLLECT() { return getAssetPath('/assets/sounds/Sounds/CupCollect/Bonus 2.ogg'); },
  get SFX_COLLISION() { return getAssetPath('/assets/sounds/Sounds/WallCollision/Bump Jump Echoes.ogg'); },
  get SFX_WIN() { return getAssetPath('/assets/sounds/Sounds/YouWin/Big Win Fanfare 1.ogg'); },
  get SFX_LOSE() { return getAssetPath('/assets/sounds/Sounds/GameOver/Sorry You Lost.ogg'); }
};
