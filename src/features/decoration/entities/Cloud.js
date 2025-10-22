import * as PIXI from 'pixi.js';
import { CONFIG } from '../../../shared/config/constants.js';
import { Renderable } from '../../effects/base/Renderable.js';

/**
 * Декоративное облако с эффектом параллакса
 */
export class Cloud extends Renderable {
  constructor(texture, container = null) {
    super();
    this.container = container; // 🔥 Ссылка на PixiJS контейнер для lifecycle
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);

    this.active = false;
    this.lane = 0;
    this.speedMultiplier = 1;
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
    const yOffset = (Math.random() - 0.5) * 100;
    this.sprite.y = CONFIG.LANES.Y_POSITIONS[lane] + yOffset;
    this.sprite.visible = true;
    const randomScale = 0.3 + Math.random() * 0.9;
    this.sprite.scale.set(randomScale);
    this.speedMultiplier = 1.0;
    this.sprite.alpha = 0.6 + Math.random() * 0.3;
  }

  deactivate() {
    this.active = false;
    this.sprite.visible = false;

    // 🔥 ДОБАВЛЕНО: Удаляем sprite из контейнера для освобождения памяти
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
  }

  update(deltaTime, gameSpeed) {
    if (!this.active) return;
    this.sprite.x = Math.round(this.sprite.x - gameSpeed * deltaTime * 200 * this.speedMultiplier);
    if (this.sprite.x < -100) {
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
