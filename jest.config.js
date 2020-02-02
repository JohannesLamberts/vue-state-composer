module.exports = {
  moduleFileExtensions: ['js', 'ts', 'd.ts'],
  clearMocks: true,
  collectCoverage: true,
  setupFilesAfterEnv: ['./jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/spec/**',
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './test-report',
        filename: 'index.html',
        expand: true,
      },
    ],
  ],
}
