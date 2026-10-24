<template>
  <div class="deposit-page">
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="title">入金记录 (充值流水)</span>
          <el-button type="primary" @click="fetchDeposits" plain>刷新数据</el-button>
        </div>
      </template>
      
      <el-table :data="depositList" v-loading="loading" size="large" :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: 'bold' }">
        <el-table-column prop="id" label="流水单号" width="120" />
        <el-table-column prop="username" label="用户名称" width="200">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-avatar :size="24" style="background: #e2e8f0; color: #334155;">{{ scope.row.username.charAt(0).toUpperCase() }}</el-avatar>
              <span style="font-weight: 500;">{{ scope.row.username }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="入金金额" width="180">
          <template #default="scope">
            <span style="color: #10b981; font-weight: bold; font-size: 16px;">+ ¥ {{ scope.row.amount.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="入金时间" min-width="200">
          <template #default="scope">
            <span style="color: #64748b;">{{ new Date(scope.row.created_at).toLocaleString('zh-CN', { hour12: false }) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="depositList.length === 0 && !loading" description="暂无入金流水记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../api/request';

const depositList = ref([]);
const loading = ref(false);

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

onMounted(() => {
  fetchDeposits();
});
</script>

<style scoped>
.deposit-page { display: flex; flex-direction: column; }
.table-card { border-radius: 12px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 16px; font-weight: bold; color: #1e293b; }
</style>