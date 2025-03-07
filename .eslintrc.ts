module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
    },
    plugins: [
        '@typescript-eslint'
    ],
    rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': ['warn', {
            allowExpressions: true,
            allowTypedFunctionExpressions: true
        }],
        '@typescript-eslint/no-unused-vars': ['error', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
        }],
        'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
};
