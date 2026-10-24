<template>
  <div class="login-layout">
    <!-- 背景光斑 -->
    <div class="glow-circle circle-1"></div>
    <div class="glow-circle circle-2"></div>

    <div class="login-wrapper">
      <!-- 左侧：品牌宣传 (PC端显示) -->
      <div class="brand-section">
        <div class="brand-logo">
          <div class="logo-icon">Q</div>
          <h1>QUICK ONE</h1>
        </div>
        <h2>次世代のオンラインくじ<br>最高 50,000,000 円が当たる！</h2>
        <p>ネット専用いつでも秒で当たる宝くじ。安心・安全の取引環境で、あなたのラッキーを試そう。</p>
        <div class="trust-badges">
          <span>🔒 SSL暗号化通信</span>
          <span>🛡️ 公安委員会認可</span>
          <span>⚡ 即時入出金</span>
        </div>
      </div>

      <!-- 右侧：登录表单 -->
      <div class="form-section">
        <div class="login-card">
          <div class="mobile-logo">
            <div class="logo-icon">Q</div>
          </div>
          
          <h2 class="welcome-title">おかえりなさい</h2>
          <p class="welcome-sub">アカウントにログインして取引を開始</p>

          <div class="form-group">
            <label>ユーザー名 / 邮箱</label>
            <div class="input-wrapper">
              <el-icon><User /></el-icon>
              <input v-model="username" type="text" placeholder="ユーザー名を入力" />
            </div>
          </div>

          <div class="form-group">
            <label>パスワード / 密码</label>
            <div class="input-wrapper">
              <el-icon><Lock /></el-icon>
              <input v-model="password" type="password" placeholder="パスワードを入力" @keyup.enter="handleLogin" />
            </div>
          </div>

          <div class="form-actions">
            <el-checkbox v-model="rememberMe">ログイン状態を保持</el-checkbox>
            <a class="forgot-pwd">パスワードをお忘れですか？</a>
          </div>
          
          <button class="login-btn" @click="handleLogin" :disabled="isLoading">
            {{ isLoading ? 'ログイン中...' : 'ログイン / 登 录' }}
          </button>

          <p class="register-link">
            アカウントをお持ちでないですか？ 
            <a @click="$router.push('/register')">新規登録</a>
          </p>

          <div class="social-login">
            <p>または以下でログイン</p>
            <div class="social-icons">
              <div class="social-icon">G</div>
              <div class="social-icon">X</div>
              <div class="social-icon">L</div>
            </div>
          </div>

          <p class="footer-text">※本サイトは18歳未満のご利用はできません。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import request from '../api/request';
