<!-- src/views/MlbBets.vue -->
<template>
  <div class="mlb-bets-container">
    <!-- 🆕 顶部数据看板 -->
    <div class="dashboard">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <span class="stat-label">总注单量</span>
          <span class="stat-value">{{ bets.length }} <small>笔</small></span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💸</div>
        <div class="stat-info">
          <span class="stat-label">总下注金额</span>
          <span class="stat-value">¥{{ totalBetAmount.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card highlight-yellow">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <span class="stat-label">待结算金额</span>
          <span class="stat-value">¥{{ pendingAmount.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card highlight-green">
        <div class="stat-icon">🏆</div>
        <div class="stat-info">
          <span class="stat-label">已派彩金额</span>
          <span class="stat-value">¥{{ totalPayout.toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <!-- 标题与刷新 -->
    <div class="header">
      <h2>⚾ MLB 棒球竞猜注单流水</h2>
      <button class="refresh-btn" @click="fetchBets">
        <span class="refresh-icon">↻</span> 刷新数据
      </button>
    </div>

    <!-- 表格容器 -->
    <div class="table-wrapper">
      <table class="custom-table">
        <thead>
          <tr>
            <th>注单ID</th>
            <th>用户名</th>
            <th>对阵双方</th>
            <th>最终比分</th>
            <th>购买详情</th>
            <th>金额 / 赔率</th>
            <th>结算状态</th>
            <th>下注时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="bet in bets" :key="bet.id">
            <td class="id-col">#{{ bet.id }}</td>
            
            <td>
              <div class="user-info">
                <span class="user-tag">{{ bet.username }}</span>
                <span class="user-id">ID: {{ bet.user_id }}</span>
              </div>
            </td>
            
            <!-- 对阵双方 -->
            <td>
              <div class="match-info">
                <div class="team-line">
                  <span class="label away">客</span>
                  <span class="team-name">{{ bet.away_team }}</span>
                </div>
                <div class="team-line">
                  <span class="label home">主</span>
                  <span class="team-name">{{ bet.home_team }}</span>
                </div>
              </div>
            </td>

            <!-- 最终比分 -->
            <td class="score-col">
              <div class="score-box">
                <span class="score-num">{{ bet.final_away_score }}</span>
                <span class="score-colon">:</span>
                <span class="score-num">{{ bet.final_home_score }}</span>
              </div>
            </td>

            <!-- 购买详情 -->
            <td>
              <div class="bet-detail">
                <span class="bet-type">{{ bet.bet_type === 'pregame' ? '胜负盘' : '波胆比分' }}</span>
                <strong class="bet-selection">
                  <template v-if="bet.bet_type === 'pregame'">
                    {{ bet.selection === 'away' ? `${bet.away_team} 胜利` : `${bet.home_team} 胜利` }}
                  </template>
                  <template v-else>
                    {{ bet.selection }}
                  </template>
                </strong>
              </div>
            </td>

            <!-- 金额与赔率 -->
            <td class="money-col">
              <div class="money-amount">¥{{ bet.amount.toLocaleString() }}</div>
              <div class="money-odds">赔率 {{ bet.odds }}x</div>
            </td>
            
            <!-- 结算状态及派彩 -->
            <td>
              <div class="status-box">
                <span class="status-badge" :class="bet.status">
                  {{ bet.status === 'pending' ? '待结算' : (bet.status === 'won' ? '已中奖' : '未中奖') }}
                </span>
                <div v-if="bet.status === 'won'" class="payout">
                  +¥{{ Math.floor(bet.payout).toLocaleString() }}
                </div>
              </div>
            </td>
            
            <td class="time-col">{{ formatTime(bet.created_at) }}</td>
          </tr>
          
          <!-- 空状态 -->
          <tr v-if="bets.length === 0">
            <td colspan="8">
              <div class="empty-state">
                <span>🕵️‍♂️</span>
                <p>暂无棒球注单记录</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import request from '../api/request'; 
import { ElMessage } from 'element-plus';

const bets = ref([]);

// 🆕 自动计算顶部看板数据
const totalBetAmount = computed(() => {
  return bets.value.reduce((sum, bet) => sum + Number(bet.amount), 0);
});

const pendingAmount = computed(() => {
  return bets.value
    .filter(bet => bet.status === 'pending')
    .reduce((sum, bet) => sum + Number(bet.amount), 0);
});

const totalPayout = computed(() => {
  return bets.value
    .filter(bet => bet.status === 'won')
    .reduce((sum, bet) => sum + Number(bet.payout), 0);
});

const fetchBets = async () => {
  try {
    const res = await request.get('/admin/mlb-bets');
    if (res.data.success) {
      bets.value = res.data.records;
    }
  } catch (error) {
    console.error('获取注单失败', error);
    ElMessage.error('获取注单列表失败');
  }
};

const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  const d = new Date(timeStr);
  return d.toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  fetchBets();
});
</script>

<style scoped>
/* ================= 整体布局 ================= */
.mlb-bets-container {
  padding: 24px;
  color: #e2e8f0;
  font-family: 'Noto Sans JP', 'Inter', sans-serif;
  background: #0f172a;
  min-height: 100vh;
}

/* ================= 顶部数据看板 ================= */
.dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(145deg, #1e293b, #0f172a);
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.stat-card:hover { transform: translateY(-3px); }

.stat-icon {
  font-size: 28px;
  background: rgba(255,255,255,0.05);
  width: 50px; height: 50px;
  display: flex; justify-content: center; align-items: center;
  border-radius: 12px;
}

.stat-info { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 13px; color: #94a3b8; font-weight: bold; }
.stat-value { font-size: 22px; font-weight: 900; color: #f8fafc; font-family: monospace; }
.stat-value small { font-size: 12px; color: #64748b; }

/* 特殊颜色高亮 */
.highlight-yellow { border-color: rgba(245, 158, 11, 0.3); }
.highlight-yellow .stat-value { color: #f59e0b; }
.highlight-green { border-color: rgba(16, 185, 129, 0.3); }
.highlight-green .stat-value { color: #10b981; }

/* ================= 标题与刷新 ================= */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.header h2 { margin: 0; font-size: 20px; color: #fff; letter-spacing: 1px; }
.refresh-btn {
  background: rgba(59, 130, 246, 0.1); 
  color: #3b82f6; 
  border: 1px solid rgba(59, 130, 246, 0.3); 
  padding: 8px 16px; 
  border-radius: 8px; 
  cursor: pointer; 
  font-weight: bold; 
  transition: 0.2s;
  display: flex; align-items: center; gap: 6px;
}
.refresh-btn:hover { background: #3b82f6; color: white; }
.refresh-icon { font-size: 16px; font-weight: 900; }

/* ================= 表格样式 ================= */
.table-wrapper {
  background: #1e293b;
  border-radius: 16px;
  border: 1px solid #334155;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.custom-table th, .custom-table td {
  padding: 18px 20px;
  border-bottom: 1px solid #334155;
  font-size: 13px;
}

.custom-table th {
  background: #0f172a;
  color: #94a3b8;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.custom-table tbody tr { transition: background 0.2s; }
.custom-table tbody tr:hover { background: rgba(255, 255, 255, 0.03); }

/* ================= 表格内元素 ================= */
.id-col { color: #64748b; font-family: monospace; font-size: 14px; }

.user-info { display: flex; flex-direction: column; gap: 4px; }
.user-tag { font-weight: 900; color: #fbbf24; font-size: 14px; }
.user-id { color: #64748b; font-size: 11px; font-family: monospace; }

.match-info { display: flex; flex-direction: column; gap: 8px; }
.team-line { display: flex; align-items: center; gap: 8px; }
.team-name { font-weight: bold; font-size: 14px; color: #e2e8f0; }
.label { font-size: 10px; padding: 2px 6px; border-radius: 4px; color: white; font-weight: bold; }
.label.away { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.label.home { background: linear-gradient(135deg, #ef4444, #b91c1c); }

.score-col { font-family: monospace; font-size: 16px; font-weight: bold; }
.score-box { display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.3); padding: 4px 12px; border-radius: 8px; width: fit-content; }
.score-num { color: #38bdf8; }
.score-colon { color: #64748b; }

.bet-detail { display: flex; flex-direction: column; gap: 4px; }
.bet-type { color: #94a3b8; font-size: 11px; background: #334155; padding: 2px 6px; border-radius: 4px; width: fit-content; }
.bet-selection { color: #38bdf8; font-size: 14px; }

.money-col { font-family: monospace; }
.money-amount { font-size: 15px; font-weight: bold; color: #f8fafc; }
.money-odds { color: #fbbf24; font-size: 12px; margin-top: 4px; }

.status-box { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
.status-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 900; letter-spacing: 1px; }
.status-badge.pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
.status-badge.won { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); box-shadow: 0 0 10px rgba(16, 185, 129, 0.2); }
.status-badge.lost { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

.payout { color: #10b981; font-weight: 900; font-size: 14px; font-family: monospace; }

.time-col { color: #64748b; font-size: 12px; font-family: monospace; }

/* 空状态 */
.empty-state { text-align: center; padding: 40px 0 !important; color: #64748b; }
.empty-state span { font-size: 40px; display: block; margin-bottom: 10px; }
.empty-state p { margin: 0; font-size: 14px; font-weight: bold; }

@media (max-width: 1024px) {
  .dashboard { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .dashboard { grid-template-columns: 1fr; }
}
</style>