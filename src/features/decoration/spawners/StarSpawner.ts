import { BaseSpawner } from '../../spawning/spawners/BaseSpawner';
import { CONFIG } from '../../../shared/config/constants';
import { MathUtils } from '../../../shared/utils/MathUtils';
import { Lane, BaseSpawnerConfig, ActivatableEntity } from '../../../types';
import { Star } from '../entities/Star';

export class StarSpawner extends BaseSpawner<Star> {
  private lastStarX: [number, number, number];

  constructor(config: BaseSpawnerConfig<ActivatableEntity>) {
    super({
      pool: config.pool,
      stage: config.stage,
      baseInterval: 500,
      getIntervalModifier: null
    });

    this.lastStarX = [0, 0, 0];
    this.timer = 50;
  }

  spawn(_gameSpeed: number, _context = {}): void {
    const lane = MathUtils.randomInt(0, CONFIG.LANES.TOTAL - 1) as Lane;

    const minDist = 200;
    const maxDist = 600;
    const distance = MathUtils.randomFloat(minDist, maxDist);

    const spawnX = Math.max(
      CONFIG.CANVAS_WIDTH + distance,
      this.lastStarX[lane] + distance
    );

    const star = this.pool.acquire();
    if (star) {
      star.activate(lane, spawnX);
      this.lastStarX[lane] = spawnX;
    }
  }

  reset(): void {
    super.reset();
    this.lastStarX = [0, 0, 0];
  }
}
