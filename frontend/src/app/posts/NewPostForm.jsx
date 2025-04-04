import dynamic from "next/dynamic";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Laugh, X, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import userStore from "@/store/userStore";
import { usePostStore } from "@/store/usePostStore";
import { createPost, createPostWithMedia } from "@/service/post.service";
import DirectUpload from "@/components/DirectUpload";

const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const NewPostForm = ({ isPostFormOpen, setIsPostFormOpen }) => {
  const { user } = userStore();
  const { fetchPost } = usePostStore();
  const [loading, setLoading] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const userPlaceholder = user?.username
    ?.split(" ")
    .map((name) => name[0])
    .join("");

  const handleEmojiClick = (emojiObject) => {
    setPostContent((prev) => prev + emojiObject.emoji);
  };

  // Handle text-only post creation
  const handlePost = async () => {
    if (!postContent.trim()) {
      showErrorToast("Please enter some content for your post");
      return;
    }

    try {
      setLoading(true);
      await createPost({ content: postContent });
      showSuccessToast("Post created successfully");
      setPostContent("");
      setIsPostFormOpen(false);
      fetchPost();
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === "development") {
        console.error("Post creation error:", error);
      }
      showErrorToast("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle direct upload post creation
  const handleDirectUpload = async (uploadResult) => {
    try {
      setLoading(true);

      // Determine mediaType based on URL or format
      let mediaType = uploadResult.mediaType;

      // Ensure videos are identified correctly
      if (
        uploadResult.url.includes("/video/") ||
        ["mp4", "mov", "webm", "avi"].includes(uploadResult.format)
      ) {
        mediaType = "video";
        // Media type set to video based on URL or format
      }

      // Force mediaType to 'video' for video URLs to ensure consistency
      if (uploadResult.url.includes("/video/")) {
        mediaType = "video";
        // Force mediaType to video for consistency
      }

      // Only log in development mode
      if (process.env.NODE_ENV === "development") {
        console.log(`Final media type: ${mediaType}`);
        console.log("Creating post with media:", {
          mediaType,
          url: uploadResult.url.substring(0, 50) + "...",
          format: uploadResult.format,
        });
      }

      // Create post with the pre-uploaded media using the direct upload endpoint
      await createPostWithMedia({
        content: uploadResult.content,
        mediaUrl: uploadResult.url,
        mediaType: mediaType,
        cloudinary: {
          publicId: uploadResult.publicId,
          format: uploadResult.format,
        },
      });

      showSuccessToast("Post created successfully");
      setPostContent("");
      setIsPostFormOpen(false);
      fetchPost();
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === "development") {
        console.error("Error creating post with direct upload:", error);
      }
      showErrorToast("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form when dialog closes
  const resetForm = () => {
    setPostContent("");
    setShowEmojiPicker(false);
    setLoading(false);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex space-x-4">
          <Avatar>
            {user?.profilePicture ? (
              <AvatarImage src={user?.profilePicture} alt={user?.username} />
            ) : (
              <AvatarFallback className="dark:bg-gray-400">
                {userPlaceholder}
              </AvatarFallback>
            )}
          </Avatar>

          <Dialog
            open={isPostFormOpen}
            onOpenChange={(open) => {
              if (!loading) {
                setIsPostFormOpen(open);
                if (!open) resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <div className="w-full">
                <Input
                  placeholder={`What's on your mind, ${user?.username}?`}
                  readOnly
                  className="cursor-pointer rounded-full h-12 dark:bg-[rgb(58,59,60)] placeholder:text-gray-500 dark:placeholder:text-gray-400 w-full"
                />
              </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[525px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-center">Create Post</DialogTitle>
                <DialogDescription className="sr-only"></DialogDescription>
              </DialogHeader>

              <Separator />

              <div className="flex items-center space-x-3 py-4">
                <Avatar className="h-10 w-10">
                  {user?.profilePicture ? (
                    <AvatarImage
                      src={user?.profilePicture}
                      alt={user?.username}
                    />
                  ) : (
                    <AvatarFallback>{userPlaceholder}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-semibold">{user?.username}</p>
                </div>
              </div>

              {/* Main post creation area */}
              <div className="space-y-4">
                {/* Text input area */}
                <Textarea
                  placeholder={`What's on your mind, ${user?.username}?`}
                  className="min-h-[100px] text-md"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="relative"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-10 text-gray-800 dark:text-gray-600 hover:bg-gray-200"
                      onClick={() => setShowEmojiPicker(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Picker onEmojiClick={handleEmojiClick} width="100%" />
                  </motion.div>
                )}

                {/* Post Options */}
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="font-medium mb-3">Add to Your Post</p>
                  <div className="flex flex-wrap gap-3">
                    {/* Emoji Button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="flex items-center gap-2"
                          >
                            <Laugh className="h-4 w-4 text-orange-500" />
                            <span>Emoji</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add emojis to your post</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Direct Upload Component - For all media */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Add Photos or Videos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Upload images up to 10MB or videos up to 100MB
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mb-4">
                    All media uploads use direct upload for maximum reliability
                  </p>

                  <DirectUpload
                    postContent={postContent}
                    onUploadComplete={(result) => {
                      // When direct upload completes, we'll have the media URL and content
                      if (result && result.url) {
                        // Create a post with the pre-uploaded media
                        handleDirectUpload({
                          ...result,
                          content: result.content || postContent,
                        });
                      }
                    }}
                    onPostCreated={() => {
                      // Close the post form after post is created
                      setIsPostFormOpen(false);
                    }}
                  />
                </div>

                {/* Post Button for Text-Only Posts */}
                {postContent.trim() && (
                  <Button
                    className="w-full bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
                    onClick={handlePost}
                    disabled={loading || !postContent?.trim()}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      "Post Text Only"
                    )}
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewPostForm;
