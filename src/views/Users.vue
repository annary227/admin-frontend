<template>
  <div class="dark-admin-page">
    <div class="search-panel">
      <div class="panel-title">
        <h2>用户管理与资产状态</h2>
        <p>全平台用户身份、银行卡绑定及资金控制中心</p>
      </div>
      
      <div class="search-form">
        <div class="form-item">
          <label>用户名称</label>
          <el-input v-model="searchForm.username" placeholder="搜索用户名称" clearable />
        </div>
        <div class="form-item">
          <label>编号 ID</label>
          <el-input v-model="searchForm.userId" placeholder="搜索编号" clearable />
        </div>
        <div class="form-item" style="flex: 0.5; justify-content: flex-end;">
          <label style="opacity: 0;">开关</label>
          <el-switch 
            v-model="hideBots" 
            active-text="隐藏虚拟机器人" 
            inactive-text="显示全部"
            @change="handleSearch"
            style="--el-switch-on-color: #e83862;"
          />
        </div>
      </div>

      <div class="action-btns">
        <el-button type="primary" @click="handleSearch">开始查找</el-button>
        <el-button class="reset-btn" @click="resetSearch">重置条件</el-button>
      </div>
    </div>

    <div class="table-panel">
      <el-table 
        :data="usersList" 
        v-loading="loading"
        style="width: 100%" 
        :row-class-name="tableRowClassName"
        @expand-change="handleExpandChange"
      >
        <!-- 行内展开列 -->
        <el-table-column type="expand">
          <template #default="scope">
            <div v-if="scope.row.is_agent === 1" class="sub-table-container">
              <div class="sub-table-header">
                <h4>👑 {{ scope.row.username }} 的下级用户列表</h4>
              </div>
              
              <el-table 
                :data="scope.row.subordinates || []" 
                v-loading="scope.row.subLoading"
                style="width: 100%"
                :row-class-name="tableRowClassName"
              >
                <el-table-column prop="id" label="ID" width="80">
                  <template #default="scope">#{{ scope.row.id }}</template>
                </el-table-column>
                <el-table-column prop="username" label="用户名" />
                <el-table-column label="余额">
                  <template #default="scope">
                    <span class="balance-text">{{ scope.row.balance.toLocaleString() }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="注册时间">
                  <template #default="scope">
                    <span class="time-text">{{ formatTime(scope.row.created_at) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="最后活跃">
                  <template #default="scope">
                    <span class="time-text">{{ formatTime(scope.row.last_active_at) }}</span>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="scope.row.subordinates && scope.row.subordinates.length === 0" description="该代理暂无下级" />
            </div>
            <div v-else style="padding: 20px; text-align: center; color: #64748b;">
              此用户不是代理，暂无下级。
            </div>
          </template>
        </el-table-column>

        <el-table-column label="在线状态" width="100">
          <template #default="scope">
            <div class="status-tag" :class="isOnline(scope.row.last_active_at) ? 'online' : 'offline'">
              <span class="dot"></span>
              {{ isOnline(scope.row.last_active_at) ? '在线' : '离线' }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="id" label="ID" width="80">
          <template #default="scope">#{{ scope.row.id }}</template>
        </el-table-column>
        
        <el-table-column prop="username" label="用户名" min-width="160">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="text-gray">{{ scope.row.username }}</span>
              <el-tag v-if="scope.row.is_agent === 1" type="warning" effect="dark" size="small" style="border-radius: 4px;">👑 代理</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="注册时间" width="170">
          <template #default="scope">
            <span class="time-text">{{ formatTime(scope.row.created_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="last_active_at" label="最后登录时间" width="170">
          <template #default="scope">
            <span class="time-text">{{ formatTime(scope.row.last_active_at) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="账户余额 (¥)" width="150" align="center">
          <template #default="scope">
            <span class="balance-text">{{ scope.row.balance.toLocaleString() }}</span>
          </template>
        </el-table-column>
        
        <!-- 🆕 修复：宽度改为 280，彻底解决凸起问题 -->
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <div class="action-group">
              <button class="btn-add" @click="openRechargeModal(scope.row, 1)">加币</button>
              <button class="btn-sub" @click="openRechargeModal(scope.row, -1)">扣币</button>
              <button class="btn-edit" @click="openUserProbModal(scope.row)">风控</button>
              
              <!-- 代理专属查看下级按钮 -->
              <button 
                v-if="scope.row.is_agent === 1" 
                class="btn-agent" 
                @click="toggleRowExpand(scope.row, $event)"
              >
                {{ scope.row.subordinates ? '收起' : '下级' }}
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 真正的后端分页器 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @current-change="fetchUsers"
          @size-change="handleSizeChange"
          background
        />
      </div>
    </div>

    <!-- 风控抽屉 -->
    <el-drawer v-model="drawerVisible" :title="`风控操作 - ${currentUser.username}`" size="380px">
      <div class="drawer-content">
        <el-alert title="高风险操作提示" type="warning" :closable="false" show-icon style="margin-bottom: 20px;">
          开启封锁后，该用户无论玩什么游戏，都只会抽到最差的奖品（全盘不中奖）。
        </el-alert>
        <div class="control-switch-box">
          <span class="label">全盘封锁 (只输不赢)</span>
          <el-switch v-model="isUserBlocked" active-text="已封锁" inactive-text="正常" style="--el-switch-on-color: #ef4444; --el-switch-off-color: #10b981;" @change="handleBlockChange" />
        </div>
        <div style="margin-top: 30px; text-align: center; color: #64748b; font-size: 13px;">
          当前状态：{{ isUserBlocked ? '【黑名单】系统将拦截该用户的任何大奖' : '【正常】正常读取系统全局概率' }}
        </div>
      </div>
    </el-drawer>

    <!-- 资金操作弹窗 -->
    <el-dialog v-model="rechargeVisible" title="资金操作" width="400px" center>
      <el-form>
        <el-form-item label="操作对象">
          <span style="font-weight:bold;">{{ currentUser.username }}</span>
        </el-form-item>
        <el-form-item label="操作金额">
          <el-input-number v-model="rechargeAmount" :step="1000" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRecharge" :loading="savingRecharge">确认操作</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../api/request';

const usersList = ref([]);
const loading = ref(false);
const hideBots = ref(false); 
const total = ref(0); 
const currentPage = ref(1);
const pageSize = ref(20);
const tableRef = ref(null); 

const searchForm = ref({ username: '', userId: '' });

const fetchUsers = async () => {
  loading.value = true;
  try {
    const { username, userId } = searchForm.value;
    const res = await request.get('/admin/users', {
      params: {
        username, userId,
        hideBots: hideBots.value ? 1 : 0,
        page: currentPage.value,
        pageSize: pageSize.value
      }
    });
    if (res.data.success) {
      usersList.value = res.data.users;
      total.value = res.data.total;
    }
  } catch (e) { ElMessage.error('获取用户失败'); }
  finally { loading.value = false; }
};

const handleSearch = () => { currentPage.value = 1; fetchUsers(); };
const handleSizeChange = () => { currentPage.value = 1; fetchUsers(); };
const resetSearch = () => {
  searchForm.value = { username: '', userId: '' };
  hideBots.value = false; 
  currentPage.value = 1;
  fetchUsers();
};

const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  return new Date(timeStr).toLocaleString('zh-CN', { hour12: false });
};

const isOnline = (lastActive) => {
  if (!lastActive) return false;
  const diff = new Date().getTime() - new Date(lastActive).getTime();
  return diff < 5 * 60 * 1000;
};

const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 1 ? 'dark-row' : 'light-row';
};

// ==========================================
// 🆕 代理下级逻辑 (行内展开)
// ==========================================
const handleExpandChange = async (row, expandedRows) => {
  if (expandedRows.includes(row) && !row.subordinates) {
    row.subLoading = true;
    try {
      const res = await request.get(`/admin/agent/${row.id}/subordinates`);
      if (res.data.success) {
        row.subordinates = res.data.data;
      }
    } catch (e) {
      ElMessage.error('获取下级用户失败');
    } finally {
      row.subLoading = false;
    }
  }
};

// 🆕 点击按钮控制展开/收起
const toggleRowExpand = (row, event) => {
  event.stopPropagation(); 
  if (!tableRef.value) return;
  tableRef.value.toggleRowExpansion(row);
};

// ==========================================
// 风控逻辑
// ==========================================
const drawerVisible = ref(false);
const currentUser = ref({});
const isUserBlocked = ref(false);

const openUserProbModal = (user) => {
  currentUser.value = user;
  if (user.custom_probability) {
    try {
      const prob = JSON.parse(user.custom_probability);
      isUserBlocked.value = prob.length === 1 && prob[0].name === 'BLOCKED';
    } catch(e) { isUserBlocked.value = false; }
  } else {
    isUserBlocked.value = false;
  }
  drawerVisible.value = true;
};

const handleBlockChange = async (val) => {
  try {
    let probability = null;
    if (val) probability = [{ name: 'BLOCKED', value: 0, probability: 100 }];
    await request.post(`/admin/set-user-probability/${currentUser.value.id}`, { probability });
    ElMessage.success(val ? '已开启黑名单封锁！' : '已恢复该用户的正常概率！');
    fetchUsers();
  } catch (error) {
    ElMessage.error('风控操作失败');
    isUserBlocked.value = !val;
  }
};

// ==========================================
// 资金操作逻辑
// ==========================================
const rechargeVisible = ref(false);
const rechargeAmount = ref(0);
const savingRecharge = ref(false);

const openRechargeModal = (user, type) => {
  currentUser.value = user;
  rechargeAmount.value = type === 1 ? 1000 : -1000;
  rechargeVisible.value = true;
};

const submitRecharge = async () => {
  if (rechargeAmount.value === 0) return ElMessage.warning('金额不能为0');
  savingRecharge.value = true;
  try {
    const res = await request.post('/admin/recharge', { userId: currentUser.value.id, amount: rechargeAmount.value });
    if (res.data.success) {
      ElMessage.success(res.data.message);
      rechargeVisible.value = false;
      fetchUsers();
    }
  } catch (e) { ElMessage.error(e.response?.data?.error || '操作失败'); }
  finally { savingRecharge.value = false; }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
/* 保持之前的暗黑风格不变 */
.dark-admin-page { background-color: #0b1120; min-height: 100vh; padding: 24px; color: #94a3b8; font-family: 'Inter', sans-serif; }
.search-panel { background: #151e2e; border-radius: 12px; padding: 24px; border: 1px solid #1e293b; margin-bottom: 24px; }
.panel-title h2 { color: #f8fafc; margin: 0 0 8px 0; font-size: 20px; }
.panel-title p { margin: 0 0 24px 0; font-size: 13px; color: #64748b; }
.search-form { display: flex; gap: 24px; margin-bottom: 24px; }
.form-item { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.form-item label { font-size: 13px; color: #cbd5e1; }
:deep(.el-input__wrapper) { background-color: #0b1120; box-shadow: 0 0 0 1px #334155 inset; }
:deep(.el-input__inner) { color: #f8fafc; }
.action-btns { display: flex; gap: 12px; }
.action-btns .el-button { width: 120px; border-radius: 6px; }
.action-btns .reset-btn { background: #1e293b; border-color: #334155; color: #cbd5e1; }
.table-panel { background: #151e2e; border-radius: 12px; padding: 1px; border: 1px solid #1e293b; overflow: hidden; }

.pagination-wrapper { padding: 20px; display: flex; justify-content: flex-end; background: #151e2e; border-top: 1px solid #1e293b; }
:deep(.el-pagination) { --el-pagination-bg-color: transparent; --el-pagination-text-color: #94a3b8; --el-pagination-button-bg-color: #1e293b; --el-pagination-button-color: #cbd5e1; --el-pagination-hover-color: #e83862; --el-pagination-button-disabled-color: #475569; --el-pagination-button-disabled-bg-color: #0f172a; }
:deep(.el-pagination.is-background .el-pager li) { background-color: #1e293b; color: #cbd5e1; }
:deep(.el-pagination.is-background .el-pager li.is-active) { background-color: #e83862; color: white; }

:deep(.el-table) { background-color: transparent; color: #cbd5e1; --el-table-border-color: #1e293b; --el-table-header-bg-color: #0f172a; --el-table-row-hover-bg-color: #1e293b; }
:deep(.el-table th.el-table__cell) { background-color: #0f172a; color: #94a3b8; border-bottom: 1px solid #1e293b; font-weight: 500; padding: 16px 0; }
:deep(.el-table tr) { background-color: #151e2e; }
:deep(.el-table td.el-table__cell) { border-bottom: 1px solid #1e293b; padding: 12px 0; }
:deep(.el-table__inner-wrapper::before) { display: none; }
:deep(.light-row) { background-color: #151e2e; }
:deep(.dark-row) { background-color: #101827; }
.text-gray { color: #94a3b8; }
.time-text { color: #64748b; font-size: 13px; font-family: monospace; }
.balance-text { color: #10b981; font-weight: bold; font-family: monospace; font-size: 15px; }
.status-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; padding: 4px 10px; border-radius: 20px; }
.status-tag.online { color: #10b981; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); }
.status-tag.offline { color: #64748b; background: rgba(100, 116, 139, 0.1); border: 1px solid rgba(100, 116, 139, 0.2); }
.status-tag .dot { width: 6px; height: 6px; border-radius: 50%; }
.status-tag.online .dot { background: #10b981; box-shadow: 0 0 8px #10b981; }
.status-tag.offline .dot { background: #64748b; }
.action-group { display: flex; gap: 8px; justify-content: center; }
.action-group button { padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; border: 1px solid; background: transparent; transition: all 0.2s; white-space: nowrap; }
.btn-add { color: #10b981; border-color: rgba(16, 185, 129, 0.4); }
.btn-add:hover { background: rgba(16, 185, 129, 0.1); }
.btn-sub { color: #ef4444; border-color: rgba(239, 68, 68, 0.4); }
.btn-sub:hover { background: rgba(239, 68, 68, 0.1); }
.btn-edit { color: #eab308; border-color: rgba(234, 179, 8, 0.4); }
.btn-edit:hover { background: rgba(234, 179, 8, 0.1); }

/* 🆕 代理按钮专属样式 */
.btn-agent { color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); }
.btn-agent:hover { background: rgba(56, 189, 248, 0.1); }

/* 极简抽屉样式 */
.drawer-content { padding: 10px; }
.control-switch-box {
  background: #f1f5f9;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.control-switch-box .label { font-weight: bold; color: #1e293b; font-size: 15px; }

/* 🆕 内部子表格专属背景 */
.sub-table-container {
  background: #0b1120;
  padding: 20px;
  border-radius: 8px;
  margin: 10px 20px;
  border: 1px solid #1e293b;
}
.sub-table-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #1e293b;
}
.sub-table-header h4 {
  margin: 0;
  color: #fbbf24;
  font-size: 15px;
  font-weight: bold;
}
</style>