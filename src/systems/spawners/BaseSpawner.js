/**
 * BaseSpawner - Абстрактный базовый класс для всех spawner'ов
 *
 * Реализует Template Method Pattern:
 * - Определяет общий алгоритм спавна (таймер + вызов метода spawn)
 * - Подклассы переопределяют только специфичную логику
 *
 * Преимущества:
 * - Устраняет дублирование кода таймеров
 * - Обеспечивает единообразный API
 * - Упрощает добавление новых типов объектов
 */
export default class BaseSpawner {
  /**
   * @param {Object} config - Конфигурация spawner'а
   * @param {EntityPool} config.pool - Пул объектов для спавна
   * @param {PIXI.Container} config.stage - Контейнер для добавления объектов
   * @param {number} config.baseInterval - Базовый интервал между спавнами (мс)
   * @param {Function} [config.getIntervalModifier] - Функция для динамического изменения интервала
   */
  constructor({ pool, stage, baseInterval, getIntervalModifier = null }) {
    if (this.constructor === BaseSpawner) {
      throw new Error('BaseSpawner is abstract and cannot be instantiated directly');
    }

    this.pool = pool;
    this.stage = stage;
    this.baseInterval = baseInterval;
    this.getIntervalModifier = getIntervalModifier;

    this.timer = 0;
    this.enabled = true;
  }

  /**
   * Основной метод обновления (Template Method)
   * Управляет таймером и вызывает spawn() в нужный момент
   *
   * @param {number} deltaTime - Время с последнего кадра (секунды)
   * @param {number} gameSpeed - Текущая скорость игры
   * @param {Object} context - Дополнительный контекст (состояние игры, и т.д.)
   */
  update(deltaTime, gameSpeed, context = {}) {
    if (!this.enabled) return;

    this.timer += deltaTime * 1000; // Конвертируем в миллисекунды

    const currentInterval = this.getCurrentInterval(context);

    if (this.timer >= currentInterval) {
      this.timer = 0;
      this.spawn(gameSpeed, context);
    }

    // Обновляем все активные объекты в пуле
    this.updateActiveObjects(deltaTime, gameSpeed, context);
  }

  /**
   * Получить текущий интервал с учетом модификаторов
   * @param {Object} context - Контекст игры
   * @returns {number} Интервал в миллисекундах
   */
  getCurrentInterval(context) {
    if (this.getIntervalModifier) {
      const modifier = this.getIntervalModifier(context);
      return this.baseInterval * modifier;
    }
    return this.baseInterval;
  }

  /**
   * Обновить все активные объекты в пуле
   * @param {number} deltaTime - Время с последнего кадра
   * @param {number} gameSpeed - Текущая скорость игры
   * @param {Object} context - Контекст игры
   */
  updateActiveObjects(deltaTime, gameSpeed, context) {
    const objects = this.pool.getActiveObjects();

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];

      // Обновляем объект
      obj.update(deltaTime, gameSpeed);

      // Возвращаем в пул если вышел за экран
      if (this.shouldRecycle(obj, context)) {
        this.pool.release(obj);
      }
    }
  }

  /**
   * Проверка, нужно ли вернуть объект в пул
   * Переопределяется в подклассах при необходимости
   *
   * @param {Object} obj - Объект для проверки
   * @param {Object} context - Контекст игры
   * @returns {boolean}
   */
  shouldRecycle(obj, context) {
    // По умолчанию проверяем только isActive()
    return !obj.isActive();
  }

  /**
   * Логика спавна (должна быть переопределена в подклассах)
   * @abstract
   * @param {number} gameSpeed - Текущая скорость игры
   * @param {Object} context - Контекст игры
   */
  spawn(gameSpeed, context) {
    throw new Error('spawn() must be implemented by subclass');
  }

  /**
   * Включить spawner
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Выключить spawner (перестает спавнить новые объекты)
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Очистить все активные объекты и сбросить таймер
   */
  reset() {
    this.timer = 0;
    this.pool.releaseAll();
  }

  /**
   * Получить статистику пула
   * @returns {Object}
   */
  getStats() {
    return {
      active: this.pool.getActiveCount(),
      pooled: this.pool.getPooledCount(),
      total: this.pool.getTotalCount()
    };
  }

  /**
   * Получить все активные объекты
   * @returns {Array}
   */
  getActiveObjects() {
    return this.pool.getActiveObjects();
  }
}
