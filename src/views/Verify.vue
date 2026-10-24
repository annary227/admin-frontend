<template>
  <div class="verify-page">
    <div class="toolbar">
      <h2 style="margin: 0; color: #1e293b;">实名认证审核 (KYC)</h2>
      <el-button type="primary" icon="Refresh" @click="fetchPendingUsers" :loading="loading">刷新列表</el-button>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table 
        :data="pendingUsers" 
        v-loading="loading" 
        size="large" 
        :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: 'bold' }"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="账号" width="150" />
        <el-table-column prop="real_name" label="真实姓名" width="150" />
        <el-table-column prop="id_number" label="证件号码" min-width="180" />
        
        <!-- 🆕 新增：当前状态列 -->
        <el-table-column label="当前状态" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.verify_status === 1" type="warning">审核中</el-tag>
            <el-tag v-else-if="scope.row.verify_status === 2" type="success">已通过</el-tag>
            <el-tag v-else type="info">已驳回</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="last_active_at" label="申请/活跃时间" width="180">
          <template #default="scope">
            <span class="time-text">{{ new Date(scope.row.last_active_at).toLocaleString() }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <!-- 待审核状态：显示 通过 / 驳回 -->
            <div v-if="scope.row.verify_status === 1">
              <el-button type="success" size="small" @click="handleApprove(scope.row.id, 'approve')">通过</el-button>
              <el-button type="danger" size="small" plain @click="handleApprove(scope.row.id, 'reject')">驳回</el-button>
            </div>
            <!-- 🆕 已通过状态：显示 撤销并驳回 -->
            <div v-else-if="scope.row.verify_status === 2">
              <el-button type="warning" size="small" plain @click="handleApprove(scope.row.id, 'reject')">撤销并驳回</el-button>
            </div>
            <!-- 已驳回状态：显示 重新通过 -->
            <div v-else>
              <el-button type="success" size="small" plain @click="handleApprove(scope.row.id, 'approve')">重新通过</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="pendingUsers.length === 0 && !loading" description="当前没有待审核的实名申请" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../api/request';

const pendingUsers = ref([]);
const loading = ref(false);

// 获取审核列表
const fetchPendingUsers = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/pending-verifies');
    if (res.data.success) {
      pendingUsers.value = res.data.users;
    }
  } catch (e) {
    ElMessage.error('获取审核列表失败');
  } finally {
    loading.value = false;
  }
};

// 处理审核逻辑
const handleApprove = async (userId, action) => {
  const actionText = action === 'approve' ? '通过' : '驳回';
  try {
    await ElMessageBox.confirm(`确认要${actionText}该用户的实名申请吗？`, '提示', { type: 'warning' });
    
    const res = await request.post(`/admin/approve-verify/${userId}`, { action });
    if (res.data.success) {
      ElMessage.success(`已${actionText}该申请`);
      fetchPendingUsers(); // 刷新列表
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};

onMounted(() => {
  fetchPendingUsers();
});
</script>

<style scoped>
.verify-page { display: flex; flex-direction: column; gap: 20px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.table-card { border-radius: 12px; border: none; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.time-text { color: #64748b; font-size: 13px; }
</style>