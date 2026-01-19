import * as PIXI from 'pixi.js';

export class Interpolatable {
  protected previousX: number = 0;
  protected previousY: number = 0;
  protected currentX: number = 0;
  protected currentY: number = 0;
  protected sprite: PIXI.Sprite | null = null;

  saveState(): void {
    this.previousX = this.currentX;
    this.previousY = this.currentY;
  }

  interpolate(alpha: number): void {
    if (!this.sprite) return;

    this.sprite.x = this.previousX + (this.currentX - this.previousX) * alpha;
    this.sprite.y = this.previousY + (this.currentY - this.previousY) * alpha;
  }

  syncSpriteToPhysics(): void {
    if (!this.sprite) return;
    this.sprite.x = this.currentX;
    this.sprite.y = this.currentY;
    this.previousX = this.currentX;
    this.previousY = this.currentY;
  }
}
