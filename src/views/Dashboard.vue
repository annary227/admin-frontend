<template>
  <div class="dashboard-page">
    <!-- 🆕 赛博极光背景层 -->
    <div class="aurora-bg">
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>
      <div class="glow glow-3"></div>
    </div>

    <div class="content-wrapper">
      <!-- 1. 顶部数据卡片总览 -->
      <el-row :gutter="24" class="data-cards">
        <el-col :span="8">
          <div class="glass-card data-card">
            <div class="card-glow blue-glow"></div>
            <div class="card-icon">👥</div>
            <div class="card-info">
              <div class="card-title">在线活跃用户</div>
              <div class="card-value">{{ onlineUsers.length }} <span class="unit">人</span></div>
              <div class="card-footer">最近 5 分钟内活跃</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="glass-card data-card">
            <div class="card-glow purple-glow"></div>
            <div class="card-icon">🎰</div>
            <div class="card-info">
              <div class="card-title">今日抽奖总数</div>
              <div class="card-value">1,248 <span class="unit">次</span></div>
              <div class="card-footer">相比昨日 +15.2%</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="glass-card data-card">
            <div class="card-glow pink-glow"></div>
            <div class="card-icon">💰</div>
            <div class="card-info">
              <div class="card-title">今日流水总计</div>
              <div class="card-value">¥ 458,000</div>
              <div class="card-footer">相比昨日 +8.4%</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 2. 核心工作区：全游戏调控中心 -->
      <div class="glass-card main-work-card">
        <div class="work-header">
          <div>
            <h2>🎯 全游戏概率调控中心</h2>
            <p>点击任意游戏卡片，即刻进入该游戏的全局概率配置</p>
          </div>
          <div class="status-badge">共 8 款游戏</div>
        </div>
        
        <!-- 4列高级游戏网格 -->
        <div class="game-grid">
          <div 
            v-for="game in gameList" 
            :key="game.name" 
            class="game-card"
            @click="openGlobalProbModal(game)"
          >
            <!-- 卡片光晕 -->
            <div class="game-glow" :style="{ background: game.color }"></div>
            
            <div class="game-top">
              <div class="game-icon-box" :style="{ background: `linear-gradient(135deg, ${game.color}, ${game.color}88)`, boxShadow: `0 8px 16px ${game.color}55` }">
                {{ game.icon }}
              </div>
              <div class="game-status">全局调控</div>
            </div>

            <div class="game-details">
              <h3>{{ game.name }}</h3>
              <div class="game-price-tag">単価：<strong>¥{{ game.price }}</strong></div>
            </div>

            <div class="game-bottom-action">
              <span>调整概率</span>
              <span class="arrow">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 🆕 暗黑霓虹风弹窗 -->
    <el-dialog 
      v-model="globalProbVisible" 
      :title="`全局概率调控 - ${currentGame.name}`" 
      width="520px" 
      top="5vh" 
      class="neon-dialog"
      :show-close="true"
    >
      <div class="dialog-scroll-area">
        <div v-for="(item, index) in globalProbabilities" :key="index" class="prob-item">
          <div class="prob-header">
            <span class="prob-name">{{ item.name }}</span>
            <span class="prob-value">¥{{ item.value.toLocaleString() }}</span>
          </div>
          <el-slider 
            v-model="item.probability" 
            :min="0" 
            :max="100" 
            :step="0.001" 
            @input="(val) => handleGlobalSliderChange(index, val)"
          />
          <div class="prob-percent">{{ item.probability.toFixed(3) }}%</div>
        </div>
        
        <div class="total-weight-box">
          <span>当前总概率</span>
          <span :class="currentGameTotalWeight === 100 ? 'text-green' : 'text-red'">
            {{ currentGameTotalWeight.toFixed(2) }}%
          </span>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="globalProbVisible = false" class="btn-cancel">取消</el-button>
          <el-button 
            type="primary" 
            color="#e83862" 
            @click="saveGlobalProbability" 
            :loading="savingGlobal" 
            :disabled="Math.abs(currentGameTotalWeight - 100) > 0.1"
            class="btn-save"
          >
            保存并生效
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../api/request';

// ====== 8个游戏的基础配置 ======
const gameList = ref([
  { name: '金魚すくい', price: 200, icon: '🐟', color: '#2ed573' },
  { name: 'ダーツチャレンジ', price: 100, icon: '🎯', color: '#ff4757' },
  { name: 'クレーンゲーム', price: 300, icon: '🏗️', color: '#0abde3' },
  { name: 'ガチャポン', price: 500, icon: '🎰', color: '#a55eea' },
  { name: 'スクラッチ', price: 50, icon: '🪙', color: '#ffa502' },
  { name: 'ルーレット', price: 1000, icon: '🎡', color: '#e84118' },
  { name: '宝探し', price: 300, icon: '💎', color: '#009432' },
  { name: 'スロット', price: 500, icon: '🍒', color: '#f39c12' }
]);

