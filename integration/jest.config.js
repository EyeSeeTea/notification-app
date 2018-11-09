module.exports = {
    testRegex: './*\\.spec\\.js$',
    setupTestFrameworkScriptFile: '<rootDir>/../config/testSetup.js',
    collectCoverageFrom: ['/integration/**/*.js'],
    testPathIgnorePatterns: ['/node_modules/'],
    transformIgnorePatterns: ['/node_modules/(?!d2-ui).+\\.js$'],
    testEnvironment: 'jsdom',
    globals: {
        window: true,
        document: true,
        navigator: true,
        Element: true,
    },
    snapshotSerializers: ['enzyme-to-json/serializer'],
}
