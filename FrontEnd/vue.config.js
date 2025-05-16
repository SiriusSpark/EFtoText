const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: 'dist',
  publicPath: '/',
  productionSourceMap: false,
  devServer: {
    port: 3000,
    host: 'localhost',
    https: false,
    proxy: {
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      },
      extensions: ['.js', '.vue', '.json']
    },
    plugins: [
      new webpack.DefinePlugin({
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
      })
    ],
    optimization: {
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 250000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        automaticNameDelimiter: '~',
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10
          },
          elementPlus: {
            name: 'chunk-elementPlus',
            test: /[\\/]node_modules[\\/]element-plus/,
            priority: 20
          },
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          }
        }
      },
      runtimeChunk: 'single'
    }
  },
  pages: {
    index: {
      entry: 'src/main.js',
      template: 'public/index.html',
      filename: 'index.html',
      title: '基于事件图的文本生成系统'
    }
  },
  chainWebpack: config => {
    // 优化JS
    config.optimization.minimizer('terser').tap(args => {
      const compressOptions = args[0].terserOptions.compress;
      // 关闭terser的警告
      compressOptions.warnings = false;
      // 关闭drop console
      compressOptions.drop_console = false;
      // 关闭注释
      args[0].terserOptions.output = {
        ...args[0].terserOptions.output,
        comments: false
      };
      return args;
    });

    // 移除预取和预加载，解决路由动态加载问题
    config.plugins.delete('prefetch');
    config.plugins.delete('preload');

    // 设置保持chunk的最大大小
    config.performance.hints(false);
  }
})