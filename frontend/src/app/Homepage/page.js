"use client";

import React, { useEffect, useState, useRef } from "react";

import userStore from "@/store/userStore";
import { usePostStore } from "@/store/usePostStore";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";

import PostCard from "../posts/PostCard";
import NewPostForm from "../posts/NewPostForm";
import StorySection from "../story/StorySection";
import LeftSideBar from "../components/LeftSideBar";
import RightSideBar from "../components/RightSideBar";

const HomePage = () => {
  const { user } = userStore();
  const [likePosts, setLikePosts] = useState(new Set());
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const postRef = useRef(null);

  const {
    posts,
    fetchPost,
    handleLikePost,
    handleCommentPost,
    handleSharePost,
    handleDeletePost,
  } = usePostStore();

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    const saveLikes = localStorage.getItem("likePosts");
    if (saveLikes) {
      setLikePosts(new Set(JSON.parse(saveLikes)));
    }
  }, []);

  const handleLike = async (postId) => {
    try {
      const response = await handleLikePost(postId);
      const updatedLikePost = new Set(likePosts);

      // Check the response to determine if it was a like or unlike
      if (response.message.includes("unliked")) {
        updatedLikePost.delete(postId);
        showSuccessToast("Post unliked successfully");
      } else {
        updatedLikePost.add(postId);
        showSuccessToast("Post liked successfully");
      }

      setLikePosts(updatedLikePost);
      localStorage.setItem(
        "likePosts",
        JSON.stringify(Array.from(updatedLikePost))
      );
    } catch (error) {
      console.error(error);
      showErrorToast("Failed to like or unlike the post");
    }
  };

  const handleDelete = async (postId) => {
    try {
      await handleDeletePost(postId);
      showSuccessToast("Post deleted successfully");
    } catch (error) {
      console.error(error);
      showErrorToast("Failed to delete post");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex flex-1 pt-16">
        <LeftSideBar />
        <div className="flex-1 px-4 py-6 md:ml-64 lg:mr-64 lg:max-w-2xl xl:max-w-3xl mx-auto">
          <div className="lg:ml-2 xl:ml-28">
            <StorySection />
            <NewPostForm
              isPostFormOpen={isPostFormOpen}
              setIsPostFormOpen={setIsPostFormOpen}
            />
            <div className="mt-6 space-y-6 mb-4" ref={postRef}>
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUser={user}
                  isLiked={likePosts.has(post?._id)}
                  onLike={() => handleLike(post?._id)}
                  onComment={async (comment) => {
                    await handleCommentPost(post?._id, comment.text);
                  }}
                  onShare={async () => {
                    await handleSharePost(post?._id);
                  }}
                  onDelete={
                    post.user._id === user?._id
                      ? () => handleDelete(post?._id)
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <div
          className="hidden lg:block lg:w-64 xl:w-80 fixed right-0 top-16 bottom-0 overflow-y-auto p-4"
          style={{ position: "fixed", top: "64px", right: 0 }}
        >
          <RightSideBar />
        </div>
      </main>
    </div>
  );
};

export default HomePage;
