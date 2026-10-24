<template>
  <el-container class="dark-layout">
    <!-- 侧边栏 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo-area">
        <span class="logo-icon">Q</span> QUICK ONE
      </div>
      
      <el-menu 
        :default-active="$route.path" 
        router 
        class="side-menu"
        background-color="#1e232d" 
        text-color="#8b95a5" 
        active-text-color="#3b82f6"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Monitor /></el-icon> <span>系统首页</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon> <span>客户管理</span>
        </el-menu-item>
        
        <!-- 折叠菜单：客户资金 -->
        <el-sub-menu index="funds">
          <template #title>
            <el-icon><Money /></el-icon> <span>客户资金</span>
          </template>
          <el-menu-item index="/recharge">入金管理</el-menu-item>
          <el-menu-item index="/withdrawals">出金审批</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/verify">
          <el-icon><DocumentChecked /></el-icon> <span>资料审核</span>
        </el-menu-item>
        <el-menu-item index="/records">
          <el-icon><List /></el-icon> <span>公告消息</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="top-bar">
        <div class="breadcrumb">当前位置：{{ currentPageTitle }}</div>
        <div class="user-info">
          <el-avatar :size="32" style="background: #3b82f6;">{{ adminName.charAt(0) }}</el-avatar>
          <span>{{ adminName }}</span>
          <el-button type="text" style="color: #ef4444;" @click="logout">退出</el-button>
        </div>
      </el-header>

      <el-main class="page-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Monitor, User, Money, DocumentChecked, List } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const adminName = ref(localStorage.getItem('admin_name') || 'Admin');

const currentPageTitle = computed(() => {
  const map = {
    '/dashboard': '系统首页', '/users': '客户管理', '/recharge': '入金管理', 
    '/withdrawals': '出金审批', '/verify': '资料审核', '/records': '公告消息'
  };
  return map[route.path] || '后台管理';
});

const logout = () => {
  localStorage.removeItem('admin_token');
  router.push('/login');
};
</script>

<style scoped>
.dark-layout { height: 100vh; background: #f1f5f9; font-family: 'Inter', sans-serif; }
.sidebar { background: #1e232d; display: flex; flex-direction: column; box-shadow: 2px 0 10px rgba(0,0,0,0.1); z-index: 10; }
.logo-area { height: 60px; display: flex; align-items: center; padding: 0 20px; color: white; font-size: 18px; font-weight: bold; border-bottom: 1px solid #2a303c; }
.logo-icon { color: #3b82f6; font-size: 24px; margin-right: 8px; }

.side-menu { border-right: none; }
.side-menu :deep(.el-menu-item), .side-menu :deep(.el-sub-menu__title) { 
  height: 50px; line-height: 50px; color: #8b95a5; 
}
.side-menu :deep(.el-menu-item:hover), .side-menu :deep(.el-sub-menu__title:hover) {
  background-color: #2a303c !important; color: #fff !important;
}
.side-menu :deep(.el-menu-item.is-active) {
  background-color: #2a303c !important; color: #3b82f6 !important;
  border-left: 3px solid #3b82f6; /* 左侧蓝色高亮线，完美复刻截图 */
}
.side-menu :deep(.el-sub-menu .el-menu-item) { background-color: #181c23 !important; padding-left: 50px !important; }

.top-bar { background: #fff; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; border-bottom: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.breadcrumb { font-size: 14px; color: #64748b; font-weight: 500; }
.user-info { display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: bold; color: #333; }
.page-content { padding: 20px; background: #f1f5f9; }
</style>