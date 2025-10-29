"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiClient = createApiClient;
exports.handleApiError = handleApiError;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("./config");
/**
 * Create an Axios instance with auth token
 */
function createApiClient() {
    const config = (0, config_1.getConfig)();
    const baseURL = config?.apiUrl || process.env.ENVSHIELD_API_URL || 'http://localhost:3000/api/v1';
    const client = axios_1.default.create({
        baseURL,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    // Add auth token if available
    if (config?.token) {
        client.defaults.headers.common['Authorization'] = `Bearer ${config.token}`;
    }
    // Response interceptor for better error handling
    client.interceptors.response.use((response) => response, (error) => {
        if (error.response) {
            const data = error.response.data;
            const message = data?.message || 'Request failed';
            // Create a more user-friendly error
            const enhancedError = new Error(message);
            enhancedError.status = error.response.status;
            enhancedError.data = data;
            throw enhancedError;
        }
        else if (error.request) {
            throw new Error('Cannot connect to EnvShield API. Please check your internet connection.');
        }
        else {
            throw error;
        }
    });
    return client;
}
/**
 * Handle API errors with user-friendly messages
 */
function handleApiError(error) {
    if (error.status === 401) {
        console.error('❌ Unauthorized. Your token may have expired.');
        console.error('   Please run "envshield login" again.');
    }
    else if (error.status === 403) {
        console.error('❌ Permission denied:', error.message);
    }
    else if (error.status === 404) {
        console.error('❌ Not found:', error.message);
    }
    else if (error.status === 400) {
        console.error('❌ Invalid request:', error.message);
        if (error.data?.errors) {
            console.error('   Errors:', JSON.stringify(error.data.errors, null, 2));
        }
    }
    else if (error.message) {
        console.error('❌ Error:', error.message);
    }
    else {
        console.error('❌ An unexpected error occurred');
    }
    process.exit(1);
}
//# sourceMappingURL=api.js.map