// ====== 全局概率逻辑 ======
const globalProbVisible = ref(false);
const currentGame = ref({});
const globalProbabilities = ref([]);
const savingGlobal = ref(false);

const onlineUsers = ref([]);
const fetchOnlineUsers = async () => {
  try {
    const res = await request.get('/admin/online-users'); 
    if (res.data.success) onlineUsers.value = res.data.users;
  } catch (e) { console.error(e); }
};

const currentGameTotalWeight = computed(() => {
  return globalProbabilities.value.reduce((sum, p) => sum + Number(p.probability || 0), 0);
});

const openGlobalProbModal = async (game) => {
  currentGame.value = game;
  globalProbVisible.value = true;
  
  try {
    const res = await request.get(`/admin/probability?gameName=${encodeURIComponent(game.name)}`); 
    if (res.data.success) {
      globalProbabilities.value = res.data.probability.map(p => ({ 
        ...p, 
        probability: Number(p.probability) 
      }));
    }
  } catch (e) { ElMessage.error('获取全局概率失败'); }
};

const handleGlobalSliderChange = (index, newValue) => {
  const list = globalProbabilities.value;
  const isLoseItem = list[index].name === '不中奖' || list[index].name === 'ハズレ';
  
  if (isLoseItem) {
    if (newValue > 100) list[index].probability = 100;
    return;
  }

  let otherWinTotal = 0;
  for (let i = 0; i < list.length; i++) {
    if (i !== index && list[i].name !== '不中奖' && list[i].name !== 'ハズレ') {
      otherWinTotal += Number(list[i].probability);
    }
  }

  if (otherWinTotal + newValue > 100) {
    list[index].probability = Number((100 - otherWinTotal).toFixed(3));
  }

  const loseItem = list.find(p => p.name === '不中奖' || p.name === 'ハズレ');
  if (loseItem) {
    const winTotal = list.filter(p => p.name !== '不中奖' && p.name !== 'ハズレ')
                         .reduce((sum, p) => sum + Number(p.probability), 0);
    loseItem.probability = Number((100 - winTotal).toFixed(3));
  }
};

const saveGlobalProbability = async () => {
  const payloadData = JSON.parse(JSON.stringify(globalProbabilities.value));
  const total = payloadData.reduce((sum, p) => sum + Number(p.probability), 0);
  if (Math.abs(total - 100) > 0.1) {
    return ElMessage.error(`保存失败：当前概率总和为 ${total.toFixed(2)}%，必须等于 100%`);
  }
  
  savingGlobal.value = true;
  try {
    const res = await request.post('/admin/probability', { 
      probability: payloadData,
      gameName: currentGame.value.name
    });
    if (res.data.success) {
      ElMessage.success(`已成功更新 ${currentGame.value.name} 的奖池`);
      globalProbVisible.value = false;
    }
  } catch (e) { 
    ElMessage.error(e.response?.data?.error || '保存失败'); 
  } finally { 
    savingGlobal.value = false;
  }
};

onMounted(() => {
  fetchOnlineUsers();
  setInterval(fetchOnlineUsers, 10000);
});
</script>

<style scoped>
/* ================= 赛博极光背景 ================= */
.dashboard-page {
  position: relative;
  min-height: 100vh;
  background: #09090b; /* 极度深邃的暗黑底色 */
  overflow: hidden;
  font-family: 'Inter', 'Noto Sans JP', sans-serif;
  color: #fff;
}

.aurora-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.5;
  animation: float 10s infinite alternate;
}

