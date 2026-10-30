module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/backend/**/*.test.js"],
  modulePathIgnorePatterns: ["<rootDir>/ClientApp/"],
  transform: {},
  clearMocks: true,
};