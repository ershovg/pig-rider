/**
 * UIController - управление HTML UI элементами
 * Отвечает за показ/скрытие экранов, обновление счётчиков
 */

export class UIController {
  constructor() {
    // Screens
    this.loadingScreen = document.getElementById('loading-screen');
    this.startScreen = document.getElementById('start-screen');
    this.winScreen = document.getElementById('win-screen');
    this.loseScreen = document.getElementById('lose-screen');

    // HUD
    this.gameHUD = document.getElementById('game-hud');
    this.coinCount = document.getElementById('coin-count');
    this.mellowLogo = document.getElementById('mellow-logo');

    // Modals
    this.boosterModal = document.getElementById('booster-modal');

    // Buttons
    this.playBtn = document.getElementById('play-btn');
    this.boosterContinueBtn = document.getElementById('booster-continue-btn');
    this.winDemoBtn = document.getElementById('win-demo-btn');
    this.winRetryBtn = document.getElementById('win-retry-btn');
    this.loseDemoBtn = document.getElementById('lose-demo-btn');
    this.loseRetryBtn = document.getElementById('lose-retry-btn');

    // Score displays
    this.winScore = document.getElementById('win-score');
    this.loseScore = document.getElementById('lose-score');

    console.log('🎨 UIController initialized');
  }

  /**
   * Hide loading screen
   */
  hideLoading() {
    this.loadingScreen.classList.add('hidden');
  }

  /**
   * Show start screen
   */
  showStartScreen() {
    this.hideAll();
    this.startScreen.classList.remove('hidden');
  }

  /**
   * Hide start screen
   */
  hideStartScreen() {
    this.startScreen.classList.add('hidden');
  }

  /**
   * Show game HUD
   */
  showHUD() {
    this.gameHUD.classList.remove('hidden');
  }

  /**
   * Hide game HUD
   */
  hideHUD() {
    this.gameHUD.classList.add('hidden');
  }

  /**
   * Update coin counter
   * @param {number} current - Current coins
   * @param {number} target - Target coins
   */
  updateCoinCount(current, target) {
    this.coinCount.textContent = `${current}/${target}`;
  }

  /**
   * Show booster modal
   */
  showBoosterModal() {
    this.boosterModal.classList.remove('hidden');
  }

  /**
   * Hide booster modal
   */
  hideBoosterModal() {
    this.boosterModal.classList.add('hidden');
  }

  /**
   * Show win screen
   * @param {number} score - Final score
   */
  showWinScreen(score) {
    this.hideAll();
    this.winScore.textContent = `Score: ${score}`;
    this.winScreen.classList.remove('hidden');
  }

  /**
   * Show lose screen
   * @param {number} score - Final score
   */
  showLoseScreen(score) {
    this.hideAll();
    this.loseScore.textContent = `Score: ${score}`;
    this.loseScreen.classList.remove('hidden');
  }

  /**
   * Hide all screens and modals
   */
  hideAll() {
    this.loadingScreen.classList.add('hidden');
    this.startScreen.classList.add('hidden');
    this.winScreen.classList.add('hidden');
    this.loseScreen.classList.add('hidden');
    this.gameHUD.classList.add('hidden');
    this.boosterModal.classList.add('hidden');
  }

  /**
   * Setup button event listeners
   * @param {Object} callbacks - Event callbacks
   */
  setupEventListeners(callbacks) {
    if (callbacks.onPlayClick) {
      this.playBtn.addEventListener('click', callbacks.onPlayClick);
    }

    if (callbacks.onBoosterContinue) {
      this.boosterContinueBtn.addEventListener('click', callbacks.onBoosterContinue);
    }

    if (callbacks.onRetry) {
      this.winRetryBtn.addEventListener('click', callbacks.onRetry);
      this.loseRetryBtn.addEventListener('click', callbacks.onRetry);
    }

    if (callbacks.onBookDemo) {
      this.winDemoBtn.addEventListener('click', callbacks.onBookDemo);
      this.loseDemoBtn.addEventListener('click', callbacks.onBookDemo);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    // Remove event listeners if needed
    console.log('🗑️ UIController destroyed');
  }
}
