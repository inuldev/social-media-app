const Post = require("../model/Post");
const Story = require("../model/Story");
const { response } = require("../utils/responseHandler");
const { uploadFileToCloudinary } = require("../config/cloudinary");
const { deleteFromCloudinary } = require("../utils/cloudinaryHelper");

const createPost = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return response(res, 401, "Unauthorized: User not authenticated");
    }

    const userId = req.user.userId;
    const { content, directMediaUrl, mediaType: directMediaType } = req.body;
    const file = req.file;
    let mediaUrl = null;
    let mediaType = null;

    // Check if we have a direct media URL (from frontend direct upload)
    if (directMediaUrl) {
      console.log("Using direct media URL for post creation:", {
        url: directMediaUrl.substring(0, 30) + "...",
        providedType: directMediaType,
      });

      // Set the media URL
      mediaUrl = directMediaUrl;

      // Determine media type with multiple checks
      // Force video type for Cloudinary video URLs
      const isVideo =
        directMediaUrl.includes("/video/") || // Cloudinary path includes /video/
        directMediaUrl.endsWith(".mp4") || // URL ends with .mp4
        directMediaType === "video" || // Explicitly set as video
        (directMediaUrl.includes("cloudinary") &&
          directMediaUrl.includes("video")); // Cloudinary video URL

      mediaType = isVideo ? "video" : "image";

      console.log(
        `Determined media type: ${mediaType} for direct upload URL: ${directMediaUrl.substring(
          0,
          30
        )}...`
      );
    }
    // Initialize cloudinaryData variable
    let cloudinaryData = {};

    // Otherwise, process the uploaded file
    if (file) {
      try {
        const uploadResult = await uploadFileToCloudinary(file);
        if (!uploadResult || !uploadResult.secure_url) {
          throw new Error("Failed to get upload URL from Cloudinary");
        }

        mediaUrl = uploadResult?.secure_url;

        // Determine media type based on mimetype
        if (file.mimetype.startsWith("video")) {
          mediaType = "video";
        } else if (file.mimetype === "application/pdf") {
          mediaType = "pdf";
        } else if (file.mimetype.startsWith("image")) {
          mediaType = "image";
        } else {
          mediaType = "document";
        }

        // Store Cloudinary metadata for easier cleanup later
        if (uploadResult.public_id) {
          cloudinaryData = {
            publicId: uploadResult.public_id,
            assetId: uploadResult.asset_id,
            version: uploadResult.version?.toString(),
          };
          console.log(
            `Stored Cloudinary metadata for uploaded file: ${uploadResult.public_id}`
          );
        }
      } catch (uploadError) {
        return response(res, 400, `File upload failed: ${uploadError.message}`);
      }
    }
    // Extract Cloudinary public ID from direct upload if available
    else if (directMediaUrl && directMediaUrl.includes("cloudinary")) {
      // If we have direct media URL, try to extract the public ID
      const { getPublicIdFromUrl } = require("../utils/cloudinaryHelper");
      const publicId = getPublicIdFromUrl(directMediaUrl);

      if (publicId) {
        cloudinaryData = {
          publicId,
          // We don't have asset ID and version from direct URL, but at least we have the public ID
        };
        console.log(
          `Extracted Cloudinary public ID for direct upload: ${publicId}`
        );
      }
    }

    // Log the post data before saving
    console.log("Creating new post with data:", {
      userId,
      content: content ? "Present (not shown)" : "None",
      mediaUrl: mediaUrl ? mediaUrl.substring(0, 30) + "..." : "None",
      mediaType,
      hasCloudinaryData: Object.keys(cloudinaryData).length > 0,
    });

    const newPost = new Post({
      user: userId,
      content,
      mediaUrl,
      mediaType,
      cloudinary: cloudinaryData, // Store Cloudinary metadata
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
    });

    // Log the post object
    console.log("Post object created:", {
      id: newPost._id,
      hasMediaUrl: !!newPost.mediaUrl,
      mediaType: newPost.mediaType,
      hasCloudinaryData: !!newPost.cloudinary?.publicId,
    });

    const savedPost = await newPost.save();
    return response(res, 201, "Post created successfully", savedPost);
  } catch (error) {
    console.error("Post creation error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    return response(res, 500, `Failed to create post: ${error.message}`);
  }
};

