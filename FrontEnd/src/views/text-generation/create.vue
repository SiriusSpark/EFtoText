<template>
  <div class="text-generation-create-container">
    <div class="page-header">
      <h2>生成新文本</h2>
    </div>
    
    <!-- 上半部分：表单区域 -->
    <div class="form-area">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="generation-form"
      >
        <el-form-item label="选择事件图" prop="eventGraphId">
          <el-select
            v-model="form.eventGraphId"
            placeholder="请选择事件图"
            style="width: 100%;"
            @change="handleEventGraphChange"
            value-key="id"
          >
            <el-option
              v-for="item in eventGraphs"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            >
              <span>{{ item.title }}</span>
              <span style="color: #8492a6; font-size: 13px; margin-left: 10px;">
                {{ item.description }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="选择风格" prop="styleId">
          <el-select
            v-model="form.styleId"
            placeholder="请选择文本风格"
            style="width: 100%;"
            @change="handleStyleChange"
            value-key="id"
          >
            <el-option
              v-for="item in styles"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
              <span>{{ item.name }}</span>
              <span style="color: #8492a6; font-size: 13px; margin-left: 10px;">
                {{ item.description }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-divider>预览</el-divider>
        
        <div class="preview-section" v-if="selectedEventGraph || selectedStyle">
          <div class="preview-card" v-if="selectedEventGraph">
            <h3>所选事件图</h3>
            <div class="preview-content">
              <p><strong>标题：</strong>{{ selectedEventGraph.title }}</p>
              <p><strong>描述：</strong>{{ selectedEventGraph.description }}</p>
            </div>
          </div>
          
          <div class="preview-card" v-if="selectedStyle">
            <h3>所选风格</h3>
            <div class="preview-content">
              <p><strong>名称：</strong>{{ selectedStyle.name }}</p>
              <p><strong>描述：</strong>{{ selectedStyle.description }}</p>
            </div>
          </div>
        </div>
        
        <el-form-item label="选择模型" prop="modelId">
          <el-select v-model="form.modelId" placeholder="请选择生成模型">
            <el-option label="Deepseek-AI" value="deepseek" />
            <el-option label="ChatGLM" value="chatglm" />
            <el-option label="LLaMA" value="llama" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="自定义提示">
          <el-input
            type="textarea"
            v-model="form.customPrompt"
            placeholder="可选：输入对文本生成的特殊要求，如'使用第一人称叙述'、'重点突出某个事件'等"
            :rows="3"
          ></el-input>
          <div class="form-tip">该提示将作为额外指令传给AI模型，帮助您获得更符合需求的生成结果</div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submitForm">开始生成</el-button>
          <el-button @click="goBack">返回</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 下半部分：结果区域 -->
    <div class="result-section" v-if="form.eventGraphId">
      <div class="result-layout">
        <!-- 左侧生成结果 -->
        <div class="result-area">
          <div class="result-header-with-actions">
            <h3>生成结果</h3>
            <div class="result-actions" v-if="generatedResult">
              <el-button type="primary" size="small" @click="startEditing" v-if="!isEditing && showSaveButton">编辑</el-button>
              <el-button type="success" size="small" @click="saveEditedText" v-if="isEditing">保存</el-button>
            </div>
          </div>
          <div v-if="generatedResult" class="result-content">
            <div class="result-header">
              <p><strong>标题：</strong>{{ selectedEventGraph?.title }}</p>
              <p><strong>生成时间：</strong>{{ generatedResult.createdAt }}</p>
            </div>
            <el-divider></el-divider>
            <div v-if="!isEditing" class="result-text" style="min-height: 400px; flex: 1; overflow-y: auto;">
              <p v-for="(paragraph, index) in formattedContent" :key="index">{{ paragraph }}</p>
            </div>
            <div v-else style="flex: 1; display: flex; flex-direction: column; height: 100%;">
              <el-input
                type="textarea"
                v-model="editedContent"
                :autosize="{ minRows: 20 }"
                resize="none"
                style="width: 100%; height: 100%;"
              ></el-input>
            </div>
          </div>
          <div v-else-if="loading" class="result-placeholder">
            <div class="loading-container">
              <el-icon class="loading-icon is-loading"><Loading /></el-icon>
              <p class="loading-text">正在生成文本，请耐心等待...</p>
              <p class="loading-tip">AI正在思考，这可能需要1-2分钟，请勿关闭页面</p>
            </div>
          </div>
          <div v-else class="result-placeholder">
            <el-empty description='点击"开始生成"按钮生成文本' />
          </div>
        </div>
        
        <!-- 右侧最近生成的文本 -->
        <div class="latest-area">
          <h3>最近生成的文本</h3>
          <div v-if="latestGeneratedText" class="latest-content">
            <div class="latest-header">
              <p><strong>风格：</strong>{{ latestGeneratedText.style?.name }}</p>
              <p><strong>生成时间：</strong>{{ latestGeneratedText.createdAt }}</p>
            </div>
            <el-divider></el-divider>
            <div class="latest-text">
              <p v-for="(paragraph, index) in formattedLatestContent" :key="index">{{ paragraph }}</p>
            </div>
          </div>
          <div v-else-if="latestLoading" class="latest-placeholder">
            <el-skeleton :rows="10" animated />
          </div>
          <div v-else class="latest-placeholder">
            <el-empty description="暂无最近生成的文本" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getEventGraphList } from '@/api/eventGraph'
import { getTextStyleList } from '@/api/textStyle'
import { createGeneratedText, getLatestGeneratedText, updateGeneratedText } from '@/api/generatedText'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const loading = ref(false)
const eventGraphs = ref([])
const styles = ref([])
const eventGraphLoading = ref(false)
const stylesLoading = ref(false)
const latestLoading = ref(false)
const generatedResult = ref(null)
const latestGeneratedText = ref(null)
const isEditing = ref(false)
const editedContent = ref('')
const showSaveButton = ref(false)

// 表单数据
const form = reactive({
  eventGraphId: '',
  styleId: '',
  modelId: 'deepseek',
  customPrompt: ''
})

// 格式化生成结果内容
const formattedContent = computed(() => {
  if (!generatedResult.value || !generatedResult.value.content) return [];
  return generatedResult.value.content.split('\n').filter(p => p.trim() !== '');
});

// 格式化最近生成的文本内容
const formattedLatestContent = computed(() => {
  if (!latestGeneratedText.value || !latestGeneratedText.value.content) return [];
  return latestGeneratedText.value.content.split('\n').filter(p => p.trim() !== '');
});

// 表单校验规则
const rules = {
  eventGraphId: [
    { required: true, message: '请选择事件图', trigger: 'change' }
  ],
  styleId: [
    { required: true, message: '请选择文本风格', trigger: 'change' }
  ],
  modelId: [
    { required: true, message: '请选择生成模型', trigger: 'change' }
  ]
}

// 选中的事件图
const selectedEventGraph = computed(() => {
  if (!form.eventGraphId) return null;
  return eventGraphs.value.find(item => item.id === form.eventGraphId || item.id === Number(form.eventGraphId));
})

// 选中的风格
const selectedStyle = computed(() => {
  if (!form.styleId) return null;
  return styles.value.find(item => item.id === form.styleId || item.id === Number(form.styleId));
})

// 获取事件图列表
const fetchEventGraphs = async () => {
  eventGraphLoading.value = true;
  try {
    const response = await getEventGraphList();
    
    if (response && Array.isArray(response.data)) {
      eventGraphs.value = response.data;
    } else if (response && Array.isArray(response)) {
      eventGraphs.value = response;
    } else {
      ElMessage.error('获取事件图列表失败');
    }
    
    // 如果URL中有eventGraphId参数，则预选它
    const urlEventGraphId = route.query.eventGraphId;
    if (urlEventGraphId && eventGraphs.value.length > 0) {
      // 确保转换为数字进行比较
      const eventGraphId = parseInt(urlEventGraphId);
      form.eventGraphId = eventGraphId;
      
      // 立即获取该事件图的最近生成文本
      fetchLatestGeneratedText(eventGraphId);
    } else if (eventGraphs.value.length > 0) {
      // 如果没有指定事件图ID但有事件图数据，默认选择第一个
      form.eventGraphId = eventGraphs.value[0].id;
      fetchLatestGeneratedText(eventGraphs.value[0].id);
    }
  } catch (error) {
    console.error('获取事件图列表失败:', error);
    ElMessage.error('获取事件图列表失败');
  } finally {
    eventGraphLoading.value = false;
  }
}

// 获取风格列表
const fetchStyles = async () => {
  stylesLoading.value = true;
  try {
    const response = await getTextStyleList();
    
    if (response && Array.isArray(response)) {
      styles.value = response.map(item => ({
        ...item,
        tags: item.tags || []
      }));
    } else if (response && response.success && Array.isArray(response.data)) {
      styles.value = response.data.map(item => ({
        ...item,
        tags: item.tags || []
      }));
    } else {
      ElMessage.error('获取文本风格列表失败');
    }
  } catch (error) {
    console.error('获取文本风格列表失败:', error);
    ElMessage.error('获取文本风格列表失败');
  } finally {
    stylesLoading.value = false;
  }
}

// 获取最近生成的文本
const fetchLatestGeneratedText = async (eventGraphId) => {
  if (!eventGraphId) return;
  
  latestLoading.value = true;
  try {
    const response = await getLatestGeneratedText(eventGraphId);
    
    if (response) {
      latestGeneratedText.value = response;
      
      // 如果最近生成的文本有风格，则自动选择该风格
      if (response.style && response.style.id) {
        form.styleId = response.style.id;
      }
    } else {
      latestGeneratedText.value = null;
    }
  } catch (error) {
    console.error('获取最近生成文本失败:', error);
    latestGeneratedText.value = null;
  } finally {
    latestLoading.value = false;
  }
};

// 处理事件图选择变更
const handleEventGraphChange = (id) => {
  fetchLatestGeneratedText(id);
}

// 处理风格选择变更
const handleStyleChange = (id) => {
  // 可以在这里添加逻辑，例如根据风格更新UI或预设
}

// 提交表单
const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    loading.value = true;
    generatedResult.value = null; // 清空上一次的结果
    
    try {
      const data = {
        eventGraphId: form.eventGraphId,
        styleId: form.styleId,
        customPrompt: form.customPrompt
      };
      
      ElMessage.info('正在生成文本，请耐心等待1-2分钟...');
      
      const response = await createGeneratedText(data);
      
      if (response) {
        ElMessage.success('文本生成成功');
        generatedResult.value = response;
        editedContent.value = response.content;
        showSaveButton.value = true;
        
        // 生成成功后滚动到结果区域
        setTimeout(() => {
          const resultArea = document.querySelector('.result-area');
          if (resultArea) {
            resultArea.scrollIntoView({ behavior: 'smooth' });
          }
        }, 200);
      } else {
        ElMessage.error('生成文本失败: 服务器未返回有效数据');
      }
    } catch (error) {
      console.error('生成文本失败:', error);
      // 提供更详细的错误信息
      if (error.response) {
        // 服务器返回了错误状态码
        ElMessage.error(`生成文本失败: ${error.response.status} ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        // 请求已发送但没有收到响应
        ElMessage.error('生成文本失败: 服务器无响应，请稍后再试');
      } else {
        // 请求设置出错
        ElMessage.error(`生成文本失败: ${error.message}`);
      }
    } finally {
      loading.value = false;
    }
  });
}

// 新增编辑函数
const startEditing = () => {
  isEditing.value = true;
}

// 新增保存函数
const saveEditedText = async () => {
  try {
    // 如果有generatedResult，将编辑后的内容保存到它上面
    if (generatedResult.value) {
      // 调用API保存编辑后的文本
      await updateGeneratedText(generatedResult.value.id, { content: editedContent.value });
      
      // 更新当前显示的结果
      generatedResult.value.content = editedContent.value;
      
      ElMessage.success('保存成功');
      
      // 保存后才更新右侧显示的最近生成文本
      fetchLatestGeneratedText(form.eventGraphId);
      
      // 不再清空左侧结果区域，改为显示编辑后的内容
      isEditing.value = false;
      showSaveButton.value = true;
    }
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败: ' + (error.message || '未知错误'));
  }
}

// 返回上一页
const goBack = () => {
  router.back();
}

// 监听事件图ID变化
watch(() => form.eventGraphId, (newVal) => {
  if (newVal) {
    fetchLatestGeneratedText(newVal);
  } else {
    latestGeneratedText.value = null;
  }
});

// 初始化
onMounted(() => {
  fetchEventGraphs();
  fetchStyles();
});
</script>

<style scoped>
.text-generation-create-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  font-size: 28px;
  color: #1890FF;
  font-weight: 600;
  position: relative;
  margin: 0;
}

.page-header h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 50px;
  height: 3px;
  background-color: #1890FF;
  border-radius: 2px;
}

.generation-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-area {
  margin-bottom: 30px;
  background-color: rgba(225, 232, 238, 0.7);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 21, 41, 0.08);
}

.preview-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.preview-card {
  flex: 1;
  background-color: rgba(230, 235, 240, 0.8);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 21, 41, 0.06);
}

.preview-card h3 {
  color: #1890FF;
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 12px;
  font-weight: 600;
}

.result-section {
  margin-top: 30px;
}

.result-layout {
  display: flex;
  gap: 20px;
}

.result-area, .latest-area {
  flex: 1;
  background-color: rgba(225, 232, 238, 0.7);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 21, 41, 0.08);
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

.result-area h3, .latest-area h3 {
  color: #1890FF;
  font-size: 18px;
  margin-top: 0;
  margin-bottom: 15px;
  font-weight: 600;
}

.result-content, .latest-content {
  background-color: rgba(230, 235, 240, 0.8);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 21, 41, 0.06);
  height: 500px;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.result-header, .latest-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.result-text, .latest-text {
  white-space: pre-line;
  line-height: 1.6;
  color: #606266;
  overflow-y: auto;
  padding: 10px;
  border-radius: 4px;
  background-color: #fafafa;
}

.result-placeholder, .latest-placeholder {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-header-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.4;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
}

.loading-icon {
  font-size: 32px;
  color: #409EFF;
  margin-bottom: 16px;
}

.loading-text {
  margin-top: 15px;
  font-size: 16px;
  color: #409EFF;
  font-weight: 500;
}

.loading-tip {
  margin-top: 5px;
  font-size: 13px;
  color: #909399;
}

/* 自定义编辑器样式 */
.el-textarea__inner {
  height: 100% !important;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .preview-section, .result-layout {
    flex-direction: column;
  }
}
</style> 