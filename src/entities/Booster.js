import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../config/constants.js';
import { Collectible } from './base/Collectible.js';

/**
 * Собираемый бустер с анимированным спрайтшитом (крылья кубка),
 * плавающей анимацией, interpolation и culling
 */
export class Booster extends Collectible {
  constructor(spritesheet) {
    super();

    // 🆕 Создаем AnimatedSprite из спрайтшита cup.json
    // Анимация "Cup" содержит все 38 кадров (Cup_000.png -> Cup_037.png)
    const frames = spritesheet.animations['Cup'];
    this.sprite = new PIXI.AnimatedSprite(frames);
    this.sprite.anchor.set(0.5);

    // Настройка анимации
    this.sprite.animationSpeed = 0.3; // 0.3 кадров за тик (60 FPS) = ~18 FPS анимация
    this.sprite.loop = true;           // Зацикленная анимация

    // Масштабирование под размер из CONFIG
    const targetSize = CONFIG.BOOSTER.SIZE;
    const scale = targetSize / 250; // Cup frames = 250x250px по JSON
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
    const targetSize = CONFIG.BOOSTER.SIZE;
    const scale = targetSize / 250;
    this.sprite.scale.set(scale);
    this.sprite.alpha = 1;

    // 🆕 Запускаем зацикленную анимацию кубка
    this.sprite.gotoAndPlay(0);

    this.startFloat();
  }

  deactivate() {
    this.active = false;
    this.collected = false;
    this.sprite.visible = false;

    // 🆕 Останавливаем анимацию для экономии ресурсов
    this.sprite.stop();

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
