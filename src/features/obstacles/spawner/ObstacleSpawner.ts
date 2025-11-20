import * as PIXI from 'pixi.js';
import { BaseSpawner } from '../../spawning/spawners/BaseSpawner';
import { CONFIG } from '../../../shared/config/constants';
import { MathUtils } from '../../../shared/utils/MathUtils';
import { ObstaclePatternLibrary } from '../patterns/ObstaclePatternLibrary';
import { Obstacle } from '../entities/Obstacle';
import type { Lane, SpawnContext, ObstacleSpawnerConfig, SpawnCoordinationService } from '../../../types';
import type { ObstaclePattern } from '../../../types/obstacles';

export class ObstacleSpawner extends BaseSpawner<Obstacle> {
  private readonly ALL_LANES: Lane[] = [0, 1, 2];
  private patternLibrary: ObstaclePatternLibrary;
  private coordinationService: SpawnCoordinationService | null;
  private lastPatternX: number;
  private textures: PIXI.Texture[];

  constructor(config: ObstacleSpawnerConfig<Obstacle>) {
    super({
      pool: config.pool,
      stage: config.stage,
      baseInterval: CONFIG.OBSTACLE.MIN_DISTANCE,
      getIntervalModifier: config.getIntervalModifier
    });

    this.patternLibrary = new ObstaclePatternLibrary();
    this.coordinationService = config.coordinationService || null;
    this.lastPatternX = 0;
    this.textures = config.textures || [];
    this.timer = 200;
  }

  private getRandomTexture(): PIXI.Texture | null {
    if (this.textures.length === 0) return null;
    if (this.textures.length === 1) return this.textures[0];

    const random = Math.random();
    return random < 0.3 ? this.textures[0] : this.textures[1];
  }

  spawn(gameSpeed: number, _context: SpawnContext = {}): void {
    const currentDifficulty = gameSpeed || 1.0;

    const pattern: ObstaclePattern = this.patternLibrary.selectPattern(currentDifficulty);

    const minDist = CONFIG.OBSTACLE.MIN_DISTANCE;
    const maxDist = CONFIG.OBSTACLE.MAX_DISTANCE;
    const distance = MathUtils.randomFloat(minDist, maxDist);

    const baseX = Math.max(
      CONFIG.CANVAS_WIDTH + distance,
      this.lastPatternX + distance
    );

    let spawnedCount = 0;
    let skippedDueToCoins = 0;

    for (let i = 0; i < pattern.lanes.length; i++) {
      const lane = pattern.lanes[i];

      const offset = (i === 1 && pattern.offset) ? pattern.offset : 0;
      const spawnX = baseX + offset;

      if (this.coordinationService && !this.coordinationService.canSpawnObstacleAt(lane, spawnX, 150)) {
        skippedDueToCoins++;
        continue;
      }

      const texture = this.getRandomTexture();

      const obstacle = this.pool.acquire();
      if (obstacle) {
        obstacle.activate(lane, spawnX, texture);
        spawnedCount++;
      }
    }

    if (skippedDueToCoins > 0) {
      console.log(`[ObstacleSpawner] Skipped ${skippedDueToCoins} obstacles due to coin collision (Lane Safety)`);
    }

    this.lastPatternX = baseX + (pattern.offset || 0);
  }

  getFreeLanes(blockedLanes: Lane[]): Lane[] {
    return this.ALL_LANES.filter(lane => !blockedLanes.includes(lane));
  }

  reset(): void {
    super.reset();
    this.lastPatternX = 0;
    this.patternLibrary.reset();
  }

  clearAll(): void {
    this.pool.releaseAll();
    this.lastPatternX = 0;
  }

  getObstaclesInLane(lane: Lane): Obstacle[] {
    return this.getActiveObjects().filter(obstacle => obstacle.lane === lane);
  }

  getPatternStats(): ReturnType<ObstaclePatternLibrary['getStats']> {
    return this.patternLibrary.getStats();
  }
}
