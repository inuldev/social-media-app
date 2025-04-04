const User = require("../model/User");
const Bio = require("../model/UserBio");
const { response } = require("../utils/responseHandler");
const { uploadFileToCloudinary } = require("../config/cloudinary");
const { deleteFromCloudinary } = require("../utils/cloudinaryHelper");

const createOrUpdateUserBio = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      bioText,
      liveIn,
      relationship,
      workplace,
      education,
      phone,
      hometown,
    } = req.body;

    if (!userId) {
      return response(res, 400, "User ID is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      return response(res, 404, "User not found");
    }

    let bio = await Bio.findOneAndUpdate(
      { user: user._id },
      {
        bioText,
        liveIn,
        relationship,
        workplace,
        education,
        phone,
        hometown,
      },
      { new: true, runValidators: true }
    );

    if (!bio) {
      bio = new Bio({
        user: user._id,
        bioText,
        liveIn,
        relationship,
        workplace,
        education,
        phone,
        hometown,
      });

      await bio.save();
      await User.findByIdAndUpdate(user._id, { bio: bio._id });
    }

    return response(res, 200, "Bio created or updated successfully", bio);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error", error.message);
  }
};

const updateCoverPhoto = async (req, res) => {
  try {
    const { userId } = req.params;
    const file = req.file;

    if (!userId) {
      return response(res, 400, "User ID is required");
    }

    if (!file) {
      return response(res, 400, "Cover photo file is required");
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return response(res, 404, "User not found");
    }

    // Upload new cover photo
    const uploadResult = await uploadFileToCloudinary(file);
    if (!uploadResult || !uploadResult.secure_url) {
      return response(res, 400, "Failed to upload cover photo");
    }

    const coverPhoto = uploadResult.secure_url;

    // Delete old cover photo if exists
    if (currentUser.coverPhoto) {
      try {
        console.log("Attempting to delete old cover photo:", {
          userId: userId,
          coverPhoto: currentUser.coverPhoto
            ? currentUser.coverPhoto.substring(0, 50) + "..."
            : "None",
        });

        // Import both functions for better reliability
        const { deleteImageByFilename } = require("../utils/cloudinaryHelper");

        // First try with the standard approach
        let result = await deleteFromCloudinary(
          currentUser.coverPhoto,
          "image"
        );

        // If that fails, try with the filename
        if (!result || result.result !== "ok") {
          // Extract the filename without extension
          const filename = currentUser.coverPhoto
            .split("/")
            .pop()
            .split(".")[0];
          if (filename) {
            console.log(`Trying direct filename for cover photo: ${filename}`);
            result = await deleteImageByFilename(filename);
          }
        }

        if (!result || result.result !== "ok") {
          console.error("Failed to delete cover photo from Cloudinary");
        }
      } catch (cloudinaryError) {
        console.error("Error deleting old cover photo:", cloudinaryError);
        // Continue with update even if delete fails
      }
    }

    // Update user profile with new cover photo
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { coverPhoto },
      { new: true }
    );

    return response(res, 200, "Cover photo updated successfully", updatedUser);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error", error.message);
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, gender, dateOfBirth } = req.body;
    const file = req.file;

    // Add validation for userId
    if (!userId) {
      return response(res, 400, "User ID is required");
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return response(res, 404, "User not found");
    }

    let profilePicture = currentUser.profilePicture;

    if (file) {
      // Upload new profile picture
      const uploadResult = await uploadFileToCloudinary(file);
      if (!uploadResult || !uploadResult.secure_url) {
        return response(res, 400, "Failed to upload profile picture");
      }

      profilePicture = uploadResult.secure_url;

      // Delete old profile picture if exists
      if (currentUser.profilePicture) {
        try {
          console.log("Attempting to delete old profile picture:", {
            userId: userId,
            profilePicture: currentUser.profilePicture
              ? currentUser.profilePicture.substring(0, 50) + "..."
              : "None",
          });

          // Import both functions for better reliability
          const {
            deleteImageByFilename,
          } = require("../utils/cloudinaryHelper");

          // First try with the standard approach
          let result = await deleteFromCloudinary(
            currentUser.profilePicture,
            "image"
          );

          // If that fails, try with the filename
          if (!result || result.result !== "ok") {
            // Extract the filename without extension
            const filename = currentUser.profilePicture
              .split("/")
              .pop()
              .split(".")[0];
            if (filename) {
              console.log(
                `Trying direct filename for profile picture: ${filename}`
              );
              result = await deleteImageByFilename(filename);
            }
          }

          if (!result || result.result !== "ok") {
            console.error("Failed to delete profile picture from Cloudinary");
          }
        } catch (cloudinaryError) {
          console.error("Error deleting old profile picture:", cloudinaryError);
          // Continue with update even if delete fails
        }
      }
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(username && { username }),
        ...(gender && { gender }),
        ...(dateOfBirth && { dateOfBirth }),
        ...(profilePicture && { profilePicture }),
      },
      { new: true }
    );

    if (!updatedUser) {
      return response(res, 404, "User not found with this id");
    }

    return response(res, 200, "Profile updated successfully", updatedUser);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error", error.message);
  }
};

module.exports = {
  createOrUpdateUserBio,
  updateCoverPhoto,
  updateUserProfile,
};
