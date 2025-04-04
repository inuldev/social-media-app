const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const connectDb = require("./config/db");

const authRoute = require("./routes/authRoute");
const postRoute = require("./routes/postRoute");
const userRoute = require("./routes/userRoute");
const passport = require("./controllers/googleController");
const { initScheduledTasks } = require("./utils/scheduledTasks");

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  maxAge: 600, // 10 minutes
  exposedHeaders: ["Content-Length", "Content-Type"],
};

// Log CORS configuration
console.log(
  `CORS configured with origin: ${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }`
);

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Set appropriate payload limits
app.use(express.json({ limit: "40mb" }));
app.use(express.urlencoded({ extended: true, limit: "40mb" }));

let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;

const connectToDatabase = async () => {
  if (!isConnected && connectionRetries < MAX_RETRIES) {
    try {
      await connectDb();
      isConnected = true;
      connectionRetries = 0; // Reset retries on successful connection
      console.log("Database connected successfully");

      // Initialize scheduled tasks after database connection
      initScheduledTasks();
    } catch (error) {
      connectionRetries++;
      console.error(
        `Database connection attempt ${connectionRetries}/${MAX_RETRIES} failed:`,
        error.message
      );
      if (connectionRetries >= MAX_RETRIES) {
        console.error(
          "Maximum connection retries reached. Please check your database configuration."
        );
      }
    }
  }
};

// Connect to database on startup
connectToDatabase();

// Middleware to ensure database connection on each request
app.use(async (req, res, next) => {
  if (!isConnected) {
    await connectToDatabase();
  }
  next();
});

app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use("/auth", authRoute);
app.use("/users", postRoute);
app.use("/users", userRoute);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Backend API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: "Validation error",
      errors: err.errors,
    });
  }

  if (err.name === "MongoServerError" && err.code === 11000) {
    return res.status(409).json({
      status: "error",
      message: "Duplicate key error",
      field: Object.keys(err.keyPattern)[0],
    });
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? {
            stack: err.stack,
            ...err,
          }
        : undefined,
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;
