/* eslint import/no-extraneous-dependencies: off */

import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

import packageJson from './package.json';

const banner = `
/**
 * ${packageJson.name} v${packageJson.version}
 * ${packageJson.description}
 */
`;

export default {
  input: 'src/index.js',
  output: {
    file: 'lib/index.js',
    format: 'cjs',
    banner,
  },
  plugins: [
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: [
        '@babel/flow',
        [
          '@babel/env',
          {
            targets: {
              node: 6,
              browsers: [
                'last 5 Chrome versions',
                'last 5 Firefox versions',
                'iOS >= 8',
                'ie >= 9',
              ],
            },
            modules: false,
            useBuiltIns: 'usage',
          },
        ],
      ],
    }),
    resolve(),
    commonjs(),
  ],

  external: id =>
    id === 'most' || id === 'symbol-observable' || /^core-js(\/|$)/.test(id),
};
