import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
  const config = {
    root: './',
    publicDir: 'public',
    server: {
      port: 3000,
      open: true,
      cors: true,
      host: '0.0.0.0',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      watch: {
        ignored: ['**/draft/**']
      }
    },
    optimizeDeps: {
      exclude: ['draft']
    }
  };

  // Конфигурация для production (Webflow bundle)
  if (command === 'build' && mode === 'webflow') {
    config.build = {
      outDir: 'dist',
      emptyOutDir: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: true
        }
      },
      sourcemap: true,
      lib: {
        entry: resolve(__dirname, 'src/embed.ts'),
        name: 'PigRiderGame',
        formats: ['iife'], // IIFE для прямого подключения в браузере
        fileName: () => 'game.bundle.js'
      },
      rollupOptions: {
        // PixiJS грузится с CDN хостом; gsap вшиваем — глобала для него на странице нет
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
