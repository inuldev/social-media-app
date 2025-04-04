const mongoose = require("mongoose");
const { deleteFromCloudinary } = require("../utils/cloudinaryHelper");

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ["image", "video", "pdf", "document"] },
    // Store Cloudinary metadata for easier cleanup
    cloudinary: {
      publicId: { type: String },
      assetId: { type: String },
      version: { type: String },
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now() },
      },
    ],
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    share: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shareCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Add pre-remove middleware
postSchema.pre("remove", async function (next) {
  try {
    // Check if we have media to delete
    if (this.mediaUrl) {
      let result;

      // Determine the resource type based on mediaType
      let resourceType = "image";
      if (this.mediaType === "video") {
        resourceType = "video";
      } else if (this.mediaType === "pdf" || this.mediaType === "document") {
        resourceType = "raw";
      }

      // Log the media information before deletion
      console.log("Attempting to delete media:", {
        mediaUrl: this.mediaUrl
          ? this.mediaUrl.substring(0, 50) + "..."
          : "None",
        mediaType: this.mediaType,
        hasCloudinaryData: !!(this.cloudinary && this.cloudinary.publicId),
      });

      // For videos, always try both methods to ensure deletion
      if (resourceType === "video") {
        // First try with stored metadata if available
        if (this.cloudinary && this.cloudinary.publicId) {
          const { deleteByPublicId } = require("../utils/cloudinaryHelper");
          result = await deleteByPublicId(
            this.cloudinary.publicId,
            resourceType
          );
          console.log(
            `Attempted video deletion using stored public ID: ${this.cloudinary.publicId}`
          );
        }

        // Then also try with URL extraction as a backup
        const { deleteFromCloudinary } = require("../utils/cloudinaryHelper");
        const urlResult = await deleteFromCloudinary(
          this.mediaUrl,
          resourceType
        );
        console.log(
          `Attempted video deletion using URL extraction: ${this.mediaUrl}`
        );

        // Use the successful result if any
        result = result && result.result === "ok" ? result : urlResult;
      } else {
        // For non-video content, use the standard approach
        // If we have stored Cloudinary metadata, use it for more reliable deletion
        if (this.cloudinary && this.cloudinary.publicId) {
          const { deleteByPublicId } = require("../utils/cloudinaryHelper");
          result = await deleteByPublicId(
            this.cloudinary.publicId,
            resourceType
          );
          console.log(
            `Deleted media using stored public ID: ${this.cloudinary.publicId} (${resourceType})`
          );
        } else {
          // Fall back to extracting public ID from URL
          const { deleteFromCloudinary } = require("../utils/cloudinaryHelper");
          result = await deleteFromCloudinary(this.mediaUrl, resourceType);
          console.log(
            `Deleted media using URL extraction: ${this.mediaUrl} (${resourceType})`
          );
        }
      }

      if (!result || result.result !== "ok") {
        console.error(
          "Failed to delete media from Cloudinary in pre-remove hook",
          result
        );
      }
    }
    next();
  } catch (error) {
    console.error("Error in post pre-remove hook:", error);
    next(error);
  }
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
