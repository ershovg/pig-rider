import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/constants.js';
import { Renderable } from './base/Renderable.js';

/**
 * Декоративное облако с эффектом параллакса
 */
export class Cloud extends Renderable {
  constructor(texture) {
    super();
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.active = false;
    this.lane = 0;
    this.speedMultiplier = 1;
    this.sprite.visible = false;
  }

  activate(lane, x) {
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
}
