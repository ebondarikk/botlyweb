module.exports = {
  root: true,
  extends: ['airbnb', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react', 'react-hooks', 'react-refresh', 'prettier', '@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  rules: {
    quotes: ['error', 'single'],
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'prettier/prettier': [
      'error',
      {
        printWidth: 100, // лимит длины строки
        singleQuote: true,
        trailingComma: 'all',
        endOfLine: 'auto',
      },
    ],
    'react/prop-types': 'off',
    'react/jsx-props-no-spreading': 'off',
    '@typescript-eslint/no-unused-vars': ['warn'],
    'no-unused-vars': ['warn'],
  },
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      alias: {
        map: [['@', './src']],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
