import { BaseSpawner } from '../../spawning/spawners/BaseSpawner';
import { CONFIG } from '../../../shared/config/constants';
import { MathUtils } from '../../../shared/utils/MathUtils';
import { Lane, BaseSpawnerConfig, ActivatableEntity } from '../../../types';
import { Cloud } from '../entities/Cloud';

export class CloudSpawner extends BaseSpawner<Cloud> {
  private MIN_CLOUD_DISTANCE: number;
  private lastCloudX: [number, number, number];

  constructor(config: BaseSpawnerConfig<ActivatableEntity>) {
    super({
      pool: config.pool,
      stage: config.stage,
      baseInterval: 2500,
      getIntervalModifier: null
    });

    this.MIN_CLOUD_DISTANCE = 1000;
    this.lastCloudX = [0, 0, 0];
    this.timer = 300;
  }

  spawn(_gameSpeed: number, _context = {}): void {
    const lane = this.getBestLane();

    if (!this.canSpawnOnLane(lane)) {
      return;
    }

    const distance = MathUtils.randomFloat(300, 800);
    const spawnX = Math.max(
      CONFIG.CANVAS_WIDTH + distance,
      this.lastCloudX[lane] + this.MIN_CLOUD_DISTANCE
    );

    const cloud = this.pool.acquire();
    if (cloud) {
      cloud.activate(lane, spawnX);
      this.lastCloudX[lane] = spawnX;
    }
  }

  private getBestLane(): Lane {
    const activeClouds = this.pool.getActive() as Cloud[];
    const laneCounts = Array(CONFIG.LANES.TOTAL).fill(0);

    for (const cloud of activeClouds) {
      if (cloud.isActive()) {
        laneCounts[cloud.lane]++;
      }
    }

    const minCount = Math.min(...laneCounts);
    const bestLanes: number[] = [];

    for (let i = 0; i < CONFIG.LANES.TOTAL; i++) {
      if (laneCounts[i] === minCount) {
        bestLanes.push(i);
      }
    }

    return MathUtils.randomInt(0, bestLanes.length - 1) as Lane;
  }

  private canSpawnOnLane(lane: Lane): boolean {
    const activeClouds = this.pool.getActive() as Cloud[];
    const spawnX = CONFIG.CANVAS_WIDTH;

    for (const cloud of activeClouds) {
      if (!cloud.isActive() || cloud.lane !== lane) continue;

      const cloudX = cloud.getSprite().x;
      const distance = Math.abs(cloudX - spawnX);

      if (distance < this.MIN_CLOUD_DISTANCE) {
        return false;
      }
    }

    return true;
  }

  reset(): void {
    super.reset();
    this.lastCloudX = [0, 0, 0];
  }

  getCloudDistribution(): number[] {
    const activeClouds = this.pool.getActive() as Cloud[];
    const laneCounts = [0, 0, 0];

    for (const cloud of activeClouds) {
      if (cloud.isActive()) {
        laneCounts[cloud.lane]++;
      }
    }

    return laneCounts;
  }
}
