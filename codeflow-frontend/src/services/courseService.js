import api from './api';

// Fetch all courses
export const getAllCourses = () => api.get('/courses');

// Fetch a course by ID with details (topics + problems)
export const getCourseWithDetails = (id) => api.get(`/courses/${id}`);

// Create, update, delete
export const createCourse = (courseData) => api.post('/courses', courseData);
export const updateCourse = (id, courseData) => api.put(`/courses/${id}`, courseData);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);
