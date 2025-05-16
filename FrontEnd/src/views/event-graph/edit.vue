<template>
  <div class="event-graph-edit-container">
    <div class="page-header">
      <div class="title-area">
        <h2>{{ isEdit ? '编辑事件图' : '添加事件节点和关系' }}</h2>
        <div class="graph-info" v-if="form.title">
          <h3>{{ form.title }}</h3>
          <p class="description">{{ form.description }}</p>
        </div>
      </div>
      <div class="header-actions" v-if="isEdit">
        <el-button type="primary" @click="submitForm" :loading="loading">保存</el-button>
        <el-button @click="goBack" :disabled="loading">返回列表</el-button>
      </div>
    </div>
    
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="graph-form"
    >
      <el-form-item label="标题" prop="title" v-if="isEdit">
        <el-input v-model="form.title" placeholder="请输入事件图标题" />
      </el-form-item>
      
      <el-form-item label="描述" prop="description" v-if="isEdit">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入事件图描述"
        />
      </el-form-item>
      
      <div class="graph-editor">
        <div class="toolbar">
          <el-button type="primary" @click="addNode" :disabled="loading">添加节点</el-button>
          <el-button type="primary" @click="addEdge" :disabled="loading">添加连接</el-button>
        </div>
        
        <div class="graph-canvas" v-loading="loading">
          <!-- 这里应该是一个图形编辑器，可以使用 G6, mxGraph 等图形库实现 -->
          <!-- 这里仅做示例，实际项目中需要集成图形编辑库 -->
          <div class="mock-graph-canvas">
            <div v-if="nodes.length === 0" class="empty-graph">
              <p>暂无节点，点击"添加节点"按钮开始创建</p>
            </div>
            <div v-else class="node-list">
              <h3>节点列表</h3>
              <el-table :data="nodes" border style="width: 100%">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="title" label="标题" />
                <el-table-column prop="description" label="描述" width="200">
                  <template #default="scope">
                    <el-tooltip
                      v-if="scope.row.description"
                      :content="scope.row.description"
                      placement="top"
                      effect="light"
                    >
                      <span class="description-cell">{{ scope.row.description || '无' }}</span>
                    </el-tooltip>
                    <span v-else>无</span>
                  </template>
                </el-table-column>
                <el-table-column prop="location" label="地点" width="120" />
                <el-table-column label="时间" width="180">
                  <template #default="scope">
                    {{ scope.row.startTime || '无' }} ~ {{ scope.row.endTime || '无' }}
                  </template>
                </el-table-column>
                <el-table-column label="标签" width="200">
                  <template #default="scope">
                    <el-tag
                      v-for="(tag, index) in scope.row.labels"
                      :key="index"
                      size="small"
                      style="margin-right: 3px; margin-bottom: 3px;"
                    >
                      {{ tag }}
                    </el-tag>
                    <span v-if="!scope.row.labels || scope.row.labels.length === 0">无</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                  <template #default="scope">
                    <el-button link type="primary" size="small" @click="editNode(scope.row)">编辑</el-button>
                    <el-button link type="danger" size="small" @click="deleteNode(scope.row.id)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <h3 style="margin-top: 20px;">连接列表</h3>
              <el-table :data="edges" border style="width: 100%">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column label="关系类型">
                  <template #default="scope">
                    {{ formatRelationType(scope.row.type) }}
                  </template>
                </el-table-column>
                <el-table-column label="强度" width="80">
                  <template #default="scope">
                    <span v-if="['CAUSES', 'RESULTS_IN'].includes(scope.row.type)">{{ scope.row.strength || '中' }}</span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="起点" width="150">
                  <template #default="scope">
                    {{ getNodeTitle(scope.row.sourceId || scope.row.source) }}
                  </template>
                </el-table-column>
                <el-table-column label="终点" width="150">
                  <template #default="scope">
                    {{ getNodeTitle(scope.row.targetId || scope.row.target) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                  <template #default="scope">
                    <el-button link type="primary" size="small" @click="editEdge(scope.row)">编辑</el-button>
                    <el-button link type="danger" size="small" @click="deleteEdge(scope.row.id)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </div>
      
      <el-form-item style="margin-top: 20px;" v-if="!isEdit">
        <el-button type="primary" @click="submitForm" :loading="loading">{{ '保存节点和关系' }}</el-button>
        <el-button @click="goBack" :disabled="loading">返回列表</el-button>
      </el-form-item>
    </el-form>
    
    <!-- 节点编辑对话框 -->
    <el-dialog
      v-model="nodeDialogVisible"
      :title="editingNode.id ? '编辑节点' : '添加节点'"
      width="500px"
    >
      <el-form :model="editingNode" label-width="100px">
        <el-form-item label="节点标题" required>
          <el-input v-model="editingNode.title" placeholder="请输入节点标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editingNode.description" type="textarea" :rows="3" placeholder="请输入节点描述" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="editingNode.location" placeholder="请输入事件地点" />
        </el-form-item>
        <el-form-item label="开始时间">
          <div class="date-input-wrapper">
            <el-input v-model="editingNode.startTime" placeholder="格式：YYYY-MM-DD" class="date-input" @input="handleStartDateInput" />
            <el-date-picker
              v-model="startDateTemp"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleStartDateChange"
              class="date-picker"
            />
          </div>
        </el-form-item>
        <el-form-item label="结束时间">
          <div class="date-input-wrapper">
            <el-input v-model="editingNode.endTime" placeholder="格式：YYYY-MM-DD" class="date-input" @input="handleEndDateInput" />
            <el-date-picker
              v-model="endDateTemp"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleEndDateChange"
              class="date-picker"
            />
          </div>
        </el-form-item>
        <el-form-item label="标签">
          <el-tag
            v-for="(tag, index) in editingNode.labels"
            :key="index"
            closable
            @close="removeTag(index)"
            style="margin-right: 5px; margin-bottom: 5px;"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="inputTagVisible"
            ref="tagInputRef"
            v-model="inputTagValue"
            class="input-new-tag"
            size="small"
            @keyup.enter="addTag"
            @blur="addTag"
            style="width: 90px; margin-right: 5px; vertical-align: bottom;"
          />
          <el-button v-else class="button-new-tag" size="small" @click="showTagInput">
            + 新标签
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="nodeDialogVisible = false" :disabled="isNodeSaving">取消</el-button>
          <el-button type="primary" @click="saveNode" :loading="isNodeSaving">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 连接编辑对话框 -->
    <el-dialog
      v-model="edgeDialogVisible"
      :title="editingEdge.id ? '编辑连接' : '添加连接'"
      width="500px"
    >
      <el-form :model="editingEdge" label-width="100px">
        <el-form-item label="关系类型" required>
          <el-select v-model="editingEdge.type" placeholder="请选择关系类型">
            <el-option-group label="时间关系">
              <el-option label="先于(PRECEDES)" value="PRECEDES" />
              <el-option label="后于(FOLLOWS)" value="FOLLOWS" />
              <el-option label="同时(CONCURRENT_WITH)" value="CONCURRENT_WITH" />
            </el-option-group>
            <el-option-group label="因果关系">
              <el-option label="导致(CAUSES)" value="CAUSES" />
              <el-option label="结果(RESULTS_IN)" value="RESULTS_IN" />
            </el-option-group>
            <el-option-group label="共指关系">
              <el-option label="共指(COREFERS_TO)" value="COREFERS_TO" />
            </el-option-group>
            <el-option-group label="子事件关系">
              <el-option label="包含子事件(HAS_SUBEVENT)" value="HAS_SUBEVENT" />
              <el-option label="属于(SUBEVENT_OF)" value="SUBEVENT_OF" />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="关系强度" v-if="isCausalRelation">
          <el-select v-model="editingEdge.strength" placeholder="请选择关系强度">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="起点" required>
          <el-select v-model="editingEdge.source" placeholder="请选择起点">
            <el-option
              v-for="node in nodes"
              :key="node.id"
              :label="node.title"
              :value="node.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="终点" required>
          <el-select v-model="editingEdge.target" placeholder="请选择终点">
            <el-option
              v-for="node in nodes"
              :key="node.id"
              :label="node.title"
              :value="node.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editingEdge.description" type="textarea" :rows="3" placeholder="请输入连接描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="edgeDialogVisible = false" :disabled="isEdgeSaving">取消</el-button>
          <el-button type="primary" @click="saveEdge" :loading="isEdgeSaving">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getEventGraphDetail, createEventGraph, updateEventGraph } from '@/api/eventGraph'
import { getEventGraphElements, saveEventGraphElements } from '@/api/eventGraph'
import { createEventNode, updateEventNode, deleteEventNode } from '@/api/eventGraph'
import { createEventEdge, updateEventEdge, deleteEventEdge } from '@/api/eventGraph'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)

