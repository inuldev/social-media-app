import axiosInstance from "./url.service";

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Response data
 * @throws {Error} If registration fails
 */
export const registerUser = async (userData) => {
  try {
    const response = await axiosInstance.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Login a user
 * @param {Object} userData - User login credentials
 * @returns {Promise<Object>} Response data
 * @throws {Error} If login fails
 */
export const loginUser = async (userData) => {
  try {
    // Add a retry mechanism for login
    const response = await axiosInstance.post("/auth/login", userData);

    // Log successful login for debugging
    console.log("Login successful:", {
      status: response.data.status,
      message: response.data.message,
      cookieSet: document.cookie.includes("auth_token") ? "yes" : "no",
    });

    return response.data;
  } catch (error) {
    // Enhanced error logging
    console.error("Login error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      cookies: document.cookie ? "Present" : "None",
    });
    throw error;
  }
};

/**
 * Logout the current user
 * @returns {Promise<Object>} Response data
 */
export const logout = async () => {
  try {
    const response = await axiosInstance.get("/auth/logout");
    return response.data;
  } catch (error) {
    console.error("Logout error:", error.response?.data || error.message);
    // Still return something even if logout fails
    return { status: "error", message: "Logout failed" };
  }
};

/**
 * Check if user is authenticated
 * @returns {Promise<Object>} Authentication status and user data
 */
export const checkUserAuth = async () => {
  try {
    const response = await axiosInstance.get("users/check-auth");
    if (response.data.status === "success") {
      return { isAuthenticated: true, user: response?.data?.data };
    } else {
      return { isAuthenticated: false };
    }
  } catch (error) {
    console.error("Auth check error:", error.response?.data || error.message);
    return { isAuthenticated: false };
  }
};
