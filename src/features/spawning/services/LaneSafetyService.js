import { CONFIG } from '../../../shared/config/constants.ts';

/**
 * LaneSafetyService
 *
 * Гарантирует, что игрок всегда имеет хотя бы одну свободную полосу для прохода.
 * Отслеживает препятствия в зоне спавна и предотвращает блокировку всех полос одновременно.
 */
export class LaneSafetyService {
  static BASE_SAFE_DISTANCE = 2500;
  static SPEED_SCALE_FACTOR = 0.8;
  static ALL_LANES = [0, 1, 2];
  static DEBUG = false; // Переключатель для debug логов

  constructor(obstaclePool) {
    this.obstaclePool = obstaclePool;
  }

  /**
   * Возвращает список заблокированных полос в текущей зоне спавна
   */
  getBlockedLanes(gameSpeed = 1.0) {
    const safeDistance = this._calculateSafeDistance(gameSpeed);
    const spawnZoneEnd = CONFIG.CANVAS_WIDTH + safeDistance;
    const blocked = new Set();

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
  getAvailableLanes(gameSpeed = 1.0) {
    const blocked = this.getBlockedLanes(gameSpeed);
    return LaneSafetyService.ALL_LANES.filter(lane => !blocked.includes(lane));
  }

  /**
   * Выбирает случайную доступную полосу
   * Failsafe: если все полосы заблокированы, возвращает случайную
   */
  getRandomAvailableLane(gameSpeed = 1.0) {
    const available = this.getAvailableLanes(gameSpeed);

    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }

    console.warn('[LaneSafetyService] All lanes blocked! Using failsafe.');
    return Math.floor(Math.random() * 3);
  }

  // Private methods

  _calculateSafeDistance(gameSpeed) {
    const speedMultiplier = Math.max(1.0, gameSpeed * LaneSafetyService.SPEED_SCALE_FACTOR);
    return LaneSafetyService.BASE_SAFE_DISTANCE * speedMultiplier;
  }

  _logSpawnZoneState(spawnZoneEnd, blocked) {
    const available = LaneSafetyService.ALL_LANES.filter(l => !blocked.has(l));
    console.log(
      `[LaneSafety] Zone: [${CONFIG.CANVAS_WIDTH}, ${spawnZoneEnd.toFixed(0)}], ` +
      `Active: ${this.obstaclePool.getActive().length}, ` +
      `Blocked: [${Array.from(blocked).join(', ')}], ` +
      `Available: [${available.join(', ')}]`
    );
  }
}
