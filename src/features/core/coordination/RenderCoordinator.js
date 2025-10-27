/**
 * RenderCoordinator
 *
 * Координирует рендеринг всех визуальных элементов игры.
 * Управляет интерполяцией для плавности движения между fixed timestep updates.
 *
 * Принципы:
 * - Single Responsibility: Только координация render логики
 * - Dependency Inversion: Получает SystemRegistry извне
 * - Performance: Использует interpolation для smooth rendering на любом FPS
 *
 * Как это работает:
 * - Update loop: фиксированный 60 FPS (16.67ms)
 * - Render loop: переменный FPS (зависит от монитора)
 * - Interpolation: сглаживает позиции объектов между update'ами
 *   используя alpha (прогресс между текущим и следующим update)
 */

import { CONFIG } from '../../../shared/config/constants.js';

export class RenderCoordinator {
  /**
   * @param {SystemRegistry} registry - Реестр систем
   */
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * Главный render loop игры
   * Вызывается GameLoop'ом каждый кадр (переменный FPS)
   *
   * @param {number} alpha - Прогресс между update'ами (0.0 - 1.0)
   *                        0.0 = начало текущего update
   *                        1.0 = начало следующего update
   *                        0.5 = ровно посередине между двумя update'ами
   */
  render(alpha) {
    // Проверка: интерполяция включена в конфиге
    if (!CONFIG.INTERPOLATION.ENABLED) return;

    // Интерполируем позиции всех движущихся объектов
    // Это создает плавное движение даже если update идет на фиксированном 60 FPS,
    // а монитор работает на 144 FPS или любой другой частоте
    this.registry.interpolationManager.interpolate(alpha, [
      this.registry.spawnSystem.getActiveObstacles(),  // Препятствия
      this.registry.spawnSystem.getActiveCoins(),      // Монеты
      this.registry.spawnSystem.getActiveBoosters(),   // Бустеры
      [this.registry.player]                           // Игрок
    ]);
  }

  /**
   * Опционально: добавить метод для будущих rendering effects
   * Например: post-processing, camera shake, screen flash и т.д.
   */
  applyEffects() {
    // Резервируем место для будущих визуальных эффектов
    // Примеры:
    // - Camera shake при столкновении
    // - Screen flash при сборе бустера
    // - Blur при паузе
    // - Glow при победе
  }
}
