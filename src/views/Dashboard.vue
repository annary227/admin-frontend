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
      
      <!-- 左侧：全局概率调控 -->
      <el-col :span="10">
        <el-card shadow="never" class="work-card">
          <template #header>
            <div class="card-header">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="card-title-icon">🎯 全局动态概率调控</span>
                <!-- 🆕 价格选择器 -->
                <el-select v-model="currentCost" size="small" style="width: 130px" @change="fetchGlobalProb">
                  <el-option label="50元奖池" :value="50" />
                  <el-option label="100元奖池" :value="100" />
                  <el-option label="200元奖池" :value="200" />
                  <el-option label="300元奖池" :value="300" />
                  <el-option label="500元奖池" :value="500" />
                  <el-option label="1000元奖池" :value="1000" />
                </el-select>
              </div>
              <!-- 注意：去掉了 :loading，防止被 watch 干扰导致点击无效 -->
              <el-button type="primary" size="small" color="#e83862" @click="saveGlobalProbability">保存并生效</el-button>
            </div>
          </template>
          
          <div class="prob-scroll-container">
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
                :format-tooltip="val => val + '%'" 
              />
              <div class="prob-input">
                <el-input-number 
                  v-model="item.probability" 
                  :min="0" 
                  :max="100" 
                  :step="0.001" 
                  :precision="3" 
                  size="small" 
                />
                <span>%</span>
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

    <!-- 用户专属概率抽屉 -->
    <el-drawer v-model="drawerVisible" :title="`定向调控 - ${currentUser.username}`" size="400px">
      <div class="drawer-content">
        <div class="drawer-header">
          <span style="color:#64748b;">当前设置：</span>
          <el-tag :type="userProbabilities.length ? 'danger' : 'info'" effect="dark" size="small">
            {{ userProbabilities.length ? '专属定制模式' : '跟随全局' }}
          </el-tag>
        </div>

        <div v-if="!userProbabilities.length" class="empty-prob">
          <el-empty description="该用户目前使用全局概率" :image-size="100" />
          <el-button type="primary" color="#e83862" style="width: 100%;" @click="initUserProb">为TA开启专属调频</el-button>
        </div>
        
        <div v-else class="user-prob-list">
          <div v-for="(item, index) in userProbabilities" :key="index" class="prob-item">
            <div class="prob-header">
              <span class="prob-name">{{ item.name }}</span>
              <span class="prob-value">¥{{ item.value.toLocaleString() }}</span>
            </div>
            <el-slider v-model="item.probability" :min="0" :max="100" :step="0.001" />
            <div style="text-align:right; font-weight:bold; color:#e83862; margin-top:5px;">{{ item.probability }}%</div>
          </div>
          <div style="margin-top:40px; display:flex; gap:10px;">
            <el-button style="flex:1;" @click="clearUserProb">恢复全局</el-button>
            <el-button type="primary" color="#e83862" style="flex:1;" @click="saveUserProb" :loading="savingUserProb">保存生效</el-button>
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
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import request from '../api/request';

const router = useRouter();

// ====== 全局概率逻辑 ======
const globalProbabilities = ref([]);
const savingGlobal = ref(false);
const currentCost = ref(500); // 🆕 默认当前选中的奖池价格（500元）

watch(globalProbabilities, (newVal) => {
  if (!newVal.length) return;
  const loseItem = newVal.find(p => p.name === '不中奖' || p.name === 'ハズレ');
  if (!loseItem) return;
  
  const winItemsTotal = newVal.filter(p => p.name !== '不中奖' && p.name !== 'ハズレ')
                             .reduce((sum, p) => sum + Number(p.probability), 0);
  
  let newLoseProb = 100 - winItemsTotal;
  if (newLoseProb < 0) newLoseProb = 0;
  loseItem.probability = Number(newLoseProb.toFixed(3));
}, { deep: true });

const fetchGlobalProb = async () => {
  try {
    // 🆕 动态带上当前选中的价格
    const res = await request.get(`/admin/probability?cost=${currentCost.value}`); 
    if (res.data.success) {
      if (res.data.probability.length === 0) {
        ElMessage.warning(`${currentCost.value}元奖池尚未配置，请去数据库添加`);
      }
      globalProbabilities.value = res.data.probability.map(p => ({ 
        ...p, 
        probability: Number(p.probability) 
      }));
    }
  } catch (e) { ElMessage.error('获取全局概率失败'); }
};

