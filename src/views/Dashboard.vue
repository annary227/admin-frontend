<template>
  <div class="dashboard-page">
    <!-- 1. 顶部数据卡片总览 (保留) -->
    <el-row :gutter="20" class="data-cards">
      <el-col :span="8">
        <el-card shadow="hover" class="data-card">
          <div class="card-title">在线活跃用户</div>
          <div class="card-value">{{ onlineUsers.length }} <span class="unit">人</span></div>
          <div class="card-footer">最近 5 分钟内活跃</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="data-card">
          <div class="card-title">今日抽奖总数</div>
          <div class="card-value text-blue">1,248 <span class="unit">次</span></div>
          <div class="card-footer">相比昨日 +15.2%</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="data-card">
          <div class="card-title">今日流水总计</div>
          <div class="card-value text-red">¥ 458,000</div>
          <div class="card-footer">相比昨日 +8.4%</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 2. 核心工作区：全屏铺满的 8 个游戏方块 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="never" class="work-card">
          <template #header>
            <div class="card-header">
              <span class="card-title-icon">🎯 全游戏奖池概率调控中心</span>
              <span class="card-subtitle">点击任意游戏卡片，即可进入该游戏的全局概率调控</span>
            </div>
          </template>
          
          <!-- 采用响应式 Grid，大屏 4 列，中屏 3 列，小屏 2 列 -->
          <div class="game-grid">
            <div 
              v-for="game in gameList" 
              :key="game.name" 
              class="game-item"
              @click="openGlobalProbModal(game)"
            >
              <!-- 装饰性背景 -->
              <div class="game-bg-deco" :style="{ background: game.color }"></div>
              
              <div class="game-icon-wrapper" :style="{ background: game.color }">
                {{ game.icon }}
              </div>
              <div class="game-info">
                <div class="game-name">{{ game.name }}</div>
                <div class="game-price">単価：<strong>¥{{ game.price }}</strong></div>
              </div>
              <div class="game-action">調控 ></div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 🆕 全局概率调控弹窗 (点游戏方块弹出来) -->
    <el-dialog v-model="globalProbVisible" :title="`全局概率调控 - ${currentGame.name}`" width="500px" top="5vh" class="custom-dialog">
      <div style="max-height: 60vh; overflow-y: auto; padding-right: 10px;">
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
          <div style="text-align:right; font-weight:bold; color:#e83862; margin-top:5px;">{{ item.probability.toFixed(3) }}%</div>
        </div>
        
        <div style="margin-top: 15px; padding: 10px; background: #f8fafc; border-radius: 8px; text-align: center; font-weight: bold;">
          当前总概率：
          <span :style="{ color: currentGameTotalWeight === 100 ? '#10b981' : '#ef4444' }">
            {{ currentGameTotalWeight.toFixed(2) }}%
          </span>
        </div>
      </div>
      <template #footer>
        <el-button @click="globalProbVisible = false">取消</el-button>
        <el-button type="primary" color="#e83862" @click="saveGlobalProbability" :loading="savingGlobal" :disabled="Math.abs(currentGameTotalWeight - 100) > 0.1">保存并生效</el-button>
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

// 获取在线用户数（只用来显示顶部卡片）
const onlineUsers = ref([]);
const fetchOnlineUsers = async () => {
  try {
    const res = await request.get('/admin/online-users'); 
    if (res.data.success) onlineUsers.value = res.data.users;
  } catch (e) { console.error(e); }
};

// 计算当前弹窗总概率
const currentGameTotalWeight = computed(() => {
  return globalProbabilities.value.reduce((sum, p) => sum + Number(p.probability || 0), 0);
});

// 打开游戏调控弹窗
const openGlobalProbModal = async (game) => {
  currentGame.value = game;
  globalProbVisible.value = true;
  
  try {
    // 按游戏名请求数据库
    const res = await request.get(`/admin/probability?gameName=${encodeURIComponent(game.name)}`); 
    if (res.data.success) {
      if (res.data.probability.length === 0) {
        ElMessage.warning(`${game.name} 的奖池尚未配置，请去数据库添加`);
      }
      globalProbabilities.value = res.data.probability.map(p => ({ 
        ...p, 
        probability: Number(p.probability) 
      }));
    }
  } catch (e) { ElMessage.error('获取全局概率失败'); }
};

// 互斥控制逻辑
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

// 保存概率
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
/* 全局背景 */
.dashboard-page {
  padding: 20px;
  background: #f1f5f9;
  min-height: 100vh;
}

/* 顶部数据卡片 */
.data-cards { margin-bottom: 20px; }
.data-card { 
  border-radius: 16px; 
  border: none; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.03); 
  transition: transform 0.2s; 
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}
.data-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
.card-title { font-size: 14px; color: #64748b; font-weight: 600; margin-bottom: 10px; }
.card-value { font-size: 32px; font-weight: 900; color: #0f172a; }
.card-value .unit { font-size: 14px; font-weight: normal; color: #94a3b8; }
.text-blue { color: #0ea5e9; }
.text-red { color: #e83862; }
.card-footer { font-size: 12px; color: #94a3b8; margin-top: 10px; }

/* 工作区卡片 */
.work-card { 
  border-radius: 20px; 
  border: none; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.05); 
  background: white;
  padding: 10px;
}
.card-header { display: flex; flex-direction: column; gap: 5px; }
.card-title-icon { font-size: 20px; font-weight: 900; color: #1e293b; }
.card-subtitle { font-size: 13px; color: #94a3b8; }

/* ================= 🆕 8个游戏高端方块布局 ================= */
.game-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); 
  gap: 20px; 
  padding: 10px 5px; 
}

.game-item { 
  position: relative;
  display: flex; 
  align-items: center; 
  gap: 15px; 
  background: #ffffff; 
  padding: 20px; 
  border-radius: 16px; 
  border: 1px solid #e2e8f0; 
  cursor: pointer; 
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
}

/* 悬浮时的光效和位移 */
.game-item:hover { 
  transform: translateY(-5px); 
  box-shadow: 0 15px 30px rgba(0,0,0,0.1); 
  border-color: transparent;
}

/* 装饰性背景光晕 */
.game-bg-deco {
  position: absolute;
  top: -30px;
  right: -30px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  opacity: 0.1;
  filter: blur(20px);
  transition: all 0.3s;
}
.game-item:hover .game-bg-deco {
  opacity: 0.3;
  transform: scale(1.5);
}

/* 图标 */
.game-icon-wrapper { 
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 6px 15px rgba(0,0,0,0.1);
  z-index: 1;
}

/* 文字信息 */
.game-info { z-index: 1; flex: 1; }
.game-name { font-weight: 900; color: #1e293b; font-size: 16px; margin-bottom: 4px; }
.game-price { font-size: 13px; color: #64748b; }
.game-price strong { color: #e83862; font-size: 15px; }

/* 操作提示 */
.game-action {
  z-index: 1;
  font-size: 14px;
  font-weight: bold;
  color: #cbd5e1;
  transition: color 0.2s;
}
.game-item:hover .game-action {
  color: #e83862;
}

/* 概率弹窗样式优化 */
.custom-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
}
.prob-item { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; transition: 0.2s; }
.prob-item:hover { background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
.prob-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
.prob-name { font-weight: bold; color: #1e293b; }
.prob-value { color: #64748b; font-size: 13px; font-weight: 500; }
</style>