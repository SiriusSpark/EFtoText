<template>
  <div class="text-generation-list-container">
    <div class="table-header">
      <h2>全部记录</h2>
      <div class="right-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索文本内容"
          prefix-icon="Search"
          clearable
          @input="handleSearch"
          class="search-input"
        />
        <el-button type="success" @click="handleExportAll" :loading="exportLoading">全部导出</el-button>
      <el-button type="primary" @click="handleCreate">生成新文本</el-button>
      </div>
    </div>
    
    <div v-loading="loading" class="records-container">
      <el-empty v-if="filteredTextList.length === 0" description="暂无生成记录" />
      
      <div v-else class="card-container">
        <el-card v-for="record in filteredTextList" :key="record.id" class="text-card">
          <div class="card-header">
            <h3>{{ getEventGraphTitle(record) }}</h3>
            <div class="meta-info">
              <div class="style-info">
                <el-tag type="success" v-if="record.style">{{ record.style.name }}</el-tag>
                <el-tag v-else>风格ID: {{ record.styleId }}</el-tag>
              </div>
              <span class="time">创建时间: {{ record.createdAt }}</span>
            </div>
          </div>
          <div class="card-content">
            <div class="text-content">
              {{ record.content }}
            </div>
          </div>
          <div class="card-footer">
            <el-button type="primary" link @click="handleView(record.id)">查看详情</el-button>
            <el-popconfirm title="确定删除此记录?" @confirm="handleDelete(record.id)">
            <template #reference>
                <el-button type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAllGeneratedTexts, deleteGeneratedText, exportAllUserTexts } from '@/api/generatedText'
import { getEventGraphDetail } from '@/api/eventGraph'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const exportLoading = ref(false)
const textList = ref([])
const searchKeyword = ref('')
const eventGraphs = ref({}) // 缓存事件图信息

// 根据搜索关键词过滤文本列表
const filteredTextList = computed(() => {
  if (!searchKeyword.value) {
    return textList.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return textList.value.filter(item => {
    // 搜索内容
    const contentMatch = item.content && item.content.toLowerCase().includes(keyword)
    // 搜索风格名称
    const styleMatch = item.style && item.style.name && item.style.name.toLowerCase().includes(keyword)
    // 搜索ID
    const idMatch = item.id && item.id.toString().includes(keyword)
    // 搜索事件图标题
    const eventGraphTitle = eventGraphs.value[item.eventGraphId]?.title || ''
    const eventGraphMatch = eventGraphTitle.toLowerCase().includes(keyword)
    
    return contentMatch || styleMatch || idMatch || eventGraphMatch
  })
})

// 获取事件图标题
const getEventGraphTitle = (record) => {
  if (!record.eventGraphId) return `文本ID: ${record.id}`
  
  const cachedGraph = eventGraphs.value[record.eventGraphId]
  if (cachedGraph && cachedGraph.title) {
    return cachedGraph.title
  }
  
  return `事件图ID: ${record.eventGraphId}`
}

// 处理搜索
const handleSearch = () => {
  // 搜索关键词变化时会自动通过计算属性更新filteredTextList
  console.log('搜索关键词:', searchKeyword.value)
}

// 获取事件图详情
const fetchEventGraphDetail = async (graphId) => {
  try {
    // 如果已经缓存了该事件图，则不重复获取
    if (eventGraphs.value[graphId]) return
    
    const response = await getEventGraphDetail(graphId)
    if (response && response.success && response.data) {
      eventGraphs.value[graphId] = response.data
    }
  } catch (error) {
    console.error(`获取事件图详情失败，ID: ${graphId}`, error)
  }
}

// 获取全部生成文本记录
const fetchTextList = async () => {
  loading.value = true
  try {
    // 调用新的API获取所有记录
    const response = await getAllGeneratedTexts()
    
    console.log('获取到的生成记录:', response)
    
    // 直接处理API返回的数组
    if (Array.isArray(response)) {
      textList.value = response
    } else if (response && response.success && Array.isArray(response.data)) {
      // 兼容处理封装在data属性中的情况
      textList.value = response.data
    } else {
      textList.value = []
      // 显示错误信息
      if (response && (response.message || response.error)) {
        ElMessage.error(response.message || response.error)
      }
    }
    
    // 如果仍然没有数据，检查是否为空
    if (textList.value.length === 0) {
      console.log('没有找到生成记录')
    } else {
      // 获取所有相关的事件图信息
      const eventGraphIds = [...new Set(textList.value.filter(t => t.eventGraphId).map(t => t.eventGraphId))]
      
      for (const graphId of eventGraphIds) {
        await fetchEventGraphDetail(graphId)
      }
    }
  } catch (error) {
    console.error('获取生成记录失败:', error)
    ElMessage.error('获取生成记录失败')
    textList.value = []
  } finally {
    loading.value = false
  }
}

// 导出所有文本
const handleExportAll = async () => {
  if (textList.value.length === 0) {
    ElMessage.warning('暂无文本可导出')
    return
  }
  
  exportLoading.value = true
  try {
    const response = await exportAllUserTexts()
    
    // 创建Blob对象
    const blob = new Blob([response], { type: 'application/zip' })
    
    // 创建临时下载链接
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    
    // 设置文件名
    const date = new Date().toISOString().slice(0, 10)
    const fileName = `全部文本_${date}.zip`
    link.download = fileName
    
    // 模拟点击下载
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出文本失败:', error)
    ElMessage.error('导出文本失败，请稍后重试')
  } finally {
    exportLoading.value = false
  }
}

// 创建生成文本
const handleCreate = () => {
  router.push('/text-generation/create')
}

// 查看生成文本详情
const handleView = (id) => {
  router.push(`/text-generation/detail/${id}`)
}

// 删除生成文本
const handleDelete = async (id) => {
  try {
    const response = await deleteGeneratedText(id)
    
    // 支持多种API响应格式
    if (response && (response.success || response.id || response.status === 200)) {
      ElMessage.success('删除成功')
      // 重新获取列表数据
      await fetchTextList()
    } else {
      ElMessage.error(response?.message || response?.error || '删除失败')
    }
  } catch (error) {
    console.error('删除生成文本失败:', error)
    ElMessage.error('删除生成文本失败')
  }
}

onMounted(() => {
  fetchTextList()
})
</script>

<style scoped>
.text-generation-list-container {
  padding: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header h2 {
  font-size: 24px;
  margin: 0;
  color: #1890FF;
  font-weight: 600;
  position: relative;
}

.table-header h2:after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #1890FF 0%, #69B7FF 100%);
  border-radius: 3px;
}

.right-section {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-input {
  width: 250px;
}

.records-container {
  margin-top: 15px;
}

.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.text-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 21, 41, 0.08) !important;
  transition: all 0.3s ease;
  border: none !important;
  overflow: hidden;
  border-top: 3px solid #1890FF !important;
  background-color: rgba(225, 232, 238, 0.7) !important;
}

.text-card:hover {
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.2) !important;
  transform: translateY(-2px);
  background-color: rgba(230, 235, 240, 0.8) !important;
}

.card-header {
  margin-bottom: 10px;
}

.card-header h3 {
  font-size: 16px;
  color: #1890FF;
  margin: 0 0 8px 0;
}

.meta-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #909399;
  font-size: 12px;
}

.card-content {
  max-height: 150px;
  overflow: hidden;
  position: relative;
}

.text-content {
  line-height: 1.6;
  color: #606266;
}

.text-content::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  background: linear-gradient(to bottom, rgba(225, 232, 238, 0) 0%, rgba(225, 232, 238, 0.7) 100%);
}

.card-footer {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
    gap: 10px;
}
</style> 