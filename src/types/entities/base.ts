export interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Entity {
  activate(x: number, y: number, lane: number): void;
  update(deltaTime: number, gameSpeed: number): void;
  deactivate(): void;
  isActive(): boolean;
}

export interface Collidable extends Entity {
  getHitbox(): Hitbox | null;
  onCollision?(other: Collidable): void;
}
