/**
 * Система спавна объектов (оркестратор spawner'ов)
 */
import { EntityPoolManager } from './pools/EntityPoolManager.js';
import { SpawnCoordinationService } from './services/SpawnCoordinationService.js';
import { ObstacleSpawner } from '../obstacles/spawner/ObstacleSpawner.js';
import { CoinSpawner } from '../coins/spawner/CoinSpawner.js';
import { CloudSpawner } from '../decoration/spawners/CloudSpawner.js';
import { StarSpawner } from '../decoration/spawners/StarSpawner.js';
import { BoosterSpawner } from '../booster/spawner/BoosterSpawner.js';
import { Obstacle } from '../obstacles/entities/Obstacle.js';
import { Coin } from '../coins/entities/Coin.js';
import { Cloud } from '../decoration/entities/Cloud.js';
import { Star } from '../decoration/entities/Star.js';
import { Booster } from '../booster/entities/Booster.ts';
import { CoinCollectEffect } from '../coins/effects/CoinCollectEffect.js';
import { CollisionEffect } from '../collision/effects/CollisionEffect.js';
import { CONFIG } from '../../shared/config/constants.ts';

export class SpawnSystem {
  constructor(assetLoader, stage, decorationLayer = null) {
    this.stage = stage;
    this.decorationLayer = decorationLayer;

    this.textures = {
      obstacles: [
        assetLoader.getAsset('obstacleBase'),
        assetLoader.getAsset('obstacleLarge')
      ],
      coinSpritesheet: assetLoader.getAsset('coin'),
      star: assetLoader.getAsset('star'),
      cloud: assetLoader.getAsset('cloud'),
      boosterSpritesheet: assetLoader.getAsset('booster'),
      coinCollectEffectSpritesheet: assetLoader.getAsset('coinCollectEffect'),
      collisionEffectSpritesheet: assetLoader.getAsset('collisionEffect')
    };

    this.poolManager = new EntityPoolManager(stage, decorationLayer);
    this.initializePools();
    this.coordinationService = new SpawnCoordinationService(this.poolManager.getPool('obstacle'));
    this.initializeSpawners();
  }

  initializePools() {
    this.poolManager.registerPool('obstacle', Obstacle, CONFIG.OBSTACLE.POOL_SIZE, {
      texture: this.textures.obstacles[Math.floor(Math.random() * this.textures.obstacles.length)]
    });
    this.poolManager.registerPool('coin', Coin, 50, { texture: this.textures.coinSpritesheet });
    this.poolManager.registerPool('star', Star, 30, { texture: this.textures.star });
    this.poolManager.registerPool('cloud', Cloud, 15, { texture: this.textures.cloud });
    this.poolManager.registerPool('booster', Booster, CONFIG.BOOSTER.POOL_SIZE, { texture: this.textures.boosterSpritesheet });
    this.poolManager.registerPool('coinCollectEffect', CoinCollectEffect, 15, { texture: this.textures.coinCollectEffectSpritesheet });
    this.poolManager.registerPool('collisionEffect', CollisionEffect, 3, { texture: this.textures.collisionEffectSpritesheet });
  }

  initializeSpawners() {
    // Передаем coin pool в coordination service для проверки монет при спавне препятствий
    this.coordinationService.setCoinPool(this.poolManager.getPool('coin'));

    this.obstacleSpawner = new ObstacleSpawner({
      pool: this.poolManager.getPool('obstacle'),
      stage: this.stage,
      textures: this.textures.obstacles,
      coordinationService: this.coordinationService, // Передаем сервис в ObstacleSpawner
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
      getIntervalModifier: (context) => 1.0,
      coordinationService: this.coordinationService
    });

    this.cloudSpawner = new CloudSpawner({
      pool: this.poolManager.getPool('cloud'),
      stage: this.decorationLayer || this.stage
    });

    this.starSpawner = new StarSpawner({
      pool: this.poolManager.getPool('star'),
      stage: this.decorationLayer || this.stage
    });

    this.boosterSpawner = new BoosterSpawner({
      pool: this.poolManager.getPool('booster'),
      stage: this.stage,
      coordinationService: this.coordinationService
    });
  }

  update(deltaTime, gameSpeed, context = {}) {
    const {
      isBoosterMode = false,
      boosterActiveLane = 0,
      isBoosterActive = false,
      boosterCooldown = 0,
      difficultyManager = null,
      cullThreshold = CONFIG.CULLING.THRESHOLD,
      frameDeltaTime = null
    } = context;

    const spawnerContext = {
      difficultyManager,
      cullThreshold,
      frameDeltaTime: frameDeltaTime || deltaTime
    };

    if (!isBoosterMode) {
      this.obstacleSpawner.update(deltaTime, gameSpeed, spawnerContext);
    }

    this.coinSpawner.update(deltaTime, gameSpeed, {
      ...spawnerContext,
      isBoosterMode,
      boosterActiveLane,
      gameSpeed
    });

    this.cloudSpawner.update(deltaTime, gameSpeed, spawnerContext);
    this.starSpawner.update(deltaTime, gameSpeed, spawnerContext);
    this.boosterSpawner.update(deltaTime, gameSpeed, {
      ...spawnerContext,
      isBoosterActive,
      boosterCooldown
    });

    // Освобождаем завершившиеся эффекты
    this.releaseInactiveEffects();
  }

  fillLaneWithCoins(lane) {
    this.coinSpawner.fillLaneWithCoins(lane);
  }

  clearBoosterCoins() {
    this.coinSpawner.clearBoosterCoins();
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

  getActiveClouds() {
    return this.cloudSpawner.getActiveObjects();
  }

  getActiveStars() {
    return this.starSpawner.getActiveObjects();
  }

  /**
   * Эмитировать эффект сбора монеты в указанной позиции
   */
  emitCoinCollectEffect(x, y) {
    const effect = this.poolManager.acquire('coinCollectEffect');
    if (effect) {
      effect.activate(x, y);
    }
  }

  /**
   * Эмитировать эффект взрыва при столкновении с препятствием
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

  /**
   * Принудительно очищает все активные эффекты (coin collect, collision)
   * Используется при рестарте игры для полной очистки экрана
   */
  clearAllEffects() {
    console.log('🧹 SpawnSystem: Clearing all effects...');

    // Очистка coinCollectEffect (искорки при сборе монет)
    if (this.poolManager.hasPool('coinCollectEffect')) {
      const coinEffectPool = this.poolManager.getPool('coinCollectEffect');
      const activeCoinEffects = coinEffectPool.getActive();

      console.log(`  - Deactivating ${activeCoinEffects.length} coin collect effects`);

      for (let i = activeCoinEffects.length - 1; i >= 0; i--) {
        const effect = activeCoinEffects[i];
        if (effect && effect.deactivate) {
          effect.deactivate(); // Принудительно деактивируем
        }
        coinEffectPool.release(effect); // Возвращаем в пул
      }
    }

    // Очистка collisionEffect (взрывы при столкновении)
    if (this.poolManager.hasPool('collisionEffect')) {
      const collisionPool = this.poolManager.getPool('collisionEffect');
      const activeCollisionEffects = collisionPool.getActive();

      console.log(`  - Deactivating ${activeCollisionEffects.length} collision effects`);

      for (let i = activeCollisionEffects.length - 1; i >= 0; i--) {
        const effect = activeCollisionEffects[i];
        if (effect && effect.deactivate) {
          effect.deactivate(); // Принудительно деактивируем
        }
        collisionPool.release(effect); // Возвращаем в пул
      }
    }

    console.log('  ✅ All effects cleared');
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
