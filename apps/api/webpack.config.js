const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  target: 'node',
  externals: [], // ✅ include node_modules
  output: {
    path: join(__dirname, '../../dist/apps/api'),
    filename: 'main.js',
  },
  optimization: {
    minimize: false,
    concatenateModules: true,
  },
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
    })
  ],
};
