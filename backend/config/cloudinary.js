const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Set environment variables and determine production mode
const IS_PRODUCTION = process.env.NODE_ENV === "production"; // Check if we're in production mode

// Set limits for all environments
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB for videos
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB for images
const MAX_STORY_SIZE = 4 * 1024 * 1024; // 4 MB for all story media (both images and videos)

console.log(
  `File upload limits: Videos=${MAX_VIDEO_SIZE / 1024 / 1024}MB, Images=${
    MAX_IMAGE_SIZE / 1024 / 1024
  }MB, Stories=${MAX_STORY_SIZE / 1024 / 1024}MB`
);

// Configure cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// We'll use memory storage for all environments to simplify the code and improve performance

// Common file type validation function
const validateFileType = (file, cb) => {
  // File type validation based on file type
  const allowedMimes = [
    // Video types
    "video/mp4",
    "video/quicktime",
    "video/webm",

    // Image types
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",

    // Document types
    "application/pdf",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(`Invalid file type. Allowed types: ${allowedMimes.join(", ")}`)
    );
  }
};

// Create a simplified multer middleware with memory storage for all environments
const multerMiddleware = multer({
  storage: multer.memoryStorage(), // Always use memory storage for consistency
  limits: {
    fileSize: MAX_VIDEO_SIZE, // 100MB limit for videos (also used for images up to 10MB)
  },
  fileFilter: (req, file, cb) => validateFileType(file, cb),
}).single("media");

// Create a specific middleware for story uploads with a 4MB limit
const storyMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_STORY_SIZE, // 4MB limit for stories
  },
  fileFilter: (req, file, cb) => validateFileType(file, cb),
}).single("media");

// Generic middleware creator function to handle different file size limits
const createUploadMiddleware = (middleware, sizeLimit) => {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err) {
        console.error("Upload middleware error:", err);

        // Handle specific error types
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            status: "error",
            message: `File size exceeds the maximum limit of ${
              sizeLimit / (1024 * 1024)
            }MB`,
          });
        }

        return res.status(400).json({
          status: "error",
          message: err.message,
        });
      }
      next();
    });
  };
};

// Standard upload middleware for regular posts
const uploadMiddleware = createUploadMiddleware(
  multerMiddleware,
  MAX_VIDEO_SIZE
);

// Story upload middleware with 4MB limit
const storyUploadMiddleware = createUploadMiddleware(
  storyMiddleware,
  MAX_STORY_SIZE
);

const uploadFileToCloudinary = async (file) => {
  try {
    // Log file details for debugging
    console.log("Uploading file to Cloudinary:", {
      size: file.size,
      mimetype: file.mimetype,
      originalname: file.originalname,
      environment: IS_PRODUCTION ? "production" : "development",
    });

    // Determine file type and size limits based on file type and request path
    const isVideo = file.mimetype.startsWith("video");
    const isPDF = file.mimetype === "application/pdf";

    // Check if this is a story upload by examining the originalUrl (if available)
    const isStoryUpload =
      file.originalUrl && file.originalUrl.includes("/story");

    // Set appropriate size limit based on file type and whether it's a story
    let maxSize;
    if (isStoryUpload) {
      maxSize = MAX_STORY_SIZE; // 4MB limit for all story media
    } else {
      maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE; // Regular limits for posts
    }

    if (file.size > maxSize) {
      throw new Error(
        `File size exceeds the maximum limit of ${Math.round(
          maxSize / (1024 * 1024)
        )}MB`
      );
    }

    // Determine resource type and folder based on file type
    let resourceType = "image";
    let folder = "images";

    if (isVideo) {
      resourceType = "video";
      folder = "videos";
    } else if (isPDF) {
      resourceType = "raw"; // PDFs are uploaded as raw files in Cloudinary
      folder = "documents";
    }

    // Simplified upload options based on file type
    const options = {
      resource_type: resourceType,
      folder: folder,
    };

    let result;

    // Use the same approach for all environments to simplify code
    if (file.buffer) {
      // If we have a buffer (memory storage), use upload_stream
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          options,
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(file.buffer);
      });
    } else if (file.path) {
      // If we have a path (disk storage), use direct upload
      result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(file.path, options, (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        });
      });

      // Clean up local file if it exists
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } else {
      throw new Error("No file data available for upload");
    }

    console.log("Cloudinary upload successful:", {
      url: result.secure_url,
      size: result.bytes,
      format: result.format,
      publicId: result.public_id,
      assetId: result.asset_id,
      version: result.version,
    });

    // Return the result with all metadata
    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", {
      message: error.message,
      stack: error.stack,
      details: error.details,
    });

    // Clean up local file in development if upload failed
    if (!IS_PRODUCTION && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    throw error;
  }
};

module.exports = {
  uploadMiddleware,
  storyUploadMiddleware,
  uploadFileToCloudinary,
  MAX_VIDEO_SIZE,
  MAX_IMAGE_SIZE,
  MAX_STORY_SIZE,
};
