import { useState } from "react";
import type { PostView } from "../backend.d.ts";
import { PrincipalText } from "./PrincipalText";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLikePost, useCommentOnPost } from "../hooks/useQueries";
import { Heart, MessageCircle, Image, Clock } from "lucide-react";
import { toast } from "sonner";
import type { Principal } from "@icp-sdk/core/principal";

interface PostCardProps {
  post: PostView;
  comments?: never[];
  callerPrincipal?: Principal;
}

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  const diff = Date.now() - ms;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function PostCard({ post, comments, callerPrincipal }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const likeMutation = useLikePost();
  const commentMutation = useCommentOnPost();

  const isLiked = callerPrincipal
    ? post.likes.some((l) => l.toString() === callerPrincipal.toString())
    : false;

  const handleLike = () => {
    likeMutation.mutate(post.id, {
      onError: () => toast.error("Failed to like post"),
    });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate(
      { postId: post.id, content: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText("");
          toast.success("Comment added");
        },
        onError: () => toast.error("Failed to comment"),
      }
    );
  };

  return (
    <div className="glass-card rounded-xl p-4 space-y-3 animate-fade-in">
      {/* Author */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            {post.author.toString().slice(0, 2).toUpperCase()}
          </div>
          <PrincipalText principal={post.author} />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatTime(post.timestamp)}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed text-foreground/90">{post.content}</p>

      {/* Image */}
      {post.imageUrl && (
        <div className="rounded-lg overflow-hidden">
          <img
            src={post.imageUrl}
            alt="Attached media"
            className="w-full max-h-64 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      {!post.imageUrl && (
        <></>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1 border-t border-border/40">
        <button
          type="button"
          onClick={handleLike}
          disabled={likeMutation.isPending}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            isLiked ? "text-rose-400" : "text-muted-foreground hover:text-rose-400"
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
          {post.likes.length}
        </button>
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Comment
        </button>
        {post.imageUrl && (
          <a
            href={post.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto"
          >
            <Image className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="space-y-3 pt-2 border-t border-border/40">
          <p className="text-xs text-muted-foreground text-center py-2">No comments yet</p>

          {/* Add comment */}
          <div className="flex gap-2 mt-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-0 h-9 py-2 text-xs resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleComment();
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleComment}
              disabled={commentMutation.isPending || !commentText.trim()}
              className="btn-glow h-9 px-3"
            >
              Post
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
