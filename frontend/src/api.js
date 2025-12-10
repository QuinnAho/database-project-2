import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'
});

export const withAuth = token => (token ? { headers: { Authorization: `Bearer ${token}` } } : {});

export default api;
