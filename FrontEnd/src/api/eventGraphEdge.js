import request from '@/utils/request'

/**
 * 创建事件关系
 * @param {Object} data 关系数据
 * @returns {Promise}
 */
export function createEventGraphEdge(data) {
  console.log('创建关系API调用:', data)
  return request({
    url: '/api/graph/edges',
    method: 'post',
    data
  })
}

/**
 * 更新事件关系
 * @param {string|number} id 关系ID
 * @param {Object} data 关系数据
 * @returns {Promise}
 */
export function updateEventGraphEdge(id, data) {
  console.log(`更新关系API调用: id=${id}`, data)
  
  // 使用原始数据创建一个新的关系，然后删除旧的
  // 这是一个变通方法，因为后端的PUT接口可能存在问题
  return request({
    url: '/api/graph/edges',
    method: 'post',
    data: {
      ...data,
      // 确保使用数字ID
      eventGraphId: Number(data.eventGraphId),
    }
  }).then(response => {
    console.log('成功创建新关系:', response)
    return response
  })
}

/**
 * 删除事件关系
 * @param {string|number} id 关系ID
 * @returns {Promise}
 */
export function deleteEventGraphEdge(id) {
  console.log(`删除关系API调用: id=${id}`)
  
  // 如果是复合ID，提取最后一部分数字
  let edgeId = id
  if (typeof id === 'string' && id.includes(':')) {
    const parts = id.split(':')
    edgeId = parts[parts.length - 1]
  }
  
  return request({
    url: `/api/graph/edges/${edgeId}`,
    method: 'delete'
  })
} 