import request from '@/utils/request'

// 生成文本（基于事件图和风格）
export function generateText(data) {
  return request({
    url: '/deepseek/generate',
    method: 'post',
    data
  })
}

// 获取文本生成进度
export function getGenerationProgress(taskId) {
  return request({
    url: `/deepseek/progress/${taskId}`,
    method: 'get'
  })
}

// 获取可用的模型列表
export function getAvailableModels() {
  return request({
    url: '/deepseek/models',
    method: 'get'
  })
}

// 检查模型状态
export function checkModelStatus() {
  return request({
    url: '/deepseek/status',
    method: 'get'
  })
} 