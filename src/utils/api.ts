import axios from 'axios';
import { InternalAxiosRequestConfig, AxiosError } from 'axios';

// Create an Axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7173/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Include cookies for session management
});

// Authentication endpoints
export const authAPI = {
    login: (username: string, password: string) => {
        return api.post('/Auth/login', { username, password });
    },

    register: (userData: {
        firstName: string;
        lastName: string;
        email: string;
        username: string;
        password: string;
    }) => {
        return api.post('/Auth/register', userData);
    },

    // Add more auth endpoints as needed
};

// Add request interceptor for handling tokens if needed
// Define interceptor types

// Make sure this part is working correctly
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
);

// Add response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle common errors here
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('token');
            // You might want to redirect to login page here
        }

        return Promise.reject(error);
    }
);

export default api;
