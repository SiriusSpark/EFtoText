<template>
  <div class="event-graph-detail-container">
    <div class="header">
      <div>
        <h2>事件图详情：{{ graphData.title }}</h2>
        <div class="description">{{ graphData.description }}</div>
      </div>
      <div class="header-buttons">
        <el-button type="primary" @click="editGraph">编辑</el-button>
        <el-button @click="goBack">返回列表</el-button>
      </div>
    </div>

    <!-- 节点和边信息 -->
    <div class="content-wrapper">
      <!-- 左侧切换按钮 -->
      <div class="nav-button left-button" @click="navigateToGraph('prev')" :class="{ disabled: !hasPrevGraph }">
        <el-icon><arrow-left /></el-icon>
      </div>

      <div class="content" v-loading="loading">
        <!-- 节点列表 -->
        <div class="section">
          <div class="section-header">
            <h3>事件节点 ({{ graphData.nodes ? graphData.nodes.length : 0 }})</h3>
          </div>
          <el-table :data="graphData.nodes || []" border>
            <el-table-column label="ID" width="80">
              <template #default="scope">
                {{ scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="标题" prop="title" min-width="90" />
            <el-table-column label="描述" prop="description" min-width="380" show-overflow-tooltip />
            <el-table-column label="位置" prop="location" width="120" />
            <el-table-column label="标签" min-width="150">
              <template #default="scope">
                <el-tag v-for="tag in scope.row.labels" :key="tag" size="small" style="margin-right: 5px">
                  {{ tag }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="开始时间" prop="startTime" width="120" />
            <el-table-column label="结束时间" prop="endTime" width="120" />
          </el-table>
        </div>

        <!-- 边列表 -->
        <div class="section">
          <div class="section-header">
            <h3>事件关系 ({{ graphData.edges ? graphData.edges.length : 0 }})</h3>
          </div>
          <el-table :data="graphData.edges || []" border>
            <el-table-column label="ID" width="80">
              <template #default="scope">
                {{ scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="起始节点" width="150">
              <template #default="scope">
                {{ getNodeTitle(scope.row.sourceId) }}
              </template>
            </el-table-column>
            <el-table-column label="关系类型" prop="type" width="120">
              <template #default="scope">
                <el-tag>{{ formatRelationType(scope.row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="目标节点" width="150">
              <template #default="scope">
                {{ getNodeTitle(scope.row.targetId) }}
              </template>
            </el-table-column>
            <el-table-column label="强度" prop="strength" width="100">
              <template #default="scope">
                <el-tag v-if="isCausalType(scope.row.type) && scope.row.strength" type="info">{{ scope.row.strength }}</el-tag>
                <span v-else-if="isCausalType(scope.row.type) && !scope.row.strength">未设置</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <!-- 右侧切换按钮 -->
      <div class="nav-button right-button" @click="navigateToGraph('next')" :class="{ disabled: !hasNextGraph }">
        <el-icon><arrow-right /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getEventGraphElements, getEventGraphList } from '@/api/eventGraph'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const graphData = ref({
  title: '',
  description: '',
  nodes: [],
  edges: []
})
const allEventGraphs = ref([]) // 存储所有事件图的数据
const currentGraphIndex = ref(-1) // 当前事件图在列表中的索引

// 获取路由参数中的事件图ID
const eventGraphId = computed(() => {
  return route.params.id
})

// 判断是否有前一个图
const hasPrevGraph = computed(() => {
  return currentGraphIndex.value > 0
})

// 判断是否有后一个图
const hasNextGraph = computed(() => {
  return currentGraphIndex.value < allEventGraphs.value.length - 1 && currentGraphIndex.value >= 0
})

// 根据ID获取节点标题
const getNodeTitle = (nodeId) => {
  if (!graphData.value.nodes) return nodeId
  
  const node = graphData.value.nodes.find(n => n.id === nodeId)
  return node ? node.title : nodeId
}

// 格式化关系类型
const formatRelationType = (type) => {
  const relationMap = {
    // 时间关系
    'PRECEDES': '先于',
    'FOLLOWS': '后于',
    'CONCURRENT_WITH': '同时',
    // 因果关系
    'CAUSES': '导致',
    'RESULTS_IN': '结果',
    // 共指关系
    'COREFERS_TO': '共指',
    // 子事件关系
    'HAS_SUBEVENT': '包含子事件',
    'SUBEVENT_OF': '属于'
  }
  return relationMap[type] || type
}

// 是否为因果关系类型
const isCausalType = (type) => {
  return ['CAUSES', 'RESULTS_IN'].includes(type);
}

// 返回列表页
const goBack = () => {
  router.push('/event-graph/list')
}

// 编辑事件图
const editGraph = () => {
  router.push(`/event-graph/edit/${eventGraphId.value}`)
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
    router.push(`/event-graph/detail/${targetGraph.id}`).then(() => {
      // 路由导航完成后重新刷新数据
      fetchGraphData().then(() => {
        // 更新当前索引
        currentGraphIndex.value = targetIndex
      })
    })
  }
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
    if (eventGraphId.value) {
      currentGraphIndex.value = allEventGraphs.value.findIndex(
        graph => graph.id == eventGraphId.value
      )
    }
  } catch (error) {
    console.error('获取事件图列表失败:', error)
    ElMessage.error('获取事件图列表失败')
    allEventGraphs.value = []
  }
}

// 获取事件图数据
const fetchGraphData = async () => {
  if (!eventGraphId.value) {
    ElMessage.error('未找到事件图ID')
    return
  }
  
  loading.value = true
  try {
    console.log('获取事件图详情:', eventGraphId.value)
    const response = await getEventGraphElements(eventGraphId.value)
    console.log('事件图详情数据:', response)
    
    // 根据API返回的嵌套数据结构来处理
    if (response && response.success && response.data) {
      graphData.value = response.data
    } else {
      ElMessage.error(response?.message || response?.error || '获取事件图详情失败')
      graphData.value = { nodes: [], edges: [] }
    }
  } catch (error) {
    console.error('获取事件图详情失败:', error)
    ElMessage.error('获取事件图详情失败')
    graphData.value = { nodes: [], edges: [] }
  } finally {
    loading.value = false
  }
}

// 监听路由参数变化，当ID变化时重新加载数据
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    // 重新获取数据并更新当前索引
    fetchGraphData()
    // 更新当前索引
    if (allEventGraphs.value.length > 0) {
      currentGraphIndex.value = allEventGraphs.value.findIndex(
        graph => graph.id == newId
      )
    }
  }
})

onMounted(async () => {
  // 先获取所有事件图列表，以支持导航功能
  await fetchAllEventGraphs()
  // 然后获取当前事件图的详情数据
  fetchGraphData()
})
</script>

<style scoped>
.event-graph-detail-container {
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

.section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

h3 {
  margin-bottom: 15px;
  font-weight: 600;
  font-size: 18px;
  color: #1890FF;
}

.section-header h3 {
  margin-bottom: 0;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 21, 41, 0.08);
  background-color: rgba(235, 242, 248, 0.6);
  backdrop-filter: blur(10px);
}

:deep(.el-table th) {
  background-color: rgba(215, 232, 247, 0.7) !important;
  color: #1890FF;
  font-weight: 600;
}

:deep(.el-table__row:hover > td) {
  background-color: rgba(215, 232, 247, 0.8) !important;
}
</style> 