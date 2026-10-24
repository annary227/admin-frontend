<template>
  <div style="padding: 20px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h2>全站抽奖流水</h2>
      <el-button type="primary" plain @click="fetchRecords" :loading="isLoading">刷新数据</el-button>
    </div>
    
    <el-table :data="tableData" v-loading="isLoading" style="width: 100%; margin-top: 20px;" border stripe>
      <el-table-column prop="date" label="抽奖时间" width="200" />
      <el-table-column prop="user" label="用户账号" width="150" />
      <el-table-column prop="game" label="游戏名称" width="180" />
      <el-table-column prop="cost" label="消费金额" width="120">
        <template #default="scope">
          <span style="color: #ef4444;">{{ scope.row.cost }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="prize" label="当せん结果">
        <template #default="scope">
          <span :style="{ color: scope.row.isWin ? '#e83862' : '#999', fontWeight: scope.row.isWin ? 'bold' : 'normal' }">
            {{ scope.row.prize }}
          </span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '../api/request';
import { ElMessage } from 'element-plus';

const tableData = ref([]);
const isLoading = ref(false);

const fetchRecords = async () => {
  isLoading.value = true;
  try {
    const res = await request.get('/admin/all-records');
    if (res.data.success) {
      tableData.value = res.data.records.map(row => ({
        date: new Date(row.created_at).toLocaleString('zh-CN', { hour12: false }),
        user: row.username,
        game: row.game_name,
        cost: `¥${row.cost.toLocaleString()}`,
        prize: row.prize_name,
        isWin: row.prize_name !== 'ハズレ'
      }));
    }
  } catch (error) {
    console.error('获取流水失败', error);
    ElMessage.error('获取流水失败，请检查后端接口');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchRecords();
});
</script>