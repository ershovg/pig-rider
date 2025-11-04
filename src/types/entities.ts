/**
 * Core entity interfaces for the game
 *
 * Following Interface Segregation Principle (SOLID):
 * - Минимальные, специфичные интерфейсы
 * - Композиция через extends
 * - Не заставляем классы зависеть от неиспользуемых методов
 */

/**
 * Rectangular bounding box (AABB collision)
 */
export interface IHitbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Base entity - минимальный контракт для всех игровых объектов
 *
 * @example
 * class Coin implements IEntity {
 *   activate(x: number, y: number, lane: number) {
 *     this.sprite.position.set(x, y);
 *     this.active = true;
 *   }
 * }
 */
export interface IEntity {
  /** Activate entity at position (обычно x=CANVAS_WIDTH для спавна справа) */
  activate(x: number, y: number, lane: number): void;

  /** Update entity state each frame */
  update(deltaTime: number, gameSpeed: number): void;

  /** Deactivate entity (return to pool) */
  deactivate(): void;

  /** Check if entity is currently active */
  isActive(): boolean;
}

/**
 * Entity with collision detection
 *
 * Used by: Player, Obstacle, Coin, Booster
 */
export interface ICollidable extends IEntity {
  /** Get collision hitbox for AABB check */
  getHitbox(): IHitbox;

  /** Optional collision callback */
  onCollision?(other: ICollidable): void;
}

/**
 * Entity that can be collected by player
 *
 * Used by: Coin, Booster
 */
export interface ICollectible extends ICollidable {
  /** Collect this entity (deactivate + emit event + optional effect) */
  collect(): void;
}

/**
 * Entity managed by object pool (for performance)
 *
 * @example
 * class ObstaclePool {
 *   getFromPool(): IPoolable {
 *     return this.pool.find(obj => !obj.isActive()) || this.createNew();
 *   }
 * }
 */
export interface IPoolable extends IEntity {
  /** Reset entity to initial state before returning to pool */
  reset(): void;
}

/**
 * Entity with visual representation (PixiJS sprite/container)
 */
export interface IRenderable {
  show(): void;
  hide(): void;
  isVisible(): boolean;
}

/**
 * Entity that supports frustum culling optimization
 *
 * Objects outside view bounds are not rendered.
 */
export interface ICullable extends IRenderable {
  /** Check if entity is within view bounds */
  isInView(viewBounds: IHitbox): boolean;
}
