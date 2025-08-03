import { toast } from "sonner"
import axios, { type AxiosInstance, type AxiosResponse, AxiosError } from 'axios';

// Ensure VITE_API_URL is defined in your .env file (e.g., VITE_API_URL=http://localhost:3000/api)
const API_BASE_URL = import.meta.env.VITE_API_BASE;

if (!API_BASE_URL) {
  console.error('VITE_API_URL is not defined in your .env file. Please set it.');
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('API_BASE_URL', API_BASE_URL);
// Request interceptor to add the authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Assuming you store your token as 'authToken'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    if (response.status === 201) {
      toast.success("Created", {
        description: (response.data && response.data.message) || "Resource created successfully.",
      });
    } 
    // else if (response.status >= 200 && response.status < 300) {
    //   toast.success("Success", {
    //     description: (response.data && response.data.message) || "Operation completed successfully.",
    //   });
    // }
    return response;
  },
  (error: AxiosError) => {
    const errorMessage = (error.response?.data as { message?: string })?.message || 'Something went wrong.';
    let toastTitle = "Error";
    let toastDescription = errorMessage;
    
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      console.error('API Error Status:', error.response.status);
      console.error('API Error Headers:', error.response.headers);

      switch (error.response.status) {
        case 409:
          toastTitle = "Already Exists";
          toastDescription = errorMessage || "The resource already exists.";
          break;
        case 404:
          toastTitle = "Not Found";
          toastDescription = errorMessage || "The requested resource was not found.";
          break;
        case 400:
          toastTitle = "Bad Request";
          toastDescription = errorMessage || "Invalid request data.";
          break;
        case 401:
          toastTitle = "Unauthorized";
          toastDescription = errorMessage || "Please log in again.";
          console.log('Authentication failed!');
          localStorage.removeItem('authToken'); // Logout the user by deleting the token
          // Note: Redux state for authUser will be cleared on next app load or if you dispatch an action here.
          break;
        default:
          toastTitle = "Error";
          toastDescription = errorMessage;
      }
    } else if (error.request) {
      console.error('API Error Request:', error.request);
      toastDescription = "No response received from server.";
    } else {
      console.error('API Error Message:', error.message);
      toastDescription = error.message;
    }

    // toast.error(toastDescription ?? toastTitle);
    toast.error(toastTitle, {
      description: toastDescription,
    });

    return Promise.reject(error);
  }
);

export const callApi = async <T, I>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: I
) => {
  // try {
  let response: AxiosResponse<T>;
  switch (method) {
    case 'GET':
      response = await api.get<T>(url);
      break;
    case 'POST':
      response = await api.post<T>(url, data);
      break;
    case 'PUT':
      response = await api.put<T>(url, data);
      break;
    case 'DELETE':
      response = await api.delete<T>(url, { data }); // For DELETE with body
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
  return response.data;
  // } catch (error) {
  //   console.error(error);
  //   if(error instanceof AxiosError){
  //     console.error('AxiosError', error.response);
  //   }
  // }
};

export const get = <T>(url: string) => callApi<T, any>('GET', url);
export const post = <T, I>(url: string, data: I) => callApi<T, I>('POST', url, data);
export const put = <T, I>(url: string, data: I) => callApi<T, I>('PUT', url, data);
export const del = <T, I>(url: string, data?: I) => callApi<T, I>('DELETE', url, data);