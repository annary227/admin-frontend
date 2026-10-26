<template>
  <div class="verify-page">
    <div class="toolbar">
      <h2 style="margin: 0; color: #1e293b; font-weight: 800;">实名认证审核 (KYC)</h2>
      <el-button type="primary" color="#e83862" icon="Refresh" @click="fetchPendingUsers" :loading="loading">
        刷新列表
      </el-button>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table 
        :data="pendingUsers" 
        v-loading="loading" 
        size="large" 
        :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: 'bold' }"
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="账号" width="180">
          <template #default="scope">
            <span style="font-weight: 500; color: #1e293b;">{{ scope.row.username }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="real_name" label="真实姓名" width="130">
          <template #default="scope">
            <span style="font-weight: bold; color: #e83862;">{{ scope.row.real_name || '未填写' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="id_number" label="证件号码" width="150">
          <template #default="scope">
            <span style="font-family: monospace; font-size: 14px;">{{ scope.row.id_number || '未填写' }}</span>
          </template>
        </el-table-column>
        
        <!-- 🆕 核心补充：银行卡信息列 -->
        <el-table-column label="绑定银行卡信息" min-width="260">
          <template #default="scope">
            <div class="bank-info" v-if="scope.row.bank_name && scope.row.account_number">
              <div><span class="label">银行：</span>{{ scope.row.bank_name }}</div>
              <div>
                <span class="label">支店：</span>{{ scope.row.branch_name }} 
                <span style="color: #e83862; font-weight: bold;">[ {{ scope.row.branch_code || '无编号' }} ]</span>
              </div>
              <div><span class="label">类型：</span>{{ scope.row.account_type === 'ordinary' ? '普通' : '当座' }}</div>
              <div><span class="label">账号：</span><span style="font-family: monospace; font-weight: bold;">{{ scope.row.account_number }}</span></div>
              <div><span class="label">户名：</span>{{ scope.row.account_name }}</div>
            </div>
            <span v-else style="color: #ef4444; font-size: 13px;">⚠️ 未绑定银行卡</span>
          </template>
        </el-table-column>

        <!-- 当前状态列 -->
        <el-table-column label="状态" width="110" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.verify_status === 1" type="warning" effect="dark">审核中</el-tag>
            <el-tag v-else-if="scope.row.verify_status === 2" type="success" effect="light">已通过</el-tag>
            <el-tag v-else type="danger" effect="plain">已驳回</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="last_active_at" label="申请/活跃时间" width="170">
          <template #default="scope">
            <span class="time-text">{{ formatTime(scope.row.last_active_at) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="scope">
            <!-- 待审核状态 -->
            <div v-if="scope.row.verify_status === 1" style="display: flex; gap: 8px; justify-content: center;">
              <el-button type="success" size="small" @click="handleApprove(scope.row.id, 'approve')">通过</el-button>
              <el-button type="danger" size="small" plain @click="handleApprove(scope.row.id, 'reject')">驳回</el-button>
            </div>
            <!-- 已通过状态 -->
            <div v-else-if="scope.row.verify_status === 2">
              <el-button type="warning" size="small" plain @click="handleApprove(scope.row.id, 'reject')">撤销并驳回</el-button>
            </div>
            <!-- 已驳回状态 -->
            <div v-else>
              <el-button type="success" size="small" plain @click="handleApprove(scope.row.id, 'approve')">重新通过</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="pendingUsers.length === 0 && !loading" description="当前没有待审核的实名申请" :image-size="100" />
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
    await ElMessageBox.confirm(`确认要${actionText}该用户的实名申请吗？`, '操作确认', { 
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    });
    
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

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  return date.toLocaleString('ja-JP', { hour12: false });
};

onMounted(() => {
  fetchPendingUsers();
});
</script>

<style scoped>
.verify-page { display: flex; flex-direction: column; gap: 20px; padding: 20px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.table-card { border-radius: 12px; border: none; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.time-text { color: #64748b; font-size: 13px; }

/* 银行卡信息排版 */
.bank-info { font-size: 13px; line-height: 1.6; color: #475569; }
.bank-info .label { color: #94a3b8; display: inline-block; width: 40px; }
</style>