//create story
const createStory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const file = req.file;

    if (!file) {
      return response(res, 400, "file is required to create a story");
    }
    let mediaUrl = null;
    let mediaType = null;

    if (file) {
      try {
        // Add originalUrl property to file object to identify it as a story upload
        // This helps the uploadFileToCloudinary function apply the correct size limit
        file.originalUrl = req.originalUrl;

        const uploadResult = await uploadFileToCloudinary(file);
        mediaUrl = uploadResult?.secure_url;
        mediaType = file.mimetype.startsWith("video") ? "video" : "image";
      } catch (uploadError) {
        return response(res, 400, "File upload failed. " + uploadError.message);
      }
    }

    //create a new story
    const newStory = await new Story({
      user: userId,
      mediaUrl,
      mediaType,
    });

    await newStory.save();
    return response(res, 201, "Story created successfully", newStory);
  } catch (error) {
    console.log("error creating story", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

//getAllStory
const getAllStory = async (req, res) => {
  try {
    const story = await Story.find()
      .sort({ createdAt: -1 })
      .populate("user", "_id username profilePicture email");

    return response(res, 201, "Get all story successfully", story);
  } catch (error) {
    console.log("error getting story", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

//get all posts
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "_id username profilePicture email")
      .populate({
        path: "comments.user",
        select: "username profilePicture",
      });
    return response(res, 201, "Get all posts successfully", posts);
  } catch (error) {
    console.log("error getting posts", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

//get post by userId
const getPostByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return response(res, 400, "UserId is require to get user post");
    }

    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "_id username profilePicture email")
      .populate({
        path: "comments.user",
        select: "username, profilePicture",
      });
    return response(res, 201, "Get user post successfully", posts);
  } catch (error) {
    console.log("error getting posts", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

//like post api
const likePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.userId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return response(res, 404, "Post not found");
    }

    const hasLiked = post.likes.includes(userId);
    if (hasLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      post.likeCount = Math.max(0, post.likeCount - 1);

      const updatedPost = await post.save();
      return response(res, 200, "Post unliked successfully", {
        post: updatedPost,
        message: "unliked",
      });
    } else {
      post.likes.push(userId);
      post.likeCount += 1;

      const updatedPost = await post.save();
      return response(res, 200, "Post liked successfully", {
        post: updatedPost,
        message: "liked",
      });
    }
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error", error.message);
  }
};

//post comments by user
const addCommentToPost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.userId;
  const { text } = req.body;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return response(res, 404, "Post not found");
    }

    post.comments.push({ user: userId, text });
    post.commentCount += 1;

    await post.save();
    return response(res, 201, "Comments added successfully", post);
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error", error.message);
  }
};

