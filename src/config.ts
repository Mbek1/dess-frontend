// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: {
      login: `${API_BASE_URL}/api/auth/login`,
      signup: `${API_BASE_URL}/api/auth/signup`,
    },
    messages: `${API_BASE_URL}/api/messages`,
    cases: `${API_BASE_URL}/api/researcher/cases`,
    users: `${API_BASE_URL}/api/users`,
  }
};

export default API_CONFIG;
