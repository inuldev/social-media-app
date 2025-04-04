const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ["image", "video"] },
  },
  { timestamps: true }
);

// Static method to find stories older than the specified hours
storySchema.statics.findOlderThan = function (hours) {
  const date = new Date();
  date.setHours(date.getHours() - hours);

  return this.find({
    createdAt: { $lt: date },
  });
};

// Add pre-remove middleware
storySchema.pre("remove", async function (next) {
  try {
    if (this.mediaUrl) {
      // Log the media information before deletion
      console.log("Attempting to delete story media:", {
        mediaUrl: this.mediaUrl
          ? this.mediaUrl.substring(0, 50) + "..."
          : "None",
        mediaType: this.mediaType,
      });
      // For videos, use the enhanced video deletion approach
      if (this.mediaType === "video") {
        // First try with URL extraction
        const {
          deleteFromCloudinary,
          deleteVideoByFilename,
        } = require("../utils/cloudinaryHelper");
        let result = await deleteFromCloudinary(this.mediaUrl, "video");

        // If that fails, try with the filename
        if (!result || result.result !== "ok") {
          // Extract the filename without extension
          const filename = this.mediaUrl.split("/").pop().split(".")[0];
          if (filename) {
            console.log(`Trying direct filename for story video: ${filename}`);
            result = await deleteVideoByFilename(filename);
          }
        }

        if (!result || result.result !== "ok") {
          console.error(
            "Failed to delete video from Cloudinary in story pre-remove hook"
          );
        }
      } else {
        // For images, use both approaches for better reliability
        const {
          deleteFromCloudinary,
          deleteImageByFilename,
        } = require("../utils/cloudinaryHelper");

        // First try with the standard approach
        let result = await deleteFromCloudinary(this.mediaUrl, "image");

        // If that fails, try with the filename
        if (!result || result.result !== "ok") {
          // Extract the filename without extension
          const filename = this.mediaUrl.split("/").pop().split(".")[0];
          if (filename) {
            console.log(`Trying direct filename for story image: ${filename}`);
            result = await deleteImageByFilename(filename);
          }
        }

        if (!result || result.result !== "ok") {
          console.error(
            "Failed to delete image from Cloudinary in story pre-remove hook"
          );
        }
      }
    }
    next();
  } catch (error) {
    console.error("Error in story pre-remove hook:", error);
    next(error);
  }
});

const Story = mongoose.model("Story", storySchema);
module.exports = Story;
