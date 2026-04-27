import axios from 'axios';

export let currentToken = null;
export const setToken = (token) => { currentToken = token; };

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/',
});

api.interceptors.request.use((config) => {
    if (currentToken) {
        config.headers.Authorization = `Token ${currentToken}`;
    }
    // Ensures trailing slashes rules are universally respected
    if (config.url && !config.url.endsWith('/')) {
        config.url += '/';
    }
    return config;
});

export default api;
