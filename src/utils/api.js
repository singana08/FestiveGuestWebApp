import axios from 'axios';

// Determine base URL based on environment
const getBaseURL = () => {
  return 'https://api.festiveguest.com/api';
};

// Create axios instance with security defaults
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000 // 60 second timeout
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + '/' + config.url,
      headers: { ...config.headers, Authorization: config.headers.Authorization ? '[HIDDEN]' : undefined }
    });
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    try {
      // Use localStorage consistently
      const userStr = localStorage.getItem('user');
      
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (e) {
      console.warn('Failed to read user from storage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration and better error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error logging for debugging
    console.error('API Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid - clear all auth data
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      
      // Dispatch storage event to notify other components
      window.dispatchEvent(new Event('storage'));
      
      // Redirect to login only if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;