// Loading states
const loading = ref(false)
const isNodeSaving = ref(false)
const isEdgeSaving = ref(false)

// 是否为编辑模式
const isEdit = computed(() => {
  return route.path.includes('/edit/')
})

// 是否为查看模式
const isViewMode = computed(() => {
  return route.query.view === 'true'
})

// 事件图ID
const graphId = computed(() => {
  return route.params.id
})

// 表单数据
const form = reactive({
  title: '',
  description: ''
})

// 表单校验规则
const rules = {
  title: [
    { required: true, message: '请输入事件图标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入事件图描述', trigger: 'blur' }
  ]
}

// 节点和连接
const nodes = ref([])
const edges = ref([])
const nodeIdCounter = ref(1)
const edgeIdCounter = ref(1)

// 节点编辑
const nodeDialogVisible = ref(false)
const editingNode = reactive({
  id: '',
  title: '',
  description: '',
  location: '',
  startTime: '',
  endTime: '',
  labels: []
})

// 标签输入相关
const inputTagVisible = ref(false)
const inputTagValue = ref('')
const tagInputRef = ref(null)

// 日期选择器相关
const startDateTemp = ref('')
const endDateTemp = ref('')

// 处理开始日期选择
const handleStartDateChange = (val) => {
  if (val) {
    editingNode.startTime = val;
  }
}

