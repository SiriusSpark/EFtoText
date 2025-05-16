import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createStore } from 'vuex'
import axios from 'axios'
import router from './router'

// 创建Vuex store
const store = createStore({
  state() {
    return {
      token: localStorage.getItem('token') || '',
      user: JSON.parse(localStorage.getItem('user') || '{}'),
    }
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
      localStorage.setItem('token', token)
    },
    SET_USER(state, user) {
      state.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    CLEAR_USER(state) {
      state.token = ''
      state.user = {}
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },
  actions: {
    login({ commit }, userInfo) {
      return new Promise((resolve, reject) => {
        // 这里之后需要替换为实际的登录API调用
        setTimeout(() => {
          const token = 'mock-token'
          const user = { username: userInfo.username, roles: ['admin'] }
          commit('SET_TOKEN', token)
          commit('SET_USER', user)
          resolve()
        }, 1000)
      })
    },
    logout({ commit }) {
      return new Promise(resolve => {
        commit('CLEAR_USER')
        resolve()
      })
    }
  },
  getters: {
    token: state => state.token,
    user: state => state.user
  }
})

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 5000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    if (store.getters.token) {
      config.headers['Authorization'] = `Bearer ${store.getters.token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    return Promise.reject(error)
  }
)

const app = createApp(App)

// 全局挂载axios
app.config.globalProperties.$http = request

// 使用插件
app.use(ElementPlus)
app.use(store)
app.use(router)

app.mount('#app')
