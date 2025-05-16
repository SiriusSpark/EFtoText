<template>
  <div class="register-container">
    <el-form ref="registerForm" :model="registerForm" :rules="registerRules" class="register-form">
      <h3 class="title">用户注册</h3>
      <el-form-item prop="username">
        <el-input v-model="registerForm.username" type="text" placeholder="用户名">
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item prop="nickname">
        <el-input v-model="registerForm.nickname" type="text" placeholder="昵称">
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input v-model="registerForm.password" type="password" placeholder="密码">
          <template #prefix>
            <el-icon><Lock /></el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item prop="email">
        <el-input v-model="registerForm.email" type="email" placeholder="邮箱">
          <template #prefix>
            <el-icon><Message /></el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button :loading="loading" type="primary" style="width:100%;" @click.prevent="handleRegister">
          注册
        </el-button>
      </el-form-item>
      <div class="tips">
        <span>已有账号？</span>
        <router-link to="/login">立即登录</router-link>
      </div>
    </el-form>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/user'
import { ElMessage } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'

export default {
  name: 'Register',
  components: {
    User,
    Lock,
    Message
  },
  setup() {
    const router = useRouter()
    const registerForm = reactive({
      username: '',
      nickname: '',
      password: '',
      email: ''
    })
    const loading = ref(false)

    const registerRules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      nickname: [
        { required: true, message: '请输入昵称', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ]
    }

    const handleRegister = async () => {
      try {
        loading.value = true
        await register(registerForm)
        ElMessage.success('注册成功')
        router.push('/login')
      } catch (error) {
        console.error('注册失败:', error)
      } finally {
        loading.value = false
      }
    }

    return {
      registerForm,
      registerRules,
      loading,
      handleRegister
    }
  }
}
</script>

<style lang="scss" scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f3f3;

  .register-form {
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