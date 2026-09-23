import type {
  ObjectPool,
  ObstacleEntity,
  CoinEntity,
  SpawnCoordinationService as ISpawnCoordinationService
} from '../../../types/spawning';
import type { Lane } from '../../../types/common';

export class SpawnCoordinationService implements ISpawnCoordinationService {
  private obstaclePool: ObjectPool<ObstacleEntity>;
  private coinPool: ObjectPool<CoinEntity> | null;

  constructor(obstaclePool: ObjectPool<ObstacleEntity>, coinPool: ObjectPool<CoinEntity> | null = null) {
    this.obstaclePool = obstaclePool;
    this.coinPool = coinPool;
  }

  setCoinPool(coinPool: ObjectPool<CoinEntity>): void {
    this.coinPool = coinPool;
  }

  canSpawnAt(lane: Lane, x: number, safeRadius: number = 150): boolean {
    const activeObstacles = this.obstaclePool.getActive();

    for (const obstacle of activeObstacles) {
      if (!obstacle.isActive()) continue;
      if (obstacle.lane !== lane) continue;

      const obstacleX = obstacle.getSprite().x;
      const distance = Math.abs(obstacleX - x);

      if (distance < safeRadius) {
        return false;
      }
    }

    return true;
  }

  canSpawnObstacleAt(lane: Lane, x: number, safeRadius: number = 150): boolean {
    // Сначала проверяем другие препятствия
    if (!this.canSpawnAt(lane, x, safeRadius)) {
      return false;
    }

    // Если есть пул монет, проверяем коллизии с активными монетами
    if (this.coinPool) {
      const activeCoins = this.coinPool.getActive();

      for (const coin of activeCoins) {
        if (!coin.isActive()) continue;
        if (coin.lane !== lane) continue;

        const coinX = coin.x;
        const distance = Math.abs(coinX - x);

        if (distance < safeRadius) {
          return false; // Слишком близко к монете
        }
      }
    }

    return true;
  }

  getNearestObstacle(lane: Lane, x: number): ObstacleEntity | null {
    const activeObstacles = this.obstaclePool.getActive();
    let nearest: ObstacleEntity | null = null;
    let minDistance = Infinity;

    for (const obstacle of activeObstacles) {
      if (!obstacle.isActive()) continue;
      if (obstacle.lane !== lane) continue;

      const obstacleX = obstacle.getSprite().x;
      const distance = Math.abs(obstacleX - x);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = obstacle;
      }
    }

    return nearest;
  }
}
