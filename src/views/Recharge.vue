<template>
  <div class="dark-page">
    <!-- 极简工具栏 -->
    <div class="toolbar">
      <div class="title-area">
        <h2>入金流水 (Deposits)</h2>
        <span class="subtitle">累计入金总额: <strong style="color: #10b981; font-size: 15px;">¥ {{ totalAmount.toLocaleString() }}</strong></span>
      </div>
      <el-button type="primary" color="#e83862" icon="Refresh" @click="fetchDeposits" :loading="loading">
        刷新数据
      </el-button>
    </div>

    <!-- 深色数据表 -->
    <div class="table-container">
      <el-table 
        :data="depositList" 
        v-loading="loading" 
        size="large" 
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="id" label="流水单号" width="120" align="center">
          <template #default="scope">
            <span style="font-family: monospace; color: #64748b;">#{{ scope.row.id }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="username" label="用户名称" width="220">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-avatar :size="24" style="background: #334155; color: #94a3b8; font-weight: bold;">
                {{ scope.row.username.charAt(0).toUpperCase() }}
              </el-avatar>
              <span style="font-weight: 600; color: #f8fafc;">{{ scope.row.username }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="amount" label="入金金额" width="200" align="right">
          <template #default="scope">
            <span style="color: #10b981; font-weight: 900; font-size: 16px; font-family: monospace;">
              + ¥{{ Number(scope.row.amount).toLocaleString() }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="入金时间" align="center">
          <template #default="scope">
            <span class="time-text">{{ formatTime(scope.row.created_at) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="depositList.length === 0 && !loading" description="暂无入金流水记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../api/request';

const depositList = ref([]);
const loading = ref(false);

// 统计入金总额
const totalAmount = computed(() => {
  return depositList.value.reduce((sum, item) => sum + Number(item.amount), 0);
});

// 获取入金列表
const fetchDeposits = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/deposits');
    if (res.data.success) depositList.value = res.data.records;
  } catch (e) {
    ElMessage.error('获取入金记录失败，请检查后端');
  } finally {
    loading.value = false;
  }
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  return new Date(timeStr).toLocaleString('zh-CN', { hour12: false });
};

// 表格行背景色交替
const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'dark-row-even' : 'dark-row-odd';
};

onMounted(() => {
  fetchDeposits();
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
  margin-top: 6px;
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
</style>