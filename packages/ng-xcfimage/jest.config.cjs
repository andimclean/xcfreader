/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  transform: {
    "^.+\\.(ts|mjs|js|html)$": [
      "jest-preset-angular",
      { tsconfig: "<rootDir>/tsconfig.spec.json" },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!.*\\.mjs$)"],
  moduleNameMapper: {
    "@theprogrammingiantpanda/xcfreader/browser":
      "<rootDir>/src/__mocks__/xcfreader-browser.ts",
  },
};
