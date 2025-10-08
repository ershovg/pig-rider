import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/constants.js';

/**
 * Cloud - декоративный элемент (облако)
 * Двигается очень медленно создавая эффект параллакса и глубины
 */
export class Cloud {
  constructor(texture) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);

    this.active = false;
    this.lane = 0;
    this.speedMultiplier = 1;

    // Скрываем спрайт при создании
    this.sprite.visible = false;
  }

  /**
   * Activate cloud at specific position
   */
  activate(lane, x) {
    this.active = true;
    this.lane = lane;
    this.sprite.x = x;

    // Добавляем случайный Y-офсет для глубины (±50px в пределах линии)
    const yOffset = (Math.random() - 0.5) * 100; // -50 to +50
    this.sprite.y = CONFIG.LANES.Y_POSITIONS[lane] + yOffset;

    this.sprite.visible = true;

    // Больше разнообразия в размерах (облака бывают разные)
    const randomScale = 0.3 + Math.random() * 0.9; // 0.3 - 1.2
    this.sprite.scale.set(randomScale);

    // УБРАЛИ случайную скорость - все облака двигаются одинаково,
    // чтобы не догоняли друг друга и не сливались
    this.speedMultiplier = 1.0;

    // Случайная прозрачность
    this.sprite.alpha = 0.6 + Math.random() * 0.3; // 0.6 - 0.9
  }

  /**
   * Deactivate cloud
   */
  deactivate() {
    this.active = false;
    this.sprite.visible = false;
  }

  /**
   * Update cloud position
   */
  update(deltaTime, gameSpeed) {
    if (!this.active) return;

    // Облака двигаются очень медленно (эффект параллакса)
    this.sprite.x -= gameSpeed * deltaTime * 200 * this.speedMultiplier;

    // Деактивируем если за экраном
    if (this.sprite.x < -100) {
      this.deactivate();
    }
  }

  /**
   * Reset cloud state
   */
  reset() {
    this.deactivate();
    this.sprite.x = CONFIG.CANVAS_WIDTH + 100;
    this.sprite.alpha = 1;
  }

  /**
   * Get sprite for adding to stage
   */
  getSprite() {
    return this.sprite;
  }

  /**
   * Check if cloud is active
   */
  isActive() {
    return this.active;
  }
}
