/**
 * E2E Test Global Setup
 *
 * Sets up MSW server for mocking API requests
 */

import { test as setup } from '@playwright/test';

setup('global setup', async ({ }) => {
  // Global setup runs before all tests
  console.log('E2E Tests Starting...');
  console.log('Note: MSW handlers are configured in msw/handlers.ts');
  console.log('API calls will be mocked to avoid real LLM requests');
});
