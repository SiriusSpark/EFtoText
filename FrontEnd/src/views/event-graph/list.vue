<template>
  <div class="event-graph-list-container">
    <div class="header">
      <div>
      <h2>事件图列表</h2>
      </div>
      <div class="header-buttons">
        <el-input
          v-model="searchQuery"
          placeholder="搜索事件图"
          prefix-icon="Search"
          clearable
          @input="handleSearch"
          class="search-input"
        />
      <el-button type="primary" @click="handleCreate">创建事件图</el-button>
      </div>
    </div>
    
    <div class="content-wrapper">
      <div class="content">
    <el-table
      v-loading="loading"
          :data="filteredEventGraphList"
      border
    >
          <el-table-column label="ID" width="60">
        <template #default="scope">
          {{ scope.$index + 1 + (queryParams.page - 1) * queryParams.limit }}
        </template>
      </el-table-column>
          <el-table-column prop="title" label="标题" width="150" />
          <el-table-column prop="description" label="描述" min-width="300">
            <template #default="scope">
              <div class="description-cell">
                {{ scope.row.description }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="220">
        <template #default="scope">
          {{ formatDate(scope.row.createdAt) }}
        </template>
      </el-table-column>
          <el-table-column label="更新时间" width="220">
        <template #default="scope">
          {{ formatDate(scope.row.updatedAt) }}
        </template>
      </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <el-dropdown trigger="hover" placement="bottom-start">
            <el-button type="info" plain size="small" style="color: #909399; background-color: #f4f4f5; border-color: #dcdfe6">
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleView(scope.row.id)">
                  <el-icon><View /></el-icon>
                  <span style="margin-left: 8px;">详情</span>
                </el-dropdown-item>
                <el-dropdown-item @click="handleVisualize(scope.row.id)">
                  <el-icon><Share /></el-icon>
                  <span style="margin-left: 8px;">可视化</span>
                </el-dropdown-item>
                <el-dropdown-item @click="handleGenerate(scope.row.id)">
                  <el-icon><DocumentAdd /></el-icon>
                  <span style="margin-left: 8px;">生成文本</span>
                </el-dropdown-item>
                <el-dropdown-item @click="handleRecords(scope.row.id)">
                  <el-icon><List /></el-icon>
                  <span style="margin-left: 8px;">生成记录</span>
                </el-dropdown-item>
                <el-dropdown-item divided @click="confirmDelete(scope.row.id)">
                  <el-icon><Delete /></el-icon>
                  <span style="margin-left: 8px; color: #F56C6C;">删除</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next, jumper"
            :total="filteredTotal"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
        </div>
      </div>
    </div>
    
    <!-- 创建事件图对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建事件图"
      width="500px"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="createForm.title" placeholder="请输入事件图标题" />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入事件图描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreateForm" :loading="createLoading">创建</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEventGraphList, deleteEventGraph, createEventGraph } from '@/api/eventGraph'
import { MoreFilled, View, Share, DocumentAdd, List, Delete, Search } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const eventGraphList = ref([])
const total = ref(0)
const searchQuery = ref('') // 搜索查询

// 创建事件图对话框相关
const createDialogVisible = ref(false)
const createLoading = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  title: '',
  description: ''
})

// 存储过滤后的总数
const filteredTotal = ref(0)

// 过滤后的事件图列表
const filteredEventGraphList = computed(() => {
  if (!searchQuery.value) {
    // 不搜索时，直接返回当前页的数据
    const start = (queryParams.page - 1) * queryParams.limit;
    const end = start + queryParams.limit;
    return eventGraphList.value.slice(start, end);
  }
  
  // 搜索时，先过滤再分页
  const query = searchQuery.value.toLowerCase();
  const filtered = eventGraphList.value.filter(item => 
    item.title.toLowerCase().includes(query) || 
    item.description.toLowerCase().includes(query)
  );
  
  // 返回当前页的数据
  const start = (queryParams.page - 1) * queryParams.limit;
  const end = start + queryParams.limit;
  return filtered.slice(start, end);
})

// 监听搜索条件变化，更新总数
watch([searchQuery, eventGraphList], () => {
  if (!searchQuery.value) {
    filteredTotal.value = eventGraphList.value.length;
  } else {
    const query = searchQuery.value.toLowerCase();
    const filtered = eventGraphList.value.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query)
    );
    filteredTotal.value = filtered.length;
  }
})

// 处理搜索
const handleSearch = () => {
  // 重置页码
  queryParams.page = 1;
  // 搜索逻辑由计算属性和watch处理
  console.log('搜索查询:', searchQuery.value);
}

// 表单验证规则
const createRules = {
  title: [
    { required: true, message: '请输入事件图标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入事件图描述', trigger: 'blur' }
  ]
}

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  title: '',
  sort: '-updatedTime'  // 默认按更新时间降序排序
})

// 格式化日期的函数
const formatDate = (dateString) => {
  if (!dateString) return '';
  // 直接返回后端格式化好的时间字符串
  return dateString;
}

