/**
 * Управляет удалением объектов за пределами viewport
 *
 * Зачем: Объекты, ушедшие за левый край экрана, потребляют:
 * - Memory (хранятся в массивах)
 * - CPU (обрабатываются в update/render loops)
 * - Draw calls (рендерятся, даже если невидимы)
 *
 * Culling возвращает их в пул → константное потребление ресурсов.
 *
 * Принципы SOLID:
 * - SRP: Только culling логика, никакой другой ответственности
 * - OCP: Работает с любыми Cullable entities через интерфейс
 * - DIP: Зависит от абстракции (Cullable), а не конкретных классов
 *
 * @example
 * const manager = new CullingManager({ cullThreshold: -200 });
 *
 * // В game loop:
 * const result = manager.cullWithBudget(activeObstacles);
 * console.log(`Culled ${result.culled} obstacles`);
 */
export class CullingManager {
  /**
   * @param {Object} config - Конфигурация
   * @param {number} config.cullThreshold - X координата порога (px за левым краем) [DEPRECATED]
   * @param {number} config.leftMultiplier - Множитель для левой границы (0.15 = 15% за экраном)
   * @param {number} config.rightMultiplier - Множитель для правой границы (1.15 = 115% ширины)
   * @param {number} config.rendererWidth - Ширина renderer (для динамических границ)
   * @param {number} config.timeBudgetMs - Максимальное время на операцию (мс)
   */
  constructor(config = {}) {
    // Динамические boundaries (приоритет)
    this.leftMultiplier = config.leftMultiplier ?? 0.15;
    this.rightMultiplier = config.rightMultiplier ?? 1.15;
    this.rendererWidth = config.rendererWidth ?? 1920;

    // Вычисляем threshold на основе multiplier
    this.cullThreshold = -this.leftMultiplier * this.rendererWidth;

    this.timeBudgetMs = config.timeBudgetMs ?? 1;

    // Статистика для дебага
    this.stats = {
      totalCulled: 0,
      lastCulled: 0,
      budgetExceeded: 0
    };
  }

  /**
   * Установить динамические границы на основе размера renderer
   *
   * @param {number} rendererWidth - Ширина канваса
   * @param {number} [leftMultiplier] - Опциональный новый multiplier
   * @param {number} [rightMultiplier] - Опциональный новый multiplier
   */
  setBoundaries(rendererWidth, leftMultiplier, rightMultiplier) {
    this.rendererWidth = rendererWidth;
    if (leftMultiplier !== undefined) this.leftMultiplier = leftMultiplier;
    if (rightMultiplier !== undefined) this.rightMultiplier = rightMultiplier;

    // Пересчитываем threshold
    this.cullThreshold = -this.leftMultiplier * this.rendererWidth;
  }

  /**
   * Получить текущие границы
   *
   * @returns {{ left: number, right: number, width: number }}
   */
  getBoundaries() {
    return {
      left: -this.leftMultiplier * this.rendererWidth,
      right: this.rightMultiplier * this.rendererWidth,
      width: this.rendererWidth
    };
  }

  /**
   * Culling с временным бюджетом (не блокирует frame)
   *
   * Используется для больших массивов объектов, где полная итерация
   * может занять > 16ms и вызвать frame drop.
   *
   * @param {Cullable[]} entities - Массив cullable entities
   * @param {ObjectPool} [pool] - Пул для возврата объектов (опционально)
   * @returns {{ culled: number, processed: number, timeMs: number }}
   *
   * @example
   * // Обрабатываем obstacles с бюджетом 1ms
   * const result = manager.cullWithBudget(activeObstacles, obstaclePool);
   * if (result.processed < activeObstacles.length) {
   *   console.warn('Budget exceeded, will continue next frame');
   * }
   */
  cullWithBudget(entities, pool = null) {
    const startTime = performance.now();
    let culled = 0;
    let processed = 0;

    // Итерируем с конца для безопасного удаления
    for (let i = entities.length - 1; i >= 0; i--) {
      processed++;

      // Проверяем бюджет каждые 10 объектов (оптимизация)
      if (processed % 10 === 0) {
        const elapsed = performance.now() - startTime;
        if (elapsed > this.timeBudgetMs) {
          this.stats.budgetExceeded++;
          break;
        }
      }

      const entity = entities[i];

      // Проверяем через интерфейс Cullable
      if (entity.shouldCull && entity.shouldCull(this.cullThreshold)) {
        entity.deactivate();

        // 🔥 ИСПРАВЛЕНИЕ УТЕЧКИ: Возвращаем объект в пул
        if (pool) {
          pool.release(entity);
        }

        culled++;
      }
    }

    const timeMs = performance.now() - startTime;

    // Обновляем статистику
    this.stats.totalCulled += culled;
    this.stats.lastCulled = culled;

    // 🆕 Возвращаем количество culled для Performance Monitor
    return culled;
  }

  /**
   * Немедленный culling всех объектов (игнорирует бюджет)
   *
   * Используется для декораций и других некритичных объектов,
   * где количество обычно небольшое.
   *
   * @param {Cullable[]} entities - Массив cullable entities
   * @param {ObjectPool} [pool] - Пул для возврата объектов (опционально)
   * @returns {{ culled: number }}
   *
   * @example
   * // Culling декораций каждые 5 frames
   * if (frameCount % 5 === 0) {
   *   manager.cullAll(clouds, cloudPool);
   *   manager.cullAll(stars, starPool);
   * }
   */
  cullAll(entities, pool = null) {
    let culled = 0;

    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];

      if (entity.shouldCull && entity.shouldCull(this.cullThreshold)) {
        entity.deactivate();

        // 🔥 ИСПРАВЛЕНИЕ УТЕЧКИ: Возвращаем объект в пул
        if (pool) {
          pool.release(entity);
        }

        culled++;
      }
    }

    this.stats.totalCulled += culled;
    this.stats.lastCulled = culled;

    // 🆕 Возвращаем количество culled для Performance Monitor
    return culled;
  }

  /**
   * Проверяет один объект на culling
   *
   * @param {Cullable} entity
   * @param {ObjectPool} [pool] - Пул для возврата объекта (опционально)
   * @returns {boolean} true если объект был culled
   */
  cullSingle(entity, pool = null) {
    if (entity.shouldCull && entity.shouldCull(this.cullThreshold)) {
      entity.deactivate();

      // 🔥 ИСПРАВЛЕНИЕ УТЕЧКИ: Возвращаем объект в пул
      if (pool) {
        pool.release(entity);
      }

      this.stats.totalCulled++;
      this.stats.lastCulled = 1;
      return true;
    }
    return false;
  }

  /**
   * Получить статистику culling
   *
   * @returns {{ totalCulled: number, lastCulled: number, budgetExceeded: number }}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Сбросить статистику
   */
  resetStats() {
    this.stats.totalCulled = 0;
    this.stats.lastCulled = 0;
    this.stats.budgetExceeded = 0;
  }

  /**
   * Обновить порог culling
   *
   * @param {number} threshold - Новый X порог
   */
  setThreshold(threshold) {
    this.cullThreshold = threshold;
  }

  /**
   * Обновить временной бюджет
   *
   * @param {number} budgetMs - Новый бюджет в мс
   */
  setTimeBudget(budgetMs) {
    this.timeBudgetMs = budgetMs;
  }
}
