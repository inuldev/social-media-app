const bcrypt = require("bcryptjs");

const User = require("../model/User");

const { response } = require("../utils/responseHandler");
const { generateToken } = require("../utils/tokenGenerator");

const registerUser = async (req, res) => {
  try {
    const { username, email, password, gender, dateOfBirth } = req.body;

    //  check the existing user with email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return response(res, 400, "User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      gender,
      dateOfBirth,
    });

    await newUser.save();

    const accessToken = generateToken(newUser);

    // Get domain from frontend URL for production
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const domain =
      process.env.NODE_ENV === "production"
        ? new URL(frontendUrl).hostname
        : undefined;

    // Set cookie options based on environment
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Add domain in production
    if (process.env.NODE_ENV === "production" && domain !== "localhost") {
      cookieOptions.domain = domain;
    }

    console.log("Setting auth cookie with options:", {
      ...cookieOptions,
      environment: process.env.NODE_ENV,
      frontendUrl,
    });

    res.cookie("auth_token", accessToken, cookieOptions);

    return response(res, 201, "User created successfully", {
      username: newUser.username,
      email: newUser.email,
    });
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    //  check the existing user with email
    const user = await User.findOne({ email });
    if (!user) {
      return response(res, 404, "User not found with this email");
    }

    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
      return response(res, 404, "Invalid Password");
    }

    const accessToken = generateToken(user);

    res.cookie("auth_token", accessToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    return response(res, 201, "User logged in successfully", {
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

const logout = (req, res) => {
  try {
    res.cookie("auth_token", "", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      expires: new Date(0),
    });
    return response(res, 200, "User logged out successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

module.exports = { registerUser, loginUser, logout };
