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
    this.enabled = true;

    this.setupInput();
  }

  setupInput() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleClick = this.handleClick.bind(this);

    this.eventTarget.addEventListener('keydown', this.handleKeyDown);
    this.eventTarget.addEventListener('keyup', this.handleKeyUp);
    this.eventTarget.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.eventTarget.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.eventTarget.addEventListener('touchend', this.handleTouchEnd);
    this.eventTarget.addEventListener('click', this.handleClick);
  }

  handleKeyDown(e) {
    if (!this.enabled) return;

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
    if (!this.enabled || !this.touchStartY) return;
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

  handleClick(e) {
    if (!this.enabled) return;

    // Получаем canvas элемент для расчёта координат
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    // Получаем позицию клика относительно canvas
    const rect = canvas.getBoundingClientRect();
    const clickY = e.clientY - rect.top;

    // Нормализуем координату (0 = верх, 1 = низ)
    const relativeY = clickY / rect.height;

    // Определяем целевую полосу на основе трети экрана
    let targetLane;
    if (relativeY < 0.33) {
      targetLane = 0; // TOP
    } else if (relativeY < 0.66) {
      targetLane = 1; // MIDDLE
    } else {
      targetLane = 2; // BOTTOM
    }

    // Используем новый метод прямого перемещения
    this.player.moveToLane(targetLane);
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }

  destroy() {
    this.eventTarget.removeEventListener('keydown', this.handleKeyDown);
    this.eventTarget.removeEventListener('keyup', this.handleKeyUp);
    this.eventTarget.removeEventListener('touchstart', this.handleTouchStart);
    this.eventTarget.removeEventListener('touchmove', this.handleTouchMove);
    this.eventTarget.removeEventListener('touchend', this.handleTouchEnd);
    this.eventTarget.removeEventListener('click', this.handleClick);
  }
}
