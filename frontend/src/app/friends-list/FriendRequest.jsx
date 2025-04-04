import React from "react";
import { UserPlus, UserMinus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const FriendRequest = ({ friend, onAction }) => {
  const userPlaceholder = friend?.username
    ?.split(" ")
    .map((name) => name[0])
    .join("");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white mb-4 dark:bg-gray-800 p-4 shadow rounded-lg"
      >
        <Avatar className="h-32 w-32 rounded mx-auto mb-4">
          {friend?.profilePicture ? (
            <AvatarImage src={friend?.profilePicture} alt={friend?.username} />
          ) : (
            <AvatarFallback className="dark:bg-gray-400">
              {userPlaceholder}
            </AvatarFallback>
          )}
        </Avatar>
        <h3 className="text-lg font-semibold text-center mb-4">
          {friend?.username}
        </h3>

        <div className="flex flex-col justify-between">
          <Button
            className="bg-blue-500"
            size="lg"
            onClick={() => onAction("confirm", friend?._id)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Accept
          </Button>
          <Button
            className="mt-2"
            size="lg"
            onClick={() => onAction("delete", friend?._id)}
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FriendRequest;
