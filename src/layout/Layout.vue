<template>
  <el-container class="dark-layout">
    <!-- 侧边栏 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo-area">
        <!-- 🆕 品牌名同步更新 -->
        <span class="logo-icon">G</span> GRANDSLAM
      </div>
      
      <el-menu 
        :default-active="$route.path" 
        router 
        class="side-menu"
        background-color="transparent" 
        text-color="#94a3b8" 
        active-text-color="#38bdf8"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Monitor /></el-icon> <span>系统首页</span>
        </el-menu-item>

        <el-menu-item index="/mlb-manage">
          <el-icon><DataLine /></el-icon> <span>MLB 赛事管理</span>
        </el-menu-item>

        <!-- 🆕 新增：棒球注单流水 -->
        <el-menu-item index="/mlb-bets">
          <el-icon><Tickets /></el-icon> <span>⚾ 棒球注单流水</span>
        </el-menu-item>

        <el-menu-item index="/users">
          <el-icon><User /></el-icon> <span>客户管理</span>
        </el-menu-item>
        
        <!-- 折叠菜单：客户资金 -->
        <el-sub-menu index="funds">
          <template #title>
            <el-icon><Money /></el-icon> <span>客户资金</span>
          </template>
          <!-- 🆕 改成了入金审批，并指向 /deposits -->
          <el-menu-item index="/deposits">入金审批</el-menu-item>
          <el-menu-item index="/withdrawals">出金审批</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/verify">
          <el-icon><DocumentChecked /></el-icon> <span>资料审核</span>
        </el-menu-item>
        <el-menu-item index="/records">
          <el-icon><List /></el-icon> <span>抽奖流水</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶栏深色化 -->
      <el-header class="top-bar">
        <div class="breadcrumb">
          <span class="dot"></span> 当前位置：{{ currentPageTitle }}
        </div>
        <div class="user-info">
          <el-avatar :size="28" style="background: #0ea5e9; color: #fff; font-weight: bold;">
            {{ adminName.charAt(0).toUpperCase() }}
          </el-avatar>
          <span class="admin-name">{{ adminName }}</span>
          <el-button link type="danger" class="logout-btn" @click="logout">退出登录</el-button>
        </div>
      </el-header>

      <!-- 主内容区深色化 -->
      <el-main class="page-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
// 🆕 引入 Tickets 图标用于注单菜单
import { Monitor, User, Money, DocumentChecked, List, DataLine, Tickets } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const adminName = ref(localStorage.getItem('admin_name') || 'Admin');

const currentPageTitle = computed(() => {
  const map = {
    '/dashboard': '系统首页', 
    '/mlb-manage': 'MLB 赛事管理', 
    '/mlb-bets': '⚾ 棒球注单流水', 
    '/users': '客户管理', 
    '/deposits': '入金审批', // 🆕 新增面包屑标题
    '/withdrawals': '出金审批', 
    '/verify': '资料审核', 
    '/records': '抽奖流水'
  };
  return map[route.path] || '后台管理';
});

const logout = () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('user');
  router.push('/login');
};
</script>

<style scoped>
/* 整个页面最底层的颜色，和你的数据表格完全一致 */
.dark-layout { 
  height: 100vh; 
  background: #0f172a; 
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
}

/* ================= 侧边栏 ================= */
.sidebar { 
  background: #1e293b; /* 比底色稍微亮一点，形成层次感 */
  display: flex; 
  flex-direction: column; 
  border-right: 1px solid #334155; 
  z-index: 10; 
}

.logo-area { 
  height: 60px; 
  display: flex; 
  align-items: center; 
  padding: 0 20px; 
  color: #f8fafc; 
  font-size: 18px; 
  font-weight: 900; 
  letter-spacing: 1px;
  border-bottom: 1px solid #334155; 
  background: #0f172a;
}
.logo-icon { 
  color: #0ea5e9; /* 科技蓝 */
  font-size: 24px; 
  margin-right: 8px; 
  text-shadow: 0 0 10px rgba(14, 165, 233, 0.5);
}

.side-menu { border-right: none; padding: 10px; }
.side-menu :deep(.el-menu-item), .side-menu :deep(.el-sub-menu__title) { 
  height: 48px; 
  line-height: 48px; 
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.3s;
}
.side-menu :deep(.el-menu-item:hover), .side-menu :deep(.el-sub-menu__title:hover) {
  background-color: #334155 !important; 
  color: #f8fafc !important;
}
.side-menu :deep(.el-menu-item.is-active) {
  background: rgba(14, 165, 233, 0.15) !important; 
  color: #38bdf8 !important;
  font-weight: bold;
  box-shadow: inset 3px 0 0 #38bdf8; /* 激活状态的左侧高亮条 */
}
.side-menu :deep(.el-sub-menu .el-menu-item) { 
  background-color: transparent !important; 
  padding-left: 50px !important; 
}

/* ================= 顶部导航栏 ================= */
.top-bar { 
  background: #1e293b; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 0 24px; 
  border-bottom: 1px solid #334155; 
  height: 60px;
}

.breadcrumb { 
  font-size: 14px; 
  color: #94a3b8; 
  display: flex; 
  align-items: center;
  gap: 8px;
}
.breadcrumb .dot {
  width: 6px; height: 6px; background: #38bdf8; border-radius: 50%;
}

.user-info { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  font-size: 14px; 
}
.admin-name { color: #cbd5e1; font-weight: 600; }
.logout-btn { font-weight: bold; }
.logout-btn:hover { color: #fca5a5 !important; }

/* ================= 主内容区 ================= */
.page-content { 
  padding: 0; /* 去掉默认内边距，让子页面的 dark-page 撑满 */
  background: #0f172a; 
}
</style>