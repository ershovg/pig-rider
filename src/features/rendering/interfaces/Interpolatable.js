/**
 * Базовый класс для entities с поддержкой interpolation
 *
 * Зачем: На 120Hz мониторе render вызывается 2 раза между physics updates (60 UPS).
 * Interpolation делает движение визуально плавным между этими кадрами.
 *
 * Принципы SOLID:
 * - ISP (Interface Segregation): Минимальный интерфейс - только методы для interpolation
 * - SRP (Single Responsibility): Отвечает только за хранение состояний и интерполяцию
 *
 * @example
 * class MyEntity extends Interpolatable {
 *   update(deltaTime) {
 *     this.saveState();  // В начале physics update
 *     this.currentX += velocity * deltaTime;
 *   }
 * }
 *
 * // В render loop:
 * entity.interpolate(alpha); // alpha = 0.0 to 1.0
 */
export class Interpolatable {
  constructor() {
    // Предыдущее состояние (из прошлого physics frame)
    this.previousX = 0;
    this.previousY = 0;

    // Текущее состояние (из последнего physics frame)
    this.currentX = 0;
    this.currentY = 0;
  }

  /**
   * Сохраняет текущее состояние как "предыдущее"
   *
   * Вызывается В НАЧАЛЕ каждого physics update, перед изменением currentX/Y
   *
   * @example
   * update(deltaTime) {
   *   this.saveState();  // Сохраняем перед изменением
   *   this.currentX += velocity * deltaTime;  // Теперь меняем
   * }
   */
  saveState() {
    this.previousX = this.currentX;
    this.previousY = this.currentY;
  }

  /**
   * Интерполирует позицию спрайта между previous и current
   *
   * Вызывается при каждом render с alpha = прогресс между physics frames
   *
   * @param {number} alpha - 0.0 (начало) до 1.0 (следующий physics frame)
   *
   * @example
   * Если physics работает на 60 UPS, а рендер на 120 FPS:
   * - alpha = 0.0  → показываем previousX (начало physics frame)
   * - alpha = 0.5  → показываем середину между previous и current
   * - alpha = 1.0  → показываем currentX (конец physics frame)
   *
   * Формула: lerp(a, b, t) = a + (b - a) * t
   */
  interpolate(alpha) {
    if (!this.sprite) return;

    // Линейная интерполяция позиций
    this.sprite.x = this.previousX + (this.currentX - this.previousX) * alpha;
    this.sprite.y = this.previousY + (this.currentY - this.previousY) * alpha;
  }

  /**
   * Синхронизирует sprite позицию с физической (без interpolation)
   *
   * Используется при резких изменениях (телепорт, reset) когда interpolation не нужна
   */
  syncSpriteToPhysics() {
    if (!this.sprite) return;
    this.sprite.x = this.currentX;
    this.sprite.y = this.currentY;
    this.previousX = this.currentX;
    this.previousY = this.currentY;
  }
}
