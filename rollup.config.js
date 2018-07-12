/* eslint no-console: off */

import fs from 'fs';
import { resolve } from 'path';
import { promisify } from 'util';

import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

import { compose } from 'ramda';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const packages = resolve(__dirname, 'packages');

const getBanner = packageJSON => `
/**
 * ${packageJSON.name} v${packageJSON.version}
 * ${packageJSON.description}
 */
`;

const getJSON = path => readFile(path, 'utf8').then(JSON.parse);

const getExternal = compose(
  regExp => id => regExp.test(id),
  pattern => new RegExp(pattern),
  joined => `^(${joined})(\\/|$)`,
  externals => externals.join('|'),
);

export default readdir(packages).then(
  dirNames =>
    Promise.all(
      dirNames.map(async dirName => {
        const resolvePath = (...path) => resolve(packages, dirName, ...path);
        const packageJSON = await getJSON(resolvePath('package.json'));

        return {
          input: resolvePath('src', 'index.js'),
          output: {
            file: resolvePath('lib', 'index.js'),
            format: 'cjs',
            banner: getBanner(packageJSON),
          },
          plugins: [
            babel(),
            nodeResolve(),
            commonjs({
              include: resolvePath('node_modules/react/**'),
              namedExports: {
                [resolvePath('node_modules/react/index.js')]: [
                  'createContext',
                  'createElement',
                  'PureComponent',
                ],
              },
            }),
          ],
          external: getExternal(Object.keys(packageJSON.dependencies)),
        };
      }),
    ),
  console.error,
);
