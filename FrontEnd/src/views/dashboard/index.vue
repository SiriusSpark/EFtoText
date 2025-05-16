<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>事件图总数</span>
            </div>
          </template>
          <div class="card-content">
            <div class="number">{{ eventGraphCount }}</div>
            <div class="icon">
              <el-icon><Connection /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>风格模板总数</span>
            </div>
          </template>
          <div class="card-content">
            <div class="number">{{ styleCount }}</div>
            <div class="icon">
              <el-icon><Brush /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>生成文本总数</span>
            </div>
          </template>
          <div class="card-content">
            <div class="number">{{ textCount }}</div>
            <div class="icon">
              <el-icon><Document /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近生成的文本</span>
              <el-button class="button" link @click="goToTextGeneration">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentTexts" stripe style="width: 100%">
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="createdTime" label="创建时间" width="180" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === '已完成' ? 'success' : 'warning'">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button link type="primary" size="small" @click="viewTextDetail(scope.row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Connection, Brush, Document } from '@element-plus/icons-vue'

const router = useRouter()

// 模拟数据
const eventGraphCount = ref(5)
const styleCount = ref(8)
const textCount = ref(12)

const recentTexts = ref([
  { id: 1, title: '历史故事：三国演义', createdTime: '2023-05-01 14:30:00', status: '已完成' },
  { id: 2, title: '科幻小说：星际旅行', createdTime: '2023-05-02 09:20:00', status: '已完成' },
  { id: 3, title: '童话故事：小红帽', createdTime: '2023-05-03 16:45:00', status: '处理中' },
  { id: 4, title: '悬疑故事：无人岛', createdTime: '2023-05-04 11:10:00', status: '已完成' },
])

// 获取数据
onMounted(() => {
  // 这里应该实际调用API获取数据
  // fetchDashboardData()
})

// 跳转到文本生成页面
const goToTextGeneration = () => {
  router.push('/text-generation/list')
}

// 查看文本详情
const viewTextDetail = (id) => {
  router.push(`/text-generation/detail/${id}`)
}

// 实际获取数据的函数，后续接入API
// const fetchDashboardData = async () => {
//   try {
//     // 获取事件图数量
//     // const eventGraphResponse = await ... 
//     // eventGraphCount.value = eventGraphResponse.data.total
//     
//     // 获取风格模板数量
//     // const styleResponse = await ...
//     // styleCount.value = styleResponse.data.total
//     
//     // 获取生成文本数量
//     // const textResponse = await ...
//     // textCount.value = textResponse.data.total
//     
//     // 获取最近生成的文本
//     // const recentTextsResponse = await ...
//     // recentTexts.value = recentTextsResponse.data.list
//   } catch (error) {
//     console.error('获取仪表盘数据失败', error)
//   }
// }
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.number {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
}

.icon {
  font-size: 40px;
  color: #dcdfe6;
}

:deep(.el-icon) {
  font-size: inherit;
}
</style> 