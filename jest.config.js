module.exports = {
  moduleFileExtensions: ['js', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/utils/api$': '<rootDir>/tests/unit/__mocks__/Api.js',
    '^@/utils/Api$': '<rootDir>/tests/unit/__mocks__/Api.js'
  },
  testMatch: [
    '**/tests/unit/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'src/components/**/*.vue',
    'src/mixins/**/*.js',
    'src/utils/**/*.js',
    '!src/components/**/index.js',
    '!**/node_modules/**'
  ],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.js'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['html', 'text', 'lcov'],
  verbose: true
}
