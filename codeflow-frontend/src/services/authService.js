import api from './api';

export const signup = async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
};

export const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const adminLogin = async (credentials) => {
    const response = await api.post('/auth/admin/login', credentials);
    return response.data;
};

export const loadUser = async () => {
    const response = await api.get('/auth');
    return response.data;
};