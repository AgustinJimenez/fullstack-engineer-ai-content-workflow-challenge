import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

/**
 * Backend ESLint configuration for TypeScript files
 */
export default [
  {
    // Ignore patterns for backend
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/*.config.ts',
    ],
  },
  {
    // JavaScript files
    files: ['**/*.{js,mjs,cjs,jsx}'],
    rules: {
      // Best practices
      'no-console': 'off', // Allow console in backend
      'no-debugger': 'warn',
      'no-unused-vars': 'off',
      
      // Code style (defer to Prettier)
      'indent': 'off',
      'quotes': 'off',
      'semi': 'off',
      
      // Prevent common errors
      'no-var': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
    },
  },
  {
    // TypeScript files
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Disable JavaScript rules that conflict with TypeScript
      'no-console': 'off', // Allow console in backend
      'no-debugger': 'warn',
      'no-unused-vars': 'off',
      
      // TypeScript-specific rules (lenient for backend)
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/ban-types': 'off',
      
      // Code style (defer to Prettier)
      'indent': 'off',
      'quotes': 'off',
      'semi': 'off',
      
      // Prevent common errors
      'no-var': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
    },
  },
];