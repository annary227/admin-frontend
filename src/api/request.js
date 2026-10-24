import axios from 'axios';

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api', // 所有请求都会自动加上 /api 前缀
  timeout: 5000    // 请求超时时间
});

// 请求拦截器：每次请求前自动带上 Token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// 响应拦截器：统一处理错误（可选，方便排查问题）
request.interceptors.response.use(
  response => {
    // 如果后端返回了 { success: false }，这里也可以统一处理
    return response;
  },
  error => {
    // 如果遇到 404 或 500，在控制台打印出具体是哪个接口报错
    if (error.response) {
      console.error(`❌ 接口请求失败 [${error.response.status}]，路径: ${error.config.url}`);
    }
    return Promise.reject(error);
  }
);

export default request;