/**
 * UIController - управление HTML UI элементами
 * Отвечает за показ/скрытие экранов, обновление счётчиков
 * Адаптирован под Webflow структуру
 *
 * SOLID Principles:
 * - SRP: Только управление HTML UI, делегирует конфетти в ConfettiManager
 * - DIP: Зависит от ConfettiManager API, а не от canvas-confetti напрямую
 */

import { ConfettiManager } from '../confetti/manager/ConfettiManager.js';

export class UIController {
  constructor() {
    // Screens (Webflow structure)
    // Статичные экраны (display-based)
    this.startScreen = document.querySelector('.game-ui.game-start');

    // Абсолютные элементы (opacity-based)
    this.runningScreen = document.querySelector('.game-ui.game-running');

    // Абсолютные модалки (CSS класс is--active)
    this.faildScreen = document.querySelector('.game-ui.faild-screen');
    this.winScreen = document.querySelector('.game-ui.win-screen');
    this.boostScreen = document.querySelector('.game-ui.game-boost');

    // Game counter (в running screen)
    this.coinCounter = document.querySelector('[game-counter]');

    // Buttons
    this.startBtn = document.querySelector('[game-btn-start]');
    this.restartBtn = document.querySelector('[open-modal-attr="restart-game"]');

    // this.pauseBtn = document.querySelector('[game-btn-pause]');
    // this.resumeBtn = document.querySelector('[game-btn-resume]');
    // this.retryBtn = document.querySelector('[game-btn-retry]');

    // Canvas
    this.canvas = document.getElementById('game-canvas');

    // Game state element (для добавления CSS класса booster-active)
    this.gameStateElement = document.querySelector('.game-state');

    // Confetti Manager (инкапсулирует всю логику конфетти)
    this.confettiManager = null;

    // Booster icon (для визуальной индикации бустера в UI)
    this.boosterIcon = document.querySelector('.game-logo');

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
   * @param {boolean} isFirstTime - Is this the first booster ever? If false, auto-accepts
   * @returns {Promise<boolean>} - Resolves to true when user confirms
   */
  showBoosterModal(isFirstTime = true) {
    return new Promise((resolve) => {
      // Автопринятие для последующих бустеров (не первый раз)
      if (!isFirstTime) {
        console.log('🚀 Auto-accepting booster (not first time)');
        resolve(true);
        return;
      }

      // Показываем модал только для первого бустера
      if (this.boostScreen) {
        // Принудительный reflow перед добавлением класса (для плавного transition)
        void this.boostScreen.offsetHeight;

        // Добавляем класс в следующем frame для гарантии transition
        requestAnimationFrame(() => {
          this.boostScreen.classList.add('is--active');
        });

        // Находим кнопку принятия бустера
        const acceptBtn = this.boostScreen.querySelector('.game-booster__accept');

        if (acceptBtn) {
          const handleAccept = () => {
            this.hideBoosterModal();
            acceptBtn.removeEventListener('click', handleAccept);
            resolve(true);
          };

          acceptBtn.addEventListener('click', handleAccept);
        } else {
          console.warn('⚠️ Booster accept button (.game-booster__accept) not found');
          // Фолбек: резолвим автоматически если кнопки нет
          resolve(true);
        }
      } else {
        console.warn('⚠️ Booster screen (.game-ui.game-boost) not found');
        // Фолбек: резолвим автоматически если модала нет
        resolve(true);
      }
    });
  }

  /**
   * Hide booster modal
   */
  hideBoosterModal() {
    if (this.boostScreen) {
      // Деактивируем через CSS класс (Webflow style)
      this.boostScreen.classList.remove('is--active');
    }
  }

  /**
   * Show win screen
   * Абсолютная модалка - используем CSS класс is--active
   */
  showWinScreen(score) {
    this.hideAll();
    if (this.winScreen) {
      // Принудительный reflow перед добавлением класса (для плавного transition)
      // Без этого браузер может "склеить" изменения и пропустить анимацию
      void this.winScreen.offsetHeight;

      // Добавляем класс в следующем frame для гарантии transition
      requestAnimationFrame(() => {
        this.winScreen.classList.add('is--active');
      });

      // Запускаем конфетти с задержкой 400ms
      setTimeout(() => {
        this.launchConfetti();
      }, 400);
    }
    // Hide canvas
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
    console.log(`🏆 WIN! Score: ${score}`);
  }

  /**
   * Show lose screen (faild-screen)
   * Абсолютная модалка - используем CSS класс is--active
   */
  showLoseScreen(score) {
    this.hideAll();
    if (this.faildScreen) {
      // Принудительный reflow перед добавлением класса (для плавного transition)
      void this.faildScreen.offsetHeight;

      // Добавляем класс в следующем frame для гарантии transition
      requestAnimationFrame(() => {
        this.faildScreen.classList.add('is--active');
      });
    }
    // Hide canvas
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
    console.log(`💀 LOSE! Score: ${score}`);
  }

  /**
   * Hide win screen
   */
  hideWinScreen() {
    if (this.winScreen) {
      this.winScreen.classList.remove('is--active');
    }
  }

  /**
   * Hide lose screen
   */
  hideLoseScreen() {
    if (this.faildScreen) {
      this.faildScreen.classList.remove('is--active');
    }
  }

  /**
   * Hide all screens
   * Статичные экраны - display: none
   * Абсолютные модалки - убираем класс is--active
   */
  hideAll() {
    // Статичные экраны (display)
    if (this.startScreen) this.startScreen.style.display = 'none';

    // Абсолютные модалки (CSS класс is--active)
    if (this.faildScreen) this.faildScreen.classList.remove('is--active');
    if (this.winScreen) this.winScreen.classList.remove('is--active');
    if (this.boostScreen) this.boostScreen.classList.remove('is--active');

    // Абсолютные элементы HUD (opacity)
    if (this.runningScreen) {
      this.runningScreen.style.opacity = '0';
      this.runningScreen.style.pointerEvents = 'none';
    }
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

    // Restart button (в win/lose экранах)
    // Используем EVENT DELEGATION на document, т.к. кнопки могут быть динамическими
    if (callbacks.onRestartGame) {
      // Event delegation: слушаем клики на document, фильтруем по селектору
      document.addEventListener('click', (e) => {
        // Ищем ближайший элемент с нужным атрибутом
        const target = e.target.closest('[open-modal-attr="restart-game"]');

        if (target) {
          console.log('🔄 Restart button clicked');
          e.preventDefault();
          e.stopPropagation(); // Останавливаем всплытие
          callbacks.onRestartGame();
        }
      }, true); // true = capturing phase (раньше других обработчиков)
    }

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
   * Show booster icon (add is--active class)
   * Визуально активирует иконку бустера в UI
   */
  showBoosterIcon() {
    if (this.boosterIcon) {
      this.boosterIcon.classList.add('is--active');
      console.log('🌟 Booster icon activated');
    }
  }

  /**
   * Hide booster icon (remove is--active class)
   * Деактивирует визуальное отображение иконки бустера
   */
  hideBoosterIcon() {
    if (this.boosterIcon) {
      this.boosterIcon.classList.remove('is--active');
      console.log('💤 Booster icon deactivated');
    }
  }

  /*
   Launch confetti animation
  */
  launchConfetti() {
    try {
      console.log('🎊 launchConfetti() called');

      if (!this.confettiManager) {
        console.log('📦 Creating ConfettiManager...');
        const confettiCanvas = document.getElementById('confetti-canvas');

        if (!confettiCanvas) {
          console.warn('⚠️ Confetti canvas (#confetti-canvas) not found, using default');
        }

        this.confettiManager = new ConfettiManager(confettiCanvas);
      }

      // Делегируем запуск эффекта в специализированный модуль
      console.log('🚀 Calling launchVictoryEffect()...');
      this.confettiManager.launchVictoryEffect();
    } catch (error) {
      console.error('❌ Confetti error:', error);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    // Очищаем confetti manager
    if (this.confettiManager) {
      this.confettiManager.destroy();
      this.confettiManager = null;
    }

    // Remove event listeners if needed
    console.log('🗑️ UIController destroyed');
  }
}
