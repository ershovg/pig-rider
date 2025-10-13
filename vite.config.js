import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
  // Базовая конфигурация для dev
  const config = {
    root: './',
    publicDir: 'public',
    server: {
      port: 3000,
      open: true,
      cors: true,  // Разрешаем CORS
      host: '0.0.0.0',  // Слушаем все интерфейсы
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      watch: {
        // Игнорируем папку draft при watch
        ignored: ['**/draft/**']
      }
    },
    // Исключаем draft/ из сканирования зависимостей
    optimizeDeps: {
      exclude: ['draft']
    }
  };

  // Конфигурация для production (Webflow bundle)
  if (command === 'build' && mode === 'webflow') {
    config.build = {
      outDir: 'dist',
      emptyOutDir: true, // Очищаем dist для чистой сборки
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false, // Оставляем console для дебага в Webflow
          drop_debugger: true
        }
      },
      sourcemap: true, // Source maps для дебага
      lib: {
        entry: resolve(__dirname, 'src/webflow.js'),
        name: 'PigRiderGame',
        formats: ['iife'], // IIFE для прямого подключения в браузере
        fileName: () => 'game.bundle.js'
      },
      rollupOptions: {
        // Внешние зависимости (PixiJS загружается через CDN)
        external: ['pixi.js'],
        output: {
          globals: {
            'pixi.js': 'PIXI'
          }
        }
      }
    };
  }

  // Конфигурация для обычного build (локальная разработка)
  if (command === 'build' && mode !== 'webflow') {
    config.build = {
      outDir: 'dist',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          entryFileNames: 'game.min.js',
          assetFileNames: 'assets/[name].[ext]'
        }
      }
    };
  }

  return config;
});
