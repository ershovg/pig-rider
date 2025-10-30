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
    this.startScreen = document.querySelector('.game-ui.game-start');
    this.runningScreen = document.querySelector('.game-ui.game-running');
    this.faildScreen = document.querySelector('.game-ui.faild-screen');
    this.winScreen = document.querySelector('.game-ui.win-screen');
    this.boostScreen = document.querySelector('.game-ui.game-boost');

    // UI elements
    this.coinCounter = document.querySelector('[game-counter]');
    this.canvas = document.getElementById('game-canvas');
    this.gameStateElement = document.querySelector('.game-state');
    this.boosterIcon = document.querySelector('.game-logo');

    // Buttons
    this.startBtn = document.querySelector('[game-btn-start]');
    this.restartBtn = document.querySelector('[open-modal-attr="restart-game"]');
    this.mute = document.querySelector('.mute');

    // Managers
    this.confettiManager = null;

    console.log('🎨 UIController initialized (Webflow structure)');
  }

  // Показать стартовый экран
  showStartScreen() {
    this.hideAll();
    if (this.startScreen) {
      this.startScreen.style.display = 'block';
    }
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
  }

  // Скрыть стартовый экран
  hideStartScreen() {
    if (this.startScreen) {
      this.startScreen.style.display = 'none';
    }
  }

  // Показать игровой HUD
  showRunningScreen() {
    this.hideAll();
    if (this.runningScreen) {
      this.runningScreen.classList.remove('is--hide');
      this.runningScreen.style.opacity = '1';
      this.runningScreen.style.pointerEvents = 'auto';
    }
    if (this.canvas) {
      this.canvas.style.display = 'block';
    }
  }

  // Скрыть игровой HUD
  hideRunningScreen() {
    if (this.runningScreen) {
      this.runningScreen.style.opacity = '0';
      this.runningScreen.style.pointerEvents = 'none';
      this.runningScreen.classList.add('is--hide');
    }
  }

  // Показать экран победы
  showWinScreen(score) {
    this.hideAll();
    if (this.winScreen) {
      void this.winScreen.offsetHeight;
      requestAnimationFrame(() => {
        this.winScreen.classList.add('is--active');
        setTimeout(() => this.launchConfetti(), 50);
      });
    }
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
    console.log(`🏆 WIN! Score: ${score}`);
  }

  // Показать экран поражения
  showLoseScreen(score) {
    this.hideAll();
    if (this.faildScreen) {
      void this.faildScreen.offsetHeight;
      requestAnimationFrame(() => {
        this.faildScreen.classList.add('is--active');
      });
    }
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
    console.log(`💀 LOSE! Score: ${score}`);
  }

  // Скрыть экран победы
  hideWinScreen() {
    if (this.winScreen) {
      this.winScreen.classList.remove('is--active');
    }
  }

  // Скрыть экран поражения
  hideLoseScreen() {
    if (this.faildScreen) {
      this.faildScreen.classList.remove('is--active');
    }
  }

  // Показать модал бустера (возвращает Promise)
  showBoosterModal(isFirstTime = true) {
    return new Promise((resolve) => {
      if (!isFirstTime) {
        console.log('🚀 Auto-accepting booster (not first time)');
        resolve(true);
        return;
      }

      if (this.boostScreen) {
        void this.boostScreen.offsetHeight;
        requestAnimationFrame(() => {
          this.boostScreen.classList.add('is--active');
        });

        const acceptBtn = this.boostScreen.querySelector('.game-booster__accept');

        if (acceptBtn) {
          // 🎯 Unified accept handler (вызывается из клика ИЛИ клавиатуры)
          const handleAccept = (event) => {
            if (event) {
              event.preventDefault(); // Блокируем дефолтное поведение браузера
              event.stopPropagation();
            }

            this.hideBoosterModal();
            this._cleanupBoosterModalListeners(acceptBtn, handleAccept, handleKeyboard);
            resolve(true);
          };

          // ⌨️ Keyboard handler (Enter/Return/Space)
          const handleKeyboard = (event) => {
            // Enter (13), Return (13), Space (32)
            if (event.key === 'Enter' || event.key === ' ' || event.keyCode === 13 || event.keyCode === 32) {
              console.log(`⌨️ Booster modal accepted via keyboard: ${event.key}`);
              handleAccept(event);
            }
          };

          // Добавляем обработчики
          acceptBtn.addEventListener('click', handleAccept);
          document.addEventListener('keydown', handleKeyboard);

          // 🎯 Auto-focus на кнопку (чтобы Enter работал из коробки)
          setTimeout(() => {
            acceptBtn.focus();
            console.log('🎯 Auto-focused on booster accept button');
          }, 100);
        } else {
          console.warn('⚠️ Booster accept button (.game-booster__accept) not found');
          resolve(true);
        }
      } else {
        console.warn('⚠️ Booster screen (.game-ui.game-boost) not found');
        resolve(true);
      }
    });
  }

  // 🧹 Cleanup обработчиков модального окна бустера
  _cleanupBoosterModalListeners(acceptBtn, clickHandler, keyboardHandler) {
    if (acceptBtn && clickHandler) {
      acceptBtn.removeEventListener('click', clickHandler);
    }
    if (keyboardHandler) {
      document.removeEventListener('keydown', keyboardHandler);
    }
    console.log('🧹 Booster modal listeners cleaned up');
  }

  // Скрыть модал бустера
  hideBoosterModal() {
    if (this.boostScreen) {
      this.boostScreen.classList.remove('is--active');
    }
  }

  // Скрыть все экраны
  hideAll() {
    if (this.startScreen) this.startScreen.style.display = 'none';
    if (this.faildScreen) this.faildScreen.classList.remove('is--active');
    if (this.winScreen) this.winScreen.classList.remove('is--active');
    if (this.boostScreen) this.boostScreen.classList.remove('is--active');

    if (this.runningScreen) {
      this.runningScreen.style.opacity = '0';
      this.runningScreen.style.pointerEvents = 'none';
      this.runningScreen.classList.add('is--hide');
    }
  }

  // Обновить счётчик монет
  updateCoinCount(current, target = null) {
    if (this.coinCounter) {
      this.coinCounter.textContent = current.toString();
    }
  }

  // Обновить визуальное состояние кнопки mute
  updateMuteButtonState(isMuted) {
    if (this.mute) {
      if (isMuted) {
        this.mute.classList.add('is--muted');
      } else {
        this.mute.classList.remove('is--muted');
      }
    }
  }

  // Добавить CSS класс booster-active
  addBoosterClass() {
    if (this.gameStateElement) {
      this.gameStateElement.classList.add('booster-active');
      console.log('✨ Booster mode activated');
    }
  }

  // Удалить CSS класс booster-active
  removeBoosterClass() {
    if (this.gameStateElement) {
      this.gameStateElement.classList.remove('booster-active');
      console.log('⏹️ Booster mode deactivated');
    }
  }

  // Показать иконку бустера
  showBoosterIcon() {
    if (this.boosterIcon) {
      this.boosterIcon.classList.add('is--active');
      console.log('🌟 Booster icon activated');
    }
  }

  // Скрыть иконку бустера
  hideBoosterIcon() {
    if (this.boosterIcon) {
      this.boosterIcon.classList.remove('is--active');
      console.log('💤 Booster icon deactivated');
    }
  }

  // Настроить обработчики событий кнопок
  setupEventListeners(callbacks) {
    if (callbacks.onPlayClick && this.startBtn) {
      this.startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        callbacks.onPlayClick();
      });
    }

    if (callbacks.onRestartGame) {
      document.addEventListener('click', (e) => {
        const target = e.target.closest('[open-modal-attr="restart-game"]');
        if (target) {
          console.log('🔄 Restart button clicked');
          e.preventDefault();
          e.stopPropagation();
          callbacks.onRestartGame();
        }
      }, true);
    }

    if (callbacks.onMuteToggle && this.mute) {
      this.mute.addEventListener('click', (e) => {
        e.preventDefault();
        const isMuted = callbacks.onMuteToggle();
        this.updateMuteButtonState(isMuted);
        console.log(`🔊 Sound ${isMuted ? 'muted' : 'unmuted'}`);
      });
    }
  }

  // Запустить анимацию конфетти
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

      console.log('🚀 Calling launchVictoryEffect()...');
      this.confettiManager.launchVictoryEffect();
    } catch (error) {
      console.error('❌ Confetti error:', error);
    }
  }

  // Legacy метод для совместимости
  hideLoading() {
    console.log('✅ Loading complete');
  }

  // Очистка ресурсов
  destroy() {
    if (this.confettiManager) {
      this.confettiManager.destroy();
      this.confettiManager = null;
    }
    console.log('🗑️ UIController destroyed');
  }
}
