import api from '../services/api';

export const setAuthToken = (token) => {
    if (token) {
        // Apply authorization token to every request if logged in
        api.defaults.headers.common['x-auth-token'] = token;
        console.log("Auth token has been set.");
    } else {
        // Delete auth header
        delete api.defaults.headers.common['x-auth-token'];
        console.log("Auth token has been removed.");
    }
};