// 处理结束日期选择
const handleEndDateChange = (val) => {
  if (val) {
    editingNode.endTime = val;
  }
}

// 处理开始日期文本输入
const handleStartDateInput = (val) => {
  // 同步日期选择器的值
  startDateTemp.value = val;
}

// 处理结束日期文本输入
const handleEndDateInput = (val) => {
  // 同步日期选择器的值
  endDateTemp.value = val;
}

// 显示标签输入框
const showTagInput = () => {
  inputTagVisible.value = true
  nextTick(() => {
    tagInputRef.value.focus()
  })
}

// 添加标签
const addTag = () => {
  if (inputTagValue.value) {
    if (!editingNode.labels) {
      editingNode.labels = []
    }
    editingNode.labels.push(inputTagValue.value)
    inputTagValue.value = ''
  }
  inputTagVisible.value = false
}

// 移除标签
const removeTag = (index) => {
  editingNode.labels.splice(index, 1)
}

// 连接编辑
const edgeDialogVisible = ref(false)
const editingEdge = reactive({
  id: '',
  label: '',
  source: '',
  target: '',
  type: 'PRECEDES',
  strength: '中',
  description: ''
})

// 保存原始连接数据，用于比较变化
const originalEdge = reactive({
  id: '',
  label: '',
  source: '',
  target: '',
  type: '',
  strength: '',
  description: ''
})

// 判断当前关系是否为因果关系（需要显示强度）
const isCausalRelation = computed(() => {
  return ['CAUSES', 'RESULTS_IN'].includes(editingEdge.type)
})

// 监听关系类型变化
watch(
  () => editingEdge.type,
  (newType) => {
    // 当切换到因果关系类型时，设置默认强度
    if (['CAUSES', 'RESULTS_IN'].includes(newType) && !editingEdge.strength) {
      editingEdge.strength = '中'
    }
  }
)

// 根据节点ID获取节点标题
const getNodeTitle = (nodeId) => {
  const node = nodes.value.find(n => n.id === nodeId)
  return node ? node.title : `未知节点(${nodeId})`
}

