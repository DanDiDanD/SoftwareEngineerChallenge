export interface Setup {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  description: string;
  likes: number;
  tags: string[];
}

export type CreateSetupFormData = Pick<Setup, "title" | "author" | "imageUrl">;

export interface LikeResult {
  likes: number;
  isLiked: boolean;
}
