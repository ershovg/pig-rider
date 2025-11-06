import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../../../shared/config/constants';
import { PlayerInputController } from '../controllers/PlayerInputController';
import { PlayerPhysicsController } from '../controllers/PlayerPhysicsController';
import type { Lane, Hitbox, Interpolatable } from '../../../types';

export class Player implements Interpolatable {
  private currentLane: Lane;
  private targetLane: Lane;
  private readonly physicsController: PlayerPhysicsController;
  private readonly normalSpritesheet: PIXI.Spritesheet;
  private readonly boostSpritesheet: PIXI.Spritesheet;
  private readonly sprite: PIXI.AnimatedSprite;
  private readonly inputController: PlayerInputController;
  private readonly currentX: number;
  private currentY: number;
  private previousY: number;

  constructor(
    spritesheet: PIXI.Spritesheet,
    boostSpritesheet: PIXI.Spritesheet,
    physicsController?: PlayerPhysicsController,
    _screenWidth: number = CONFIG.CANVAS_WIDTH,
    _screenHeight: number = CONFIG.CANVAS_HEIGHT
  ) {
    this.currentLane = CONFIG.LANES.MIDDLE as Lane;
    this.targetLane = CONFIG.LANES.MIDDLE as Lane;

    this.physicsController = physicsController || new PlayerPhysicsController(CONFIG.PLAYER.PHYSICS);

    this.normalSpritesheet = spritesheet;
    this.boostSpritesheet = boostSpritesheet;

    const textures = spritesheet.animations['Hryusha_flying_v2'];
    if (!textures) {
      console.error('❌ Animation "Hryusha_flying_v2" not found in spritesheet!');
      console.log('Available animations:', Object.keys(spritesheet.animations));
      throw new Error('Missing animation: Hryusha_flying_v2');
    }

    this.sprite = new PIXI.AnimatedSprite(textures);
    this.sprite.anchor.set(0.5);
    this.sprite.animationSpeed = 0.5;
    this.sprite.loop = true;
    this.sprite.play();
    this.sprite.width = CONFIG.PLAYER.SIZE;
    this.sprite.height = CONFIG.PLAYER.SIZE;

    this.currentX = CONFIG.PLAYER.START_X;
    this.currentY = CONFIG.LANES.Y_POSITIONS[this.currentLane];
    this.previousY = this.currentY;

    this.sprite.x = this.currentX;
    this.sprite.y = this.currentY;

    this.physicsController.reset(this.currentY);

    this.inputController = new PlayerInputController(this);

    console.log('🐷 Animated Player created with', textures.length, 'frames (physics-based)');
  }

  moveUp(): void {
    if (this.targetLane === CONFIG.LANES.TOP) return;

    this.targetLane = Math.max(CONFIG.LANES.TOP, this.targetLane - 1) as Lane;
    const targetY = CONFIG.LANES.Y_POSITIONS[this.targetLane];
    this.physicsController.setTarget(targetY);
  }

  moveDown(): void {
    if (this.targetLane === CONFIG.LANES.BOTTOM) return;

    this.targetLane = Math.min(CONFIG.LANES.BOTTOM, this.targetLane + 1) as Lane;
    const targetY = CONFIG.LANES.Y_POSITIONS[this.targetLane];
    this.physicsController.setTarget(targetY);
  }

  moveToLane(laneIndex: Lane): void {
    if (laneIndex < CONFIG.LANES.TOP || laneIndex > CONFIG.LANES.BOTTOM) {
      console.warn(`⚠️ Invalid lane index: ${laneIndex}`);
      return;
    }

    if (this.targetLane === laneIndex) return;

    this.targetLane = laneIndex;
    const targetY = CONFIG.LANES.Y_POSITIONS[this.targetLane];
    this.physicsController.setTarget(targetY);
  }

  getHitbox(): Hitbox {
    const scale = CONFIG.COLLISION.PLAYER_HITBOX_SCALE;
    const width = this.sprite.width * scale;
    const height = this.sprite.height * scale;

    return {
      x: this.currentX - width / 2,
      y: this.currentY - height / 2,
      width: width,
      height: height
    };
  }

  update(deltaTime: number): void {
    this.saveState();

    const result = this.physicsController.update(deltaTime);
    this.currentY = result.y;

    if (!result.isMoving && this.currentLane !== this.targetLane) {
      this.currentLane = this.targetLane;
    }
  }

  reset(): void {
    this.currentLane = CONFIG.LANES.MIDDLE as Lane;
    this.targetLane = CONFIG.LANES.MIDDLE as Lane;

    this.currentY = CONFIG.LANES.Y_POSITIONS[this.currentLane];
    this.previousY = this.currentY;
    this.sprite.x = CONFIG.PLAYER.START_X;
    this.sprite.y = this.currentY;
    this.sprite.rotation = 0;
    this.sprite.visible = true;

    this.physicsController.reset(this.currentY);
    this.inputController.enable();

    gsap.killTweensOf(this.sprite);
  }

  getSprite(): PIXI.AnimatedSprite {
    return this.sprite;
  }

  isMoving(): boolean {
    return this.physicsController.isMoving();
  }

  getCurrentLane(): Lane {
    return this.currentLane;
  }

  switchAnimation(isBoosted: boolean): void {
    const animationName = isBoosted ? 'Hryusha_boost' : 'Hryusha_flying_v2';
    const spritesheet = isBoosted ? this.boostSpritesheet : this.normalSpritesheet;

    const textures = spritesheet.animations[animationName];
    if (!textures) {
      console.error(`❌ Animation "${animationName}" not found!`);
      return;
    }

    const wasPlaying = this.sprite.playing;

    this.sprite.textures = textures;

    if (wasPlaying) {
      this.sprite.play();
    }

    console.log(`🐷 Switched to ${isBoosted ? 'BOOST' : 'NORMAL'} animation (${textures.length} frames)`);
  }

  destroy(): void {
    gsap.killTweensOf(this.sprite);
    if (this.inputController) {
      this.inputController.destroy();
    }
    this.sprite.destroy();
  }

  saveState(): void {
    this.previousY = this.currentY;
  }

  interpolate(alpha: number): void {
    if (!this.sprite) return;
    this.sprite.x = this.currentX;
    this.sprite.y = this.previousY + (this.currentY - this.previousY) * alpha;
  }

  isActive(): boolean {
    return true;
  }
}
