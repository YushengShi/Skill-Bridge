/**
 * API Utility Functions
 * Handles API calls with proper base URL configuration
 */

import { API_BASE_URL } from '../constants';

/**
 * Makes an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/students/dashboard')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} Fetch response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}/api${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add authorization header if token exists
  const token = localStorage.getItem('token');
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  return fetch(url, config);
};

/**
 * GET request helper
 * @param {string} endpoint - API endpoint
 * @returns {Promise<Response>} Fetch response
 */
export const apiGet = (endpoint) => apiRequest(endpoint);

/**
 * POST request helper
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body data
 * @returns {Promise<Response>} Fetch response
 */
export const apiPost = (endpoint, data) => apiRequest(endpoint, {
  method: 'POST',
  body: JSON.stringify(data),
});

/**
 * PUT request helper
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body data
 * @returns {Promise<Response>} Fetch response
 */
export const apiPut = (endpoint, data) => apiRequest(endpoint, {
  method: 'PUT',
  body: JSON.stringify(data),
});

/**
 * DELETE request helper
 * @param {string} endpoint - API endpoint
 * @returns {Promise<Response>} Fetch response
 */
export const apiDelete = (endpoint) => apiRequest(endpoint, {
  method: 'DELETE',
});