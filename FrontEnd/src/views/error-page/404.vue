<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>找不到页面</h2>
      <div class="desc">抱歉，您访问的页面不存在</div>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  background-color: #f0f2f5;
}

.not-found-content {
  text-align: center;
}

h1 {
  font-size: 120px;
  margin: 0;
  color: #409EFF;
}

h2 {
  font-size: 30px;
  margin: 20px 0;
  color: #333;
}

.desc {
  font-size: 16px;
  margin-bottom: 30px;
  color: #666;
}
</style> 