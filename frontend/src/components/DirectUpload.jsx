"use client";

import { useState, useRef, useId } from "react";

import { Button } from "@/components/ui/button";
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  dismissAllToasts,
} from "@/lib/toastUtils";

/**
 * DirectUpload component that uploads directly to Cloudinary. This bypasses the Vercel serverless function size limitations.
 */
const DirectUpload = ({
  onUploadComplete,
  postContent = "",
  onPostCreated,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  // We don't need to track media state anymore since we auto-create posts
  const fileInputRef = useRef(null);
  const uniqueId = useId();

  // Cloudinary upload preset (unsigned)
  const uploadPreset = "inbook_uploads";
  const cloudName = "dzeea89j1";

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Handle file upload
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size and type based on file type
    const isVideo = file.type.startsWith("video");
    const isImage = file.type.startsWith("image");

    // Set size limits: 100MB for videos, 10MB for images, 20MB for other files (like PDFs)
    const maxVideoSize = 100 * 1024 * 1024; // 100MB for videos
    const maxImageSize = 10 * 1024 * 1024; // 10MB for images
    const maxOtherSize = 20 * 1024 * 1024; // 20MB for other files (like PDFs)

    // Determine the appropriate size limit based on file type
    const maxSize = isVideo
      ? maxVideoSize
      : isImage
      ? maxImageSize
      : maxOtherSize;
    const sizeInMB = Math.round(file.size / (1024 * 1024));
    const maxSizeInMB = Math.round(maxSize / (1024 * 1024));

    if (file.size > maxSize) {
      showErrorToast(
        `File size (${sizeInMB}MB) exceeds the limit of ${maxSizeInMB}MB for ${
          isVideo ? "videos" : isImage ? "images" : "documents"
        }`
      );
      return;
    }

    // Show appropriate warnings based on file size (large files)
    if (file.size > 50 * 1024 * 1024) {
      showInfoToast(
        `Large file (${sizeInMB}MB) may take longer to upload. We've set a 15-minute timeout for large files. Please be patient.`,
        {
          icon: "⚠️",
          style: {
            borderRadius: "10px",
            background: "#f59e0b",
            color: "#fff",
          },
          duration: 10000, // Show for longer (10 seconds)
        }
      );
    }

    try {
      setUploading(true);
      setProgress(0);

      // Create form data for Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("cloud_name", cloudName);

      // Add folder parameter for better organization
      formData.append("folder", "posts"); // Use a dedicated folder for post media
      formData.append("resource_type", "auto"); // Auto-detect resource type

      // Keep essential logging for production troubleshooting
      if (process.env.NODE_ENV === "development") {
        console.log("Uploading to Cloudinary with params:", {
          uploadPreset,
          cloudName,
          folder: "posts",
          fileType: file.type,
          fileSize: `${Math.round(file.size / (1024 * 1024))}MB`,
          timeout: "15 minutes",
        });
      }

      // Show loading toast
      showInfoToast("Uploading media...");

      // Upload to Cloudinary
      const xhr = new XMLHttpRequest();

      // Set a longer timeout for large files (15 minutes)
      xhr.timeout = 900000; // 15 minutes in milliseconds

      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        true
      );

      // Add event listener for timeout
      xhr.ontimeout = function () {
        // Only log in development mode
        if (process.env.NODE_ENV === "development") {
          console.error("Upload timed out");
        }
        dismissAllToasts();
        showErrorToast(
          `Upload timed out after 15 minutes. For very large files (>80MB), try splitting the video into smaller parts or compressing it.`
        );
        setUploading(false);
      };

      // Track upload progress
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
        }
      };

      // Handle response
      xhr.onload = async function () {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          // Upload successful, proceed with post creation
          // Determine media type
          const mediaType = data.resource_type === "video" ? "video" : "image";

          // Create a media object with the uploaded data
          const mediaData = {
            url: data.secure_url,
            publicId: data.public_id,
            mediaType: mediaType,
            format: data.format,
            bytes: data.bytes,
            version: data.version,
            createdAt: new Date().toISOString(),
          };

          // Only log in development mode
          if (process.env.NODE_ENV === "development") {
            console.log("Media data prepared:", {
              url: data.secure_url.substring(0, 50) + "...",
              publicId: data.public_id,
              mediaType,
              format: data.format,
              size: Math.round(data.bytes / (1024 * 1024)) + "MB",
            });
          }

          // Automatically create the post without showing the dialog
          // This prevents orphaned files in Cloudinary if the user cancels
          dismissAllToasts();
          showSuccessToast("Upload completed! Creating your post...");

          // Automatically create the post with the uploaded media
          handleAutoCreatePost(mediaData);
        } else {
          // Only log detailed errors in development mode
          if (process.env.NODE_ENV === "development") {
            console.error("Upload error:", xhr.responseText);
          }
          dismissAllToasts();
          showErrorToast("Upload failed. Please try again.");
          setUploading(false);
        }
      };

      // Handle errors
      xhr.onerror = function () {
        // Only log in development mode
        if (process.env.NODE_ENV === "development") {
          console.error("Upload error");
        }
        dismissAllToasts();
        showErrorToast("Upload failed. Please try again.");
        setUploading(false);
      };

      // Send the request
      xhr.send(formData);
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === "development") {
        console.error("Upload error:", error);
      }
      dismissAllToasts();
      showErrorToast("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  // Function to automatically create a post after upload completes
  const handleAutoCreatePost = (mediaData) => {
    // Use the original post content if it exists, otherwise use empty content
    const finalContent = postContent.trim() ? postContent : "";

    // Force mediaType to 'video' for video URLs to ensure consistency
    const forcedMediaType = mediaData.url.includes("/video/")
      ? "video"
      : mediaData.mediaType;

    // Only log in development mode
    if (process.env.NODE_ENV === "development") {
      console.log("Auto-creating post with media:", {
        mediaType: forcedMediaType,
        format: mediaData.format,
        hasContent: !!finalContent.trim(),
      });
    }

    // Call the callback with the upload result and content
    if (onUploadComplete) {
      onUploadComplete({
        url: mediaData.url,
        mediaType: forcedMediaType,
        publicId: mediaData.publicId,
        format: mediaData.format,
        content: finalContent,
      });
    }

    // Notify the parent component that a post was created
    if (onPostCreated) {
      onPostCreated();
    }

    // Reset the component state
    setUploading(false);
    setProgress(0);
  };

  return (
    <div className="mt-4">
      <input
        type="file"
        id={`direct-upload-${uniqueId}`}
        className="hidden"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml,application/pdf"
        disabled={uploading}
      />
      <Button
        variant="outline"
        className="w-full"
        disabled={uploading}
        type="button"
        onClick={triggerFileInput}
      >
        {uploading ? "Uploading..." : "Upload Media Directly"}
      </Button>

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
          <p className="text-xs text-center mt-1">{progress}%</p>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Bypass server limits by uploading directly to cloud storage
      </p>
    </div>
  );
};

export default DirectUpload;
