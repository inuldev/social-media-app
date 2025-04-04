import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Trash,
} from "lucide-react";

import { formateDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import DebugPostData from "@/components/DebugPostData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import PostComments from "./PostComments";

const PostCard = ({ post, isLiked, onShare, onComment, onLike, onDelete }) => {
  const router = useRouter();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const commentInputRef = useRef(null);

  const handleCommentClick = () => {
    setShowComments(true);
    setTimeout(() => {
      commentInputRef?.current?.focus();
    }, 0);
  };

  const userPostPlaceholder = post?.user?.username
    ?.split(" ")
    .map((name) => name[0])
    .join("");

  const generateSharedLink = () => {
    return `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${post?._id}`;
  };

  const handleShare = async (platform) => {
    const url = generateSharedLink();
    try {
      switch (platform) {
        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              url
            )}`,
            "_blank"
          );
          break;
        case "twitter":
          window.open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(
              url
            )}&text=${encodeURIComponent(post?.content || "")}`,
            "_blank"
          );
          break;
        case "linkedin":
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
              url
            )}`,
            "_blank"
          );
          break;
        case "copy":
          await navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard!");
          break;
        default:
          return;
      }
      onShare();
      setIsShareDialogOpen(false);
    } catch (error) {
      toast.error("Failed to share post");
    }
  };

  const handleUserClick = (userId) => {
    try {
      router.push(`/user-profile/${userId}`);
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error("Failed to navigate to user profile");
    }
  };

  return (
    <motion.div
      key={post?._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent className="p-6 dark:text-white">
          <div className="flex items-center justify-between mb-4">
            <div
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleUserClick(post?.user?._id)}
            >
              <Avatar>
                {post?.user?.profilePicture ? (
                  <AvatarImage
                    src={post?.user?.profilePicture}
                    alt={post?.user?.username}
                  />
                ) : (
                  <AvatarFallback className="dark:bg-gray-400">
                    {userPostPlaceholder}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-semibold dark:text-white">
                  {post?.user?.username}
                </p>
                <p className="text-xs text-gray-500">
                  {formateDate(post?.createdAt)}
                </p>
              </div>
            </div>
            {onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="dark:hover:bg-gray-500"
                  >
                    <MoreHorizontal className="h-4 w-4 dark:text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={onDelete}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="mb-4">{post?.content}</p>
          {post?.mediaUrl && post.mediaType === "image" && (
            <div className="relative min-h-[400px] max-h-[600px] w-full mb-4">
              <Image
                src={post.mediaUrl}
                alt="post_image"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="!relative !w-full !h-auto max-h-[600px] rounded-lg"
                style={{ objectFit: "contain" }}
                priority
                unoptimized={post.mediaUrl.includes("gif")}
              />
            </div>
          )}

          {/* Video display - detect videos by URL pattern or mediaType */}
          {post?.mediaUrl &&
            (post.mediaType === "video" ||
              post.mediaUrl.includes("/video/") ||
              post.mediaUrl.endsWith(".mp4") ||
              post.mediaUrl.endsWith(".mov") ||
              post.mediaUrl.endsWith(".webm")) && (
              <div className="relative w-full mb-4">
                {/* Force video to reload by adding a key with timestamp */}
                <video
                  key={`video-${post._id}-${Date.now()}`}
                  controls
                  className="w-full max-h-[600px] rounded-lg object-contain bg-black"
                  preload="metadata"
                  playsInline
                  autoPlay={false}
                >
                  {/* Try to determine the correct video type */}
                  {post.mediaUrl.endsWith(".mp4") && (
                    <source
                      src={`${post.mediaUrl}?v=${Date.now()}`}
                      type="video/mp4"
                    />
                  )}
                  {post.mediaUrl.endsWith(".webm") && (
                    <source
                      src={`${post.mediaUrl}?v=${Date.now()}`}
                      type="video/webm"
                    />
                  )}
                  {post.mediaUrl.endsWith(".mov") && (
                    <source
                      src={`${post.mediaUrl}?v=${Date.now()}`}
                      type="video/quicktime"
                    />
                  )}
                  {/* Default source if we can't determine the type */}
                  {!post.mediaUrl.endsWith(".mp4") &&
                    !post.mediaUrl.endsWith(".webm") &&
                    !post.mediaUrl.endsWith(".mov") && (
                      <source
                        src={`${post.mediaUrl}?v=${Date.now()}`}
                        type="video/mp4"
                      />
                    )}
                  Your browser does not support the video tag
                </video>

                {/* Debug info - only show in development mode */}
                {process.env.NODE_ENV === "development" && (
                  <div className="mt-1 text-xs text-gray-500 bg-gray-100 p-2 rounded">
                    <p>Media Type: {post.mediaType || "Not set"}</p>
                    <p>URL: {post.mediaUrl.substring(0, 50)}...</p>
                    <p>
                      Is Video URL:{" "}
                      {post.mediaUrl.includes("/video/") ? "Yes" : "No"}
                    </p>
                    <p>File Extension: {post.mediaUrl.split(".").pop()}</p>
                    <p>Post ID: {post._id}</p>
                  </div>
                )}

                {/* Fallback link in case video doesn't play */}
                <div className="mt-1 text-xs text-blue-500">
                  <a
                    href={post.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Video not playing? Click here to open directly
                  </a>
                </div>
              </div>
            )}

          {/* PDF Display */}
          {post?.mediaUrl && post.mediaType === "pdf" && (
            <div className="relative w-full mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-center flex-col">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-red-500 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm font-medium mb-2">PDF Document</p>
                <a
                  href={post.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Open PDF
                </a>
              </div>
            </div>
          )}

          {/* Document Display */}
          {post?.mediaUrl && post.mediaType === "document" && (
            <div className="relative w-full mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-center flex-col">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-blue-500 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm font-medium mb-2">Document</p>
                <a
                  href={post.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Open Document
                </a>
              </div>
            </div>
          )}

          {/* Debug component to help troubleshoot post data */}
          <DebugPostData post={post} />

          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400 hover:border-b-2 border-gray-400 cursor-pointer">
              {post?.likeCount} likes
            </span>
            <div className="flex gap-3">
              <span
                className="text-sm text-gray-500 dark:text-gray-400 hover:border-b-2 border-gray-400 cursor-pointer"
                onClick={() => setShowComments(!showComments)}
              >
                {post?.commentCount} comments
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 hover:border-b-2 border-gray-400 cursor-pointer">
                {post?.shareCount} share
              </span>
            </div>
          </div>
          <Separator className="mb-2 dark:bg-gray-400" />
          <div className="flex justify-between mb-2">
            <Button
              variant="ghost"
              className={`flex-1 dark:hover:bg-gray-600 ${
                isLiked ? "text-blue-600" : ""
              }`}
              onClick={onLike}
            >
              <ThumbsUp className="mr-2 h-4 w-4" /> Like
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 dark:hover:bg-gray-600 `}
              onClick={handleCommentClick}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Comment
            </Button>

            <Dialog
              open={isShareDialogOpen}
              onOpenChange={setIsShareDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex-1 dark:hover:bg-gray-500"
                  onClick={onShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share This Post</DialogTitle>
                  <DialogDescription>
                    Choose where you want to share this post
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col space-y-4 ">
                  <Button onClick={() => handleShare("facebook")}>
                    Share on Facebook
                  </Button>
                  <Button onClick={() => handleShare("twitter")}>
                    Share on Twitter
                  </Button>
                  <Button onClick={() => handleShare("linkedin")}>
                    Share on Linkedin
                  </Button>
                  <Button onClick={() => handleShare("copy")}>Copy Link</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Separator className="mb-2 dark:bg-gray-400" />
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PostComments
                  post={post}
                  onComment={onComment}
                  commentInputRef={commentInputRef}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PostCard;
