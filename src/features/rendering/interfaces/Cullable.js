/**
 * Интерфейс для entities, поддерживающих culling (удаление за пределами viewport)
 *
 * Зачем: Объекты, ушедшие за левый край экрана, больше не нужны.
 * Culling возвращает их в пул для переиспользования → экономия памяти + стабильный FPS.
 *
 * Принципы SOLID:
 * - ISP (Interface Segregation): Минимальный интерфейс - только проверка и деактивация
 * - OCP (Open/Closed): Новые entity типы могут имплементировать без изменения CullingManager
 * - DIP (Dependency Inversion): CullingManager зависит от этой абстракции, а не конкретных классов
 *
 * @example
 * class Obstacle extends Cullable {
 *   shouldCull(threshold) {
 *     return this.isActive() && this.currentX < threshold;
 *   }
 *
 *   deactivate() {
 *     this.active = false;
 *     this.sprite.visible = false;
 *   }
 * }
 */
export class Cullable {
  /**
   * Проверяет, должен ли объект быть удален (culled)
   *
   * @param {number} threshold - X координата порога (обычно -200 для left edge)
   * @returns {boolean} true если объект должен быть удален
   *
   * @example
   * // Удаляем объекты, которые ушли за левый край на 200px
   * if (entity.shouldCull(-200)) {
   *   entity.deactivate();
   * }
   */
  shouldCull(threshold) {
    throw new Error('shouldCull() must be implemented by subclass');
  }

  /**
   * Деактивирует объект и возвращает его в пул
   *
   * Должен:
   * 1. Установить флаг active = false
   * 2. Скрыть спрайт (sprite.visible = false)
   * 3. Сбросить любое специфичное состояние
   *
   * @example
   * deactivate() {
   *   this.active = false;
   *   this.sprite.visible = false;
   *   // Сброс специфичного состояния
   *   this.velocityX = 0;
   * }
   */
  deactivate() {
    throw new Error('deactivate() must be implemented by subclass');
  }

  /**
   * Проверяет, активен ли объект
   *
   * @returns {boolean} true если объект активен
   */
  isActive() {
    throw new Error('isActive() must be implemented by subclass');
  }
}
