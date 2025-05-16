<template>
  <div class="edge-edit-container">
    <div class="page-header">
      <h2>编辑事件关系</h2>
      <div class="header-actions">
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>

    <div class="main-content" v-loading="loading">
      <template v-if="edgeId">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          class="edge-form"
        >
          <el-form-item label="事件图ID" prop="eventGraphId">
            <el-input v-model="form.eventGraphId" disabled />
          </el-form-item>
          
          <el-form-item label="起始节点" prop="sourceId">
            <el-select 
              v-model="form.sourceId" 
              placeholder="选择起始节点"
              filterable
              :loading="nodesLoading"
            >
              <el-option
                v-for="node in nodes"
                :key="node.id"
                :label="node.title"
                :value="node.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="关系类型" prop="type">
            <el-select v-model="form.type" placeholder="选择关系类型" @change="handleTypeChange">
              <el-option-group label="时间关系">
                <el-option label="先于" value="PRECEDES" />
                <el-option label="后于" value="FOLLOWS" />
                <el-option label="同时" value="CONCURRENT_WITH" />
              </el-option-group>
              <el-option-group label="因果关系">
                <el-option label="导致" value="CAUSES" />
                <el-option label="结果" value="RESULTS_IN" />
              </el-option-group>
              <el-option-group label="共指关系">
                <el-option label="共指" value="COREFERS_TO" />
              </el-option-group>
              <el-option-group label="子事件关系">
                <el-option label="包含子事件" value="HAS_SUBEVENT" />
                <el-option label="属于" value="SUBEVENT_OF" />
              </el-option-group>
            </el-select>
          </el-form-item>
          
          <el-form-item v-if="showStrength" label="关系强度" prop="strength">
            <el-select v-model="form.strength" placeholder="选择关系强度">
              <el-option label="高" value="高" />
              <el-option label="中" value="中" />
              <el-option label="低" value="低" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="目标节点" prop="targetId">
            <el-select 
              v-model="form.targetId" 
              placeholder="选择目标节点"
              filterable
              :loading="nodesLoading"
            >
              <el-option
                v-for="node in nodes"
                :key="node.id"
                :label="node.title"
                :value="node.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
            <el-button type="danger" @click="handleDelete" :loading="deleting">删除</el-button>
          </el-form-item>
        </el-form>
      </template>
      <el-empty v-else description="未找到关系信息" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEventEdge, updateEventEdge, deleteEventEdge, getEventGraphElements } from '@/api/eventGraph'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const nodesLoading = ref(false)
const nodes = ref([])

// 从路由获取关系ID
const edgeId = ref(route.params.id || '')

// 表单数据
const form = reactive({
  eventGraphId: '',
  sourceId: '',
  targetId: '',
  type: '',
  strength: ''
})

// 需要显示强度选择的关系类型
const causalTypes = ['CAUSES', 'RESULTS_IN'];

// 是否显示强度选择
const showStrength = computed(() => {
  return causalTypes.includes(form.type);
});

// 处理关系类型变更
const handleTypeChange = (value) => {
  // 如果不是因果关系，则清除强度
  if (!causalTypes.includes(value)) {
    form.strength = '';
  } else if (!form.strength) {
    // 如果是因果关系但还没有设置强度，则设置默认值
    form.strength = '中';
  }
};

// 表单验证规则
const rules = {
  sourceId: [
    { required: true, message: '请选择起始节点', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择关系类型', trigger: 'change' }
  ],
  targetId: [
    { required: true, message: '请选择目标节点', trigger: 'change' }
  ],
  strength: [
    { 
      required: true, 
      message: '请选择关系强度', 
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (showStrength.value && !value) {
          callback(new Error('请选择关系强度'));
        } else {
          callback();
        }
      }
    }
  ]
}

// 获取关系数据
const fetchEdgeData = async () => {
  if (!edgeId.value) {
    ElMessage.error('未找到关系ID')
    return
  }
  
  loading.value = true
  try {
    const response = await getEventEdge(edgeId.value)
    console.log('关系详情响应:', response)
    
    // 根据API返回的嵌套数据结构来处理
    if (response && response.success && response.data) {
      const edgeData = response.data
      form.eventGraphId = edgeData.eventGraphId || ''
      form.sourceId = edgeData.sourceId || ''
      form.targetId = edgeData.targetId || ''
      form.type = edgeData.type || ''
      form.strength = edgeData.strength || ''
      
      // 加载该事件图的所有节点
      fetchGraphNodes(edgeData.eventGraphId)
    } else {
      ElMessage.error(response?.message || response?.error || '获取关系详情失败')
    }
  } catch (error) {
    console.error('获取关系详情失败:', error)
    ElMessage.error('获取关系详情失败')
  } finally {
    loading.value = false
  }
}

// 获取事件图节点
const fetchGraphNodes = async (graphId) => {
  if (!graphId) return
  
  nodesLoading.value = true
  try {
    const response = await getEventGraphElements(graphId)
    if (response && response.nodes) {
      nodes.value = response.nodes
    }
  } catch (error) {
    console.error('获取事件图节点失败:', error)
  } finally {
    nodesLoading.value = false
  }
}

// 提交表单
const submitForm = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    
    submitting.value = true
    try {
      // 构建提交数据，如果不是因果关系，不包含强度
      const submitData = {
        eventGraphId: form.eventGraphId,
        sourceId: form.sourceId,
        targetId: form.targetId,
        type: form.type
      };
      
      // 只有因果关系才有强度
      if (causalTypes.includes(form.type)) {
        submitData.strength = form.strength;
      }
      
      const response = await updateEventEdge(edgeId.value, submitData)
      
      // 检查响应是否成功
      if (response && response.success) {
        ElMessage.success('保存成功')
        goBack()
      } else {
        ElMessage.error(response?.message || response?.error || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      ElMessage.error('保存失败')
    } finally {
      submitting.value = false
    }
  })
}

// 删除关系
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除该关系吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    deleting.value = true
    const response = await deleteEventEdge(edgeId.value)
    
    // 检查响应是否成功
    if (response && response.success) {
      ElMessage.success('删除成功')
      goBack()
    } else {
      ElMessage.error(response?.message || response?.error || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  } finally {
    deleting.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchEdgeData()
})
</script>

<style scoped>
.edge-edit-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.main-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.edge-form {
  max-width: 600px;
}
</style> 