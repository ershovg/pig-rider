import { CONFIG } from '../../../shared/config/constants';
import type { ObjectPool, ObstacleEntity } from '../../../types/spawning';
import type { Lane } from '../../../types/common';

/**
 * LaneSafetyService
 *
 * Гарантирует, что игрок всегда имеет хотя бы одну свободную полосу для прохода.
 * Отслеживает препятствия в зоне спавна и предотвращает блокировку всех полос одновременно.
 */
export class LaneSafetyService {
  private static readonly BASE_SAFE_DISTANCE = 2500;
  private static readonly SPEED_SCALE_FACTOR = 0.8;
  private static readonly ALL_LANES: readonly Lane[] = [0, 1, 2];
  private static readonly DEBUG = false; // Переключатель для debug логов

  private obstaclePool: ObjectPool<ObstacleEntity>;

  constructor(obstaclePool: ObjectPool<ObstacleEntity>) {
    this.obstaclePool = obstaclePool;
  }

  /**
   * Возвращает список заблокированных полос в текущей зоне спавна
   */
  getBlockedLanes(gameSpeed: number = 1.0): Lane[] {
    const safeDistance = this._calculateSafeDistance(gameSpeed);
    const spawnZoneEnd = CONFIG.CANVAS_WIDTH + safeDistance;
    const blocked = new Set<Lane>();

    for (const obstacle of this.obstaclePool.getActive()) {
      if (!obstacle.isActive()) continue;

      const obstacleX = obstacle.getSprite().x;
      const isInSpawnZone = obstacleX >= CONFIG.CANVAS_WIDTH && obstacleX <= spawnZoneEnd;

      if (isInSpawnZone) {
        blocked.add(obstacle.lane);
      }
    }

    if (LaneSafetyService.DEBUG) {
      this._logSpawnZoneState(spawnZoneEnd, blocked);
    }

    return Array.from(blocked);
  }

  /**
   * Возвращает список доступных (незаблокированных) полос
   */
  getAvailableLanes(gameSpeed: number = 1.0): Lane[] {
    const blocked = this.getBlockedLanes(gameSpeed);
    return LaneSafetyService.ALL_LANES.filter(lane => !blocked.includes(lane)) as Lane[];
  }

  /**
   * Выбирает случайную доступную полосу
   * Failsafe: если все полосы заблокированы, возвращает случайную
   */
  getRandomAvailableLane(gameSpeed: number = 1.0): Lane {
    const available = this.getAvailableLanes(gameSpeed);

    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }

    console.warn('[LaneSafetyService] All lanes blocked! Using failsafe.');
    return Math.floor(Math.random() * 3) as Lane;
  }

  // Private methods

  private _calculateSafeDistance(gameSpeed: number): number {
    const speedMultiplier = Math.max(1.0, gameSpeed * LaneSafetyService.SPEED_SCALE_FACTOR);
    return LaneSafetyService.BASE_SAFE_DISTANCE * speedMultiplier;
  }

  private _logSpawnZoneState(spawnZoneEnd: number, blocked: Set<Lane>): void {
    const available = LaneSafetyService.ALL_LANES.filter(l => !blocked.has(l));
    console.log(
      `[LaneSafety] Zone: [${CONFIG.CANVAS_WIDTH}, ${spawnZoneEnd.toFixed(0)}], ` +
      `Active: ${this.obstaclePool.getActive().length}, ` +
      `Blocked: [${Array.from(blocked).join(', ')}], ` +
      `Available: [${available.join(', ')}]`
    );
  }
}
