import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import functional from 'eslint-plugin-functional';
import preferArrowFunctions from 'eslint-plugin-prefer-arrow-functions';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'prefer-arrow-functions': preferArrowFunctions,
      functional: functional,
      react: react,
      'react-hooks': reactHooks,
    },
    rules: {
      // ESLint recommended overrides for TypeScript
      'no-unused-vars': 'off',
      'no-undef': 'off',

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-readonly': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],

      // General rules
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',

      // Functional rules
      'functional/no-loop-statements': 'error',
      'functional/no-classes': [
        'error',
        {
          ignoreCodePattern: [
            'extends Data.TaggedError',
            'extends Context.Tag',
            'extends Effect.Service',
          ],
        },
      ],
      'functional/no-this-expressions': 'error',
      'functional/no-let': 'error',
      'prefer-arrow-functions/prefer-arrow-functions': [
        'error',
        {
          allowedNames: [],
          allowNamedFunctions: false,
          allowObjectProperties: false,
          classPropertiesAllowed: false,
          disallowPrototype: false,
          returnStyle: 'implicit',
          singleReturnOnly: false,
        },
      ],

      // React specific rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-unescaped-entities': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ignores: [
      'dist',
      'node_modules',
      'vite.config.ts',
      'src/vite-plugin-caddy.ts',
    ],
  },
];