const saveGlobalProbability = async () => {
  console.log("🔥 按钮被点击了！准备发送请求！");
  
  // 深拷贝一份数据，切断响应式引用
  const payloadData = JSON.parse(JSON.stringify(globalProbabilities.value));
  
  // 前端先校验一下总和是否为 100
  const total = payloadData.reduce((sum, p) => sum + Number(p.probability), 0);
  if (Math.abs(total - 100) > 0.1) {
    return ElMessage.error(`保存失败：当前概率总和为 ${total.toFixed(2)}%，必须等于 100%`);
  }
  
  savingGlobal.value = true;
  try {
    // 🆕 连同 currentCost 一起发给后端
    const res = await request.post('/admin/probability', { 
      probability: payloadData,
      cost: currentCost.value
    });
    if (res.data.success) {
      ElMessage.success(`已成功更新 ${currentCost.value}元 奖池`);
    }
  } catch (e) { 
    console.error("❌ 保存失败报错：", e);
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

const openUserProbModal = (user) => {
  currentUser.value = user;
  if (user.custom_probability) {
    userProbabilities.value = JSON.parse(user.custom_probability).map(p => ({ ...p, probability: Number(p.probability) }));
  } else {
    userProbabilities.value = [];
  }
  drawerVisible.value = true;
};

const initUserProb = () => {
  // 将当前选中的全局奖池数据复制给专属概率
  userProbabilities.value = globalProbabilities.value.map(p => ({ ...p }));
};

const saveUserProb = async () => {
  savingUserProb.value = true;
  try {
    // 核心修复：过滤掉概率为 0 的垃圾数据，只把生效的传给后端
    const validProbabilities = userProbabilities.value.filter(p => Number(p.probability) > 0);
    
    await request.post(`/admin/set-user-probability/${currentUser.value.id}`, { probability: validProbabilities }); 
    ElMessage.success('该用户专属概率已生效');
    drawerVisible.value = false;
    fetchAllUsers();
  } catch (e) { ElMessage.error('保存失败'); } 
  finally { savingUserProb.value = false; }
};

const clearUserProb = async () => {
  try {
    await request.post(`/admin/set-user-probability/${currentUser.value.id}`, { probability: null }); 
    ElMessage.success('已恢复全局默认');
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
  fetchGlobalProb();
  fetchOnlineUsers();
  fetchAllUsers();
  setInterval(fetchOnlineUsers, 10000);
});
</script>

<style scoped>
.dashboard-page {
  padding: 0;
  background: transparent;
}

/* 顶部数据卡片 */
.data-cards { margin-bottom: 20px; }
.data-card { border-radius: 16px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.03); transition: transform 0.2s; }
.data-card:hover { transform: translateY(-2px); }
.card-title { font-size: 14px; color: #64748b; font-weight: 600; margin-bottom: 10px; }
.card-value { font-size: 32px; font-weight: 900; color: #0f172a; }
.card-value .unit { font-size: 14px; font-weight: normal; color: #94a3b8; }
.text-blue { color: #0ea5e9; }
.text-red { color: #e83862; }
.card-footer { font-size: 12px; color: #94a3b8; margin-top: 10px; }

/* 工作卡片 */
.work-card { border-radius: 16px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title-icon { font-size: 16px; font-weight: bold; color: #1e293b; }

/* 概率滚动容器 */
.prob-scroll-container {
  max-height: 520px;
  overflow-y: auto;
  padding-right: 10px;
}
.prob-scroll-container::-webkit-scrollbar { width: 6px; }
.prob-scroll-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.prob-scroll-container::-webkit-scrollbar-track { background: transparent; }

/* 调频滑块 */
.prob-item { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; }
.prob-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
.prob-name { font-weight: bold; color: #1e293b; }
.prob-value { color: #64748b; font-size: 13px; font-weight: 500; }
.prob-input { display: flex; align-items: center; gap: 10px; margin-top: 10px; }

/* 抽屉面板 */
.drawer-content { padding: 10px; }
.drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed #e2e8f0; }
.empty-prob { margin-top: 50px; }
.user-prob-list .prob-item { margin-bottom: 15px; background: #f8fafc; padding: 15px; border-radius: 12px; }
</style>