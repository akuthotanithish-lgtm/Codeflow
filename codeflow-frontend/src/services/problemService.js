// frontend/services/problemService.js

import api from './api';

// FIX: Return the full API response promise for consistency with other services.
export const getAllQuestions = () => api.get('/questions');

export const getQuestionById = (id) => api.get(`/questions/${id}`);

export const createQuestion = (questionData) => api.post('/questions', questionData);

export const updateQuestion = (id, questionData) => api.put(`/questions/${id}`, questionData);

export const deleteQuestion = (id) => api.delete(`/questions/${id}`);

export const getQuestionByIdForAdmin = (id) => api.get(`/questions/admin/${id}`);

export const createBulkQuestions = (questionsArray) => api.post('/questions/bulk', questionsArray);