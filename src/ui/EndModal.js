import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/constants.js';

export class EndModal {
  constructor(onRestartCallback) {
    this.onRestartCallback = onRestartCallback;
    this.container = new PIXI.Container();
    this.container.zIndex = 2000;
    this.container.visible = false;

    this.isWin = false;
    this.finalScore = 0;

    this.createModal();
  }

  /**
   * Create end modal UI
   */
  createModal() {
    // Semi-transparent background
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    bg.fill({ color: 0x000000, alpha: 0.8 });
    this.container.addChild(bg);

    // Title (will be updated based on win/lose)
    this.titleText = new PIXI.Text('GAME OVER', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 120,
      fontWeight: 'bold',
      fill: 0xFF0000,
      stroke: 0x000000,
      strokeThickness: 10,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 8,
      dropShadowDistance: 6
    });
    this.titleText.anchor.set(0.5);
    this.titleText.x = CONFIG.CANVAS_WIDTH / 2;
    this.titleText.y = CONFIG.CANVAS_HEIGHT / 2 - 200;
    this.container.addChild(this.titleText);

    // Score display
    this.scoreText = new PIXI.Text('Final Score: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 56,
      fill: 0xFFFFFF,
      stroke: 0x000000,
      strokeThickness: 5
    });
    this.scoreText.anchor.set(0.5);
    this.scoreText.x = CONFIG.CANVAS_WIDTH / 2;
    this.scoreText.y = CONFIG.CANVAS_HEIGHT / 2;
    this.container.addChild(this.scoreText);

    // Message
    this.messageText = new PIXI.Text('', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 40,
      fill: 0xFFFFFF,
      align: 'center',
      stroke: 0x000000,
      strokeThickness: 4
    });
    this.messageText.anchor.set(0.5);
    this.messageText.x = CONFIG.CANVAS_WIDTH / 2;
    this.messageText.y = CONFIG.CANVAS_HEIGHT / 2 + 100;
    this.container.addChild(this.messageText);

    // Restart button
    const restartButton = new PIXI.Text('CLICK TO RESTART', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0x00FF00,
      stroke: 0x000000,
      strokeThickness: 6
    });
    restartButton.anchor.set(0.5);
    restartButton.x = CONFIG.CANVAS_WIDTH / 2;
    restartButton.y = CONFIG.CANVAS_HEIGHT / 2 + 220;
    this.container.addChild(restartButton);

    // Click/Touch listener on background
    bg.eventMode = 'static';
    bg.cursor = 'pointer';
    bg.on('pointerdown', () => {
      if (this.container.visible) {
        this.restart();
      }
    });

    // Keyboard listener (Space)
    this.keydownHandler = (e) => {
      if (e.code === 'Space' && this.container.visible) {
        e.preventDefault();
        this.restart();
      }
    };
    window.addEventListener('keydown', this.keydownHandler);

    console.log('🏁 End modal created');
  }

  /**
   * Show end modal with results
   */
  showResults(isWin, finalScore) {
    this.isWin = isWin;
    this.finalScore = finalScore;

    if (isWin) {
      this.titleText.text = 'VICTORY!';
      this.titleText.style.fill = 0xFFD700; // Gold
      this.messageText.text = 'You collected 500 eggs!\nCongratulations!';
    } else {
      this.titleText.text = 'GAME OVER';
      this.titleText.style.fill = 0xFF0000; // Red
      this.messageText.text = 'You hit an obstacle!\nTry again!';
    }

    this.scoreText.text = `Final Score: ${finalScore} eggs`;

    this.show();
  }

  /**
   * Restart game
   */
  restart() {
    this.hide();
    if (this.onRestartCallback) {
      this.onRestartCallback();
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