// 格式化关系类型
const formatRelationType = (type) => {
  const typeMap = {
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
  return typeMap[type] || type
}

// 获取事件图详情
const fetchEventGraphDetail = async () => {
  if (!isEdit.value) return
  
  loading.value = true
  try {
    console.log('获取事件图详情:', graphId.value)
    
    // 调用API获取事件图基本信息
    const graphResponse = await getEventGraphDetail(graphId.value)
    console.log('事件图详情响应:', graphResponse)
    
    if (graphResponse && graphResponse.success && graphResponse.data) {
      // 更新表单数据
      form.title = graphResponse.data.title || ''
      form.description = graphResponse.data.description || ''
      
      // 获取事件图元素数据（节点和边）
      const elementsResponse = await getEventGraphElements(graphId.value)
      console.log('事件图元素数据响应:', elementsResponse)
      
      if (elementsResponse && elementsResponse.success && elementsResponse.data) {
        // 更新节点和边数据
        nodes.value = elementsResponse.data.nodes || []
        edges.value = elementsResponse.data.edges || []
      
      // 更新计数器
      if (nodes.value.length > 0) {
          nodeIdCounter.value = Math.max(...nodes.value.map(n => parseInt(n.id || '0'))) + 1
      }
      if (edges.value.length > 0) {
          edgeIdCounter.value = Math.max(...edges.value.map(e => parseInt(e.id || '0'))) + 1
      }
      } else {
        // 没有元素数据时初始化为空数组
        nodes.value = []
        edges.value = []
      }
    } else {
      ElMessage.error(graphResponse?.message || graphResponse?.error || '获取事件图详情失败')
    }
  } catch (error) {
    console.error('获取事件图详情失败:', error)
    ElMessage.error('获取事件图详情失败')
  } finally {
    loading.value = false
  }
}

// 添加节点
const addNode = () => {
  Object.assign(editingNode, {
    id: '',
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    labels: []
  });
  // 重置日期选择器的值
  startDateTemp.value = '';
  endDateTemp.value = '';
  nodeDialogVisible.value = true;
}

// 编辑节点
const editNode = (node) => {
  const nodeCopy = JSON.parse(JSON.stringify(node));
  // 确保labels字段是数组
  if (!nodeCopy.labels) {
    nodeCopy.labels = [];
  }
  Object.assign(editingNode, nodeCopy);
  
  // 同步日期选择器的值
  startDateTemp.value = editingNode.startTime || '';
  endDateTemp.value = editingNode.endTime || '';
  
  nodeDialogVisible.value = true;
}

// 保存节点
const saveNode = async () => {
  if (!editingNode.title) {
    ElMessage.warning('节点标题不能为空')
    return
  }
  
  isNodeSaving.value = true
  try {
    // 只发送非空字段，实现部分更新
    const nodeData = {
      eventGraphId: graphId.value
    }
    
    // 只添加有值的字段
    if (editingNode.title) nodeData.title = editingNode.title;
    if (editingNode.description !== undefined) nodeData.description = editingNode.description;
    if (editingNode.location !== undefined) nodeData.location = editingNode.location;
    if (editingNode.startTime !== undefined) nodeData.startTime = editingNode.startTime;
    if (editingNode.endTime !== undefined) nodeData.endTime = editingNode.endTime;
    if (editingNode.labels && editingNode.labels.length > 0) nodeData.labels = editingNode.labels;
    
    if (editingNode.id) {
      // 编辑现有节点，只发送已修改的字段
      const response = await updateEventNode(editingNode.id, nodeData)
      if (response && response.success) {
        const index = nodes.value.findIndex(n => n.id === editingNode.id)
        if (index !== -1) {
          nodes.value[index] = { ...response.data }
        }
        ElMessage.success('节点更新成功')
        
        // 如果是从详情页来的，操作完成后返回详情页
        if (route.query.action) {
          router.push(`/event-graph/detail/${graphId.value}`)
        }
      } else {
        ElMessage.error(response?.message || response?.error || '节点更新失败')
      }
    } else {
      // 添加新节点
      const response = await createEventNode(nodeData)
      if (response && response.success) {
        nodes.value.push(response.data)
        ElMessage.success('节点创建成功')
        
        // 如果是从详情页来的，操作完成后返回详情页
        if (route.query.action) {
          router.push(`/event-graph/detail/${graphId.value}`)
        }
      } else {
        ElMessage.error(response?.message || response?.error || '节点创建失败')
      }
    }
    
    nodeDialogVisible.value = false
  } catch (error) {
    console.error('保存节点失败:', error)
    ElMessage.error('保存节点失败')
  } finally {
    isNodeSaving.value = false
  }
}

// 删除节点
const deleteNode = async (nodeId) => {
  try {
    loading.value = true
    const response = await deleteEventNode(nodeId)
    
    if (response && response.success) {
  // 删除节点
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  
  // 删除相关连接
  edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
      
      ElMessage.success('节点删除成功')
    } else {
      ElMessage.error(response?.message || response?.error || '节点删除失败')
    }
  } catch (error) {
    console.error('删除节点失败:', error)
    ElMessage.error('删除节点失败')
  } finally {
    loading.value = false
  }
}

// 添加连接
const addEdge = () => {
  if (nodes.value.length < 2) {
    ElMessage.warning('至少需要两个节点才能创建连接')
    return
  }
  
  // 设置默认值 - 使用规范的时间关系类型作为默认值
  const defaultType = 'PRECEDES'
  const defaultValues = {
    id: '',
    source: '',
    target: '',
    type: defaultType,
    description: ''
  }
  
  // 只有因果关系需要强度属性
  if (['CAUSES', 'RESULTS_IN'].includes(defaultType)) {
    defaultValues.strength = '中'
  }
  
  Object.assign(editingEdge, defaultValues)
  
  // 重置原始数据，因为这是新建而不是编辑
  Object.assign(originalEdge, {
    id: '',
    source: '',
    target: '',
    type: '',
    strength: '',
    description: ''
  })
  
  edgeDialogVisible.value = true
}

// 编辑连接
const editEdge = (edge) => {
  const edgeCopy = JSON.parse(JSON.stringify(edge))
  // 设置默认值
  if (!edgeCopy.type) edgeCopy.type = 'PRECEDES'
  
  // 只在因果关系时设置默认强度
  if (['CAUSES', 'RESULTS_IN'].includes(edgeCopy.type) && !edgeCopy.strength) {
    edgeCopy.strength = '中'
  }
  
  Object.assign(editingEdge, edgeCopy)
  
  // 保存原始数据，用于后续比较
  Object.assign(originalEdge, JSON.parse(JSON.stringify(edgeCopy)))
  
  edgeDialogVisible.value = true
}

// 保存连接
const saveEdge = async () => {
  if (!editingEdge.source || !editingEdge.target) {
    ElMessage.warning('请选择起点和终点')
    return
  }
  
  if (editingEdge.source === editingEdge.target) {
    ElMessage.warning('起点和终点不能相同')
    return
  }
  
  if (!editingEdge.type) {
    ElMessage.warning('请选择关系类型')
    return
  }
  
  isEdgeSaving.value = true
  try {
    // 创建一个只包含已修改字段的对象
    const edgeData = {
      // 创建新关系时需要图ID
      eventGraphId: graphId.value
    }
    
    // 如果是更新已有关系，只添加修改过的字段
    if (editingEdge.id) {
      if (editingEdge.source !== originalEdge.source) edgeData.sourceId = editingEdge.source;
      if (editingEdge.target !== originalEdge.target) edgeData.targetId = editingEdge.target;
      if (editingEdge.type !== originalEdge.type) edgeData.type = editingEdge.type;
      
      // 只有因果关系才需要强度属性
      if (['CAUSES', 'RESULTS_IN'].includes(editingEdge.type)) {
        if (editingEdge.strength !== originalEdge.strength || editingEdge.type !== originalEdge.type) {
          edgeData.strength = editingEdge.strength || '中';
        }
      }
      
      // 如果没有字段变更，提示用户
      if (Object.keys(edgeData).length === 1 && edgeData.eventGraphId) {
        ElMessage.info('没有字段被修改，不需要保存');
        isEdgeSaving.value = false;
        return;
      }
    } else {
      // 添加新连接时，需要所有必要字段
      edgeData.sourceId = editingEdge.source;
      edgeData.targetId = editingEdge.target;
      edgeData.type = editingEdge.type;
      
      // 只有因果关系才需要强度属性
      if (['CAUSES', 'RESULTS_IN'].includes(edgeData.type)) {
        edgeData.strength = editingEdge.strength || '中';
      }
    }
    
    if (editingEdge.id) {
      // 编辑现有连接
      const response = await updateEventEdge(editingEdge.id, edgeData)
      if (response && response.success) {
        const index = edges.value.findIndex(e => e.id === editingEdge.id)
        if (index !== -1) {
          edges.value[index] = { ...response.data }
        }
        ElMessage.success('关系更新成功')
        
        // 如果是从详情页来的，操作完成后返回详情页
        if (route.query.action) {
          router.push(`/event-graph/detail/${graphId.value}`)
        }
      } else {
        ElMessage.error(response?.message || response?.error || '关系更新失败')
      }
    } else {
      // 添加新连接
      const response = await createEventEdge(edgeData)
      if (response && response.success) {
        edges.value.push(response.data)
        ElMessage.success('关系创建成功')
        
        // 如果是从详情页来的，操作完成后返回详情页
        if (route.query.action) {
          router.push(`/event-graph/detail/${graphId.value}`)
        }
      } else {
        ElMessage.error(response?.message || response?.error || '关系创建失败')
      }
    }
    
    edgeDialogVisible.value = false
  } catch (error) {
    console.error('保存关系失败:', error)
    ElMessage.error('保存关系失败')
  } finally {
    isEdgeSaving.value = false
  }
}

// 删除连接
const deleteEdge = async (edgeId) => {
  try {
    loading.value = true
    const response = await deleteEventEdge(edgeId)
    
    if (response && response.success) {
  edges.value = edges.value.filter(e => e.id !== edgeId)
      ElMessage.success('关系删除成功')
    } else {
      ElMessage.error(response?.message || response?.error || '关系删除失败')
    }
  } catch (error) {
    console.error('删除关系失败:', error)
    ElMessage.error('删除关系失败')
  } finally {
    loading.value = false
  }
}

// 提交表单
const submitForm = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    
    loading.value = true
    try {
      // 构建API请求数据 - 只发送标题和描述
      const requestData = {
        title: form.title,
        description: form.description
      }
      
      console.log('提交事件图数据:', requestData)
      
      if (isEdit.value) {
        // 编辑现有事件图 - 使用更新事件图API
        try {
          const response = await updateEventGraph(graphId.value, requestData)
          
          if (response && response.success) {
            // 更新成功，不需要再保存图元素
            ElMessage.success(response.message || '保存成功')
            router.push(`/event-graph/detail/${graphId.value}`)
          } else {
            ElMessage.error(response?.message || response?.error || '更新事件图失败')
          }
        } catch (graphError) {
          console.error('更新事件图失败:', graphError)
          ElMessage.error(`更新事件图失败: ${graphError.message || '未知错误'}`)
        }
      } else {
        // 保存节点和边的数据到当前事件图（已在之前创建）
        if (nodes.value.length > 0 || edges.value.length > 0) {
          const elementsData = {
            nodes: nodes.value,
            edges: edges.value
          }
          
          try {
            const response = await saveEventGraphElements(graphId.value, elementsData)
            if (response && response.success) {
              ElMessage.success('事件图编辑成功')
              router.push(`/event-graph/detail/${graphId.value}`)
            } else {
              ElMessage.error(response?.message || response?.error || '保存事件图元素失败')
            }
          } catch (error) {
            console.error('保存事件图元素失败:', error)
            ElMessage.error(`保存事件图元素失败: ${error.message || '未知错误'}`)
          }
        } else {
          ElMessage.success('事件图保存成功')
          router.push(`/event-graph/detail/${graphId.value}`)
        }
      }
    } catch (error) {
      console.error('保存事件图失败:', error)
      ElMessage.error(`保存事件图失败: ${error.message || '未知错误'}`)
    } finally {
      loading.value = false
    }
  })
}

