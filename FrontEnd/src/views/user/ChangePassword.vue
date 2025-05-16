<template>
  <div class="change-password-container">
    <el-card class="password-card">
      <template #header>
        <div class="card-header">
          <span>修改密码</span>
        </div>
      </template>
      
      <div class="password-content">
        <el-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="rules"
          label-width="120px"
          class="password-form"
        >
          <el-form-item label="当前密码" prop="oldPassword">
            <el-input
              v-model="passwordForm.oldPassword"
              type="password"
              placeholder="请输入当前密码"
              show-password
              clearable
            />
          </el-form-item>
          
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="请输入新密码"
              show-password
              clearable
            />
          </el-form-item>
          
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              show-password
              clearable
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              @click="submitForm"
            >
              确认修改
            </el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'
import { updatePassword } from '@/api/user'

const store = useStore()
const loading = ref(false)
const passwordFormRef = ref(null)

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码表单校验规则
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 提交表单
const submitForm = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const userId = store.state.user.id
        const response = await updatePassword(userId, {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
        
        if (response.success) {
          ElMessage.success('密码修改成功')
          resetForm()
        } else {
          ElMessage.error(response.message || response.error || '密码修改失败')
        }
      } catch (error) {
        console.error('密码修改失败:', error)
        ElMessage.error(error.response?.data?.error || '密码修改失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields()
  }
}
</script>

<style scoped>
.change-password-container {
  padding: 20px;
}

.password-card {
  max-width: 600px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
}

.password-content {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.password-form {
  width: 90%;
  max-width: 500px;
}

.el-button {
  min-width: 100px;
}
</style> 