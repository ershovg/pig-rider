export class CoinAnimationController {
  constructor() {
    this.minSpeed = 0.2;
    this.maxSpeed = 0.4;
  }

  initializeAnimation(animatedSprite, totalFrames) {
    const randomStartFrame = Math.floor(Math.random() * totalFrames);
    const randomSpeed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);

    animatedSprite.currentFrame = randomStartFrame;
    animatedSprite.animationSpeed = randomSpeed;
    animatedSprite.play();
  }

  stopAnimation(animatedSprite) {
    if (animatedSprite && animatedSprite.playing) {
      animatedSprite.stop();
    }
  }

  resetAnimation(animatedSprite) {
    if (animatedSprite) {
      animatedSprite.currentFrame = 0;
      animatedSprite.animationSpeed = 1;
    }
  }
}
