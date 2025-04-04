import toast from "react-hot-toast";
import { motion } from "framer-motion";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, UserX } from "lucide-react";

import { userFriendStore } from "@/store/userFriendsStore";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MutualFriends = ({ id, isOwner, fetchProfile }) => {
  const router = useRouter();
  const { fetchMutualFriends, mutualFriends, UnfollowUser } = userFriendStore();

  useEffect(() => {
    if (id) {
      fetchMutualFriends(id);
    }
  }, [id, fetchMutualFriends]);

  const handleUnfollow = async (userId) => {
    await UnfollowUser(userId);
    toast.success("you have unfollow successfully");
    fetchProfile();
    fetchMutualFriends(id);
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-4"
    >
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-300">
            Mutual Friends ({mutualFriends.length})
          </h2>
          {mutualFriends.length === 0 ? (
            <div className="text-center py-6">
              <UserX className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                No mutual friends yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mutualFriends.map((friend) => {
                const friendInitials = friend?.username
                  ?.split(" ")
                  .map((name) => name[0])
                  .join("");

                return (
                  <div
                    key={friend?._id}
                    className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg flex items-start justify-between"
                  >
                    <div
                      className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleUserClick(friend?._id)}
                    >
                      <Avatar>
                        {friend?.profilePicture ? (
                          <AvatarImage
                            src={friend?.profilePicture}
                            alt={friend?.username}
                          />
                        ) : (
                          <AvatarFallback className="dark:bg-gray-400">
                            {friendInitials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-semibold dark:text-gray-100">
                          {friend?.username}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <span>{friend?.followerCount} followers</span>
                          <span>•</span>
                          <span>{friend?.followingCount} following</span>
                        </div>
                      </div>
                    </div>
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnfollow(friend?._id);
                            }}
                            className="text-red-500 focus:text-red-500 cursor-pointer"
                          >
                            <UserX className="h-4 w-4 mr-2" /> Unfollow
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MutualFriends;
