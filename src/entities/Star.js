import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../config/constants.js';

/**
 * Star - декоративный элемент (звездочка)
 * Появляется на случайных позициях и создает визуальную атмосферу
 */
export class Star {
  constructor(texture) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);

    this.active = false;
    this.lane = 0;
    this.twinkleTween = null;

    // Скрываем спрайт при создании
    this.sprite.visible = false;
  }

  /**
   * Activate star at specific position
   */
  activate(lane, x) {
    this.active = true;
    this.lane = lane;
    this.sprite.x = x;
    this.sprite.y = CONFIG.LANES.Y_POSITIONS[lane];
    this.sprite.visible = true;

    // Случайный размер для разнообразия
    const randomScale = 0.3 + Math.random() * 0.4; // 0.3 - 0.7
    this.sprite.scale.set(randomScale);

    // Добавляем мерцание
    this.startTwinkle();
  }

  /**
   * Deactivate star
   */
  deactivate() {
    this.active = false;
    this.sprite.visible = false;
    this.stopTwinkle();
  }

  /**
   * Start twinkle animation
   */
  startTwinkle() {
    this.stopTwinkle();

    // Мерцание через изменение прозрачности
    this.twinkleTween = gsap.to(this.sprite, {
      alpha: 0.3,
      duration: 0.5 + Math.random() * 0.5, // 0.5-1 секунда
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * Stop twinkle animation
   */
  stopTwinkle() {
    if (this.twinkleTween) {
      this.twinkleTween.kill();
      this.twinkleTween = null;
    }
  }

  /**
   * Update star position
   */
  update(deltaTime, gameSpeed) {
    if (!this.active) return;

    // Двигаем звездочку влево медленнее чем препятствия (эффект параллакса)
    // Math.round() предотвращает "дергание" из-за дробных координат
    this.sprite.x = Math.round(this.sprite.x - gameSpeed * deltaTime * 400);

    // Деактивируем если за экраном
    if (this.sprite.x < -50) {
      this.deactivate();
    }
  }

  /**
   * Reset star state
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
   * Check if star is active
   */
  isActive() {
    return this.active;
  }
}
