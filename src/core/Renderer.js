import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/constants.js';

export class Renderer {
  constructor(canvasId = 'game-canvas') {
    this.canvasId = canvasId;
    this.app = null;
    this.stage = null;
  }

  /**
   * Initialize PixiJS Application
   */
  async init() {
    this.app = new PIXI.Application();

    await this.app.init({
      width: CONFIG.CANVAS_WIDTH,
      height: CONFIG.CANVAS_HEIGHT,
      backgroundAlpha: 0, // Прозрачный фон для Webflow
      antialias: true,
      roundPixels: true, // Округление координат для pixel-perfect рендеринга (устраняет "дергание")
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      canvas: document.getElementById(this.canvasId)
    });

    this.stage = this.app.stage;

    // Stop ticker until game starts (prevents rendering before play button)
    this.app.ticker.stop();

    // Make canvas responsive
    this.setupResponsive();

    console.log('🎨 Renderer initialized (ticker stopped)');
    return this.app;
  }

  /**
   * Start rendering
   */
  start() {
    if (this.app) {
      this.app.ticker.start();
      console.log('🎨 Renderer started');
    }
  }

  /**
   * Stop rendering
   */
  stop() {
    if (this.app) {
      this.app.ticker.stop();
      console.log('🎨 Renderer stopped');
    }
  }

  /**
   * Setup responsive canvas scaling
   */
  setupResponsive() {
    const resize = () => {
      const parent = this.app.canvas.parentElement;

      // Если родитель не имеет размеров, используем window
      const containerWidth = parent.clientWidth || window.innerWidth;
      const containerHeight = parent.clientHeight || window.innerHeight;

      const scaleX = containerWidth / CONFIG.CANVAS_WIDTH;
      const scaleY = containerHeight / CONFIG.CANVAS_HEIGHT;

      // Используем Math.max чтобы заполнить весь контейнер
      // (часть canvas может обрезаться, но заполнит всё пространство)
      const scale = Math.max(scaleX, scaleY);

      this.app.canvas.style.width = `${CONFIG.CANVAS_WIDTH * scale}px`;
      this.app.canvas.style.height = `${CONFIG.CANVAS_HEIGHT * scale}px`;

      console.log(`📐 Canvas scaled: ${CONFIG.CANVAS_WIDTH * scale}x${CONFIG.CANVAS_HEIGHT * scale}`);
    };

    window.addEventListener('resize', resize);
    resize();
  }

  /**
   * Add child to stage
   */
  addToStage(displayObject) {
    this.stage.addChild(displayObject);
  }

  /**
   * Remove child from stage
   */
  removeFromStage(displayObject) {
    this.stage.removeChild(displayObject);
  }

  /**
   * Clear all stage children
   */
  clearStage() {
    this.stage.removeChildren();
  }

  /**
   * Destroy renderer
   */
  destroy() {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
  }
}
