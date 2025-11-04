export interface Renderable {
  show(): void;
  hide(): void;
  isVisible(): boolean;
}

export interface Cullable extends Renderable {
  shouldCull(threshold: number): boolean;
}

export interface Interpolatable {
  saveState(): void;
  interpolate(alpha: number): void;
}
