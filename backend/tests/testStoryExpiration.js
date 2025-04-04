require('dotenv').config();
const mongoose = require('mongoose');
const { deleteOldStories } = require('../utils/scheduledTasks');
const Story = require('../model/Story');

// Connect to the database
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to database for testing');
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error.message);
    return false;
  }
};

// Create a test story with a backdated timestamp
const createBackdatedStory = async (hoursAgo) => {
  try {
    // Create a date in the past
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - hoursAgo);
    
    // Create a new story
    const story = new Story({
      user: new mongoose.Types.ObjectId(), // Dummy user ID
      mediaUrl: 'https://res.cloudinary.com/dzeea89j1/image/upload/v1/test/test_story.jpg',
      mediaType: 'image',
    });
    
    // Save the story
    await story.save();
    
    // Manually update the createdAt timestamp to be in the past
    await Story.findByIdAndUpdate(story._id, {
      $set: { createdAt: pastDate }
    });
    
    console.log(`Created test story backdated by ${hoursAgo} hours`);
    return story._id;
  } catch (error) {
    console.error('Error creating backdated story:', error);
    return null;
  }
};

// Run the test
const runTest = async () => {
  // Connect to the database
  const connected = await connectDb();
  if (!connected) {
    console.error('Failed to connect to database. Exiting test.');
    process.exit(1);
  }
  
  try {
    // Create test stories
    console.log('Creating test stories...');
    const recentStoryId = await createBackdatedStory(24); // 24 hours ago (should not be deleted)
    const oldStoryId = await createBackdatedStory(49);    // 49 hours ago (should be deleted)
    
    // Verify stories were created
    const storiesBeforeCleanup = await Story.find({
      _id: { $in: [recentStoryId, oldStoryId].filter(Boolean) }
    });
    
    console.log(`Found ${storiesBeforeCleanup.length} stories before cleanup`);
    storiesBeforeCleanup.forEach(story => {
      const ageInHours = Math.round((new Date() - new Date(story.createdAt)) / (1000 * 60 * 60));
      console.log(`Story ${story._id}: Created ${ageInHours} hours ago`);
    });
    
    // Run the cleanup
    console.log('\nRunning story cleanup...');
    await deleteOldStories();
    
    // Check which stories remain
    const storiesAfterCleanup = await Story.find({
      _id: { $in: [recentStoryId, oldStoryId].filter(Boolean) }
    });
    
    console.log(`\nFound ${storiesAfterCleanup.length} stories after cleanup`);
    storiesAfterCleanup.forEach(story => {
      const ageInHours = Math.round((new Date() - new Date(story.createdAt)) / (1000 * 60 * 60));
      console.log(`Story ${story._id}: Created ${ageInHours} hours ago`);
    });
    
    // Verify results
    const oldStoryRemoved = !storiesAfterCleanup.some(s => s._id.toString() === oldStoryId?.toString());
    const recentStoryKept = storiesAfterCleanup.some(s => s._id.toString() === recentStoryId?.toString());
    
    console.log('\nTest Results:');
    console.log(`Old story (49 hours) removed: ${oldStoryRemoved ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log(`Recent story (24 hours) kept: ${recentStoryKept ? 'PASS ✅' : 'FAIL ❌'}`);
    
    // Clean up test data
    if (recentStoryId) {
      await Story.findByIdAndDelete(recentStoryId);
    }
    
    console.log('\nTest completed and test data cleaned up');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
};

// Run the test
runTest();
