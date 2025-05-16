<template>
  <div class="app-wrapper">
    <!-- 侧边栏 -->
    <div class="sidebar-container" ref="sidebarRef" @wheel="handleSidebarScroll">
      <div class="logo-container">
        <span class="eventgraph-logo">EventGraph</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        mode="vertical"
        :unique-opened="true"
        :router="true"
        ref="menuRef"
      >
        <el-menu-item index="/home">
          <el-icon><House /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        
        <!-- 事件图管理 -->
        <el-sub-menu index="/event-graph">
          <template #title>
            <el-icon><Share /></el-icon>
            <span>事件图</span>
          </template>
          <el-menu-item index="/event-graph/list">
            <span>事件图列表</span>
          </el-menu-item>
          <el-menu-item index="/event-graph/detail" @click="goToFirstEventGraphEdit">
            <span>事件图详情</span>
          </el-menu-item>
          <el-menu-item index="/event-graph/visualize" @click="goToFirstEventGraphVisualize">
            <span>事件图可视化</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 文本生成 -->
        <el-sub-menu index="/text-generation">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>文本生成</span>
          </template>
          <el-menu-item index="/text-generation/create" @click="goToFirstEventGraphGeneration">
            <span>生成新文本</span>
          </el-menu-item>
          <el-menu-item index="/text-generation/records" @click="goToFirstEventGraphRecords">
            <span>生成记录</span>
          </el-menu-item>
          <el-menu-item index="/text-generation/list">
            <span>全部记录</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 文本风格 -->
        <el-sub-menu index="/text-style">
          <template #title>
            <el-icon><Edit /></el-icon>
            <span>文本风格</span>
          </template>
          <el-menu-item index="/text-style/list">
            <span>风格列表</span>
          </el-menu-item>
          <el-menu-item index="/text-style/create">
            <span>创建风格</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 将"个人信息"改为"用户信息"下拉菜单 -->
        <el-sub-menu index="/user">
          <template #title>
            <el-icon><User /></el-icon>
            <span>用户信息</span>
          </template>
          <el-menu-item index="/user/profile">
            <span>个人资料</span>
          </el-menu-item>
          <el-menu-item index="/user/change-password">
            <span>修改密码</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
    
    <!-- 主要内容区 -->
    <div class="main-container">
      <!-- 头部导航 -->
      <div class="navbar">
        <div class="right-menu">
          <el-dropdown trigger="click">
            <div class="avatar-wrapper">
              <el-avatar :size="40" :src="userAvatar" @error="handleAvatarError">{{ userInitials }}</el-avatar>
              <span class="user-name">{{ userName }}</span>
              <el-icon><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/user/profile')">个人资料</el-dropdown-item>
                <el-dropdown-item @click="router.push('/user/change-password')">修改密码</el-dropdown-item>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- 内容区 -->
      <div class="app-main" ref="appMainRef">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref, nextTick, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { House, Share, Edit, Document, CaretBottom, User } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'
import { fixImageUrl } from '@/utils/request'
import { getEventGraphList } from '@/api/eventGraph'
import { ElMessage } from 'element-plus'

