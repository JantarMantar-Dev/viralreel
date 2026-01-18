import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'dist',
        'src/test/**',
        'src/scripts/**',
        'src/db/seed-*.ts',
      ],
    },
    // Use forks pool for better isolation when mocking modules
    pool: 'forks',
    // Increase timeout for integration tests
    testTimeout: 30000,
  },
});
