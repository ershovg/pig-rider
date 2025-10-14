import { BaseSpawner } from './BaseSpawner.js';
import { CONFIG } from '../../config/constants.js';
import { MathUtils } from '../../utils/MathUtils.js';

/**
 * StarSpawner - Отвечает за спавн декоративных звезд
 *
 * Простейший spawner:
 * - Случайная полоса
 * - Случайное расстояние между звездами
 * - Частый спавн (каждые 0.5 секунды)
 *
 * Не требует сложной логики, так как звезды чисто декоративные
 * и не влияют на геймплей.
 */
export class StarSpawner extends BaseSpawner {
  /**
   * @param {Object} config
   * @param {ObjectPool} config.pool - Пул звезд
   * @param {PIXI.Container} config.stage - Сцена
   */
  constructor(config) {
    super({
      pool: config.pool,
      stage: config.stage,
      baseInterval: 500, // 0.5 секунды между звездами
      getIntervalModifier: null // Не зависит от сложности
    });

    // Отслеживаем последнюю X-позицию на каждой полосе
    this.lastStarX = [0, 0, 0];

    // 🆕 Первая звезда спавнится через 100ms вместо 500ms
    this.timer = -400; // Сокращаем ожидание первого спавна на 0.4 сек
  }

  /**
   * Логика спавна звезды
   *
   * Простой алгоритм:
   * 1. Выбираем случайную полосу
   * 2. Рассчитываем случайное расстояние
   * 3. Спавним звезду
   *
   * @param {number} gameSpeed - Текущая скорость игры (не используется)
   * @param {Object} context - Контекст (не используется)
   */
  spawn(gameSpeed, context = {}) {
    // Выбираем случайную полосу
    const lane = MathUtils.randomInt(0, CONFIG.LANES.TOTAL - 1);

    // Рассчитываем расстояние (больше разброс для разнообразия)
    const minDist = 200;
    const maxDist = 600;
    const distance = MathUtils.randomFloat(minDist, maxDist);

    const spawnX = Math.max(
      CONFIG.CANVAS_WIDTH + distance,
      this.lastStarX[lane] + distance
    );

    // Спавним звезду
    const star = this.pool.acquire();
    if (star) {
      star.activate(lane, spawnX);
      this.lastStarX[lane] = spawnX;
    }
  }

  /**
   * Сброс состояния
   */
  reset() {
    super.reset();
    this.lastStarX = [0, 0, 0];
  }
}
