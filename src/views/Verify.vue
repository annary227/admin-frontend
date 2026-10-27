<template>
  <div class="verify-page">
    <!-- 🆕 高级工具栏 -->
    <div class="toolbar">
      <div class="toolbar-title">
        <h2>实名认证审核 (KYC)</h2>
        <p>审核用户的实名信息及绑定的收款银行账户</p>
      </div>
      <el-button type="primary" color="#e83862" icon="Refresh" @click="fetchPendingUsers" :loading="loading" round>
        刷新列表
      </el-button>
    </div>

    <!-- 🆕 高级表格卡片 -->
    <el-card shadow="never" class="table-card">
      <el-table 
        :data="pendingUsers" 
        v-loading="loading" 
        size="large" 
        :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: 'bold', borderBottom: '2px solid #f1f5f9' }"
        :row-style="{ height: '80px' }"
      >
        <el-table-column prop="id" label="ID" width="80" align="center">
          <template #default="scope">
            <span style="font-family: monospace; font-weight: bold; color: #94a3b8;">#{{ scope.row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="username" label="账号" min-width="180">
          <template #default="scope">
            <div style="font-weight: 900; color: #1e293b; font-size: 15px;">{{ scope.row.username }}</div>
          </template>
        </el-table-column>
        
        <el-table-column prop="real_name" label="真实姓名" width="140">
          <template #default="scope">
            <span style="font-weight: bold; color: #e83862; font-size: 15px;">{{ scope.row.real_name || '未填写' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="id_number" label="证件号码" width="160">
          <template #default="scope">
            <span style="font-family: monospace; font-size: 14px; color: #475569;">{{ scope.row.id_number || '未填写' }}</span>
          </template>
        </el-table-column>
        
        <!-- 🆕 核心：银行信息卡片化 -->
        <el-table-column label="绑定银行卡信息" min-width="300">
          <template #default="scope">
            <div class="bank-info" v-if="scope.row.bank_name && scope.row.account_number">
              <div class="bank-row">
                <span class="label">银行：</span> {{ scope.row.bank_name }}
              </div>
              <div class="bank-row">
                <span class="label">支店：</span> {{ scope.row.branch_name }} 
                <span class="branch-code">[ {{ scope.row.branch_code || '无编号' }} ]</span>
              </div>
              <div class="bank-row">
                <span class="label">类型：</span> 
                <el-tag size="small" :type="scope.row.account_type === 'ordinary' ? 'info' : 'warning'" effect="plain" round>
                  {{ scope.row.account_type === 'ordinary' ? '普通' : '当座' }}
                </el-tag>
              </div>
              <div class="bank-row">
                <span class="label">账号：</span> <span style="font-family: monospace; font-weight: bold;">{{ scope.row.account_number }}</span>
              </div>
              <div class="bank-row">
                <span class="label">户名：</span> {{ scope.row.account_name }}
              </div>
            </div>
            <div v-else class="empty-bank">
              <el-tag type="danger" effect="plain" round>⚠️ 未绑定银行卡</el-tag>
            </div>
          </template>
        </el-table-column>

        <!-- 当前状态列 -->
        <el-table-column label="当前状态" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.verify_status === 0" type="info" effect="plain" round>未实名</el-tag>
            <el-tag v-else-if="scope.row.verify_status === 1" type="warning" effect="light" round>审核中</el-tag>
            <el-tag v-else-if="scope.row.verify_status === 2" type="success" effect="light" round>已通过</el-tag>
            <el-tag v-else-if="scope.row.verify_status === 3" type="danger" effect="plain" round>已驳回</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="last_active_at" label="申请/活跃时间" width="180">
          <template #default="scope">
            <span class="time-text">{{ formatTime(scope.row.last_active_at) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="scope">
            <!-- 待审核状态 -->
            <div v-if="scope.row.verify_status === 1" style="display: flex; gap: 8px; justify-content: center;">
              <el-button type="success" size="small" round @click="handleApprove(scope.row.id, 2)">通过</el-button>
              <el-button type="danger" size="small" plain round @click="handleApprove(scope.row.id, 3)">驳回</el-button>
            </div>
            <!-- 已通过状态 -->
            <div v-else-if="scope.row.verify_status === 2">
              <el-button type="warning" size="small" plain round @click="handleApprove(scope.row.id, 3)">撤销并驳回</el-button>
            </div>
            <!-- 已驳回状态 -->
            <div v-else-if="scope.row.verify_status === 3">
              <el-button type="success" size="small" plain round @click="handleApprove(scope.row.id, 2)">重新通过</el-button>
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

// 处理审核逻辑 (改为传递数字状态：2代表通过，3代表驳回)
const handleApprove = async (userId, targetStatus) => {
  const actionText = targetStatus === 2 ? '通过' : '驳回';
  try {
    await ElMessageBox.confirm(`确认要${actionText}该用户的实名申请吗？`, '操作确认', { 
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    });
    
    // 🆕 修改：传递 targetStatus 给后端
    const res = await request.post(`/admin/approve-verify/${userId}`, { status: targetStatus });
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
.verify-page { 
  display: flex; 
  flex-direction: column; 
  gap: 20px; 
  padding: 20px; 
  background: #f4f7f9;
  min-height: 100vh;
}

/* 顶部工具栏 */
.toolbar { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  background: #fff; 
  padding: 20px 24px; 
  border-radius: 16px; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.03); 
}
.toolbar-title h2 { margin: 0 0 5px 0; color: #1e293b; font-weight: 900; font-size: 20px; }
.toolbar-title p { margin: 0; color: #94a3b8; font-size: 13px; }

/* 表格卡片 */
.table-card { 
  border-radius: 16px; 
  border: none; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.03); 
}

/* 时间文本 */
.time-text { color: #64748b; font-size: 13px; font-family: monospace; }

/* 🆕 银行卡信息排版（卡片化） */
.bank-info {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #334155;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 280px;
}
.bank-row { display: flex; align-items: center; }
.bank-info .label { color: #94a3b8; display: inline-block; width: 45px; flex-shrink: 0; }
.bank-info .branch-code { color: #e83862; font-weight: 900; margin-left: 4px; }

.empty-bank {
  padding: 10px;
  background: #fef2f2;
  border-radius: 10px;
  display: inline-block;
}
</style>