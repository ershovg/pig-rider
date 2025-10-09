import BaseSpawner from './BaseSpawner.js';
import CONFIG from '../../config/constants.js';
import MathUtils from '../../utils/MathUtils.js';

/**
 * ObstacleSpawner - Отвечает за спавн препятствий
 *
 * Ключевые особенности:
 * - Использует LaneSafetyService для предотвращения блокировки всех полос
 * - Отслеживает последние позиции спавна на каждой полосе
 * - Учитывает сложность игры (DifficultyManager) для динамических интервалов
 *
 * Паттерн: Strategy (через LaneSafetyService)
 */
export default class ObstacleSpawner extends BaseSpawner {
  /**
   * @param {Object} config
   * @param {ObjectPool} config.pool - Пул препятствий
   * @param {PIXI.Container} config.stage - Сцена
   * @param {LaneSafetyService} config.laneSafetyService - Сервис безопасности полос
   * @param {Function} config.getIntervalModifier - Функция для получения модификатора интервала
   */
  constructor(config) {
    super({
      pool: config.pool,
      stage: config.stage,
      baseInterval: CONFIG.OBSTACLE.MIN_DISTANCE, // Базовый интервал
      getIntervalModifier: config.getIntervalModifier
    });

    this.laneSafetyService = config.laneSafetyService;

    // Отслеживаем последнюю позицию спавна на каждой полосе
    // Это предотвращает "tight chains" - слишком плотное расположение препятствий
    this.lastObstacleX = [0, 0, 0]; // X-координата последнего препятствия для каждой полосы
    this.lastObstacleTime = [0, 0, 0]; // Время последнего спавна (для отладки)
  }

  /**
   * Логика спавна препятствия
   *
   * Алгоритм:
   * 1. Получаем доступные полосы через LaneSafetyService
   * 2. Если все полосы заблокированы → пропускаем спавн (это нормально!)
   * 3. Выбираем случайную доступную полосу
   * 4. Рассчитываем позицию с учетом минимального расстояния
   * 5. Спавним препятствие
   *
   * @param {number} gameSpeed - Текущая скорость игры
   * @param {Object} context - Контекст (не используется, но может понадобиться)
   */
  spawn(gameSpeed, context = {}) {
    // CRITICAL: Проверяем доступные полосы через LaneSafetyService
    const availableLanes = this.laneSafetyService.getAvailableLanes(gameSpeed);

    // Если все полосы заблокированы, пропускаем спавн
    // Это нормальная ситуация - лучше пропустить, чем заблокировать игрока
    if (availableLanes.length === 0) {
      console.warn('[ObstacleSpawner] All lanes blocked - skipping spawn (safety mechanism)');
      return;
    }

    // Выбираем случайную полосу из доступных
    const lane = availableLanes[MathUtils.randomInt(0, availableLanes.length - 1)];

    // Рассчитываем позицию спавна
    // Используем случайное расстояние между MIN и MAX для разнообразия
    const minDist = CONFIG.OBSTACLE.MIN_DISTANCE;
    const maxDist = CONFIG.OBSTACLE.MAX_DISTANCE;
    const distance = MathUtils.randomFloat(minDist, maxDist);

    // Спавним либо за правым краем экрана, либо после последнего препятствия
    // (в зависимости от того, что дальше)
    const spawnX = Math.max(
      CONFIG.CANVAS_WIDTH + distance,
      this.lastObstacleX[lane] + distance
    );

    // Получаем препятствие из пула и активируем
    const obstacle = this.pool.acquire();
    obstacle.activate(lane, spawnX);

    // Обновляем позицию последнего спавна для этой полосы
    this.lastObstacleX[lane] = spawnX;
    this.lastObstacleTime[lane] = performance.now();
  }

  /**
   * Сброс состояния spawner'а
   * Вызывается при рестарте игры
   */
  reset() {
    super.reset();

    // Сбрасываем позиции последних препятствий
    this.lastObstacleX = [0, 0, 0];
    this.lastObstacleTime = [0, 0, 0];
  }

  /**
   * Очистить все препятствия (например, при активации бустера)
   */
  clearAll() {
    this.pool.releaseAll();
    this.lastObstacleX = [0, 0, 0];
    this.lastObstacleTime = [0, 0, 0];
  }

  /**
   * Получить препятствия на конкретной полосе (для отладки)
   * @param {number} lane - Номер полосы (0, 1, 2)
   * @returns {Array}
   */
  getObstaclesInLane(lane) {
    return this.getActiveObjects().filter(obstacle => obstacle.lane === lane);
  }
}
