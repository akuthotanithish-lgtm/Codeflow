import api from './api';

// FIX: Named export matching the import in your dashboard
export const getDashboardStats = () => api.get('/users/dashboard/stats');