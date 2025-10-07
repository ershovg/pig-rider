/**
 * UIController - управление HTML UI элементами
 * Отвечает за показ/скрытие экранов, обновление счётчиков
 * Адаптирован под Webflow структуру
 */

export class UIController {
  constructor() {
    // Screens (Webflow structure)
    this.startScreen = document.querySelector('.game-ui.game-start');
    this.runningScreen = document.querySelector('.game-ui.game-running');

    // TODO: Добавить когда будут готовы в Webflow
    // this.pauseScreen = document.querySelector('.game-ui.game-pause');
    // this.boostScreen = document.querySelector('.game-ui.game-boost');
    // this.endScreen = document.querySelector('.game-ui.game-end');

    // Game counter (в running screen)
    this.coinCounter = document.querySelector('[game-counter]');

    // Buttons
    this.startBtn = document.querySelector('[game-btn-start]');

    // TODO: Добавить когда будут готовы
    // this.pauseBtn = document.querySelector('[game-btn-pause]');
    // this.resumeBtn = document.querySelector('[game-btn-resume]');
    // this.retryBtn = document.querySelector('[game-btn-retry]');

    // Canvas
    this.canvas = document.getElementById('game-canvas');

    console.log('🎨 UIController initialized (Webflow structure)');
  }

  /**
   * Show start screen (Webflow)
   */
  showStartScreen() {
    this.hideAll();
    if (this.startScreen) {
      this.startScreen.style.display = 'block';
    }
  }

  /**
   * Hide start screen
   */
  hideStartScreen() {
    if (this.startScreen) {
      this.startScreen.style.display = 'none';
    }
  }

  /**
   * Show running screen (game HUD)
   */
  showRunningScreen() {
    this.hideAll();
    if (this.runningScreen) {
      this.runningScreen.style.display = 'block';
    }
  }

  /**
   * Hide running screen
   */
  hideRunningScreen() {
    if (this.runningScreen) {
      this.runningScreen.style.display = 'none';
    }
  }

  /**
   * Update coin counter
   * @param {number} current - Current coins
   * @param {number} target - Target coins (optional)
   */
  updateCoinCount(current, target = null) {
    if (this.coinCounter) {
      if (target !== null) {
        this.coinCounter.textContent = `${current}/${target}`;
      } else {
        this.coinCounter.textContent = current.toString();
      }
    }
  }

  /**
   * Show booster modal (TODO: когда будет готов в Webflow)
   */
  showBoosterModal() {
    console.warn('⚠️ Booster modal not implemented in Webflow yet');
  }

  /**
   * Hide booster modal (TODO: когда будет готов в Webflow)
   */
  hideBoosterModal() {
    console.warn('⚠️ Booster modal not implemented in Webflow yet');
  }

  /**
   * Show win screen (TODO: когда будет готов в Webflow)
   */
  showWinScreen(score) {
    console.log(`🏆 WIN! Score: ${score}`);
    console.warn('⚠️ Win screen not implemented in Webflow yet');
  }

  /**
   * Show lose screen (TODO: когда будет готов в Webflow)
   */
  showLoseScreen(score) {
    console.log(`💀 LOSE! Score: ${score}`);
    console.warn('⚠️ Lose screen not implemented in Webflow yet');
  }

  /**
   * Hide all screens
   */
  hideAll() {
    if (this.startScreen) this.startScreen.style.display = 'none';
    if (this.runningScreen) this.runningScreen.style.display = 'none';
    // TODO: Добавить остальные экраны когда будут готовы
  }

  /**
   * Legacy methods for compatibility
   */
  hideLoading() {
    console.log('✅ Loading complete');
  }

  showHUD() {
    this.showRunningScreen();
  }

  hideHUD() {
    this.hideRunningScreen();
  }

  /**
   * Setup button event listeners (Webflow)
   * @param {Object} callbacks - Event callbacks
   */
  setupEventListeners(callbacks) {
    // Start button
    if (callbacks.onPlayClick && this.startBtn) {
      this.startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        callbacks.onPlayClick();
      });
    }

    // TODO: Добавить остальные кнопки когда будут готовы в Webflow
    // if (callbacks.onPause && this.pauseBtn) {
    //   this.pauseBtn.addEventListener('click', callbacks.onPause);
    // }

    // if (callbacks.onRetry && this.retryBtn) {
    //   this.retryBtn.addEventListener('click', callbacks.onRetry);
    // }
  }

  /**
   * Cleanup
   */
  destroy() {
    // Remove event listeners if needed
    console.log('🗑️ UIController destroyed');
  }
}
