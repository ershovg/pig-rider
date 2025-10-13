/**
 * Базовый класс для всех рендерящихся объектов
 */
export class Renderable {
  constructor() {
    if (this.constructor === Renderable) {
      throw new Error('Renderable is abstract and cannot be instantiated directly');
    }
  }

  activate(lane, x) {
    throw new Error('activate() must be implemented by subclass');
  }

  deactivate() {
    throw new Error('deactivate() must be implemented by subclass');
  }

  update(deltaTime, gameSpeed) {
    throw new Error('update() must be implemented by subclass');
  }

  isActive() {
    throw new Error('isActive() must be implemented by subclass');
  }

  getSprite() {
    throw new Error('getSprite() must be implemented by subclass');
  }

  reset() {
    throw new Error('reset() must be implemented by subclass');
  }
}
