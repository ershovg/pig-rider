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
import lottie, { AnimationItem } from 'lottie-web';
import type { UIEventCallbacks } from '../../types/ui';

export class UIController {
  private startScreen: HTMLElement | null;
  private runningScreen: HTMLElement | null;
  private faildScreen: HTMLElement | null;
  private winScreen: HTMLElement | null;
  private boostScreen: HTMLElement | null;

  private coinCounter: HTMLElement | null;
  private canvas: HTMLCanvasElement | null;
  private gameStateElement: HTMLElement | null;
  private boosterIcon: HTMLElement | null;

  private lottieContainerTutorial: HTMLElement | null;
  private lottieContainerBooster: HTMLElement | null;

  private startBtn: HTMLElement | null;
  private mute: HTMLElement | null;
  private muteIconOn: HTMLElement | null;
  private muteIconOff: HTMLElement | null;

  private confettiManager: ConfettiManager | null;

  private lottieAnimations: {
    tutorial: AnimationItem | null;
    booster: AnimationItem | null;
  };

  constructor() {
    this.startScreen = document.querySelector('.game-ui.game-start');
    this.runningScreen = document.querySelector('.game-ui.game-running');
    this.faildScreen = document.querySelector('.game-ui.faild-screen');
    this.winScreen = document.querySelector('.game-ui.win-screen');
    this.boostScreen = document.querySelector('.game-ui.game-boost');

    this.coinCounter = document.querySelector('[game-counter]');
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.gameStateElement = document.querySelector('.game-state');
    this.boosterIcon = document.querySelector('.game-logo');

    this.lottieContainerTutorial = document.getElementById('lottie-tutorial');
    this.lottieContainerBooster = document.getElementById('lottie-booster');

    this.startBtn = document.querySelector('[game-btn-start]');
    this.mute = document.querySelector('.mute');
    this.muteIconOn = document.querySelector('.mute-icon.on');
    this.muteIconOff = document.querySelector('.mute-icon.off');

    this.confettiManager = null;

    this.lottieAnimations = {
      tutorial: null,
      booster: null,
    };
  }

  showStartScreen(): void {
    this.hideAll();
    if (this.startScreen) {
      this.startScreen.style.display = 'block';
    }
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
  }

  hideStartScreen(): void {
    if (this.startScreen) {
      this.startScreen.style.display = 'none';
    }
  }

