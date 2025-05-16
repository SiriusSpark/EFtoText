import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import store from './store'
import router from './router'
import request from '@/utils/request'

// 忽略 ResizeObserver 错误警告
const originalConsoleError = console.error;
console.error = function(message, ...args) {
  if (message && typeof message === 'string' && 
      message.includes('ResizeObserver loop completed with undelivered notifications')) {
    return; // 忽略 ResizeObserver 相关错误
  }
  return originalConsoleError.apply(console, [message, ...args]);
};

const app = createApp(App)

// 全局挂载axios实例
app.config.globalProperties.$http = request

// 使用插件
app.use(ElementPlus, {
  locale: zhCn,
})
app.use(store)
app.use(router)

app.mount('#app') 