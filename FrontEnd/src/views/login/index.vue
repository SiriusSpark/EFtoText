<template>
  <div class="login-container">
    <el-form 
      ref="loginFormRef" 
      :model="loginForm" 
      :rules="loginRules" 
      class="login-form" 
      auto-complete="on"
      label-position="left"
    >
      <div class="title-container">
        <h3 class="title">文本生成系统</h3>
      </div>

      <el-form-item prop="username">
        <el-input
          v-model="loginForm.username"
          placeholder="用户名"
          type="text"
          tabindex="1"
          auto-complete="on"
        >
          <template #prefix>
            <el-icon class="el-input__icon"><user /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          :type="passwordVisible ? 'text' : 'password'"
          placeholder="密码"
          tabindex="2"
          auto-complete="on"
          @keyup.enter="handleLogin"
        >
          <template #prefix>
            <el-icon class="el-input__icon"><lock /></el-icon>
          </template>
          <template #suffix>
            <el-icon
              class="el-input__icon"
              @click="passwordVisible = !passwordVisible"
            >
              <view v-if="passwordVisible" />
              <hide v-else />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-button 
        :loading="loading" 
        type="primary" 
        style="width: 100%; margin-bottom: 30px;" 
        @click="handleLogin"
      >
        登录
      </el-button>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock, View, Hide } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const loginFormRef = ref(null)
const loading = ref(false)
const passwordVisible = ref(false)
const store = useStore()
const router = useRouter()
const route = useRoute()

const loginForm = reactive({
  username: 'admin',
  password: '123456'
})

const loginRules = {
  username: [{ required: true, trigger: 'blur', message: '请输入用户名' }],
  password: [{ required: true, trigger: 'blur', message: '请输入密码' }]
}

const handleLogin = () => {
  loginFormRef.value.validate(async valid => {
    if (valid) {
      loading.value = true
      try {
        await store.dispatch('login', loginForm)
        
        // 登录成功后根据重定向查询参数或默认路由进行导航
        const redirect = route.query.redirect || '/'
        router.replace(redirect)
        
        ElMessage({
          message: '登录成功',
          type: 'success'
        })
      } catch (error) {
        ElMessage.error(error.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100%;
  background-color: #2d3a4b;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-form {
  position: relative;
  width: 520px;
  max-width: 100%;
  padding: 160px 35px 0;
  margin: 0 auto;
  overflow: hidden;
}

.title-container {
  position: relative;
  margin-bottom: 40px;
}

.title {
  font-size: 26px;
  color: #eee;
  margin: 0 auto 40px;
  text-align: center;
  font-weight: bold;
}

.el-form-item {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  color: #454545;
  margin-bottom: 30px;
}

:deep(.el-input__inner) {
  background: transparent;
  color: #fff;
  height: 46px;
}

:deep(.el-input__icon) {
  color: #889aa4;
}
</style> 