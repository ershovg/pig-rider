import lottie, { AnimationItem } from 'lottie-web';
import type { UIEventCallbacks } from '../../types/ui';

export class UIController {
  private lottieContainerTutorial: HTMLElement | null;
  private lottieContainerBooster: HTMLElement | null;

  private lottieAnimations: {
    tutorial: AnimationItem | null;
    booster: AnimationItem | null;
  };

  constructor() {
    this.lottieContainerTutorial = document.getElementById('lottie-tutorial');
    this.lottieContainerBooster = document.getElementById('lottie-booster');

    this.lottieAnimations = {
      tutorial: null,
      booster: null,
    };
  }

  showStartScreen(): void {}

  hideStartScreen(): void {}

  showRunningScreen(): void {}

  hideRunningScreen(): void {}

  showWinScreen(_score: number): void {}

  showLoseScreen(_score: number): void {}

  hideWinScreen(): void {}

  hideLoseScreen(): void {}

  hideAll(): void {}

  showBoosterModal(_isFirstTime?: boolean): Promise<boolean> {
    return Promise.resolve(true);
  }

  hideBoosterModal(): void {}

  updateCoinCount(_current: number, _target?: number): void {}

  updateMuteButtonState(_isMuted: boolean): void {}

  addBoosterClass(): void {}

  removeBoosterClass(): void {}

  showBoosterIcon(): void {}

  hideBoosterIcon(): void {}

  setupEventListeners(_callbacks: UIEventCallbacks): void {}

  launchConfetti(): void {}

  showTutorialHint(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.lottieContainerTutorial) {
        console.warn('⚠️ Tutorial Lottie container not found');
        resolve();
        return;
      }

      console.log('🎬 Loading tutorial hint animation...');
      this.lottieContainerTutorial.style.display = 'flex';

      const baseUrl = typeof window !== 'undefined' && (window as any).GAME_ASSETS_URL
        ? (window as any).GAME_ASSETS_URL
        : '';
      const animationPath = baseUrl ? `${baseUrl}/assets/animations/tutorial-hint.json` : '/assets/animations/tutorial-hint.json';

      console.log('📍 Tutorial animation path:', animationPath);

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
          console.error('❌ Failed to load tutorial hint animation');
          this.hideTutorialHint();
          resolve();
        });
      } catch (error) {
        console.error('❌ Error loading tutorial hint:', error);
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
        console.warn('⚠️ Booster Lottie container not found');
        resolve();
        return;
      }

      console.log('🎬 Loading booster activation animation...');
      this.lottieContainerBooster.style.display = 'flex';

      const baseUrl = typeof window !== 'undefined' && (window as any).GAME_ASSETS_URL
        ? (window as any).GAME_ASSETS_URL
        : '';
      const animationPath = baseUrl ? `${baseUrl}/assets/animations/booster-activation.json` : '/assets/animations/booster-activation.json';

      console.log('📍 Booster animation path:', animationPath);

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
          console.error('❌ Failed to load booster activation animation');
          this.hideBoosterActivation();
          resolve();
        });
      } catch (error) {
        console.error('❌ Error loading booster activation:', error);
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

  hideLoading(): void {}

  destroy(): void {
    if (this.lottieAnimations.tutorial) {
      this.lottieAnimations.tutorial.destroy();
      this.lottieAnimations.tutorial = null;
    }
    if (this.lottieAnimations.booster) {
      this.lottieAnimations.booster.destroy();
      this.lottieAnimations.booster = null;
    }
  }
}
