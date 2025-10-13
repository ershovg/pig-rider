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
    SWITCH_DURATION: 0.15, // GSAP animation duration in seconds (deprecated, используется physics)
    SIZE: 260,  // 130×2 для @2x качества на Retina (было 150)

    // 🆕 Physics-based movement parameters
    PHYSICS: {
      MAX_SPEED: 3000,       // Максимальная скорость движения между полосами (px/s)
      ACCELERATION: 12000,   // Ускорение при движении (px/s²)
      FRICTION: 0.85,        // Коэффициент торможения при приближении к цели (0-1)
      BRAKE_DISTANCE: 50     // Дистанция начала торможения (px)
    },

    // 🆕 Collision physics (Matter.js + GSAP hybrid)
    COLLISION_PHYSICS: {
      // Matter.js параметры
      GRAVITY: 0.2,              // Низкая гравитация
      FRICTION: 0.01,            // Низкое трение (скользит)
      FRICTION_AIR: 0.15,        // Воздушное сопротивление (быстрое торможение)
      RESTITUTION: 0.6,          // Упругость игрока (0-1, выше = больше отскок)

      // Timing
      MAX_PHYSICS_DURATION: 1000, // Максимум 1 сек физики (мс)
      RETURN_DURATION: 0.4,      // GSAP возврат на место (сек)
      MIN_VELOCITY_STOP: 0.3,    // Минимальная скорость для остановки

      // Boundaries (стены)
      LEFT_WALL_X: -50,          // X координата левой стены
      WALL_RESTITUTION: 0.8      // Упругость препятствия (выше = сильнее отскок)
    }
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
  FIXED_TIMESTEP: 1000 / 60, // 60 FPS physics updates (можно увеличить до 120 для еще большей плавности)
  MAX_DELTA: 100,

  // 🆕 Culling (удаление объектов за пределами viewport)
  CULLING: {
    THRESHOLD: -200,           // X координата порога (px за левым краем экрана)
    TIME_BUDGET_MS: 1,         // Максимальное время на culling операцию (мс)
    DECORATION_INTERVAL: 5     // Culling декораций каждые N frames
  },

  // 🆕 Interpolation (плавность на 120+ FPS)
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
  // PNG спрайты из Figma (@2x)
  get PLAYER() { return getAssetPath('/assets/sprites/pig_rider.png'); },
  get PLAYER_ANIMATED() { return getAssetPath('/assets/sprites/hryusha-flying.json'); }, // Sprite sheet анимация свиньи (обычная)
  get PLAYER_ANIMATED_BOOST() { return getAssetPath('/assets/sprites/hryusha-boost.json'); }, // Sprite sheet анимация свиньи (бустер)
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
