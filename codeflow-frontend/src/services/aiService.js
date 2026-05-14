import api from './api';

export const requestAiHelp = async (userMessage, conversationHistory = [], currentContext = {}) => {
    const response = await api.post('/ai/help', { 
        userMessage,
        conversationHistory,
        currentContext
    });
    return response.data;
};