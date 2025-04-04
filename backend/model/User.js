const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null },
    gender: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    profilePicture: { type: String, default: null },
    coverPhoto: { type: String, default: null },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    bio: { type: mongoose.Schema.Types.ObjectId, ref: "Bio" },
  },
  { timestamps: true }
);

// Add pre-remove middleware for cleanup
userSchema.pre("remove", async function (next) {
  try {
    // Clean up profile picture
    if (this.profilePicture) {
      console.log("Attempting to delete profile picture:", {
        userId: this._id,
        profilePicture: this.profilePicture
          ? this.profilePicture.substring(0, 50) + "..."
          : "None",
      });

      const {
        deleteFromCloudinary,
        deleteImageByFilename,
      } = require("../utils/cloudinaryHelper");

      // First try with the standard approach
      let profileResult = await deleteFromCloudinary(
        this.profilePicture,
        "image"
      );

      // If that fails, try with the filename
      if (!profileResult || profileResult.result !== "ok") {
        // Extract the filename without extension
        const filename = this.profilePicture.split("/").pop().split(".")[0];
        if (filename) {
          console.log(
            `Trying direct filename for profile picture: ${filename}`
          );
          profileResult = await deleteImageByFilename(filename);
        }
      }

      if (!profileResult || profileResult.result !== "ok") {
        console.error("Failed to delete profile picture from Cloudinary");
      }
    }

    // Clean up cover photo
    if (this.coverPhoto) {
      console.log("Attempting to delete cover photo:", {
        userId: this._id,
        coverPhoto: this.coverPhoto
          ? this.coverPhoto.substring(0, 50) + "..."
          : "None",
      });

      const {
        deleteFromCloudinary,
        deleteImageByFilename,
      } = require("../utils/cloudinaryHelper");

      // First try with the standard approach
      let coverResult = await deleteFromCloudinary(this.coverPhoto, "image");

      // If that fails, try with the filename
      if (!coverResult || coverResult.result !== "ok") {
        // Extract the filename without extension
        const filename = this.coverPhoto.split("/").pop().split(".")[0];
        if (filename) {
          console.log(`Trying direct filename for cover photo: ${filename}`);
          coverResult = await deleteImageByFilename(filename);
        }
      }

      if (!coverResult || coverResult.result !== "ok") {
        console.error("Failed to delete cover photo from Cloudinary");
      }
    }
    next();
  } catch (error) {
    console.error("Error in user pre-remove hook:", error);
    next(error);
  }
});

const User = mongoose.model("User", userSchema);
module.exports = User;
