const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // 开发服务器配置
  devServer: {
    port: 8080,
    open: true,
    proxy: {
      // 代理API请求到后端服务器
      '/api': {
        target: 'http://localhost:5000', // 替换为你的后端API地址
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  },
  // 配置webpack
  configureWebpack: {
    // 设置性能提示
    performance: {
      hints: 'warning',
      maxEntrypointSize: 50000000,
      maxAssetSize: 30000000,
      assetFilter: function(assetFilename) {
        return assetFilename.endsWith('.js');
      }
    }
  }
})
