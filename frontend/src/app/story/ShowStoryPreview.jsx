import React from "react";
import Image from "next/image";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ShowStoryPreview = ({
  file,
  fileType,
  onClose,
  onPost,
  isNewStory,
  username,
  avatar,
  isLoading,
}) => {
  const userPlaceholder = username
    ?.split(" ")
    .map((name) => name[0])
    .join("");

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      style={{ position: "fixed", top: 0, left: 0 }}
    >
      <div className="relative w-full max-w-md h-[70vh] flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        <Button
          className="absolute top-4 right-4 z-10 text-gray-800 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
          variant="ghost"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
        <div className="absolute top-4 left-4 z-10 flex items-center">
          <Avatar className="w-10 h-10 mr-2">
            {avatar ? (
              <AvatarImage src={avatar} alt={username} />
            ) : (
              <AvatarFallback>{userPlaceholder}</AvatarFallback>
            )}
          </Avatar>
          <span className="text-gray-700 dark:text-gray-200 font-semibold">
            {username}
          </span>
        </div>
        <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          {fileType === "image" ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={file}
                alt="story_preview"
                className="object-contain"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                style={{ objectFit: "contain" }}
              />
            </div>
          ) : (
            <video
              src={file}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
        {isNewStory && (
          <div className="absolute bottom-4 right-2 transform -translate-x-1/2">
            <Button
              onClick={onPost}
              className="bg-blue-500 hover:bg-orange-500 text-white"
            >
              {isLoading ? "Saving..." : "Share"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowStoryPreview;
