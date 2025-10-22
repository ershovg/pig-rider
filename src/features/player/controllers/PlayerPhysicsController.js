/**
 * Управляет физикой плавного движения игрока между полосами.
 * Использует физическую модель с ускорением, торможением и ease-out эффектом.
 */
export class PlayerPhysicsController {
  /**
   * @param {Object} config - Конфигурация физики
   * @param {number} [config.maxSpeed=3000] - Максимальная скорость (px/s)
   * @param {number} [config.acceleration=12000] - Ускорение (px/s²)
   * @param {number} [config.friction=0.85] - Коэффициент торможения (0-1)
   * @param {number} [config.brakeDistance=50] - Дистанция начала торможения (px)
   * @param {number} [config.directionChangeDamping=0.5] - Гашение скорости при смене направления (0-1)
   * @param {number} [config.minBrakeFactor=0.5] - Минимальный коэффициент торможения у цели (0-1)
   * @param {number} [config.maxDeltaTime=0.05] - Максимальный deltaTime для стабильности (секунды)
   */
  constructor(config = {}) {
    // Физические константы
    this.maxSpeed = config.maxSpeed || 3000;
    this.acceleration = config.acceleration || 12000;
    this.friction = config.friction || 0.85;
    this.brakeDistance = config.brakeDistance || 50;
    this.directionChangeDamping = config.directionChangeDamping || 0.5;
    this.minBrakeFactor = config.minBrakeFactor || 0.5;
    this.maxDeltaTime = config.maxDeltaTime || 0.05; // Защита от lag spikes

    // Состояние движения
    this.currentY = 0;
    this.velocityY = 0;
    this.targetY = null; // null = нет активной цели (стоим на месте)
    this.arrivalThreshold = 1;
  }

  /**
   * Установить новую целевую позицию (Y-координата полосы)
   * @param {number} targetY - Целевая Y-координата
   */
  setTarget(targetY) {
    this.targetY = targetY;

    // Гасим скорость при смене направления для плавного разворота
    const currentDirection = Math.sign(this.velocityY);
    const newDirection = Math.sign(targetY - this.currentY);

    if (currentDirection !== 0 && newDirection !== 0 && currentDirection !== newDirection) {
      this.velocityY *= this.directionChangeDamping;
    }
  }

  /**
   * Обновить физику движения (вызывается каждый кадр)
   * @param {number} deltaTime - Время с предыдущего кадра (секунды)
   * @returns {{y: number, isMoving: boolean, distance: number}} Текущее состояние
   */
  update(deltaTime) {
    if (this.targetY === null) {
      return { y: this.currentY, isMoving: false, distance: 0 };
    }

    // Защита от lag spikes (ограничиваем deltaTime)
    const safeDeltaTime = Math.min(deltaTime, this.maxDeltaTime);

    const distance = this.targetY - this.currentY;
    const absDistance = Math.abs(distance);

    // Достигли цели?
    if (absDistance < this.arrivalThreshold) {
      this.currentY = this.targetY;
      this.targetY = null;
      this.velocityY = 0;
      return { y: this.currentY, isMoving: false, distance: 0 };
    }

    const direction = Math.sign(distance); // -1 = вверх, +1 = вниз

    // Ускорение
    this.velocityY += direction * this.acceleration * safeDeltaTime;

    // Ограничение максимальной скорости
    const maxSpeedDelta = this.maxSpeed * safeDeltaTime;
    this.velocityY = Math.max(-maxSpeedDelta, Math.min(maxSpeedDelta, this.velocityY));

    // Торможение при приближении к цели (ease-out эффект)
    if (absDistance < this.brakeDistance) {
      const brakeFactor = absDistance / this.brakeDistance; // 0.0 (у цели) → 1.0 (далеко)
      const dampingCurve = this.minBrakeFactor + brakeFactor * (1 - this.minBrakeFactor);
      this.velocityY *= this.friction * dampingCurve;
    }

    // Обновление позиции
    this.currentY += this.velocityY;

    // Защита от проскакивания цели
    const overshot = Math.sign(this.currentY - this.targetY) === direction;

    if (overshot) {
      this.currentY = this.targetY;
      this.targetY = null;
      this.velocityY = 0;
      return { y: this.currentY, isMoving: false, distance: 0 };
    }

    return { y: this.currentY, isMoving: true, distance: absDistance };
  }

  /**
   * Сбросить состояние контроллера
   * @param {number} initialY - Начальная позиция
   */
  reset(initialY) {
    this.currentY = initialY;
    this.targetY = null;
    this.velocityY = 0;
  }

  /**
   * Проверить, движется ли сейчас
   * @returns {boolean}
   */
  isMoving() {
    return this.targetY !== null;
  }

  /**
   * Получить текущую позицию
   * @returns {number}
   */
  getPosition() {
    return this.currentY;
  }

  /**
   * Получить текущую скорость
   * @returns {number}
   */
  getVelocity() {
    return this.velocityY;
  }

  /**
   * Получить целевую позицию
   * @returns {number|null}
   */
  getTarget() {
    return this.targetY;
  }

  /**
   * Мгновенно переместить в позицию (без анимации)
   * @param {number} y - Целевая позиция
   */
  teleport(y) {
    this.currentY = y;
    this.targetY = null;
    this.velocityY = 0;
  }

  /**
   * Обновить параметры физики в runtime
   * @param {Object} params - Новые параметры (частичные)
   */
  updateParams(params) {
    if (params.maxSpeed !== undefined) {
      if (params.maxSpeed <= 0) {
        console.warn('[PlayerPhysicsController] maxSpeed должен быть > 0, игнорируется');
      } else {
        this.maxSpeed = params.maxSpeed;
      }
    }

    if (params.acceleration !== undefined) {
      if (params.acceleration <= 0) {
        console.warn('[PlayerPhysicsController] acceleration должен быть > 0, игнорируется');
      } else {
        this.acceleration = params.acceleration;
      }
    }

    if (params.friction !== undefined) {
      if (params.friction < 0 || params.friction > 1) {
        console.warn('[PlayerPhysicsController] friction должен быть 0-1, игнорируется');
      } else {
        this.friction = params.friction;
      }
    }

    if (params.brakeDistance !== undefined) {
      if (params.brakeDistance < 0) {
        console.warn('[PlayerPhysicsController] brakeDistance должен быть >= 0, игнорируется');
      } else {
        this.brakeDistance = params.brakeDistance;
      }
    }

    if (params.directionChangeDamping !== undefined) {
      if (params.directionChangeDamping < 0 || params.directionChangeDamping > 1) {
        console.warn('[PlayerPhysicsController] directionChangeDamping должен быть 0-1, игнорируется');
      } else {
        this.directionChangeDamping = params.directionChangeDamping;
      }
    }

    if (params.minBrakeFactor !== undefined) {
      if (params.minBrakeFactor < 0 || params.minBrakeFactor > 1) {
        console.warn('[PlayerPhysicsController] minBrakeFactor должен быть 0-1, игнорируется');
      } else {
        this.minBrakeFactor = params.minBrakeFactor;
      }
    }

    if (params.maxDeltaTime !== undefined) {
      if (params.maxDeltaTime <= 0) {
        console.warn('[PlayerPhysicsController] maxDeltaTime должен быть > 0, игнорируется');
      } else {
        this.maxDeltaTime = params.maxDeltaTime;
      }
    }
  }
}
