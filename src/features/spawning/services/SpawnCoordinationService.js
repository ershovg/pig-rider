import { CONFIG } from '../../../shared/config/constants.js';

export class SpawnCoordinationService {
  constructor(obstaclePool) {
    this.obstaclePool = obstaclePool;
  }

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
