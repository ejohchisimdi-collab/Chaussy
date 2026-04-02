import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Tell Jest to look in both src and tests directories
  roots: ['<rootDir>/tests', '<rootDir>/src'], 
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/*.test.ts'],
  
  // This maps imports ending in .js to their .ts equivalents
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};

export default config; 