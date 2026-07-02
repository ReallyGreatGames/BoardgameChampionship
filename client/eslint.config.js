// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      curly: 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "LogicalExpression[operator='||'][right.type='Identifier'][right.name='undefined']",
          message:
            "Avoid `x || undefined`: Appwrite's updateRow JSON-serializes payloads, so `undefined` fields are silently dropped and never clear the value in the database. Pass the empty/falsy value directly (e.g. '', null, false) instead.",
        },
        {
          selector:
            "LogicalExpression[operator='||'][right.type='UnaryExpression'][right.operator='void']",
          message:
            "Avoid `x || void 0`: Appwrite's updateRow JSON-serializes payloads, so `undefined` fields are silently dropped and never clear the value in the database. Pass the empty/falsy value directly (e.g. '', null, false) instead.",
        },
        {
          selector:
            "ConditionalExpression[test.type='BinaryExpression'][test.operator=/^(===|==)$/][test.right.value=''][consequent.type='Identifier'][consequent.name='undefined']",
          message:
            "Avoid `x === '' ? undefined : x`: Appwrite's updateRow JSON-serializes payloads, so `undefined` fields are silently dropped and never clear the value in the database. Pass the empty/falsy value directly (e.g. '', null, false) instead.",
        },
        {
          selector:
            "ConditionalExpression[test.type='BinaryExpression'][test.operator=/^(!==|!=)$/][test.right.value=''][alternate.type='Identifier'][alternate.name='undefined']",
          message:
            "Avoid `x !== '' ? x : undefined`: Appwrite's updateRow JSON-serializes payloads, so `undefined` fields are silently dropped and never clear the value in the database. Pass the empty/falsy value directly (e.g. '', null, false) instead.",
        },
      ],
    },
  },
]);
