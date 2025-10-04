import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../config/constants.js';

export class Player {
  constructor(texture) {
    this.currentLane = CONFIG.LANES.MIDDLE;
    this.isAnimating = false;

    // Create sprite
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.width = CONFIG.PLAYER.SIZE;
    this.sprite.height = CONFIG.PLAYER.SIZE;

    // Set initial position
    this.sprite.x = CONFIG.PLAYER.START_X;
    this.sprite.y = CONFIG.LANES.Y_POSITIONS[this.currentLane];

    // Input setup
    this.setupInput();

    console.log('🐷 Player created');
  }

  /**
   * Setup keyboard and touch input handlers
   */
  setupInput() {
    this.keys = {
      up: false,
      down: false
    };

    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Touch controls
    this.touchStartY = null;
    window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    window.addEventListener('touchend', () => this.handleTouchEnd());
  }

  /**
   * Handle keydown events
   */
  handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        if (!this.keys.up) {
          this.keys.up = true;
          this.moveUp();
        }
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        if (!this.keys.down) {
          this.keys.down = true;
          this.moveDown();
        }
        break;
    }
  }

  /**
   * Handle keyup events
   */
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

  /**
   * Handle touch start
   */
  handleTouchStart(e) {
    this.touchStartY = e.touches[0].clientY;
  }

  /**
   * Handle touch move (swipe detection)
   */
  handleTouchMove(e) {
    if (!this.touchStartY) return;

    e.preventDefault(); // Prevent scrolling

    const touchY = e.touches[0].clientY;
    const deltaY = this.touchStartY - touchY;
    const threshold = 30; // Minimum swipe distance

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        // Swipe up
        this.moveUp();
      } else {
        // Swipe down
        this.moveDown();
      }
      this.touchStartY = touchY; // Reset for continuous swipes
    }
  }

  /**
   * Handle touch end
   */
  handleTouchEnd() {
    this.touchStartY = null;
  }

  /**
   * Move player to lane above
   */
  moveUp() {
    if (this.isAnimating || this.currentLane === CONFIG.LANES.TOP) return;

    this.currentLane--;
    this.animateToLane();
  }

  /**
   * Move player to lane below
   */
  moveDown() {
    if (this.isAnimating || this.currentLane === CONFIG.LANES.BOTTOM) return;

    this.currentLane++;
    this.animateToLane();
  }

  /**
   * Animate sprite to target lane using GSAP
   */
  animateToLane() {
    const targetY = CONFIG.LANES.Y_POSITIONS[this.currentLane];
    this.isAnimating = true;

    gsap.to(this.sprite, {
      y: targetY,
      duration: CONFIG.PLAYER.SWITCH_DURATION,
      ease: 'power2.out',
      onComplete: () => {
        this.isAnimating = false;
      }
    });
  }

  /**
   * Get hitbox for collision detection
   */
  getHitbox() {
    const scale = CONFIG.COLLISION.PLAYER_HITBOX_SCALE;
    const width = this.sprite.width * scale;
    const height = this.sprite.height * scale;

    return {
      x: this.sprite.x - width / 2,
      y: this.sprite.y - height / 2,
      width: width,
      height: height
    };
  }

  /**
   * Update player (called each frame)
   */
  update(deltaTime) {
    // Player position is fixed horizontally
    // Vertical movement is handled by GSAP animations
    // Additional update logic can be added here if needed
  }

  /**
   * Reset player to initial state
   */
  reset() {
    this.currentLane = CONFIG.LANES.MIDDLE;
    this.sprite.y = CONFIG.LANES.Y_POSITIONS[this.currentLane];
    this.isAnimating = false;
    gsap.killTweensOf(this.sprite);
  }

  /**
   * Get sprite for adding to stage
   */
  getSprite() {
    return this.sprite;
  }

  /**
   * Destroy player and cleanup
   */
  destroy() {
    gsap.killTweensOf(this.sprite);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.sprite.destroy();
  }
}
