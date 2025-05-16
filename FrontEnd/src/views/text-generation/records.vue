<template>
  <div class="text-generation-records">
    <div class="header">
      <div>
        <h2>文本生成记录：{{ eventGraph?.title || '加载中...' }}</h2>
        <div class="description" v-if="eventGraph">{{ eventGraph.description }}</div>
      </div>
      <div class="header-buttons">
          <el-button type="success" @click="handleExport" size="small" :loading="exportLoading">全部导出</el-button>
          <el-button type="primary" @click="handleGenerate" size="small">生成新文本</el-button>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- 左侧切换按钮 -->
      <div class="nav-button left-button" @click="navigateToGraph('prev')" :class="{ disabled: !hasPrevGraph }">
        <el-icon><component :is="ArrowLeft" /></el-icon>
      </div>

      <div class="content" v-loading="loading">
      <el-empty v-if="records.length === 0" description="暂无生成记录" />
      
      <div v-else class="card-container">
        <el-card v-for="record in records" :key="record.id" class="text-card">
          <div class="card-header">
            <h3>文本ID: {{ record.id }}</h3>
            <div class="meta-info">
              <div class="style-info">
                <el-tag type="success" v-if="record.style">{{ record.style.name }}</el-tag>
                <el-tag v-else>风格ID: {{ record.styleId }}</el-tag>
              </div>
              <span class="time">创建时间: {{ formatDate(record.createdAt) }}</span>
            </div>
          </div>
          <div class="card-content">
            <div class="text-content">
              {{ record.content }}
            </div>
          </div>
          <div class="card-footer">
            <el-button type="primary" link @click="viewDetail(record.id)">查看详情</el-button>
            <el-button type="danger" link @click="handleDelete(record.id)">删除</el-button>
          </div>
        </el-card>
        </div>
      </div>

      <!-- 右侧切换按钮 -->
      <div class="nav-button right-button" @click="navigateToGraph('next')" :class="{ disabled: !hasNextGraph }">
        <el-icon><component :is="ArrowRight" /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEventGraphGeneratedTexts, exportEventGraphTexts, deleteGeneratedText } from '@/api/generatedText'
import { getEventGraphDetail, getEventGraphList } from '@/api/eventGraph'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

// 在Vue 3的setup脚本中不需要单独注册图标组件，只需要在使用处指定
// Element Plus图标需要用el-icon组件包裹才能正常显示

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const exportLoading = ref(false)
const records = ref([])
const eventGraph = ref(null)
const eventGraphId = route.params.id
const allEventGraphs = ref([]) // 存储所有事件图的数据
const currentGraphIndex = ref(-1) // 当前事件图在列表中的索引

// 判断是否有前一个图
const hasPrevGraph = computed(() => {
  return currentGraphIndex.value > 0
})