// 返回列表
const goBack = () => {
  // 如果是从详情页来的，返回详情页
  if (route.query.action) {
    router.push(`/event-graph/detail/${graphId.value}`)
  } else {
  router.push('/event-graph/list')
  }
}

onMounted(() => {
  fetchEventGraphDetail()
  
  // 检查URL查询参数
  const action = route.query.action
  if (action === 'addNode') {
    // 在获取事件图详情后自动打开添加节点对话框
    setTimeout(() => {
      addNode()
    }, 500) // 给fetchEventGraphDetail一些时间加载数据
  } else if (action === 'addEdge') {
    // 在获取事件图详情后自动打开添加连接对话框
    setTimeout(() => {
      addEdge()
    }, 500) // 给fetchEventGraphDetail一些时间加载数据
  }
})
</script>

<style scoped>
.event-graph-edit-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title-area {
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 10px;
  margin-left: 20px;
}

.graph-info {
  margin-top: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 15px;
  border-left: 4px solid #409eff;
}

.graph-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.graph-info .description {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

.graph-form {
  max-width: 1200px;
}

.graph-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.graph-canvas {
  min-height: 400px;
  border: 1px dashed #dcdfe6;
  background-color: #f5f7fa;
}

.mock-graph-canvas {
  padding: 20px;
  min-height: 400px;
}

.empty-graph {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #909399;
}

.node-list {
  padding: 10px;
}

.input-new-tag {
  width: 90px;
  margin-right: 10px;
  vertical-align: bottom;
}

.button-new-tag {
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}

.date-input-wrapper {
  display: flex;
  align-items: center;
}

.date-input {
  flex: 1;
  margin-right: 8px;
}

.date-picker {
  width: 35px;
  padding: 0;
}

.date-picker :deep(.el-input__wrapper) {
  padding: 0 8px;
}

.date-picker :deep(.el-input__inner) {
  display: none;
}

.date-picker :deep(.el-input__suffix) {
  justify-content: center;
  width: 100%;
}

.description-cell {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 