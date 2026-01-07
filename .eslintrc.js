module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,
    sourceType: 'module',
    extraFileExtensions: ['.vue'],
  },
  plugins: ['@typescript-eslint', 'vue'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-var-requires': 'error',

    // Vue specific rules
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'error',
    'vue/component-definition-name-casing': ['error', 'PascalCase'],
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],

    // General rules
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        // Vue-specific overrides
        '@typescript-eslint/no-unused-vars': 'off',
        'vue/no-unused-vars': 'error',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['wrangler.toml', '*.config.js', '*.config.ts'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '*.min.js', 'coverage/', '.wrangler/'],
};
