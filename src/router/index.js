import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Layout from '../layout/Layout.vue'; 

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/login', 
      component: Login 
    },
    {
      path: '/',
      component: Layout, 
      redirect: '/dashboard', 
      children: [
        { 
          path: 'dashboard', 
          component: () => import('../views/Dashboard.vue') 
        },
        // 🆕 新增：MLB 赛事管理
        { 
          path: 'mlb-manage', 
          component: () => import('../views/MlbMatchManage.vue') 
        },
        // 🆕 新增：棒球注单流水
        { 
          path: 'mlb-bets', 
          component: () => import('../views/MlbBets.vue') 
        },
        { 
          path: 'users', 
          component: () => import('../views/Users.vue') 
        },
        { 
          path: 'records', 
          component: () => import('../views/Records.vue') 
        },
        { 
          path: 'recharge', 
          component: () => import('../views/Recharge.vue') 
        },
        // 🆕 新增：出金审批
        { 
          path: 'withdrawals', 
          component: () => import('../views/Withdrawals.vue') 
        },
        // 🆕 新增：实名资料审核
        { 
          path: 'verify', 
          component: () => import('../views/Verify.vue') 
        }
      ]
    }
  ]
});

// 现代 Vue Router 4 守卫写法 (消除黄色警告)
router.beforeEach((to, from) => {
  const token = localStorage.getItem('admin_token');
  
  // 1. 如果去的是登录页
  if (to.path === '/login') {
    // 如果已经有 token 了，直接放行去首页
    if (token) return '/dashboard';
    // 否则正常去登录
    return true;
  }
  
  // 2. 如果去的是后台页面，但没 token，强制踢回登录页
  if (!token) {
    return '/login';
  }

  // 3. 正常放行
  return true;
});

export default router;