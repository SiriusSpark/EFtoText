<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
        </div>
      </template>
      
      <div v-loading="loading" class="profile-content">
        <!-- 头像放在第一行并居中，但不显示昵称 -->
        <div class="avatar-section">
          <el-avatar :size="150" :src="avatarUrl"></el-avatar>
        </div>
        
        <div class="info-container">
          <div class="info-item">
            <span class="info-label">用户名：</span>
            <span class="info-value">{{ userInfo.username }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">昵称：</span>
            <span class="info-value">{{ userInfo.nickname || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">邮箱：</span>
            <span class="info-value">{{ userInfo.email || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">注册时间：</span>
            <span class="info-value">{{ userInfo.created_at || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">最近活动：</span>
            <span class="info-value">{{ userInfo.last_active_at || '未知' }}</span>
          </div>
          
          <!-- 编辑按钮放在最后一行 -->
          <div class="edit-button-container">
            <el-button type="primary" @click="showEditDialog">编辑</el-button>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑个人信息"
      width="500px"
    >
      <el-form :model="editForm" label-width="100px" :rules="rules" ref="editFormRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" disabled></el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :http-request="customUpload"
          >
            <img v-if="editForm.avatar_url" :src="formatAvatarUrl(editForm.avatar_url)" class="avatar-preview" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            <div class="upload-tip">点击上传新头像</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getCurrentUser, updateUser, updateAvatar } from '@/api/user'
import { fixImageUrl } from '@/utils/request'

const store = useStore()
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const apiBaseUrl = 'http://localhost:8080' // 添加API基础URL

// 处理头像URL
const formatAvatarUrl = (url) => {
  if (!url) return defaultAvatar
  
  // 使用fixImageUrl辅助函数修复URL
  const fixedUrl = fixImageUrl(url)
  
  if (fixedUrl.startsWith('http')) return fixedUrl
  return `${apiBaseUrl}${fixedUrl}`
}

// 用户信息
const userInfo = ref({
  id: null,
  username: '',
  nickname: '',
  email: '',
  avatar_url: '',
  created_at: '',
  last_active_at: ''
})

// 计算后的头像URL
const avatarUrl = computed(() => formatAvatarUrl(userInfo.value.avatar_url))

// 加载状态
const loading = ref(true)
const submitting = ref(false)

// 编辑表单
const dialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  username: '',
  nickname: '',
  email: '',
  avatar_url: ''
})

// 表单校验规则
const rules = {
  nickname: [
    { max: 50, message: '昵称长度不能超过50个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 获取用户信息
const fetchUserInfo = async () => {
  loading.value = true
  try {
    const response = await getCurrentUser()
    if (response.success && response.data) {
      userInfo.value = response.data
    } else {
      ElMessage.error('获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

// 显示编辑对话框
const showEditDialog = () => {
  // 初始化编辑表单
  Object.assign(editForm, {
    username: userInfo.value.username,
    nickname: userInfo.value.nickname,
    email: userInfo.value.email,
    avatar_url: userInfo.value.avatar_url
  })
  dialogVisible.value = true
}

// 头像上传前的校验
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('头像只能是JPG或PNG格式!')
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过2MB!')
  }
  return isJPG && isLt2M
}

// 自定义头像上传处理函数
const customUpload = async (options) => {
  const { file } = options
  try {
    const response = await updateAvatar(userInfo.value.id, file)
    console.log('头像上传API响应:', response)
    
    if (response && typeof response === 'object') {
      // 尝试所有可能的响应格式
      if (response.success && response.data && response.data.avatar_url) {
        // 标准API响应格式: {success: true, data: {avatar_url: '...'}}
        editForm.avatar_url = response.data.avatar_url
        ElMessage.success('头像上传成功')
      } else if (response.data && response.data.avatar_url) {
        // 格式: {data: {avatar_url: '...'}}
        editForm.avatar_url = response.data.avatar_url
        ElMessage.success('头像上传成功')
      } else if (response.avatar_url) {
        // 格式: {avatar_url: '...'}
        editForm.avatar_url = response.avatar_url
        ElMessage.success('头像上传成功')
      } else {
        console.error('无法从响应中提取头像URL:', response)
        ElMessage.error('头像上传失败: 无法解析响应数据')
      }
    } else {
      console.error('无效的响应格式:', response)
      ElMessage.error('头像上传失败: 无效的响应格式')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    ElMessage.error(error.response?.data?.message || '头像上传失败')
  }
}

// 提交表单
const submitForm = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 使用updateUser API进行用户信息更新
        const response = await updateUser(userInfo.value.id, {
          nickname: editForm.nickname,
          email: editForm.email,
          avatar_url: editForm.avatar_url
        })
        
        if (response.success) {
          ElMessage.success('保存成功')
          dialogVisible.value = false
          fetchUserInfo() // 重新获取用户信息
          
          // 更新Vuex中的用户信息
          store.commit('SET_USER', {
            ...store.state.user,
            nickname: editForm.nickname,
            email: editForm.email,
            avatar_url: editForm.avatar_url
          })
        } else {
          ElMessage.error(response.message || '保存失败')
        }
      } catch (error) {
        console.error('保存用户信息失败:', error)
        ElMessage.error('保存失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  max-width: 600px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
}

.profile-content {
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  align-items: center;
}

/* 头像部分样式 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.info-container {
  width: 80%;
  max-width: 450px;
}

.info-item {
  margin-bottom: 15px;
  line-height: 24px;
  display: flex;
}

.info-label {
  font-weight: bold;
  color: #606266;
  margin-right: 10px;
  width: 100px;
  display: inline-block;
  text-align: right;
}

.info-value {
  color: #303133;
  flex: 1;
}

/* 编辑按钮容器 */
.edit-button-container {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

.avatar-uploader {
  width: 100px;
  height: 100px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.avatar-uploader:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 40px;
  height: 40px;
  text-align: center;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  display: block;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}
</style> 