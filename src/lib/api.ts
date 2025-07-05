import axios from 'axios';
import { useStore } from '../store/useStore';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:8000/api' : '/api',
  timeout: 30000,
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state on 401
      localStorage.removeItem('auth_token');
      useStore.getState().setUser(null);
    }
    return Promise.reject(error);
  }
);

export class ApiService {
  // Generation endpoints
  static async startGeneration(data: any) {
    const response = await api.post('/generation/start', data);
    return response.data;
  }

  static async getGenerationStatus(jobId: string) {
    const response = await api.get(`/generation/status/${jobId}`);
    return response.data;
  }

  static async getUserJobs() {
    const response = await api.get('/generation/jobs');
    return response.data;
  }

  static async analyzeData(data: any) {
    const response = await api.post('/generation/analyze', data);
    return response.data;
  }

  // Schema generation from natural language
  static async generateSchemaFromDescription(description: string, domain: string, dataType: string) {
    const response = await api.post('/generation/schema-from-description', {
      description,
      domain,
      data_type: dataType
    });
    return response.data;
  }

  // Local data generation for guests
  static async generateLocalData(config: any) {
    const response = await api.post('/generation/generate-local', config);
    return response.data;
  }
  // Analytics endpoints
  static async getSystemMetrics() {
    const response = await api.get('/analytics/metrics');
    return response.data;
  }

  static async getAgentStatus() {
    const response = await api.get('/agents/status');
    return response.data;
  }

  // Real-time WebSocket connection
  static createWebSocketConnection(userId: string) {
    const wsUrl = `ws://localhost:8000/ws/${userId}`;
    return new WebSocket(wsUrl);
  }

  // Health check
  static async healthCheck() {
    const response = await api.get('/health');
    return response.data;
  }
}

export default api;