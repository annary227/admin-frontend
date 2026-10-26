<template>
  <div class="withdraw-page">
    <div class="toolbar">
      <h2 style="margin: 0; color: #1e293b; font-weight: 800;">出金审批列表</h2>
      <el-button type="primary" color="#e83862" icon="Refresh" @click="fetchData" :loading="loading">
        刷新数据
      </el-button>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table 
        :data="withdrawalList" 
        v-loading="loading" 
        size="large" 
        :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: 'bold' }"
      >
        <el-table-column prop="id" label="申请编号" width="90" />
        <el-table-column prop="username" label="申请账号" width="180">
          <template #default="scope">
            <span style="font-weight: 500; color: #1e293b;">{{ scope.row.username }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="amount" label="申请金额" width="150">
          <template #default="scope">
            <span style="color: #e83862; font-weight: 900; font-size: 15px;">
              ¥ {{ Number(scope.row.amount).toLocaleString() }}
            </span>
          </template>
        </el-table-column>

        <!-- 🆕 核心：展示客户的银行卡收款信息（包含支店编号） -->
        <el-table-column label="收款银行信息" min-width="300">
          <template #default="scope">
            <div class="bank-info" v-if="scope.row.bank_name && scope.row.account_number">
              <div><span class="label">银行：</span>{{ scope.row.bank_name }}</div>
              <div><span class="label">支店：</span>{{ scope.row.branch_name }} <span style="color: #94a3b8; font-size: 12px;">({{ scope.row.branch_code || '无编号' }})</span></div>
              <div><span class="label">类型：</span>{{ scope.row.account_type === 'ordinary' ? '普通' : '当座' }}</div>
              <div><span class="label">账号：</span><span style="font-family: monospace; font-weight: bold; color: #0f172a;">{{ scope.row.account_number }}</span></div>
              <div><span class="label">户名：</span>{{ scope.row.account_name }}</div>
            </div>
            <span v-else style="color: #ef4444; font-size: 13px;">⚠️ 未绑定银行卡</span>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="申请时间" width="180">
          <template #default="scope">
            <span class="time-text">{{ formatTime(scope.row.created_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="当前状态" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 0" type="warning" effect="dark">待审核</el-tag>
            <el-tag v-else-if="scope.row.status === 1" type="success" effect="light">已通过</el-tag>
            <el-tag v-else type="info" effect="plain">已驳回</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" width="180" align="center">
          <template #default="scope">
            <div v-if="scope.row.status === 0" style="display: flex; gap: 8px; justify-content: center;">
              <el-button type="success" size="small" @click="handleApprove(scope.row.id, 'approve')">同意出金</el-button>
              <el-button type="danger" size="small" plain @click="handleApprove(scope.row.id, 'reject')">驳回</el-button>
            </div>
            <!-- 已通过的单子，可以撤销并退款 -->
            <div v-else-if="scope.row.status === 1">
              <el-button type="warning" size="small" plain @click="handleApprove(scope.row.id, 'reject')">撤销并退款</el-button>
            </div>
            <span v-else style="color: #94a3b8; font-size: 13px;">已处理</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
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
      `确认要【${actionText}】吗？${action === 'reject' ? '（若已通过，金额将退回用户余额）' : ''}`, 
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
  return date.toLocaleString('ja-JP', { hour12: false });
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.withdraw-page { display: flex; flex-direction: column; gap: 20px; padding: 20px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.table-card { border-radius: 12px; border: none; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.time-text { color: #64748b; font-size: 13px; }

/* 银行卡信息排版 */
.bank-info { font-size: 13px; line-height: 1.6; color: #475569; }
.bank-info .label { color: #94a3b8; display: inline-block; width: 40px; }
</style>