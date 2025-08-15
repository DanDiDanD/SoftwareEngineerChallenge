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
    setLikes((prev) => prev + 1);
    setIsLiked(!isLiked);
  };

  return (
    <Button
      variant={isLiked ? "destructive" : "secondary"}
      size="sm"
      onClick={handleLike}
      className="flex items-center gap-2"
    >
      ❤️
      <span>{likes}</span>
    </Button>
  );
}
