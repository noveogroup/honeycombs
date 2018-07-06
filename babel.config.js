/* @flow */

module.exports = {
  plugins: ['@babel/plugin-proposal-class-properties'],
  presets: [
    '@babel/flow',
    '@babel/react',
    [
      '@babel/env',
      {
        targets: {
          node: 6,
          browsers: [
            'last 5 Chrome versions',
            'last 5 Firefox versions',
            'iOS >= 9',
            'ie >= 10',
          ],
        },
        modules: false,
        useBuiltIns: 'usage',
        loose: true,
      },
    ],
  ],
  env: {
    test: {
      plugins: ['istanbul'],
    },
  },
};
