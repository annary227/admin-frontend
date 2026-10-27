<template>
  <div class="withdraw-page">
    <!-- 顶部数据概览 -->
    <div class="kpi-row">
      <el-card shadow="hover" class="kpi-card">
        <div class="kpi-title">待处理出金申请</div>
        <div class="kpi-value warning">{{ pendingCount }} <span class="unit">笔</span></div>
      </el-card>
      <el-card shadow="hover" class="kpi-card">
        <div class="kpi-title">待处理冻结金额</div>
        <div class="kpi-value danger">¥ {{ pendingAmount.toLocaleString() }}</div>
      </el-card>
      <el-card shadow="hover" class="kpi-card">
        <div class="kpi-title">累计已通过出金</div>
        <div class="kpi-value success">¥ {{ approvedAmount.toLocaleString() }}</div>
      </el-card>
    </div>

    <!-- 核心数据表 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">出金审批流水</span>
          <el-button type="primary" color="#e83862" icon="Refresh" @click="fetchData" :loading="loading">
            刷新数据
          </el-button>
        </div>
      </template>

      <el-table 
        :data="withdrawalList" 
        v-loading="loading" 
        size="large" 
        :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: 'bold' }"
      >
        <el-table-column prop="id" label="单号" width="80" align="center">
          <template #default="scope">
            <span style="font-family: monospace; color: #94a3b8;">#{{ scope.row.id }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="username" label="申请账号" width="200">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: #e2e8f0; color: #64748b; display: flex; justify-content: center; align-items: center; font-size: 12px; font-weight: bold;">
                {{ scope.row.username.charAt(0).toUpperCase() }}
              </div>
              <span style="font-weight: 600; color: #1e293b;">{{ scope.row.username }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="amount" label="申请金额" width="140" align="right">
          <template #default="scope">
            <span style="color: #ef4444; font-weight: 900; font-size: 16px; font-family: monospace;">
              ¥{{ Number(scope.row.amount).toLocaleString() }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="收款账户信息" min-width="300">
          <template #default="scope">
            <div class="bank-card" v-if="scope.row.bank_name && scope.row.account_number">
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
                <span class="value" style="font-family: monospace; font-weight: bold;">{{ scope.row.account_number }}</span>
              </div>
              <div class="bank-row">
                <span class="label">户名</span>
                <span class="value">{{ scope.row.account_name }}</span>
              </div>
            </div>
            <el-tag v-else type="danger" effect="plain" size="small">⚠️ 未绑定银行卡</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="申请时间" width="180">
          <template #default="scope">
            <span class="time-text">{{ formatTime(scope.row.created_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 0" type="warning" effect="light" round>待审核</el-tag>
            <el-tag v-else-if="scope.row.status === 1" type="success" effect="light" round>已通过</el-tag>
            <el-tag v-else type="info" effect="plain" round>已驳回</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" width="160" align="center">
          <template #default="scope">
            <div v-if="scope.row.status === 0" style="display: flex; flex-direction: column; gap: 6px;">
              <el-button type="success" size="small" @click="handleApprove(scope.row.id, 'approve')">同意出金</el-button>
              <el-button type="danger" size="small" plain @click="handleApprove(scope.row.id, 'reject')">驳回退款</el-button>
            </div>
            <div v-else-if="scope.row.status === 1">
              <el-button type="warning" size="small" plain @click="handleApprove(scope.row.id, 'reject')">撤销并退款</el-button>
            </div>
            <span v-else style="color: #cbd5e1; font-size: 13px;">已完结</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../api/request';

const withdrawalList = ref([]);
const loading = ref(false);

// 统计数据
const pendingCount = computed(() => withdrawalList.value.filter(item => item.status === 0).length);
const pendingAmount = computed(() => withdrawalList.value.filter(item => item.status === 0).reduce((sum, item) => sum + Number(item.amount), 0));
const approvedAmount = computed(() => withdrawalList.value.filter(item => item.status === 1).reduce((sum, item) => sum + Number(item.amount), 0));

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
      `确认要【${actionText}】吗？${action === 'reject' ? '（若已通过，金额将退回用户余额）' : '（请确保已完成线下打款）'}`, 
      '操作确认', 
      { 
        type: 'warning',
        confirmButtonText: '确定执行',
        cancelButtonText: '取消'
      }
    );
    
    const res = await request.post(`/admin/approve-withdrawal/${id}`, { action });
    if (res.data.success) {
      ElMessage.success('操作成功');
      fetchData(); // 刷新列表
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败');
  }
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN', { hour12: false });
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.withdraw-page { display: flex; flex-direction: column; gap: 20px; padding: 20px; background: #f4f7f9; min-height: 100vh; }

/* KPI 卡片区 */
.kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.kpi-card { border-radius: 12px; border: none; }
.kpi-title { font-size: 13px; color: #64748b; font-weight: bold; margin-bottom: 10px; }
.kpi-value { font-size: 26px; font-weight: 900; font-family: 'DIN Alternate', monospace; }
.kpi-value .unit { font-size: 14px; font-weight: normal; margin-left: 4px; }
.kpi-value.warning { color: #f59e0b; }
.kpi-value.danger { color: #ef4444; }
.kpi-value.success { color: #10b981; }

/* 表格区 */
.table-card { border-radius: 12px; border: none; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-title { font-size: 16px; font-weight: bold; color: #1e293b; }
.time-text { color: #64748b; font-size: 13px; font-family: monospace; }

/* 银行卡信息卡片化 */
.bank-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bank-row { display: flex; }
.bank-row .label { color: #94a3b8; width: 40px; flex-shrink: 0; }
.bank-row .value { color: #334155; font-weight: 500; }
.branch-code { 
  background: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; 
  font-weight: bold; margin-left: 6px; font-size: 12px;
}

@media (max-width: 768px) {
  .kpi-row { grid-template-columns: 1fr; }
}
</style>