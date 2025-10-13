/**
 * Система спавна объектов (оркестратор spawner'ов)
 */
import { EntityPoolManager } from './pools/EntityPoolManager.js';
import { ObstacleSpawner } from './spawners/ObstacleSpawner.js';
import { CoinSpawner } from './spawners/CoinSpawner.js';
import { CloudSpawner } from './spawners/CloudSpawner.js';
import { StarSpawner } from './spawners/StarSpawner.js';
import { BoosterSpawner } from './spawners/BoosterSpawner.js';
import { SparkleSpawner } from './spawners/SparkleSpawner.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Coin } from '../entities/Coin.js';
import { Cloud } from '../entities/Cloud.js';
import { Star } from '../entities/Star.js';
import { Booster } from '../entities/Booster.js';
import { CoinSparkle } from '../entities/CoinSparkle.js';
import { CONFIG } from '../config/constants.js';

export class SpawnSystem {
  constructor(obstacleTextures, coinTexture, starTexture, cloudTexture, boosterTexture, stage) {
    this.stage = stage;
    this.textures = {
      obstacles: obstacleTextures,
      coin: coinTexture,
      star: starTexture,
      cloud: cloudTexture,
      booster: boosterTexture
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
    this.poolManager.registerPool('booster', Booster, 5, { texture: this.textures.booster });
    this.poolManager.registerPool('sparkle', CoinSparkle, 20, { texture: this.textures.coin });
  }

  initializeSpawners() {
    this.obstacleSpawner = new ObstacleSpawner({
      pool: this.poolManager.getPool('obstacle'),
      stage: this.stage,
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

    this.sparkleSpawner = new SparkleSpawner({
      pool: this.poolManager.getPool('sparkle'),
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
    this.sparkleSpawner.update(deltaTime, gameSpeed);
  }

  fillLaneWithCoins(lane) {
    this.coinSpawner.fillLaneWithCoins(lane);
  }

  clearAllObstacles() {
    this.obstacleSpawner.clearAll();
  }

  emitCoinSparkle(x, y) {
    this.sparkleSpawner.emit(x, y);
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

  reset() {
    this.obstacleSpawner.reset();
    this.coinSpawner.reset();
    this.cloudSpawner.reset();
    this.starSpawner.reset();
    this.boosterSpawner.reset();
    this.sparkleSpawner.reset();
  }

  getStats() {
    return this.poolManager.getAllStats();
  }

  logStats() {
    this.poolManager.logStats();
  }
}
