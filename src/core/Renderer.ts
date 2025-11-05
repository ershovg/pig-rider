import * as PIXI from 'pixi.js';
import { CONFIG } from '../shared/config/constants.ts';

export class Renderer {
  private canvasId: string;
  private app: PIXI.Application | null;
  private stage: PIXI.Container | null;
  public decorationLayer: PIXI.Container | null;
  public effectsLayer: PIXI.Container | null;

  constructor(canvasId: string = 'game-canvas') {
    this.canvasId = canvasId;
    this.app = null;
    this.stage = null;
    this.decorationLayer = null;
    this.effectsLayer = null;
  }

  async init(): Promise<PIXI.Application> {
    this.app = new PIXI.Application();

    await this.app.init({
      width: CONFIG.CANVAS_WIDTH,
      height: CONFIG.CANVAS_HEIGHT,
      backgroundAlpha: 0,
      antialias: true,
      roundPixels: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      canvas: document.getElementById(this.canvasId) as HTMLCanvasElement
    });

    this.stage = this.app.stage;

    // 🎨 Создаем слои с использованием zIndex для гарантированного порядка:
    // 1. decorationLayer (zIndex: 0) - фоновые декорации (облака, звезды)
    // 2. gameLayer (zIndex: 10, stage напрямую) - игровые объекты (игрок, препятствия, монеты)
    // 3. effectsLayer (zIndex: 20) - визуальные эффекты поверх всего
    this.decorationLayer = new PIXI.Container();
    this.effectsLayer = new PIXI.Container();

    // Включаем сортировку по zIndex для stage
    this.stage.sortableChildren = true;

    // Устанавливаем zIndex для гарантированного порядка рендеринга
    this.decorationLayer.zIndex = 0;   // Снизу (фон)
    this.effectsLayer.zIndex = 20;     // Сверху (поверх всего)
    // Игровые объекты добавляются напрямую в stage с zIndex = 10 (default)

    this.stage.addChild(this.decorationLayer);
    this.stage.addChild(this.effectsLayer);

    this.stage.eventMode = 'passive';
    this.stage.interactiveChildren = false;
    this.decorationLayer.eventMode = 'none';
    this.decorationLayer.interactiveChildren = false;
    this.effectsLayer.eventMode = 'none';
    this.effectsLayer.interactiveChildren = false;

    this.app.ticker.stop();

    this.setupResponsive();

    console.log('🎨 Renderer initialized (ticker stopped, ParticleContainer ready)');
    return this.app;
  }

  start(): void {
    if (this.app) {
      this.app.ticker.start();
      console.log('🎨 Renderer started');
    }
  }

  stop(): void {
    if (this.app) {
      this.app.ticker.stop();
      console.log('🎨 Renderer stopped');
    }
  }

  private setupResponsive(): void {
    const resize = (): void => {
      if (!this.app) return;

      const parent = this.app.canvas.parentElement;

      const containerWidth = parent?.clientWidth || window.innerWidth;
      const containerHeight = parent?.clientHeight || window.innerHeight;

      const scaleX = containerWidth / CONFIG.CANVAS_WIDTH;
      const scaleY = containerHeight / CONFIG.CANVAS_HEIGHT;

      const scale = Math.max(scaleX, scaleY);

      this.app.canvas.style.width = `${CONFIG.CANVAS_WIDTH * scale}px`;
      this.app.canvas.style.height = `${CONFIG.CANVAS_HEIGHT * scale}px`;

      console.log(`📐 Canvas scaled: ${CONFIG.CANVAS_WIDTH * scale}x${CONFIG.CANVAS_HEIGHT * scale}`);
    };

    window.addEventListener('resize', resize);
    resize();
  }

  addToStage(displayObject: PIXI.Container): void {
    this.stage?.addChild(displayObject);
  }

  removeFromStage(displayObject: PIXI.Container): void {
    this.stage?.removeChild(displayObject);
  }

  clearStage(): void {
    this.stage?.removeChildren();
  }

  destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
      this.stage = null;
      this.decorationLayer = null;
      this.effectsLayer = null;
    }
  }
}
