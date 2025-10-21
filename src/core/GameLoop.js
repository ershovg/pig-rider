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

    // 🆕 Store actual frame delta for spawning systems
    // This represents REAL time between visual frames, not physics steps
    const frameDeltaTime = deltaTime / 1000; // Convert to seconds

    this.accumulator += deltaTime;

    // 🆕 Track how many physics updates we're about to do
    let physicsUpdates = 0;
    const maxPhysicsUpdates = CONFIG.MAX_PHYSICS_UPDATES_PER_FRAME || 4;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedDeltaTime && physicsUpdates < maxPhysicsUpdates) {
      // 🆕 Pass both physics delta AND frame delta
      // Physics delta: for deterministic physics simulation
      // Frame delta: for time-based spawning that shouldn't accumulate
      this.updateCallback(
        this.fixedDeltaTime / 1000,  // Physics delta (fixed timestep)
        frameDeltaTime                // Frame delta (actual time passed)
      );
      this.accumulator -= this.fixedDeltaTime;
      physicsUpdates++;
    }

    // 🆕 If we hit the limit, clamp the accumulator to prevent runaway
    if (physicsUpdates >= maxPhysicsUpdates && this.accumulator > this.fixedDeltaTime) {
      console.warn(`[GameLoop] Clamped ${Math.floor(this.accumulator / this.fixedDeltaTime)} pending physics updates to prevent spiral`);
      this.accumulator = this.fixedDeltaTime * 0.9; // Keep some for next frame
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
