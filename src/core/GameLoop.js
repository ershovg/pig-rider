import { CONFIG } from '../shared/config/constants.js';

export class GameLoop {
  constructor(updateCallback, renderCallback) {
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

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;

    this.rafId = requestAnimationFrame((time) => this.loop(time));
    console.log('🎮 Game loop started');
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    console.log('⏸️ Game loop stopped');
  }

  /**
   * Main game loop with fixed timestep
   */
  loop(currentTime) {
    if (!this.isRunning) return;

    // Calculate frame time
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Cap deltaTime to prevent spiral of death
    if (deltaTime > CONFIG.MAX_DELTA) {
      deltaTime = CONFIG.MAX_DELTA;
    }

    const frameDeltaTime = deltaTime / 1000;

    this.accumulator += deltaTime;

    let physicsUpdates = 0;
    const maxPhysicsUpdates = CONFIG.MAX_PHYSICS_UPDATES_PER_FRAME || 4;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedDeltaTime && physicsUpdates < maxPhysicsUpdates) {
      this.updateCallback(
        this.fixedDeltaTime / 1000,
        frameDeltaTime
      );
      this.accumulator -= this.fixedDeltaTime;
      physicsUpdates++;
    }

    if (physicsUpdates >= maxPhysicsUpdates && this.accumulator > this.fixedDeltaTime) {
      console.warn(`[GameLoop] Clamped ${Math.floor(this.accumulator / this.fixedDeltaTime)} pending physics updates to prevent spiral`);
      this.accumulator = this.fixedDeltaTime * 0.9;
    }

    // Render with interpolation factor
    const alpha = this.accumulator / this.fixedDeltaTime;
    this.renderCallback(alpha);

    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }

    // Schedule next frame
    this.rafId = requestAnimationFrame((time) => this.loop(time));
  }

  /**
   * Pause the game loop
   */
  pause() {
    this.stop();
  }

  /**
   * Resume the game loop
   */
  resume() {
    this.start();
  }

  getCurrentFPS() {
    return this.fps;
  }
}
