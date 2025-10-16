import { CONFIG } from '../../config/constants.js';

/**
 * LaneSafetyService - Сервис для обеспечения безопасности полос движения
 *
 * Паттерн: Service Object
 *
 * Отвечает за:
 * - Определение заблокированных полос (где уже есть препятствия)
 * - Выбор безопасной полосы для спавна нового препятствия
 * - Гарантию того, что игрок всегда имеет хотя бы один проход
 *
 * Критическая логика игры:
 * Игра становится несправедливой, если все три полосы заблокированы одновременно.
 * Этот сервис предотвращает такую ситуацию.
 *
 * Использование:
 * const service = new LaneSafetyService(obstaclePool);
 * const safeLane = service.getAvailableLane(gameSpeed);
 */
export class LaneSafetyService {
  constructor(obstaclePool) {
    this.obstaclePool = obstaclePool;
  }

  /**
   * Получить список заблокированных полос
   *
   * Логика безопасного расстояния:
   * - Игрок переключается между полосами за ~0.15с (PLAYER.SWITCH_DURATION)
   * - Время реакции человека: ~0.2-0.3с
   * - Итого минимальное окно: ~0.5с
   * - При скорости 2.5x препятствия движутся ~800px/с → нужен буфер ~2000px
   *
   * @param {number} gameSpeed - Текущая скорость игры (множитель)
   * @returns {number[]} Массив заблокированных полос [0, 1, 2]
   */
  getBlockedLanes(gameSpeed = 1.0) {
    const blocked = [];

    // Динамически рассчитываем безопасное расстояние
    const baseDistance = 2500; // Увеличено с 1500 для большего буфера безопасности
    const speedMultiplier = Math.max(1.0, gameSpeed * 0.8); // Масштабируем с скоростью (не линейно)
    const safeDistance = baseDistance * speedMultiplier;

    const activeObstacles = this.obstaclePool.getActive();

    // Определяем зону спавна СПРАВА от экрана
    const spawnZoneStart = CONFIG.CANVAS_WIDTH; // 1920px (правый край экрана)
    const spawnZoneEnd = CONFIG.CANVAS_WIDTH + safeDistance; // 1920 + 2500 = 4420px

    for (const obstacle of activeObstacles) {
      if (!obstacle.isActive()) continue;

      const obstacleX = obstacle.getSprite().x;
      const lane = obstacle.lane;
      const inZone = obstacleX >= spawnZoneStart && obstacleX <= spawnZoneEnd;

      // ✅ ИСПРАВЛЕНО: проверяем зону спавна СПРАВА (где создаются новые препятствия)
      // Если препятствие находится в диапазоне [1920, 4420]px, оно блокирует свою полосу
      if (inZone) {
        if (!blocked.includes(lane)) {
          blocked.push(lane);
        }
      }
    }

    const available = [0,1,2].filter(l => !blocked.includes(l));
    console.log(`[LaneSafety] Zone: [${spawnZoneStart}, ${spawnZoneEnd.toFixed(0)}], Active: ${activeObstacles.length}, Blocked: [${blocked.join(', ')}], Available: [${available.join(', ')}]`);

    return blocked;
  }

  /**
   * Получить доступные (незаблокированные) полосы
   *
   * @param {number} gameSpeed - Текущая скорость игры
   * @returns {number[]} Массив доступных полос
   */
  getAvailableLanes(gameSpeed = 1.0) {
    const blockedLanes = this.getBlockedLanes(gameSpeed);
    const allLanes = [0, 1, 2];

    return allLanes.filter(lane => !blockedLanes.includes(lane));
  }

  /**
   * Получить случайную доступную полосу
   *
   * Гарантирует, что вернет только незаблокированную полосу.
   * Если все полосы заблокированы, вернет случайную (failsafe).
   *
   * @param {number} gameSpeed - Текущая скорость игры
   * @returns {number} Номер полосы (0, 1, или 2)
   */
  getAvailableLane(gameSpeed = 1.0) {
    const availableLanes = this.getAvailableLanes(gameSpeed);

    // Если есть доступные полосы, выбираем случайную
    if (availableLanes.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableLanes.length);
      return availableLanes[randomIndex];
    }

    // Failsafe: если все полосы заблокированы (не должно происходить),
    // возвращаем случайную полосу
    console.warn('[LaneSafetyService] All lanes blocked! Returning random lane (failsafe)');
    return Math.floor(Math.random() * 3);
  }

  /**
   * Проверить, заблокирована ли конкретная полоса
   *
   * @param {number} lane - Номер полосы (0, 1, или 2)
   * @param {number} gameSpeed - Текущая скорость игры
   * @returns {boolean}
   */
  isLaneBlocked(lane, gameSpeed = 1.0) {
    const blockedLanes = this.getBlockedLanes(gameSpeed);
    return blockedLanes.includes(lane);
  }

  /**
   * Проверить, безопасно ли спавнить препятствие на всех полосах
   * (то есть, останется ли хотя бы одна свободная полоса)
   *
   * @param {number} gameSpeed - Текущая скорость игры
   * @returns {boolean} true, если безопасно спавнить
   */
  canSafelySpawn(gameSpeed = 1.0) {
    const availableLanes = this.getAvailableLanes(gameSpeed);
    // Безопасно, если доступна хотя бы одна полоса
    return availableLanes.length > 0;
  }

  /**
   * Получить количество доступных полос
   *
   * @param {number} gameSpeed - Текущая скорость игры
   * @returns {number} Количество свободных полос (0-3)
   */
  getAvailableLaneCount(gameSpeed = 1.0) {
    return this.getAvailableLanes(gameSpeed).length;
  }
}
