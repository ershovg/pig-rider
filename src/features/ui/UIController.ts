import { ConfettiManager } from '../confetti/manager/ConfettiManager.js';
import { GameEvents } from '../core/events/GameEvents';
import type { UIEventCallbacks } from '../../types/ui';

/*
  Экранами владеет встраивающее приложение: игра о них ничего не знает и только
  публикует события. Здесь остаётся конфетти — canvas-confetti лежит в зависимостях
  игры, и канвас `#confetti-canvas` ей отдаёт хост.
*/
export class UIController {
  private confettiManager: ConfettiManager | null = null;

  showStartScreen(): void {}

  hideStartScreen(): void {}

  showRunningScreen(): void {}

  hideRunningScreen(): void {}

  showWinScreen(_score: number): void {}

  showLoseScreen(_score: number): void {}

  hideWinScreen(): void {}

  hideLoseScreen(): void {}

  hideAll(): void {}

  hideBoosterModal(): void {}

  updateCoinCount(_current: number, _target?: number): void {}

  updateMuteButtonState(_isMuted: boolean): void {}

  addBoosterClass(): void {}

  removeBoosterClass(): void {}

  showBoosterIcon(): void {}

  hideBoosterIcon(): void {}

  setupEventListeners(_callbacks: UIEventCallbacks): void {}

  showTutorialHint(): Promise<void> {
    GameEvents.publish('anim', { name: 'tutorial' });
    return Promise.resolve();
  }

  hideTutorialHint(): void {}

  showBoosterActivation(): Promise<void> {
    GameEvents.publish('anim', { name: 'booster' });
    return Promise.resolve();
  }

  hideBoosterActivation(): void {}

  launchConfetti(): void {
    try {
      if (this.confettiManager === null) {
        const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
        this.confettiManager = new ConfettiManager(canvas);
      }
      this.confettiManager.launchVictoryEffect();
    } catch (error) {
      console.error('❌ Confetti error:', error);
    }
  }

  hideLoading(): void {}

  destroy(): void {
    this.confettiManager?.destroy();
    this.confettiManager = null;
  }
}
