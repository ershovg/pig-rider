/**
 * Игрок (рендеринг + движение между полосами)
 */
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../config/constants.js';
import { PlayerInputController } from '../controllers/PlayerInputController.js';

export class Player {
  constructor(spritesheet) {
    this.currentLane = CONFIG.LANES.MIDDLE;
    this.isAnimating = false;

    const textures = spritesheet.animations['Hryusha_flying'];
    this.sprite = new PIXI.AnimatedSprite(textures);
    this.sprite.anchor.set(0.5);
    this.sprite.animationSpeed = 0.5;
    this.sprite.loop = true;
    this.sprite.play();
    this.sprite.width = CONFIG.PLAYER.SIZE;
    this.sprite.height = CONFIG.PLAYER.SIZE;
    this.sprite.x = CONFIG.PLAYER.START_X;
    this.sprite.y = CONFIG.LANES.Y_POSITIONS[this.currentLane];

    this.inputController = new PlayerInputController(this);

    console.log('🐷 Animated Player created with', textures.length, 'frames');
  }

  moveUp() {
    if (this.isAnimating || this.currentLane === CONFIG.LANES.TOP) return;
    this.currentLane--;
    this.animateToLane();
  }

  moveDown() {
    if (this.isAnimating || this.currentLane === CONFIG.LANES.BOTTOM) return;
    this.currentLane++;
    this.animateToLane();
  }

  animateToLane() {
    const targetY = CONFIG.LANES.Y_POSITIONS[this.currentLane];
    this.isAnimating = true;
    gsap.to(this.sprite, {
      y: targetY,
      duration: CONFIG.PLAYER.SWITCH_DURATION,
      ease: 'power2.out',
      onComplete: () => {
        this.isAnimating = false;
      }
    });
  }

  getHitbox() {
    const scale = CONFIG.COLLISION.PLAYER_HITBOX_SCALE;
    const width = this.sprite.width * scale;
    const height = this.sprite.height * scale;
    return {
      x: this.sprite.x - width / 2,
      y: this.sprite.y - height / 2,
      width: width,
      height: height
    };
  }

  update(deltaTime) {
    // Player position is fixed horizontally
  }

  reset() {
    this.currentLane = CONFIG.LANES.MIDDLE;
    this.sprite.y = CONFIG.LANES.Y_POSITIONS[this.currentLane];
    this.isAnimating = false;
    gsap.killTweensOf(this.sprite);
  }

  getSprite() {
    return this.sprite;
  }

  destroy() {
    gsap.killTweensOf(this.sprite);
    if (this.inputController) {
      this.inputController.destroy();
    }
    this.sprite.destroy();
  }
}
