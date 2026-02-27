import { useState } from "react";
import {
  usePersonalizedFeed,
  useAllEvents,
  useFollowers,
  useFollowing,
  useReputation,
  useCreatePost,
} from "../hooks/useQueries";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Star, Users, UserCheck, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { computeAvgReputation } from "../components/ReputationBar";
import type { Principal } from "@icp-sdk/core/principal";

function formatEventDate(date: bigint): string {
  const ms = Number(date / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface DashboardPageProps {
  callerPrincipal?: Principal;
}

export function DashboardPage({ callerPrincipal }: DashboardPageProps) {
  const [postContent, setPostContent] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [createPostOpen, setCreatePostOpen] = useState(false);

  const feedQuery = usePersonalizedFeed();
  const eventsQuery = useAllEvents();
  const followersQuery = useFollowers(callerPrincipal);
  const followingQuery = useFollowing(callerPrincipal);
  const reputationQuery = useReputation(callerPrincipal);
  const createPost = useCreatePost();

  const avgRep = computeAvgReputation(reputationQuery.data ?? []);

  const handleCreatePost = () => {
    if (!postContent.trim()) return;
    createPost.mutate(
      { content: postContent.trim(), imageUrl: postImageUrl.trim() || undefined },
      {
        onSuccess: () => {
          setPostContent("");
          setPostImageUrl("");
          setCreatePostOpen(false);
          toast.success("Post created!");
        },
        onError: () => toast.error("Failed to create post"),
      }
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Feed */}
      <div className="lg:col-span-2 space-y-4">
        {/* Create Post Button */}
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="flex-1">
            <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="w-full text-left text-sm text-muted-foreground px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  Share something with your network...
                </button>
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
                    ) : "Post"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="btn-glow shrink-0">
                <Plus className="w-4 h-4 mr-1" /> Post
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Feed */}
        {feedQuery.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : feedQuery.data?.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center space-y-3">
            <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Your feed is empty. Follow people or check the Global Feed.</p>
          </div>
        ) : (
          <div className="space-y-4">
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

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Quick Stats */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Your Stats</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary">
                <Users className="w-4 h-4" />
                {followersQuery.data?.length ?? "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Followers</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary">
                <UserCheck className="w-4 h-4" />
                {followingQuery.data?.length ?? "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Following</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary">
                <Star className="w-4 h-4" />
                {avgRep > 0 ? avgRep : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Reputation</p>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Upcoming Events</h3>
          </div>
          {eventsQuery.isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (eventsQuery.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No events yet</p>
          ) : (
            <div className="space-y-2">
              {(eventsQuery.data ?? []).slice(0, 4).map((evt) => (
                <div key={evt.id} className="rounded-lg bg-muted/30 p-2.5 space-y-1">
                  <p className="text-xs font-medium text-foreground line-clamp-1">{evt.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">{formatEventDate(evt.date)}</span>
                    {evt.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs py-0 px-1.5">{tag}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
