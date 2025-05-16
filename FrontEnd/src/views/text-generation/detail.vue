<template>
  <div class="text-generation-detail-container">
    <div class="page-header">
      <h2>{{ text.title }}</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleEdit" v-if="text.content">编辑</el-button>
        <el-button @click="goBack">返回列表</el-button>
      </div>
    </div>
    
    <el-card v-loading="loading" class="info-card">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
          <el-tag :type="getStatusType(text.status)">{{ text.status }}</el-tag>
        </div>
      </template>
      <div class="info-content">
        <div class="info-item">
          <span class="info-label">事件图：</span>
          <span>{{ eventGraphInfo }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">文本风格：</span>
          <span>{{ styleInfo }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">生成模型：</span>
          <span>{{ text.modelName }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">创建时间：</span>
          <span>{{ text.createdAt }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">完成时间：</span>
          <span>{{ text.updatedAt || '-' }}</span>
        </div>
        <div class="info-item full-width" v-if="text.additionalInstructions">
          <span class="info-label">额外指令：</span>
          <div class="instruction-content">{{ text.additionalInstructions }}</div>
        </div>
      </div>
    </el-card>
    
    <el-card v-if="text.status === '处理中'" class="progress-card">
      <template #header>
        <div class="card-header">
          <span>生成进度</span>
        </div>
      </template>
      <div class="progress-content">
        <el-progress :percentage="progress" :format="progressFormat" />
        <p class="progress-message">{{ progressMessage }}</p>
      </div>
    </el-card>
    
    <el-card v-if="text.content" class="content-card">
      <template #header>
        <div class="card-header">
          <span>生成内容</span>
          <div>
            <el-button type="primary" size="small" @click="handleCopy">复制全文</el-button>
            <el-button type="success" size="small" @click="handleDownload">下载文档</el-button>
          </div>
        </div>
      </template>
      <div class="generated-content">
        <div v-html="formattedContent"></div>
      </div>
    </el-card>
    
    <el-card v-if="text.status === '失败'" class="error-card">
      <template #header>
        <div class="card-header">
          <span>错误信息</span>
        </div>
      </template>
      <div class="error-content">
        <p>{{ text.errorMessage || '生成过程中发生未知错误，请稍后重试。' }}</p>
        <el-button type="primary" @click="handleRetry">重新生成</el-button>
      </div>
    </el-card>
    
    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑文本内容"
      width="70%"
    >
      <el-form :model="editForm">
        <el-form-item>
          <el-input
            v-model="editForm.content"
            type="textarea"
            :rows="15"
            placeholder="请输入文本内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getGeneratedTextDetail, getGeneratedTextStatus, updateGeneratedText } from '@/api/generatedText'
import { getEventGraphDetail } from '@/api/eventGraph'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const text = ref({
  id: '',
  eventGraphId: '',
  styleId: '',
  content: '',
  createdAt: '',
  updatedAt: '',
  style: null,
  status: '已完成', // 默认为已完成状态，除非有特殊标记
  errorMessage: ''
})
const progress = ref(0)
const progressMessage = ref('正在准备生成...')
let statusInterval = null

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case '已完成':
      return 'success'
    case '处理中':
      return 'warning'
    case '失败':
      return 'danger'
    default:
      return 'info'
  }
}

// 进度格式化
const progressFormat = (percentage) => {
  return percentage === 100 ? '完成' : `${percentage}%`
}

// 格式化内容（将换行符转换为HTML）
const formattedContent = computed(() => {
  if (!text.value.content) return ''
  return text.value.content
    .replace(/\n/g, '<br>')
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
})

// 事件图信息
const eventGraphInfo = computed(() => {
  if (!text.value.eventGraphId) return '未关联事件图'
  return `ID: ${text.value.eventGraphId}`
})

// 风格信息
const styleInfo = computed(() => {
  if (text.value.style && text.value.style.name) {
    return text.value.style.name
  }
  return text.value.styleId ? `风格ID: ${text.value.styleId}` : '未设置风格'
})

// 获取文本详情
const fetchTextDetail = async () => {
  const id = route.params.id
  if (!id) return
  
  loading.value = true
  try {
    // 调用API获取生成文本详情
    const response = await getGeneratedTextDetail(id)
    console.log('生成文本详情响应:', response)
    
    if (response) {
      // 无论是否包装在data中，都直接使用API返回的数据
      const data = response.data || response
      
      // 更新文本信息
      text.value = {
        ...text.value,
        ...data,
        // 映射标题字段(API中可能没有title字段)
        title: data.title || `文本ID: ${data.id}`,
        // 保留现有字段名和默认值
        status: data.status || '已完成'
      }
      
      console.log('解析后的文本信息:', text.value)
    } else {
      ElMessage.error('获取生成文本详情失败')
    }
    
    // 如果状态是处理中，则启动轮询
    if (text.value.status === '处理中') {
      startPolling()
    }
  } catch (error) {
    console.error('获取生成文本详情失败:', error)
    ElMessage.error('获取生成文本详情失败')
  } finally {
    loading.value = false
  }
}

// 开始轮询状态
const startPolling = () => {
  // 清除可能存在的旧定时器
  if (statusInterval) clearInterval(statusInterval)
  
  progress.value = 10
  progressMessage.value = '正在分析事件图...'
  
  // 设置轮询检查生成状态
  statusInterval = setInterval(async () => {
    try {
      const response = await getGeneratedTextStatus(text.value.id)
      
      if (response && (response.success || response.status)) {
        const statusData = response.data || response
        
        // 更新进度和消息
        if (statusData.progress) {
          progress.value = statusData.progress
        }
        
        if (statusData.message) {
          progressMessage.value = statusData.message
        }
        
        // 检查是否完成
        if (statusData.status === '已完成' || progress.value >= 100) {
          clearInterval(statusInterval)
          progress.value = 100
          progressMessage.value = '生成完成，准备显示结果...'
          
          // 重新获取完整的生成文本数据
          await fetchTextDetail()
        } else if (statusData.status === '失败') {
          // 生成失败
          clearInterval(statusInterval)
          text.value.status = '失败'
          text.value.errorMessage = statusData.errorMessage || '生成过程中发生错误'
        }
      }
    } catch (error) {
      console.error('获取生成状态失败:', error)
      // 发生错误时不立即停止轮询，允许下一次尝试
    }
  }, 3000) // 每3秒检查一次状态
}

// 复制全文
const handleCopy = () => {
  if (!text.value.content) return
  
  // 使用clipboard API复制文本
  navigator.clipboard.writeText(text.value.content)
    .then(() => {
      ElMessage.success('已复制到剪贴板')
    })
    .catch(err => {
      console.error('复制失败:', err)
      ElMessage.error('复制失败')
    })
}

// 下载文档
const handleDownload = () => {
  if (!text.value.content) return
  
  // 创建Blob对象
  const blob = new Blob([text.value.content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  
  // 创建临时下载链接
  const link = document.createElement('a')
  link.href = url
  link.download = `${text.value.title}.txt`
  link.click()
  
  // 清理
  URL.revokeObjectURL(url)
  ElMessage.success('文档下载中')
}

// 重新生成
const handleRetry = () => {
  ElMessage.success('已重新提交生成任务')
  text.value.status = '处理中'
  startPolling()
}

// 返回列表
const goBack = () => {
  const { from, graphId } = route.query
  
  if (from === 'records' && graphId) {
    // 如果是从事件图生成记录页面来的
    router.push(`/text-generation/records/${graphId}`)
  } else {
    // 否则返回到文本生成列表
    router.push('/text-generation/list')
  }
}

// 编辑相关状态
const editDialogVisible = ref(false)
const submitLoading = ref(false)
const editForm = ref({
  content: ''
})

// 处理编辑按钮点击
const handleEdit = () => {
  editForm.value.content = text.value.content || ''
  editDialogVisible.value = true
}

// 提交编辑
const submitEdit = async () => {
  if (!editForm.value.content.trim()) {
    ElMessage.warning('文本内容不能为空')
    return
  }
  
  submitLoading.value = true
  try {
    const response = await updateGeneratedText(text.value.id, {
      content: editForm.value.content
    })
    
    console.log('更新文本响应:', response)
    
    if (response && (response.success || response.id)) {
      ElMessage.success('文本更新成功')
      
      // 更新本地文本内容
      text.value.content = editForm.value.content
      
      // 如果API返回了更新时间，更新本地的更新时间
      if (response.updatedAt) {
        text.value.updatedAt = response.updatedAt
      }
      
      editDialogVisible.value = false
    } else {
      ElMessage.error(response?.message || response?.error || '更新文本失败')
    }
  } catch (error) {
    console.error('更新文本失败:', error)
    ElMessage.error('更新文本失败')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchTextDetail()
})

onUnmounted(() => {
  // 组件卸载时清除定时器
  if (statusInterval) clearInterval(statusInterval)
})
</script>

<style scoped>
.text-generation-detail-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-card, .progress-card, .content-card, .error-card {
  margin-bottom: 20px;
}

.info-content {
  display: flex;
  flex-wrap: wrap;
}

.info-item {
  width: 50%;
  margin-bottom: 15px;
}

.info-item.full-width {
  width: 100%;
}

.info-label {
  font-weight: bold;
  margin-right: 10px;
}

.instruction-content {
  white-space: pre-line;
  margin-top: 8px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.progress-content {
  padding: 20px 0;
}

.progress-message {
  text-align: center;
  margin-top: 10px;
  color: #606266;
}

.generated-content {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  white-space: pre-line;
  font-size: 15px;
  line-height: 1.6;
}

.error-content {
  color: #f56c6c;
  text-align: center;
  padding: 20px 0;
}
</style> 