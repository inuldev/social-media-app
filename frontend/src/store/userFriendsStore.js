import { create } from "zustand";
import toast from "react-hot-toast";

import {
  deleteUserFromRequest,
  followUser,
  getAllFriendsRequest,
  getAllFriendsSuggestion,
  getMutualFriends,
  UnfollowUser,
} from "@/service/user.service";

export const userFriendStore = create((set, get) => ({
  friendRequest: [],
  friendSuggestion: [],
  mutualFriends: [],
  loading: false,
  pendingRequestsCount: 0,
  lastNotificationCheck: null,

  // Lightweight check for new requests
  checkNewRequests: async () => {
    try {
      const response = await getAllFriendsRequest();
      const newCount = response.data.length;

      // Only update if count changed
      if (newCount !== get().pendingRequestsCount) {
        set({ pendingRequestsCount: newCount });
      }
    } catch (error) {
      console.error("Failed to check notifications:", error);
    }
  },

  fetchFriendRequest: async () => {
    set({ loading: true });
    try {
      const friend = await getAllFriendsRequest();
      set({
        friendRequest: friend.data,
        pendingRequestsCount: friend.data.length,
        loading: false,
        lastNotificationCheck: Date.now(),
      });
    } catch (error) {
      set({ error, loading: false });
    }
  },

  fetchFriendSuggestion: async () => {
    set({ loading: true });
    try {
      const friend = await getAllFriendsSuggestion();
      set({ friendSuggestion: friend.data, loading: false });
    } catch (error) {
      set({ error, loading: false });
    } finally {
      set({ loading: false });
    }
  },

  fetchMutualFriends: async (userId) => {
    set({ loading: true });
    try {
      const friend = await getMutualFriends(userId);
      set({ mutualFriends: friend.data || [], loading: false });
    } catch (error) {
      console.error("Error fetching mutual friends:", error);
      set({ mutualFriends: [], error, loading: false });
    } finally {
      set({ loading: false });
    }
  },

  followUser: async (userId) => {
    set({ loading: true });
    try {
      await followUser(userId);
    } catch (error) {
      set({ error, loading: false });
    }
  },

  UnfollowUser: async (userId) => {
    set({ loading: true });
    try {
      await UnfollowUser(userId);
    } catch (error) {
      set({ error, loading: false });
    }
  },

  deleteUserFromRequest: async (userId) => {
    set({ loading: true });
    try {
      await deleteUserFromRequest(userId);
      toast.success("you have deleted friend successfully");
    } catch (error) {
      set({ error, loading: false });
    }
  },

  // Separate polling for notifications
  startNotificationPolling: () => {
    const pollInterval = setInterval(() => {
      get().checkNewRequests();
    }, 30000); // Check every 30 seconds
    return () => clearInterval(pollInterval);
  },
}));
