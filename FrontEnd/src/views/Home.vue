<template>
  <div class="dashboard-container">
    <!-- 左侧内容：标题和统计数据 -->
    <div class="dashboard-left">
      <div class="dashboard-header">
        <h1 class="system-title">基于事件图的文本生成系统</h1>
            </div>
      
      <div class="dashboard-stats">
        <el-card class="stat-card">
          <div class="stat-icon">
            <el-icon><UserFilled /></el-icon>
            </div>
          <div class="stat-info">
            <div class="stat-value">{{ userCount }}</div>
            <div class="stat-label">用户总数</div>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-icon">
            <el-icon><Share /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ eventGraphCount }}</div>
            <div class="stat-label">事件图总数</div>
            </div>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-icon">
            <el-icon><Brush /></el-icon>
            </div>
          <div class="stat-info">
            <div class="stat-value">{{ textStyleCount }}</div>
            <div class="stat-label">文本风格总数</div>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-icon">
            <el-icon><Document /></el-icon>
            </div>
          <div class="stat-info">
            <div class="stat-value">{{ textCount }}</div>
            <div class="stat-label">生成文本总数</div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 右侧事件图可视化 -->
    <div class="dashboard-visualize">
      <el-card class="visualize-card">
      <template #header>
        <div class="card-header">
            <span>事件图示例</span>
            <el-button link @click="goToEventGraphVisualize">查看更多</el-button>
          </div>
        </template>
        <div class="visualization-container" v-loading="loading">
          <el-card class="legend">
            <h3>关系类型</h3>
            <div v-for="(color, type) in relationColors" :key="type" class="legend-item">
              <div class="color-dot" :style="{ backgroundColor: color }"></div>
              <span>{{ formatRelationType(type) }}</span>
            </div>
          </el-card>
          <div id="graph-container" ref="graphContainer"></div>
        </div>
    </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { UserFilled, Share, Document, Brush } from '@element-plus/icons-vue'
import * as d3 from 'd3'
import { getEventGraphElements, getEventGraphList } from '@/api/eventGraph'
import { getSystemStatistics } from '@/api/statistics'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

// 统计数据
const userCount = ref(0)
    const eventGraphCount = ref(0)
const textStyleCount = ref(0)
    const textCount = ref(0)

// 可视化相关
const loading = ref(false)
const graphContainer = ref(null)
const graphData = ref({
  title: '事件图示例',
  description: '首页展示的事件图示例',
  nodes: [],
  edges: []
})

// 示例事件图ID
const sampleEventGraphId = 1

// 关系类型颜色映射
const relationColors = {
  'PRECEDES': '#4285F4', // 蓝色
  'FOLLOWS': '#34A853', // 绿色
  'CONCURRENT_WITH': '#8F44AD', // 紫色
  'CAUSES': '#EA4335', // 红色
  'RESULTS_IN': '#FBBC05', // 黄色
  'COREFERS_TO': '#00ACC1', // 青色
  'HAS_SUBEVENT': '#FF5722', // 橙色
  'SUBEVENT_OF': '#795548', // 棕色
}

