import request from '@/utils/request'

// 获取生成文本列表
export function getGeneratedTextList(params) {
  return request({
    url: '/api/generated_texts',
    method: 'get',
    params
  })
}

// 获取所有生成文本
export function getAllGeneratedTexts() {
  return request({
    url: '/api/generated_texts/all',
    method: 'get',
    params: {
      // 添加时间戳参数，防止浏览器缓存
      _t: new Date().getTime()
    },
    // 设置请求头，确保不使用缓存
    headers: {
      'Cache-Control': 'no-cache, no-store',
      'Pragma': 'no-cache'
    }
  })
}

// 获取生成文本详情
export function getGeneratedTextDetail(id) {
  return request({
    url: `/api/generated_texts/${id}`,
    method: 'get'
  })
}

// 创建生成文本
export function createGeneratedText(data) {
  return request({
    url: '/api/generated_texts',
    method: 'post',
    data
  })
}

// 获取指定事件图最近生成的文本
export function getLatestGeneratedText(eventGraphId) {
  return request({
    url: '/api/generated_texts/latest',
    method: 'get',
    params: { eventGraphId }
  })
}

// 删除生成文本
export function deleteGeneratedText(id) {
  return request({
    url: `/api/generated_texts/${id}`,
    method: 'delete'
  })
}

// 获取指定事件图的所有生成文本
export function getEventGraphGeneratedTexts(eventGraphId) {
  console.log('开始请求事件图生成记录，事件图ID:', eventGraphId)
  return request({
    url: '/api/generated_texts',
    method: 'get',
    params: { eventGraphId }
  })
}

// 导出指定事件图的所有文本(ZIP格式)
export function exportEventGraphTexts(eventGraphId) {
  return request({
    url: '/api/generated_texts/export',
    method: 'get',
    params: { eventGraphId },
    responseType: 'blob' // 指定响应类型为blob(二进制数据)
  })
}

// 导出用户的所有文本(ZIP格式)
export function exportAllUserTexts() {
  return request({
    url: '/api/generated_texts/export/all',
    method: 'get',
    responseType: 'blob' // 指定响应类型为blob(二进制数据)
  })
}

// 获取文本生成任务状态
export function getGeneratedTextStatus(id) {
  return request({
    url: `/generated_texts/${id}/status`,
    method: 'get'
  })
}

/**
 * 获取指定ID的生成文本
 * @param {number} id - 文本ID
 * @returns {Promise<Object>} - 包含文本数据的Promise
 */
export function getGeneratedTextById(id) {
  return request({
    url: `/api/generated_texts/${id}`,
    method: 'get'
  })
}

/**
 * 更新生成文本内容
 * @param {number} id - 文本ID
 * @param {Object} data - 包含content字段的对象
 * @returns {Promise<Object>} - 包含更新结果的Promise
 */
export function updateGeneratedText(id, data) {
  return request({
    url: `/api/generated_texts/${id}`,
    method: 'put',
    data
  })
} 