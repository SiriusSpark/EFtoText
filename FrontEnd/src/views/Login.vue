<template>
  <div class="login-container">
    <el-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="loginRules"
      class="login-form"
    >
      <h3 class="title">用户登录</h3>
      <el-form-item prop="username">
        <el-input v-model="loginForm.username" type="text" placeholder="用户名">
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input v-model="loginForm.password" type="password" placeholder="密码">
          <template #prefix>
            <el-icon><Lock /></el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button :loading="loading" type="primary" style="width:100%;" @click.prevent="handleLogin">
          登录
        </el-button>
      </el-form-item>
      <div class="tips">
        <span>还没有账号？</span>
        <router-link to="/register">立即注册</router-link>
      </div>
    </el-form>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

export default {
  name: 'Login',
  components: {
    User,
    Lock
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const store = useStore()
    const loginFormRef = ref(null)
    const loginForm = reactive({
      username: '',
      password: ''
    })
    const loading = ref(false)

    const loginRules = {
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
    }

    const handleLogin = async () => {
      try {
        loading.value = true
        // 先进行表单验证
        await loginFormRef.value.validate()
        // 调用登录接口
        const response = await store.dispatch('login', loginForm)
        ElMessage.success('登录成功')
        // 获取重定向地址或默认跳转到首页
        const redirect = route.query.redirect || '/'
        router.push(redirect)
      } catch (error) {
        console.error('登录失败:', error)
        ElMessage.error(error.message || '登录失败，请检查用户名和密码')
      } finally {
        loading.value = false
      }
    }

    return {
      loginForm,
      loginFormRef,
      loginRules,
      loading,
      handleLogin
    }
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f3f3;

  .login-form {
    width: 400px;
    padding: 40px;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .title {
      text-align: center;
      margin-bottom: 30px;
      font-size: 24px;
      color: #333;
    }

    .tips {
      margin-top: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;

      a {
        color: #409EFF;
        text-decoration: none;
        margin-left: 8px;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}
</style> 