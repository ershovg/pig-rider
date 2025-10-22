import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../../../shared/config/constants.js';
import { Collectible } from '../../effects/base/Collectible.js';

/**
 * Собираемая монета с анимацией, interpolation и culling
 */
export class Coin extends Collectible {
  constructor(texture, container = null) {
    super();
    this.container = container; // 🔥 Ссылка на PixiJS контейнер для lifecycle
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    const targetSize = CONFIG.COIN.SIZE;
    const scale = targetSize / texture.width;
    this.sprite.scale.set(scale);

    this.active = false;
    this.collected = false;
    this.lane = 0;
    this.rotationTween = null;
    this.sprite.visible = false;

    this.previousX = 0;
    this.previousY = 0;
    this.currentX = 0;
    this.currentY = 0;
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
    this.sprite.x = this.currentX;
    this.sprite.y = this.currentY;
    this.previousX = this.currentX;
    this.previousY = this.currentY;

    this.sprite.visible = true;
    this.sprite.scale.set(1);
    this.startRotation();
  }

  deactivate() {
    this.active = false;
    this.collected = false;
    this.sprite.visible = false;
    this.stopRotation();

    // Предотвращает "висящие" твины при быстром переиспользовании из пула
    gsap.killTweensOf(this.sprite);
    gsap.killTweensOf(this.sprite.scale);

    // 🔥 ДОБАВЛЕНО: Удаляем sprite из контейнера для освобождения памяти
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
  }

  startRotation() {
    this.stopRotation();
    this.rotationTween = gsap.to(this.sprite, {
      rotation: Math.PI * 2,
      duration: 2,
      ease: 'none',
      repeat: -1
    });
  }

  stopRotation() {
    if (this.rotationTween) {
      this.rotationTween.kill();
      this.rotationTween = null;
    }
  }

  collect() {
    if (this.collected) return;
    this.collected = true;

    this.stopRotation();

    // Монета быстро уменьшается с самого начала (эффект магнитного притяжения)
    gsap.to(this.sprite.scale, {
      x: 0,
      y: 0,
      duration: 0.2, // 200ms - чуть дольше для заметности
      onComplete: () => {
        // После анимации деактивируем монету
        this.deactivate();
      }
    });

    return CONFIG.COIN.VALUE;
  }

  update(deltaTime, gameSpeed) {
    if (!this.active || this.collected) return;

    this.saveState();
    this.currentX -= gameSpeed * deltaTime * 800;

    if (this.currentX < -CONFIG.COIN.SIZE) {
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

    // Важно: возвращаем к значению 1, а не к исходному targetSize/texture.width
    // потому что в activate() мы устанавливаем scale.set(1)
    this.sprite.scale.set(1);
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
    this.sprite.y = this.previousY + (this.currentY - this.previousY) * alpha;
  }

  shouldCull(threshold) {
    return (this.active && !this.collected) && this.currentX < threshold;
  }
}
