import * as PIXI from 'pixi.js';
import { CONFIG } from '../../../shared/config/constants';
import { Collidable } from '../../effects/base/Collidable';
import type { Lane, Hitbox, Interpolatable, CullableEntity } from '../../../types';

export class Obstacle extends Collidable implements Interpolatable, CullableEntity {
  private container: PIXI.Container | null;
  private sprite: PIXI.Sprite;
  private active: boolean;
  public lane: Lane;
  private previousX: number;
  private previousY: number;
  private currentX: number;
  private currentY: number;

  constructor(texture: PIXI.Texture, container: PIXI.Container | null = null) {
    super();

    this.container = container;

    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.zIndex = 10;
    const targetSize = CONFIG.OBSTACLE.SIZE;
    const scale = targetSize / texture.width;
    this.sprite.scale.set(scale);

    this.active = false;
    this.lane = 0;
    this.sprite.visible = false;

    this.previousX = 0;
    this.previousY = 0;
    this.currentX = 0;
    this.currentY = 0;
  }

  setTexture(texture: PIXI.Texture): void {
    this.sprite.texture = texture;
    const targetSize = CONFIG.OBSTACLE.SIZE;
    const scale = targetSize / texture.width;
    this.sprite.scale.set(scale);
  }

  activate(lane: Lane, x: number, texture: PIXI.Texture | null = null): void {
    if (this.container && !this.sprite.parent) {
      this.container.addChild(this.sprite);
    }

    this.active = true;
    this.lane = lane;

    if (texture) {
      this.setTexture(texture);
    }

    this.currentX = x;
    this.currentY = CONFIG.LANES.Y_POSITIONS[lane];

    this.sprite.x = this.currentX;
    this.sprite.y = this.currentY;

    this.previousX = this.currentX;
    this.previousY = this.currentY;

    this.sprite.visible = true;
  }

  deactivate(): void {
    this.active = false;
    this.sprite.visible = false;

    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
  }

  update(deltaTime: number, gameSpeed: number): void {
    if (!this.active) return;

    this.saveState();

    this.currentX -= gameSpeed * deltaTime * 800;

    if (this.currentX < -CONFIG.OBSTACLE.SIZE) {
      this.deactivate();
    }
  }

  getHitbox(): Hitbox | null {
    if (!this.active) return null;
    const scale = CONFIG.COLLISION.OBSTACLE_HITBOX_SCALE;
    const width = this.sprite.width * scale;
    const height = this.sprite.height * scale;

    return {
      x: this.currentX - width / 2,
      y: this.currentY - height / 2,
      width: width,
      height: height
    };
  }

  reset(): void {
    this.deactivate();
    this.currentX = CONFIG.CANVAS_WIDTH + 100;
    this.sprite.x = this.currentX;
  }

  getSprite(): PIXI.Sprite {
    return this.sprite;
  }

  isActive(): boolean {
    return this.active;
  }

  saveState(): void {
    this.previousX = this.currentX;
    this.previousY = this.currentY;
  }

  interpolate(alpha: number): void {
    if (!this.sprite) return;
    this.sprite.x = this.previousX + (this.currentX - this.previousX) * alpha;
    this.sprite.y = this.previousY + (this.currentY - this.previousY) * alpha;
  }

  syncSpriteToPhysics(): void {
    if (!this.sprite) return;
    this.sprite.x = this.currentX;
    this.sprite.y = this.currentY;
    this.previousX = this.currentX;
    this.previousY = this.currentY;
  }

  shouldCull(threshold: number): boolean {
    return this.active && this.currentX < threshold;
  }
}
