<template>
  <div class="event-graph-visualize-container">
    <div class="header">
      <div>
        <h2>事件图可视化：{{ graphData.title }}</h2>
        <div class="description">{{ graphData.description }}</div>
      </div>
      <div class="header-actions">
        <el-button @click="goBack">返回列表</el-button>
      </div>
    </div>

    <div class="visualization-wrapper">
      <!-- 左侧切换按钮 -->
      <div class="nav-button left-button" @click="navigateToGraph('prev')" :class="{ disabled: !hasPrevGraph }">
        <el-icon><arrow-left /></el-icon>
      </div>
      
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
      
      <!-- 右侧切换按钮 -->
      <div class="nav-button right-button" @click="navigateToGraph('next')" :class="{ disabled: !hasNextGraph }">
        <el-icon><arrow-right /></el-icon>
      </div>
    </div>

    <!-- 添加关系对话框 -->
    <el-dialog
      v-model="showAddRelationDialog"
      title="添加连接"
      width="500px"
      :close-on-click-modal="false"
      @close="releaseFixedNodes"
    >
      <el-form :model="relationForm" label-width="80px">
        <el-form-item label="起点">
          <el-input :value="fixedNodes.length > 0 ? fixedNodes[0].title : ''" disabled />
        </el-form-item>
        <el-form-item label="终点">
          <el-input :value="fixedNodes.length > 1 ? fixedNodes[1].title : ''" disabled />
        </el-form-item>
        <el-form-item label="关系类型" required>
          <el-select v-model="relationForm.type" placeholder="请选择关系类型" style="width: 100%">
            <el-option
              v-for="(color, type) in relationColors"
              :key="type"
              :label="formatRelationType(type)"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关系强度" v-if="['CAUSES', 'RESULTS_IN'].includes(relationForm.type)" required>
          <el-select v-model="relationForm.strength" placeholder="请选择关系强度" style="width: 100%">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDialog">取消</el-button>
          <el-button type="primary" @click="saveRelation">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑关系对话框 -->
    <el-dialog
      v-model="showEditRelationDialog"
      title="编辑连接"
      width="500px"
      :close-on-click-modal="false"
      @close="releaseFixedNodes"
    >
      <el-form :model="relationForm" label-width="80px">
        <el-form-item label="起点">
          <el-input :value="fixedNodes.length > 0 ? fixedNodes[0].title : ''" disabled />
        </el-form-item>
        <el-form-item label="终点">
          <el-input :value="fixedNodes.length > 1 ? fixedNodes[1].title : ''" disabled />
        </el-form-item>
        <el-form-item label="关系类型" required>
          <el-select v-model="relationForm.type" placeholder="请选择关系类型" style="width: 100%">
            <el-option
              v-for="(color, type) in relationColors"
              :key="type"
              :label="formatRelationType(type)"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关系强度" v-if="['CAUSES', 'RESULTS_IN'].includes(relationForm.type)" required>
          <el-select v-model="relationForm.strength" placeholder="请选择关系强度" style="width: 100%">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDialog">取消</el-button>
          <el-button type="primary" @click="saveRelation">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElDialog, ElForm, ElFormItem, ElSelect, ElOption, ElButton } from 'element-plus'
import { getEventGraphElements, getEventGraphList } from '@/api/eventGraph'
import { createEventGraphEdge, updateEventGraphEdge, deleteEventGraphEdge } from '@/api/eventGraphEdge'
import * as d3 from 'd3'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const graphContainer = ref(null)
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

// 返回列表页
const goBack = () => {
  router.push('/event-graph/list')
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
    router.push(`/event-graph/visualize/${targetGraph.id}`).then(() => {
      // 路由导航完成后重新刷新图表数据
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
      // 获取到数据后进行可视化
      await nextTick()
      initForceGraph()
    } else {
      ElMessage.error(response?.message || response?.error || '获取事件图详情失败')
    }
  } catch (error) {
    console.error('获取事件图详情失败:', error)
    ElMessage.error('获取事件图详情失败')
  } finally {
    loading.value = false
  }
}

// 添加固定节点计数器
const fixedNodesCount = ref(0)

// 添加固定节点的跟踪
const fixedNodes = ref([])
const showAddRelationDialog = ref(false)
const showEditRelationDialog = ref(false)
const relationForm = ref({
  id: null,
  eventGraphId: Number(eventGraphId.value),
  sourceId: null,
  targetId: null,
  type: '',
  strength: null
})

// 检查两个节点之间是否存在关系
const findExistingRelation = (sourceId, targetId) => {
  const edges = graphData.value.edges || []
  console.log('检查关系，节点ID:', sourceId, targetId)
  console.log('所有边:', edges)
  
  // 查找正向或反向关系
  return edges.find(edge => 
    (edge.sourceId === sourceId && edge.targetId === targetId) ||
    (edge.sourceId === targetId && edge.targetId === sourceId)
  )
}

