// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://sistema-backend-0bs7.onrender.com', // URL do backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;