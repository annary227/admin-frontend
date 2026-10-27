<template>
  <div class="dark-page">
    <!-- 极简工具栏 -->
    <div class="toolbar">
      <div class="title-area">
        <h2>出金审批 (Withdrawals)</h2>
        <span class="subtitle">共 {{ withdrawalList.length }} 条记录</span>
      </div>
      <el-button type="primary" color="#e83862" icon="Refresh" @click="fetchData" :loading="loading">
        刷新数据
      </el-button>
    </div>

    <!-- 深色数据表 -->
    <div class="table-container">
      <el-table 
        :data="withdrawalList" 
        v-loading="loading" 
        size="large" 
        :row-class-name="tableRowClassName"
        style="background: transparent;"
      >
        <el-table-column prop="id" label="单号" width="80" align="center">
          <template #default="scope">
            <span style="font-family: monospace; color: #64748b;">#{{ scope.row.id }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="username" label="申请账号" width="200">
          <template #default="scope">
            <span style="font-weight: 600; color: #f8fafc;">{{ scope.row.username }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="amount" label="申请金额" width="150" align="right">
          <template #default="scope">
            <span style="color: #f43f5e; font-weight: 900; font-size: 16px; font-family: monospace;">
              ¥{{ Number(scope.row.amount).toLocaleString() }}
            </span>
          </template>
        </el-table-column>

        <!-- 深色化银行卡片 -->
        <el-table-column label="收款账户信息" min-width="300">
          <template #default="scope">
            <div class="dark-bank-card" v-if="scope.row.bank_name && scope.row.account_number">
              <div class="bank-row">
                <span class="label">银行</span>
                <span class="value">{{ scope.row.bank_name }}</span>
              </div>
              <div class="bank-row">
                <span class="label">支店</span>
                <span class="value">{{ scope.row.branch_name }} 
                  <span class="branch-code">{{ scope.row.branch_code || '无编号' }}</span>
                </span>
              </div>
              <div class="bank-row">
                <span class="label">类型</span>
                <span class="value">{{ scope.row.account_type === 'ordinary' ? '普通' : '当座' }}</span>
              </div>
              <div class="bank-row">
                <span class="label">账号</span>
                <span class="value" style="font-family: monospace; color: #38bdf8;">{{ scope.row.account_number }}</span>
              </div>
              <div class="bank-row">
                <span class="label">户名</span>
                <span class="value">{{ scope.row.account_name }}</span>
              </div>
            </div>
            <span v-else style="color: #ef4444; font-size: 13px; border: 1px dashed #ef4444; padding: 2px 8px; border-radius: 4px;">未绑定</span>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="时间" width="160">
          <template #default="scope">
            <span class="time-text">{{ formatTime(scope.row.created_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 0" type="warning" effect="dark" round>待审核</el-tag>
            <el-tag v-else-if="scope.row.status === 1" type="success" effect="dark" round>已通过</el-tag>
            <el-tag v-else type="info" effect="dark" round>已驳回</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" width="150" align="center">
          <template #default="scope">
            <div v-if="scope.row.status === 0" style="display: flex; flex-direction: column; gap: 6px;">
              <el-button type="success" size="small" @click="handleApprove(scope.row.id, 'approve')">通过出金</el-button>
              <el-button type="danger" size="small" plain @click="handleApprove(scope.row.id, 'reject')">驳回退款</el-button>
            </div>
            <div v-else-if="scope.row.status === 1">
              <el-button type="warning" size="small" plain @click="handleApprove(scope.row.id, 'reject')">撤销退款</el-button>
            </div>
            <span v-else style="color: #475569; font-size: 13px;">已完结</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../api/request';

const withdrawalList = ref([]);
const loading = ref(false);

// 获取出金列表
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/withdrawals');
    if (res.data.success) withdrawalList.value = res.data.records;
  } catch (e) {
    ElMessage.error('获取出金列表失败');
  } finally {
    loading.value = false;
  }
};

// 审批操作
const handleApprove = async (id, action) => {
  const actionText = action === 'approve' ? '同意出金' : '驳回并退款';
  try {
    await ElMessageBox.confirm(
      `确认要【${actionText}】吗？${action === 'reject' ? '（金额将退回用户余额）' : '（请确保已线下打款）'}`, 
      '操作确认', 
      { type: 'warning', confirmButtonText: '确定执行', cancelButtonText: '取消' }
    );
    
    const res = await request.post(`/admin/approve-withdrawal/${id}`, { action });
    if (res.data.success) {
      ElMessage.success('操作成功');
      fetchData(); 
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败');
  }
};

const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  return new Date(timeStr).toLocaleString('zh-CN', { hour12: false });
};

// 表格行背景色交替
const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'dark-row-even' : 'dark-row-odd';
};

onMounted(() => {
  fetchData();
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

/* 银行卡信息深色化 */
.dark-bank-card {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bank-row { display: flex; align-items: center; }
.bank-row .label { color: #64748b; width: 40px; flex-shrink: 0; }
.bank-row .value { color: #cbd5e1; }
.branch-code { 
  background: #7f1d1d; color: #fca5a5; padding: 1px 6px; border-radius: 4px; 
  font-weight: bold; margin-left: 6px; font-family: monospace;
}

.time-text { color: #64748b; font-size: 13px; font-family: monospace; }
</style>