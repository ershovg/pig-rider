import * as PIXI from 'pixi.js';

export class CoinCollectEffect {
  private container: PIXI.Container;
  private sprite: PIXI.AnimatedSprite;
  private active: boolean;

  constructor(spritesheet: PIXI.Spritesheet, container: PIXI.Container) {
    this.container = container;

    const frames = spritesheet.animations['CoinCollect'];
    this.sprite = new PIXI.AnimatedSprite(frames);
    this.sprite.anchor.set(0.5);
    this.sprite.animationSpeed = 0.25;
    this.sprite.loop = false;

    const targetSize = 120;
    const scale = targetSize / 100;
    this.sprite.scale.set(scale);

    this.active = false;
    this.sprite.visible = false;

    if (this.container) {
      this.container.addChild(this.sprite);
    }

    this.sprite.onComplete = () => {
      this.deactivate();
    };
  }

  activate(x: number, y: number): void {
    this.active = true;
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.visible = true;
    this.sprite.alpha = 1;

    const targetSize = 120;
    const scale = targetSize / 100;
    this.sprite.scale.set(scale);

    this.sprite.gotoAndPlay(0);
  }

  deactivate(): void {
    this.active = false;
    this.sprite.visible = false;
    this.sprite.stop();
  }

  getSprite(): PIXI.AnimatedSprite {
    return this.sprite;
  }

  isActive(): boolean {
    return this.active;
  }

  reset(): void {
    this.deactivate();

    const targetSize = 120;
    const scale = targetSize / 100;
    this.sprite.scale.set(scale);
  }
}
