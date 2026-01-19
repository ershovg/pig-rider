import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../../../shared/config/constants';
import { Collectible } from '../../effects/base/Collectible';
import type { Lane, Hitbox } from '../../../types';
import type { CollectResult } from '../../../types/collectibles';

export class Booster extends Collectible {
  private container: PIXI.Container | null;
  private sprite: PIXI.AnimatedSprite;
  private active: boolean;
  private collected: boolean;
  private floatTween: gsap.core.Tween | null;

  private previousX: number;
  private currentX: number;
  private currentY: number;
  private baseY: number;

  constructor(spritesheet: PIXI.Spritesheet, container: PIXI.Container | null = null) {
    super();

    this.container = container;

    const frames = spritesheet.animations['Cup'];
    this.sprite = new PIXI.AnimatedSprite(frames);
    this.sprite.anchor.set(0.5);
    this.sprite.zIndex = 10; // 🎨 Игровой слой (между decorationLayer:0 и effectsLayer:20)

    this.sprite.animationSpeed = 0.3;
    this.sprite.loop = true;

    const targetSize = CONFIG.BOOSTER.SIZE;
    const scale = targetSize / 250;
    this.sprite.scale.set(scale);

    this.active = false;
    this.collected = false;
    this.floatTween = null;
    this.sprite.visible = false;

    this.previousX = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.baseY = 0;
  }

  activate(lane: Lane, x: number): void {
    if (this.container && !this.sprite.parent) {
      this.container.addChild(this.sprite);
    }

    this.active = true;
    this.collected = false;

    this.currentX = x;
    this.currentY = CONFIG.LANES.Y_POSITIONS[lane];
    this.baseY = this.currentY;
    this.sprite.x = this.currentX;
    this.sprite.y = this.currentY;
    this.previousX = this.currentX;

    this.sprite.visible = true;
    const targetSize = CONFIG.BOOSTER.SIZE;
    const scale = targetSize / 250;
    this.sprite.scale.set(scale);
    this.sprite.alpha = 1;

    this.sprite.gotoAndPlay(0);

    this.startFloat();
  }

  deactivate(): void {
    this.active = false;
    this.collected = false;
    this.sprite.visible = false;

    this.sprite.stop();

    this.stopFloat();

    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
  }

  private startFloat(): void {
    this.stopFloat();
    this.floatTween = gsap.to(this, {
      currentY: this.baseY - 15,
      duration: 1,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });
  }

  private stopFloat(): void {
    if (this.floatTween) {
      this.floatTween.kill();
      this.floatTween = null;
    }
  }

  collect(): CollectResult | null {
    if (this.collected) return null;
    this.collected = true;

    const currentScale = this.sprite.scale.x;
    const targetScale = currentScale * 1.8;

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

  update(deltaTime: number, gameSpeed: number): void {
    if (!this.active || this.collected) return;

    this.saveState();
    this.currentX -= gameSpeed * deltaTime * 800;

    if (this.currentX < -100) {
      this.deactivate();
    }
  }

  getHitbox(): Hitbox | null {
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

  reset(): void {
    this.deactivate();
    this.currentX = CONFIG.CANVAS_WIDTH + 100;
    this.sprite.x = this.currentX;
    this.sprite.rotation = 0;
    this.sprite.alpha = 1;
  }

  getSprite(): PIXI.AnimatedSprite {
    return this.sprite;
  }

  isActive(): boolean {
    return this.active && !this.collected;
  }

  saveState(): void {
    this.previousX = this.currentX;
  }

  interpolate(alpha: number): void {
    if (!this.sprite) return;
    this.sprite.x = this.previousX + (this.currentX - this.previousX) * alpha;
    this.sprite.y = this.currentY;
  }

  shouldCull(threshold: number): boolean {
    return (this.active && !this.collected) && this.currentX < threshold;
  }
}