export default {
  name: 'Layout',
  components: {
    House,
    Share,
    Edit,
    Document,
    CaretBottom,
    User
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    const menuRef = ref(null)
    const appMainRef = ref(null)
    const sidebarRef = ref(null)
    const isScrollingToNextPage = ref(false)
    const scrollTimer = ref(null)
    const apiBaseUrl = 'http://localhost:8080' // API基础URL
    const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

    // 定义导航列表，按照顺序排列可导航的页面
    const navigationPaths = [
      '/home',
      '/event-graph/list',
      '/event-graph/detail',
      '/event-graph/visualize',
      '/text-generation/create',
      '/text-generation/records',
      '/text-generation/list',
      '/text-style/list',
      '/text-style/create',
      '/user/profile',
      '/user/change-password'
    ]

    // 获取当前路径的下一个或上一个路径
    const getNextPath = (currentPath, direction = 'next') => {
      // 处理特殊路径的映射，将具体ID页面映射到通用路径
      let normalizedPath = currentPath
      let currentEventGraphId = null
      
      // 提取当前路径中的事件图ID
      if (currentPath.startsWith('/event-graph/detail/')) {
        normalizedPath = '/event-graph/detail'
        currentEventGraphId = currentPath.split('/').pop()
      } 
      // 处理事件图可视化页
      else if (currentPath.startsWith('/event-graph/visualize/')) {
        normalizedPath = '/event-graph/visualize'
        currentEventGraphId = currentPath.split('/').pop()
      }
      // 处理文本生成记录页
      else if (currentPath.startsWith('/text-generation/records/')) {
        normalizedPath = '/text-generation/records'
        currentEventGraphId = currentPath.split('/').pop()
      }
      // 处理文本生成页中可能带有的eventGraphId查询参数
      else if (currentPath.includes('eventGraphId=')) {
        // 保持原路径中主路径部分
        normalizedPath = currentPath.split('?')[0]
        const match = currentPath.match(/eventGraphId=([^&]+)/)
        if (match && match[1]) {
          currentEventGraphId = match[1]
        }
      }
      
      // 如果当前没有事件图ID，但路由对象中有id参数，尝试使用它
      if (!currentEventGraphId && route.params.id) {
        currentEventGraphId = route.params.id
      }
      
      // 如果当前没有事件图ID，但路由对象中有查询参数eventGraphId，尝试使用它
      if (!currentEventGraphId && route.query.eventGraphId) {
        currentEventGraphId = route.query.eventGraphId
      }
      
      console.log('当前路径:', currentPath, '标准化路径:', normalizedPath, '事件图ID:', currentEventGraphId)
      
      // 找到当前路径在导航路径中的索引
      const currentIndex = navigationPaths.findIndex(path => 
        normalizedPath === path || normalizedPath.startsWith(path + '/')
      )
      
      console.log('在导航列表中的索引:', currentIndex)
      
      if (currentIndex === -1) return null
      
      // 根据方向计算下一个索引
      let nextIndex
      if (direction === 'next') {
        nextIndex = currentIndex + 1
        if (nextIndex >= navigationPaths.length) return null
      } else {
        nextIndex = currentIndex - 1
        if (nextIndex < 0) return null
      }
      
      const nextPath = navigationPaths[nextIndex]
      console.log('下一个路径:', nextPath, '当前事件图ID:', currentEventGraphId)
      
      // 如果我们有当前事件图ID，并且下一个页面需要事件图ID，则使用当前ID进行导航
      if (currentEventGraphId) {
        // 根据下一个路径格式构建包含当前事件图ID的完整路径
        if (nextPath === '/event-graph/detail') {
          return `/event-graph/detail/${currentEventGraphId}`
        } else if (nextPath === '/event-graph/visualize') {
          return `/event-graph/visualize/${currentEventGraphId}`
        } else if (nextPath === '/text-generation/create') {
          return `/text-generation/create?eventGraphId=${currentEventGraphId}`
        } else if (nextPath === '/text-generation/records') {
          return `/text-generation/records/${currentEventGraphId}`
        }
      }
      
      // 如果没有事件图ID或不需要ID的页面，回退到默认逻辑
      if (nextPath === '/event-graph/detail') {
        goToFirstEventGraphEdit()
        return null
      } else if (nextPath === '/event-graph/visualize') {
        goToFirstEventGraphVisualize()
        return null
      } else if (nextPath === '/text-generation/create') {
        goToFirstEventGraphGeneration()
        return null
      } else if (nextPath === '/text-generation/records') {
        goToFirstEventGraphRecords()
        return null
      }
      
      return nextPath
    }

    // 处理全局滚动
    const handleGlobalScroll = (event) => {
      // 删除全局滚动功能，保留函数体以避免引用错误
      return
    }
    
    // 处理侧边栏滚动
    const handleSidebarScroll = (event) => {
      if (isScrollingToNextPage.value) return
      event.preventDefault() // 阻止默认滚动行为
      
      // 清除之前的定时器
      if (scrollTimer.value) {
        clearTimeout(scrollTimer.value)
      }
      
      // 设置一个延迟，防止连续触发
      scrollTimer.value = setTimeout(() => {
        // 判断滚动方向
        const direction = event.deltaY > 0 ? 'next' : 'prev'
        const fullPath = route.fullPath // 使用fullPath包含查询参数
        const nextPath = getNextPath(fullPath, direction)
        
        if (nextPath) {
          console.log(`侧边栏滚动到${direction === 'next' ? '下' : '上'}一页: ${nextPath}`)
          isScrollingToNextPage.value = true
          
          // 跳转到下一个页面
          router.push(nextPath).then(() => {
            // 300ms后允许再次触发导航
            setTimeout(() => {
              isScrollingToNextPage.value = false
            }, 300)
          })
        }
      }, 50)
    }

    // 监听路由变化，高亮对应的菜单项
    watch(() => route.path, (newPath) => {
      // 等到DOM更新后再设置滚动位置
      nextTick(() => {
        const appMain = appMainRef.value
        if (appMain) {
          appMain.scrollTop = 0
        }
      })
    })

    const userName = computed(() => store.state.user.nickname || store.state.user.username || '用户')
    
    // 专门针对头像URL的处理函数
    const getCorrectAvatarUrl = (url) => {
      console.log('头像URL处理函数:', url);
      
      // 如果没有URL，返回默认头像
      if (!url) {
        console.log(' - 无URL，使用默认头像');
        return defaultAvatar;
      }
      
      // 直接检查URL中是否包含avatar路径
      if (url.includes('/uploads/avatars/')) {
        // 提取文件名
        const matches = url.match(/\/uploads\/avatars\/([^/]+)$/);
        if (matches && matches[1]) {
          const fileName = matches[1];
          // 使用相对路径
          const relativeUrl = `/uploads/avatars/${fileName}`;
          console.log(' - 使用相对路径:', relativeUrl);
          return relativeUrl;
        }
      }
      
      // 其他情况，使用fixImageUrl处理
      const fixedUrl = fixImageUrl(url);
      console.log(' - 修复后的URL:', fixedUrl);
      
      // 如果是完整的URL，则直接返回
      if (fixedUrl.startsWith('http')) {
        return fixedUrl;
      }
      
      // 否则返回原始路径
      return fixedUrl;
    };
    
    // 使用专用的头像URL处理函数
    const userAvatar = computed(() => {
      return getCorrectAvatarUrl(store.state.user.avatar_url);
    })
    
    const userInitials = computed(() => {
      const name = userName.value
      return name ? name.charAt(0).toUpperCase() : 'U'
    })
    
    // 组件挂载时获取用户信息
    onMounted(() => {
      console.log('Layout组件已挂载，开始获取用户信息');
      // 始终尝试获取最新的用户信息
      store.dispatch('getUserInfo').then(() => {
        console.log('用户信息获取成功，更新后的用户数据:', store.state.user);
      }).catch(err => {
        console.error('获取用户信息失败:', err);
      });
      
      // 防止ResizeObserver错误
      const originalConsoleError = console.error;
      console.error = function(message, ...args) {
        if (message && typeof message === 'string' && 
            message.includes('ResizeObserver loop completed with undelivered notifications')) {
          return; // 忽略特定的ResizeObserver警告
        }
        return originalConsoleError.apply(console, [message, ...args]);
      };
      
      return () => {
        // 组件卸载时清理
        if (scrollTimer.value) {
          clearTimeout(scrollTimer.value)
        }
      }
    })

    // 增强的菜单激活逻辑
    const activeMenu = computed(() => {
      const { path, meta } = route
      
      // 添加日志以便调试
      console.log('当前路径:', path, '元信息:', meta);
      
      // 如果meta中定义了activeMenu，直接使用
      if (meta.activeMenu) {
        console.log('使用meta中定义的activeMenu:', meta.activeMenu);
        return meta.activeMenu
      }
      
      // 处理文本生成记录的特殊情况
      if (path.startsWith('/text-generation/records/')) {
        return '/text-generation/records'
      }
      
      // 处理详情页、编辑页和可视化页的情况
      if (path.startsWith('/event-graph/detail/')) {
        console.log('匹配到事件图详情页，高亮菜单:', '/event-graph/detail');
        return '/event-graph/detail'
      }
      
      if (path.startsWith('/event-graph/edit/')) {
        return '/event-graph/edit'
      }
      
      if (path.startsWith('/event-graph/visualize/')) {
        console.log('匹配到事件图可视化页，高亮菜单:', '/event-graph/visualize');
        return '/event-graph/visualize'
      }
      
      // 更新用户信息相关页面的高亮逻辑
      if (path.startsWith('/user/profile')) {
        return '/user/profile'
      }
      
      if (path.startsWith('/user/change-password')) {
        return '/user/change-password'
      }
      
      // 通用处理详情页的情况
      if (path.includes('/detail/') || path.includes('/edit/')) {
        return path.substring(0, path.lastIndexOf('/'))
      }
      
      console.log('默认使用当前路径:', path);
      return path
    })

    const handleLogout = async () => {
      try {
        await store.dispatch('logout')
        router.push('/login')
      } catch (error) {
        console.error('退出登录失败:', error)
      }
    }

    const handleAvatarError = () => {
      // 处理头像加载失败时的逻辑
      console.error('导航栏头像加载失败')
      console.error('原始头像URL:', store.state.user.avatar_url)
      console.error('计算后的头像URL:', userAvatar.value)
      // 尝试用纯文本头像缩写
      document.querySelector('.avatar-wrapper .el-avatar').style.backgroundColor = '#1890ff'
    }
    
    // 跳转到第一个事件图的编辑页面
    const goToFirstEventGraphEdit = async (e) => {
      // 阻止默认行为和冒泡
      if (e) {
        e.preventDefault && e.preventDefault();
        e.stopPropagation && e.stopPropagation();
      }
      
      try {
        const response = await getEventGraphList()
        let eventGraphs = []
        
        // 支持两种数据结构：直接数组或包含数据的对象
        if (response && Array.isArray(response)) {
          eventGraphs = response
        } else if (response && response.success && Array.isArray(response.data)) {
          eventGraphs = response.data
        }
        
        if (eventGraphs.length > 0) {
          // 获取ID最小的事件图
          const firstGraph = [...eventGraphs].sort((a, b) => a.id - b.id)[0]
          // 使用replace而不是push，避免浏览器历史记录堆积
          router.replace(`/event-graph/detail/${firstGraph.id}`)
        } else {
          ElMessage.warning('没有可查看的事件图')
        }
      } catch (error) {
        console.error('获取事件图列表失败:', error)
        ElMessage.error('获取事件图列表失败')
      }
    }

    // 跳转到第一个事件图的可视化页面
    const goToFirstEventGraphVisualize = async (e) => {
      // 阻止默认行为和冒泡
      if (e) {
        e.preventDefault && e.preventDefault();
        e.stopPropagation && e.stopPropagation();
      }
      
      try {
        const response = await getEventGraphList()
        let eventGraphs = []
        
        // 支持两种数据结构：直接数组或包含数据的对象
        if (response && Array.isArray(response)) {
          eventGraphs = response
        } else if (response && response.success && Array.isArray(response.data)) {
          eventGraphs = response.data
        }
        
        if (eventGraphs.length > 0) {
          // 获取ID最小的事件图
          const firstGraph = [...eventGraphs].sort((a, b) => a.id - b.id)[0]
          // 使用replace而不是push，避免浏览器历史记录堆积
          router.replace(`/event-graph/visualize/${firstGraph.id}`)
        } else {
          ElMessage.warning('没有可查看的事件图')
        }
      } catch (error) {
        console.error('获取事件图列表失败:', error)
        ElMessage.error('获取事件图列表失败')
      }
    }

    // 跳转到第一个事件图的生成页面
    const goToFirstEventGraphGeneration = async (e) => {
      // 阻止默认行为和冒泡
      if (e) {
        e.preventDefault && e.preventDefault();
        e.stopPropagation && e.stopPropagation();
      }
      
      try {
        const response = await getEventGraphList()
        let eventGraphs = []
        
        // 支持两种数据结构：直接数组或包含数据的对象
        if (response && Array.isArray(response)) {
          eventGraphs = response
        } else if (response && response.success && Array.isArray(response.data)) {
          eventGraphs = response.data
        }
        
        if (eventGraphs.length > 0) {
          // 获取ID最小的事件图
          const firstGraph = [...eventGraphs].sort((a, b) => a.id - b.id)[0]
          // 使用replace而不是push，避免浏览器历史记录堆积
          router.replace(`/text-generation/create?eventGraphId=${firstGraph.id}`)
        } else {
          ElMessage.warning('没有可查看的事件图')
        }
      } catch (error) {
        console.error('获取事件图列表失败:', error)
        ElMessage.error('获取事件图列表失败')
      }
    }

    // 跳转到第一个事件图的记录页面
    const goToFirstEventGraphRecords = async (e) => {
      // 阻止默认行为和冒泡
      if (e) {
        e.preventDefault && e.preventDefault();
        e.stopPropagation && e.stopPropagation();
      }
      
      try {
        const response = await getEventGraphList()
        let eventGraphs = []
        
        // 支持两种数据结构：直接数组或包含数据的对象
        if (response && Array.isArray(response)) {
          eventGraphs = response
        } else if (response && response.success && Array.isArray(response.data)) {
          eventGraphs = response.data
        }
        
        if (eventGraphs.length > 0) {
          // 获取ID最小的事件图
          const firstGraph = [...eventGraphs].sort((a, b) => a.id - b.id)[0]
          // 使用replace而不是push，避免浏览器历史记录堆积
          router.replace(`/text-generation/records/${firstGraph.id}`)
        } else {
          ElMessage.warning('没有可查看的事件图')
        }
      } catch (error) {
        console.error('获取事件图列表失败:', error)
        ElMessage.error('获取事件图列表失败')
      }
    }

    return {
      menuRef,
      appMainRef,
      sidebarRef,
      userName,
      userAvatar,
      userInitials,
      activeMenu,
      handleLogout,
      router,
      handleAvatarError,
      goToFirstEventGraphEdit,
      goToFirstEventGraphVisualize,
      goToFirstEventGraphGeneration,
      goToFirstEventGraphRecords,
      handleSidebarScroll
    }
  }
}
</script>

