const nextJest = require('next/jest.js')
const path = require('path')

const createJestConfig = nextJest({
  dir: './',
})

if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: path.join(__dirname, '.env.test') })
}

const customJestConfig = {
  testEnvironment: 'node',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(jose|@prisma|@ducanh2912)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.{test,spec}.{ts,tsx}',
    '!src/**/node_modules/**',
    '!src/**/types.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 65,
      branches: 80,
      functions: 60,
      lines: 65,
    },
    './src/core/scoring/engine.ts': {
      statements: 70,
      branches: 70,
      functions: 80,
      lines: 70,
    },
    './src/core/scoring/scoring-logic.ts': {
      statements: 80,
      branches: 74,
      functions: 85,
      lines: 80,
    },
    './src/lib/auth.ts': {
      statements: 85,
      branches: 70,
      functions: 100,
      lines: 85,
    },
  },
  coverageReporters: ['text', 'lcov', 'json-summary', 'html'],
  coverageProvider: 'v8',
}

module.exports = createJestConfig(customJestConfig)
