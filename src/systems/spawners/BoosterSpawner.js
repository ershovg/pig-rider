import BaseSpawner from './BaseSpawner.js';
import CONFIG from '../../config/constants.js';
import MathUtils from '../../utils/MathUtils.js';

/**
 * BoosterSpawner - Отвечает за спавн power-up объектов (бустеров)
 *
 * Особенности:
 * - Редкий спавн (каждые 8 секунд)
 * - Случайная полоса
 * - Не спавнится во время активного бустера (управляется через context)
 *
 * Бустеры - это интерактивные объекты, которые при сборе активируют
 * специальный режим с плотным потоком монет.
 */
export default class BoosterSpawner extends BaseSpawner {
  /**
   * @param {Object} config
   * @param {ObjectPool} config.pool - Пул бустеров
   * @param {PIXI.Container} config.stage - Сцена
   */
  constructor(config) {
    super({
      pool: config.pool,
      stage: config.stage,
      baseInterval: 8000, // 8 секунд между бустерами
      getIntervalModifier: null // Не зависит от сложности
    });

    // Отслеживаем последнюю X-позицию на каждой полосе
    this.lastBoosterX = [0, 0, 0];
  }

  /**
   * Логика спавна бустера
   *
   * Простой алгоритм:
   * 1. Выбираем случайную полосу
   * 2. Рассчитываем случайную позицию
   * 3. Спавним бустер
   *
   * @param {number} gameSpeed - Текущая скорость игры (не используется)
   * @param {Object} context - { isBoosterActive, boosterCooldown }
   */
  spawn(gameSpeed, context = {}) {
    const { isBoosterActive = false, boosterCooldown = 0 } = context;

    // Не спавним бустеры, если:
    // 1. Бустер уже активен
    // 2. Идет кулдаун после бустера
    if (isBoosterActive || boosterCooldown > 0) {
      return;
    }

    // Выбираем случайную полосу
    const lane = MathUtils.randomInt(0, CONFIG.LANES.TOTAL - 1);

    // Рассчитываем расстояние
    const distance = MathUtils.randomFloat(400, 800);
    const spawnX = CONFIG.CANVAS_WIDTH + distance;

    // Спавним бустер
    const booster = this.pool.acquire();
    if (booster) {
      booster.activate(lane, spawnX);
      this.lastBoosterX[lane] = spawnX;
    }
  }

  /**
   * Сброс состояния
   */
  reset() {
    super.reset();
    this.lastBoosterX = [0, 0, 0];
  }

  /**
   * Проверить, активен ли какой-либо бустер (для отладки)
   * @returns {boolean}
   */
  hasActiveBoosters() {
    return this.getActiveObjects().length > 0;
  }
}
