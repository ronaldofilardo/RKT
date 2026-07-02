const nextJest = require('next/jest.js')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/core/scoring/engine.ts',
    'src/core/scoring/scoring-logic.ts',
    'src/core/scoring/types.ts',
    'src/lib/auth.ts',
    'src/lib/match-events.ts',
    'src/schemas/contracts.ts',
    'src/app/api/auth/login/route.ts',
    'src/app/api/matches/route.ts',
    'src/app/api/players/route.ts',
    'src/app/api/matches/[id]/sessions/route.ts',
    'src/app/api/matches/[id]/sessions/[sessionId]/abandon/route.ts',
    'src/app/api/matches/[id]/sessions/[sessionId]/endorse/route.ts',
    'src/app/api/matches/[id]/state/route.ts',
    'src/app/api/matches/[id]/point/route.ts',
    'src/app/api/matches/[id]/events/route.ts',
    'src/app/api/matches/suspended-sessions/route.ts',
    'src/services/adminService.ts',
    'src/services/sessionService.ts',
    'src/services/matchService.ts',
    'src/services/playerService.ts',
    'src/lib/offlineDb.ts',
    'src/app/api/admin/users/route.ts',
    'src/app/api/admin/users/[id]/route.ts',
    'src/components/scoring/timeline-utils.ts',
    'src/hooks/useMatchEvents.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      statements: 65,
      branches: 65,
      functions: 75,
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
  coverageReporters: ['text', 'lcov', 'html'],
  coverageProvider: 'v8',
}

module.exports = createJestConfig(customJestConfig)
