import axiosInstance, { createUploadInstance } from "./url.service";

// Modified function for file uploads
export const createPost = async (
  postData,
  onUploadProgress = null,
  timeout = 200000
) => {
  try {
    // Check if this is a media upload
    const isMediaUpload = postData instanceof FormData && postData.has("media");

    // Get the media file if it exists
    const mediaFile = isMediaUpload ? postData.get("media") : null;
    const isVideoUpload =
      mediaFile && mediaFile.type && mediaFile.type.startsWith("video");

    // Log upload information only in development mode
    if (isMediaUpload && process.env.NODE_ENV === "development") {
      console.log(
        `Creating post with media: ${isVideoUpload ? "Video" : "Image/Other"}`,
        {
          fileSize: mediaFile
            ? `${Math.round(mediaFile.size / (1024 * 1024))}MB`
            : "Unknown",
          fileType: mediaFile ? mediaFile.type : "Unknown",
          timeout: `${timeout / 1000} seconds`,
        }
      );
    }

    // Use the upload instance only when there's a file
    const instance =
      postData instanceof FormData
        ? createUploadInstance(onUploadProgress, timeout)
        : axiosInstance;

    const result = await instance.post("/users/posts", postData);
    return result?.data?.data;
  } catch (error) {
    // Enhanced error logging only in development mode
    if (process.env.NODE_ENV === "development") {
      console.error("Post creation error:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        responseData: error.response?.data,
        isTimeout: error.code === "ECONNABORTED",
      });
    }

    // Rethrow with more context if needed
    if (error.code === "ECONNABORTED") {
      throw new Error(
        "Upload timed out. For videos, please use the direct upload option."
      );
    }
    throw error;
  }
};

// Create post with pre-uploaded media (direct upload)
export const createPostWithMedia = async (postData) => {
  try {
    // Log the request for debugging only in development mode
    if (process.env.NODE_ENV === "development") {
      console.log("Creating post with pre-uploaded media:", {
        content: postData.content ? "Present (not shown)" : "None",
        mediaUrl: postData.mediaUrl ? "Present (not shown)" : "None",
        mediaType: postData.mediaType,
        publicId: postData.cloudinary?.publicId || "None",
        format: postData.cloudinary?.format || "None",
      });
    }

    // For videos, ensure the mediaType is set correctly
    let mediaType = postData.mediaType;
    if (postData.mediaUrl && postData.mediaUrl.includes("/video/")) {
      mediaType = "video";
      // Set mediaType to video based on URL pattern
    }

    // Use the direct upload endpoint
    const result = await axiosInstance.post("/users/posts/direct", {
      content: postData.content,
      mediaUrl: postData.mediaUrl,
      mediaType: mediaType,
      cloudinary: postData.cloudinary,
    });

    // Log success only in development mode
    if (process.env.NODE_ENV === "development") {
      console.log("Post created successfully with direct upload");
    }
    return result?.data?.data;
  } catch (error) {
    // Detailed error logging only in development mode
    if (process.env.NODE_ENV === "development") {
      console.error("Direct upload post creation error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

// Create method for story
export const createStory = async (postData) => {
  try {
    const result = await axiosInstance.post("/users/story", postData);
    return result?.data?.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Get all post method
export const getAllPosts = async () => {
  try {
    const result = await axiosInstance.get("/users/posts");
    return result?.data?.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Get all story method
export const getAllStory = async () => {
  try {
    const result = await axiosInstance.get("/users/story");
    return result?.data?.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Method for like a post
export const likePost = async (postId) => {
  try {
    const result = await axiosInstance.post(`/users/posts/likes/${postId}`);
    return {
      data: result?.data?.data,
      message: result?.data?.message,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Method for comments a post
export const commentsPost = async (postId, comment) => {
  try {
    const result = await axiosInstance.post(
      `/users/posts/comments/${postId}`,
      comment
    );
    return result?.data?.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Method for share a post
export const sharePost = async (postId) => {
  try {
    const result = await axiosInstance.post(`/users/posts/share/${postId}`);
    return result?.data?.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Get all users posts
export const getAllUserPosts = async (userId) => {
  try {
    const result = await axiosInstance.get(`/users/posts/user/${userId}`);
    return result?.data?.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Delete a post
export const deletePost = async (postId) => {
  try {
    const result = await axiosInstance.delete(`/users/posts/${postId}`);
    return result?.data?.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Delete a story
export const deleteStory = async (storyId) => {
  try {
    const result = await axiosInstance.delete(`/users/story/${storyId}`);
    return result?.data?.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
