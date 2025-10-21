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
import { CoinCollectEffect } from '../effects/CoinCollectEffect.js';
import { CollisionEffect } from '../effects/CollisionEffect.js';
import { CONFIG } from '../config/constants.js';

export class SpawnSystem {
  constructor(obstacleTextures, coinTexture, starTexture, cloudTexture, boosterSpritesheet, coinCollectEffectSpritesheet, collisionEffectSpritesheet, stage, decorationLayer = null) {
    this.stage = stage;
    this.decorationLayer = decorationLayer; // 🆕 ParticleContainer для облаков/звёзд
    this.textures = {
      obstacles: obstacleTextures,
      coin: coinTexture,
      star: starTexture,
      cloud: cloudTexture,
      boosterSpritesheet: boosterSpritesheet, // Спрайтшит анимированного кубка
      coinCollectEffectSpritesheet: coinCollectEffectSpritesheet, // Спрайтшит эффекта сбора монеты
      collisionEffectSpritesheet: collisionEffectSpritesheet // 🆕 Спрайтшит эффекта взрыва при столкновении
    };
    this.poolManager = new EntityPoolManager(stage, decorationLayer);
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
    // 🆕 Пул эффектов сбора монеты (15 штук для частого использования)
    this.poolManager.registerPool('coinCollectEffect', CoinCollectEffect, 15, { texture: this.textures.coinCollectEffectSpritesheet });
    // 🆕 Пул эффектов столкновения (3 штуки - обычно 1 столкновение за игру)
    this.poolManager.registerPool('collisionEffect', CollisionEffect, 3, { texture: this.textures.collisionEffectSpritesheet });
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

    // 🆕 Декорации добавляются в ParticleContainer (если доступен)
    this.cloudSpawner = new CloudSpawner({
      pool: this.poolManager.getPool('cloud'),
      stage: this.decorationLayer || this.stage // Используем ParticleContainer если есть
    });

    this.starSpawner = new StarSpawner({
      pool: this.poolManager.getPool('star'),
      stage: this.decorationLayer || this.stage // Используем ParticleContainer если есть
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
      difficultyManager = null,
      cullThreshold = CONFIG.CULLING.THRESHOLD // 🆕 Используем из context (приоритет) или fallback на константу
    } = context;

    if (!isBoosterMode) {
      this.obstacleSpawner.update(deltaTime, gameSpeed, { difficultyManager, cullThreshold });
    }

    this.coinSpawner.update(deltaTime, gameSpeed, {
      isBoosterMode,
      boosterActiveLane,
      gameSpeed,
      difficultyManager,
      cullThreshold
    });

    this.cloudSpawner.update(deltaTime, gameSpeed, { cullThreshold });
    this.starSpawner.update(deltaTime, gameSpeed, { cullThreshold });
    this.boosterSpawner.update(deltaTime, gameSpeed, {
      isBoosterActive,
      boosterCooldown,
      cullThreshold
    });

    // Освобождаем завершившиеся эффекты
    this.releaseInactiveEffects();
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

  /**
   * 🆕 Эмитировать эффект сбора монеты в указанной позиции
   * @param {number} x - X координата собранной монеты
   * @param {number} y - Y координата собранной монеты
   */
  emitCoinCollectEffect(x, y) {
    const effect = this.poolManager.acquire('coinCollectEffect');
    if (effect) {
      effect.activate(x, y);
    }
  }

  /**
   * 🆕 Эмитировать эффект взрыва при столкновении с препятствием
   * @param {number} x - X координата столкновения
   * @param {number} y - Y координата столкновения
   */
  emitCollisionEffect(x, y) {
    const effect = this.poolManager.acquire('collisionEffect');
    if (effect) {
      effect.activate(x, y);
    }
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

  releaseInactiveEffects() {
    const coinEffectPool = this.poolManager.getPool('coinCollectEffect');
    const activeCoinEffects = coinEffectPool.getActive();
    for (let i = activeCoinEffects.length - 1; i >= 0; i--) {
      const eff = activeCoinEffects[i];
      if (!eff.isActive || !eff.isActive()) {
        coinEffectPool.release(eff);
      }
    }

    if (this.poolManager.hasPool('collisionEffect')) {
      const collisionPool = this.poolManager.getPool('collisionEffect');
      const activeCollision = collisionPool.getActive();
      for (let i = activeCollision.length - 1; i >= 0; i--) {
        const eff = activeCollision[i];
        if (eff.isActive && !eff.isActive()) {
          collisionPool.release(eff);
        }
      }
    }
  }
}
