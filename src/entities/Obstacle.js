import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/constants.js';
import { Collidable } from './base/Collidable.js';

/**
 * Препятствие с коллизией
 */
export class Obstacle extends Collidable {
  constructor(texture) {
    super();
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    const targetSize = CONFIG.OBSTACLE.SIZE;
    const scale = targetSize / texture.width;
    this.sprite.scale.set(scale);
    this.active = false;
    this.lane = 0;
    this.sprite.visible = false;
  }

  activate(lane, x) {
    this.active = true;
    this.lane = lane;
    this.sprite.x = x;
    this.sprite.y = CONFIG.LANES.Y_POSITIONS[lane];
    this.sprite.visible = true;
  }

  deactivate() {
    this.active = false;
    this.sprite.visible = false;
  }

  update(deltaTime, gameSpeed) {
    if (!this.active) return;
    this.sprite.x = Math.round(this.sprite.x - gameSpeed * deltaTime * 800);
    if (this.sprite.x < -CONFIG.OBSTACLE.SIZE) {
      this.deactivate();
    }
  }

  getHitbox() {
    if (!this.active) return null;
    const scale = CONFIG.COLLISION.OBSTACLE_HITBOX_SCALE;
    const width = this.sprite.width * scale;
    const height = this.sprite.height * scale;
    return {
      x: this.sprite.x - width / 2,
      y: this.sprite.y - height / 2,
      width: width,
      height: height
    };
  }

  reset() {
    this.deactivate();
    this.sprite.x = CONFIG.CANVAS_WIDTH + 100;
  }

  getSprite() {
    return this.sprite;
  }

  isActive() {
    return this.active;
  }
}
