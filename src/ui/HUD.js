import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/constants.js';

export class HUD {
  constructor() {
    this.container = new PIXI.Container();
    this.container.zIndex = 1000;

    this.score = 0;

    this.createUI();
  }

  /**
   * Create HUD elements
   */
  createUI() {
    // Score text
    this.scoreText = new PIXI.Text('Eggs: 0 / 500', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      stroke: 0x000000,
      strokeThickness: 6,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 4,
      dropShadowDistance: 4
    });
    this.scoreText.x = 50;
    this.scoreText.y = 50;
    this.container.addChild(this.scoreText);

    // Speed indicator (optional debug info)
    this.speedText = new PIXI.Text('Speed: 1.0x', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 32,
      fill: 0xFFFFFF,
      stroke: 0x000000,
      strokeThickness: 4
    });
    this.speedText.x = 50;
    this.speedText.y = 120;
    this.container.addChild(this.speedText);

    console.log('📊 HUD created');
  }

  /**
   * Update score display
   */
  updateScore(score) {
    this.score = score;
    this.scoreText.text = `Eggs: ${score} / ${CONFIG.TARGET_EGGS}`;
  }

  /**
   * Update speed display
   */
  updateSpeed(speed) {
    this.speedText.text = `Speed: ${speed.toFixed(1)}x`;
  }

  /**
   * Reset HUD
   */
  reset() {
    this.score = 0;
    this.updateScore(0);
    this.updateSpeed(1.0);
  }

  /**
   * Get container for adding to stage
   */
  getContainer() {
    return this.container;
  }

  /**
   * Show HUD
   */
  show() {
    this.container.visible = true;
  }

  /**
   * Hide HUD
   */
  hide() {
    this.container.visible = false;
  }

  /**
   * Destroy HUD
   */
  destroy() {
    this.container.destroy({ children: true });
  }
}
