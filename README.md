<h1 align="center">✨ Inbook ✨</h1>

Inbook is a social media application that allows users to share their thoughts, experiences, and interests with others. It is built with a modern stack, including Next.js, Tailwind CSS, and Zustand for state management.

## 🚀 Quick Start

To get started with Inbook, follow these steps:

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🔑 Environment Setup

Make sure you have the following environment variables set up:

### Backend (.env)

```
PORT=8000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_random_secret
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FRONTEND_URL=your_frontend_url
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=your_google_callback_url
NODE_ENV=development_or_production
```

### Frontend (.env)

```
NEXT_PUBLIC_BACKEND_URL=your_backend_url
NEXT_PUBLIC_FRONTEND_URL=your_frontend_url
NODE_ENV=development_or_production
```

## ✨ Key Features

### Frontend Features

- Built with Next.js 14
- Uses Tailwind CSS for styling
- Features modern UI components from shadcn/ui and Radix UI
- Implements dark/light theme support
- Uses Zustand for state management
- Includes features like stories, posts, user profiles, and authentication

### Backend Features

- Node.js/Express.js server
- MongoDB database with Mongoose ODM
- Features include:
  - User authentication (local + Google OAuth)
  - Post creation with media upload to Cloudinary
  - Story functionality
  - Social features (likes, comments, shares)
  - User following system

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues**

   - Check your MongoDB connection string in the backend .env file
   - Ensure MongoDB is running if using a local database

2. **API Connection Issues**

   - Verify that the backend server is running
   - Check that NEXT_PUBLIC_BACKEND_URL in the frontend .env points to the correct backend URL

3. **Authentication Problems**

   - Ensure JWT_SECRET is properly set
   - Check that cookies are being properly set and sent

4. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits

### Logs

Check the console output for both frontend and backend servers for error messages that can help diagnose issues.

---

## ⭐DO NOT FORGET TO STAR THIS REPO⭐

---
