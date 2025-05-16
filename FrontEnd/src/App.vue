<template>
  <router-view />
</template>

<script>
import { onMounted } from 'vue'
import { useStore } from 'vuex'
import { getToken } from '@/utils/auth'

export default {
  setup() {
    const store = useStore()
    
    onMounted(() => {
      // 如果已登录，获取用户信息
      if (getToken()) {
        store.dispatch('getUserInfo').catch(err => {
          console.error('Failed to get user info on app mount:', err)
        })
      }
    })
  }
}
</script>

<style>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  background: linear-gradient(180deg, rgba(160, 185, 210, 0.9) 0%, rgba(195, 210, 225, 0.85) 50%, rgba(225, 228, 230, 0.8) 100%);
  background-attachment: fixed; /* 确保背景固定，不随滚动变化 */
}

#app {
  height: 100%;
}

* {
  box-sizing: border-box;
}

/* 全局卡片样式增强 */
.el-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 21, 41, 0.08) !important;
  transition: all 0.3s ease;
  border: none !important;
  overflow: hidden;
  border-top: 3px solid #1890FF !important;
  background-color: rgba(225, 232, 238, 0.7) !important;
}

.el-card:hover {
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.2) !important;
  transform: translateY(-2px);
  background-color: rgba(230, 235, 240, 0.8) !important;
}

/* 按钮样式增强 */
.el-button {
  border-radius: 4px;
  transition: all 0.3s ease;
}

.el-button--primary {
  background: linear-gradient(90deg, #1890FF 0%, #69B7FF 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.el-button--primary:hover {
  background: linear-gradient(90deg, #40A9FF 0%, #69B7FF 100%);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  transform: translateY(-1px);
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

::-webkit-scrollbar-track {
  background: rgba(235, 237, 240, 0.6);
}

/* 全局过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 添加一些主页元素的样式增强 */
.section-title {
  font-size: 24px;
  color: #1890FF;
  font-weight: 600;
  margin-bottom: 20px;
  position: relative;
}

.section-title:after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #1890FF 0%, #4DABFF 100%);
  border-radius: 3px;
}
</style> 