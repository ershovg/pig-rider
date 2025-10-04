import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/constants.js';

export class StartModal {
  constructor(onStartCallback) {
    this.onStartCallback = onStartCallback;
    this.container = new PIXI.Container();
    this.container.zIndex = 2000;

    this.createModal();
  }

  /**
   * Create start modal UI
   */
  createModal() {
    // Semi-transparent background
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    bg.fill({ color: 0x000000, alpha: 0.7 });
    this.container.addChild(bg);

    // Title
    const title = new PIXI.Text('PIG RIDER', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 120,
      fontWeight: 'bold',
      fill: 0xFFD700,
      stroke: 0x000000,
      strokeThickness: 10,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 8,
      dropShadowDistance: 6
    });
    title.anchor.set(0.5);
    title.x = CONFIG.CANVAS_WIDTH / 2;
    title.y = CONFIG.CANVAS_HEIGHT / 2 - 200;
    this.container.addChild(title);

    // Instructions
    const instructions = new PIXI.Text(
      'Collect 500 eggs to win!\n\nUse ↑ ↓ or W S to switch lanes\nAvoid obstacles, collect coins',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: 40,
        fill: 0xFFFFFF,
        align: 'center',
        stroke: 0x000000,
        strokeThickness: 4
      }
    );
    instructions.anchor.set(0.5);
    instructions.x = CONFIG.CANVAS_WIDTH / 2;
    instructions.y = CONFIG.CANVAS_HEIGHT / 2;
    this.container.addChild(instructions);

    // Start button (interactive text)
    const startButton = new PIXI.Text('CLICK TO START', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 56,
      fontWeight: 'bold',
      fill: 0x00FF00,
      stroke: 0x000000,
      strokeThickness: 6
    });
    startButton.anchor.set(0.5);
    startButton.x = CONFIG.CANVAS_WIDTH / 2;
    startButton.y = CONFIG.CANVAS_HEIGHT / 2 + 200;
    this.container.addChild(startButton);

    // Pulsing animation for start button
    this.animateButton(startButton);

    // Click/Touch listener on background
    bg.eventMode = 'static';
    bg.cursor = 'pointer';
    bg.on('pointerdown', () => this.startGame());

    // Keyboard listener (Space)
    this.keydownHandler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.startGame();
      }
    };
    window.addEventListener('keydown', this.keydownHandler);

    console.log('🎬 Start modal created');
  }

  /**
   * Animate start button with pulsing effect
   */
  animateButton(button) {
    const pulse = () => {
      if (!this.container.visible) return;

      button.scale.x = 1 + Math.sin(Date.now() / 300) * 0.1;
      button.scale.y = 1 + Math.sin(Date.now() / 300) * 0.1;

      requestAnimationFrame(pulse);
    };
    pulse();
  }

  /**
   * Start game
   */
  startGame() {
    this.hide();
    window.removeEventListener('keydown', this.keydownHandler);
    if (this.onStartCallback) {
      this.onStartCallback();
    }
  }

  /**
   * Show modal
   */
  show() {
    this.container.visible = true;
  }

  /**
   * Hide modal
   */
  hide() {
    this.container.visible = false;
  }

  /**
   * Get container
   */
  getContainer() {
    return this.container;
  }

  /**
   * Destroy modal
   */
  destroy() {
    window.removeEventListener('keydown', this.keydownHandler);
    this.container.destroy({ children: true });
  }
}
