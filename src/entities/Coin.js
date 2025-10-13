import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../config/constants.js';
import { Collectible } from './base/Collectible.js';

/**
 * Собираемая монета с анимацией, interpolation и culling
 */
export class Coin extends Collectible {
  constructor(texture) {
    super();
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    const targetSize = CONFIG.COIN.SIZE;
    const scale = targetSize / texture.width;
    this.sprite.scale.set(scale);
    this.active = false;
    this.collected = false;
    this.lane = 0;
    this.rotationTween = null;
    this.sprite.visible = false;

    // 🆕 Interpolation state
    this.previousX = 0;
    this.previousY = 0;
    this.currentX = 0;
    this.currentY = 0;
  }

  activate(lane, x) {
    this.active = true;
    this.collected = false;
    this.lane = lane;

    // 🆕 Физическая позиция
    this.currentX = x;
    this.currentY = CONFIG.LANES.Y_POSITIONS[lane];
    this.sprite.x = this.currentX;
    this.sprite.y = this.currentY;
    this.previousX = this.currentX;
    this.previousY = this.currentY;

    this.sprite.visible = true;
    this.sprite.scale.set(1);
    this.startRotation();
  }

  deactivate() {
    this.active = false;
    this.collected = false;
    this.sprite.visible = false;
    this.stopRotation();
  }

  startRotation() {
    this.stopRotation();
    this.rotationTween = gsap.to(this.sprite, {
      rotation: Math.PI * 2,
      duration: 2,
      ease: 'none',
      repeat: -1
    });
  }

  stopRotation() {
    if (this.rotationTween) {
      this.rotationTween.kill();
      this.rotationTween = null;
    }
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
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
    return CONFIG.COIN.VALUE;
  }

  update(deltaTime, gameSpeed) {
    if (!this.active || this.collected) return;

    // 🆕 Сохраняем и обновляем физику
    this.saveState();
    this.currentX -= gameSpeed * deltaTime * 800;

    if (this.currentX < -CONFIG.COIN.SIZE) {
      this.deactivate();
    }
  }

  getHitbox() {
    if (!this.active || this.collected) return null;
    const scale = CONFIG.COLLISION.COIN_HITBOX_SCALE;
    const width = this.sprite.width * scale;
    const height = this.sprite.height * scale;

    // 🆕 Используем физическую позицию
    return {
      x: this.currentX - width / 2,
      y: this.currentY - height / 2,
      width: width,
      height: height
    };
  }

  reset() {
    this.deactivate();
    this.currentX = CONFIG.CANVAS_WIDTH + 100;
    this.sprite.x = this.currentX;
    this.sprite.rotation = 0;
    this.sprite.alpha = 1;
  }

  getSprite() {
    return this.sprite;
  }

  isActive() {
    return this.active && !this.collected;
  }

  // 🆕 Interpolatable interface
  saveState() {
    this.previousX = this.currentX;
    this.previousY = this.currentY;
  }

  interpolate(alpha) {
    if (!this.sprite) return;
    this.sprite.x = this.previousX + (this.currentX - this.previousX) * alpha;
    this.sprite.y = this.previousY + (this.currentY - this.previousY) * alpha;
  }

  // 🆕 Cullable interface
  shouldCull(threshold) {
    return (this.active && !this.collected) && this.currentX < threshold;
  }
}
