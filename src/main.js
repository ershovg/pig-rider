import { Game } from './Game.js';

// Entry point for the game
let game = null;

async function init() {
  try {
    console.log('🎮 Pig Rider - Initializing...');

    game = new Game();
    await game.init();

    // Expose game instance globally for debugging
    window.PigRiderGame = game;

    console.log('✅ Game ready! Press SPACE to start');
  } catch (error) {
    console.error('❌ Failed to initialize game:', error);

    // Show error message to user
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.innerHTML = `
        <h2 style="color: red;">Error Loading Game</h2>
        <p>${error.message}</p>
        <p>Please check the console for details.</p>
      `;
    }
  }
}

// Handle page visibility changes (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
  if (!game) return;

  if (document.hidden) {
    game.pause();
  } else {
    game.resume();
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (game) {
    game.destroy();
  }
});

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
