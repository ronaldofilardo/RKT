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
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/core/scoring/__tests__/engine.flow.characterization.test.ts', '<rootDir>/src/core/scoring/__tests__/scoring-logic.characterization.test.ts', '<rootDir>/src/core/scoring/__tests__/engine.characterization.test.ts'],
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(jose|@prisma|@ducanh2912)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  collectCoverage: false,
  coverageProvider: 'v8',
}

module.exports = createJestConfig(customJestConfig)