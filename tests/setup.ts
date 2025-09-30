// Test setup file for vitest
import { beforeAll, afterAll } from 'vitest';

// Mock environment variables for tests
beforeAll(() => {
  process.env.GROQ_API_KEY = 'test-api-key';
  // NODE_ENV might be read-only, so we'll work with whatever it is
});

// Clean up after all tests
afterAll(() => {
  delete process.env.GROQ_API_KEY;
});
