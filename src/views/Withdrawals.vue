<template>
  <div class="withdraw-page">
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="title">出金审批列表</span>
          <el-button type="primary" @click="fetchData" plain>刷新数据</el-button>
        </div>
      </template>
      
      <el-table :data="withdrawalList" v-loading="loading" size="large">
        <el-table-column prop="id" label="申请编号" width="100" />
        <el-table-column prop="username" label="申请账号" width="150" />
        <el-table-column prop="amount" label="申请出金金额" width="150">
          <template #default="scope">
            <span style="color: #ef4444; font-weight: bold;">¥ {{ scope.row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="180" />
        <el-table-column label="当前状态" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 0" type="warning">待审核</el-tag>
            <el-tag v-else-if="scope.row.status === 1" type="success">已通过</el-tag>
            <el-tag v-else type="info">已驳回</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right">
          <template #default="scope">
            <div v-if="scope.row.status === 0">
              <el-button type="success" size="small" @click="handleApprove(scope.row.id, 'approve')">同意出金</el-button>
              <el-button type="danger" size="small" @click="handleApprove(scope.row.id, 'reject')">驳回</el-button>
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

const handleApprove = async (id, action) => {
  try {
    await ElMessageBox.confirm('确认执行此操作吗？', '提示', { type: 'warning' });
    const res = await request.post(`/admin/approve-withdrawal/${id}`, { action });
    if (res.data.success) {
      ElMessage.success('操作成功');
      fetchData();
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败');
  }
};

onMounted(fetchData);
</script>

<style scoped>
.withdraw-page { display: flex; flex-direction: column; }
.table-card { border-radius: 8px; border: none; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 16px; font-weight: bold; }
</style>