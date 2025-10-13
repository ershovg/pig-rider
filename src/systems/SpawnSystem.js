/**
 * Система спавна объектов (оркестратор spawner'ов)
 */
import { EntityPoolManager } from './pools/EntityPoolManager.js';
import { ObstacleSpawner } from './spawners/ObstacleSpawner.js';
import { CoinSpawner } from './spawners/CoinSpawner.js';
import { CloudSpawner } from './spawners/CloudSpawner.js';
import { StarSpawner } from './spawners/StarSpawner.js';
import { BoosterSpawner } from './spawners/BoosterSpawner.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Coin } from '../entities/Coin.js';
import { Cloud } from '../entities/Cloud.js';
import { Star } from '../entities/Star.js';
import { Booster } from '../entities/Booster.js';
import { CONFIG } from '../config/constants.js';

export class SpawnSystem {
  constructor(obstacleTextures, coinTexture, starTexture, cloudTexture, boosterSpritesheet, stage) {
    this.stage = stage;
    this.textures = {
      obstacles: obstacleTextures,
      coin: coinTexture,
      star: starTexture,
      cloud: cloudTexture,
      boosterSpritesheet: boosterSpritesheet // 🆕 Теперь это спрайтшит, не просто текстура
    };
    this.poolManager = new EntityPoolManager(stage);
    this.initializePools();
    this.initializeSpawners();
  }

  initializePools() {
    this.poolManager.registerPool('obstacle', Obstacle, 20, {
      texture: this.textures.obstacles[Math.floor(Math.random() * this.textures.obstacles.length)]
    });
    this.poolManager.registerPool('coin', Coin, 50, { texture: this.textures.coin });
    this.poolManager.registerPool('star', Star, 30, { texture: this.textures.star });
    this.poolManager.registerPool('cloud', Cloud, 15, { texture: this.textures.cloud });
    // 🆕 Передаем спрайтшит в конструктор Booster
    this.poolManager.registerPool('booster', Booster, CONFIG.BOOSTER.POOL_SIZE, { texture: this.textures.boosterSpritesheet });
  }

  initializeSpawners() {
    this.obstacleSpawner = new ObstacleSpawner({
      pool: this.poolManager.getPool('obstacle'),
      stage: this.stage,
      textures: this.textures.obstacles, // 🆕 Передаём массив текстур
      getIntervalModifier: (context) => {
        const { difficultyManager } = context;
        if (!difficultyManager) return 1.0;
        const baseInterval = CONFIG.OBSTACLE.MIN_DISTANCE;
        const currentInterval = difficultyManager.getObstacleSpawnInterval();
        return currentInterval / baseInterval;
      }
    });

    this.coinSpawner = new CoinSpawner({
      pool: this.poolManager.getPool('coin'),
      stage: this.stage,
      getIntervalModifier: (context) => 1.0
    });

    this.cloudSpawner = new CloudSpawner({
      pool: this.poolManager.getPool('cloud'),
      stage: this.stage
    });

    this.starSpawner = new StarSpawner({
      pool: this.poolManager.getPool('star'),
      stage: this.stage
    });

    this.boosterSpawner = new BoosterSpawner({
      pool: this.poolManager.getPool('booster'),
      stage: this.stage
    });
  }

  update(deltaTime, gameSpeed, context = {}) {
    const {
      isBoosterMode = false,
      boosterActiveLane = 0,
      isBoosterActive = false,
      boosterCooldown = 0,
      difficultyManager = null
    } = context;

    if (!isBoosterMode) {
      this.obstacleSpawner.update(deltaTime, gameSpeed, { difficultyManager });
    }

    this.coinSpawner.update(deltaTime, gameSpeed, {
      isBoosterMode,
      boosterActiveLane,
      gameSpeed,
      difficultyManager
    });

    this.cloudSpawner.update(deltaTime, gameSpeed);
    this.starSpawner.update(deltaTime, gameSpeed);
    this.boosterSpawner.update(deltaTime, gameSpeed, {
      isBoosterActive,
      boosterCooldown
    });
  }

  fillLaneWithCoins(lane) {
    this.coinSpawner.fillLaneWithCoins(lane);
  }

  clearAllObstacles() {
    this.obstacleSpawner.clearAll();
  }

  getActiveObstacles() {
    return this.obstacleSpawner.getActiveObjects();
  }

  getActiveCoins() {
    return this.coinSpawner.getActiveObjects();
  }

  getActiveBoosters() {
    return this.boosterSpawner.getActiveObjects();
  }

  // 🆕 Методы для culling декораций
  getActiveClouds() {
    return this.cloudSpawner.getActiveObjects();
  }

  getActiveStars() {
    return this.starSpawner.getActiveObjects();
  }

  reset() {
    this.obstacleSpawner.reset();
    this.coinSpawner.reset();
    this.cloudSpawner.reset();
    this.starSpawner.reset();
    this.boosterSpawner.reset();
  }

  getStats() {
    return this.poolManager.getAllStats();
  }

  logStats() {
    this.poolManager.logStats();
  }
}
