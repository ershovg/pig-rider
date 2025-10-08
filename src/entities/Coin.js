import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../config/constants.js';

export class Coin {
  constructor(texture) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.width = CONFIG.COIN.SIZE;
    this.sprite.height = CONFIG.COIN.SIZE;

    this.active = false;
    this.collected = false;
    this.lane = 0;
    this.rotationTween = null;

    // Скрываем спрайт при создании
    this.sprite.visible = false;
  }

  /**
   * Activate coin at specific lane and position
   */
  activate(lane, x) {
    this.active = true;
    this.collected = false;
    this.lane = lane;
    this.sprite.x = x;
    this.sprite.y = CONFIG.LANES.Y_POSITIONS[lane];
    this.sprite.visible = true;
    this.sprite.scale.set(1);

    // Add rotation animation for visual appeal
    this.startRotation();
  }

  /**
   * Deactivate coin
   */
  deactivate() {
    this.active = false;
    this.collected = false;
    this.sprite.visible = false;
    this.stopRotation();
  }

  /**
   * Start rotation animation
   */
  startRotation() {
    this.stopRotation();
    this.rotationTween = gsap.to(this.sprite, {
      rotation: Math.PI * 2,
      duration: 2,
      ease: 'none',
      repeat: -1
    });
  }

  /**
   * Stop rotation animation
   */
  stopRotation() {
    if (this.rotationTween) {
      this.rotationTween.kill();
      this.rotationTween = null;
    }
  }

  /**
   * Collect coin with animation
   */
  collect() {
    if (this.collected) return;

    this.collected = true;

    // Scale up and fade out animation
    gsap.to(this.sprite.scale, {
      x: 1.5,
      y: 1.5,
      duration: 0.2,
      ease: 'back.out'
    });

    gsap.to(this.sprite, {
      alpha: 0,
      duration: 0.2,
      onComplete: () => {
        this.deactivate();
        this.sprite.alpha = 1;
      }
    });

    // TODO: Play coin collect sound effect
    // this.playCoinSound();

    return CONFIG.COIN.VALUE;
  }

  /**
   * Update coin position
   */
  update(deltaTime, gameSpeed) {
    if (!this.active || this.collected) return;

    // Move coin to the left
    this.sprite.x -= gameSpeed * deltaTime * 800;

    // Deactivate if off screen
    if (this.sprite.x < -CONFIG.COIN.SIZE) {
      this.deactivate();
    }
  }

  /**
   * Get hitbox for collision detection
   */
  getHitbox() {
    if (!this.active || this.collected) return null;

    const scale = CONFIG.COLLISION.COIN_HITBOX_SCALE;
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
   * Reset coin state
   */
  reset() {
    this.deactivate();
    this.sprite.x = CONFIG.CANVAS_WIDTH + 100;
    this.sprite.rotation = 0;
    this.sprite.alpha = 1;
  }

  /**
   * Get sprite for adding to stage
   */
  getSprite() {
    return this.sprite;
  }

  /**
   * Check if coin is active and not collected
   */
  isActive() {
    return this.active && !this.collected;
  }
}
