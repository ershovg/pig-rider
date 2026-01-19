import type * as PIXI from 'pixi.js';

export interface GameLoop {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
}

export interface Renderer {
  start(): void;
}

export interface AssetLoader {
  getAsset(alias: string): PIXI.Texture | PIXI.Spritesheet | null;
}
