// client/src/utils/api.js
import axios from 'axios';
import { getToken, clearToken } from './auth';

// Create an Axios instance
const api = axios.create({
  baseURL: '/api',            // thanks to your proxy, this → http://localhost:5000/api
  timeout: 10000,
});

// Request interceptor: attach token
api.interceptors.request.use(
  config => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// // Response interceptor: handle 401 (optional)
// api.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.response?.status === 401) {
//       // token invalid/expired
//       clearToken();
//       window.location.href = '/login';  // redirect to login
//     }
//     return Promise.reject(error);
//   }
// );

export default api;
