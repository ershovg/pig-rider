import BaseSpawner from './BaseSpawner.js';
import CONFIG from '../../config/constants.js';
import MathUtils from '../../utils/MathUtils.js';

/**
 * CloudSpawner - Отвечает за спавн декоративных облаков
 *
 * Ключевые особенности:
 * - Анти-кластеризация: выбирает полосу с минимальным количеством облаков
 * - Проверка минимального расстояния между облаками на одной полосе
 * - Редкий спавн (каждые 2.5 секунды)
 *
 * Паттерн: Strategy (выбор лучшей полосы)
 */
export default class CloudSpawner extends BaseSpawner {
  /**
   * @param {Object} config
   * @param {ObjectPool} config.pool - Пул облаков
   * @param {PIXI.Container} config.stage - Сцена
   */
  constructor(config) {
    super({
      pool: config.pool,
      stage: config.stage,
      baseInterval: 2500, // 2.5 секунды между облаками
      getIntervalModifier: null // Не зависит от сложности
    });

    // Минимальное расстояние между облаками на одной полосе
    this.MIN_CLOUD_DISTANCE = 1000; // 1000px между облаками

    // Отслеживаем последнюю X-позицию на каждой полосе
    this.lastCloudX = [0, 0, 0];
  }

  /**
   * Логика спавна облака
   *
   * Алгоритм:
   * 1. Находим лучшую полосу (с минимальным количеством облаков)
   * 2. Проверяем, можно ли спавнить (достаточно ли расстояние)
   * 3. Если можно - спавним, иначе пропускаем
   *
   * @param {number} gameSpeed - Текущая скорость игры (не используется для облаков)
   * @param {Object} context - Контекст (не используется)
   */
  spawn(gameSpeed, context = {}) {
    // Находим лучшую полосу для спавна
    const lane = this.getBestLane();

    // Проверяем, можно ли спавнить на этой полосе
    if (!this.canSpawnOnLane(lane)) {
      // Пропускаем спавн если облака слишком близко
      return;
    }

    // Рассчитываем позицию спавна
    const distance = MathUtils.randomFloat(300, 800);
    const spawnX = Math.max(
      CONFIG.CANVAS_WIDTH + distance,
      this.lastCloudX[lane] + this.MIN_CLOUD_DISTANCE
    );

    // Спавним облако
    const cloud = this.pool.acquire();
    if (cloud) {
      cloud.activate(lane, spawnX);
      this.lastCloudX[lane] = spawnX;
    }
  }

  /**
   * Найти лучшую полосу для спавна облака
   * Выбирает полосу с наименьшим количеством активных облаков
   *
   * Анти-кластеризация:
   * Если все полосы имеют одинаковое количество облаков, выбирается случайная.
   * Это предотвращает скопление облаков на одной полосе.
   *
   * @returns {number} Номер полосы (0, 1, 2)
   */
  getBestLane() {
    const activeClouds = this.pool.getActiveObjects();
    const laneCounts = Array(CONFIG.LANES.TOTAL).fill(0);

    // Подсчитываем количество облаков на каждой полосе
    for (const cloud of activeClouds) {
      if (cloud.isActive()) {
        laneCounts[cloud.lane]++;
      }
    }

    // Находим полосы с минимальным количеством облаков
    let minCount = Math.min(...laneCounts);
    const bestLanes = [];

    for (let i = 0; i < CONFIG.LANES.TOTAL; i++) {
      if (laneCounts[i] === minCount) {
        bestLanes.push(i);
      }
    }

    // Если несколько полос с одинаковым минимумом, выбираем случайную
    return bestLanes[MathUtils.randomInt(0, bestLanes.length - 1)];
  }

  /**
   * Проверить, можно ли спавнить облако на заданной полосе
   * Проверяет расстояние до всех активных облаков на этой полосе
   *
   * @param {number} lane - Номер полосы (0, 1, 2)
   * @returns {boolean} true, если можно спавнить
   */
  canSpawnOnLane(lane) {
    const activeClouds = this.pool.getActiveObjects();
    const spawnX = CONFIG.CANVAS_WIDTH;

    for (const cloud of activeClouds) {
      // Проверяем только облака на этой же полосе
      if (!cloud.isActive() || cloud.lane !== lane) continue;

      const cloudX = cloud.getSprite().x;
      const distance = Math.abs(cloudX - spawnX);

      // Если облако слишком близко к точке спавна - нельзя спавнить
      if (distance < this.MIN_CLOUD_DISTANCE) {
        return false;
      }
    }

    return true;
  }

  /**
   * Сброс состояния
   */
  reset() {
    super.reset();
    this.lastCloudX = [0, 0, 0];
  }

  /**
   * Получить количество облаков на каждой полосе (для отладки)
   * @returns {number[]} [count_lane0, count_lane1, count_lane2]
   */
  getCloudDistribution() {
    const activeClouds = this.pool.getActiveObjects();
    const laneCounts = [0, 0, 0];

    for (const cloud of activeClouds) {
      if (cloud.isActive()) {
        laneCounts[cloud.lane]++;
      }
    }

    return laneCounts;
  }
}