// 处理关系编辑
const handleRelationEdit = () => {
  if (fixedNodes.value.length !== 2) return
  
  const [firstNode, secondNode] = fixedNodes.value
  const existingRelation = findExistingRelation(firstNode.id, secondNode.id)
  
  // 检查节点数据
  console.log('固定的节点:', fixedNodes.value)
  console.log('找到的关系:', existingRelation)
  
  relationForm.value = {
    id: existingRelation ? existingRelation.id : null,
    eventGraphId: Number(eventGraphId.value),
    sourceId: firstNode.id,
    targetId: secondNode.id,
    type: existingRelation?.type || '',
    strength: existingRelation?.type === 'CAUSES' || existingRelation?.type === 'RESULTS_IN' 
      ? (existingRelation?.strength || '低') 
      : null
  }
  
  console.log('表单数据:', relationForm.value)
  
  if (existingRelation) {
    showEditRelationDialog.value = true
  } else {
    showAddRelationDialog.value = true
  }
}

// 释放所有固定节点的函数
const releaseFixedNodes = () => {
  console.log('释放固定节点')
  
  // 遍历图中所有节点，而不只是固定节点数组中的节点
  if (graphContainer.value) {
    d3.select(graphContainer.value)
      .selectAll('.node')
      .each(function(d) {
        if (d.fixed) {
          console.log('释放节点:', d.title)
          d.fixed = false
          d.fx = null
          d.fy = null
          
          // 更新节点视觉效果
          d3.select(this).select('.node-highlight')
            .classed('fixed', false)
            .classed('visible', false)
            .style('opacity', 0)
        }
      })
  }
  
  // 清空固定节点数组和计数器
  fixedNodes.value = []
  fixedNodesCount.value = 0
}

// 取消对话框
const cancelDialog = () => {
  // 释放固定节点
  releaseFixedNodes()
  
  // 关闭对话框
  showAddRelationDialog.value = false
  showEditRelationDialog.value = false
}

// 保存关系
const saveRelation = async () => {
  try {
    // 确保强度字段正确设置
    if (!['CAUSES', 'RESULTS_IN'].includes(relationForm.value.type)) {
      relationForm.value.strength = null
    } else if (!relationForm.value.strength) {
      relationForm.value.strength = '低' // 默认值
    }
    
    if (showAddRelationDialog.value) {
      // 创建新关系
      console.log('创建关系请求数据:', {
        eventGraphId: Number(relationForm.value.eventGraphId),
        sourceId: relationForm.value.sourceId,
        targetId: relationForm.value.targetId,
        type: relationForm.value.type,
        strength: relationForm.value.strength
      })
      
      const response = await createEventGraphEdge({
        eventGraphId: Number(relationForm.value.eventGraphId),
        sourceId: relationForm.value.sourceId,
        targetId: relationForm.value.targetId,
        type: relationForm.value.type,
        strength: relationForm.value.strength
      })

      console.log('创建关系响应:', response)
      
      if (response.success) {
        ElMessage.success('创建关系成功')
      } else {
        throw new Error(response.error || '创建关系失败')
      }
    } else {
      // 保存旧关系的ID，以便后续删除
      const oldRelationId = relationForm.value.id
      
      // 更新现有关系（由于PUT接口问题，实际上是创建新关系）
      console.log('更新关系请求数据:', {
        // 不发送id字段，让后端生成新ID
        eventGraphId: Number(relationForm.value.eventGraphId),
        sourceId: relationForm.value.sourceId,
        targetId: relationForm.value.targetId,
        type: relationForm.value.type,
        strength: relationForm.value.strength
      })
      
      // 先创建新关系
      const createResponse = await createEventGraphEdge({
        // 不包含id字段
        eventGraphId: Number(relationForm.value.eventGraphId),
        sourceId: relationForm.value.sourceId,
        targetId: relationForm.value.targetId,
        type: relationForm.value.type,
        strength: relationForm.value.strength
      })

      console.log('创建新关系响应:', createResponse)
      
      if (!createResponse.success) {
        throw new Error(createResponse.error || '更新关系失败: 创建新关系失败')
      }
      
      // 如果成功创建新关系，删除旧关系
      if (oldRelationId) {
        try {
          console.log('删除旧关系:', oldRelationId)
          const deleteResponse = await deleteEventGraphEdge(oldRelationId)
          console.log('删除旧关系响应:', deleteResponse)
          
          if (!deleteResponse.success) {
            console.warn('删除旧关系失败:', deleteResponse.error || '未知错误')
            // 不中断流程，仍然视为成功
          }
        } catch (deleteError) {
          console.error('删除旧关系出错:', deleteError)
          // 不中断流程，仍然视为成功
        }
      }
      
      ElMessage.success('更新关系成功')
    }

    // 关闭对话框
    showAddRelationDialog.value = false
    showEditRelationDialog.value = false
    
    // 清除固定节点
    releaseFixedNodes()
    
    // 重新加载图数据
    await fetchGraphData()
  } catch (error) {
    console.error('保存关系失败:', error)
    ElMessage.error(error.message || '保存关系失败')
  }
}

