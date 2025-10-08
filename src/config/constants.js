// Game Configuration Constants
export const CONFIG = {
  // Canvas
  CANVAS_WIDTH: 1920,
  CANVAS_HEIGHT: 1080,

  // Game - Configurable variables (легко менять)
  TARGET_COINS: 200,        // Целевое количество монет для победы

  // Booster settings
  BOOSTER_DURATION: 6,                // Длительность бустера в секундах (3 переключения × 2 сек)
  BOOSTER_LANE_SWITCH_INTERVAL: 2,    // Интервал смены линии во время бустера (секунды)
  BOOSTER_COIN_SPAWN_INTERVAL: 0.08,  // Очень частый спавн монет во время бустера (секунды)
  BOOSTER_COOLDOWN_DURATION: 5,       // Cooldown после окончания бустера перед новым спавном (секунды)

  GAME_SPEED: 1.0,
  MAX_SPEED: 2.5,
  SPEED_INCREMENT: 0.0005,

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
    SWITCH_DURATION: 0.15, // GSAP animation duration in seconds
    SIZE: 150
  },

  // Obstacles
  OBSTACLE: {
    MIN_DISTANCE: 800,
    MAX_DISTANCE: 1400,
    SIZE: 280, // Ширина барьера в пикселях (высота масштабируется пропорционально)
    POOL_SIZE: 20
  },

  // Coins
  COIN: {
    MIN_DISTANCE: 400,
    MAX_DISTANCE: 800,
    SIZE: 60,
    POOL_SIZE: 80, // Увеличен для поддержки множества монет во время бустера
    VALUE: 1
  },

  // Collision
  COLLISION: {
    GRID_CELL_SIZE: 200,
    PLAYER_HITBOX_SCALE: 0.7,
    OBSTACLE_HITBOX_SCALE: 0.8,
    COIN_HITBOX_SCALE: 0.6
  },

  // Performance
  FIXED_TIMESTEP: 1000 / 60, // 60 FPS
  MAX_DELTA: 100
};

// Base URL для ассетов (переопределяется через window.GAME_ASSETS_URL)
const getAssetPath = (path) => {
  const baseUrl = typeof window !== 'undefined' && window.GAME_ASSETS_URL
    ? window.GAME_ASSETS_URL
    : '';
  return baseUrl + path;
};

export const ASSET_PATHS = {
  // PNG спрайты из Figma (@2x)
  get PLAYER() { return getAssetPath('/assets/sprites/pig_rider.png'); },
  get OBSTACLE_BASE() { return getAssetPath('/assets/sprites/barier_base.png'); },
  get OBSTACLE_LARGE() { return getAssetPath('/assets/sprites/barier_large.png'); },
  get COIN() { return getAssetPath('/assets/sprites/coin.png'); },
  get COIN_STAR() { return getAssetPath('/assets/sprites/coin_star.png'); },
  get BOOSTER() { return getAssetPath('/assets/sprites/booster.png'); },
  get STAR() { return getAssetPath('/assets/sprites/star.png'); },
  get CLOUD() { return getAssetPath('/assets/sprites/cloud.png'); },

  // Audio placeholders for later
  get MUSIC_BG() { return getAssetPath('/assets/audio/bg-music.mp3'); },
  get SFX_COIN() { return getAssetPath('/assets/audio/coin.mp3'); },
  get SFX_CRASH() { return getAssetPath('/assets/audio/crash.mp3'); }
};
