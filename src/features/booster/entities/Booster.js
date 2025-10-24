import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../../../shared/config/constants.js';
import { Collectible } from '../../effects/base/Collectible.js';

/**
 * Собираемый бустер с анимированным спрайтшитом (крылья кубка),
 * плавающей анимацией, interpolation и culling
 */
export class Booster extends Collectible {
  constructor(spritesheet, container = null) {
    super();

    this.container = container; // 🔥 Ссылка на PixiJS контейнер для lifecycle

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

    this.previousX = 0;
    this.previousY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.baseY = 0; // Base Y для float анимации
  }

  activate(lane, x) {
    // 🔥 ДОБАВЛЕНО: Добавляем sprite в контейнер при активации
    if (this.container && !this.sprite.parent) {
      this.container.addChild(this.sprite);
    }

    this.active = true;
    this.collected = false;
    this.lane = lane;

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

    this.sprite.gotoAndPlay(0);

    this.startFloat();
  }

  deactivate() {
    this.active = false;
    this.collected = false;
    this.sprite.visible = false;

    this.sprite.stop();

    this.stopFloat();

    // 🔥 ДОБАВЛЕНО: Удаляем sprite из контейнера для освобождения памяти
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
  }

  startFloat() {
    this.stopFloat();
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

    // Сохраняем текущий scale для относительного увеличения
    const currentScale = this.sprite.scale.x;
    const targetScale = currentScale * 1.8; // Увеличиваем в 1.8 раз от текущего

    gsap.to(this.sprite, {
      rotation: Math.PI * 2,
      duration: 0.3,
      ease: 'back.out'
    });
    gsap.to(this.sprite.scale, {
      x: targetScale,
      y: targetScale,
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

  shouldCull(threshold) {
    return (this.active && !this.collected) && this.currentX < threshold;
  }
}
