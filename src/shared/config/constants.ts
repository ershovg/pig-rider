interface GameConfig {
  CANVAS_WIDTH: number;
  CANVAS_HEIGHT: number;
  TARGET_COINS: number;
  BOOSTER_DURATION: number;
  BOOSTER_LANE_SWITCH_INTERVAL: number;
  BOOSTER_COIN_SPAWN_INTERVAL: number;
  BOOSTER_COOLDOWN_DURATION: number;
  GAME_SPEED: number;
  MAX_SPEED: number;
  SPEED_INCREMENT: number;

  LANES: {
    TOP: number;
    MIDDLE: number;
    BOTTOM: number;
    Y_POSITIONS: readonly [number, number, number];
    TOTAL: number;
  };

  PLAYER: {
    START_X: number;
    SWITCH_DURATION: number;
    SIZE: number;
    PHYSICS: {
      MAX_SPEED: number;
      ACCELERATION: number;
      FRICTION: number;
      BRAKE_DISTANCE: number;
    };
  };

  OBSTACLE: {
    MIN_DISTANCE: number;
    MAX_DISTANCE: number;
    SIZE: number;
    POOL_SIZE: number;
  };

  COIN: {
    MIN_DISTANCE: number;
    MAX_DISTANCE: number;
    SIZE: number;
    POOL_SIZE: number;
    VALUE: number;
  };

  BOOSTER: {
    SIZE: number;
    POOL_SIZE: number;
  };

  COLLISION: {
    GRID_CELL_SIZE: number;
    PLAYER_HITBOX_SCALE: number;
    OBSTACLE_HITBOX_SCALE: number;
    COIN_HITBOX_SCALE: number;
  };

  FIXED_TIMESTEP: number;
  MAX_DELTA: number;
  MAX_PHYSICS_UPDATES_PER_FRAME: number;

  CULLING: {
    LEFT_MULTIPLIER: number;
    RIGHT_MULTIPLIER: number;
    TIME_BUDGET_MS: number;
    DECORATION_INTERVAL: number;
    THRESHOLD: number;
  };

  INTERPOLATION: {
    ENABLED: boolean;
  };
}

export const CONFIG: GameConfig = {
  CANVAS_WIDTH: 1920,
  CANVAS_HEIGHT: 1080,
  TARGET_COINS: 200,
  BOOSTER_DURATION: 6,
  BOOSTER_LANE_SWITCH_INTERVAL: 2,
  BOOSTER_COIN_SPAWN_INTERVAL: 0.08,
  BOOSTER_COOLDOWN_DURATION: 5,
  GAME_SPEED: 1.0,
  MAX_SPEED: 2.5,
  SPEED_INCREMENT: 0.0005,

  LANES: {
    TOP: 0,
    MIDDLE: 1,
    BOTTOM: 2,
    Y_POSITIONS: [270, 540, 810],
    TOTAL: 3
  },

  PLAYER: {
    START_X: 300,
    SWITCH_DURATION: 0.15,
    SIZE: 260,
    PHYSICS: {
      MAX_SPEED: 3000,
      ACCELERATION: 12000,
      FRICTION: 0.85,
      BRAKE_DISTANCE: 50
    }
  },

  OBSTACLE: {
    MIN_DISTANCE: 1000,
    MAX_DISTANCE: 1600,
    SIZE: 280,
    POOL_SIZE: 30
  },

  COIN: {
    MIN_DISTANCE: 400,
    MAX_DISTANCE: 800,
    SIZE: 100,
    POOL_SIZE: 80,
    VALUE: 1
  },

  BOOSTER: {
    SIZE: 180,
    POOL_SIZE: 5
  },

  COLLISION: {
    GRID_CELL_SIZE: 200,
    PLAYER_HITBOX_SCALE: 0.7,
    OBSTACLE_HITBOX_SCALE: 0.8,
    COIN_HITBOX_SCALE: 0.6
  },

  FIXED_TIMESTEP: 1000 / 60,
  MAX_DELTA: 250,
  MAX_PHYSICS_UPDATES_PER_FRAME: 4,

  CULLING: {
    LEFT_MULTIPLIER: 0.08,
    RIGHT_MULTIPLIER: 1.15,
    TIME_BUDGET_MS: 1,
    DECORATION_INTERVAL: 5,
    THRESHOLD: -200
  },

  INTERPOLATION: {
    ENABLED: true
  }
};

const getAssetPath = (path: string): string => {
  const baseUrl = typeof window !== 'undefined' && (window as any).GAME_ASSETS_URL
    ? (window as any).GAME_ASSETS_URL
    : '';
  return baseUrl + path;
};

export const ASSET_PATHS = {
  // Animated sprites - JSON файлы для анимации в PixiJS (TexturePacker sequences)
  get PLAYER_ANIMATED() { return getAssetPath('/assets/sprites/hryusha-flying.json'); },
  get PLAYER_ANIMATED_BOOST() { return getAssetPath('/assets/sprites/hryusha-boost.json'); },
  get COIN() { return getAssetPath('/assets/sprites/coin.json'); },
  get COIN_COLLECT_EFFECT() { return getAssetPath('/assets/sprites/coin-collect.json'); },
  get COLLISION_EFFECT() { return getAssetPath('/assets/sprites/boom.json'); },
  get BOOSTER() { return getAssetPath('/assets/sprites/cup.json'); },

  // Static sprites - Изображения без анимации
  get OBSTACLE_BASE() { return getAssetPath('/assets/sprites/barier_base.avif'); },
  get OBSTACLE_LARGE() { return getAssetPath('/assets/sprites/barier_large.avif'); },
  get STAR() { return getAssetPath('/assets/sprites/star.avif'); },
  get CLOUD() { return getAssetPath('/assets/sprites/cloud.avif'); },

  // Music - Оптимизированные OGG форматы
  get MUSIC_MAIN() { return getAssetPath('/assets/sounds/Music level/Just Funky v2.ogg'); },
  get MUSIC_BONUS() { return getAssetPath('/assets/sounds/Music Bonus/MusicBonus.ogg'); },

  // Sound Effects
  get SFX_COIN() { return getAssetPath('/assets/sounds/Sounds/CoinCollect/Coin.ogg'); },
  get SFX_BOOSTER_COLLECT() { return getAssetPath('/assets/sounds/Sounds/CupCollect/Bonus 2.ogg'); },
  get SFX_COLLISION() { return getAssetPath('/assets/sounds/Sounds/WallCollision/Bump Jump Echoes.ogg'); },
  get SFX_WIN() { return getAssetPath('/assets/sounds/Sounds/YouWin/Big Win Fanfare 1.ogg'); },
  get SFX_LOSE() { return getAssetPath('/assets/sounds/Sounds/GameOver/Sorry You Lost.ogg'); }
};
