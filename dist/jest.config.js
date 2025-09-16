"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    maxWorkers: 1, // evitar condições de corrida com banco local
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    clearMocks: true,
    verbose: false
};
exports.default = config;
