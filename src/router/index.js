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
        // 🆕 MLB 赛事管理
        { 
          path: 'mlb-manage', 
          component: () => import('../views/MlbMatchManage.vue') 
        },
        // 🆕 棒球注单流水
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
        // 🆕 出金审批
        { 
          path: 'withdrawals', 
          component: () => import('../views/Withdrawals.vue') 
        },
        // 🆕 入金审批 (新增这个！)
        { 
          path: 'deposits', 
          component: () => import('../views/Deposits.vue') 
        },
        // 🆕 实名资料审核
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
  
  if (to.path === '/login') {
    if (token) return '/dashboard';
    return true;
  }
  
  if (!token) {
    return '/login';
  }

  return true;
});

export default router;