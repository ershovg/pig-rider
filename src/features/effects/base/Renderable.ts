import * as PIXI from 'pixi.js';
import { Lane } from '../../../types/common';

export abstract class Renderable {
  constructor() {
    if (this.constructor === Renderable) {
      throw new Error('Renderable is abstract and cannot be instantiated directly');
    }
  }

  abstract activate(lane: Lane, x: number): void;
  abstract deactivate(): void;
  abstract update(deltaTime: number, gameSpeed: number): void;
  abstract isActive(): boolean;
  abstract getSprite(): PIXI.Sprite | PIXI.AnimatedSprite | PIXI.Container;
  abstract reset(): void;
}
