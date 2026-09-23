import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../../../shared/config/constants';
import { Renderable } from '../../effects/base/Renderable';
import { Lane } from '../../../types';
import { CullableEntity } from '../../../types/rendering';

export class Star extends Renderable implements CullableEntity {
  private container: PIXI.Container | null;
  private sprite: PIXI.Sprite;
  private active: boolean;
  private twinkleTween: any;

  constructor(texture: PIXI.Texture, container: PIXI.Container | null = null) {
    super();
    this.container = container;
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);

    this.active = false;
    this.twinkleTween = null;
    this.sprite.visible = false;
  }

  activate(lane: Lane, x: number): void {
    if (this.container && !this.sprite.parent) {
      this.container.addChild(this.sprite);
    }

    this.active = true;
    this.sprite.x = x;
    this.sprite.y = CONFIG.LANES.Y_POSITIONS[lane];
    this.sprite.visible = true;
    const randomScale = 0.3 + Math.random() * 0.4;
    this.sprite.scale.set(randomScale);
    this.startTwinkle();
  }

  deactivate(): void {
    this.active = false;
    this.sprite.visible = false;
    this.stopTwinkle();

    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
  }

  startTwinkle(): void {
    this.stopTwinkle();
    this.twinkleTween = gsap.to(this.sprite, {
      alpha: 0.3,
      duration: 0.5 + Math.random() * 0.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });
  }

  stopTwinkle(): void {
    if (this.twinkleTween) {
      this.twinkleTween.kill();
      this.twinkleTween = null;
    }
  }

  update(deltaTime: number, gameSpeed: number): void {
    if (!this.active) return;
    this.sprite.x = Math.round(this.sprite.x - gameSpeed * deltaTime * 400);
    if (this.sprite.x < -50) {
      this.deactivate();
    }
  }

  reset(): void {
    this.deactivate();
    this.sprite.x = CONFIG.CANVAS_WIDTH + 100;
    this.sprite.alpha = 1;
  }

  getSprite(): PIXI.Sprite {
    return this.sprite;
  }

  isActive(): boolean {
    return this.active;
  }

  shouldCull(threshold: number): boolean {
    return this.active && this.sprite.x < threshold;
  }
}
