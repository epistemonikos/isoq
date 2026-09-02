module.exports = {
  moduleFileExtensions: ['js', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/unit/__mocks__/styleMock.js',
    // jpg/jpeg agregados para poder montar componentes que usan las fotos de
    // src/assets (MainPage). Sin esto jest intenta parsear el binario como JS
    // y falla con "Invalid or unexpected token", que no se parece en nada a la
    // causa real.
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/tests/unit/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/utils/api$': '<rootDir>/tests/unit/__mocks__/Api.js',
    '^@/utils/Api$': '<rootDir>/tests/unit/__mocks__/Api.js',
    '^axios$': require.resolve('axios'),
    '^xlsx$': require.resolve('xlsx')
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(axios|@fortawesome)/)'
  ],
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
