const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  uploadMiddleware,
  storyUploadMiddleware,
} = require("../config/cloudinary");
const { deleteOldStories } = require("../utils/scheduledTasks");
const {
  createPost,
  getAllPosts,
  getPostByUserId,
  likePost,
  sharePost,
  addCommentToPost,
  getAllStory,
  createStory,
  deletePost,
  deleteStory,
} = require("../controllers/postController");

//create post
router.post("/posts", authMiddleware, uploadMiddleware, createPost);

// Create post with direct upload (pre-uploaded media)
router.post("/posts/direct", authMiddleware, async (req, res) => {
  try {
    // Log the request for debugging
    console.log("Direct upload post request received:", {
      hasUser: !!req.user,
      hasUserId: req.user?.userId ? true : false,
      hasContent: !!req.body.content,
      hasMediaUrl: !!req.body.mediaUrl,
      mediaType: req.body.mediaType || "none",
    });

    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized: User not authenticated",
      });
    }

    const userId = req.user.userId;
    const { content, mediaUrl, mediaType } = req.body;

    if (!content && !mediaUrl) {
      return res.status(400).json({
        status: "error",
        message: "Post must contain content or media",
      });
    }

    // Extract Cloudinary public ID from direct upload if available
    let cloudinaryData = {};
    if (mediaUrl && mediaUrl.includes("cloudinary")) {
      // If we have direct media URL, try to extract the public ID
      const { getPublicIdFromUrl } = require("../utils/cloudinaryHelper");
      const publicId = getPublicIdFromUrl(mediaUrl);

      if (publicId) {
        cloudinaryData = {
          publicId,
          // We don't have asset ID and version from direct URL, but at least we have the public ID
        };
        console.log(
          `Extracted Cloudinary public ID for direct upload: ${publicId}`
        );
      }

      // Determine media type based on URL if not provided
      if (!mediaType) {
        if (mediaUrl.includes("/video/")) {
          mediaType = "video";
        } else if (mediaUrl.includes("/raw/") || mediaUrl.endsWith(".pdf")) {
          mediaType = "pdf";
        } else {
          mediaType = "image";
        }
        console.log(`Determined media type from URL: ${mediaType}`);
      }
    }

    // Create new post with the provided media URL
    const Post = require("../model/Post");
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

    const savedPost = await newPost.save();

    // Log success
    console.log(
      "Post created successfully with direct upload, ID:",
      savedPost._id
    );

    return res.status(201).json({
      status: "success",
      message: "Post created successfully",
      data: savedPost,
    });
  } catch (error) {
    // Detailed error logging
    console.error("Direct upload post creation error:", {
      name: error.name,
      message: error.message,
      code: error.code,
    });

    return res.status(500).json({
      status: "error",
      message: `Failed to create post: ${error.message}`,
    });
  }
});

//get all posts
router.get("/posts", authMiddleware, getAllPosts);

//get post by userid
router.get("/posts/user/:userId", authMiddleware, getPostByUserId);

//user like post route
router.post("/posts/likes/:postId", authMiddleware, likePost);

//user share post route
router.post("/posts/share/:postId", authMiddleware, sharePost);

//user comments post route
router.post("/posts/comments/:postId", authMiddleware, addCommentToPost);

//create story
router.post("/story", authMiddleware, storyUploadMiddleware, createStory);

//get all story
router.get("/story", authMiddleware, getAllStory);

//delete post
router.delete("/posts/:postId", authMiddleware, deletePost);

//delete story
router.delete("/story/:storyId", authMiddleware, deleteStory);

// Admin route to manually clean up old stories (for testing purposes)
router.post("/admin/cleanup-old-stories", authMiddleware, async (req, res) => {
  try {
    // Check if user is admin (you can implement proper admin check)
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // Run the cleanup task
    await deleteOldStories();

    return res.status(200).json({
      status: "success",
      message: "Old stories cleanup initiated",
    });
  } catch (error) {
    console.error("Error in manual cleanup:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to clean up old stories",
      error: error.message,
    });
  }
});

module.exports = router;
