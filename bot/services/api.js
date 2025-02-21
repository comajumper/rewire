// bot/services/api.js
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with config
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      // Request made but no response
      console.error('API No Response:', error.request);
    } else {
      // Something else happened
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const getAuthUrl = async (telegramId) => {
  try {
    const response = await api.get('/auth/google/url', {
      params: { telegram_id: telegramId }
    });
    return response.data.url;
  } catch (error) {
    console.error('Error getting auth URL:', error);
    throw error;
  }
};

export const getTodayMeetings = async (telegramId) => {
  try {
    const response = await api.get('/meetings/today', {
      params: { telegram_id: telegramId }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Unauthorized - need to reconnect calendar
      throw { type: 'unauthorized', message: 'Calendar not connected' };
    }
    throw error;
  }
};