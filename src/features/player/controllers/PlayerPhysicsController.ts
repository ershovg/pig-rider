interface PhysicsConfig {
  maxSpeed?: number;
  acceleration?: number;
  friction?: number;
  brakeDistance?: number;
  directionChangeDamping?: number;
  minBrakeFactor?: number;
  maxDeltaTime?: number;
  MAX_SPEED?: number;
  ACCELERATION?: number;
  FRICTION?: number;
  BRAKE_DISTANCE?: number;
}

interface PhysicsState {
  y: number;
  isMoving: boolean;
  distance: number;
}

export class PlayerPhysicsController {
  private readonly DEFAULT_MAX_SPEED = 3000;
  private readonly DEFAULT_ACCELERATION = 12000;
  private readonly DEFAULT_FRICTION = 0.85;
  private readonly DEFAULT_BRAKE_DISTANCE = 50;
  private readonly DEFAULT_DIRECTION_DAMPING = 0.5;
  private readonly DEFAULT_MIN_BRAKE_FACTOR = 0.5;
  private readonly DEFAULT_MAX_DELTA_TIME = 0.05;
  private readonly ARRIVAL_THRESHOLD = 1;

  private maxSpeed: number;
  private acceleration: number;
  private friction: number;
  private brakeDistance: number;
  private directionChangeDamping: number;
  private minBrakeFactor: number;
  private maxDeltaTime: number;

  private currentY: number;
  private velocityY: number;
  private targetY: number | null;
  private readonly arrivalThreshold: number;

  constructor(config: PhysicsConfig = {}) {
    this.maxSpeed = config.maxSpeed ?? config.MAX_SPEED ?? this.DEFAULT_MAX_SPEED;
    this.acceleration = config.acceleration ?? config.ACCELERATION ?? this.DEFAULT_ACCELERATION;
    this.friction = config.friction ?? config.FRICTION ?? this.DEFAULT_FRICTION;
    this.brakeDistance = config.brakeDistance ?? config.BRAKE_DISTANCE ?? this.DEFAULT_BRAKE_DISTANCE;
    this.directionChangeDamping = config.directionChangeDamping ?? this.DEFAULT_DIRECTION_DAMPING;
    this.minBrakeFactor = config.minBrakeFactor ?? this.DEFAULT_MIN_BRAKE_FACTOR;
    this.maxDeltaTime = config.maxDeltaTime ?? this.DEFAULT_MAX_DELTA_TIME;

    this.currentY = 0;
    this.velocityY = 0;
    this.targetY = null;
    this.arrivalThreshold = this.ARRIVAL_THRESHOLD;
  }

  setTarget(targetY: number): void {
    this.targetY = targetY;

    const currentDirection = Math.sign(this.velocityY);
    const newDirection = Math.sign(targetY - this.currentY);

    if (currentDirection !== 0 && newDirection !== 0 && currentDirection !== newDirection) {
      this.velocityY *= this.directionChangeDamping;
    }
  }

  update(deltaTime: number): PhysicsState {
    if (this.targetY === null) {
      return { y: this.currentY, isMoving: false, distance: 0 };
    }

    const safeDeltaTime = Math.min(deltaTime, this.maxDeltaTime);
    const distance = this.targetY - this.currentY;
    const absDistance = Math.abs(distance);

    if (absDistance < this.arrivalThreshold) {
      this.currentY = this.targetY;
      this.targetY = null;
      this.velocityY = 0;
      return { y: this.currentY, isMoving: false, distance: 0 };
    }

    const direction = Math.sign(distance);

    this.velocityY += direction * this.acceleration * safeDeltaTime;

    const maxSpeedDelta = this.maxSpeed * safeDeltaTime;
    this.velocityY = Math.max(-maxSpeedDelta, Math.min(maxSpeedDelta, this.velocityY));

    if (absDistance < this.brakeDistance) {
      const brakeFactor = absDistance / this.brakeDistance;
      const dampingCurve = this.minBrakeFactor + brakeFactor * (1 - this.minBrakeFactor);
      this.velocityY *= this.friction * dampingCurve;
    }

    this.currentY += this.velocityY;

    const overshot = Math.sign(this.currentY - this.targetY) === direction;

    if (overshot) {
      this.currentY = this.targetY;
      this.targetY = null;
      this.velocityY = 0;
      return { y: this.currentY, isMoving: false, distance: 0 };
    }

    return { y: this.currentY, isMoving: true, distance: absDistance };
  }

  reset(initialY: number): void {
    this.currentY = initialY;
    this.targetY = null;
    this.velocityY = 0;
  }

  isMoving(): boolean {
    return this.targetY !== null;
  }

  getPosition(): number {
    return this.currentY;
  }

  getVelocity(): number {
    return this.velocityY;
  }

  getTarget(): number | null {
    return this.targetY;
  }

  teleport(y: number): void {
    this.currentY = y;
    this.targetY = null;
    this.velocityY = 0;
  }

  updateParams(params: PhysicsConfig): void {
    if (params.maxSpeed !== undefined) {
      if (this.isValidPositive(params.maxSpeed, 'maxSpeed')) {
        this.maxSpeed = params.maxSpeed;
      }
    }

    if (params.acceleration !== undefined) {
      if (this.isValidPositive(params.acceleration, 'acceleration')) {
        this.acceleration = params.acceleration;
      }
    }

    if (params.friction !== undefined) {
      if (this.isValidRange(params.friction, 'friction', 0, 1)) {
        this.friction = params.friction;
      }
    }

    if (params.brakeDistance !== undefined) {
      if (this.isValidNonNegative(params.brakeDistance, 'brakeDistance')) {
        this.brakeDistance = params.brakeDistance;
      }
    }

    if (params.directionChangeDamping !== undefined) {
      if (this.isValidRange(params.directionChangeDamping, 'directionChangeDamping', 0, 1)) {
        this.directionChangeDamping = params.directionChangeDamping;
      }
    }

    if (params.minBrakeFactor !== undefined) {
      if (this.isValidRange(params.minBrakeFactor, 'minBrakeFactor', 0, 1)) {
        this.minBrakeFactor = params.minBrakeFactor;
      }
    }

    if (params.maxDeltaTime !== undefined) {
      if (this.isValidPositive(params.maxDeltaTime, 'maxDeltaTime')) {
        this.maxDeltaTime = params.maxDeltaTime;
      }
    }
  }

  private isValidPositive(value: number, paramName: string): boolean {
    if (value <= 0) {
      console.warn(`[PlayerPhysicsController] ${paramName} должен быть > 0, игнорируется`);
      return false;
    }
    return true;
  }

  private isValidNonNegative(value: number, paramName: string): boolean {
    if (value < 0) {
      console.warn(`[PlayerPhysicsController] ${paramName} должен быть >= 0, игнорируется`);
      return false;
    }
    return true;
  }

  private isValidRange(value: number, paramName: string, min: number, max: number): boolean {
    if (value < min || value > max) {
      console.warn(`[PlayerPhysicsController] ${paramName} должен быть ${min}-${max}, игнорируется`);
      return false;
    }
    return true;
  }
}
