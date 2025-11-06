import type { Player } from '../../../types/player';
import type { Lane } from '../../../types/common';

interface KeyState {
  up: boolean;
  down: boolean;
}

interface EventConfig {
  event: string;
  handler: (e: Event) => void;
  options?: AddEventListenerOptions;
}

export class PlayerInputController {
  private readonly SWIPE_THRESHOLD = 30;
  private readonly LANE_BOUNDARIES = [0.33, 0.66];
  private readonly CANVAS_ID = 'game-canvas';
  private readonly UI_SELECTORS = ['.mute', '[game-btn-start]', '[open-modal-attr]'];

  private readonly player: Player;
  private readonly eventTarget: EventTarget;
  private readonly keys: KeyState;
  private touchStartY: number | null;
  private enabled: boolean;
  private readonly eventConfigs: EventConfig[];

  constructor(player: Player, eventTarget: EventTarget = window) {
    this.player = player;
    this.eventTarget = eventTarget;
    this.keys = { up: false, down: false };
    this.touchStartY = null;
    this.enabled = true;

    this.eventConfigs = [
      { event: 'keydown', handler: this.handleKeyDown.bind(this) },
      { event: 'keyup', handler: this.handleKeyUp.bind(this) },
      { event: 'touchstart', handler: this.handleTouchStart.bind(this), options: { passive: false } },
      { event: 'touchmove', handler: this.handleTouchMove.bind(this), options: { passive: false } },
      { event: 'touchend', handler: this.handleTouchEnd.bind(this) },
      { event: 'click', handler: this.handleClick.bind(this) }
    ];

    this.setupInput();
  }

  private setupInput(): void {
    this.eventConfigs.forEach(({ event, handler, options }) => {
      this.eventTarget.addEventListener(event, handler, options);
    });
  }

  private handleKeyDown(e: Event): void {
    if (!this.enabled) return;

    const keyEvent = e as KeyboardEvent;

    switch (keyEvent.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        keyEvent.preventDefault();
        if (!this.keys.up) {
          this.keys.up = true;
          this.player.moveUp();
        }
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        keyEvent.preventDefault();
        if (!this.keys.down) {
          this.keys.down = true;
          this.player.moveDown();
        }
        break;
    }
  }

  private handleKeyUp(e: Event): void {
    const keyEvent = e as KeyboardEvent;

    switch (keyEvent.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.keys.up = false;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.keys.down = false;
        break;
    }
  }

  private handleTouchStart(e: Event): void {
    const touchEvent = e as TouchEvent;
    this.touchStartY = touchEvent.touches[0].clientY;
  }

  private handleTouchMove(e: Event): void {
    if (!this.enabled || !this.touchStartY) return;

    const touchEvent = e as TouchEvent;
    touchEvent.preventDefault();

    const touchY = touchEvent.touches[0].clientY;
    const deltaY = this.touchStartY - touchY;

    if (Math.abs(deltaY) > this.SWIPE_THRESHOLD) {
      if (deltaY > 0) {
        this.player.moveUp();
      } else {
        this.player.moveDown();
      }
      this.touchStartY = touchY;
    }
  }

  private handleTouchEnd(): void {
    this.touchStartY = null;
  }

  private handleClick(e: Event): void {
    if (!this.enabled) return;

    const mouseEvent = e as MouseEvent;

    if (this.isUIElementClick(mouseEvent)) {
      return;
    }

    const canvas = this.getCanvas();
    if (!canvas) return;

    const targetLane = this.getLaneFromClick(mouseEvent, canvas);
    this.player.moveToLane(targetLane);
  }

  private isUIElementClick(event: MouseEvent): boolean {
    const target = event.target as HTMLElement;
    return this.UI_SELECTORS.some(selector => target.closest(selector) !== null);
  }

  private getCanvas(): HTMLCanvasElement | null {
    return document.getElementById(this.CANVAS_ID) as HTMLCanvasElement | null;
  }

  private getLaneFromClick(event: MouseEvent, canvas: HTMLCanvasElement): Lane {
    const rect = canvas.getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const relativeY = clickY / rect.height;

    return this.getLaneFromRelativeY(relativeY);
  }

  private getLaneFromRelativeY(relativeY: number): Lane {
    if (relativeY < this.LANE_BOUNDARIES[0]) return 0;
    if (relativeY < this.LANE_BOUNDARIES[1]) return 1;
    return 2;
  }

  disable(): void {
    this.enabled = false;
  }

  enable(): void {
    this.enabled = true;
  }

  destroy(): void {
    this.eventConfigs.forEach(({ event, handler, options }) => {
      this.eventTarget.removeEventListener(event, handler, options);
    });
  }
}
