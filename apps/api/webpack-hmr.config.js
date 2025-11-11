const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');
const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  target: 'node',
  externals: [
    nodeExternals({
      allowlist: ['webpack/hot/poll?100'],
    }),
  ],
  entry: ['webpack/hot/poll?100', './src/main.ts'],
  watch: true,
  output: {
    path: join(__dirname, '../../dist/apps/api'),
    filename: 'main.js',
  },
  optimization: {
    minimize: false,
    concatenateModules: true,
  },
  ignoreWarnings: [
    // Ignore warnings about TypeScript type-only exports not being found at runtime
    {
      module: /@griffin\/types/,
      message: /export .* was not found/,
    },
  ],
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      vendorChunk: true,
      commonChunk: true,
      runtimeChunk: true,
      sourceMap: true,
      optimization: false,
      outputHashing: 'none',
    }),
    new RunScriptWebpackPlugin({ 
      name: 'main.js',
      autoRestart: true,
    }),
  ],
};

