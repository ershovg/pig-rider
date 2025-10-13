import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/constants.js';
import { Collidable } from './base/Collidable.js';
import { Interpolatable } from './interfaces/Interpolatable.js';
import { Cullable } from './interfaces/Cullable.js';

/**
 * Препятствие с коллизией, interpolation и culling
 *
 * Расширяет:
 * - Collidable: базовая коллизия (legacy)
 * - Interpolatable: плавное движение на 120 FPS
 * - Cullable: автоматическое удаление за viewport
 */
export class Obstacle extends Collidable {
  constructor(texture) {
    super();

    // Sprite setup
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    const targetSize = CONFIG.OBSTACLE.SIZE;
    const scale = targetSize / texture.width;
    this.sprite.scale.set(scale);

    // State
    this.active = false;
    this.lane = 0;
    this.sprite.visible = false;

    // 🆕 Interpolation state (from Interpolatable interface)
    this.previousX = 0;
    this.previousY = 0;
    this.currentX = 0;
    this.currentY = 0;
  }

  /**
   * Устанавливает текстуру препятствия
   * @param {PIXI.Texture} texture - Новая текстура
   */
  setTexture(texture) {
    this.sprite.texture = texture;
    // Пересчитываем масштаб под новую текстуру
    const targetSize = CONFIG.OBSTACLE.SIZE;
    const scale = targetSize / texture.width;
    this.sprite.scale.set(scale);
  }

  activate(lane, x, texture = null) {
    this.active = true;
    this.lane = lane;

    // Если передана текстура, меняем её перед активацией
    if (texture) {
      this.setTexture(texture);
    }

    // 🆕 Устанавливаем физическую позицию
    this.currentX = x;
    this.currentY = CONFIG.LANES.Y_POSITIONS[lane];

    // Синхронизируем спрайт с физикой (для первого кадра)
    this.sprite.x = this.currentX;
    this.sprite.y = this.currentY;

    // Инициализируем previous = current (нет interpolation при активации)
    this.previousX = this.currentX;
    this.previousY = this.currentY;

    this.sprite.visible = true;
  }

  deactivate() {
    this.active = false;
    this.sprite.visible = false;
  }

  update(deltaTime, gameSpeed) {
    if (!this.active) return;

    // 🆕 Сохраняем текущую позицию как "предыдущую" для interpolation
    this.saveState();

    // Обновляем физическую позицию (НЕ sprite.x напрямую)
    this.currentX -= gameSpeed * deltaTime * 800;

    // Примечание: deactivation теперь управляется через CullingManager
    // Оставляем старую проверку для backward compatibility
    if (this.currentX < -CONFIG.OBSTACLE.SIZE) {
      this.deactivate();
    }
  }

  getHitbox() {
    if (!this.active) return null;
    const scale = CONFIG.COLLISION.OBSTACLE_HITBOX_SCALE;
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

  reset() {
    this.deactivate();
    this.currentX = CONFIG.CANVAS_WIDTH + 100;
    this.sprite.x = this.currentX;
  }

  getSprite() {
    return this.sprite;
  }

  isActive() {
    return this.active;
  }

  // 🆕 Interpolatable interface implementation
  saveState() {
    this.previousX = this.currentX;
    this.previousY = this.currentY;
  }

  interpolate(alpha) {
    if (!this.sprite) return;
    // Линейная интерполяция для плавного движения на 120 FPS
    this.sprite.x = this.previousX + (this.currentX - this.previousX) * alpha;
    this.sprite.y = this.previousY + (this.currentY - this.previousY) * alpha;
  }

  // 🆕 Cullable interface implementation
  shouldCull(threshold) {
    return this.active && this.currentX < threshold;
  }
}