import { User, Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const username = ref('test_user');
const password = ref('123456');
const rememberMe = ref(true);
const isLoading = ref(false);
const router = useRouter();

const handleLogin = async () => {
  if (!username.value || !password.value) return ElMessage.warning('请输入账号密码');
  
  isLoading.value = true;
  try {
    const res = await request.post('/user/login', { 
      username: username.value, 
      password: password.value 
    });
    if (res.data.success) {
      localStorage.setItem('user', JSON.stringify(res.data.user));
      ElMessage.success('ログイン成功');
      router.push('/');
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '登录失败，请检查账号密码');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* ================= 整体布局 ================= */
.login-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #0b1120; /* 极深蓝背景 */
  font-family: 'Noto Sans JP', sans-serif;
  position: relative;
  overflow: hidden;
}

/* 背景动态光斑 */
.glow-circle { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.4; }
.circle-1 { width: 600px; height: 600px; background: #e83862; top: -15%; left: -10%; }
.circle-2 { width: 700px; height: 700px; background: #0ea5e9; bottom: -20%; right: -10%; }

/* 核心包裹层（PC端左右分栏） */
.login-wrapper {
  position: relative;
  z-index: 10;
  display: flex;
  width: 100%;
  max-width: 1100px;
  height: 650px;
  background: rgba(15, 23, 42, 0.6); /* 半透明深色底 */
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
  overflow: hidden;
}

/* ================= 左侧品牌区 ================= */
.brand-section {
  flex: 1;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(135deg, rgba(232, 56, 98, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.brand-logo { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
.logo-icon { width: 50px; height: 50px; background: #e83862; color: white; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 28px; font-weight: bold; font-family: serif; box-shadow: 0 0 20px rgba(232, 56, 98, 0.4); }
.brand-logo h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px; color: white; }
.brand-section h2 { font-size: 32px; line-height: 1.4; margin-bottom: 20px; color: white; }
.brand-section p { color: #94a3b8; font-size: 15px; line-height: 1.8; margin-bottom: 40px; }

.trust-badges { display: flex; gap: 15px; flex-wrap: wrap; }
.trust-badges span { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 15px; border-radius: 20px; font-size: 13px; color: #cbd5e1; }

/* ================= 右侧表单区 ================= */
.form-section {
  flex: 1;
  padding: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-card {
  width: 100%;
  max-width: 380px;
}

.mobile-logo { display: none; }

.welcome-title { margin: 0 0 10px; font-size: 28px; color: white; font-weight: 900; }
.welcome-sub { margin: 0 0 30px; font-size: 14px; color: #94a3b8; }

/* 输入框 */
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 13px; font-weight: bold; color: #cbd5e1; margin-bottom: 8px; }
.input-wrapper {
  display: flex; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px; padding: 14px 16px; transition: 0.3s;
}
.input-wrapper:focus-within { border-color: #e83862; background: rgba(232, 56, 98, 0.05); box-shadow: 0 0 0 4px rgba(232, 56, 98, 0.1); }
.input-wrapper .el-icon { color: #64748b; font-size: 18px; }
.input-wrapper input { flex: 1; border: none; outline: none; background: transparent; font-size: 15px; color: white; }
.input-wrapper input::placeholder { color: #475569; }

/* 操作区 */
.form-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
:deep(.el-checkbox__label) { color: #94a3b8; }
.forgot-pwd { font-size: 13px; color: #e83862; cursor: pointer; font-weight: bold; }
.forgot-pwd:hover { text-decoration: underline; }

.login-btn {
  width: 100%; padding: 16px; background: linear-gradient(135deg, #e83862, #f43f5e);
  color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 900;
  cursor: pointer; transition: 0.3s; box-shadow: 0 8px 20px rgba(232, 56, 98, 0.4); letter-spacing: 1px;
}
.login-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(232, 56, 98, 0.6); }
.login-btn:disabled { background: #334155; color: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }

.register-link { margin-top: 25px; font-size: 14px; color: #94a3b8; text-align: center; }
.register-link a { color: #e83862; font-weight: bold; cursor: pointer; text-decoration: underline; }

/* 第三方登录 */
.social-login { margin-top: 30px; text-align: center; }
.social-login p { font-size: 12px; color: #64748b; margin-bottom: 15px; position: relative; }
.social-login p::before, .social-login p::after { content: ""; position: absolute; top: 50%; width: 30%; height: 1px; background: #334155; }
.social-login p::before { left: 0; }
.social-login p::after { right: 0; }
.social-icons { display: flex; justify-content: center; gap: 15px; }
.social-icon { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; justify-content: center; align-items: center; font-weight: bold; color: #cbd5e1; cursor: pointer; transition: 0.2s; border: 1px solid rgba(255,255,255,0.1); }
.social-icon:hover { background: rgba(255,255,255,0.1); color: white; }

.footer-text { margin-top: 30px; font-size: 11px; color: #475569; text-align: center; }

/* ================= 📱 手机端适配 ================= */
@media (max-width: 900px) {
  .login-wrapper {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
    border-radius: 0;
    border: none;
    background: transparent;
    backdrop-filter: none;
    box-shadow: none;
  }
  
  .brand-section { display: none; }
  
  .form-section { padding: 20px; }
  
  .login-card { max-width: 100%; padding: 20px; }
  
  .mobile-logo { display: flex; justify-content: center; margin-bottom: 20px; }
  .mobile-logo .logo-icon { width: 70px; height: 70px; font-size: 36px; border-radius: 16px; }
  
  .welcome-title, .welcome-sub { text-align: center; }
}
</style>