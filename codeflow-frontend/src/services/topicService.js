import api from './api';

// You will create these API endpoints in the backend next.
export const getAllTopics = () => api.get('/topics');

export const getTopicsByCourse = (courseId) => api.get(`/topics/course/${courseId}`);

export const createTopic = (topicData) => api.post('/topics', topicData);

export const updateTopic = (id, topicData) => api.put(`/topics/${id}`, topicData);
export const deleteTopic = (id) => api.delete(`/topics/${id}`);
