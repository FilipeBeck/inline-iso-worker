module.exports = {
  preset: 'jest-puppeteer',
  transform: {
    '\.ts$': "ts-jest"
  },
  testMatch: ['**/*.test.ts'],
  globals: {
    'ts-jest': {
      tsConfig: {
        importHelpers: false
      }
    }
  }
};