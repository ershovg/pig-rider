/**
 * Координирует interpolation для плавного рендеринга на высоких частотах обновления.
 *
 * Создает плавное движение между physics updates (60 UPS) и render frames (120+ FPS).
 * Работает с любыми объектами, реализующими Interpolatable интерфейс.
 *
 * Interpolatable интерфейс:
 * - saveState(): void - сохранить текущую позицию
 * - interpolate(alpha: number): void - интерполировать с альфой [0, 1]
 * - isActive?(): boolean - опциональная проверка активности
 */
export class InterpolationManager {
  /**
   * Сохраняет текущие позиции entities перед physics update.
   * Вызывается ПЕРЕД обновлением физики в каждом physics frame.
   *
   * @param {Array<Array<Interpolatable>>} entityGroups - Группы entities для обработки
   */
  saveStates(entityGroups) {
    for (const group of entityGroups) {
      if (!Array.isArray(group)) continue;

      for (const entity of group) {
        if (entity?.saveState && (!entity.isActive || entity.isActive())) {
          entity.saveState();
        }
      }
    }
  }

  /**
   * Интерполирует визуальные позиции между physics frames.
   * Вызывается при каждом render с прогрессом текущего physics frame.
   *
   * @param {number} alpha - Прогресс между physics frames [0.0 = старт, 1.0 = конец]
   * @param {Array<Array<Interpolatable>>} entityGroups - Группы entities для обработки
   */
  interpolate(alpha, entityGroups) {
    for (const group of entityGroups) {
      if (!Array.isArray(group)) continue;

      for (const entity of group) {
        if (entity?.interpolate && (!entity.isActive || entity.isActive())) {
          entity.interpolate(alpha);
        }
      }
    }
  }
}
