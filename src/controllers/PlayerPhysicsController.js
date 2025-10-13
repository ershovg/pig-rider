import { CONFIG } from '../config/constants.js';

/**
 * Управляет физикой движения игрока между полосами
 *
 * Зачем: Отделение физики от рендеринга и input handling.
 * Physics-based движение создает более естественный game feel, чем time-based tweens (GSAP).
 *
 * Преимущества над GSAP:
 * - Синхронизация с physics loop (60 UPS)
 * - Мгновенная реакция на смену направления (нет блокировки)
 * - Плавное торможение при приближении к цели
 * - Полный контроль через параметры (acceleration, friction)
 * - Меньше CPU (1 calculation/frame vs GSAP ticker)
 *
 * Принципы SOLID:
 * - SRP: Только physics calculations, без рендера и input handling
 * - OCP: Параметры настраиваются через config, легко менять behavior
 * - LSP: Может быть заменен другими physics моделями (spring, easing, etc)
 *
 * @example
 * const physics = new PlayerPhysicsController(CONFIG.PLAYER.PHYSICS);
 *
 * // Input controller:
 * physics.setTarget(CONFIG.LANES.Y_POSITIONS[1]);
 *
 * // В game loop (60 UPS):
 * const result = physics.update(deltaTime);
 * player.currentY = result.y;
 * if (!result.isMoving) { console.log('Reached target!'); }
 */
export class PlayerPhysicsController {
  /**
   * @param {Object} config - Конфигурация физики
   * @param {number} config.maxSpeed - Максимальная скорость (px/s)
   * @param {number} config.acceleration - Ускорение (px/s²)
   * @param {number} config.friction - Коэффициент торможения (0-1)
   * @param {number} config.brakeDistance - Дистанция начала торможения (px)
   */
  constructor(config) {
    // Параметры физики
    this.maxSpeed = config.maxSpeed || 3000;
    this.acceleration = config.acceleration || 12000;
    this.friction = config.friction || 0.85;
    this.brakeDistance = config.brakeDistance || 50;

    // Текущее состояние
    this.currentY = 0;
    this.velocityY = 0;
    this.targetY = null;

    // Порог "достижения цели" (px) - меньше = точнее, но может дрожать
    this.arrivalThreshold = 1;
  }

  /**
   * Устанавливает новую целевую позицию
   *
   * Можно вызывать в любой момент, даже во время движения.
   * Направление изменится мгновенно без блокировки.
   *
   * @param {number} targetY - Целевая Y координата
   *
   * @example
   * // Игрок нажал "вверх" во время движения вниз
   * physics.setTarget(CONFIG.LANES.Y_POSITIONS[0]);
   * // Направление изменится на следующем update()
   */
  setTarget(targetY) {
    this.targetY = targetY;

    // Если новая цель в противоположном направлении, сбрасываем velocity
    // для более резкого отклика (опционально)
    const currentDirection = Math.sign(this.velocityY);
    const newDirection = Math.sign(targetY - this.currentY);

    if (currentDirection !== 0 && newDirection !== 0 && currentDirection !== newDirection) {
      // Уменьшаем velocity для более быстрого разворота
      this.velocityY *= 0.5;
    }
  }

  /**
   * Обновляет физику движения
   *
   * Вызывается в каждом physics update (60 UPS).
   * Возвращает новую Y позицию и статус движения.
   *
   * @param {number} deltaTime - Время с прошлого update (секунды)
   * @returns {{ y: number, isMoving: boolean, distance: number }}
   *
   * @example
   * update(deltaTime) {
   *   const result = this.physicsController.update(deltaTime);
   *   this.currentY = result.y;
   *
   *   if (!result.isMoving) {
   *     console.log('Player reached target lane');
   *   }
   * }
   */
  update(deltaTime) {
    // Нет цели = не двигаемся
    if (this.targetY === null) {
      return {
        y: this.currentY,
        isMoving: false,
        distance: 0
      };
    }

    const distance = this.targetY - this.currentY;
    const absDistance = Math.abs(distance);

    // Достигли цели?
    if (absDistance < this.arrivalThreshold) {
      this.currentY = this.targetY;
      this.targetY = null;
      this.velocityY = 0;

      return {
        y: this.currentY,
        isMoving: false,
        distance: 0
      };
    }

    // Направление движения (-1 = вверх, +1 = вниз)
    const direction = Math.sign(distance);

    // Применяем ускорение
    const accelerationDelta = direction * this.acceleration * deltaTime;
    this.velocityY += accelerationDelta;

    // Ограничиваем максимальную скорость
    const maxSpeedDelta = this.maxSpeed * deltaTime;
    this.velocityY = Math.max(-maxSpeedDelta, Math.min(maxSpeedDelta, this.velocityY));

    // Торможение при приближении к цели (для плавной остановки)
    if (absDistance < this.brakeDistance) {
      const brakeFactor = absDistance / this.brakeDistance; // 0.0 to 1.0
      this.velocityY *= this.friction * (0.5 + brakeFactor * 0.5); // Прогрессивное торможение
    }

    // Обновляем позицию
    this.currentY += this.velocityY;

    // Предотвращаем проскакивание цели
    const overshot = (direction > 0 && this.currentY > this.targetY) ||
                     (direction < 0 && this.currentY < this.targetY);

    if (overshot) {
      this.currentY = this.targetY;
      this.targetY = null;
      this.velocityY = 0;

      return {
        y: this.currentY,
        isMoving: false,
        distance: 0
      };
    }

    return {
      y: this.currentY,
      isMoving: true,
      distance: absDistance
    };
  }

  /**
   * Сброс состояния физики
   *
   * @param {number} initialY - Начальная Y позиция
   */
  reset(initialY) {
    this.currentY = initialY;
    this.targetY = null;
    this.velocityY = 0;
  }

  /**
   * Проверить, движется ли игрок
   *
   * @returns {boolean}
   */
  isMoving() {
    return this.targetY !== null;
  }

  /**
   * Получить текущую позицию
   *
   * @returns {number}
   */
  getPosition() {
    return this.currentY;
  }

  /**
   * Получить текущую скорость
   *
   * @returns {number}
   */
  getVelocity() {
    return this.velocityY;
  }

  /**
   * Получить целевую позицию
   *
   * @returns {number|null}
   */
  getTarget() {
    return this.targetY;
  }

  /**
   * Мгновенная телепортация (без физики)
   *
   * Используется для reset или специальных механик.
   *
   * @param {number} y - Новая Y позиция
   */
  teleport(y) {
    this.currentY = y;
    this.targetY = null;
    this.velocityY = 0;
  }

  /**
   * Обновить параметры физики на лету
   *
   * Полезно для power-ups или изменения game feel.
   *
   * @param {Object} params - Новые параметры
   */
  updateParams(params) {
    if (params.maxSpeed !== undefined) this.maxSpeed = params.maxSpeed;
    if (params.acceleration !== undefined) this.acceleration = params.acceleration;
    if (params.friction !== undefined) this.friction = params.friction;
    if (params.brakeDistance !== undefined) this.brakeDistance = params.brakeDistance;
  }
}
