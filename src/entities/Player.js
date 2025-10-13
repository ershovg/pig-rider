/**
 * Игрок с physics-based движением, interpolation и instant response
 *
 * Архитектура:
 * - PlayerPhysicsController: Управляет физикой движения (velocity, acceleration)
 * - Interpolatable: Плавный рендер на 120 FPS
 * - PlayerInputController: Обработка input (keyboard, mouse, touch)
 *
 * Отличия от GSAP подхода:
 * ✅ Мгновенный отклик - нет блокировки isAnimating
 * ✅ Синхронизация с physics loop (60 UPS)
 * ✅ Плавное торможение через friction
 * ✅ Возможность смены направления на лету
 */
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { CONFIG } from '../config/constants.js';
import { PlayerInputController } from '../controllers/PlayerInputController.js';
import { PlayerPhysicsController } from '../controllers/PlayerPhysicsController.js';
import { CollisionPhysicsController } from '../controllers/CollisionPhysicsController.js';

export class Player {
  constructor(spritesheet, physicsController, screenWidth = CONFIG.CANVAS_WIDTH, screenHeight = CONFIG.CANVAS_HEIGHT) {
    this.currentLane = CONFIG.LANES.MIDDLE;
    this.targetLane = CONFIG.LANES.MIDDLE;

    this.physicsController = physicsController || new PlayerPhysicsController(CONFIG.PLAYER.PHYSICS);

    const textures = spritesheet.animations['Hryusha_flying_v2'];
    if (!textures) {
      console.error('❌ Animation "Hryusha_flying_v2" not found in spritesheet!');
      console.log('Available animations:', Object.keys(spritesheet.animations));
      throw new Error('Missing animation: Hryusha_flying_v2');
    }
    this.sprite = new PIXI.AnimatedSprite(textures);
    this.sprite.anchor.set(0.5);
    this.sprite.animationSpeed = 0.5;
    this.sprite.loop = true;
    this.sprite.play();
    this.sprite.width = CONFIG.PLAYER.SIZE;
    this.sprite.height = CONFIG.PLAYER.SIZE;

    // 🆕 Физическая позиция (для interpolation)
    this.currentX = CONFIG.PLAYER.START_X;
    this.currentY = CONFIG.LANES.Y_POSITIONS[this.currentLane];
    this.previousX = this.currentX;
    this.previousY = this.currentY;

    this.sprite.x = this.currentX;
    this.sprite.y = this.currentY;

    this.physicsController.reset(this.currentY);

    this.collisionPhysics = new CollisionPhysicsController(
      this.sprite,
      CONFIG.PLAYER.COLLISION_PHYSICS,
      screenWidth,
      screenHeight
    );

    // Input handling
    this.inputController = new PlayerInputController(this);

    console.log('🐷 Animated Player created with', textures.length, 'frames (physics-based)');
  }

  /**
   * Движение вверх (мгновенный отклик)
   *
   * Старая версия блокировала повторные вызовы через isAnimating.
   * Новая версия позволяет смену направления на лету.
   */
  moveUp() {
    if (this.targetLane === CONFIG.LANES.TOP) return; // Уже двигаемся к верхней

    this.targetLane = Math.max(CONFIG.LANES.TOP, this.targetLane - 1);
    const targetY = CONFIG.LANES.Y_POSITIONS[this.targetLane];
    this.physicsController.setTarget(targetY);
  }

  /**
   * Движение вниз (мгновенный отклик)
   */
  moveDown() {
    if (this.targetLane === CONFIG.LANES.BOTTOM) return; // Уже двигаемся к нижней

    this.targetLane = Math.min(CONFIG.LANES.BOTTOM, this.targetLane + 1);
    const targetY = CONFIG.LANES.Y_POSITIONS[this.targetLane];
    this.physicsController.setTarget(targetY);
  }

  getHitbox() {
    const scale = CONFIG.COLLISION.PLAYER_HITBOX_SCALE;
    const width = this.sprite.width * scale;
    const height = this.sprite.height * scale;

    // 🆕 Используем физическую позицию для точных коллизий
    return {
      x: this.currentX - width / 2,
      y: this.currentY - height / 2,
      width: width,
      height: height
    };
  }

  /**
   * Обновление физики (вызывается в game loop 60 UPS)
   */
  update(deltaTime) {
    // Если активна физика столкновения - она управляет позицией
    if (this.collisionPhysics.isActive()) {
      this.collisionPhysics.update(deltaTime);
      return;
    }

    // 🆕 Сохраняем состояние для interpolation
    this.saveState();

    // Обновляем физику через controller
    const result = this.physicsController.update(deltaTime);
    this.currentY = result.y;

    // Обновляем lane когда достигли цели
    if (!result.isMoving && this.currentLane !== this.targetLane) {
      this.currentLane = this.targetLane;
    }

    // X позиция фиксирована
    // (если будут power-ups с горизонтальным движением, добавить здесь)
  }

  reset() {
    this.currentLane = CONFIG.LANES.MIDDLE;
    this.targetLane = CONFIG.LANES.MIDDLE;

    this.currentY = CONFIG.LANES.Y_POSITIONS[this.currentLane];
    this.previousY = this.currentY;
    this.sprite.x = CONFIG.PLAYER.START_X;
    this.sprite.y = this.currentY;
    this.sprite.rotation = 0;
    this.sprite.visible = true;

    this.physicsController.reset(this.currentY);
    this.collisionPhysics.deactivate();
    this.inputController.enable();

    gsap.killTweensOf(this.sprite);
  }

  getSprite() {
    return this.sprite;
  }

  /**
   * Проверяет, движется ли игрок в данный момент
   */
  isMoving() {
    return this.physicsController.isMoving();
  }

  /**
   * Получить текущую lane (0 = top, 1 = middle, 2 = bottom)
   */
  getCurrentLane() {
    return this.currentLane;
  }

  triggerCollision(obstacleSprite, callback) {
    this.inputController.disable();
    this.collisionPhysics.activate(obstacleSprite, callback);
  }

  destroy() {
    gsap.killTweensOf(this.sprite);
    if (this.inputController) {
      this.inputController.destroy();
    }
    if (this.collisionPhysics) {
      this.collisionPhysics.destroy();
    }
    this.sprite.destroy();
  }

  // 🆕 Interpolatable interface
  saveState() {
    this.previousX = this.currentX;
    this.previousY = this.currentY;
  }

  interpolate(alpha) {
    if (!this.sprite) return;
    if (this.collisionPhysics.isActive()) {
      return;
    }
    this.sprite.x = this.currentX;
    this.sprite.y = this.previousY + (this.currentY - this.previousY) * alpha;
  }

  // Player не cullable (всегда на экране), но должен реагировать на isActive() проверки
  isActive() {
    return true;
  }
}
