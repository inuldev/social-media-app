const cloudinary = require("cloudinary").v2;

/**
 * Extract public_id from Cloudinary URL
 * Handles both direct upload URLs and regular upload URLs
 *
 * @param {string} url - The Cloudinary URL
 * @returns {string|null} - The extracted public ID or null if extraction fails
 */
const getPublicIdFromUrl = (url) => {
  try {
    if (!url) return null;

    // Log the URL for debugging
    console.log(`Extracting public ID from URL: ${url}`);

    // Check if this is a Cloudinary URL
    if (!url.includes("cloudinary.com")) {
      console.log("Not a Cloudinary URL, returning null");
      return null;
    }

    // Handle different URL formats
    const urlParts = url.split("/");

    // Extract version number if present (e.g., v1234567890)
    let versionIndex = -1;
    for (let i = 0; i < urlParts.length; i++) {
      if (urlParts[i].match(/^v\d+$/)) {
        versionIndex = i;
        break;
      }
    }

    // Check for standard upload URL format
    let startIndex = urlParts.indexOf("upload");

    // If not found, check for video upload format
    if (startIndex === -1) {
      startIndex = urlParts.indexOf("video");
      if (startIndex === -1) {
        startIndex = urlParts.indexOf("image");
        if (startIndex === -1) {
          startIndex = urlParts.indexOf("raw"); // For PDFs and other raw files
        }
      }
    }

    // If still not found, try to extract from the last parts of the URL
    if (startIndex === -1) {
      // Try to extract from the last part of the URL (for direct uploads)
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart.includes(".")) {
        const filename = lastPart.split(".")[0]; // Remove file extension
        console.log(`Extracted filename from URL: ${filename}`);
        return filename;
      }
      console.log("Could not find upload/video/image/raw in URL");
      return null;
    }

    // Extract the relevant parts after upload/video/image
    let relevantParts;

    // If we found a version number, use everything after that
    if (versionIndex !== -1 && versionIndex < urlParts.length - 1) {
      relevantParts = urlParts.slice(versionIndex + 1);
      console.log(`Using parts after version: ${relevantParts.join("/")}`);
    } else {
      // Otherwise use everything after upload/video/image
      relevantParts = urlParts.slice(startIndex + 1);

      // Special handling for video URLs
      if (urlParts.includes("video")) {
        // For video URLs, the folder name might be included
        if (relevantParts[0] === "upload") {
          relevantParts.shift(); // Remove "upload" from the path
        }

        // For direct upload videos, we need to handle version numbers
        if (relevantParts[0] && relevantParts[0].startsWith("v")) {
          // Check if it's a version number (e.g., v1234567890)
          if (/^v\d+$/.test(relevantParts[0])) {
            relevantParts.shift(); // Remove version number from the path
          }
        }
      }
    }

    // Join the parts and remove file extension
    const publicId = relevantParts.join("/").replace(/\.[^/.]+$/, "");
    console.log(`Extracted public ID: ${publicId}`);

    return publicId;
  } catch (error) {
    console.error("Error extracting public ID:", error, "URL:", url);
    return null;
  }
};

/**
 * Delete file from Cloudinary
 * Handles both images and videos
 *
 * @param {string} url - The Cloudinary URL of the file to delete
 * @param {string} resourceType - The resource type ("image" or "video")
 * @returns {Object|null} - The result of the deletion operation
 */
const deleteFromCloudinary = async (url, resourceType = "image") => {
  try {
    if (!url) return null;

    console.log("Deleting from Cloudinary, URL:", url.substring(0, 50) + "...");

    // Determine resource type from URL if not specified
    if (
      url.includes("/video/") ||
      url.endsWith(".mp4") ||
      url.endsWith(".mov")
    ) {
      resourceType = "video";
      console.log("Detected as video from URL pattern");
    } else if (url.includes("/raw/") || url.endsWith(".pdf")) {
      resourceType = "raw";
      console.log("Detected as raw/PDF from URL pattern");
    }

    // Extract public ID from URL
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) {
      console.error("Could not extract public ID from URL:", url);

      // Extract the filename without extension for fallback methods
      const filename = url.split("/").pop().split(".")[0];
      if (filename) {
        console.log(`Extracted filename for fallback: ${filename}`);

        // Try different approaches based on resource type
        if (resourceType === "video") {
          // For videos, use the specialized function
          console.log(`Trying specialized video deletion for: ${filename}`);
          const videoResult = await deleteVideoByFilename(filename);

          if (videoResult.result === "ok") {
            console.log(
              `Successfully deleted video using specialized method: ${filename}`
            );
            return videoResult;
          }
        } else if (resourceType === "image") {
          // For images, use the specialized function
          console.log(`Trying specialized image deletion for: ${filename}`);
          const imageResult = await deleteImageByFilename(filename);

          if (imageResult.result === "ok") {
            console.log(
              `Successfully deleted image using specialized method: ${filename}`
            );
            return imageResult;
          }
        }
      }

      return null;
    }

    console.log(
      `Attempting to delete ${resourceType} from Cloudinary with public ID: ${publicId}`
    );

    // Try with the extracted public ID
    let result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    // For images, try additional approaches if the first one fails
    if (result.result !== "ok" && resourceType === "image") {
      // Try with different folder paths
      console.log(
        `First attempt failed. Trying alternative approaches for image...`
      );

      // Try with images folder
      console.log(`Trying with images folder: images/${publicId}`);
      result = await cloudinary.uploader.destroy(`images/${publicId}`, {
        resource_type: resourceType,
      });

      // If that fails, try with upload folder
      if (result.result !== "ok") {
        console.log(`Trying with upload folder: upload/${publicId}`);
        result = await cloudinary.uploader.destroy(`upload/${publicId}`, {
          resource_type: resourceType,
        });
      }

      // If that fails, try with the filename only
      if (result.result !== "ok") {
        const filename = url.split("/").pop().split(".")[0];
        if (filename) {
          console.log(`Trying with filename only: ${filename}`);
          result = await cloudinary.uploader.destroy(filename, {
            resource_type: resourceType,
          });
        }
      }
    }

    if (result.result === "ok") {
      console.log(
        `Successfully deleted ${resourceType} from Cloudinary:`,
        publicId
      );
    } else {
      console.error(
        `Failed to delete ${resourceType} from Cloudinary:`,
        result
      );
    }

    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error.message);
    // Return a structured error object instead of throwing
    return { result: "error", error: error.message };
  }
};

