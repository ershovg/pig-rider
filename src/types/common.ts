export type Lane = 0 | 1 | 2;

export interface Point2D {
  x: number;
  y: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rectangle extends Point2D, Size {}

export type GameState = 'idle' | 'running' | 'paused' | 'win' | 'lose';
