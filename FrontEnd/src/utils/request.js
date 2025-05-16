import axios from 'axios'
import { getToken, removeToken } from '@/utils/auth'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建axios实例
const service = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 120000  // 增加到120秒（两分钟）
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    console.log('发送请求:', config.method.toUpperCase(), config.url)
    const token = getToken()
    console.log('Raw token from storage:', token)
    
    // 确保token是字符串且包含两个点号（JWT格式）
    if (token && typeof token === 'string' && token.split('.').length === 3) {
      config.headers['Authorization'] = `Bearer ${token}`
      console.log('Authorization header set:', config.headers['Authorization'])
    } else if (token) {
      // 如果token存在但格式不正确，清除它
      console.error('Invalid token format found in storage:', token)
      removeToken()
    }
    
    return config
  },
  error => {
    console.log('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    console.log('收到响应:', response.config.method.toUpperCase(), response.config.url, response.status)
    
    // 检查是否是二进制响应（blob类型）
    if (response.config.responseType === 'blob') {
      console.log('收到blob响应，直接返回数据')
      return response.data
    }
    
    console.log('响应数据:', response.data)
    const res = response.data
    
    // API请求成功，直接返回完整响应
    // 由业务组件处理具体的成功/失败逻辑
    return res
  },
  error => {
    console.log('API Error:', error)
    console.log('Error Response:', error.response)
    const message = error.response?.data?.message || error.message || '请求失败'
    ElMessage({
      message: message,
      type: 'error',
      duration: 5 * 1000
    })
    
    // 如果是401错误，说明token失效，需要重新登录
    if (error.response?.status === 401) {
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default service

// 添加一个导出函数，用于修复图片URL
export function fixImageUrl(url) {
  if (!url) return '';
  
  // 修复常见的URL错误
  let fixedUrl = url;
  
  // 不再修复冒号后面的路径问题，这可能导致URL问题
  
  // 修复等号代替斜杠的问题（如 avatar=xxx.png）
  if (fixedUrl.includes('avatar=')) {
    fixedUrl = fixedUrl.replace('avatar=', 'avatar/');
  }
  
  // 确保以斜杠开头
  if (!fixedUrl.startsWith('/') && !fixedUrl.startsWith('http')) {
    fixedUrl = '/' + fixedUrl;
  }
  
  return fixedUrl;
} 