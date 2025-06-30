import tseslint from 'typescript-eslint';

export default [
  ...tseslint.configs.recommended,
  {
    ignores: ['components/ui', '.output', '.wxt'],
  },
];
