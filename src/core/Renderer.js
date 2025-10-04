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
      backgroundColor: 0x87CEEB, // Sky blue background (placeholder)
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      canvas: document.getElementById(this.canvasId)
    });

    this.stage = this.app.stage;

    // Make canvas responsive
    this.setupResponsive();

    console.log('🎨 Renderer initialized');
    return this.app;
  }

  /**
   * Setup responsive canvas scaling
   */
  setupResponsive() {
    const resize = () => {
      const parent = this.app.canvas.parentElement;
      const scaleX = parent.clientWidth / CONFIG.CANVAS_WIDTH;
      const scaleY = parent.clientHeight / CONFIG.CANVAS_HEIGHT;
      const scale = Math.min(scaleX, scaleY);

      this.app.canvas.style.width = `${CONFIG.CANVAS_WIDTH * scale}px`;
      this.app.canvas.style.height = `${CONFIG.CANVAS_HEIGHT * scale}px`;
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