  showRunningScreen(): void {
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

  hideRunningScreen(): void {
    if (this.runningScreen) {
      this.runningScreen.style.opacity = '0';
      this.runningScreen.style.pointerEvents = 'none';
      this.runningScreen.classList.add('is--hide');
    }
  }

  showWinScreen(_score: number): void {
    this.hideAll();
    if (this.winScreen) {
      void this.winScreen.offsetHeight;
      requestAnimationFrame(() => {
        this.winScreen!.classList.add('is--active');
        setTimeout(() => this.launchConfetti(), 50);
      });
    }
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
  }

  showLoseScreen(_score: number): void {
    this.hideAll();
    if (this.faildScreen) {
      void this.faildScreen.offsetHeight;
      requestAnimationFrame(() => {
        this.faildScreen!.classList.add('is--active');
      });
    }
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
  }

  hideWinScreen(): void {
    if (this.winScreen) {
      this.winScreen.classList.remove('is--active');
    }
  }

  hideLoseScreen(): void {
    if (this.faildScreen) {
      this.faildScreen.classList.remove('is--active');
    }
  }

  showBoosterModal(isFirstTime: boolean = true): Promise<boolean> {
    return new Promise((resolve) => {
      if (!isFirstTime) {
        resolve(true);
        return;
      }

      if (this.boostScreen) {
        void this.boostScreen.offsetHeight;
        requestAnimationFrame(() => {
          this.boostScreen!.classList.add('is--active');
        });

        const acceptBtn = this.boostScreen.querySelector('.game-booster__accept');

        if (acceptBtn) {
          // Unified accept handler (вызывается из клика ИЛИ клавиатуры)
          const handleAccept = (event?: Event) => {
            if (event) {
              event.preventDefault();
              event.stopPropagation();
            }

            this.hideBoosterModal();
            this._cleanupBoosterModalListeners(acceptBtn as HTMLElement, handleAccept, handleKeyboard);
            resolve(true);
          };

          // Keyboard handler (Enter/Return/Space)
          const handleKeyboard = (event: KeyboardEvent) => {
            if (event.key === 'Enter' || event.key === ' ' || event.keyCode === 13 || event.keyCode === 32) {
              handleAccept(event);
            }
          };

          acceptBtn.addEventListener('click', handleAccept);
          document.addEventListener('keydown', handleKeyboard);

          // Auto-focus на кнопку (чтобы Enter работал из коробки)
          setTimeout(() => {
            (acceptBtn as HTMLElement).focus();
          }, 100);
        } else {
          console.warn('Booster accept button (.game-booster__accept) not found');
          resolve(true);
        }
      } else {
        console.warn('Booster screen (.game-ui.game-boost) not found');
        resolve(true);
      }
    });
  }

  private _cleanupBoosterModalListeners(
    acceptBtn: HTMLElement,
    clickHandler: (event?: Event) => void,
    keyboardHandler: (event: KeyboardEvent) => void
  ): void {
    if (acceptBtn && clickHandler) {
      acceptBtn.removeEventListener('click', clickHandler);
    }
    if (keyboardHandler) {
      document.removeEventListener('keydown', keyboardHandler);
    }
  }

  hideBoosterModal(): void {
    if (this.boostScreen) {
      this.boostScreen.classList.remove('is--active');
    }
  }

  hideAll(): void {
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

  updateCoinCount(current: number, _target?: number): void {
    if (this.coinCounter) {
      this.coinCounter.textContent = current.toString();
    }
  }

  updateMuteButtonState(isMuted: boolean): void {
    if (this.mute) {
      if (isMuted) {
        this.mute.classList.add('is--muted');
      } else {
        this.mute.classList.remove('is--muted');
      }
    }

    if (this.muteIconOn && this.muteIconOff) {
      if (isMuted) {
        this.muteIconOn.style.display = 'none';
        this.muteIconOff.style.display = 'block';
      } else {
        this.muteIconOn.style.display = 'block';
        this.muteIconOff.style.display = 'none';
      }
    }
  }

  addBoosterClass(): void {
    if (this.gameStateElement) {
      this.gameStateElement.classList.add('booster-active');
    }
  }

  removeBoosterClass(): void {
    if (this.gameStateElement) {
      this.gameStateElement.classList.remove('booster-active');
    }
  }

  showBoosterIcon(): void {
    if (this.boosterIcon) {
      this.boosterIcon.classList.add('is--active');
    }
  }

  hideBoosterIcon(): void {
    if (this.boosterIcon) {
      this.boosterIcon.classList.remove('is--active');
    }
  }

  setupEventListeners(callbacks: UIEventCallbacks): void {
    if (callbacks.onPlayClick && this.startBtn) {
      this.startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        callbacks.onPlayClick!();
      });
    }

    if (callbacks.onRestartGame) {
      document.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('[open-modal-attr="restart-game"]');
        if (target) {
          e.preventDefault();
          e.stopPropagation();
          callbacks.onRestartGame!();
        }
      }, true);
    }

    if (callbacks.onMuteToggle && this.mute) {
      this.mute.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Блокируем всплытие события к PlayerInputController
        const isMuted = callbacks.onMuteToggle!();
        this.updateMuteButtonState(isMuted);
      });
    }
  }

  launchConfetti(): void {
    try {
      if (!this.confettiManager) {
        const confettiCanvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;

        if (!confettiCanvas) {
          console.warn('Confetti canvas (#confetti-canvas) not found, using default');
        }

        this.confettiManager = new ConfettiManager(confettiCanvas);
      }

      this.confettiManager.launchVictoryEffect();
    } catch (error) {
      console.error('Confetti error:', error);
    }
  }

  showTutorialHint(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.lottieContainerTutorial) {
        console.warn('Tutorial Lottie container not found');
        resolve();
        return;
      }

      this.lottieContainerTutorial.style.display = 'flex';

      const baseUrl = typeof window !== 'undefined' && (window as any).GAME_ASSETS_URL
        ? (window as any).GAME_ASSETS_URL
        : '';
      const animationPath = baseUrl ? `${baseUrl}/assets/animations/tutorial-hint.json` : '/assets/animations/tutorial-hint.json';

      try {
        this.lottieAnimations.tutorial = lottie.loadAnimation({
          container: this.lottieContainerTutorial,
          renderer: 'svg',
          loop: false,
          autoplay: true,
          path: animationPath,
        });

        this.lottieAnimations.tutorial.addEventListener('complete', () => {
          this.hideTutorialHint();
          resolve();
        });

        this.lottieAnimations.tutorial.addEventListener('data_failed', () => {
          console.error('Failed to load tutorial hint animation');
          this.hideTutorialHint();
          resolve();
        });
      } catch (error) {
        console.error('Error loading tutorial hint:', error);
        this.hideTutorialHint();
        resolve();
      }
    });
  }

  hideTutorialHint(): void {
    if (this.lottieContainerTutorial) {
      this.lottieContainerTutorial.style.display = 'none';
    }
    if (this.lottieAnimations.tutorial) {
      this.lottieAnimations.tutorial.destroy();
      this.lottieAnimations.tutorial = null;
    }
  }

  showBoosterActivation(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.lottieContainerBooster) {
        console.warn('Booster Lottie container not found');
        resolve();
        return;
      }

      this.lottieContainerBooster.style.display = 'flex';

      const baseUrl = typeof window !== 'undefined' && (window as any).GAME_ASSETS_URL
        ? (window as any).GAME_ASSETS_URL
        : '';
      const animationPath = baseUrl ? `${baseUrl}/assets/animations/booster-activation.json` : '/assets/animations/booster-activation.json';

      try {
        this.lottieAnimations.booster = lottie.loadAnimation({
          container: this.lottieContainerBooster,
          renderer: 'svg',
          loop: false,
          autoplay: true,
          path: animationPath,
        });

        this.lottieAnimations.booster.addEventListener('complete', () => {
          this.hideBoosterActivation();
          resolve();
        });

        this.lottieAnimations.booster.addEventListener('data_failed', () => {
          console.error('Failed to load booster activation animation');
          this.hideBoosterActivation();
          resolve();
        });
      } catch (error) {
        console.error('Error loading booster activation:', error);
        this.hideBoosterActivation();
        resolve();
      }
    });
  }

  hideBoosterActivation(): void {
    if (this.lottieContainerBooster) {
      this.lottieContainerBooster.style.display = 'none';
    }
    if (this.lottieAnimations.booster) {
      this.lottieAnimations.booster.destroy();
      this.lottieAnimations.booster = null;
    }
  }

  // Legacy метод для совместимости
  hideLoading(): void {
    // Stub for backward compatibility
  }

  destroy(): void {
    if (this.lottieAnimations.tutorial) {
      this.lottieAnimations.tutorial.destroy();
      this.lottieAnimations.tutorial = null;
    }
    if (this.lottieAnimations.booster) {
      this.lottieAnimations.booster.destroy();
      this.lottieAnimations.booster = null;
    }

    if (this.confettiManager) {
      this.confettiManager.destroy();
      this.confettiManager = null;
    }
  }
}
