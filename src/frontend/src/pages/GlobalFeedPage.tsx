import { useState } from "react";
import { useGlobalFeed, useCreatePost } from "../hooks/useQueries";
import { PostCard } from "../components/PostCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Globe, Loader2, Radio } from "lucide-react";
import { toast } from "sonner";
import type { Principal } from "@icp-sdk/core/principal";

interface GlobalFeedPageProps {
  callerPrincipal?: Principal;
}

export function GlobalFeedPage({ callerPrincipal }: GlobalFeedPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");

  const feedQuery = useGlobalFeed();
  const createPost = useCreatePost();

  const handleCreatePost = () => {
    if (!postContent.trim()) return;
    createPost.mutate(
      { content: postContent.trim(), imageUrl: postImageUrl.trim() || undefined },
      {
        onSuccess: () => {
          setPostContent("");
          setPostImageUrl("");
          setCreateOpen(false);
          toast.success("Post created!");
        },
        onError: () => toast.error("Failed to create post"),
      }
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Global Feed
          </h2>
          <p className="text-sm text-muted-foreground mt-1">See what the entire campus is talking about</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="btn-glow">
              <Plus className="w-4 h-4 mr-1" /> Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-28 resize-none"
                maxLength={1000}
              />
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Image URL (optional)</Label>
                <Input
                  value={postImageUrl}
                  onChange={(e) => setPostImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <Button
                onClick={handleCreatePost}
                disabled={createPost.isPending || !postContent.trim()}
                className="w-full btn-glow"
              >
                {createPost.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...</>
                ) : "Post to Global Feed"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Radio className="w-3 h-3 text-primary animate-pulse" />
        <span>Live campus feed</span>
        {feedQuery.data && (
          <span>· {feedQuery.data.length} posts</span>
        )}
      </div>

      {/* Feed */}
      {feedQuery.isLoading ? (
        <div className="space-y-4 max-w-2xl">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (feedQuery.data ?? []).length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center space-y-3 max-w-2xl">
          <Globe className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {(feedQuery.data ?? []).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              callerPrincipal={callerPrincipal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
