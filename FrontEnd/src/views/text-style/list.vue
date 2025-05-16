<template>
  <div class="text-style-list-container">
    <div class="header">
      <div>
        <h2>文本风格列表</h2>
      </div>
      <div class="header-buttons">
        <el-input
          v-model="queryParams.name"
          placeholder="搜索风格名称"
          prefix-icon="Search"
          clearable
          @clear="fetchStyleList"
          @keyup.enter="fetchStyleList"
          class="search-input"
        />
        <el-button type="primary" @click="handleCreate">创建风格</el-button>
      </div>
    </div>
    
    <div class="content-wrapper">
      <div class="content">
        <el-table
          v-loading="loading"
          :data="tableData"
          border
        >
          <el-table-column label="ID" width="80">
            <template #default="scope">
              {{ scope.$index + 1 + (queryParams.page - 1) * queryParams.limit }}
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名称" width="150" />
          <el-table-column prop="description" label="描述" min-width="400" show-overflow-tooltip />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="scope">
              <el-button link type="primary" size="small" @click="handleEdit(scope.row.id)">编辑</el-button>
              <el-popconfirm title="确定删除此项?" @confirm="handleDelete(scope.row.id)">
                <template #reference>
                  <el-button link type="danger" size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="queryParams.page"
            v-model:page-size="queryParams.limit"
            :page-sizes="[15, 30, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getTextStyleList, deleteTextStyle } from '@/api/textStyle'

const router = useRouter()
const loading = ref(false)
const styleList = ref([])

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 15,
  name: '',
  sort: '-updatedTime'  // 默认按更新时间降序排序
})

// 获取风格列表
const fetchStyleList = async () => {
  loading.value = true
  try {
    console.log('获取文本风格列表...')
    const response = await getTextStyleList()
    console.log('文本风格列表数据:', response)
    styleList.value = response || []
    loading.value = false
  } catch (error) {
    console.error('获取风格列表失败:', error)
    ElMessage.error('获取风格列表失败')
    loading.value = false
  }
}

// 页码改变
const handleCurrentChange = (page) => {
  queryParams.page = page
  fetchStyleList()
}

// 每页条数改变
const handleSizeChange = (size) => {
  queryParams.limit = size
  fetchStyleList()
}

// 创建风格
const handleCreate = () => {
  router.push('/text-style/create')
}

// 编辑风格
const handleEdit = (id) => {
  router.push(`/text-style/edit/${id}`)
}

// 删除风格
const handleDelete = async (id) => {
  try {
    await deleteTextStyle(id)
    ElMessage({
      type: 'success',
      message: '删除成功'
    })
    fetchStyleList() // 重新加载数据
  } catch (error) {
    console.error('删除风格失败:', error)
    ElMessage.error('删除风格失败')
  }
}

// 添加一个过滤后的数据计算属性
const filteredData = computed(() => {
  if (!queryParams.name) {
    return styleList.value;
  }
  
  return styleList.value.filter(style => 
    style.name && style.name.toLowerCase().includes(queryParams.name.toLowerCase())
  );
});

// 总数计算属性
const total = computed(() => filteredData.value.length);

// 分页后的数据
const tableData = computed(() => {
  const start = (queryParams.page - 1) * queryParams.limit;
  const end = start + queryParams.limit;
  return filteredData.value.slice(start, end);
});

onMounted(() => {
  fetchStyleList()
})
</script>

<style scoped>
.text-style-list-container {
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

.pagination-container {
  margin-top: 15px;
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
</style> 