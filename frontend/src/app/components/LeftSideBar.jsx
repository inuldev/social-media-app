"use client";

import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Users,
  Video,
  User,
  MessageCircle,
  Bell,
  LogOut,
} from "lucide-react";

import userStore from "@/store/userStore";
import { logout } from "@/service/auth.service";
import useSidebarStore from "@/store/sidebarStore";
import { userFriendStore } from "@/store/userFriendsStore";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const LeftSideBar = () => {
  const router = useRouter();
  const { user, clearUser } = userStore();
  const { isSidebarOpen, toggleSidebar } = useSidebarStore();
  const { pendingRequestsCount, fetchFriendRequest, startNotificationPolling } =
    userFriendStore();

  useEffect(() => {
    fetchFriendRequest();
    const stopPolling = startNotificationPolling();

    return () => stopPolling();
  }, [fetchFriendRequest, startNotificationPolling]);

  const userPlaceholder = user?.username
    ?.split(" ")
    .map((name) => name[0])
    .join("");

  const handleNavigation = (path) => {
    router.push(path);
    if (isSidebarOpen) {
      toggleSidebar();
    }
  };

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result?.status == "success") {
        router.push("/user-login");
        clearUser();
      }
      showSuccessToast("User logged out successfully");
    } catch (error) {
      console.error(error);
      showErrorToast("Failed to log out");
    }
  };

  return (
    <aside
      className={`fixed top-16 left-0 h-full w-64 p-4 transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col z-50 md:z-0 ${
        isSidebarOpen
          ? "translate-x-0 bg-white dark:bg-[rgb(36,37,38)] shadow-lg"
          : "-translate-x-full"
      } ${isSidebarOpen ? "md:hidden" : ""} md:bg-transparent md:shadow-none`}
      style={{ position: "fixed", top: "64px", left: 0 }}
    >
      <div className="flex flex-col h-full overflow-y-auto">
        <nav className="space-y-4 flex-grow">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => handleNavigation("/")}
          >
            <Avatar className="h-10 w-10">
              {user?.profilePicture ? (
                <AvatarImage src={user?.profilePicture} alt={user?.username} />
              ) : (
                <AvatarFallback className="dark:bg-gray-400">
                  {userPlaceholder}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="font-semibold">{user?.username}</span>
          </div>
          <Button
            variant="ghost"
            className="full justify-start"
            onClick={() => handleNavigation("/")}
          >
            <Home className="mr-4" />
            Home Page
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start relative"
            onClick={() => handleNavigation("/friends-list", "friends")}
          >
            <Users className="mr-4" />
            Friends List
            {pendingRequestsCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute right-0 top-1/3 -translate-y-1/3 mr-12"
              >
                {pendingRequestsCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            className="full justify-start"
            onClick={() => handleNavigation("/video-feed", "video")}
          >
            <Video className="mr-4" />
            Video Feed
          </Button>
          <Button
            variant="ghost"
            className="full justify-start"
            onClick={() => handleNavigation(`/user-profile/${user?._id}`)}
          >
            <User className="mr-4" />
            Profile
          </Button>
          <Button variant="ghost" className="full justify-start">
            <MessageCircle className="mr-4" />
            Messages
          </Button>
          <Button variant="ghost" className="full justify-start">
            <Bell className="mr-4" />
            Notification
          </Button>
        </nav>

        {/* footer section */}
        <div className="mb-16">
          <Separator className="my-4" />
          <div className="flex items-center space-x-2 mb-4 cursor-pointer">
            <Avatar className="h-10 w-10">
              {user?.profilePicture ? (
                <AvatarImage src={user?.profilePicture} alt={user?.username} />
              ) : (
                <AvatarFallback className="dark:bg-gray-400">
                  {userPlaceholder}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="font-semibold">{user?.username}</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <Button
              variant="ghost"
              className="cursor-pointer -ml-4"
              onClick={handleLogout}
            >
              <LogOut />
              <span className="ml-2 font-bold text-md">Logout</span>
            </Button>
            <p>Privacy · Terms · Advertising</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LeftSideBar;
