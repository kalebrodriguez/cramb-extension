import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Playwright fixtures use `{}` destructuring and a `use` parameter that the
    // React-hooks rule mistakes for the `use` hook; neither applies to e2e specs.
    files: ['tests/e2e/**'],
    rules: {
      'no-empty-pattern': 'off',
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  {
    ignores: ['dist/**', '.output/**', '.wxt/**', 'node_modules/**', '*.config.cjs', 'scripts/**'],
  },
);
