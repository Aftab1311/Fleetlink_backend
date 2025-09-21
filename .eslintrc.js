module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Customize rules as needed
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'comma-dangle': ['error', 'never'],
    'max-len': ['error', { code: 120, ignoreComments: true }],
    'no-underscore-dangle': ['error', { allow: ['_id', '__v'] }],
    'consistent-return': 'off',
    'no-param-reassign': ['error', { props: false }],
    'prefer-destructuring': ['error', { object: true, array: false }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // MongoDB/Mongoose specific
    'func-names': 'off',
    'no-use-before-define': ['error', { functions: false }],
    
    // Jest specific
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
  },
  plugins: ['jest'],
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-unused-expressions': 'off',
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      },
    },
  ],
};

