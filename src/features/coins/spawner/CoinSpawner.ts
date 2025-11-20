import { BaseSpawner } from '../../spawning/spawners/BaseSpawner';
import { CONFIG } from '../../../shared/config/constants';
import { MathUtils } from '../../../shared/utils/MathUtils';
import {
  Lane,
  SpawnContext,
  CollectibleSpawnerConfig
} from '../../../types';
import { Coin } from '../entities/Coin';

export class CoinSpawner extends BaseSpawner<Coin> {
  private coordinationService: CollectibleSpawnerConfig<Coin>['coordinationService'];
  private lastCoinX: [number, number, number];

  constructor(config: CollectibleSpawnerConfig<Coin>) {
    super({
      pool: config.pool,
      stage: config.stage,
      baseInterval: 800,
      getIntervalModifier: config.getIntervalModifier
    });

    this.coordinationService = config.coordinationService;
    this.lastCoinX = [0, 0, 0];
  }

  getCurrentInterval(context: SpawnContext): number {
    const { isBoosterMode = false, gameSpeed = 1.0, difficultyManager = null } = context;

    if (isBoosterMode) {
      return CONFIG.BOOSTER_COIN_SPAWN_INTERVAL * 1000;
    }

    const baseInterval = difficultyManager?.getCoinSpawnInterval
      ? difficultyManager.getCoinSpawnInterval() * 1000
      : this.baseInterval;

    return baseInterval / gameSpeed;
  }

  spawn(_gameSpeed: number, context: SpawnContext = {}): void {
    const { isBoosterMode = false, boosterActiveLane = 0 } = context;

    if (isBoosterMode) {
      this.spawnBoosterCoin(boosterActiveLane);
    } else {
      this.spawnNormalCoin();
    }
  }

  private spawnNormalCoin(): void {
    const lane = MathUtils.randomInt(0, CONFIG.LANES.TOTAL - 1) as Lane;
    const distance = MathUtils.randomFloat(CONFIG.COIN.MIN_DISTANCE, CONFIG.COIN.MAX_DISTANCE);

    const spawnX = Math.max(
      CONFIG.CANVAS_WIDTH + distance,
      this.lastCoinX[lane] + distance
    );

    if (this.coordinationService && !this.coordinationService.canSpawnAt(lane, spawnX, 150)) {
      return;
    }

    const coin = this.pool.acquire();
    if (coin) {
      coin.activate(lane, spawnX);
      this.lastCoinX[lane] = spawnX;
    }
  }

  private spawnBoosterCoin(lane: Lane): void {
    const distance = 80;

    const spawnX = Math.max(
      CONFIG.CANVAS_WIDTH + distance,
      this.lastCoinX[lane] + distance
    );

    const coin = this.pool.acquire();
    if (coin) {
      coin.activate(lane, spawnX);
      this.lastCoinX[lane] = spawnX;
    }
  }

  fillLaneWithCoins(lane: Lane): void {
    const coinCount = 20;
    const spacing = 80;
    let spawnX = CONFIG.CANVAS_WIDTH + 100;

    for (let i = 0; i < coinCount; i++) {
      const coin = this.pool.acquire();
      if (coin) {
        coin.activate(lane, spawnX);
        spawnX += spacing;
      }
    }

    this.lastCoinX[lane] = spawnX;
    console.log(`[CoinSpawner] Filled lane ${lane} with ${coinCount} coins`);
  }

  reset(): void {
    super.reset();
    this.lastCoinX = [0, 0, 0];
  }

  clearBoosterCoins(): void {
    const activeCoins = this.getActiveObjects() as Coin[];
    let clearedCount = 0;
    let safetyCleared = 0;

    const keepThreshold = CONFIG.CANVAS_WIDTH + 400;

    for (let i = activeCoins.length - 1; i >= 0; i--) {
      const coin = activeCoins[i];
      if (coin && coin.isActive()) {
        const coinX = (coin as any).currentX;
        const coinLane = (coin as any).lane as Lane;
        let shouldRemove = false;

        if (coinX > keepThreshold) {
          shouldRemove = true;
          clearedCount++;
        } else if (this.coordinationService && !this.coordinationService.canSpawnAt(coinLane, coinX, 150)) {
          shouldRemove = true;
          safetyCleared++;
        }

        if (shouldRemove) {
          coin.deactivate();
          this.pool.release(coin);
        }
      }
    }

    console.log(`[CoinSpawner] Cleared ${clearedCount} distant + ${safetyCleared} unsafe coins`);
  }

  getCoinsInLane(lane: Lane): Coin[] {
    const activeCoins = this.getActiveObjects() as Coin[];
    return activeCoins.filter(coin => (coin as any).lane === lane);
  }
}
