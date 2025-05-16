import { createStore } from 'vuex'
import { login, logout, getCurrentUser } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'

export default createStore({
  state: {
    token: getToken() || '',
    user: JSON.parse(localStorage.getItem('user') || '{}')
  },
  mutations: {
    SET_TOKEN(state, token) {
      console.log('Setting token:', token)
      state.token = token
      setToken(token)
    },
    SET_USER(state, user) {
      state.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    CLEAR_USER(state) {
      state.token = ''
      state.user = {}
      removeToken()
      localStorage.removeItem('user')
    }
  },
  actions: {
    // 用户登录
    login({ commit }, userInfo) {
      return new Promise((resolve, reject) => {
        login(userInfo)
          .then(response => {
            console.log('Raw login response:', response)
            
            // 检查响应结构
            if (!response || typeof response !== 'object') {
              throw new Error('Invalid response format')
            }

            let token = null
            let userData = null
            
            // 从响应中提取token和用户数据
            if (response.token && typeof response.token === 'string') {
              token = response.token
              userData = response.user
            } else if (response.data) {
              // 如果数据在data字段中
              if (response.data.token && typeof response.data.token === 'string') {
                token = response.data.token
              } else if (response.data.token && response.data.token.access_token) {
                token = response.data.token.access_token
              }
              userData = response.data.user
            } else if (response.token && response.token.access_token) {
              token = response.token.access_token
              userData = response.user
            }

            console.log('Extracted token:', token)
            console.log('Extracted user data:', userData)

            if (token) {
              commit('SET_TOKEN', token)
              if (userData) {
                commit('SET_USER', userData)
              }
              resolve(response)
            } else {
              console.error('No valid token found in response:', response)
              reject(new Error('登录失败：未获取到有效的token'))
            }
          })
          .catch(error => {
            console.error('Login error:', error)
            commit('CLEAR_USER')
            reject(error)
          })
      })
    },
    
    // 获取用户信息
    getUserInfo({ commit }) {
      return new Promise((resolve, reject) => {
        getCurrentUser()
          .then(response => {
            console.log('获取用户信息成功:', response)
            // 检查和提取用户数据
            let userData = null
            if (response && response.success && response.data) {
              userData = response.data
            } else if (response && response.id) {
              userData = response
            }
            
            if (userData) {
              commit('SET_USER', userData)
              resolve(userData)
            } else {
              reject(new Error('获取用户信息失败：无法提取有效的用户数据'))
            }
          })
          .catch(error => {
            console.error('获取用户信息失败:', error)
            reject(error)
          })
      })
    },
    
    // 用户登出
    logout({ commit }) {
      return new Promise((resolve, reject) => {
        logout()
          .then(() => {
            commit('CLEAR_USER')
            resolve()
          })
          .catch(error => {
            commit('CLEAR_USER')
            reject(error)
          })
      })
    }
  },
  getters: {
    token: state => state.token,
    user: state => state.user
  }
}) 