import * as PIXI from 'pixi.js';
import { BaseSpawner } from '../../spawning/spawners/BaseSpawner';
import { CONFIG } from '../../../shared/config/constants';
import { MathUtils } from '../../../shared/utils/MathUtils';
import {
  Lane,
  ObjectPool,
  SpawnCoordinationService,
  ActivatableEntity,
  SpawnContext
} from '../../../types';

interface BoosterSpawnerConfig {
  pool: ObjectPool<ActivatableEntity>;
  stage: PIXI.Container;
  coordinationService?: SpawnCoordinationService;
}

export class BoosterSpawner extends BaseSpawner {
  private coordinationService: SpawnCoordinationService | undefined;
  private lastBoosterX: [number, number, number];

  constructor(config: BoosterSpawnerConfig) {
    super({
      pool: config.pool,
      stage: config.stage,
      baseInterval: 8000,
      getIntervalModifier: null
    });

    this.coordinationService = config.coordinationService;
    this.lastBoosterX = [0, 0, 0];
  }

  spawn(_gameSpeed: number, context: SpawnContext = {}): void {
    const { isBoosterActive = false, boosterCooldown = 0 } = context;

    if (isBoosterActive || boosterCooldown > 0) {
      return;
    }

    const lane = MathUtils.randomInt(0, CONFIG.LANES.TOTAL - 1) as Lane;
    const distance = MathUtils.randomFloat(400, 800);
    const spawnX = CONFIG.CANVAS_WIDTH + distance;

    if (this.coordinationService && !this.coordinationService.canSpawnAt(lane, spawnX, 200)) {
      return;
    }

    const booster = this.pool.acquire();
    if (booster) {
      booster.activate(lane, spawnX);
      this.lastBoosterX[lane] = spawnX;
    }
  }

  reset(): void {
    super.reset();
    this.lastBoosterX = [0, 0, 0];
  }

  hasActiveBoosters(): boolean {
    return this.getActiveObjects().length > 0;
  }
}
