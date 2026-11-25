import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// ESLint 9 doesn't count <Foo /> as a use of Foo, so a missing import only shows up as a crash in the browser.
const jsxNoUndef = {
  meta: { type: 'problem' },
  create: (context) => ({
    JSXOpeningElement(node) {
      let name = node.name
      const member = name.type === 'JSXMemberExpression'
      while (name.type === 'JSXMemberExpression') name = name.object
      if (name.type !== 'JSXIdentifier' || (!member && /^[a-z]/.test(name.name))) return // <div>, <svg>
      for (let scope = context.sourceCode.getScope(node); scope; scope = scope.upper) if (scope.set.has(name.name)) return
      context.report({ node: name, message: `'${name.name}' is not defined (missing import?).` })
    },
  }),
}

export default defineConfig([
  globalIgnores(['dist', 'build', 'e2e/playwright-report', 'e2e/test-results']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: { local: { rules: { 'jsx-no-undef': jsxNoUndef } } },
    rules: {
      'local/jsx-no-undef': 'error',
      // `motion` is only used as <motion.div>, which this rule can't see without eslint-plugin-react.
      'no-unused-vars': ['error', { varsIgnorePattern: '^([A-Z_]|motion$)' }],
    },
  },
])
