
// ======================================================
// DESS API CONFIGURATION
// ======================================================

// Development:
// http://localhost:3001
//
// Production:
// https://YOUR-BACKEND-NAME.onrender.com

const API_BASE_URL = (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:3001' : '')
).trim().replace(/\/+$/, '');

if (import.meta.env.PROD && !API_BASE_URL) {
    console.error(
        'DESS API ERROR: VITE_API_URL is not configured. ' +
        'Please add your backend URL to the Render frontend environment variables.'
    );
}

const API_PREFIX = `${API_BASE_URL}/api`;

export const API_CONFIG = {
    baseURL: API_BASE_URL,

    endpoints: {

        // Authentication
        auth: {
            login: `${API_PREFIX}/auth/login`,
            signup: `${API_PREFIX}/auth/signup`,
        },

        // Messages
        messages: `${API_PREFIX}/messages`,

        // Cases
        cases: `${API_PREFIX}/researcher/cases`,

        // Users
        users: `${API_PREFIX}/users`,

        // Evidence
        evidence: `${API_PREFIX}/evidence`,

        // Notifications
        notifications: `${API_PREFIX}/notifications`,

        // Administration
        admin: `${API_PREFIX}/admin`,

    }
};

export default API_CONFIG;
