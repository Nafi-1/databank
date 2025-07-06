import axios from 'axios';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

// Determine backend URL based on environment
const getBackendUrl = () => {
  // Check if we're in development and backend is expected to be running
  if (import.meta.env.DEV) {
    return 'http://localhost:8000/api';
  }
  // For production, use relative path
  return '/api';
};

// Create axios instance with dynamic base URL
const api = axios.create({
  baseURL: getBackendUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add guest token for guest users
  const { isGuest } = useStore.getState();
  if (isGuest && !token) {
    config.headers.Authorization = `Bearer guest-access`;
  }
  
  console.log(`🔗 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status || 'NETWORK'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error);
    
    if (error.response?.status === 401) {
      // Clear auth state on 401
      localStorage.removeItem('auth_token');
      useStore.getState().setUser(null);
    }
    return Promise.reject(error);
  }
);

export class ApiService {
  // Health check to verify backend connectivity
  static async healthCheck() {
    try {
      console.log('🔍 Checking backend health...');
      const response = await api.get('/health');
      console.log('💚 Backend is healthy:', response.data);
      return { healthy: true, data: response.data };
    } catch (error) {
      console.error('💔 Backend health check failed:', error);
      return { healthy: false, error: error.message };
    }
  }

  // Generation endpoints
  static async startGeneration(data: any) {
    try {
      console.log('🚀 Starting generation with data:', data);
      const response = await api.post('/generation/start', data);
      console.log('✅ Generation started:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Generation start failed:', error);
      throw error;
    }
  }

  static async getGenerationStatus(jobId: string) {
    try {
      const response = await api.get(`/generation/status/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get generation status:', error);
      throw error;
    }
  }

  static async getUserJobs() {
    try {
      const response = await api.get('/generation/jobs');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get user jobs:', error);
      throw error;
    }
  }

  static async analyzeData(data: any) {
    try {
      console.log('📊 Analyzing data:', data);
      const response = await api.post('/generation/analyze', data);
      console.log('✅ Data analysis complete:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Data analysis failed:', error);
      throw error;
    }
  }

  // Schema generation from natural language with better error handling
  static async generateSchemaFromDescription(description: string, domain: string, dataType: string) {
    try {
      console.log('🧠 Generating schema from description:', { description: description.substring(0, 100), domain, dataType });
      
      // First check if backend is healthy
      const health = await this.healthCheck();
      if (!health.healthy) {
        throw new Error(`Backend unavailable: ${health.error}`);
      }
      
      const response = await api.post('/generation/schema-from-description', {
        description,
        domain,
        data_type: dataType
      });
      
      console.log('✅ Schema generated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Schema generation failed:', error);
      
      // Provide specific error messages
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Backend service is not running. Please start the backend server.');
      } else if (error.response?.status === 404) {
        throw new Error('Schema generation endpoint not found. Please check backend configuration.');
      } else if (error.response?.status >= 500) {
        throw new Error('Backend server error. Please check server logs.');
      } else if (error.message.includes('Backend unavailable')) {
        throw error; // Re-throw our custom error
      }
      
      throw new Error(`Schema generation failed: ${error.message}`);
    }
  }

  // Local data generation for guests with backend attempt first
  static async generateLocalData(config: any) {
    try {
      console.log('🎯 Attempting local generation with config:', config);
      
      // First try backend even for guests
      try {
        const response = await api.post('/generation/generate-local', config);
        console.log('✅ Backend local generation successful:', response.data);
        return response.data;
      } catch (backendError) {
        console.log('⚠️ Backend unavailable for local generation, this will use frontend fallback');
        throw backendError;
      }
    } catch (error) {
      console.error('❌ Local generation API request failed:', error);
      throw error;
    }
  }

  // Analytics endpoints
  static async getSystemMetrics() {
    try {
      const response = await api.get('/analytics/metrics');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get system metrics:', error);
      throw error;
    }
  }

  static async getAgentStatus() {
    try {
      const response = await api.get('/agents/status');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get agent status:', error);
      throw error;
    }
  }

  // Real-time WebSocket connection
  static createWebSocketConnection(userId: string) {
    const wsUrl = `ws://localhost:8000/ws/${userId}`;
    console.log('🔌 Creating WebSocket connection:', wsUrl);
    return new WebSocket(wsUrl);
  }
}

export default api;