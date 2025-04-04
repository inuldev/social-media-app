import axios from "axios";

const ApiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Create a default instance for general requests
const axiosInstance = axios.create({
  baseURL: ApiUrl,
  withCredentials: true,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  timeout: 200000, // 200 seconds timeout
  headers: {
    "Content-Type": "application/json", // Default to JSON
  },
});

// Add request interceptor for content type handling
axiosInstance.interceptors.request.use(
  (config) => {
    // Log request in development
    if (process.env.NODE_ENV === "development") {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    // Set appropriate content type
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else if (
      typeof config.data === "object" &&
      !(config.data instanceof FormData)
    ) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === "development") {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response?.status === 413) {
      console.error("File too large");
      throw new Error("File size exceeds the maximum limit");
    } else if (error.response?.status === 401) {
      console.error("Authentication error");
      // Could redirect to login page here if needed
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout");
      throw new Error("Request timed out. Please try again.");
    } else if (!error.response) {
      console.error("Network error", error);
      throw new Error("Network error. Please check your connection.");
    }

    // Log all errors in development
    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
        response: error.response?.data,
      });
    }

    throw error;
  }
);

// Create a new instance specifically for file uploads
export const createUploadInstance = (
  onUploadProgress = null,
  customTimeout = 200000
) => {
  const instance = axios.create({
    baseURL: ApiUrl,
    withCredentials: true,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: customTimeout, // Allow custom timeout to be passed
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });

  // Add response interceptor for error handling
  instance.interceptors.response.use(
    (response) => {
      // Log successful responses in development
      if (process.env.NODE_ENV === "development") {
        console.log(
          `Upload Response: ${response.status} ${response.config.url}`
        );
      }
      return response;
    },
    (error) => {
      // Handle specific error cases
      if (error.response?.status === 413) {
        console.error("File too large");
        throw new Error("File size exceeds the maximum limit");
      } else if (error.response?.status === 401) {
        console.error("Authentication error");
        // Could redirect to login page here if needed
      } else if (error.code === "ECONNABORTED") {
        console.error("Request timeout");
        throw new Error("Request timed out. Please try again.");
      } else if (!error.response) {
        console.error("Network error", error);
        throw new Error("Network error. Please check your connection.");
      }

      // Log all errors in development
      if (process.env.NODE_ENV === "development") {
        console.error("Upload API Error:", {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          response: error.response?.data,
        });
      }

      throw error;
    }
  );

  return instance;
};

export default axiosInstance;
