import type * as PIXI from 'pixi.js';
import { EntityPoolManager } from './pools/EntityPoolManager';
import { SpawnCoordinationService } from './services/SpawnCoordinationService';
import { ObstacleSpawner } from '../obstacles/spawner/ObstacleSpawner';
import { CoinSpawner } from '../coins/spawner/CoinSpawner';
import { CloudSpawner } from '../decoration/spawners/CloudSpawner';
import { StarSpawner } from '../decoration/spawners/StarSpawner';
import { BoosterSpawner } from '../booster/spawner/BoosterSpawner';
import { Obstacle } from '../obstacles/entities/Obstacle';
import { Coin } from '../coins/entities/Coin';
import { Cloud } from '../decoration/entities/Cloud';
import { Star } from '../decoration/entities/Star';
import { Booster } from '../booster/entities/Booster';
import { CoinCollectEffect } from '../coins/effects/CoinCollectEffect';
import { CollisionEffect } from '../collision/effects/CollisionEffect';
import { CONFIG } from '../../shared/config/constants';
import type { AssetLoader } from '../../types/core';
import type {
  SpawnSystemTextures,
  SpawnSystemUpdateContext,
  PoolStats,
  SpawnContext
} from '../../types/spawning';
import type { Lane } from '../../types/common';

/**
 * Система спавна объектов (оркестратор spawner'ов)
 *
 * Паттерн: Facade + Orchestrator
 * Координирует все spawner'ы, пулы и эффекты
 */
export class SpawnSystem {
  private stage: PIXI.Container;
  private decorationLayer: PIXI.Container | null;
  private textures: SpawnSystemTextures;
  private poolManager: EntityPoolManager;
  private coordinationService: SpawnCoordinationService;

  // Spawners
  private obstacleSpawner!: ObstacleSpawner;
  private coinSpawner!: CoinSpawner;
  private cloudSpawner!: CloudSpawner;
  private starSpawner!: StarSpawner;
  private boosterSpawner!: BoosterSpawner;

  constructor(
    assetLoader: AssetLoader,
    stage: PIXI.Container,
    decorationLayer: PIXI.Container | null = null,
    effectsLayer: PIXI.Container | null = null
  ) {
    this.stage = stage;
    this.decorationLayer = decorationLayer;

    this.textures = {
      obstacles: [
        assetLoader.getAsset('obstacleBase') as PIXI.Texture,
        assetLoader.getAsset('obstacleLarge') as PIXI.Texture
      ],
      coinSpritesheet: assetLoader.getAsset('coin') as PIXI.Spritesheet,
      star: assetLoader.getAsset('star') as PIXI.Texture,
      cloud: assetLoader.getAsset('cloud') as PIXI.Texture,
      boosterSpritesheet: assetLoader.getAsset('booster') as PIXI.Spritesheet,
      coinCollectEffectSpritesheet: assetLoader.getAsset('coinCollectEffect') as PIXI.Spritesheet,
      collisionEffectSpritesheet: assetLoader.getAsset('collisionEffect') as PIXI.Spritesheet
    };

    this.poolManager = new EntityPoolManager(stage, decorationLayer, effectsLayer);
    this.initializePools();
    this.coordinationService = new SpawnCoordinationService(this.poolManager.getPool('obstacle'));
    this.initializeSpawners();
  }

