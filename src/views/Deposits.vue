<template>
  <div class="dark-page">
    <!-- 顶部工具栏 -->
    <div class="page-header">
      <h2>入金审批管理</h2>
      <el-button type="primary" plain @click="fetchDeposits" :loading="loading">
        <el-icon><Refresh /></el-icon> 刷新列表
      </el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table 
        :data="depositList" 
        v-loading="loading"
        style="width: 100%"
        :header-cell-style="{ background: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }"
        :row-style="{ background: '#0f172a', color: '#e2e8f0' }"
        :cell-style="{ borderBottom: '1px solid #1e293b' }"
      >
        <el-table-column prop="id" label="订单号" width="100" />
        <el-table-column prop="username" label="用户名" width="150">
          <template #default="scope">
            <strong style="color: #38bdf8;">{{ scope.row.username }}</strong> 
            <span style="color: #64748b; font-size: 12px;">(ID: {{ scope.row.user_id }})</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="amount" label="入金金额" width="150">
          <template #default="scope">
            <span style="color: #fbbf24; font-weight: bold; font-size: 16px;">
              ¥{{ Number(scope.row.amount).toLocaleString() }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="申请时间" width="200">
          <template #default="scope">
            {{ formatTime(scope.row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 0" type="warning" effect="dark">待审核</el-tag>
            <el-tag v-else-if="scope.row.status === 1" type="success" effect="dark">已通过</el-tag>
            <el-tag v-else-if="scope.row.status === 2" type="info" effect="dark">已拒绝</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
            <!-- 只有状态为 0 (待审核) 才显示按钮 -->
            <div v-if="scope.row.status === 0">
              <el-button 
                size="small" 
                type="success" 
                @click="handleApprove(scope.row.id, 'approve')"
                :loading="scope.row.processing"
              >
                同意入金
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="handleApprove(scope.row.id, 'reject')"
                :loading="scope.row.processing"
              >
                拒绝
              </el-button>
            </div>
            <span v-else style="color: #64748b; font-size: 13px;">已处理</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '../api/request'; // 确保路径正确
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

const depositList = ref([]);
const loading = ref(false);

// 获取入金列表
const fetchDeposits = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/deposits');
    if (res.data.success) {
      // 给每条数据加一个 processing 字段，用于独立控制按钮的加载状态
      depositList.value = res.data.records.map(item => ({ ...item, processing: false }));
    }
  } catch (error) {
    ElMessage.error('获取入金记录失败，请检查网络或接口');
  } finally {
    loading.value = false;
  }
};

// 处理审批 (同意/拒绝)
const handleApprove = async (id, action) => {
  const actionText = action === 'approve' ? '同意' : '拒绝';
  
  try {
    await ElMessageBox.confirm(
      `确定要${actionText}该笔入金申请吗？`, 
      '审批确认', 
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );

    // 找到当前行，开启按钮 loading
    const row = depositList.value.find(item => item.id === id);
    if (row) row.processing = true;

    const res = await request.post(`/admin/approve-deposit/${id}`, { action });
    
    if (res.data.success) {
      ElMessage.success(`已${actionText}该笔申请`);
      fetchDeposits(); // 刷新表格
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '操作失败');
      // 恢复按钮状态
      const row = depositList.value.find(item => item.id === id);
      if (row) row.processing = false;
    }
  }
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const d = new Date(timeStr);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

// 页面加载时拉取数据
onMounted(() => {
  fetchDeposits();
});
</script>

<style scoped>
.dark-page {
  padding: 24px;
  background: #0f172a;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #f8fafc;
  font-size: 20px;
  font-weight: 600;
}

.table-container {
  background: #1e293b;
  border-radius: 12px;
  padding: 1px; /* 让表格边框和容器融为一体 */
  overflow: hidden;
  border: 1px solid #334155;
}

/* 覆盖 Element Plus 表格默认的白底样式 */
:deep(.el-table) {
  --el-table-border-color: #334155;
  --el-table-header-bg-color: #1e293b;
  --el-table-row-hover-bg-color: #334155;
  background-color: transparent;
}

:deep(.el-table tr) {
  background-color: #0f172a;
}
</style>