module.exports = {
  // Basic formatting
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,

  // Indentation
  tabWidth: 2,
  useTabs: false,

  // Line length
  printWidth: 100,

  // Spacing
  bracketSpacing: true,
  bracketSameLine: false,

  // Arrow functions
  arrowParens: 'avoid',

  // Vue specific
  vueIndentScriptAndStyle: false,

  // HTML/Vue template formatting
  htmlWhitespaceSensitivity: 'css',

  // End of line
  endOfLine: 'lf',

  // Override for specific file types
  overrides: [
    {
      files: '*.vue',
      options: {
        parser: 'vue',
      },
    },
    {
      files: '*.json',
      options: {
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
      },
    },
  ],
};