.glow-1 { width: 600px; height: 600px; background: #4f46e5; top: -200px; left: -200px; }
.glow-2 { width: 500px; height: 500px; background: #e83862; bottom: -150px; right: -100px; animation-delay: -5s; }
.glow-3 { width: 400px; height: 400px; background: #0ea5e9; top: 40%; left: 30%; animation-delay: -2s; }

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(50px, 50px) scale(1.1); }
}

.content-wrapper {
  position: relative;
  z-index: 10;
  padding: 30px;
  max-width: 1600px;
  margin: 0 auto;
}

/* ================= 毛玻璃基础卡片 ================= */
.glass-card {
  background: rgba(255, 255, 255, 0.05); /* 玻璃底色 */
  backdrop-filter: blur(20px); /* 毛玻璃 */
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

/* ================= 顶部数据卡片 ================= */
.data-cards { margin-bottom: 30px; }
.data-card {
  position: relative;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  overflow: hidden;
  transition: transform 0.3s;
}
.data-card:hover { transform: translateY(-5px); }

.card-glow {
  position: absolute;
  width: 100px; height: 100px;
  border-radius: 50%;
  filter: blur(50px);
  top: -20px; right: -20px;
}
.blue-glow { background: #3b82f6; opacity: 0.5; }
.purple-glow { background: #8b5cf6; opacity: 0.5; }
.pink-glow { background: #e83862; opacity: 0.5; }

.card-icon {
  font-size: 36px;
  width: 65px; height: 65px;
  display: flex; justify-content: center; align-items: center;
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.1);
}

.card-info { z-index: 2; }
.card-title { font-size: 14px; color: #a1a1aa; margin-bottom: 5px; font-weight: 500; }
.card-value { font-size: 36px; font-weight: 900; text-shadow: 0 0 20px rgba(255,255,255,0.3); }
.card-value .unit { font-size: 14px; font-weight: normal; color: #a1a1aa; }
.card-footer { font-size: 12px; color: #a1a1aa; margin-top: 5px; }

/* ================= 全游戏调控中心 ================= */
.main-work-card {
  padding: 30px;
}

.work-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}
.work-header h2 { margin: 0 0 8px 0; font-size: 24px; font-weight: 900; letter-spacing: 1px; }
.work-header p { margin: 0; font-size: 14px; color: #a1a1aa; }

.status-badge {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  color: #a1a1aa;
}

/* 4列暗黑霓虹游戏网格 */
.game-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
@media (max-width: 1200px) { .game-grid { grid-template-columns: repeat(3, 1fr); } }

.game-card {
  position: relative;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 20px;
  padding: 20px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 190px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 0 20px rgba(255,255,255,0.02);
}

.game-card:hover {
  transform: translateY(-10px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255,255,255,0.05);
}

.game-glow {
  position: absolute;
  top: -40px; right: -40px;
  width: 120px; height: 120px;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.4;
  transition: all 0.5s;
}
.game-card:hover .game-glow { opacity: 0.8; transform: scale(1.5); }

.game-top { display: flex; justify-content: space-between; margin-bottom: 15px; z-index: 2; }
.game-icon-box {
  width: 50px; height: 50px;
  border-radius: 16px;
  display: flex; justify-content: center; align-items: center;
  font-size: 26px;
  color: white;
  border: 1px solid rgba(255,255,255,0.2);
}
.game-status {
  font-size: 11px;
  color: #a1a1aa;
  background: rgba(255,255,255,0.05);
  padding: 4px 10px;
  border-radius: 10px;
  height: fit-content;
}

.game-details { z-index: 2; flex: 1; }
.game-details h3 { margin: 0 0 6px 0; font-size: 20px; color: #fff; font-weight: 800; }
.game-price-tag { font-size: 13px; color: #a1a1aa; }
.game-price-tag strong { color: #e83862; font-size: 18px; text-shadow: 0 0 10px rgba(232, 56, 98, 0.5); }

.game-bottom-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255,255,255,0.05);
  font-size: 13px;
  font-weight: bold;
  color: #71717a;
  transition: 0.3s;
  z-index: 2;
}
.game-card:hover .game-bottom-action { color: #fff; }
.game-card:hover .arrow { transform: translateX(5px); color: #e83862; }

/* ================= 弹窗 ================= */
.neon-dialog :deep(.el-dialog) {
  background: rgba(20, 20, 25, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  box-shadow: 0 0 50px rgba(232, 56, 98, 0.2);
}
.neon-dialog :deep(.el-dialog__title) { color: #fff; font-weight: 900; letter-spacing: 1px; }
.dialog-scroll-area { max-height: 60vh; overflow-y: auto; padding-right: 10px; }

/* 细调滑块颜色 */
.neon-dialog :deep(.el-slider__runway) { background-color: #27272a; }
.neon-dialog :deep(.el-slider__bar) { background-color: #e83862; }
.neon-dialog :deep(.el-slider__button) { border-color: #e83862; box-shadow: 0 0 10px #e83862; }

.prob-item { 
  margin-bottom: 20px; padding: 18px; 
  background: rgba(255,255,255,0.03); 
  border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);
}
.prob-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
.prob-name { font-weight: bold; color: #fff; font-size: 15px; }
.prob-value { color: #a1a1aa; font-size: 13px; }
.prob-percent { text-align: right; font-weight: 900; color: #e83862; margin-top: 5px; font-size: 16px; text-shadow: 0 0 10px rgba(232, 56, 98, 0.4); }

.total-weight-box {
  margin-top: 20px; padding: 16px; 
  background: rgba(255,255,255,0.05); 
  border-radius: 14px; font-weight: 900; font-size: 16px; 
  display: flex; justify-content: space-between;
}
.text-green { color: #10b981; text-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
.text-red { color: #ef4444; text-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }

.dialog-footer { display: flex; gap: 15px; justify-content: flex-end; }
.btn-cancel { 
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); 
  color: #a1a1aa; border-radius: 12px; padding: 12px 24px; 
}
.btn-cancel:hover { background: rgba(255,255,255,0.1); color: #fff; }
.btn-save { border-radius: 12px; padding: 12px 30px; font-weight: 900; box-shadow: 0 0 20px rgba(232, 56, 98, 0.4); }
</style>