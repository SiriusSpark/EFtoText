import { createRouter, createWebHashHistory } from 'vue-router'

// 路由配置
const routes = [
  {
    path: '/',
    component: () => import('@/views/layout/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'dashboard' }
      }
    ]
  },
  {
    path: '/event-graph',
    component: () => import('@/views/layout/Layout.vue'),
    redirect: '/event-graph/list',
    name: 'EventGraph',
    meta: {
      title: '事件图',
      icon: 'el-icon-s-data'
    },
    children: [
      {
        path: 'list',
        component: () => import('@/views/event-graph/list.vue'),
        name: 'EventGraphList',
        meta: { title: '事件图列表', icon: 'list' }
      },
      {
        path: 'edit/:id',
        component: () => import('@/views/event-graph/edit.vue'),
        name: 'EventGraphEdit',
        meta: { title: '编辑事件图', activeMenu: '/event-graph/list' },
        hidden: true
      },
      {
        path: 'create',
        component: () => import('@/views/event-graph/edit.vue'),
        name: 'EventGraphCreate',
        meta: { title: '创建事件图', activeMenu: '/event-graph/list' },
        hidden: true
      }
    ]
  },
  {
    path: '/text-style',
    component: () => import('@/views/layout/Layout.vue'),
    redirect: '/text-style/list',
    name: 'TextStyle',
    meta: {
      title: '文本风格',
      icon: 'el-icon-s-management'
    },
    children: [
      {
        path: 'list',
        component: () => import('@/views/text-style/list.vue'),
        name: 'TextStyleList',
        meta: { title: '风格列表', icon: 'list' }
      },
      {
        path: 'edit/:id',
        component: () => import('@/views/text-style/edit.vue'),
        name: 'TextStyleEdit',
        meta: { title: '编辑风格', activeMenu: '/text-style/list' },
        hidden: true
      },
      {
        path: 'create',
        component: () => import('@/views/text-style/edit.vue'),
        name: 'TextStyleCreate',
        meta: { title: '创建风格', activeMenu: '/text-style/list' },
        hidden: true
      }
    ]
  },
  {
    path: '/text-generation',
    component: () => import('@/views/layout/Layout.vue'),
    redirect: '/text-generation/list',
    name: 'TextGeneration',
    meta: {
      title: '文本生成',
      icon: 'el-icon-document'
    },
    children: [
      {
        path: 'list',
        component: () => import('@/views/text-generation/list.vue'),
        name: 'GeneratedTextList',
        meta: { title: '生成记录', icon: 'el-icon-notebook-2' }
      },
      {
        path: 'create',
        component: () => import('@/views/text-generation/create.vue'),
        name: 'GeneratedTextCreate',
        meta: { title: '生成文本', icon: 'el-icon-magic-stick' }
      },
      {
        path: 'detail/:id',
        component: () => import('@/views/text-generation/detail.vue'),
        name: 'GeneratedTextDetail',
        meta: { title: '文本详情', activeMenu: '/text-generation/list' },
        hidden: true
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404.vue'),
    hidden: true
  },
  // 404 页面必须放在最后
  { path: '/:pathMatch(.*)*', redirect: '/404', hidden: true }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 获取token
  const hasToken = localStorage.getItem('token')

  if (hasToken) {
    if (to.path === '/login') {
      // 如果已登录，重定向到首页
      next({ path: '/' })
    } else {
      next()
    }
  } else {
    // 没有token
    if (to.path === '/login') {
      // 直接进入
      next()
    } else {
      // 其他页需要登录权限，重定向到登录页
      next(`/login?redirect=${to.path}`)
    }
  }
})

export default router 