import { Stats } from 'pixi-stats';

/**
 * PerformanceMonitor - Минималистичный мониторинг производительности
 *
 * Использует pixi-stats (автоматически отображает):
 * - FPS (frames per second)
 * - MS (milliseconds per frame)
 * - MB (memory usage)
 * - DC (draw calls) ⬅️ ГЛАВНАЯ МЕТРИКА!
 * - TC (texture count)
 *
 * Кастомные метрики (только для логирования):
 * - Active Objects (через getStats())
 * - Culling Stats (через getStats())
 */
export class PerformanceMonitor {
  constructor(renderer, gameLoop) {
    this.renderer = renderer;
    this.gameLoop = gameLoop;
    this.pixiStats = null;
    this.statsContainer = null;
    this.enabled = false;

    // Кастомные метрики (для getStats/logStats)
    this.customMetrics = {
      activeObjects: {
        total: 0,
        obstacles: 0,
        coins: 0,
        clouds: 0,
        stars: 0,
        boosters: 0
      },
      culledThisFrame: 0,
      totalCulled: 0
    };

    this.lastUpdate = performance.now();
    this.updateInterval = 500; // Обновлять каждые 500ms
  }

  /**
   * Включить performance overlay
   */
  enable() {
    if (this.enabled) return;

    // Создать контейнер для pixi-stats
    this.statsContainer = document.createElement('div');
    this.statsContainer.id = 'pixi-stats-container';
    this.statsContainer.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 10000;
    `;
    document.body.appendChild(this.statsContainer);

    // Инициализировать pixi-stats
    if (this.renderer?.app) {
      try {
        this.pixiStats = new Stats(
          this.renderer.app.renderer,
          this.statsContainer,
          this.renderer.app.ticker
        );
        this.enabled = true;
        console.log('📊 Performance Monitor enabled');
      } catch (error) {
        console.error('❌ Failed to initialize pixi-stats:', error);
        this.statsContainer.remove();
        this.statsContainer = null;
      }
    }
  }

  /**
   * Выключить overlay
   */
  disable() {
    if (this.statsContainer) {
      this.statsContainer.remove();
      this.statsContainer = null;
    }
    this.pixiStats = null;
    this.enabled = false;
    console.log('📊 Performance Monitor disabled');
  }

  /**
   * Toggle (Shift+P)
   */
  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Обновить кастомные метрики (вызывается из Game.js каждый frame)
   */
  update(context = {}) {
    if (!this.enabled) return;

    const now = performance.now();
    if (now - this.lastUpdate < this.updateInterval) return;

    const { spawnSystem, cullingCoordinator } = context;

    // Active Objects
    if (spawnSystem) {
      const obstacles = spawnSystem.getActiveObstacles().length;
      const coins = spawnSystem.getActiveCoins().length;
      const clouds = spawnSystem.getActiveClouds().length;
      const stars = spawnSystem.getActiveStars().length;
      const boosters = spawnSystem.getActiveBoosters().length;

      this.customMetrics.activeObjects = {
        total: obstacles + coins + clouds + stars + boosters,
        obstacles,
        coins,
        clouds,
        stars,
        boosters
      };
    }

    // Culling Stats
    if (cullingCoordinator) {
      const stats = cullingCoordinator.getStats();
      this.customMetrics.culledThisFrame = stats.lastFrameCulled || 0;
      this.customMetrics.totalCulled = stats.totalCulled || 0;
    }

    this.lastUpdate = now;
  }

  /**
   * Получить все метрики (pixi-stats + кастомные)
   */
  getStats() {
    return {
      // pixi-stats метрики (если доступны)
      fps: this.pixiStats?.fps || 0,
      ms: this.pixiStats?.ms || 0,
      mb: this.pixiStats?.mb || 0,
      dc: this.pixiStats?.dc || 0,
      tc: this.pixiStats?.tc || 0,

      // Кастомные метрики
      ...this.customMetrics
    };
  }

  /**
   * Логировать все метрики в консоль
   */
  logStats() {
    const stats = this.getStats();
    console.table({
      '📊 FPS': stats.fps,
      '⏱️ MS': stats.ms,
      '💾 Memory (MB)': stats.mb,
      '🎨 Draw Calls': stats.dc,
      '🖼️ Textures': stats.tc,
      '🎮 Active Objects': stats.activeObjects.total,
      '✂️ Culled/Frame': stats.culledThisFrame,
      '📈 Total Culled': stats.totalCulled
    });
  }
}