  private initializePools(): void {
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

  private initializeSpawners(): void {
    // Передаем coin pool в coordination service для проверки монет при спавне препятствий
    this.coordinationService.setCoinPool(this.poolManager.getPool('coin'));

    this.obstacleSpawner = new ObstacleSpawner({
      pool: this.poolManager.getPool('obstacle'),
      stage: this.stage,
      textures: this.textures.obstacles,
      coordinationService: this.coordinationService,
      getIntervalModifier: (context: SpawnContext) => {
        const { difficultyManager } = context;
        if (!difficultyManager) return 1.0;
        const baseInterval = CONFIG.OBSTACLE.MIN_DISTANCE;
        const currentInterval = difficultyManager.getObstacleSpawnInterval?.() ?? baseInterval;
        return currentInterval / baseInterval;
      }
    });

    this.coinSpawner = new CoinSpawner({
      pool: this.poolManager.getPool('coin'),
      stage: this.stage,
      getIntervalModifier: () => 1.0,
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

  update(deltaTime: number, gameSpeed: number, context: SpawnSystemUpdateContext = {}): void {
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

  fillLaneWithCoins(lane: Lane): void {
    this.coinSpawner.fillLaneWithCoins(lane);
  }

  clearBoosterCoins(): void {
    this.coinSpawner.clearBoosterCoins();
  }

  clearAllObstacles(): void {
    this.obstacleSpawner.clearAll();
  }

  getActiveObstacles(): unknown[] {
    return this.obstacleSpawner.getActiveObjects();
  }

  getActiveCoins(): unknown[] {
    return this.coinSpawner.getActiveObjects();
  }

  getActiveBoosters(): unknown[] {
    return this.boosterSpawner.getActiveObjects();
  }

  getActiveClouds(): unknown[] {
    return this.cloudSpawner.getActiveObjects();
  }

  getActiveStars(): unknown[] {
    return this.starSpawner.getActiveObjects();
  }

  /**
   * Эмитировать эффект сбора монеты в указанной позиции
   */
  emitCoinCollectEffect(x: number, y: number): void {
    const effect = this.poolManager.acquire<CoinCollectEffect>('coinCollectEffect');
    if (effect) {
      effect.activate(x, y);
    }
  }

  /**
   * Эмитировать эффект взрыва при столкновении с препятствием
   */
  emitCollisionEffect(x: number, y: number): void {
    const effect = this.poolManager.acquire<CollisionEffect>('collisionEffect');
    if (effect) {
      effect.activate(x, y);
    }
  }

  reset(): void {
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
  clearAllEffects(): void {
    // Очистка coinCollectEffect (искорки при сборе монет)
    if (this.poolManager.hasPool('coinCollectEffect')) {
      const coinEffectPool = this.poolManager.getPool<CoinCollectEffect>('coinCollectEffect');
      const activeCoinEffects = coinEffectPool.getActive();

      for (let i = activeCoinEffects.length - 1; i >= 0; i--) {
        const effect = activeCoinEffects[i];
        if (effect?.deactivate) {
          effect.deactivate(); // Принудительно деактивируем
        }
        coinEffectPool.release(effect); // Возвращаем в пул
      }
    }

    // Очистка collisionEffect (взрывы при столкновении)
    if (this.poolManager.hasPool('collisionEffect')) {
      const collisionPool = this.poolManager.getPool<CollisionEffect>('collisionEffect');
      const activeCollisionEffects = collisionPool.getActive();

      for (let i = activeCollisionEffects.length - 1; i >= 0; i--) {
        const effect = activeCollisionEffects[i];
        if (effect?.deactivate) {
          effect.deactivate(); // Принудительно деактивируем
        }
        collisionPool.release(effect); // Возвращаем в пул
      }
    }
  }

  getStats(): Record<string, PoolStats> {
    return this.poolManager.getAllStats();
  }

  logStats(): void {
    this.poolManager.logStats();
  }

  private releaseInactiveEffects(): void {
    const coinEffectPool = this.poolManager.getPool<CoinCollectEffect>('coinCollectEffect');
    const activeCoinEffects = coinEffectPool.getActive();
    for (let i = activeCoinEffects.length - 1; i >= 0; i--) {
      const eff = activeCoinEffects[i];
      if (!eff.isActive || !eff.isActive()) {
        coinEffectPool.release(eff);
      }
    }

    if (this.poolManager.hasPool('collisionEffect')) {
      const collisionPool = this.poolManager.getPool<CollisionEffect>('collisionEffect');
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
