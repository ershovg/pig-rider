export interface GameLoop {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
}

export interface Renderer {
  start(): void;
}
