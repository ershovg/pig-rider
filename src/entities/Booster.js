import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../config/constants.js';
import { Collectible } from './base/Collectible.js';

/**
 * Собираемый бустер с плавающей анимацией
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
  }

  activate(lane, x) {
    this.active = true;
    this.collected = false;
    this.lane = lane;
    this.sprite.x = x;
    this.sprite.y = CONFIG.LANES.Y_POSITIONS[lane];
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
    const originalY = this.sprite.y;
    this.floatTween = gsap.to(this.sprite, {
      y: originalY - 15,
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
    this.sprite.x = Math.round(this.sprite.x - gameSpeed * deltaTime * 800);
    if (this.sprite.x < -100) {
      this.deactivate();
    }
  }

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

  reset() {
    this.deactivate();
    this.sprite.x = CONFIG.CANVAS_WIDTH + 100;
    this.sprite.rotation = 0;
    this.sprite.alpha = 1;
  }

  getSprite() {
    return this.sprite;
  }

  isActive() {
    return this.active && !this.collected;
  }
}
