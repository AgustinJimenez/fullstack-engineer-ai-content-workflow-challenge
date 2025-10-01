/**
 * Root ESLint configuration for the AI Content Workflow project
 * 
 * This is a root-level configuration that provides common settings.
 * Individual packages (backend, frontend) have their own specific configs
 * that extend or override these settings as needed.
 */
export default [
  {
    // Global ignores for the entire monorepo
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/test-results/**',
      '**/playwright-report/**',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/*.config.ts',
    ],
  },
  {
    // JavaScript and TypeScript files - basic rules only
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
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
];