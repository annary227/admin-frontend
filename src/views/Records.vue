<template>
  <div class="dark-page">
    <!-- 极简工具栏 -->
    <div class="toolbar">
      <div class="title-area">
        <h2>全站抽奖流水 (Draw Records)</h2>
        <span class="subtitle">最近 50 条记录</span>
      </div>
      <el-button type="primary" color="#e83862" icon="Refresh" @click="fetchRecords" :loading="isLoading">
        刷新数据
      </el-button>
    </div>

    <!-- 深色数据表 -->
    <div class="table-container">
      <el-table 
        :data="tableData" 
        v-loading="isLoading" 
        size="large" 
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="date" label="抽奖时间" width="180">
          <template #default="scope">
            <span class="time-text">{{ scope.row.date }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="user" label="用户账号" width="200">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-avatar :size="24" style="background: #334155; color: #94a3b8; font-weight: bold;">
                {{ scope.row.user.charAt(0).toUpperCase() }}
              </el-avatar>
              <span style="font-weight: 600; color: #f8fafc;">{{ scope.row.user }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="game" label="游戏名称" width="200">
          <template #default="scope">
            <span style="color: #cbd5e1;">{{ scope.row.game }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="cost" label="消费金额" width="150" align="right">
          <template #default="scope">
            <span style="color: #f43f5e; font-weight: bold; font-family: monospace;">
              - {{ scope.row.cost }}
            </span>
          </template>
        </el-table-column>

        <!-- 中奖结果列，区分了中奖和未中奖的视觉效果 -->
        <el-table-column prop="prize" label="抽奖结果" align="center">
          <template #default="scope">
            <!-- 中奖：高亮发光 -->
            <div v-if="scope.row.isWin" class="win-badge">
              <span class="icon">🏆</span>
              <span class="text">{{ scope.row.prize }}</span>
            </div>
            <!-- 未中奖：暗淡 -->
            <div v-else class="lose-badge">
              {{ scope.row.prize }}
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty 
        v-if="tableData.length === 0 && !isLoading" 
        description="暂无抽奖流水记录" 
        :image-size="100"
        style="padding: 40px 0;"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '../api/request';
import { ElMessage } from 'element-plus';

const tableData = ref([]);
const isLoading = ref(false);

const fetchRecords = async () => {
  isLoading.value = true;
  try {
    const res = await request.get('/admin/all-records');
    if (res.data.success) {
      tableData.value = res.data.records.map(row => ({
        date: new Date(row.created_at).toLocaleString('zh-CN', { hour12: false }),
        user: row.username,
        game: row.game_name,
        cost: `¥${row.cost.toLocaleString()}`,
        prize: row.prize_name,
        // 假设后端返回的未中奖名称是 'ハズレ' 或 '不中奖'
        isWin: row.prize_name !== 'ハズレ' && row.prize_name !== '不中奖' && row.prize_value > 0
      }));
    }
  } catch (error) {
    console.error('获取流水失败', error);
    ElMessage.error('获取流水失败，请检查后端接口');
  } finally {
    isLoading.value = false;
  }
};

// 表格行背景色交替
const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'dark-row-even' : 'dark-row-odd';
};

onMounted(() => {
  fetchRecords();
});
</script>

<style scoped>
/* 全局深色底板 */
.dark-page {
  padding: 24px;
  background: #0f172a; /* 深邃海军蓝 */
  min-height: 100vh;
  color: #f8fafc;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.title-area h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #f8fafc;
}
.subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
  display: block;
}

/* 表格容器 */
.table-container {
  background: #1e293b;
  border-radius: 12px;
  border: 1px solid #334155;
  overflow: hidden;
}

/* 覆盖 Element Plus 默认的表格样式，使其变暗 */
:deep(.el-table) {
  background-color: transparent;
  --el-table-border-color: #334155;
  --el-table-header-bg-color: #0f172a;
  --el-table-header-text-color: #94a3b8;
  --el-table-text-color: #cbd5e1;
  --el-table-row-hover-bg-color: #334155;
}
:deep(.el-table th.el-table__cell) {
  border-bottom: 1px solid #334155;
  padding: 12px 0;
}
:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #334155;
  padding: 16px 0;
}
:deep(.el-table tr) {
  background-color: transparent !important;
}
/* 隔行变色 */
.dark-row-even { background-color: #1e293b; }
.dark-row-odd { background-color: #0f172a; }

.time-text { color: #64748b; font-size: 13px; font-family: monospace; }

/* 🆕 中奖与未中奖的视觉区分 */
.win-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 13px;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
}
.win-badge .icon { font-size: 14px; }

.lose-badge {
  display: inline-block;
  color: #64748b;
  font-size: 13px;
  background: #0f172a;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid #334155;
}
</style>