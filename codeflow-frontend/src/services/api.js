import axios from 'axios';

// Create a central instance of axios
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * We intercept every response. If we get a 401 Unauthorized error, it means
 * the token is invalid or expired. We'll log the user out and redirect to the
 * login page. This prevents the app from staying in a broken state.
 */
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            // You might also dispatch a logout action here if using a state manager
        }
        return Promise.reject(err);
    }
);

export default api;