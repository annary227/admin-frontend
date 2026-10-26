import axios from 'axios';

// 创建 axios 实例
const request = axios.create({
  // 🆕 已经帮你删除了中间的空格，路径是完美的
  baseURL: 'https://qualified-contacting-rom-dover.trycloudflare.com/api', 
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    // 保留绕过隧道拦截的请求头
    'bypass-tunnel-reminder': '1',
    'cf-skip-browser-warning': 'true'
  }
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
    return response;
  },
  error => {
    if (error.response) {
      console.error(`❌ 接口请求失败 [${error.response.status}]，路径: ${error.config.url}`);
    } else {
      console.error(`❌ 接口请求失败 [无响应/网络错误]`);
    }
    return Promise.reject(error);
  }
);

export default request;