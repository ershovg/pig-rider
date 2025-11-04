import * as PIXI from 'pixi.js';
import { CONFIG } from '../../../shared/config/constants.ts';
import { Collectible } from '../../effects/base/Collectible.js';
import { CoinAnimationController } from '../controllers/CoinAnimationController.js';

export class Coin extends Collectible {
  constructor(spritesheet, container = null) {
    super();
    this.container = container;
    this.animationController = new CoinAnimationController();

    const animations = spritesheet.data.animations;
    const animationName = Object.keys(animations)[0];
    this.sprite = new PIXI.AnimatedSprite(spritesheet.animations[animationName]);
    this.sprite.anchor.set(0.5);

    const targetSize = CONFIG.COIN.SIZE;
    const firstFrameTexture = this.sprite.textures[0];
    const scale = targetSize / firstFrameTexture.width;
    this.sprite.scale.set(scale);
    this.baseScale = scale;

    this.active = false;
    this.collected = false;
    this.lane = 0;
    this.sprite.visible = false;

    this.previousX = 0;
    this.previousY = 0;
    this.currentX = 0;
    this.currentY = 0;
  }

  activate(lane, x) {
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
    this.sprite.scale.set(this.baseScale);

    this.animationController.initializeAnimation(this.sprite, this.sprite.totalFrames);
  }

  deactivate() {
    this.active = false;
    this.collected = false;
    this.sprite.visible = false;

    this.animationController.stopAnimation(this.sprite);

    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    this.deactivate();
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
    this.sprite.scale.set(this.baseScale);
    this.animationController.resetAnimation(this.sprite);
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