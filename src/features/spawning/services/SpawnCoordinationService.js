import { CONFIG } from '../../../shared/config/constants.ts';

export class SpawnCoordinationService {
  constructor(obstaclePool, coinPool = null) {
    this.obstaclePool = obstaclePool;
    this.coinPool = coinPool;
  }

  /**
   * Установить пул монет (вызывается из SpawnSystem после инициализации)
   */
  setCoinPool(coinPool) {
    this.coinPool = coinPool;
  }

  /**
   * Проверить, можно ли заспавнить объект на данной полосе и позиции
   * Проверяет коллизии с препятствиями
   */
  canSpawnAt(lane, x, safeRadius = 150) {
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

  /**
   * Проверить, можно ли заспавнить препятствие на данной полосе и позиции
   * Проверяет коллизии с монетами (важно после окончания бустера!)
   */
  canSpawnObstacleAt(lane, x, safeRadius = 150) {
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

  getNearestObstacle(lane, x) {
    const activeObstacles = this.obstaclePool.getActive();
    let nearest = null;
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
