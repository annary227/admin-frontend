import axios from 'axios';

// 创建 axios 实例
const request = axios.create({
  // 🆕 改为相对路径，让 Vercel 服务器通过 vercel.json 进行反向代理
  baseURL: '/api', 
  timeout: 15000 
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
    }
    return Promise.reject(error);
  }
);

export default request;