// 初始化力导向图
const initForceGraph = () => {
  if (!graphContainer.value) return
  
  // 清空容器
  d3.select(graphContainer.value).selectAll('*').remove()
  
  // 重置固定节点状态
  fixedNodes.value = []
  fixedNodesCount.value = 0
  
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
  
  const width = graphContainer.value.clientWidth
  const height = graphContainer.value.clientHeight || 800
  
  // 创建SVG容器
  const svg = d3.select(graphContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto;')
    
  // 禁用默认右键菜单
  svg.on('contextmenu', (event) => {
    event.preventDefault()
  })
  
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
    .force('collision', d3.forceCollide().radius(60))
  
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
  
  // 添加节点高亮圈
  node.append('circle')
    .attr('class', 'node-highlight')
    .attr('r', 36)
    .style('opacity', 0)
    .style('filter', 'blur(2px)');
  
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
    .text(d => `${d.title}\n${d.description}`);
  
  // 添加节点交互事件
  node
    .on('mouseenter', function(event, d) {
      if (!d.fixed) {
        d3.select(this).select('.node-highlight')
          .classed('visible', true)
          .style('opacity', 0.3)
      }
    })
    .on('mouseleave', function(event, d) {
      if (!d.fixed) {
        d3.select(this).select('.node-highlight')
          .classed('visible', false)
          .style('opacity', 0)
      }
    })
    .on('contextmenu', function(event, d) {
      event.preventDefault()
      
      console.log('右键点击节点:', d, '当前固定节点数:', fixedNodesCount.value)
      
      if (d.fixed) {
        // 解除节点固定
        d.fixed = false
        d.fx = null
        d.fy = null
        fixedNodesCount.value--
        fixedNodes.value = fixedNodes.value.filter(node => node.id !== d.id)
        d3.select(this).select('.node-highlight')
          .classed('fixed', false)
          .classed('visible', false)
          .style('opacity', 0)
        
        console.log('节点解除固定, 当前固定节点数:', fixedNodesCount.value)
      } else if (fixedNodesCount.value < 2) {
        // 固定节点
        d.fixed = true
        d.fx = d.x
        d.fy = d.y
        fixedNodesCount.value++
        
        // 添加节点到固定节点数组
        const nodeInfo = {
          id: d.id, // 保存原始ID，不要修改格式
          title: d.title,
          description: d.description
        }
        console.log('添加固定节点:', nodeInfo, '当前固定节点数:', fixedNodesCount.value)
        fixedNodes.value.push(nodeInfo)
        
        d3.select(this).select('.node-highlight')
          .classed('fixed', true)
          .classed('visible', true)
          .style('opacity', 0.5)
        
        // 如果已经固定了两个节点，触发关系编辑
        if (fixedNodesCount.value === 2) {
          console.log('固定了两个节点，准备打开对话框')
          handleRelationEdit()
        }
      } else {
        // 已经有两个固定节点，提示用户
        console.log('已经固定了两个节点，不能再固定更多')
        ElMessage.warning('最多只能固定两个节点。请先右键点击已固定节点取消固定，再尝试固定此节点。')
      }
    })
  
  // 更新模拟
  simulation.on('tick', () => {
    // 更新边的路径
    link.select('path').attr('d', d => {
      const dx = d.target.x - d.source.x
      const dy = d.target.y - d.source.y
      return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`
    })
    
    // 更新节点位置
    node.attr('transform', d => `translate(${d.x},${d.y})`)
  })
  
  // 拖拽事件处理函数
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    // 只在拖拽时临时固定位置，不计入固定节点计数
    d.fx = d.x
    d.fy = d.y
  }
  
  function dragged(event, d) {
    d.fx = event.x
    d.fy = event.y
  }
  
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0)
    // 如果节点没有被右键固定，则释放位置
    if (!d.fixed) {
      d.fx = null
      d.fy = null
    }
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
  
  // 添加窗口大小变化监听
  const handleResize = () => {
    if (graphData.value.nodes && graphData.value.nodes.length) {
      initForceGraph()
    }
  }
  
  window.addEventListener('resize', handleResize)
  
  // 清理函数
  return () => {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style scoped>
.event-graph-visualize-container {
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

.header-actions {
  display: flex;
  gap: 15px;
}

.description {
  color: #606266;
  margin-top: 15px;
  font-size: 15px;
}

.visualization-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.visualization-container {
  position: relative;
  height: 800px;
  width: 90%;
  background-color: rgba(225, 232, 238, 0.7);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 21, 41, 0.08);
  backdrop-filter: blur(10px);
  overflow: hidden;
  /* 禁用默认右键菜单 */
  user-select: none;
  -webkit-user-select: none;
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

.legend {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  padding: 10px;
  background-color: rgba(225, 232, 238, 0.8);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 21, 41, 0.1);
  min-width: 120px;
}

.legend h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-weight: 600;
  font-size: 16px;
  color: #1890FF;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

#graph-container {
  width: 100%;
  height: 100%;
}

/* 添加节点悬停和固定状态的样式 */
.node-highlight {
  fill: none;
  stroke: #f0f2f5;
  stroke-width: 12;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.node-highlight.visible {
  opacity: 0.8;
}

.node-highlight.fixed {
  opacity: 0.9;
  stroke: #e8eaed;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 