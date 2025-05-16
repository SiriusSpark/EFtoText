import request from '@/utils/request'

// 获取文本风格列表
export function getTextStyleList() {
  return request({
    url: '/api/text_styles',
    method: 'get'
  })
}

// 获取文本风格详情
export function getTextStyleDetail(id) {
  return request({
    url: `/api/text_styles/${id}`,
    method: 'get'
  })
}

// 创建文本风格
export function createTextStyle(data) {
  return request({
    url: '/api/text_styles',
    method: 'post',
    data
  })
}

// 更新文本风格
export function updateTextStyle(id, data) {
  return request({
    url: `/api/text_styles/${id}`,
    method: 'put',
    data
  })
}

// 删除文本风格
export function deleteTextStyle(id) {
  return request({
    url: `/api/text_styles/${id}`,
    method: 'delete'
  })
} 