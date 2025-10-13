/**
 * Управляет interpolation для всех движущихся объектов
 *
 * Зачем: На 120Hz мониторе рендер вызывается 2 раза между physics updates (60 UPS).
 * Без interpolation объекты визуально "прыгают" между дискретными позициями.
 * Interpolation создает плавное движение между physics frames.
 *
 * Принципы SOLID:
 * - SRP: Только координация interpolation, не знает о конкретных entity типах
 * - OCP: Работает с любыми Interpolatable entities через интерфейс
 * - DIP: Зависит от абстракции (Interpolatable), а не конкретных классов
 *
 * @example
 * const manager = new InterpolationManager();
 *
 * // В physics update (60 UPS):
 * manager.saveStates([obstacles, coins, [player]]);
 * // ... обновляем физику ...
 *
 * // В render (120+ FPS):
 * manager.interpolate(alpha, [obstacles, coins, [player]]);
 */
export class InterpolationManager {
  constructor() {
    // Статистика для дебага
    this.stats = {
      totalInterpolated: 0,
      lastInterpolated: 0,
      lastAlpha: 0
    };

    this.enabled = true;
  }

  /**
   * Сохраняет состояние всех entities перед physics update
   *
   * Вызывается В НАЧАЛЕ каждого physics update (60 UPS), перед изменением позиций.
   * Сохраняет текущие позиции как "предыдущие" для последующей интерполяции.
   *
   * @param {Interpolatable[][]} entityGroups - Группы entities (obstacles, coins, etc)
   *
   * @example
   * update(deltaTime) {
   *   // Сохраняем состояние ДО изменения позиций
   *   this.interpolationManager.saveStates([
   *     this.spawnSystem.getActiveObstacles(),
   *     this.spawnSystem.getActiveCoins(),
   *     [this.player]
   *   ]);
   *
   *   // Теперь обновляем физику
   *   this.player.update(deltaTime);
   *   this.spawnSystem.update(deltaTime, ...);
   * }
   */
  saveStates(entityGroups) {
    if (!this.enabled) return;

    for (const group of entityGroups) {
      if (!group || !Array.isArray(group)) continue;

      for (const entity of group) {
        // Проверяем, что entity активен и имеет метод saveState
        if (entity && entity.saveState) {
          // Для entities с isActive() проверяем активность
          if (entity.isActive && !entity.isActive()) continue;

          entity.saveState();
        }
      }
    }
  }

  /**
   * Интерполирует позиции всех entities при рендере
   *
   * Вызывается при каждом render (120+ FPS) с alpha = прогресс между physics frames.
   *
   * @param {number} alpha - 0.0 (начало physics frame) до 1.0 (конец)
   * @param {Interpolatable[][]} entityGroups - Группы entities
   *
   * @example
   * render(alpha) {
   *   // alpha = 0.0 → показываем previous позиции
   *   // alpha = 0.5 → показываем середину между previous и current
   *   // alpha = 1.0 → показываем current позиции
   *
   *   this.interpolationManager.interpolate(alpha, [
   *     this.spawnSystem.getActiveObstacles(),
   *     this.spawnSystem.getActiveCoins(),
   *     [this.player]
   *   ]);
   * }
   */
  interpolate(alpha, entityGroups) {
    if (!this.enabled) return;

    let interpolated = 0;

    for (const group of entityGroups) {
      if (!group || !Array.isArray(group)) continue;

      for (const entity of group) {
        // Проверяем, что entity активен и имеет метод interpolate
        if (entity && entity.interpolate) {
          // Для entities с isActive() проверяем активность
          if (entity.isActive && !entity.isActive()) continue;

          entity.interpolate(alpha);
          interpolated++;
        }
      }
    }

    // Обновляем статистику
    this.stats.totalInterpolated += interpolated;
    this.stats.lastInterpolated = interpolated;
    this.stats.lastAlpha = alpha;
  }

  /**
   * Сохраняет состояние И интерполирует одним вызовом
   *
   * Удобный метод для специальных случаев, где нужны обе операции.
   * Обычно не используется, т.к. saveStates и interpolate вызываются в разных местах.
   *
   * @param {number} alpha
   * @param {Interpolatable[][]} entityGroups
   */
  saveAndInterpolate(alpha, entityGroups) {
    this.saveStates(entityGroups);
    this.interpolate(alpha, entityGroups);
  }

  /**
   * Включить/выключить interpolation
   *
   * Полезно для дебага: выключить interpolation чтобы увидеть "чистые" physics позиции.
   *
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Проверить, включена ли interpolation
   *
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Получить статистику interpolation
   *
   * @returns {{ totalInterpolated: number, lastInterpolated: number, lastAlpha: number }}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Сбросить статистику
   */
  resetStats() {
    this.stats.totalInterpolated = 0;
    this.stats.lastInterpolated = 0;
    this.stats.lastAlpha = 0;
  }
}
