export interface UIController {
  addBoosterClass(): void;
  removeBoosterClass(): void;
  showBoosterIcon(): void;
  hideBoosterIcon(): void;
  showStartScreen(): void;
  hideStartScreen(): void;
  showRunningScreen(): void;
  hideRunningScreen(): void;
  showWinScreen(score: number): void;
  showLoseScreen(score: number): void;
  hideWinScreen(): void;
  hideLoseScreen(): void;
  showBoosterModal(isFirstTime: boolean): Promise<boolean>;
  hideBoosterModal(): void;
  updateCoinCount(current: number, target: number): void;
  updateMuteButtonState(isMuted: boolean): void;
}
