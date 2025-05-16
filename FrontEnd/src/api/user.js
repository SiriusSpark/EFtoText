import request from '@/utils/request'

// 用户登录
export function login(data) {
  return request({
    url: '/api/users/login',
    method: 'post',
    data
  })
}

// 用户注册
export function register(data) {
  return request({
    url: '/api/users/register',
    method: 'post',
    data
  })
}

// 获取当前用户信息
export function getCurrentUser() {
  return request({
    url: '/api/users/me',
    method: 'get'
  })
}

// 退出登录
export function logout() {
  return request({
    url: '/api/users/logout',
    method: 'post'
  })
}

// 获取用户信息
export function getUserInfo() {
  return request({
    url: '/api/users/me',
    method: 'get'
  })
}

// 修改密码
export function changePassword(id, data) {
  return request({
    url: `/api/users/${id}/password`,
    method: 'put',
    data
  })
}

// 获取用户列表（管理员权限）
export function getUserList(params) {
  return request({
    url: '/api/users',
    method: 'get',
    params
  })
}

// 创建用户（管理员权限）
export function createUser(data) {
  return request({
    url: '/api/users',
    method: 'post',
    data
  })
}

// 更新用户信息
export function updateUser(id, data) {
  return request({
    url: `/api/users/${id}`,
    method: 'put',
    data
  })
}

// 修改密码
export function updatePassword(id, data) {
  return request({
    url: `/api/users/${id}/password`,
    method: 'put',
    data: {
      old_password: data.oldPassword,
      new_password: data.newPassword
    }
  })
}

// 删除用户（管理员权限）
export function deleteUser(id) {
  return request({
    url: `/api/users/${id}`,
    method: 'delete'
  })
}

// 更新用户头像
export function updateAvatar(id, file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: `/api/users/${id}/avatar`,
    method: 'put',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 更新用户活动时间
export function updateLastActive(id) {
  return request({
    url: `/api/users/${id}/last-active`,
    method: 'put'
  })
} 