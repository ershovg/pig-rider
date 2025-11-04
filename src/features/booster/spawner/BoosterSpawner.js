import { BaseSpawner } from '../../spawning/spawners/BaseSpawner.js';
import { CONFIG } from '../../../shared/config/constants.ts';
import { MathUtils } from '../../../shared/utils/MathUtils.ts';

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
export class BoosterSpawner extends BaseSpawner {
  /**
   * @param {Object} config
   * @param {ObjectPool} config.pool - Пул бустеров
   * @param {PIXI.Container} config.stage - Сцена
   */
  constructor(config) {
    super({
      pool: config.pool,
      stage: config.stage,
      baseInterval: 8000,
      getIntervalModifier: null
    });

    this.coordinationService = config.coordinationService;
    this.lastBoosterX = [0, 0, 0];
  }

  spawn(gameSpeed, context = {}) {
    const { isBoosterActive = false, boosterCooldown = 0 } = context;

    if (isBoosterActive || boosterCooldown > 0) {
      return;
    }

    const lane = MathUtils.randomInt(0, CONFIG.LANES.TOTAL - 1);
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
