import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../../../shared/config/constants.ts';
import { Renderable } from '../../effects/base/Renderable.ts';

/**
 * Декоративная звезда с мерцанием
 */
export class Star extends Renderable {
  constructor(texture, container = null) {
    super();
    this.container = container; // 🔥 Ссылка на PixiJS контейнер для lifecycle
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);

    this.active = false;
    this.lane = 0;
    this.twinkleTween = null;
    this.sprite.visible = false;
  }

  activate(lane, x) {
    // 🔥 ДОБАВЛЕНО: Добавляем sprite в контейнер при активации
    if (this.container && !this.sprite.parent) {
      this.container.addChild(this.sprite);
    }

    this.active = true;
    this.lane = lane;
    this.sprite.x = x;
    this.sprite.y = CONFIG.LANES.Y_POSITIONS[lane];
    this.sprite.visible = true;
    const randomScale = 0.3 + Math.random() * 0.4;
    this.sprite.scale.set(randomScale);
    this.startTwinkle();
  }

  deactivate() {
    this.active = false;
    this.sprite.visible = false;
    this.stopTwinkle();

    // 🔥 ДОБАВЛЕНО: Удаляем sprite из контейнера для освобождения памяти
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
  }

  startTwinkle() {
    this.stopTwinkle();
    this.twinkleTween = gsap.to(this.sprite, {
      alpha: 0.3,
      duration: 0.5 + Math.random() * 0.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });
  }

  stopTwinkle() {
    if (this.twinkleTween) {
      this.twinkleTween.kill();
      this.twinkleTween = null;
    }
  }

  update(deltaTime, gameSpeed) {
    if (!this.active) return;
    this.sprite.x = Math.round(this.sprite.x - gameSpeed * deltaTime * 400);
    if (this.sprite.x < -50) {
      this.deactivate();
    }
  }

  reset() {
    this.deactivate();
    this.sprite.x = CONFIG.CANVAS_WIDTH + 100;
    this.sprite.alpha = 1;
  }

  getSprite() {
    return this.sprite;
  }

  isActive() {
    return this.active;
  }

  shouldCull(threshold) {
    return this.active && this.sprite.x < threshold;
  }
}
