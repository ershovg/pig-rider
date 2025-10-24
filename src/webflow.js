/**
 * Webflow Entry Point
 * Этот файл собирается в game.bundle.js для использования в Webflow
 */

import { Game } from './Game.js';
import { CONFIG } from './shared/config/constants.js';

// Глобальная переменная для доступа к игре
let gameInstance = null;

/**
 * Инициализация игры
 * Можно переопределить конфиг через window.GAME_CONFIG в Webflow
 */
async function initGame() {
  try {
    console.log('🎮 Pig Rider Game - Initializing...');

    // Мержим кастомный конфиг из Webflow (если есть)
    if (window.GAME_CONFIG) {
      console.log('📝 Custom config detected:', window.GAME_CONFIG);
      Object.assign(CONFIG, window.GAME_CONFIG);
    }

    // Проверяем что PixiJS загружен
    if (typeof PIXI === 'undefined') {
      throw new Error('PixiJS not loaded. Please include PixiJS CDN before this script.');
    }

    // Создаем инстанс игры
    gameInstance = new Game();
    await gameInstance.init();

    // Экспортируем в window для доступа из Webflow
    window.PigRiderGame = gameInstance;

    console.log('✅ Game initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize game:', error);

    // Показываем ошибку пользователю
    const startScreen = document.querySelector('.game-ui.game-start');
    if (startScreen) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'color: red; padding: 20px; text-align: center;';
      errorDiv.innerHTML = `
        <h3>Error Loading Game</h3>
        <p>${error.message}</p>
        <p style="font-size: 12px;">Check console for details</p>
      `;
      startScreen.appendChild(errorDiv);
    }
  }
}

// Запускаем когда DOM готов
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

// Handle page visibility changes (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
  if (!gameInstance) return;

  if (document.hidden) {
    gameInstance.pause();
  } else {
    // НЕ резюмим автоматически если ожидается пользовательский ввод
    // (например, модал бустера требует клика по кнопке)
    if (!gameInstance.isWaitingForUserInput) {
      gameInstance.resume();
    }
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (gameInstance) {
    gameInstance.destroy();
  }
});

// Экспортируем для использования в других скриптах Webflow
export { gameInstance };
