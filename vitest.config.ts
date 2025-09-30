import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next', 'out'],
    coverage: {
      enabled: false, // Disable by default for faster tests, enable with --coverage
      reporter: ['text', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        '.next/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'src/app/',
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80,
        },
      },
    },
    testTimeout: 5000, // Reduced timeout for faster tests
    pool: 'threads', // Use threads for better performance
    reporters: process.env.CI ? ['verbose'] : ['default'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
