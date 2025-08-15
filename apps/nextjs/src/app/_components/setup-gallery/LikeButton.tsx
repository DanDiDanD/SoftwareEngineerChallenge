"use client";

import { useState } from "react";

import { Button } from "@acme/ui";

interface LikeButtonProps {
  initialLikes: number;
  setupTitle: string;
}

export function LikeButton({ initialLikes, setupTitle }: LikeButtonProps) {
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
      aria-label={`${isLiked ? "Remove like from" : "Like"} "${setupTitle}" post`}
      type="button"
    >
      <span aria-hidden="true">{isLiked ? "❤️" : "🤍"}</span>
      <span aria-label={`${likes} likes`}>{likes}</span>
    </Button>
  );
}
