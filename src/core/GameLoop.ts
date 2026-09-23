import { CONFIG } from '../shared/config/constants.ts';

type UpdateCallback = (fixedDelta: number, frameDelta: number) => void;
type RenderCallback = (alpha: number) => void;

export class GameLoop {
  private updateCallback: UpdateCallback;
  private renderCallback: RenderCallback;

  private isRunning: boolean;
  private lastTime: number;
  private accumulator: number;
  private fixedDeltaTime: number;

  private rafId: number | null;

  private frameCount: number;
  private fps: number;
  private fpsUpdateTime: number;

  constructor(updateCallback: UpdateCallback, renderCallback: RenderCallback) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;

    this.isRunning = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedDeltaTime = CONFIG.FIXED_TIMESTEP;

    this.rafId = null;

    this.frameCount = 0;
    this.fps = 60;
    this.fpsUpdateTime = 0;
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;

    this.rafId = requestAnimationFrame((time) => this.loop(time));
  }

  stop(): void {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (deltaTime > CONFIG.MAX_DELTA) {
      deltaTime = CONFIG.MAX_DELTA;
    }

    const frameDeltaTime = deltaTime / 1000;

    this.accumulator += deltaTime;

    let physicsUpdates = 0;
    const maxPhysicsUpdates = CONFIG.MAX_PHYSICS_UPDATES_PER_FRAME;

    while (this.accumulator >= this.fixedDeltaTime && physicsUpdates < maxPhysicsUpdates) {
      this.updateCallback(
        this.fixedDeltaTime / 1000,
        frameDeltaTime
      );
      this.accumulator -= this.fixedDeltaTime;
      physicsUpdates++;
    }

    if (physicsUpdates >= maxPhysicsUpdates && this.accumulator > this.fixedDeltaTime) {
      this.accumulator = this.fixedDeltaTime * 0.9;
    }

    const alpha = this.accumulator / this.fixedDeltaTime;
    this.renderCallback(alpha);

    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }

    this.rafId = requestAnimationFrame((time) => this.loop(time));
  }

  pause(): void {
    this.stop();
  }

  resume(): void {
    this.start();
  }

  getCurrentFPS(): number {
    return this.fps;
  }
}
