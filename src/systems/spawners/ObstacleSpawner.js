import { BaseSpawner } from './BaseSpawner.js';
import { CONFIG } from '../../config/constants.js';
import { MathUtils } from '../../utils/MathUtils.js';
import { ObstaclePatternLibrary } from '../patterns/ObstaclePatternLibrary.js';

/**
 * ObstacleSpawner - Отвечает за спавн препятствий используя Pattern-Based подход
 *
 * Архитектурное изменение (v2.0):
 * Переход с runtime validation на pre-validated patterns для 100% гарантии проходимости.
 *
 * Ключевые особенности:
 * - Использует ObstaclePatternLibrary с предопределенными безопасными паттернами
 * - Каждый паттерн ГАРАНТИРОВАННО оставляет минимум 1 свободную полосу
 * - Weighted random selection с anti-repetition механизмом
 * - Difficulty scaling через выбор паттернов разной сложности
 *
 * Паттерн: Strategy + Registry (через PatternLibrary)
 *
 * Преимущества перед старым подходом:
 * - Устранены race conditions в runtime проверках
 * - 100% гарантия проходимости (не может заблокировать все полосы)
 * - Более предсказуемый game feel
 * - Меньше кода, проще поддержка
 */
export class ObstacleSpawner extends BaseSpawner {
  /**
   * @param {Object} config
   * @param {ObjectPool} config.pool - Пул препятствий
   * @param {PIXI.Container} config.stage - Сцена
   * @param {Function} config.getIntervalModifier - Функция для получения модификатора интервала
   * @param {PIXI.Texture[]} config.textures - Массив текстур для препятствий
   */
  constructor(config) {
    super({
      pool: config.pool,
      stage: config.stage,
      baseInterval: CONFIG.OBSTACLE.MIN_DISTANCE, // Базовый интервал
      getIntervalModifier: config.getIntervalModifier
    });

    // Pattern library для выбора безопасных комбинаций
    this.patternLibrary = new ObstaclePatternLibrary();

    // Отслеживаем глобальную позицию последнего спавна (любой полосы)
    // Используется для расчета следующей позиции паттерна
    this.lastPatternX = 0;

    // 🆕 Текстуры для рандомизации препятствий
    this.textures = config.textures || [];

    // 🆕 Начальная задержка для первого спавна
    // Положительное значение предотвращает мгновенный спавн при старте
    this.timer = 200; // Небольшая задержка 200ms перед первым препятствием
  }

  /**
   * Выбор случайной текстуры с весами
   * Соотношение: 30% base (obstacleBase), 70% large (obstacleLarge)
   *
   * @returns {PIXI.Texture} Выбранная текстура
   */
  getRandomTexture() {
    if (this.textures.length === 0) return null;
    if (this.textures.length === 1) return this.textures[0];

    // Weighted random: 30% первая текстура (base), 70% вторая (large)
    const random = Math.random();
    return random < 0.3 ? this.textures[0] : this.textures[1];
  }

  /**
   * Логика спавна препятствий (Pattern-Based)
   *
   * Новый алгоритм (v2.0):
   * 1. Получаем текущую сложность игры (из gameSpeed)
   * 2. Выбираем безопасный паттерн из библиотеки (с учетом сложности)
   * 3. Рассчитываем базовую позицию спавна
   * 4. Спавним ВСЕ препятствия паттерна одновременно (атомарная операция)
   *
   * Ключевое отличие от старого подхода:
   * - Было: Спавнили 1 препятствие → проверяли полосы → надеялись что не блокируем все
   * - Стало: Выбираем готовый валидированный паттерн → спавним всю группу
   *
   * @param {number} gameSpeed - Текущая скорость игры (используется как difficulty)
   * @param {Object} context - Контекст игры
   */
  spawn(gameSpeed, context = {}) {
    // Используем gameSpeed как меру сложности
    // gameSpeed изменяется от CONFIG.GAME_SPEED (1.0) до CONFIG.MAX_SPEED (2.5)
    const currentDifficulty = gameSpeed || 1.0;

    // Выбираем паттерн из библиотеки (weighted random + anti-repetition)
    const pattern = this.patternLibrary.selectPattern(currentDifficulty);

    // Рассчитываем базовую позицию спавна
    const minDist = CONFIG.OBSTACLE.MIN_DISTANCE;
    const maxDist = CONFIG.OBSTACLE.MAX_DISTANCE;
    const distance = MathUtils.randomFloat(minDist, maxDist);

    // Базовая X позиция для паттерна (справа от экрана)
    const baseX = Math.max(
      CONFIG.CANVAS_WIDTH + distance,
      this.lastPatternX + distance
    );

    // Спавним все препятствия паттерна
    let spawnedCount = 0;
    for (let i = 0; i < pattern.lanes.length; i++) {
      const lane = pattern.lanes[i];

      // Рассчитываем X с учетом offset (если есть)
      const offset = (i === 1 && pattern.offset) ? pattern.offset : 0;
      const spawnX = baseX + offset;

      // 🆕 Выбираем случайную текстуру для каждого препятствия
      const texture = this.getRandomTexture();

      // Получаем препятствие из пула и активируем с выбранной текстурой
      const obstacle = this.pool.acquire();
      if (obstacle) {
        obstacle.activate(lane, spawnX, texture);
        spawnedCount++;
      }
    }

    // Обновляем позицию последнего паттерна
    // Используем максимальную X координату (с учетом offset)
    this.lastPatternX = baseX + (pattern.offset || 0);
  }

  /**
   * Получить свободные полосы (не заблокированные паттерном)
   * Utility метод для логирования
   *
   * @param {number[]} blockedLanes - Заблокированные полосы
   * @returns {number[]} Свободные полосы
   */
  getFreeLanes(blockedLanes) {
    return [0, 1, 2].filter(lane => !blockedLanes.includes(lane));
  }

  /**
   * Сброс состояния spawner'а
   * Вызывается при рестарте игры
   */
  reset() {
    super.reset();

    // Сбрасываем позицию последнего паттерна
    this.lastPatternX = 0;

    // Сбрасываем историю паттернов в библиотеке
    this.patternLibrary.reset();
  }

  /**
   * Очистить все препятствия (например, при активации бустера)
   */
  clearAll() {
    this.pool.releaseAll();
    this.lastPatternX = 0;
  }

  /**
   * Получить препятствия на конкретной полосе (для отладки)
   * @param {number} lane - Номер полосы (0, 1, 2)
   * @returns {Array}
   */
  getObstaclesInLane(lane) {
    return this.getActiveObjects().filter(obstacle => obstacle.lane === lane);
  }

  /**
   * Получить статистику паттернов (для отладки)
   * @returns {Object}
   */
  getPatternStats() {
    return this.patternLibrary.getStats();
  }
}
