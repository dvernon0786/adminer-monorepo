module.exports = {
  extends: ['@eslint/js/recommended'],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
  },
};