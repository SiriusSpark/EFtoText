import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'

// 布局组件
import MainLayout from '@/layout/index.vue'

// 路由配置
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', public: true }
  },
  {
    path: '/',
    name: 'Layout',
    component: MainLayout,
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' }
      }
    ]
  },
  {
    path: '/event-graph',
    component: MainLayout,
    redirect: '/event-graph/list',
    meta: { title: '事件图管理', icon: 'event' },
    children: [
      {
        path: 'list',
        component: () => import('@/views/event-graph/list.vue'),
        name: 'EventGraphList',
        meta: { title: '事件图列表' }
      },
      {
        path: 'create',
        component: () => import('@/views/event-graph/edit.vue'),
        name: 'CreateEventGraph',
        meta: { title: '编辑事件图', activeMenu: '/event-graph/list', hidden: true }
      },
      {
        path: 'edit/:id',
        component: () => import('@/views/event-graph/edit.vue'),
        name: 'EditEventGraph',
        meta: { title: '编辑事件图', activeMenu: '/event-graph/list', hidden: true },
        props: true
      },
      {
        path: 'detail/:id',
        component: () => import('@/views/event-graph/detail.vue'),
        name: 'EventGraphDetail',
        meta: { title: '事件图详情' },
        props: true
      },
      {
        path: 'node-edit/:id',
        component: () => import('@/views/event-graph/node-edit.vue'),
        name: 'EditEventNode',
        meta: { title: '编辑事件节点', activeMenu: '/event-graph/list' },
        props: true
      },
      {
        path: 'edge-edit/:id',
        component: () => import('@/views/event-graph/edge-edit.vue'),
        name: 'EditEventEdge',
        meta: { title: '编辑事件关系', activeMenu: '/event-graph/list' },
        props: true
      },
      {
        path: 'visualize/:id',
        component: () => import('@/views/event-graph/visualize.vue'),
        name: 'VisualizeEventGraph',
        meta: { title: '事件图可视化', activeMenu: '/event-graph/visualize' },
        props: true
      }
    ]
  },
  {
    path: '/text-style',
    component: MainLayout,
    redirect: '/text-style/list',
    meta: { title: '文本风格管理', icon: 'style' },
    children: [
      {
        path: 'list',
        component: () => import('@/views/text-style/list.vue'),
        name: 'TextStyleList',
        meta: { title: '风格列表' }
      },
      {
        path: 'create',
        component: () => import('@/views/text-style/edit.vue'),
        name: 'CreateTextStyle',
        meta: { title: '创建风格' }
      },
      {
        path: 'edit/:id',
        component: () => import('@/views/text-style/edit.vue'),
        name: 'EditTextStyle',
        meta: { title: '编辑风格' },
        props: true
      }
    ]
  },
  {
    path: '/text-generation',
    component: MainLayout,
    redirect: '/text-generation/list',
    meta: { title: '文本生成', icon: 'document' },
    children: [
      {
        path: 'list',
        component: () => import(/* webpackChunkName: "text-generation-list" */ '@/views/text-generation/list.vue'),
        name: 'TextGenerationList',
        meta: { title: '全部记录' }
      },
      {
        path: 'create',
        component: () => import(/* webpackChunkName: "text-generation-create" */ '@/views/text-generation/create.vue'),
        name: 'CreateTextGeneration',
        meta: { title: '生成新文本' }
      },
      {
        path: 'detail/:id',
        component: () => import(/* webpackChunkName: "text-generation-detail" */ '@/views/text-generation/detail.vue'),
        name: 'TextGenerationDetail',
        meta: { title: '文本详情' },
        props: true
      },
      {
        path: 'records',
        component: () => import(/* webpackChunkName: "text-generation-record-list" */ '@/views/text-generation/record-list.vue'),
        name: 'TextGenerationRecordList',
        meta: { title: '生成记录列表' }
      },
      {
        path: 'records/:id',
        component: () => import(/* webpackChunkName: "text-generation-records" */ '@/views/text-generation/records.vue'),
        name: 'TextGenerationRecords',
        meta: { title: '生成记录', activeMenu: '/text-generation/records' },
        props: true
      }
    ]
  },
  {
    path: '/user',
    component: MainLayout,
    redirect: '/user/profile',
    children: [
      {
        path: 'profile',
        component: () => import('@/views/user/Profile.vue'),
        name: 'UserProfile',
        meta: { title: '个人资料' }
      },
      {
        path: 'change-password',
        component: () => import('@/views/user/ChangePassword.vue'),
        name: 'ChangePassword',
        meta: { title: '修改密码' }
      }
    ]
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404.vue'),
    meta: { title: '404', public: true }
  },
  // 捕获所有未匹配的路由，重定向到404
  { path: '/:pathMatch(.*)*', redirect: '/404', hidden: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导航守卫
router.beforeEach((to, from, next) => {
  const hasToken = getToken()
  
  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      next()
    }
  } else {
    if (to.meta.public) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
})

export default router 