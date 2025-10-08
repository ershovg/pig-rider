import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../config/constants.js';

/**
 * Booster - интерактивный элемент (бустер/кубок)
 * При сборе дает бонусы игроку
 */
export class Booster {
  constructor(texture) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.width = CONFIG.COIN.SIZE * 1.2; // Чуть больше монеты
    this.sprite.height = CONFIG.COIN.SIZE * 1.2;

    this.active = false;
    this.collected = false;
    this.lane = 0;
    this.floatTween = null;

    // Скрываем спрайт при создании
    this.sprite.visible = false;
  }

  /**
   * Activate booster at specific lane and position
   */
  activate(lane, x) {
    this.active = true;
    this.collected = false;
    this.lane = lane;
    this.sprite.x = x;
    this.sprite.y = CONFIG.LANES.Y_POSITIONS[lane];
    this.sprite.visible = true;
    this.sprite.scale.set(1);
    this.sprite.alpha = 1;

    // Добавляем анимацию плавающего движения вверх-вниз
    this.startFloat();
  }

  /**
   * Deactivate booster
   */
  deactivate() {
    this.active = false;
    this.collected = false;
    this.sprite.visible = false;
    this.stopFloat();
  }

  /**
   * Start floating animation (up and down)
   */
  startFloat() {
    this.stopFloat();

    const originalY = this.sprite.y;
    this.floatTween = gsap.to(this.sprite, {
      y: originalY - 15, // Поднимаем на 15px
      duration: 1,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * Stop floating animation
   */
  stopFloat() {
    if (this.floatTween) {
      this.floatTween.kill();
      this.floatTween = null;
    }
  }

  /**
   * Collect booster with animation
   */
  collect() {
    if (this.collected) return null;

    this.collected = true;

    // Анимация сбора: вращение и увеличение
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

    // TODO: Play booster collect sound effect
    // this.playBoosterSound();

    return {
      type: 'booster',
      value: 10 // Бонусные очки
    };
  }

  /**
   * Update booster position
   */
  update(deltaTime, gameSpeed) {
    if (!this.active || this.collected) return;

    // Двигаем бустер влево
    this.sprite.x -= gameSpeed * deltaTime * 800;

    // Обновляем Y позицию для плавающей анимации
    if (this.floatTween) {
      // gsap сам обновляет позицию
    }

    // Деактивируем если за экраном
    if (this.sprite.x < -100) {
      this.deactivate();
    }
  }

  /**
   * Get hitbox for collision detection
   */
  getHitbox() {
    if (!this.active || this.collected) return null;

    const scale = CONFIG.COLLISION.COIN_HITBOX_SCALE; // Используем тот же масштаб что и для монет
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
   * Reset booster state
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
   * Check if booster is active and not collected
   */
  isActive() {
    return this.active && !this.collected;
  }
}
