import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { usePostStore } from "@/store/usePostStore";

import StoryCard from "./StoryCard";

const StorySection = () => {
  const containerRef = useRef();
  const [maxScroll, setMaxScroll] = useState(0);
  const { story, fetchStoryPost } = usePostStore();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    fetchStoryPost();
  }, [fetchStoryPost]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      setContainerWidth(container.offsetWidth);
      setMaxScroll(container.scrollWidth - container.offsetWidth);
      setScrollPosition(container.scrollLeft);
    };

    // Initial update
    updateDimensions();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    // Update on story changes
    if (story?.length) {
      updateDimensions();
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [story]);

  const scroll = (direction) => {
    const container = containerRef.current;
    if (!container) return;

    const cardWidth = 160; // Width of StoryCard + margin
    const visibleCards = Math.floor(containerWidth / cardWidth);
    const scrollAmount =
      direction === "left"
        ? -cardWidth * visibleCards
        : cardWidth * visibleCards;

    const newScrollPosition = container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollPosition,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    setScrollPosition(container.scrollLeft);
    setMaxScroll(container.scrollWidth - container.offsetWidth);
  };

  // Calculate drag constraints
  const dragConstraints = {
    right: 0,
    left: -(story?.length + 1) * 160 + containerWidth, // 160px is the width of each story card
  };

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex overflow-x-hidden py-4 px-2 relative"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <motion.div
          className="flex space-x-2"
          drag="x"
          dragConstraints={dragConstraints}
          dragElastic={0.2}
          dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
          whileTap={{ cursor: "grabbing" }}
        >
          <StoryCard isAddStory={true} />
          {story?.map((storyItem) => (
            <StoryCard story={storyItem} key={storyItem._id} />
          ))}
        </motion.div>
      </div>

      {/* Navigation Buttons */}
      {scrollPosition > 0 && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full shadow-lg z-10 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {scrollPosition < maxScroll && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full shadow-lg z-10 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default StorySection;
