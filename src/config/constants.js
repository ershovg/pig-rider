// Game Configuration Constants
export const CONFIG = {
  // Canvas
  CANVAS_WIDTH: 1920,
  CANVAS_HEIGHT: 1080,

  // Game
  TARGET_EGGS: 500,
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
    SIZE: 120,
    POOL_SIZE: 20
  },

  // Coins
  COIN: {
    MIN_DISTANCE: 400,
    MAX_DISTANCE: 800,
    SIZE: 60,
    POOL_SIZE: 30,
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

export const ASSET_PATHS = {
  PLAYER: '/assets/sprites/pig.svg',
  OBSTACLE: '/assets/sprites/barrier.svg',
  COIN: '/assets/sprites/coin.svg',
  // Audio placeholders for later
  MUSIC_BG: '/assets/audio/bg-music.mp3',
  SFX_COIN: '/assets/audio/coin.mp3',
  SFX_CRASH: '/assets/audio/crash.mp3'
};
