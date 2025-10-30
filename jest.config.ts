import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    maxWorkers: 1, // evitar condições de corrida com banco local
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    clearMocks: true,
    verbose: false
};

export default config;
