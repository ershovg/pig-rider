import { CONFIG } from '../config/constants.js';

export class GameLoop {
  constructor(updateCallback, renderCallback) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;

    this.isRunning = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedDeltaTime = CONFIG.FIXED_TIMESTEP;

    this.rafId = null;

    // 🆕 FPS tracking для Performance Monitor
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

    this.accumulator += deltaTime;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedDeltaTime) {
      this.updateCallback(this.fixedDeltaTime / 1000); // Convert to seconds
      this.accumulator -= this.fixedDeltaTime;
    }

    // Render with interpolation factor
    const alpha = this.accumulator / this.fixedDeltaTime;
    this.renderCallback(alpha);

    // 🆕 FPS calculation
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

  /**
   * 🆕 Получить текущий FPS для Performance Monitor
   */
  getCurrentFPS() {
    return this.fps;
  }
}
