# React Integration Guide (если понадобится)

## ⚠️ Предупреждение

Сейчас игра работает на **Vanilla JS + PixiJS**. React добавит:
- +150KB к bundle size
- Дополнительную сложность
- Дублирование UI логики

**Рекомендация:** используй React только если ДЕЙСТВИТЕЛЬНО нужно.

---

## Шаг 1: Установка

```bash
npm install react react-dom
npm install -D @vitejs/plugin-react
```

---

## Шаг 2: Обновить vite.config.js

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // ... остальная конфигурация
});
```

---

## Шаг 3: Создать React компонент-обёртку

```jsx
// src/components/GameWrapper.jsx
import React, { useEffect, useRef } from 'react';
import Game from '../Game.js';

export default function GameWrapper() {
  const gameRef = useRef(null);

  useEffect(() => {
    // Инициализация PixiJS игры
    const game = new Game();
    game.init();
    gameRef.current = game;

    return () => {
      // Cleanup при размонтировании
      game.destroy();
    };
  }, []);

  return (
    <div id="game-root">
      <canvas id="game-canvas"></canvas>
    </div>
  );
}
```

---

## Шаг 4: Изменить entry point

```jsx
// src/main.jsx (переименовать из main.js)
import React from 'react';
import ReactDOM from 'react-dom/client';
import GameWrapper from './components/GameWrapper.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameWrapper />
  </React.StrictMode>
);
```

---

## Шаг 5: Обновить index.html

```html
<!DOCTYPE html>
<html>
<head>
  <title>Pig Rider</title>
</head>
<body>
  <!-- React root -->
  <div id="root"></div>

  <!-- Изменить на main.jsx -->
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

---

## Альтернатива: Гибридный подход

Оставь игру на Vanilla JS, используй React только для отдельных компонентов:

```jsx
// src/components/ScoreDisplay.jsx
import React from 'react';

export default function ScoreDisplay({ score, target }) {
  return (
    <div className="score">
      {score} / {target}
    </div>
  );
}
```

```javascript
// src/Game.js (Vanilla JS)
import React from 'react';
import ReactDOM from 'react-dom/client';
import ScoreDisplay from './components/ScoreDisplay.jsx';

class Game {
  initUI() {
    // Рендерим только компонент счёта через React
    const root = ReactDOM.createRoot(document.getElementById('score-root'));
    root.render(<ScoreDisplay score={0} target={500} />);
  }
}
```

---

## Выводы

**Для твоей игры:**
- ❌ Полный переход на React — избыточно
- ⚠️ Гибридный подход — возможен, но добавляет сложность
- ✅ Оставить Vanilla JS — оптимально

**React стоит использовать для:**
- Отдельной админ-панели
- Dashboard с аналитикой
- Сложных форм и настроек

Но НЕ для самой игры.
