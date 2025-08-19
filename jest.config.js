export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/debug/**/*',
    '!node_modules/**',
    // Include inline scripts from HTML for coverage
    'index.html'
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageDirectory: 'coverage',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.html$': '<rootDir>/tests/transforms/html-transform.js'
  },
  testTimeout: 10000,
  verbose: true,
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  // Security-focused test environment
  testEnvironmentOptions: {
    url: 'http://localhost',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  // Performance testing configuration
  reporters: [
    'default',
    ['jest-html-reporters', {
      'publicPath': './reports',
      'filename': 'test-report.html',
      'expand': true
    }]
  ]
};