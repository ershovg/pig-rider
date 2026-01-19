import type { Point2D } from './common';
import type { CoinCollectedEvent } from './events';

export interface ProcessFrameResult {
  obstacleCollision: Point2D | null;
  collectedCoins: CoinCollectedEvent[];
  collectedBooster: number | null;
}

export interface CollisionProcessResult<TObstacle, TCoin> {
  obstacleHit: boolean;
  hitObstacle: TObstacle | null;
  coinsCollected: TCoin[];
}

export type { CoinCollectedEvent };
