import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/constants.js';

export class Obstacle {
  constructor(texture) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);

    // Set width, height scales proportionally
    this.sprite.width = CONFIG.OBSTACLE.SIZE;
    this.sprite.scale.y = this.sprite.scale.x; // Keep aspect ratio

    this.active = false;
    this.lane = 0;

    // Скрываем спрайт при создании
    this.sprite.visible = false;
  }

  /**
   * Activate obstacle at specific lane and position
   */
  activate(lane, x) {
    this.active = true;
    this.lane = lane;
    this.sprite.x = x;
    this.sprite.y = CONFIG.LANES.Y_POSITIONS[lane];
    this.sprite.visible = true;
  }

  /**
   * Deactivate obstacle
   */
  deactivate() {
    this.active = false;
    this.sprite.visible = false;
  }

  /**
   * Update obstacle position
   */
  update(deltaTime, gameSpeed) {
    if (!this.active) return;

    // Move obstacle to the left
    this.sprite.x -= gameSpeed * deltaTime * 800; // Base speed multiplier

    // Deactivate if off screen
    if (this.sprite.x < -CONFIG.OBSTACLE.SIZE) {
      this.deactivate();
    }
  }

  /**
   * Get hitbox for collision detection
   */
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

  /**
   * Reset obstacle state
   */
  reset() {
    this.deactivate();
    this.sprite.x = CONFIG.CANVAS_WIDTH + 100;
  }

  /**
   * Get sprite for adding to stage
   */
  getSprite() {
    return this.sprite;
  }

  /**
   * Check if obstacle is active
   */
  isActive() {
    return this.active;
  }
}
