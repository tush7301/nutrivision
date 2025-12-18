import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        // Ensure headers object exists
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Re-add Content-Type if it was removed from the initial config
    if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
    }
    return config;
});

// Response interceptor to handle 401s (Token expired/invalid)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
