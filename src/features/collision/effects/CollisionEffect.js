import * as PIXI from 'pixi.js';

/**
 * Эффект взрыва при столкновении с препятствием
 * Проигрывается один раз и остается на последнем кадре
 */
export class CollisionEffect {
  constructor(spritesheet, container) {
    this.container = container;

    // Создаем AnimatedSprite из спрайтшита boom.json
    // Анимация "Booom" содержит 6 кадров (Booom_000 -> Booom_005)
    const frames = spritesheet.animations['Booom'];
    this.sprite = new PIXI.AnimatedSprite(frames);
    this.sprite.anchor.set(0.5);

    // Настройка анимации
    this.sprite.animationSpeed = 0.4; // 0.4 кадров за тик (60 FPS) = ~24 FPS анимация
    this.sprite.loop = false;          // Проиграть один раз

    // Размер эффекта (sourceSize 150x150px)
    const targetSize = 150; // Средний размер взрыва
    const scale = targetSize / 150;
    this.sprite.scale.set(scale);

    this.active = false;
    this.sprite.visible = false;

    if (this.container) {
      this.container.addChild(this.sprite);
    }

    // Callback после окончания анимации - НЕ деактивируем, оставляем на последнем кадре
    this.sprite.onComplete = () => {
      // Останавливаем на последнем кадре, но НЕ прячем
      this.sprite.stop();
      // Эффект остается видимым до конца игры/reset
    };
  }

  /**
   * Активировать эффект в указанной позиции
   * @param {number} x - X координата столкновения
   * @param {number} y - Y координата столкновения
   */
  activate(x, y) {
    this.active = true;
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.visible = true;
    this.sprite.alpha = 1;

    // Запускаем анимацию с первого кадра
    this.sprite.gotoAndPlay(0);
  }

  /**
   * Деактивировать эффект (вызывается только при reset игры)
   */
  deactivate() {
    this.active = false;
    this.sprite.visible = false;
    this.sprite.stop();
  }

  /**
   * Получить спрайт для добавления на stage
   */
  getSprite() {
    return this.sprite;
  }

  /**
   * Проверка активности
   */
  isActive() {
    return this.active;
  }

  /**
   * Reset для object pooling (вызывается при перезапуске игры)
   */
  reset() {
    this.deactivate();
  }
}
