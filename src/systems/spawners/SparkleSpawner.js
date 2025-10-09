import BaseSpawner from './BaseSpawner.js';

/**
 * SparkleSpawner - Отвечает за спавн визуальных эффектов при сборе монет
 *
 * Особенность:
 * Это НЕ автоматический spawner - он не работает по таймеру.
 * Вместо этого он предоставляет метод emit() для ручного спавна эффектов.
 *
 * Использование:
 * sparkleSpawner.emit(x, y); // При сборе монеты
 */
export default class SparkleSpawner extends BaseSpawner {
  /**
   * @param {Object} config
   * @param {ObjectPool} config.pool - Пул sparkle эффектов
   * @param {PIXI.Container} config.stage - Сцена
   */
  constructor(config) {
    super({
      pool: config.pool,
      stage: config.stage,
      baseInterval: Infinity, // Не используем автоматический спавн
      getIntervalModifier: null
    });

    // Отключаем автоматический спавн
    this.disable();
  }

  /**
   * Этот spawner не использует автоматический спавн
   * Метод переопределен, чтобы ничего не делать
   */
  spawn(gameSpeed, context = {}) {
    // Sparkles спавнятся только вручную через emit()
  }

  /**
   * Испустить эффект sparkle в заданной позиции
   * Вызывается при сборе монеты
   *
   * @param {number} x - X-координата эффекта
   * @param {number} y - Y-координата эффекта
   */
  emit(x, y) {
    const sparkle = this.pool.acquire();
    if (sparkle) {
      sparkle.activate(x, y);
    }
  }

  /**
   * Переопределяем update, чтобы только обновлять активные sparkles
   * без автоматического спавна
   */
  update(deltaTime, gameSpeed, context = {}) {
    // Обновляем только активные объекты, без спавна новых
    this.updateActiveObjects(deltaTime, gameSpeed, context);
  }
}
