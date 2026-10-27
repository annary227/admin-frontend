<template>
  <div class="dark-page">
    <!-- 极简工具栏 -->
    <div class="toolbar">
      <div class="title-area">
        <h2>实名认证审核 (KYC)</h2>
        <span class="subtitle">审核用户的实名信息及绑定的收款银行账户</span>
      </div>
      <el-button type="primary" color="#e83862" icon="Refresh" @click="fetchPendingUsers" :loading="loading">
        刷新列表
      </el-button>
    </div>

    <!-- 深色数据表 -->
    <div class="table-container">
      <el-table 
        :data="pendingUsers" 
        v-loading="loading" 
        size="large" 
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="id" label="ID" width="80" align="center">
          <template #default="scope">
            <span style="font-family: monospace; font-weight: bold; color: #64748b;">#{{ scope.row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="username" label="账号" min-width="160">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-avatar :size="24" style="background: #334155; color: #94a3b8; font-weight: bold;">
                {{ scope.row.username.charAt(0).toUpperCase() }}
              </el-avatar>
              <span style="font-weight: 600; color: #f8fafc;">{{ scope.row.username }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="real_name" label="真实姓名" width="140">
          <template #default="scope">
            <span style="font-weight: bold; color: #f43f5e; font-size: 15px;">{{ scope.row.real_name || '未填写' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="id_number" label="证件号码" width="160">
          <template #default="scope">
            <span style="font-family: monospace; font-size: 13px; color: #cbd5e1;">{{ scope.row.id_number || '未填写' }}</span>
          </template>
        </el-table-column>
        
        <!-- 深色化银行卡信息 -->
        <el-table-column label="绑定银行卡信息" min-width="300">
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
                <span class="value" style="font-family: monospace; color: #38bdf8; font-weight: bold;">{{ scope.row.account_number }}</span>
              </div>
              <div class="bank-row">
                <span class="label">户名</span>
                <span class="value">{{ scope.row.account_name }}</span>
              </div>
            </div>
            <span v-else style="color: #ef4444; font-size: 13px; border: 1px dashed #ef4444; padding: 2px 8px; border-radius: 4px;">未绑定</span>
          </template>
        </el-table-column>

        <!-- 当前状态列 -->
        <el-table-column label="当前状态" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.verify_status === 0" type="info" effect="dark" round>未实名</el-tag>
            <el-tag v-else-if="scope.row.verify_status === 1" type="warning" effect="dark" round>审核中</el-tag>
            <el-tag v-else-if="scope.row.verify_status === 2" type="success" effect="dark" round>已通过</el-tag>
            <el-tag v-else-if="scope.row.verify_status === 3" type="danger" effect="dark" round>已驳回</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="last_active_at" label="申请/活跃时间" width="180">
          <template #default="scope">
            <span class="time-text">{{ formatTime(scope.row.last_active_at) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="scope">
            <!-- 待审核状态 -->
            <div v-if="scope.row.verify_status === 1" style="display: flex; flex-direction: column; gap: 6px;">
              <el-button type="success" size="small" @click="handleApprove(scope.row.id, 2)">通过</el-button>
              <el-button type="danger" size="small" plain @click="handleApprove(scope.row.id, 3)">驳回</el-button>
            </div>
            <!-- 已通过状态 -->
            <div v-else-if="scope.row.verify_status === 2">
              <el-button type="warning" size="small" plain @click="handleApprove(scope.row.id, 3)">撤销并驳回</el-button>
            </div>
            <!-- 已驳回状态 -->
            <div v-else-if="scope.row.verify_status === 3">
              <el-button type="success" size="small" plain @click="handleApprove(scope.row.id, 2)">重新通过</el-button>
            </div>
            <span v-else style="color: #475569; font-size: 13px;">无操作</span>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty 
        v-if="pendingUsers.length === 0 && !loading" 
        description="当前没有待审核或已通过的实名申请" 
        :image-size="100"
        style="padding: 40px 0;"
      />
    </div>
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
const handleApprove = async (userId, targetStatus) => {
  const actionText = targetStatus === 2 ? '通过' : '驳回';
  try {
    await ElMessageBox.confirm(
      `确认要【${actionText}】该用户的实名申请吗？`, 
      '操作确认', 
      { 
        type: 'warning',
        confirmButtonText: '确定执行',
        cancelButtonText: '取消'
      }
    );
    
    const res = await request.post(`/admin/approve-verify/${userId}`, { status: targetStatus });
    if (res.data.success) {
      ElMessage.success(`已成功${actionText}该申请`);
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
  return date.toLocaleString('zh-CN', { hour12: false });
};

// 表格行背景色交替
const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'dark-row-even' : 'dark-row-odd';
};

onMounted(() => {
  fetchPendingUsers();
});
</script>

<style scoped>
/* 全局深色底板 */
.dark-page {
  padding: 24px;
  background: #0f172a;
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

/* 🆕 银行卡信息深色化 */
.dark-bank-card {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 280px;
}
.bank-row { display: flex; align-items: center; }
.bank-row .label { color: #64748b; width: 40px; flex-shrink: 0; }
.bank-row .value { color: #cbd5e1; }
.branch-code { 
  background: #7f1d1d; color: #fca5a5; padding: 1px 6px; border-radius: 4px; 
  font-weight: bold; margin-left: 6px; font-family: monospace;
}
</style>