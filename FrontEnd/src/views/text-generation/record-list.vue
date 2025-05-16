<template>
  <div class="record-list-container">
    <div class="page-header">
      <h2>文本生成记录</h2>
    </div>

    <el-card class="filter-container">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="事件图ID">
          <el-input v-model="queryParams.eventGraphId" placeholder="输入事件图ID" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="风格ID">
          <el-input v-model="queryParams.styleId" placeholder="输入风格ID" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="table-container">
      <el-table v-loading="loading" :data="recordList" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="eventGraphId" label="事件图ID" width="100" />
        <el-table-column prop="styleId" label="风格ID" width="100" />
        <el-table-column label="内容" show-overflow-tooltip>
          <template #default="scope">
            <div class="content-preview">{{ scope.row.content }}</div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="viewDetail(scope.row.id)">查看详情</el-button>
            <el-button link type="primary" size="small" @click="viewEventGraphRecords(scope.row.eventGraphId)">事件图记录</el-button>
            <el-popconfirm title="确定删除此记录?" @confirm="handleDelete(scope.row.id)">
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
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAllGeneratedTexts, deleteGeneratedText } from '@/api/generatedText'

const router = useRouter()
const loading = ref(false)
const recordList = ref([])
const total = ref(0)

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  eventGraphId: '',
  styleId: ''
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  return dateString
}

// 获取生成记录列表
const fetchRecordList = async () => {
  // 每次获取数据前先清空现有数据
  recordList.value = []
  
  // 设置加载状态
  loading.value = true
  console.log('开始获取生成记录列表...')
  
  try {
    // 使用API获取最新的所有记录
    const response = await getAllGeneratedTexts()
    console.log('获取到API响应:', response)
    
    let allRecords = [];
    
    if (Array.isArray(response)) {
      allRecords = response;
      console.log(`直接获取到${allRecords.length}条记录`)
    } else if (response && response.success && Array.isArray(response.data)) {
      allRecords = response.data;
      console.log(`从响应data字段获取到${allRecords.length}条记录`)
    } else {
      // 处理错误情况
      console.error('获取记录失败，服务器返回了非预期格式的数据:', response)
      ElMessage.error('获取生成记录失败：无效数据格式')
      recordList.value = []
      total.value = 0
      return
    }
    
    // 根据查询参数过滤结果
    const filteredData = filterRecords(allRecords);
    console.log(`过滤后剩余${filteredData.length}条记录`)
    
    // 更新总数
    total.value = filteredData.length;
    
    // 如果当前页码超出范围，重置为第一页
    const maxPage = Math.ceil(filteredData.length / queryParams.limit) || 1;
    if (queryParams.page > maxPage) {
      console.log(`当前页码(${queryParams.page})超出最大页码(${maxPage})，重置为第一页`);
      queryParams.page = 1;
    }
    
    // 前端分页处理
    const start = (queryParams.page - 1) * queryParams.limit;
    const end = start + queryParams.limit;
    recordList.value = filteredData.slice(start, end);
    console.log(`当前页显示${recordList.value.length}条记录`);
  } catch (error) {
    console.error('获取生成记录列表失败:', error)
    ElMessage.error(`获取生成记录列表失败: ${error.message || '未知错误'}`)
    recordList.value = []
    total.value = 0
  } finally {
    loading.value = false
    console.log('记录列表加载完成')
  }
}

// 根据查询参数过滤记录
const filterRecords = (records) => {
  return records.filter(record => {
    // 过滤事件图ID
    if (queryParams.eventGraphId && record.eventGraphId.toString() !== queryParams.eventGraphId) {
      return false;
    }
    
    // 过滤风格ID
    if (queryParams.styleId && record.styleId && record.styleId.toString() !== queryParams.styleId) {
      return false;
    }
    
    return true;
  });
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
  fetchRecordList()
}

// 重置搜索条件
const resetQuery = () => {
  queryParams.eventGraphId = ''
  queryParams.styleId = ''
  handleSearch()
}

// 页码改变
const handleCurrentChange = (page) => {
  queryParams.page = page
  fetchRecordList()
}

// 每页条数改变
const handleSizeChange = (size) => {
  queryParams.limit = size
  fetchRecordList()
}

// 查看详情
const viewDetail = (id) => {
  router.push(`/text-generation/detail/${id}`)
}

// 查看指定事件图的所有生成记录
const viewEventGraphRecords = (eventGraphId) => {
  router.push(`/text-generation/records/${eventGraphId}`)
}

// 删除记录
const handleDelete = async (id) => {
  try {
    // 设置加载状态
    loading.value = true
    console.log('开始删除文本记录，ID:', id)
    
    // 调用删除API
    await deleteGeneratedText(id)
    
    // 删除成功提示
    ElMessage.success('删除成功')
    console.log('删除成功，开始强制刷新页面')
    
    // 立即从当前显示的记录中移除
    recordList.value = recordList.value.filter(record => record.id !== id)
    
    // 定义一个轮询函数进行多次刷新尝试
    let refreshAttempts = 0;
    const maxAttempts = 3;
    
    const attemptRefresh = async () => {
      refreshAttempts++;
      console.log(`第${refreshAttempts}次尝试刷新记录列表...`);
      
      try {
        await fetchRecordList();
        console.log('刷新成功');
      } catch (error) {
        console.error(`第${refreshAttempts}次刷新失败:`, error);
        
        // 如果还没到最大尝试次数，继续重试
        if (refreshAttempts < maxAttempts) {
          setTimeout(attemptRefresh, 500);
        } else {
          console.log('达到最大尝试次数，不再重试');
        }
      }
    };
    
    // 开始第一次刷新尝试
    setTimeout(attemptRefresh, 300);
  } catch (error) {
    console.error('删除文本记录失败:', error)
    ElMessage.error(`删除失败: ${error.message || '未知错误'}`)
    loading.value = false
  }
}

onMounted(() => {
  fetchRecordList()
})
</script>

<style scoped>
.record-list-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  align-items: center;
}

.content-preview {
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 