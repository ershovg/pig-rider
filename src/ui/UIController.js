/**
 * UIController - управление HTML UI элементами
 * Отвечает за показ/скрытие экранов, обновление счётчиков
 * Адаптирован под Webflow структуру
 */

export class UIController {
  constructor() {
    // Screens (Webflow structure)
    this.startScreen = document.querySelector('.game-ui.game-start'); // hero state
    this.runningScreen = document.querySelector('.game-ui.game-running'); // game state
    this.faildScreen = document.querySelector('.game-ui.faild-screen') // faild state
    this.winScreen = document.querySelector('.game-ui.win-screen') // win state
    // this.boostScreen = document.querySelector('.game-ui.game-boost');

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

    // Game state element (для добавления CSS класса booster-active)
    this.gameStateElement = document.querySelector('.game-state');

    // НЕ вызываем hideAll() - Webflow уже установил правильное начальное состояние
    // Стартовый экран должен быть видим, остальные скрыты

    console.log('🎨 UIController initialized (Webflow structure)');
  }

  /**
   * Show start screen (Webflow)
   * Статичный экран - используем display
   */
  showStartScreen() {
    this.hideAll();
    if (this.startScreen) {
      this.startScreen.style.display = 'block';
    }
    // Hide canvas on start screen
    if (this.canvas) {
      this.canvas.style.display = 'none';
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
   * Абсолютный элемент - используем opacity
   */
  showRunningScreen() {
    this.hideAll();
    if (this.runningScreen) {
      this.runningScreen.style.opacity = '1';
      this.runningScreen.style.pointerEvents = 'auto';
    }
    // Show canvas when game is running
    if (this.canvas) {
      this.canvas.style.display = 'block';
    }
  }

  /**
   * Hide running screen
   */
  hideRunningScreen() {
    if (this.runningScreen) {
      this.runningScreen.style.opacity = '0';
      this.runningScreen.style.pointerEvents = 'none';
    }
  }

  /**
   * Update coin counter
   * @param {number} current - Current coins
   * @param {number} target - Target coins (optional)
   */
  updateCoinCount(current, target = null) {
    if (this.coinCounter) {
      // Обновляем только число внутри span, не трогая "/200" в родителе
      this.coinCounter.textContent = current.toString();
    }
  }

  /**
   * Show booster modal and wait for user confirmation
   * Returns a Promise that resolves when user clicks OK
   * @returns {Promise<boolean>} - Resolves to true when user confirms
   */
  showBoosterModal() {
    return new Promise((resolve) => {
      // Используем confirm пока нет Webflow UI
      const boosterAccepted = confirm('Вы получили бонус бустер!');

      // TODO: добавить когда будет готов в Webflow
      // if (this.boostScreen) {
      //   this.boostScreen.style.opacity = '1';
      //   this.boostScreen.style.pointerEvents = 'auto';
      //   // Добавить обработчик на кнопку OK, который вызовет resolve(true)
      // }

      resolve(boosterAccepted);
    });
  }

  /**
   * Hide booster modal
   */
  hideBoosterModal() {
    // TODO: добавить когда будет готов в Webflow
    // if (this.boostScreen) {
    //   this.boostScreen.style.opacity = '0';
    //   this.boostScreen.style.pointerEvents = 'none';
    // }
    console.warn('⚠️ Booster modal not implemented in Webflow yet');
  }

  /**
   * Show win screen
   * Статичный экран - используем display
   */
  showWinScreen(score) {
    this.hideAll();
    if (this.winScreen) {
      this.winScreen.style.display = 'flex';
    }
    // Hide canvas
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
    console.log(`🏆 WIN! Score: ${score}`);
  }

  /**
   * Show lose screen (faild-screen)
   * Статичный экран - используем display
   */
  showLoseScreen(score) {
    console.log(`💀 LOSE! Score: ${score}`);
    alert(`💀 LOSE! Score: ${score}`)
    this.hideAll();
    if (this.faildScreen) {
      this.faildScreen.style.display = 'flex';
    }
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
  }

  /**
   * Hide all screens
   * Статичные экраны - display: none
   * Абсолютные элементы - opacity: 0
   */
  hideAll() {
    // Статичные экраны (display)
    if (this.startScreen) this.startScreen.style.display = 'none';
    if (this.faildScreen) this.faildScreen.style.display = 'none';
    if (this.winScreen) this.winScreen.style.display = 'none';

    // Абсолютные элементы (opacity)
    if (this.runningScreen) {
      this.runningScreen.style.opacity = '0';
      this.runningScreen.style.pointerEvents = 'none';
    }
    // TODO: добавить boostScreen когда будет готов
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
   * Add booster-active CSS class to game state element
   */
  addBoosterClass() {
    if (this.gameStateElement) {
      this.gameStateElement.classList.add('booster-active');
      console.log('✨ Booster mode activated');
    }
  }

  /**
   * Remove booster-active CSS class from game state element
   */
  removeBoosterClass() {
    if (this.gameStateElement) {
      this.gameStateElement.classList.remove('booster-active');
      console.log('⏹️ Booster mode deactivated');
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