// 获取事件图列表
const fetchEventGraphList = async () => {
  loading.value = true
  try {
    console.log('开始请求事件图列表...')
    const response = await getEventGraphList()
    console.log('事件图列表响应:', response)
    
    // 正确处理嵌套的数据结构
    if (response && response.success && Array.isArray(response.data)) {
      eventGraphList.value = response.data
      filteredTotal.value = response.data.length
    } else if (Array.isArray(response)) {
      eventGraphList.value = response
      filteredTotal.value = response.length
    } else {
      eventGraphList.value = []
      filteredTotal.value = 0
      
      // 如果有错误信息，显示给用户
      if (response && (response.message || response.error)) {
        ElMessage.error(response.message || response.error)
      }
    }
  } catch (error) {
    console.error('获取事件图列表失败:', error)
    ElMessage.error('获取事件图失败')
    eventGraphList.value = []
    filteredTotal.value = 0
  } finally {
    loading.value = false
  }
}

// 页码改变
const handleCurrentChange = (page) => {
  queryParams.page = page
  fetchEventGraphList()
}

// 每页条数改变
const handleSizeChange = (size) => {
  queryParams.limit = size
  fetchEventGraphList()
}

// 创建事件图
const handleCreate = () => {
  // 重置表单
  createForm.title = ''
  createForm.description = ''
  // 显示对话框
  createDialogVisible.value = true
}

// 提交创建事件图表单
const submitCreateForm = () => {
  createFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    createLoading.value = true
    try {
      // 调用API创建事件图
      const response = await createEventGraph(createForm)
      
      if (response && response.success) {
        ElMessage.success('创建成功')
        createDialogVisible.value = false
        
        // 刷新列表
        await fetchEventGraphList()
      } else {
        ElMessage.error(response?.message || response?.error || '创建失败')
      }
    } catch (error) {
      console.error('创建事件图失败:', error)
      ElMessage.error('创建事件图失败')
    } finally {
      createLoading.value = false
    }
  })
}

// 查看事件图
const handleView = (id) => {
  router.push(`/event-graph/detail/${id}`)
}

// 可视化事件图
const handleVisualize = (id) => {
  router.push(`/event-graph/visualize/${id}`)
}

// 使用事件图生成文本
const handleGenerate = (id) => {
  router.push(`/text-generation/create?eventGraphId=${id}`)
}

// 查看事件图的生成记录
const handleRecords = (id) => {
  console.log('跳转到事件图生成记录页面，事件图ID:', id)
  router.push(`/text-generation/records/${id}`)
}

// 确认删除
const confirmDelete = (id) => {
  ElMessageBox.confirm('确定要删除此事件图吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    handleDelete(id)
  }).catch(() => {
    // 用户取消删除
  })
}

// 删除事件图
const handleDelete = async (id) => {
  try {
    const response = await deleteEventGraph(id)
    
    // 检查响应是否成功
    if (response && response.success) {
      ElMessage.success('删除成功')
      await fetchEventGraphList()
    } else {
      ElMessage.error(response?.message || response?.error || '删除事件图失败')
    }
  } catch (error) {
    console.error('删除事件图失败:', error)
    ElMessage.error('删除事件图失败')
  }
}

onMounted(() => {
  fetchEventGraphList()
})
</script>

<style scoped>
.event-graph-list-container {
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
  align-items: center;
}

.search-input {
  width: 250px;
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

.description-cell {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  max-height: 3em;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
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

:deep(.el-dropdown-menu) {
  padding: 5px 0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 21, 41, 0.1);
  border: none;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  line-height: 1.5;
  min-width: 140px;
  transition: all 0.3s;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: rgba(24, 144, 255, 0.1);
  color: #1890FF;
}

:deep(.el-dropdown-menu__item.is-divided) {
  border-top: 1px solid rgba(235, 238, 245, 0.5);
  margin: 6px 0;
}

:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 21, 41, 0.1);
  background-color: rgba(240, 245, 250, 0.95);
  backdrop-filter: blur(10px);
}

:deep(.el-dialog__header) {
  padding: 20px;
  border-bottom: 1px solid rgba(235, 238, 245, 0.5);
  margin: 0;
}

:deep(.el-dialog__body) {
  padding: 30px 20px;
}

:deep(.el-dialog__title) {
  color: #1890FF;
  font-weight: 600;
  font-size: 18px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input__wrapper), :deep(.el-textarea__wrapper) {
  background-color: rgba(240, 245, 250, 0.8);
  box-shadow: 0 0 0 1px rgba(24, 144, 255, 0.1) inset;
  transition: all 0.3s;
}

:deep(.el-input__wrapper:hover), :deep(.el-textarea__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(24, 144, 255, 0.3) inset;
}

:deep(.el-input__wrapper:focus-within), :deep(.el-textarea__wrapper:focus-within) {
  box-shadow: 0 0 0 1px #1890FF inset;
}

:deep(.el-button--primary) {
  background: linear-gradient(90deg, #1890FF 0%, #4DABFF 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
  transition: all 0.3s;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(90deg, #40A9FF 0%, #69B7FF 100%);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  transform: translateY(-1px);
}
</style> 