<template>
  <router-view></router-view>
</template>

<script setup>
// App.vue 作为根组件，这里不需要写逻辑
</script>

<style>
/* ================= 全局基础重置 ================= */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  background-color: #f1f5f9;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

/* ================= 📱 管理台全局移动端适配 ================= */
@media (max-width: 768px) {
  
  /* 1. 侧边栏收缩：只保留图标 */
  .sidebar {
    width: 64px !important; /* 强制缩小侧边栏 */
    overflow: hidden;
  }
  .logo-area, .logo-text {
    display: none !important; /* 手机端隐藏 Logo 文字 */
  }
  .side-menu {
    padding: 5px !important;
  }
  .side-menu .el-menu-item {
    padding: 0 10px !important;
    justify-content: center;
  }
  .side-menu .el-menu-item span {
    display: none; /* 手机端隐藏菜单文字，只留图标 */
  }

  /* 2. 主内容区铺满 */
  .main-content {
    padding: 10px !important;
  }

  /* 3. Element Plus 表格变卡片 */
  .el-table {
    font-size: 13px;
    background-color: transparent !important;
  }
  .el-table__header {
    display: none !important; /* 隐藏表头 */
  }
  .el-table tr {
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid #e2e8f0;
    padding: 10px 0;
    background-color: #fff;
    margin-bottom: 10px;
    border-radius: 8px;
  }
  .el-table td.el-table__cell {
    border: none !important;
    padding: 5px 15px !important;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  
  /* 表格内单元格添加伪元素，显示列名（可选，针对深色表） */
  .el-table td.el-table__cell::before {
    content: attr(data-label);
    color: #94a3b8;
    font-size: 12px;
  }

  /* 4. 表单和按钮全宽 */
  .el-button {
    width: 100%;
    margin-left: 0 !important;
    margin-bottom: 10px;
  }
  .el-input, .el-select {
    width: 100% !important;
  }
  
  /* 5. 弹窗宽度 */
  .el-dialog {
    width: 90% !important;
    margin-top: 5vh !important;
  }
  .el-drawer {
    width: 90% !important;
  }
  
  /* 6. 顶部导航栏适配 (如果在 Layout 里写死了高度) */
  .top-bar {
    padding: 0 15px !important;
  }
  .header-left h3 {
    font-size: 16px;
  }
  .welcome {
    display: none; /* 手机端隐藏“欢迎回来”文字 */
  }
}
</style>