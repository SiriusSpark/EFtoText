<template>
  <div class="text-style-edit-container">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑风格' : '创建风格' }}</h2>
    </div>
    
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="style-form"
      v-loading="loading"
    >
      <el-form-item label="风格名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入风格名称" />
      </el-form-item>
      
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入风格描述"
        />
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
        <el-button @click="goBack">取消</el-button>
        <el-button v-if="isEdit" type="danger" @click="handleDelete" :loading="deleting">删除</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTextStyleDetail, createTextStyle, updateTextStyle, deleteTextStyle } from '@/api/textStyle'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const deleting = ref(false)

// 是否为编辑模式
const isEdit = computed(() => {
  return route.params.id !== undefined
})

// 风格ID
const styleId = computed(() => {
  return route.params.id
})

// 表单数据
const form = reactive({
  name: '',
  description: ''
})

// 表单校验规则
const rules = {
  name: [
    { required: true, message: '请输入风格名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入风格描述', trigger: 'blur' }
  ]
}

// 获取风格详情
const fetchTextStyleDetail = async () => {
  if (!isEdit.value) return
  
  loading.value = true
  try {
    console.log('获取风格详情:', styleId.value)
    const data = await getTextStyleDetail(styleId.value)
    console.log('风格详情数据:', data)
    
    // 填充表单
    form.name = data.name || ''
    form.description = data.description || ''
  } catch (error) {
    console.error('获取风格详情失败:', error)
    ElMessage.error('获取风格详情失败')
  } finally {
    loading.value = false
  }
}

// 提交表单
const submitForm = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    
    submitting.value = true
    try {
      if (isEdit.value) {
        await updateTextStyle(styleId.value, {
          name: form.name,
          description: form.description
        })
        ElMessage.success('更新成功')
      } else {
        await createTextStyle({
          name: form.name,
          description: form.description
        })
        ElMessage.success('创建成功')
      }
      
      router.push('/text-style/list')
    } catch (error) {
      console.error('保存风格失败:', error)
      ElMessage.error('保存风格失败')
    } finally {
      submitting.value = false
    }
  })
}

// 删除风格
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除该风格吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    deleting.value = true
    await deleteTextStyle(styleId.value)
    ElMessage.success('删除成功')
    router.push('/text-style/list')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除风格失败:', error)
      ElMessage.error('删除风格失败')
    }
  } finally {
    deleting.value = false
  }
}

// 返回列表
const goBack = () => {
  router.push('/text-style/list')
}

onMounted(() => {
  fetchTextStyleDetail()
})
</script>

<style scoped>
.text-style-edit-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.style-form {
  max-width: 800px;
}
</style> 