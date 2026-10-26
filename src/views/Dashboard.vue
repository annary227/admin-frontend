<template>
  <div class="dashboard-page">
    <!-- 1. 数据卡片总览 -->
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

    <!-- 2. 核心工作区 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      
      <!-- 左侧：8个游戏的概率调控 -->
      <el-col :span="10">
        <el-card shadow="never" class="work-card">
          <template #header>
            <div class="card-header">
              <span class="card-title-icon">🎯 全游戏概率调控中心</span>
            </div>
          </template>
          
          <!-- 8个游戏方块 -->
          <div class="game-grid">
            <div 
              v-for="game in gameList" 
              :key="game.name" 
              class="game-item"
              @click="openGlobalProbModal(game)"
            >
              <div class="game-icon">{{ game.icon }}</div>
              <div class="game-info">
                <div class="game-name">{{ game.name }}</div>
                <div class="game-price">{{ game.price }} 円</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：在线用户监控 -->
      <el-col :span="14">
        <el-card shadow="never" class="work-card">
          <template #header>
            <div class="card-header" style="flex-wrap: wrap; gap: 10px;">
              <span class="card-title-icon">👥 全量用户监控与管理</span>
              <div style="display: flex; gap: 10px; align-items: center;">
                <el-input 
                  v-model="keyword" 
                  placeholder="搜索ID或用户名" 
                  size="small"
                  style="width: 200px;" 
                  clearable 
                  @keyup.enter="fetchAllUsers"
                />
                <el-button type="primary" size="small" color="#e83862" @click="fetchAllUsers">搜索</el-button>
              </div>
            </div>
          </template>
          
          <el-table :data="allUsersList" size="large" style="width: 100%" :header-cell-style="{background:'#f8fafc', color:'#64748b', fontWeight:'bold'}">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="username" label="账号" width="120" />
            <el-table-column prop="balance" label="余额" width="120">
              <template #default="scope">
                <span style="font-weight:bold; color:#10b981;">¥{{ scope.row.balance.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="scope">
                <el-tag v-if="scope.row.custom_probability" type="danger" effect="dark" size="small" round>已定向调频</el-tag>
                <el-tag v-else type="info" size="small" round>全局概率</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="150">
              <template #default="scope">
                <el-dropdown trigger="click">
                  <el-button type="primary" link>管理操作 <el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="openUserProbModal(scope.row)">⚙️ 概率调控</el-dropdown-item>
                      <el-dropdown-item @click="openRechargeModal(scope.row)">💰 资金上分</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

    </el-row>

    <!-- 🆕 全局概率调控弹窗 -->
    <el-dialog v-model="globalProbVisible" :title="`全局概率调控 - ${currentGame.name}`" width="500px" top="5vh">
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

    <!-- 🆕 用户专属概率抽屉 -->
    <el-drawer v-model="drawerVisible" :title="`定向调控 - ${currentUser.username} (${currentGame.name})`" size="400px">
      <div class="drawer-content">
        <div class="drawer-header">
          <span style="color:#64748b;">当前配置：</span>
          <el-tag :type="userProbabilities.length ? 'danger' : 'info'" effect="dark" size="small">
            {{ userProbabilities.length ? '专属定制中' : '跟随全局概率' }}
          </el-tag>
        </div>

        <div v-if="!userProbabilities.length" class="empty-prob">
          <el-empty :description="`该用户在 ${currentGame.name} 暂无专属调频`" :image-size="100" />
          <el-button type="primary" color="#e83862" style="width: 100%;" @click="initUserProb">
            为TA开启专属调频
          </el-button>
        </div>
        
        <div v-else class="user-prob-list">
          <div v-for="(item, index) in userProbabilities" :key="index" class="prob-item">
            <div class="prob-header">
              <span class="prob-name">{{ item.name }}</span>
              <span class="prob-value">¥{{ item.value.toLocaleString() }}</span>
            </div>
            <el-slider 
              v-model="item.probability" 
              :min="0" 
              :max="100" 
              :step="0.001" 
              @input="(val) => handleUserSliderChange(index, val)"
            />
            <div style="text-align:right; font-weight:bold; color:#e83862; margin-top:5px;">{{ item.probability.toFixed(3) }}%</div>
          </div>
          
          <div style="margin-top: 15px; padding: 10px; background: #f8fafc; border-radius: 8px; text-align: center; font-weight: bold;">
            当前总概率：
            <span :style="{ color: currentUserTotalWeight === 100 ? '#10b981' : '#ef4444' }">
              {{ currentUserTotalWeight.toFixed(2) }}%
            </span>
          </div>

          <div style="margin-top:20px; display:flex; gap:10px;">
            <el-button style="flex:1;" @click="clearUserProb">清空此池专属</el-button>
            <el-button type="primary" color="#e83862" style="flex:1;" @click="saveUserProb" :loading="savingUserProb" :disabled="Math.abs(currentUserTotalWeight - 100) > 0.1">
              保存生效
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 上分弹窗 -->
    <el-dialog v-model="rechargeVisible" title="资金上分" width="400px" center>
      <el-form>
        <el-form-item label="操作对象">
          <span style="font-weight:bold;">{{ currentUser.username }}</span>
        </el-form-item>
        <el-form-item label="操作金额">
          <el-input-number v-model="rechargeAmount" :step="1000" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeVisible = false">取消</el-button>
        <el-button type="primary" color="#e83862" @click="submitRecharge" :loading="savingRecharge">确认上分</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import request from '../api/request';

const router = useRouter();

// ====== 🆕 8个游戏的基础配置 ======
const gameList = ref([
  { name: '金魚すくい', price: 200, icon: '🐟' },
  { name: 'ダーツチャレンジ', price: 100, icon: '🎯' },
  { name: 'クレーンゲーム', price: 300, icon: '🏗️' },
  { name: 'ガチャポン', price: 500, icon: '🎰' },
  { name: 'スクラッチ', price: 50, icon: '🪙' },
  { name: 'ルーレット', price: 1000, icon: '🎡' },
  { name: '宝探し', price: 300, icon: '💎' },
  { name: 'スロット', price: 500, icon: '🍒' }
]);

// ====== 全局概率逻辑 ======
const globalProbVisible = ref(false);
const currentGame = ref({});
const globalProbabilities = ref([]);
const savingGlobal = ref(false);

const currentGameTotalWeight = computed(() => {
  return globalProbabilities.value.reduce((sum, p) => sum + Number(p.probability || 0), 0);
});

// 打开游戏调控弹窗
const openGlobalProbModal = async (game) => {
  currentGame.value = game;
  globalProbVisible.value = true;
  
  try {
    // 🆕 现在传递 game.name（比如“金魚すくい”）
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
    // 🆕 传递 gameName 保存
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

// ====== 用户数据 ======
const onlineUsers = ref([]);
const allUsersList = ref([]);
const keyword = ref('');

const fetchOnlineUsers = async () => {
  try {
    const res = await request.get('/admin/online-users'); 
    if (res.data.success) onlineUsers.value = res.data.users;
  } catch (e) { console.error(e); }
};

const fetchAllUsers = async () => {
  try {
    const res = await request.get(`/admin/users?keyword=${keyword.value}`); 
    if (res.data.success) allUsersList.value = res.data.users;
  } catch (e) { ElMessage.error('获取用户失败'); }
};

// ====== 定向调频逻辑 ======
const drawerVisible = ref(false);
const currentUser = ref({});
const userProbabilities = ref([]);
const savingUserProb = ref(false);

const currentUserTotalWeight = computed(() => {
  return userProbabilities.value.reduce((sum, p) => sum + Number(p.probability || 0), 0);
});

const handleUserSliderChange = (index, newValue) => {
  const list = userProbabilities.value;
  if (list[index].name === '不中奖' || list[index].name === 'ハズレ') {
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

// 🆕 打开抽屉
const openUserProbModal = (user) => {
  currentUser.value = user;
  userProbabilities.value = [];
  
  // 如果没选中游戏，默认给个空提示
  if (!currentGame.value.name) {
    ElMessage.warning('请先在左侧点击一个游戏进行调频');
    return;
  }
  
  if (user.custom_probability) {
    try {
      const parsed = JSON.parse(user.custom_probability);
      // 如果是对象，取出当前游戏名的专属
      if (parsed && !Array.isArray(parsed) && parsed[currentGame.value.name]) {
        userProbabilities.value = parsed[currentGame.value.name];
      }
    } catch (e) { console.error(e); }
  }
  
  drawerVisible.value = true;
};

const initUserProb = () => {
  userProbabilities.value = JSON.parse(JSON.stringify(globalProbabilities.value));
};

const saveUserProb = async () => {
  if (Math.abs(currentUserTotalWeight.value - 100) > 0.1) {
    return ElMessage.error(`保存失败：概率总和必须等于 100%，当前为 ${currentUserTotalWeight.value.toFixed(2)}%`);
  }

  savingUserProb.value = true;
  try {
    let existingConfig = {};
    if (currentUser.value.custom_probability) {
      try {
        const parsed = JSON.parse(currentUser.value.custom_probability);
        if (!Array.isArray(parsed)) existingConfig = parsed;
      } catch (e) {}
    }

    // 🆕 按游戏名存入对象
    existingConfig[currentGame.value.name] = userProbabilities.value.filter(p => Number(p.probability) > 0);

    await request.post(`/admin/set-user-probability/${currentUser.value.id}`, { probability: existingConfig }); 
    ElMessage.success(`该用户 ${currentGame.value.name} 专属概率已生效`);
    drawerVisible.value = false;
    fetchAllUsers();
  } catch (e) { ElMessage.error('保存失败'); } 
  finally { savingUserProb.value = false; }
};

const clearUserProb = async () => {
  try {
    let existingConfig = {};
    if (currentUser.value.custom_probability) {
      try {
        const parsed = JSON.parse(currentUser.value.custom_probability);
        if (!Array.isArray(parsed)) existingConfig = parsed;
      } catch (e) {}
    }

    delete existingConfig[currentGame.value.name];

    await request.post(`/admin/set-user-probability/${currentUser.value.id}`, { 
      probability: Object.keys(existingConfig).length > 0 ? existingConfig : null 
    }); 
    ElMessage.success('已清空该游戏专属概率');
    drawerVisible.value = false;
    fetchAllUsers();
  } catch (e) { ElMessage.error('操作失败'); }
};

// ====== 上分逻辑 ======
const rechargeVisible = ref(false);
const rechargeAmount = ref(0);
const savingRecharge = ref(false);

const openRechargeModal = (user) => {
  currentUser.value = user;
  rechargeAmount.value = 0;
  rechargeVisible.value = true;
};

const submitRecharge = async () => {
  if (rechargeAmount.value === 0) return ElMessage.warning('金额不能为0');
  savingRecharge.value = true;
  try {
    const res = await request.post('/admin/recharge', { userId: currentUser.value.id, amount: rechargeAmount.value }); 
    if (res.data.success) {
      ElMessage.success(res.data.message);
      rechargeVisible.value = false;
      fetchAllUsers();
    }
  } catch (e) { ElMessage.error(e.response?.data?.error || '操作失败'); }
  finally { savingRecharge.value = false; }
};

onMounted(() => {
  fetchOnlineUsers();
  fetchAllUsers();
  setInterval(fetchOnlineUsers, 10000);
});
</script>

<style scoped>
.dashboard-page { padding: 0; background: transparent; }
.data-cards { margin-bottom: 20px; }
.data-card { border-radius: 16px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.03); transition: transform 0.2s; }
.data-card:hover { transform: translateY(-2px); }
.card-title { font-size: 14px; color: #64748b; font-weight: 600; margin-bottom: 10px; }
.card-value { font-size: 32px; font-weight: 900; color: #0f172a; }
.card-value .unit { font-size: 14px; font-weight: normal; color: #94a3b8; }
.text-blue { color: #0ea5e9; }
.text-red { color: #e83862; }
.card-footer { font-size: 12px; color: #94a3b8; margin-top: 10px; }
.work-card { border-radius: 16px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title-icon { font-size: 16px; font-weight: bold; color: #1e293b; }

/* 8个游戏方块布局 */
.game-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 5px; }
.game-item { display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s; }
.game-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-color: #e83862; }
.game-icon { font-size: 24px; }
.game-name { font-weight: bold; color: #1e293b; font-size: 14px; }
.game-price { font-size: 12px; color: #e83862; font-weight: 500; margin-top: 2px; }

/* 弹窗滚动区 */
.prob-item { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; }
.prob-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
.prob-name { font-weight: bold; color: #1e293b; }
.prob-value { color: #64748b; font-size: 13px; font-weight: 500; }

/* 抽屉 */
.drawer-content { padding: 10px; }
.drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed #e2e8f0; }
.empty-prob { margin-top: 50px; }
.user-prob-list .prob-item { margin-bottom: 15px; background: #f8fafc; padding: 15px; border-radius: 12px; }
</style>