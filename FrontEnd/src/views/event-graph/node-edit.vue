<template>
  <div class="node-edit-container">
    <div class="page-header">
      <h2>编辑事件节点</h2>
      <div class="header-actions">
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>

    <div class="main-content" v-loading="loading">
      <template v-if="nodeId">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          class="node-form"
        >
          <el-form-item label="事件图ID" prop="eventGraphId">
            <el-input v-model="form.eventGraphId" disabled />
          </el-form-item>
          
          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入事件标题" />
          </el-form-item>
          
          <el-form-item label="描述" prop="description">
            <el-input 
              v-model="form.description" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入事件描述"
            />
          </el-form-item>
          
          <el-form-item label="位置" prop="location">
            <el-input v-model="form.location" placeholder="事件发生的地点" />
          </el-form-item>
          
          <el-form-item label="开始时间" prop="startTime">
            <div class="date-input-wrapper">
              <el-input v-model="form.startTimeText" placeholder="格式：YYYY-MM-DD" class="date-input" @input="updateStartTime" />
              <el-date-picker
                v-model="form.startTime"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                class="date-picker"
                @change="updateStartTimeFromPicker"
              />
            </div>
          </el-form-item>
          
          <el-form-item label="结束时间" prop="endTime">
            <div class="date-input-wrapper">
              <el-input v-model="form.endTimeText" placeholder="格式：YYYY-MM-DD" class="date-input" @input="updateEndTime" />
              <el-date-picker
                v-model="form.endTime"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                class="date-picker"
                @change="updateEndTimeFromPicker"
              />
            </div>
          </el-form-item>
          
          <el-form-item label="标签" prop="labels">
            <el-tag
              v-for="tag in form.labels"
              :key="tag"
              closable
              @close="handleRemoveTag(tag)"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="inputVisible"
              ref="tagInputRef"
              v-model="inputValue"
              class="tag-input"
              size="small"
              @keyup.enter="handleInputConfirm"
              @blur="handleInputConfirm"
            />
            <el-button v-else class="button-new-tag" size="small" @click="showInput">
              + 新标签
            </el-button>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
            <el-button type="danger" @click="handleDelete" :loading="deleting">删除</el-button>
          </el-form-item>
        </el-form>
      </template>
      <el-empty v-else description="未找到节点信息" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEventNode, updateEventNode, deleteEventNode } from '@/api/eventGraph'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const tagInputRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const inputVisible = ref(false)
const inputValue = ref('')

// 从路由获取节点ID
const nodeId = ref(route.params.id || '')

// 表单数据
const form = reactive({
  eventGraphId: '',
  title: '',
  description: '',
  location: '',
  startTime: '',
  endTime: '',
  startTimeText: '',
  endTimeText: '',
  labels: []
})

// 存储原始表单数据用于比较变更
const originalForm = reactive({
  eventGraphId: '',
  title: '',
  description: '',
  location: '',
  startTime: '',
  endTime: '',
  labels: []
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入事件标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入事件描述', trigger: 'blur' }
  ]
}

// 获取节点数据
const fetchNodeData = async () => {
  if (!nodeId.value) {
    ElMessage.error('未找到节点ID')
    return
  }
  
  loading.value = true
  try {
    const response = await getEventNode(nodeId.value)
    
    // 根据API返回的嵌套数据结构来处理
    if (response && response.success && response.data) {
      const nodeData = response.data
      form.eventGraphId = nodeData.eventGraphId || ''
      form.title = nodeData.title || ''
      form.description = nodeData.description || ''
      form.location = nodeData.location || ''
      form.startTime = nodeData.startTime || ''
      form.endTime = nodeData.endTime || ''
      
      // 同步文本框值
      form.startTimeText = nodeData.startTime || ''
      form.endTimeText = nodeData.endTime || ''
      
      form.labels = nodeData.labels || []
      
      // 保存原始数据用于比较
      Object.assign(originalForm, {
        eventGraphId: nodeData.eventGraphId || '',
        title: nodeData.title || '',
        description: nodeData.description || '',
        location: nodeData.location || '',
        startTime: nodeData.startTime || '',
        endTime: nodeData.endTime || '',
        labels: [...(nodeData.labels || [])]
      })
    } else {
      ElMessage.error(response?.message || response?.error || '获取节点详情失败')
    }
  } catch (error) {
    console.error('获取节点详情失败:', error)
    ElMessage.error('获取节点详情失败')
  } finally {
    loading.value = false
  }
}

// 更新开始时间
const updateStartTime = (val) => {
  form.startTime = form.startTimeText;
}

// 更新结束时间
const updateEndTime = (val) => {
  form.endTime = form.endTimeText;
}

// 监听日期选择器变化并同步到文本框
const updateStartTimeFromPicker = (val) => {
  if (val) {
    form.startTimeText = val;
  }
}

// 监听日期选择器变化并同步到文本框
const updateEndTimeFromPicker = (val) => {
  if (val) {
    form.endTimeText = val;
  }
}

// 提交表单
const submitForm = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    
    submitting.value = true
    try {
      // 创建一个只包含已修改字段的对象
      const updatedFields = {};
      
      // 比较字段是否有变化，只发送变化的字段
      if (form.title !== originalForm.title) updatedFields.title = form.title;
      if (form.description !== originalForm.description) updatedFields.description = form.description;
      if (form.location !== originalForm.location) updatedFields.location = form.location;
      if (form.startTime !== originalForm.startTime) updatedFields.startTime = form.startTime;
      if (form.endTime !== originalForm.endTime) updatedFields.endTime = form.endTime;
      
      // 对于数组类型的字段需要进行深度比较
      const labelsChanged = form.labels.length !== originalForm.labels.length || 
        form.labels.some((tag, index) => tag !== originalForm.labels[index]);
      
      if (labelsChanged) updatedFields.labels = form.labels;
      
      // 如果没有字段变更，提示用户
      if (Object.keys(updatedFields).length === 0) {
        ElMessage.info('没有字段被修改，不需要保存');
        submitting.value = false;
        return;
      }
      
      const response = await updateEventNode(nodeId.value, updatedFields);
      
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

// 显示标签输入框
const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    tagInputRef.value.focus()
  })
}

// 处理标签输入确认
const handleInputConfirm = () => {
  if (inputValue.value) {
    if (!form.labels.includes(inputValue.value)) {
      form.labels.push(inputValue.value)
    }
  }
  inputVisible.value = false
  inputValue.value = ''
}

// 删除标签
const handleRemoveTag = (tag) => {
  form.labels = form.labels.filter(item => item !== tag)
}

// 删除节点
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除该节点吗？相关的所有关系也会被删除!', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    deleting.value = true
    const response = await deleteEventNode(nodeId.value)
    
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
  fetchNodeData()
})
</script>

<style scoped>
.node-edit-container {
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

.node-form {
  max-width: 800px;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 8px;
}

.tag-input {
  width: 100px;
  margin-right: 8px;
  display: inline-block;
  vertical-align: bottom;
}

.button-new-tag {
  margin-bottom: 8px;
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
</style> 