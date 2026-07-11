const nextJest = require('next/jest.js')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

module.exports = createJestConfig(customJestConfig)