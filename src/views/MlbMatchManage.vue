<template>
  <div class="mlb-manage-container">
    <div class="header">
      <h2>MLB 比赛管理 & 官方比分设定</h2>
      <button class="refresh-btn" @click="fetchMatches">刷新列表</button>
    </div>

    <!-- 比赛数据表格 -->
    <div class="table-wrapper">
      <table class="custom-table">
        <thead>
          <tr>
            <th>比赛ID (game_pk)</th>
            <th>比赛时间</th>
            <th>对战队伍</th>
            <th>真实比分 (API)</th>
            <th>当前状态</th>
            <th>官方结算比分 (覆盖)</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="match in matches" :key="match.game_pk">
            <td class="id-col">{{ match.game_pk }}</td>
            <!-- 🆕 新增：比赛时间列 -->
            <td class="time-col">
              {{ formatMatchTime(match.game_date) }}
            </td>
            <td>
              <div class="teams">
                <span>{{ match.away_team }}</span>
                <span class="vs">VS</span>
                <span>{{ match.home_team }}</span>
              </div>
            </td>
            <td class="score-col">
              {{ match.away_score }} : {{ match.home_score }}
            </td>
            <td>
              <span class="status-badge" :class="match.status.toLowerCase()">
                {{ match.status }}
              </span>
            </td>
            <td>
              <div class="official-score-inputs">
                <input type="number" v-model.number="match.editAwayScore" placeholder="客" min="0" />
                <span>:</span>
                <input type="number" v-model.number="match.editHomeScore" placeholder="主" min="0" />
              </div>
            </td>
            <td>
              <div class="action-buttons">
                <button class="save-btn" @click="saveOfficialScore(match)">保存比分</button>
                <!-- 🆕 强制取消比赛按钮 -->
                <button class="cancel-match-btn" @click="cancelMatch(match)">取消比赛</button>
              </div>
            </td>
          </tr>
          <tr v-if="matches.length === 0">
            <td colspan="7" class="empty-state">暂无比赛数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// 这里替换成你项目里封装的 axios 请求实例
import request from '../api/request'; 
import { ElMessage, ElMessageBox } from 'element-plus'; // 引入 ElMessageBox 用于弹窗确认

const matches = ref([]);

// 🆕 格式化时间函数，让日期显示更易读
const formatMatchTime = (timeStr) => {
  if (!timeStr) return '-';
  const d = new Date(timeStr);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

// 获取比赛列表
const fetchMatches = async () => {
  try {
    const res = await request.get('/admin/mlb-matches');
    if (res.data.success) {
      // 把后端返回的数据赋给表格，并初始化编辑框的值
      matches.value = res.data.matches.map(m => ({
        ...m,
        // 如果数据库有官方比分就显示，没有就留空
        editAwayScore: m.official_away_score !== null ? m.official_away_score : null,
        editHomeScore: m.official_home_score !== null ? m.official_home_score : null
      }));
    }
  } catch (error) {
    console.error('获取比赛失败', error);
    ElMessage.error('获取比赛列表失败');
  }
};

// 保存官方比分
const saveOfficialScore = async (match) => {
  if (match.editAwayScore === null || match.editHomeScore === null) {
    return ElMessage.warning('请输入完整的官方比分（客队和主队）');
  }

  try {
    const res = await request.post('/admin/mlb-set-score', {
      game_pk: match.game_pk,
      official_away: match.editAwayScore,
      official_home: match.editHomeScore
    });
    
    if (res.data.success) {
      ElMessage.success(`比赛 ${match.game_pk} 官方比分已保存`);
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '保存失败');
  }
};

// 🆕 强制取消比赛并退款
const cancelMatch = async (match) => {
  try {
    await ElMessageBox.confirm(
      `确定要强制取消比赛 ${match.game_pk} (${match.away_team} vs ${match.home_team}) 吗？\n所有已下注的玩家将获得全额退款。`,
      '强制取消警告',
      {
        confirmButtonText: '确定取消并退款',
        cancelButtonText: '返回',
        type: 'warning',
      }
    );

    const res = await request.post('/admin/mlb-cancel-match', {
      game_pk: match.game_pk
    });

    if (res.data.success) {
      ElMessage.success(`比赛已取消，${res.data.refunded_count} 笔注单已退款`);
      fetchMatches(); // 刷新列表
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '取消失败');
    }
  }
};

onMounted(() => {
  fetchMatches();
});
</script>

<style scoped>
/* 完美融入你后台的暗黑电竞风 */
.mlb-manage-container {
  padding: 20px;
  color: #e2e8f0;
  font-family: 'Noto Sans JP', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  color: #fff;
}

.refresh-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: 0.2s;
}
.refresh-btn:hover { background: #dc2626; }

/* 表格样式 */
.table-wrapper {
  background: #1e293b;
  border-radius: 12px;
  border: 1px solid #334155;
  overflow: hidden;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.custom-table th, .custom-table td {
  padding: 15px;
  border-bottom: 1px solid #334155;
}

.custom-table th {
  background: #0f172a;
  color: #94a3b8;
  font-size: 13px;
  font-weight: normal;
}

.id-col { color: #64748b; font-family: monospace; }
/* 时间列样式 */
.time-col { color: #38bdf8; font-family: monospace; font-weight: bold; font-size: 14px; }
.teams { display: flex; flex-direction: column; gap: 4px; }
.teams .vs { font-size: 11px; color: #64748b; font-weight: bold; }
.score-col { font-weight: bold; color: #fbbf24; font-size: 16px; }

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
.status-badge.preview { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.status-badge.live { background: rgba(239, 68, 68, 0.2); color: #ef4444; animation: pulse 1s infinite alternate;}
.status-badge.final { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }

.official-score-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}
.official-score-inputs input {
  width: 50px;
  background: #0f172a;
  border: 1px solid #334155;
  color: #fff;
  padding: 6px;
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
}
.official-score-inputs input:focus {
  outline: none;
  border-color: #3b82f6;
}

/* 🆕 操作按钮容器 */
.action-buttons {
  display: flex;
  gap: 8px;
}

.save-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: 0.2s;
}
.save-btn:hover { background: #2563eb; }

/* 🆕 取消比赛按钮样式 */
.cancel-match-btn {
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: 0.2s;
}
.cancel-match-btn:hover {
  background: #ef4444;
  color: white;
}

.empty-state { text-align: center; color: #64748b; padding: 30px !important; }

@keyframes pulse { 0% { opacity: 1; } 100% { opacity: 0.5; } }
</style>