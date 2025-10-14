/**
 * PerformanceMonitor - Отслеживание производительности игры
 *
 * Метрики:
 * - FPS (frames per second)
 * - Draw Calls (количество вызовов GPU)
 * - Memory Usage (JS heap size)
 * - Active Objects (entities на сцене)
 * - Culling Stats (сколько объектов удалено за frame)
 */
export class PerformanceMonitor {
  constructor(renderer, gameLoop) {
    this.renderer = renderer;
    this.gameLoop = gameLoop;

    this.stats = {
      fps: 0,
      drawCalls: 0,
      memory: 0,
      activeObjects: 0,
      culledThisFrame: 0,
      totalCulled: 0
    };

    this.frameCount = 0;
    this.lastUpdate = performance.now();
    this.updateInterval = 1000; // Обновлять stats каждую секунду

    this.overlay = null;
    this.enabled = false;
  }

  /**
   * Включить performance overlay (показать на экране)
   */
  enable() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'perf-monitor';
    this.overlay.style.cssText = `
      position: fixed;
      top: 5rem;
      left: 25rem;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      pointer-events: none;
      min-width: 200px;
    `;

    document.body.appendChild(this.overlay);
    this.enabled = true;
    console.log('📊 Performance Monitor enabled');
  }

  /**
   * Выключить overlay
   */
  disable() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.enabled = false;
    console.log('📊 Performance Monitor disabled');
  }

  /**
   * Toggle (включить/выключить)
   */
  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Обновить метрики (вызывается каждый frame из Game.js)
   *
   * @param {Object} context - { spawnSystem, cullingCoordinator }
   */
  update(context = {}) {
    if (!this.enabled) return;

    this.frameCount++;
    const now = performance.now();
    const delta = now - this.lastUpdate;

    // Обновляем stats каждую секунду
    if (delta >= this.updateInterval) {
      this.collectStats(context);
      this.render();

      this.frameCount = 0;
      this.lastUpdate = now;
    }
  }

  /**
   * Собрать метрики производительности
   */
  collectStats(context) {
    const { spawnSystem, cullingCoordinator } = context;

    // FPS (из gameLoop)
    this.stats.fps = this.gameLoop ? Math.round(this.gameLoop.getCurrentFPS()) : 0;

    // Draw Calls (из PixiJS renderer)
    if (this.renderer && this.renderer.app) {
      const info = this.renderer.app.renderer.renderingToScreen;
      this.stats.drawCalls = info || 'N/A';
    }

    // Memory (JS heap size)
    if (performance.memory) {
      this.stats.memory = Math.round(performance.memory.usedJSHeapSize / 1048576); // MB
    }

    // Active Objects (из SpawnSystem)
    if (spawnSystem) {
      const obstacles = spawnSystem.getActiveObstacles().length;
      const coins = spawnSystem.getActiveCoins().length;
      const clouds = spawnSystem.getActiveClouds().length;
      const stars = spawnSystem.getActiveStars().length;
      const boosters = spawnSystem.getActiveBoosters().length;

      this.stats.activeObjects = {
        total: obstacles + coins + clouds + stars + boosters,
        obstacles,
        coins,
        clouds,
        stars,
        boosters
      };
    }

    // Culling Stats (из CullingCoordinator)
    if (cullingCoordinator) {
      const cullingStats = cullingCoordinator.getStats();
      this.stats.culledThisFrame = cullingStats.lastFrameCulled || 0;
      this.stats.totalCulled = cullingStats.totalCulled || 0;
    }
  }

  /**
   * Отрендерить overlay с метриками
   */
  render() {
    if (!this.overlay) return;

    const fpsColor = this.stats.fps >= 55 ? '#0f0' : this.stats.fps >= 30 ? '#ff0' : '#f00';

    const memoryColor = this.stats.memory < 100 ? '#0f0' : this.stats.memory < 200 ? '#ff0' : '#f00';

    const objects = this.stats.activeObjects;

    this.overlay.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold; color: #fff;">🎮 Performance Monitor</div>

      <div style="color: ${fpsColor};">
        FPS: <strong>${this.stats.fps}</strong>
      </div>

      <div style="color: #fff; margin-top: 4px;">
        Draw Calls: <strong>${this.stats.drawCalls}</strong>
      </div>

      <div style="color: ${memoryColor}; margin-top: 4px;">
        Memory: <strong>${this.stats.memory} MB</strong>
      </div>

      <div style="color: #fff; margin-top: 8px; font-weight: bold;">
        Active Objects: <strong>${objects.total}</strong>
      </div>

      <div style="color: #888; font-size: 11px; margin-left: 10px;">
        Obstacles: ${objects.obstacles}<br>
        Coins: ${objects.coins}<br>
        Clouds: ${objects.clouds}<br>
        Stars: ${objects.stars}<br>
        Boosters: ${objects.boosters}
      </div>

      <div style="color: #fff; margin-top: 8px;">
        Culled/frame: <strong>${this.stats.culledThisFrame}</strong>
      </div>

      <div style="color: #888; font-size: 11px;">
        Total culled: ${this.stats.totalCulled}
      </div>

      <div style="color: #666; margin-top: 8px; font-size: 10px;">
        Press Shift+P to toggle
      </div>
    `;
  }

  /**
   * Получить текущие stats (для логирования)
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Логировать stats в console
   */
  logStats() {
    console.table({
      FPS: this.stats.fps,
      'Draw Calls': this.stats.drawCalls,
      'Memory (MB)': this.stats.memory,
      'Active Objects': this.stats.activeObjects.total,
      'Culled/Frame': this.stats.culledThisFrame,
      'Total Culled': this.stats.totalCulled
    });
  }
}