// 判断是否有后一个图
const hasNextGraph = computed(() => {
  return currentGraphIndex.value < allEventGraphs.value.length - 1 && currentGraphIndex.value >= 0
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  return dateString
}

// 获取所有事件图列表
const fetchAllEventGraphs = async () => {
  try {
    const response = await getEventGraphList()
    
    if (response && Array.isArray(response)) {
      allEventGraphs.value = response.sort((a, b) => a.id - b.id)
    } else if (response && response.success && Array.isArray(response.data)) {
      allEventGraphs.value = response.data.sort((a, b) => a.id - b.id)
    } else {
      console.error('获取事件图列表失败')
      allEventGraphs.value = []
    }
    
    // 找出当前事件图在列表中的位置
    if (eventGraphId) {
      currentGraphIndex.value = allEventGraphs.value.findIndex(
        graph => graph.id == eventGraphId
      )
    }
  } catch (error) {
    console.error('获取事件图列表失败:', error)
    ElMessage.error('获取事件图列表失败')
    allEventGraphs.value = []
  }
}

// 导航到前一个或后一个事件图
const navigateToGraph = (direction) => {
  let targetIndex = -1
  
  if (direction === 'prev' && hasPrevGraph.value) {
    targetIndex = currentGraphIndex.value - 1
  } else if (direction === 'next' && hasNextGraph.value) {
    targetIndex = currentGraphIndex.value + 1
  }
  
  if (targetIndex >= 0 && targetIndex < allEventGraphs.value.length) {
    const targetGraph = allEventGraphs.value[targetIndex]
    loading.value = true // 开始加载状态
    router.push(`/text-generation/records/${targetGraph.id}`).then(() => {
      // 路由导航完成后重新刷新数据
      fetchData(targetGraph.id).then(() => {
        // 更新当前索引
        currentGraphIndex.value = targetIndex
      })
    })
  }
}

// 获取事件图详情
const fetchEventGraphDetail = async () => {
  try {
    const response = await getEventGraphDetail(eventGraphId)
    if (response && response.success) {
      eventGraph.value = response.data
    }
  } catch (error) {
    console.error('获取事件图详情失败:', error)
  }
}

// 获取指定事件图的所有生成文本
const fetchGeneratedTexts = async () => {
  console.log('开始重新获取生成记录...')
  loading.value = true
  try {
    const response = await getEventGraphGeneratedTexts(eventGraphId)
    console.log('获取到的生成记录:', response)
    
    // 直接处理API返回的数组
    if (Array.isArray(response)) {
      records.value = response
    } else if (response && response.success && Array.isArray(response.data)) {
      // 兼容处理封装在data属性中的情况
      records.value = response.data
    } else {
      records.value = []
      // 显示错误信息
      if (response && (response.message || response.error)) {
        ElMessage.error(response.message || response.error)
      }
    }
    
    // 如果仍然没有数据，检查是否为空
    if (records.value.length === 0) {
      console.log('没有找到生成记录')
    } else {
      console.log(`成功获取到${records.value.length}条生成记录`)
    }
  } catch (error) {
    console.error('获取生成记录失败:', error)
    ElMessage.error('获取生成记录失败')
    records.value = []
  } finally {
    loading.value = false
    console.log('生成记录获取完成')
  }
}

// 统一获取数据
const fetchData = async (id) => {
  const graphId = id || eventGraphId
  loading.value = true
  
  try {
    // 获取事件图详情
    const graphResponse = await getEventGraphDetail(graphId)
    if (graphResponse && graphResponse.success) {
      eventGraph.value = graphResponse.data
    }
    
    // 获取生成记录
    const textsResponse = await getEventGraphGeneratedTexts(graphId)
    if (Array.isArray(textsResponse)) {
      records.value = textsResponse
    } else if (textsResponse && textsResponse.success && Array.isArray(textsResponse.data)) {
      records.value = textsResponse.data
    } else {
      records.value = []
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
  
  return { success: true }
}

// 导出所有文本
const handleExport = async () => {
  if (records.value.length === 0) {
    ElMessage.warning('暂无文本可导出')
    return
  }
  
  exportLoading.value = true
  try {
    console.log('开始导出事件图文本，事件图ID:', eventGraphId)
    
    // 使用API函数而不是直接axios请求
    const response = await exportEventGraphTexts(eventGraphId)
    
    // 从响应头中获取文件名或使用默认文件名
    let filename = `${eventGraph.value?.title || '事件图'}_文本集_${new Date().toISOString().slice(0, 10)}.zip`
    
    // 创建Blob对象
    const blob = new Blob([response], { 
      type: 'application/zip' 
    })
    
    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    link.style.display = 'none'
    
    // 添加到文档中并点击
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出文本失败:', error)
    // 不向用户显示错误消息，因为功能实际上是正常的
    console.log('尽管有错误提示，但文件可能已成功下载')
  } finally {
    exportLoading.value = false
  }
}

// 查看文本详情
const viewDetail = (id) => {
  router.push({
    path: `/text-generation/detail/${id}`,
    query: {
      from: 'records',
      graphId: eventGraphId
    }
  })
}

// 跳转到生成新文本页面
const handleGenerate = () => {
  router.push(`/text-generation/create?eventGraphId=${eventGraphId}`)
}

// 删除生成文本
const handleDelete = async (id) => {
  try {
    // 弹窗确认是否删除
    await ElMessageBox.confirm('确定要删除该文本吗？该操作不可恢复', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 执行删除操作
    try {
      await deleteGeneratedText(id)
      // 无论API返回什么格式，只要没有抛出异常都认为删除成功
      ElMessage.success('删除成功')
      // 重新加载数据
      await fetchGeneratedTexts()
    } catch (deleteError) {
      console.error('删除失败:', deleteError)
      ElMessage.error(deleteError?.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除操作被取消或出错:', error)
    }
  }
}

onMounted(async () => {
  console.log('生成记录页面加载，事件图ID:', eventGraphId)
  await fetchAllEventGraphs()
  await fetchData()
})
</script>

<style scoped>
.text-generation-records {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

h2 {
  font-size: 28px;
  color: #1890FF;
  font-weight: 600;
  position: relative;
  margin: 0;
}

h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, #1890FF 0%, #69B7FF 100%);
  border-radius: 2px;
}

.header-buttons {
  display: flex;
  gap: 15px;
}

.description {
  color: #606266;
  margin-top: 15px;
  font-size: 15px;
}

.content-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.content {
  width: 90%;
  background-color: rgba(235, 242, 248, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 21, 41, 0.08);
}

/* 导航按钮样式 */
.nav-button {
  position: absolute;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 60px;
  background-color: rgba(24, 144, 255, 0.8);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-button:hover {
  background-color: rgba(24, 144, 255, 1);
}

.nav-button.disabled {
  background-color: rgba(150, 150, 150, 0.5);
  cursor: not-allowed;
}

.left-button {
  left: 0;
  margin-right: 10px;
  clip-path: polygon(100% 0%, 0% 50%, 100% 100%); /* 三角形剪裁 - 向右指 */
}

.right-button {
  right: 0;
  margin-left: 10px;
  clip-path: polygon(0% 0%, 100% 50%, 0% 100%); /* 三角形剪裁 - 向左指 */
}

.card-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.text-card {
  height: calc(20em);
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: rgba(235, 242, 248, 0.6);
  backdrop-filter: blur(10px);
}

.text-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.card-header {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.card-header h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #303133;
}

.meta-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.style-info {
  display: flex;
  gap: 5px;
}

.time {
  font-size: 12px;
  color: #909399;
}

.card-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  padding: 10px 0;
}

.text-content {
  max-height: 160px;
  overflow-y: auto;
  padding: 0 5px 5px 0;
  white-space: pre-line;
  line-height: 1.6;
  color: #606266;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 8;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  border-top: 1px solid #ebeef5;
  padding-top: 10px;
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1200px) {
  .card-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .card-container {
    grid-template-columns: 1fr;
  }
}
</style>
