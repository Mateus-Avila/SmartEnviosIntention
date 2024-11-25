export default {
    testEnvironment: 'node',
    transform: {
        '\\.[jt]sx?$': ['babel-jest', { presets: ['@babel/preset-env'] }],
    },
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 60,
            lines: 60,
            statements: 60,
        },
    },
    coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
};
