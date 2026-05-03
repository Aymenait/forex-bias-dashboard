export default {
  testEnvironment: 'jsdom',
  transform: {},
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    '*.js',
    '!*.test.js',
    '!jest.config.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/test-setup.js']
};
