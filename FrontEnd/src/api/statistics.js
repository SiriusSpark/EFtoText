import request from '@/utils/request'

/**
 * 获取系统统计数据
 * @returns {Promise<Object>} - 包含系统统计数据的Promise
 */
export function getSystemStatistics() {
  return request({
    url: '/api/statistics/system',
    method: 'get'
  })
} 