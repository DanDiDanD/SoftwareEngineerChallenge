"use client";

import { useOptimistic, useState, useTransition } from "react";

import { Button } from "@acme/ui";

import type { LikeResult } from "~/types/setup";
import { likeSetup } from "~/app/actions";

interface LikeButtonProps {
  initialLikes: number;
  setupTitle: string;
}

export function LikeButton({ initialLikes, setupTitle }: LikeButtonProps) {
  const [_, startTransition] = useTransition();
  const [currentState, setCurrentState] = useState<LikeResult>({
    likes: initialLikes || 0,
    isLiked: false,
  });

  const [optimisticState, addOptimistic] = useOptimistic(
    currentState,
    (state, _) => ({
      likes: state.isLiked ? state.likes - 1 : state.likes + 1,
      isLiked: !state.isLiked,
    }),
  );

  const handleLike = () => {
    startTransition(async () => {
      addOptimistic(null);

      try {
        const result = await likeSetup(currentState);
        setCurrentState(result);
      } catch (error) {
        console.error("Failed to update like:", error);
      }
    });
  };

  return (
    <Button
      variant={optimisticState.isLiked ? "destructive" : "secondary"}
      size="sm"
      className="flex items-center gap-2"
      aria-label={`${optimisticState.isLiked ? "Remove like from" : "Like"} "${setupTitle}" post`}
      onClick={handleLike}
    >
      <span>{optimisticState.isLiked ? "❤️" : "🤍"}</span>
      <span>{optimisticState.likes}</span>
    </Button>
  );
}
