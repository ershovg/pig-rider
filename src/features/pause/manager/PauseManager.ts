export default class PauseManager {
    private isPaused: boolean = false;

    constructor() {
        console.log('[PauseManager] initialized');
    }

    pause(): void {
        if (this.isPaused) return;
        this.isPaused = true;
        console.log('[PauseManager] Game paused');
    }

    resume(): void {
        if (!this.isPaused) return;
        this.isPaused = false;
        console.log('[PauseManager] Game resumed');
    }

    toggle(): void {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    getIsPaused(): boolean {
        return this.isPaused;
    }
}