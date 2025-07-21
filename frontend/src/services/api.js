import { auth } from '../config/firebase';

const API_BASE_URL = 'http://localhost:3001/api'; // Ensure this is your correct backend URL

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (user) {
    // Force refresh the token if it's expired.
    return await user.getIdToken(true);
  }
  return null;
};

const apiRequest = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  if (!token) {
    // Handle case where user is not authenticated
    throw new Error('User is not authenticated.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Try to parse the error message from the backend's JSON response
    const errorBody = await response.json().catch(() => ({
        error: `API request failed with status: ${response.status} ${response.statusText}`
    }));
    // Throw an error with the specific message from the server
    throw new Error(errorBody.error || 'An unknown API error occurred.');
  }

  // For 204 No Content responses (like a successful delete), response.json() will fail.
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const documentApi = {
  getAll: () => apiRequest('/notes'),
  getById: (id) => apiRequest(`/note/${id}`),
  create: (data) => apiRequest('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/note/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/note/${id}`, {
    method: 'DELETE',
  }),
  getPermissions: (id) => apiRequest(`/note/${id}/access`),
  share: (id, email, role) => apiRequest(`/note/${id}/invite`, {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  }),
  removeAccess: (id, userId) => apiRequest(`/note/${id}/remove_user`, {
      method: 'POST',
      body: JSON.stringify({ userIdToRemove: userId }),
  }),
  getUserDetails: (userIds) => apiRequest('/members/info', {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  }),
};