<style lang="scss" scoped>
.app-wrapper {
  display: flex;
  height: 100vh;
  width: 100%;
  background: linear-gradient(180deg, rgba(168, 195, 220, 0.9) 0%, rgba(205, 222, 237, 0.85) 50%, rgba(235, 238, 240, 0.8) 100%);
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #263445;
  overflow: hidden;
}

.eventgraph-logo {
  color: #1890FF;
  font-family: 'Pacifico', cursive, sans-serif;
  font-size: 26px;
  font-weight: normal;
  background: linear-gradient(90deg, #1890FF, #69B7FF);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  transform: rotate(-2deg);
  letter-spacing: 1px;
  padding: 0 10px;
  position: relative;
  display: inline-block;
}

.sidebar-container {
  width: 210px;
  height: 100%;
  background-color: #304156;
  transition: width 0.28s;
  overflow-y: auto;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.15);
  z-index: 10;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: transparent; // 改为透明，显示渐变背景
}

.navbar {
  height: 60px;
  background: rgba(220, 225, 230, 0.7); // 降低明度，增加灰度
  backdrop-filter: blur(5px); // 模糊效果，增强现代感
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  padding: 0 20px;
  z-index: 5;
  
  .right-menu {
    margin-left: auto;
    
    .avatar-wrapper {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 0 8px;
      
      .user-name {
        margin: 0 8px;
        color: #606266;
      }
    }
  }
}

.app-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: rgba(225, 230, 235, 0.5); // 降低明度，增加灰度
  margin: 0 15px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 21, 41, 0.08);
}

.el-menu {
  border-right: none;
  
  // 事件图和文本风格的子菜单样式
  .el-sub-menu.el-menu-item {
    &[index^="/event-graph/"],
    &[index^="/text-style/"] {
      padding-left: 10% !important;
      padding-right: 10% !important;
      box-sizing: border-box;
      width: 100%;
    }
  }
}

// 确保子菜单项的样式
:deep(.el-sub-menu) {
  &[index="/event-graph"],
  &[index="/text-style"] {
    .el-menu-item {
      padding-left: 10% !important;
      padding-right: 10% !important;
      box-sizing: border-box;
      width: 100%;
    }
  }
}
</style> 