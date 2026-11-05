
const configuredUrl = (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:3001' : '')
).trim().replace(/\/+$/, '')

// Accept either a backend origin or an origin ending in /api.
// Normalize it so API_CONFIG.baseURL always contains only
// the backend origin.
const API_BASE_URL = configuredUrl.replace(/\/api$/i, '')

if (import.meta.env.PROD && !API_BASE_URL) {
    console.error('VITE_API_URL is missing. Configure the backend URL.')
}

const API_PREFIX = `${API_BASE_URL}/api`

export const API_CONFIG = {
    baseURL: API_BASE_URL,

    endpoints: {
        auth: {
            login: `${API_PREFIX}/auth/login`,
            signup: `${API_PREFIX}/auth/signup`,
        },

        messages: `${API_PREFIX}/messages`,

        // Investigator case management
        investigatorCases: `${API_PREFIX}/cases`,

        // Researcher case repository
        researcherCases: `${API_PREFIX}/researcher/cases`,

        // Preserve the existing cases endpoint for compatibility.
        cases: `${API_PREFIX}/researcher/cases`,

        users: `${API_PREFIX}/users`,

        evidence: `${API_PREFIX}/evidence`,

        notifications: `${API_PREFIX}/notifications`,

        admin: `${API_PREFIX}/admin`,
    }
}

export default API_CONFIG
