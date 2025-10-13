/**
 * Управление вводом игрока (keyboard + touch)
 */
export class PlayerInputController {
  constructor(player, eventTarget = window) {
    this.player = player;
    this.eventTarget = eventTarget;

    this.keys = {
      up: false,
      down: false
    };

    this.touchStartY = null;

    this.setupInput();
  }

  setupInput() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    this.eventTarget.addEventListener('keydown', this.handleKeyDown);
    this.eventTarget.addEventListener('keyup', this.handleKeyUp);
    this.eventTarget.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.eventTarget.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.eventTarget.addEventListener('touchend', this.handleTouchEnd);
  }

  handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        if (!this.keys.up) {
          this.keys.up = true;
          this.player.moveUp();
        }
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        if (!this.keys.down) {
          this.keys.down = true;
          this.player.moveDown();
        }
        break;
    }
  }

  handleKeyUp(e) {
    switch (e.key) {
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

  handleTouchStart(e) {
    this.touchStartY = e.touches[0].clientY;
  }

  handleTouchMove(e) {
    if (!this.touchStartY) return;
    e.preventDefault();

    const touchY = e.touches[0].clientY;
    const deltaY = this.touchStartY - touchY;
    const threshold = 30;

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        this.player.moveUp();
      } else {
        this.player.moveDown();
      }
      this.touchStartY = touchY;
    }
  }

  handleTouchEnd() {
    this.touchStartY = null;
  }

  destroy() {
    this.eventTarget.removeEventListener('keydown', this.handleKeyDown);
    this.eventTarget.removeEventListener('keyup', this.handleKeyUp);
    this.eventTarget.removeEventListener('touchstart', this.handleTouchStart);
    this.eventTarget.removeEventListener('touchmove', this.handleTouchMove);
    this.eventTarget.removeEventListener('touchend', this.handleTouchEnd);
  }
}
