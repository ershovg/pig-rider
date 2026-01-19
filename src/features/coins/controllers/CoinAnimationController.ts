import * as PIXI from 'pixi.js';

export class CoinAnimationController {
  private minSpeed: number;
  private maxSpeed: number;

  constructor() {
    this.minSpeed = 0.2;
    this.maxSpeed = 0.4;
  }

  initializeAnimation(animatedSprite: PIXI.AnimatedSprite, totalFrames: number): void {
    const randomStartFrame = Math.floor(Math.random() * totalFrames);
    const randomSpeed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);

    animatedSprite.currentFrame = randomStartFrame;
    animatedSprite.animationSpeed = randomSpeed;
    animatedSprite.play();
  }

  stopAnimation(animatedSprite: PIXI.AnimatedSprite): void {
    if (animatedSprite && animatedSprite.playing) {
      animatedSprite.stop();
    }
  }

  resetAnimation(animatedSprite: PIXI.AnimatedSprite): void {
    if (animatedSprite) {
      animatedSprite.currentFrame = 0;
      animatedSprite.animationSpeed = 1;
    }
  }
}