/**
 * Delete file from Cloudinary by public ID
 * Useful when you already have the public ID
 *
 * @param {string} publicId - The public ID of the file to delete
 * @param {string} resourceType - The resource type ("image" or "video")
 * @returns {Object} - The result of the deletion operation
 */
const deleteByPublicId = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return { result: "error", error: "No public ID provided" };

    // Validate resource type
    if (!["image", "video", "raw"].includes(resourceType)) {
      console.warn(
        `Invalid resource type: ${resourceType}, defaulting to 'image'`
      );
      resourceType = "image";
    }

    // Try to determine resource type from publicId if it contains hints
    if (
      publicId.includes("video_") ||
      publicId.endsWith("mp4") ||
      publicId.endsWith("mov")
    ) {
      console.log(`Public ID suggests this is a video: ${publicId}`);
      resourceType = "video";
    } else if (publicId.includes("pdf_") || publicId.endsWith("pdf")) {
      console.log(`Public ID suggests this is a PDF: ${publicId}`);
      resourceType = "raw";
    }

    console.log(
      `Attempting to delete ${resourceType} with public ID: ${publicId}`
    );

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === "ok") {
      console.log(
        `Successfully deleted ${resourceType} from Cloudinary:`,
        publicId
      );
    } else {
      console.error(
        `Failed to delete ${resourceType} from Cloudinary:`,
        result
      );
    }

    return result;
  } catch (error) {
    console.error(
      "Error deleting from Cloudinary by public ID:",
      error.message
    );
    return { result: "error", error: error.message };
  }
};

/**
 * Delete video by filename (for direct uploads)
 * This is a specialized function for deleting videos that were directly uploaded
 *
 * @param {string} filename - The filename without extension
 * @returns {Object} - The result of the deletion operation
 */
const deleteVideoByFilename = async (filename) => {
  try {
    if (!filename) return { result: "error", error: "No filename provided" };

    console.log(`Attempting to delete video with filename: ${filename}`);

    // Try multiple approaches to delete the video
    let result;

    // First try with just the filename
    result = await cloudinary.uploader.destroy(filename, {
      resource_type: "video",
    });

    if (result.result !== "ok") {
      // If that fails, try with folder path
      result = await cloudinary.uploader.destroy(`videos/${filename}`, {
        resource_type: "video",
      });
    }

    if (result.result === "ok") {
      console.log(`Successfully deleted video: ${filename}`);
    } else {
      console.error(`Failed to delete video: ${filename}`, result);
    }

    return result;
  } catch (error) {
    console.error("Error deleting video by filename:", error.message);
    return { result: "error", error: error.message };
  }
};

/**
 * Delete image by filename (for direct uploads and profile/cover photos)
 * This is a specialized function for deleting images that were directly uploaded
 *
 * @param {string} filename - The filename without extension
 * @returns {Object} - The result of the deletion operation
 */
const deleteImageByFilename = async (filename) => {
  try {
    if (!filename) return { result: "error", error: "No filename provided" };

    console.log(`Attempting to delete image with filename: ${filename}`);

    // Try multiple approaches to delete the image
    let result;

    // First try with just the filename
    result = await cloudinary.uploader.destroy(filename, {
      resource_type: "image",
    });

    // If that fails, try with images folder
    if (result.result !== "ok") {
      result = await cloudinary.uploader.destroy(`images/${filename}`, {
        resource_type: "image",
      });
    }

    // If that fails, try with upload folder
    if (result.result !== "ok") {
      result = await cloudinary.uploader.destroy(`upload/${filename}`, {
        resource_type: "image",
      });
    }

    if (result.result === "ok") {
      console.log(`Successfully deleted image: ${filename}`);
    } else {
      console.error(`Failed to delete image: ${filename}`, result);
    }

    return result;
  } catch (error) {
    console.error("Error deleting image by filename:", error.message);
    return { result: "error", error: error.message };
  }
};

module.exports = {
  deleteFromCloudinary,
  getPublicIdFromUrl,
  deleteByPublicId,
  deleteVideoByFilename,
  deleteImageByFilename,
};
