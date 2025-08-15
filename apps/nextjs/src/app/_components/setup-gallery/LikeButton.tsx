"use client";

import { useState } from "react";

import { Button } from "@acme/ui";

interface LikeButtonProps {
  initialLikes: number;
}

export function LikeButton({ initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    if (isLiked) {
      setLikes((prev) => prev - 1);
      setIsLiked(false);
    } else {
      setLikes((prev) => prev + 1);
      setIsLiked(true);
    }
  };

  return (
    <Button
      variant={isLiked ? "destructive" : "secondary"}
      size="sm"
      onClick={handleLike}
      className="flex items-center gap-2"
    >
      <span>{isLiked ? "❤️" : "🤍"}</span>
      <span>{likes}</span>
    </Button>
  );
}
