const cron = require("node-cron");
const Story = require("../model/Story");
const { deleteFromCloudinary } = require("./cloudinaryHelper");

/**
 * Delete stories that are older than 48 hours
 */
const deleteOldStories = async () => {
  try {
    console.log(
      "Running scheduled task: Checking for old stories to delete..."
    );

    // Find stories older than 48 hours using our static method
    const oldStories = await Story.findOlderThan(48);

    if (oldStories.length === 0) {
      console.log("No old stories found to delete");
      return;
    }

    console.log(`Found ${oldStories.length} old stories to delete`);

    // Delete each story and its associated media
    for (const story of oldStories) {
      try {
        // Delete media from Cloudinary if exists
        if (story.mediaUrl) {
          // Log the media information before deletion
          console.log("Attempting to delete old story media:", {
            storyId: story._id,
            mediaUrl: story.mediaUrl
              ? story.mediaUrl.substring(0, 50) + "..."
              : "None",
            mediaType: story.mediaType,
            createdAt: story.createdAt,
            age:
              Math.round(
                (new Date() - new Date(story.createdAt)) / (1000 * 60 * 60)
              ) + " hours",
          });

          // Delete media based on type
          if (story.mediaType === "video") {
            // For videos, use the enhanced video deletion approach
            const { deleteVideoByFilename } = require("./cloudinaryHelper");
            let result = await deleteFromCloudinary(story.mediaUrl, "video");

            // If that fails, try with the filename
            if (!result || result.result !== "ok") {
              // Extract the filename without extension
              const filename = story.mediaUrl.split("/").pop().split(".")[0];
              if (filename) {
                console.log(
                  `Trying direct filename for old story video: ${filename}`
                );
                result = await deleteVideoByFilename(filename);
              }
            }
          } else {
            // For images, use the standard approach
            const result = await deleteFromCloudinary(story.mediaUrl, "image");

            // If that fails, try with the filename
            if (!result || result.result !== "ok") {
              const { deleteImageByFilename } = require("./cloudinaryHelper");
              // Extract the filename without extension
              const filename = story.mediaUrl.split("/").pop().split(".")[0];
              if (filename) {
                console.log(
                  `Trying direct filename for old story image: ${filename}`
                );
                await deleteImageByFilename(filename);
              }
            }
          }
        }

        // Delete the story from the database
        await Story.findByIdAndDelete(story._id);
        console.log(`Successfully deleted old story: ${story._id}`);
      } catch (storyError) {
        console.error(`Error deleting old story ${story._id}:`, storyError);
        // Continue with next story even if this one fails
      }
    }

    console.log(
      `Completed old story cleanup. Deleted ${oldStories.length} stories.`
    );
  } catch (error) {
    console.error("Error in scheduled task to delete old stories:", error);
  }
};

/**
 * Initialize all scheduled tasks
 */
const initScheduledTasks = () => {
  // Schedule the task to run every hour
  // This ensures we don't miss any stories and spreads the load
  cron.schedule("0 * * * *", deleteOldStories);

  console.log(
    "Scheduled tasks initialized. Stories older than 48 hours will be automatically deleted."
  );

  // Run once at startup to clean any old stories immediately
  deleteOldStories();
};

module.exports = {
  initScheduledTasks,
  deleteOldStories, // Export for testing or manual execution
};
