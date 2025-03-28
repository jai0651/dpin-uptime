import axios from 'axios';
import { API_BACKEND_URL } from '@/config';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// Create a base axios instance
export const api = axios.create({
  baseURL: API_BACKEND_URL,
});

// Create a hook for authenticated API requests
export function useApi() {
  const { getToken, signOut } = useAuth();
  const router = useRouter();

  // Add a request interceptor to add the token
  api.interceptors.request.use(async (config) => {
    // Get the token before each request
    const token = await getToken();
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  });

  // Add a response interceptor to handle token expiration
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Check if the error is due to an expired token
      if (error.response?.status === 401 && 
          (error.response?.data === "Token expired" || 
           error.response?.data === "Invalid token")) {
        console.log('Token expired, logging out...');
        // Sign out the user
        await signOut();
        // Redirect to home page
        router.push('/');
      }
      return Promise.reject(error);
    }
  );

  return { api };
} 