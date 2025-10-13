import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../config/constants.js';
import { Collectible } from './base/Collectible.js';

/**
 * Собираемый бустер с плавающей анимацией, interpolation и culling
 */
export class Booster extends Collectible {
  constructor(texture) {
    super();
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    const targetSize = CONFIG.COIN.SIZE * 1.2;
    const scale = targetSize / texture.width;
    this.sprite.scale.set(scale);
    this.active = false;
    this.collected = false;
    this.lane = 0;
    this.floatTween = null;
    this.sprite.visible = false;

    // 🆕 Interpolation state
    this.previousX = 0;
    this.previousY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.baseY = 0; // Base Y для float анимации
  }

  activate(lane, x) {
    this.active = true;
    this.collected = false;
    this.lane = lane;

    // 🆕 Физическая позиция
    this.currentX = x;
    this.currentY = CONFIG.LANES.Y_POSITIONS[lane];
    this.baseY = this.currentY;
    this.sprite.x = this.currentX;
    this.sprite.y = this.currentY;
    this.previousX = this.currentX;
    this.previousY = this.currentY;

    this.sprite.visible = true;
    this.sprite.scale.set(1);
    this.sprite.alpha = 1;
    this.startFloat();
  }

  deactivate() {
    this.active = false;
    this.collected = false;
    this.sprite.visible = false;
    this.stopFloat();
  }

  startFloat() {
    this.stopFloat();
    // 🆕 Float animation теперь обновляет currentY, а не sprite.y напрямую
    this.floatTween = gsap.to(this, {
      currentY: this.baseY - 15,
      duration: 1,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });
  }

  stopFloat() {
    if (this.floatTween) {
      this.floatTween.kill();
      this.floatTween = null;
    }
  }

  collect() {
    if (this.collected) return null;
    this.collected = true;
    gsap.to(this.sprite, {
      rotation: Math.PI * 2,
      duration: 0.3,
      ease: 'back.out'
    });
    gsap.to(this.sprite.scale, {
      x: 1.8,
      y: 1.8,
      duration: 0.3,
      ease: 'back.out'
    });
    gsap.to(this.sprite, {
      alpha: 0,
      duration: 0.3,
      onComplete: () => {
        this.deactivate();
        this.sprite.alpha = 1;
      }
    });
    return {
      type: 'booster',
      value: 10
    };
  }

  update(deltaTime, gameSpeed) {
    if (!this.active || this.collected) return;

    // 🆕 Сохраняем и обновляем физику
    this.saveState();
    this.currentX -= gameSpeed * deltaTime * 800;

    if (this.currentX < -100) {
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
    // Y уже анимируется через GSAP (float), просто копируем
    this.sprite.y = this.currentY;
  }

  // 🆕 Cullable interface
  shouldCull(threshold) {
    return (this.active && !this.collected) && this.currentX < threshold;
  }
}
