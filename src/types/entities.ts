export interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HasHitbox {
  getHitbox(): Hitbox | null;
}

export interface Sprite {
  x: number;
  y: number;
}

export interface HasSprite {
  getSprite(): Sprite;
}

export interface Entity {
  activate(x: number, y: number, lane: number): void;
  update(deltaTime: number, gameSpeed: number): void;
  deactivate(): void;
  isActive(): boolean;
}

export interface Collidable extends Entity, HasHitbox {
  onCollision?(other: Collidable): void;
}

export interface Collectible extends Collidable {
  collect(): { type: string; value: number } | null;
}

export interface Poolable extends Collidable {
  reset(): void;
}

export interface Renderable {
  show(): void;
  hide(): void;
  isVisible(): boolean;
}

export interface Cullable extends Renderable {
  shouldCull(threshold: number): boolean;
}

export interface Interpolatable {
  saveState(): void;
  interpolate(alpha: number): void;
}