//share on post by user
const sharePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.userId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return response(res, 404, "Post not found");
    }
    const hasUserShared = post.share.includes(userId);
    if (!hasUserShared) {
      post.share.push(userId);
    }

    post.shareCount += 1;

    await post.save();
    return response(res, 201, "Post share successfully", post);
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error", error.message);
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(postId);

    if (post.user.toString() !== userId) {
      return response(
        res,
        403,
        "Unauthorized: You can only delete your own posts"
      );
    }

    // Delete media from Cloudinary if exists
    if (post.mediaUrl) {
      try {
        let cloudinaryResult;

        // Determine the resource type based on mediaType
        let resourceType = "image";
        if (post.mediaType === "video") {
          resourceType = "video";
        } else if (post.mediaType === "pdf" || post.mediaType === "document") {
          resourceType = "raw";
        }

        // Log the media information before deletion
        console.log("Attempting to delete media from post:", {
          postId: post._id,
          mediaUrl: post.mediaUrl
            ? post.mediaUrl.substring(0, 50) + "..."
            : "None",
          mediaType: post.mediaType,
          hasCloudinaryData: !!(post.cloudinary && post.cloudinary.publicId),
        });

        // For videos, always try both methods to ensure deletion
        if (resourceType === "video") {
          // First try with stored metadata if available
          if (post.cloudinary && post.cloudinary.publicId) {
            const { deleteByPublicId } = require("../utils/cloudinaryHelper");
            cloudinaryResult = await deleteByPublicId(
              post.cloudinary.publicId,
              resourceType
            );
            console.log(
              `Attempted video deletion using stored public ID: ${post.cloudinary.publicId}`
            );
          }

          // Then also try with URL extraction as a backup
          const { deleteFromCloudinary } = require("../utils/cloudinaryHelper");
          const urlResult = await deleteFromCloudinary(
            post.mediaUrl,
            resourceType
          );
          console.log(
            `Attempted video deletion using URL extraction: ${post.mediaUrl}`
          );

          // Use the successful result if any
          cloudinaryResult =
            cloudinaryResult && cloudinaryResult.result === "ok"
              ? cloudinaryResult
              : urlResult;
        } else {
          // For non-video content, use the standard approach
          // If we have stored Cloudinary metadata, use it for more reliable deletion
          if (post.cloudinary && post.cloudinary.publicId) {
            const { deleteByPublicId } = require("../utils/cloudinaryHelper");
            cloudinaryResult = await deleteByPublicId(
              post.cloudinary.publicId,
              resourceType
            );
            console.log(
              `Deleted media using stored public ID: ${post.cloudinary.publicId} (${resourceType})`
            );
          } else {
            // Fall back to extracting public ID from URL
            const {
              deleteFromCloudinary,
            } = require("../utils/cloudinaryHelper");
            cloudinaryResult = await deleteFromCloudinary(
              post.mediaUrl,
              resourceType
            );
            console.log(
              `Deleted media using URL extraction: ${post.mediaUrl} (${resourceType})`
            );
          }
        }

        if (!cloudinaryResult || cloudinaryResult.result !== "ok") {
          console.error(
            "Failed to delete media from Cloudinary:",
            cloudinaryResult
          );
        }
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
        // Continue with post deletion even if Cloudinary deletion fails
      }
    }

    await Post.findByIdAndDelete(postId);
    return response(res, 200, "Post deleted successfully");
  } catch (error) {
    console.error("Error deleting post:", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.userId;

    const story = await Story.findById(storyId);

    if (!story) {
      return response(res, 404, "Story not found");
    }

    // Check if the user is the owner of the story
    if (story.user.toString() !== userId) {
      return response(
        res,
        403,
        "Unauthorized: You can only delete your own stories"
      );
    }

    // Delete media from Cloudinary if exists
    if (story.mediaUrl) {
      try {
        // Log the media information before deletion
        console.log("Attempting to delete story media from controller:", {
          storyId: story._id,
          mediaUrl: story.mediaUrl
            ? story.mediaUrl.substring(0, 50) + "..."
            : "None",
          mediaType: story.mediaType,
        });

        // For videos, use the enhanced video deletion approach
        if (story.mediaType === "video") {
          // First try with URL extraction
          const {
            deleteFromCloudinary,
            deleteVideoByFilename,
          } = require("../utils/cloudinaryHelper");
          let cloudinaryResult = await deleteFromCloudinary(
            story.mediaUrl,
            "video"
          );

          // If that fails, try with the filename
          if (!cloudinaryResult || cloudinaryResult.result !== "ok") {
            // Extract the filename without extension
            const filename = story.mediaUrl.split("/").pop().split(".")[0];
            if (filename) {
              console.log(
                `Trying direct filename for story video: ${filename}`
              );
              cloudinaryResult = await deleteVideoByFilename(filename);
            }
          }

          if (!cloudinaryResult || cloudinaryResult.result !== "ok") {
            console.error(
              "Failed to delete video from Cloudinary:",
              cloudinaryResult
            );
          }
        } else {
          // For images, use the standard approach
          const cloudinaryResult = await deleteFromCloudinary(
            story.mediaUrl,
            "image"
          );

          if (!cloudinaryResult || cloudinaryResult.result !== "ok") {
            console.error(
              "Failed to delete image from Cloudinary:",
              cloudinaryResult
            );
          }
        }
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
        // Continue with story deletion even if Cloudinary deletion fails
      }
    }

    await Story.findByIdAndDelete(storyId);
    return response(res, 200, "Story deleted successfully");
  } catch (error) {
    console.error("Error deleting story:", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostByUserId,
  likePost,
  addCommentToPost,
  sharePost,
  createStory,
  getAllStory,
  deletePost,
  deleteStory,
};