// 格式化关系类型
const formatRelationType = (type) => {
  const relationMap = {
    'PRECEDES': '先于',
    'FOLLOWS': '后于',
    'CONCURRENT_WITH': '同时',
    'CAUSES': '导致',
    'RESULTS_IN': '结果',
    'COREFERS_TO': '共指',
    'HAS_SUBEVENT': '包含子事件',
    'SUBEVENT_OF': '属于'
  }
  return relationMap[type] || type
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await getSystemStatistics()
    if (response && response.success && response.data) {
      userCount.value = response.data.userCount
      eventGraphCount.value = response.data.eventGraphCount
      textStyleCount.value = response.data.textStyleCount
      textCount.value = response.data.generatedTextCount
    } else {
      console.error('获取统计数据失败:', response?.message || '未知错误')
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取示例事件图数据
const fetchSampleGraphData = async () => {
  loading.value = true
  try {
    console.log('获取示例事件图:', sampleEventGraphId)
    const response = await getEventGraphElements(sampleEventGraphId)
    
    if (response && response.success && response.data) {
      graphData.value = response.data
      await nextTick()
      initForceGraph()
    } else {
      console.error('获取示例事件图失败:', response?.message || '未知错误')
      // 如果获取失败，使用模拟数据
      useDemoData()
    }
  } catch (error) {
    console.error('获取示例事件图失败:', error)
    // 如果获取失败，使用模拟数据
    useDemoData()
  } finally {
    loading.value = false
  }
}

// 使用模拟数据
const useDemoData = () => {
  graphData.value = {
    title: '示例事件图',
    description: '模拟的事件图数据',
    nodes: [
      { id: 1, title: '东晋建立', type: 'event' },
      { id: 2, title: '淝水之战', type: 'event' },
      { id: 3, title: '谢安之计', type: 'event' },
      { id: 4, title: '刘裕称帝', type: 'event' },
      { id: 5, title: '八王之乱', type: 'event' },
      { id: 6, title: '西晋建立', type: 'event' }
    ],
    edges: [
      { id: 1, sourceId: 1, targetId: 2, type: 'PRECEDES', label: '先于' },
      { id: 2, sourceId: 3, targetId: 2, type: 'CAUSES', label: '导致', strength: '中' },
      { id: 3, sourceId: 5, targetId: 1, type: 'CAUSES', label: '导致', strength: '强' },
      { id: 4, sourceId: 6, targetId: 5, type: 'PRECEDES', label: '先于' },
      { id: 5, sourceId: 5, targetId: 8, type: 'FOLLOWS', label: '后于' }
    ]
  }
  initForceGraph()
}

// 初始化力导向图
const initForceGraph = () => {
  if (!graphContainer.value) return
  
  // 清空容器
  d3.select(graphContainer.value).selectAll('*').remove()
  
  const nodes = graphData.value.nodes || []
  const links = (graphData.value.edges || []).map(edge => ({
    id: edge.id,
    source: edge.sourceId,
    target: edge.targetId,
    type: edge.type,
    strength: edge.strength
  }))
  
  if (!nodes.length) {
    console.error('没有节点数据')
    return
  }
  
  // 等待DOM更新并确保容器尺寸正确
  nextTick(() => {
    const width = graphContainer.value.clientWidth || 800
    const height = graphContainer.value.clientHeight || 600
    
    console.log('图表容器尺寸:', width, 'x', height)
    
    // 创建SVG容器
    const svg = d3.select(graphContainer.value)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;')
    
    // 创建箭头标记
    svg.append('defs').selectAll('marker')
      .data(Object.keys(relationColors))
      .enter().append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', d => relationColors[d])
      .attr('d', 'M0,-5L10,0L0,5');
    
    // 创建图形容器
    const g = svg.append('g')
    
    // 缩放行为
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    
    svg.call(zoom)
    
    // 创建力导向模拟
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));
    
    // 绘制关系边
    const link = g.append('g')
      .attr('stroke-opacity', 0.6)
      .selectAll('g')
      .data(links)
      .enter()
      .append('g');
    
    // 边的线条
    link.append('path')
      .attr('stroke', d => relationColors[d.type] || '#999')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('marker-end', d => `url(#arrow-${d.type})`)
      .attr('id', d => `link-${d.id}`);
    
    // 边的文本
    link.append('text')
      .attr('dy', -5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .append('textPath')
      .attr('xlink:href', d => `#link-${d.id}`)
      .attr('startOffset', '50%')
      .text(d => {
        let label = formatRelationType(d.type)
        if (d.type === 'CAUSES' || d.type === 'RESULTS_IN') {
          label += d.strength ? `(${d.strength})` : ''
        }
        return label
      });
    
    // 绘制节点
    const node = g.append('g')
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );
    
    // 节点圆圈
    node.append('circle')
      .attr('r', 30)
      .attr('fill', '#39c5bb')
      .attr('stroke', '#2a9d8f')
      .attr('stroke-width', 2);
    
    // 节点文本
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('dy', '.3em')
      .text(d => d.title);
    
    // 添加节点悬停提示
    node.append('title')
      .text(d => `${d.title}\n${d.description || ''}`);
    
    // 更新模拟
    simulation.on('tick', () => {
      // 更新边的路径
      link.select('path').attr('d', d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // 确保源节点和目标节点不是同一个
        if(dr === 0) return 'M0,0L0,0';
        
        // 计算圆的半径，稍微缩小以便显示箭头
        const sourceRadius = 30;
        const targetRadius = 30;
        
        // 计算边的起点和终点（考虑节点半径）
        const ratio = dr ? dr : 1;
        const offsetX = (dx * targetRadius) / ratio;
        const offsetY = (dy * targetRadius) / ratio;
        
        const endX = d.target.x - offsetX;
        const endY = d.target.y - offsetY;
        
        return `M${d.source.x},${d.source.y}L${endX},${endY}`;
      });
      
      // 更新节点位置
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // 拖拽事件处理函数
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  })
}

// 跳转到事件图可视化页面
const goToEventGraphVisualize = async () => {
  try {
    const response = await getEventGraphList()
    let eventGraphs = []
    
    if (response && Array.isArray(response)) {
      eventGraphs = response
    } else if (response && response.success && Array.isArray(response.data)) {
      eventGraphs = response.data
    }
    
    if (eventGraphs.length > 0) {
      // 获取ID最小的事件图
      const firstGraph = [...eventGraphs].sort((a, b) => a.id - b.id)[0]
      router.push(`/event-graph/visualize/${firstGraph.id}`)
    } else {
      ElMessage.warning('没有可查看的事件图')
      router.push('/event-graph/list')
    }
  } catch (error) {
    console.error('获取事件图列表失败:', error)
    ElMessage.error('获取事件图列表失败')
    router.push('/event-graph/list')
  }
}

onMounted(() => {
  fetchStats()
  fetchSampleGraphData()
})
</script>

<style scoped>
.dashboard-container {
  display: flex;
  padding: 20px;
  height: calc(100vh - 90px);
  gap: 20px;
}

.dashboard-left {
  width: 45%;
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  height: 25%;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.system-title {
  font-size: 36px;
  color: #1890FF;
  margin: 0;
  padding: 0;
  line-height: 1.2;
  font-weight: 600;
  position: relative;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.system-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #1890FF 0%, #69B7FF 100%);
  border-radius: 2px;
}

.dashboard-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  flex-grow: 1;
  align-content: flex-start;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  flex: 1 1 calc(50% - 15px);
  min-width: 150px;
  border-radius: 12px;
  background-color: rgba(235, 242, 248, 0.6);
  backdrop-filter: blur(10px);
  box-shadow: 0 6px 16px rgba(0, 21, 41, 0.08);
  transition: all 0.3s ease;
  border: none;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(24, 144, 255, 0.15);
  background-color: rgba(240, 245, 250, 0.7);
}

.stat-icon {
  font-size: 40px;
  margin-right: 15px;
  color: #1890FF;
  background: linear-gradient(140deg, #1890FF, #69B7FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #1890FF;
  line-height: 1;
}

.stat-label {
  font-size: 16px;
  color: #606266;
  margin-top: 8px;
}

.dashboard-visualize {
  width: 55%;
  display: flex;
  flex-direction: column;
}

.visualize-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  border-radius: 12px;
  background-color: rgba(235, 242, 248, 0.6);
  backdrop-filter: blur(10px);
  box-shadow: 0 6px 16px rgba(0, 21, 41, 0.08);
  transition: all 0.3s ease;
  border: none;
}

.visualize-card :deep(.el-card__body) {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.visualize-card :deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #1890FF;
    }
    
.visualization-container {
  position: relative;
  height: 100%;
      display: flex;
  flex-direction: column;
  flex: 1;
}

.legend {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 100;
  width: 150px;
  padding: 10px;
  border-radius: 8px;
  background-color: rgba(235, 242, 248, 0.85);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: none;
}

.legend h3 {
  margin-top: 0;
          font-size: 14px;
  color: #1890FF;
  margin-bottom: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  font-size: 12px;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

#graph-container {
  width: 100%;
  height: 100%;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .dashboard-container {
    flex-direction: column;
  }
  
  .dashboard-left,
  .dashboard-visualize {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .stat-card {
    flex: 1 1 100%;
  }
}
</style> 