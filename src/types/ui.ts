export interface UIEventCallbacks {
  onPlayClick?(): void;
  onRestartGame?(): void;
  onMuteToggle?(): boolean;
}

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
  showBoosterModal(isFirstTime?: boolean): Promise<boolean>;
  hideBoosterModal(): void;
  hideAll(): void;
  updateCoinCount(current: number, target?: number): void;
  updateMuteButtonState(isMuted: boolean): void;
  setupEventListeners(callbacks: UIEventCallbacks): void;
  launchConfetti(): void;
  showTutorialHint(): Promise<void>;
  hideTutorialHint(): void;
  showBoosterActivation(): Promise<void>;
  hideBoosterActivation(): void;
  hideLoading(): void;
  destroy(): void;
}
