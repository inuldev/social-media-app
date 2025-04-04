require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const connectDb = require("./config/db");
const mongoose = require("mongoose");

const authRoute = require("./routes/authRoute");
const postRoute = require("./routes/postRoute");
const userRoute = require("./routes/userRoute");
const passport = require("./controllers/googleController");
const { initScheduledTasks } = require("./utils/scheduledTasks");

// Validate required environment variables
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "FRONTEND_URL"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length) {
  console.error("Missing required environment variables:", missingEnvVars);
  process.exit(1);
}

const app = express();

// Optimize compression for Vercel
app.use(
  compression({
    level: 6, // Balanced between compression and speed
    threshold: 10 * 1024, // Only compress responses above 10KB
  })
);

// CORS configuration optimized for Vercel
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
  maxAge: 600,
  exposedHeaders: ["Content-Length", "Content-Type"],
};

app.use(cors(corsOptions));

// Optimized request logging for production
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  }
  next();
});

// Payload limits adjusted for Vercel hobby plan
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "4mb" }));

// Database connection management
let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 3;

const connectToDatabase = async () => {
  if (!isConnected && connectionRetries < MAX_RETRIES) {
    try {
      await connectDb();
      isConnected = true;
      connectionRetries = 0;

      // Initialize scheduled tasks only in production
      if (process.env.NODE_ENV === "production") {
        initScheduledTasks();
      }
    } catch (error) {
      connectionRetries++;
      console.error(
        `Database connection attempt ${connectionRetries}/${MAX_RETRIES} failed:`,
        error
      );
      if (connectionRetries >= MAX_RETRIES) {
        throw new Error("Database connection failed after maximum retries");
      }
    }
  }
};

// Initialize database connection
connectToDatabase().catch(console.error);

// Middleware to ensure database connection with timeout
app.use(async (req, res, next) => {
  try {
    if (!isConnected) {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Database connection timeout")),
          5000
        );
      });
      await Promise.race([connectToDatabase(), timeoutPromise]);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Security middleware
app.use(cookieParser());
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
  })
);
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hidePoweredBy());
app.use(passport.initialize());

// Rate limiting adjusted for Vercel
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Request timeout middleware
app.use((req, res, next) => {
  res.setTimeout(8000, () => {
    res.status(408).json({
      status: "error",
      message: "Request timeout",
    });
  });
  next();
});

// Routes
app.use("/auth", authRoute);
app.use("/users", postRoute);
app.use("/users", userRoute);

// Health check optimized for Vercel
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Optimized error handling
app.use((err, req, res, next) => {
  // Log errors only in development
  if (process.env.NODE_ENV !== "production") {
    console.error("Error occurred:", {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Handle specific errors
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
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Server initialization
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () =>
    console.log(`Development server running on port ${PORT}`)
  );
}

// Graceful shutdown handler
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  mongoose.connection.close(false, () => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});

module.exports = app;
