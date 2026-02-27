import { useState } from "react";
import {
  useAllCommunities,
  useJoinCommunity,
  useLeaveCommunity,
  useCreateCommunity,
  useCommunityPosts,
  usePostCommunityMessage,
} from "../hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Plus, ArrowLeft, MessageSquare, Send, Hash, Loader2 } from "lucide-react";
import { PrincipalText } from "../components/PrincipalText";
import { toast } from "sonner";
import type { CommunityView } from "../backend.d.ts";
import type { Principal } from "@icp-sdk/core/principal";

const CATEGORIES = ["Tech", "Science", "Arts", "Sports", "Business", "Gaming", "Music", "Research", "Other"];

const CATEGORY_COLORS: Record<string, string> = {
  Tech: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  Science: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  Arts: "bg-pink-500/15 text-pink-400 border-pink-500/25",
  Sports: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  Business: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Gaming: "bg-green-500/15 text-green-400 border-green-500/25",
  Music: "bg-teal-500/15 text-teal-400 border-teal-500/25",
  Research: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  Other: "bg-muted text-muted-foreground border-border",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS["Other"];
}

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  const diff = Date.now() - ms;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

interface CommunityDetailProps {
  community: CommunityView;
  callerPrincipal?: Principal;
  onBack: () => void;
}

function CommunityDetail({ community, callerPrincipal, onBack }: CommunityDetailProps) {
  const [message, setMessage] = useState("");
  const postsQuery = useCommunityPosts(community.id);
  const postMessage = usePostCommunityMessage();

  const isMember = callerPrincipal
    ? community.members.some((m) => m.toString() === callerPrincipal.toString())
    : false;

  const handleSend = () => {
    if (!message.trim()) return;
    postMessage.mutate(
      { communityId: community.id, content: message.trim() },
      {
        onSuccess: () => {
          setMessage("");
          toast.success("Message sent");
        },
        onError: () => toast.error("Failed to send message"),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-1">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" />
            {community.name}
          </h2>
          <p className="text-xs text-muted-foreground">{community.members.length} members · {community.category}</p>
        </div>
      </div>

      {community.description && (
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">{community.description}</p>
        </div>
      )}

      {/* Posts */}
      <div className="glass-card rounded-xl overflow-hidden">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-3">
            {postsQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (postsQuery.data ?? []).length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              [...(postsQuery.data ?? [])].sort((a, b) => Number(a.timestamp - b.timestamp)).map((post) => (
                <div key={post.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {post.author.toString().slice(0, 2).toUpperCase()}
                  </div>
                  <div className="bg-muted/30 rounded-xl rounded-tl-sm px-3 py-2 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <PrincipalText principal={post.author} length={6} />
                      <span className="text-xs text-muted-foreground/60">{formatTime(post.timestamp)}</span>
                    </div>
                    <p className="text-sm text-foreground/90">{post.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {isMember ? (
          <div className="p-3 border-t border-border/40 flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message the community..."
              className="bg-muted/50"
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleSend(); }
              }}
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={postMessage.isPending || !message.trim()}
              className="btn-glow"
            >
              {postMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        ) : (
          <div className="p-3 border-t border-border/40">
            <p className="text-xs text-center text-muted-foreground">Join this community to post messages</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface CommunitiesPageProps {
  callerPrincipal?: Principal;
}

export function CommunitiesPage({ callerPrincipal }: CommunitiesPageProps) {
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityView | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const communitiesQuery = useAllCommunities();
  const joinCommunity = useJoinCommunity();
  const leaveCommunity = useLeaveCommunity();
  const createCommunity = useCreateCommunity();

  const isMember = (community: CommunityView) =>
    callerPrincipal
      ? community.members.some((m) => m.toString() === callerPrincipal.toString())
      : false;

  const handleJoinLeave = (community: CommunityView) => {
    if (isMember(community)) {
      leaveCommunity.mutate(community.id, {
        onSuccess: () => toast.success(`Left ${community.name}`),
        onError: () => toast.error("Failed to leave community"),
      });
    } else {
      joinCommunity.mutate(community.id, {
        onSuccess: () => toast.success(`Joined ${community.name}!`),
        onError: () => toast.error("Failed to join community"),
      });
    }
  };

  const handleCreate = () => {
    if (!newName.trim() || !newCategory) return;
    createCommunity.mutate(
      { name: newName.trim(), description: newDesc.trim(), category: newCategory },
      {
        onSuccess: () => {
          setNewName("");
          setNewDesc("");
          setNewCategory("");
          setCreateOpen(false);
          toast.success("Community created!");
        },
        onError: () => toast.error("Failed to create community"),
      }
    );
  };

  if (selectedCommunity) {
    return (
      <CommunityDetail
        community={selectedCommunity}
        callerPrincipal={callerPrincipal}
        onBack={() => setSelectedCommunity(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" />
            Communities
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Join groups based on interests and skills</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="btn-glow">
              <Plus className="w-4 h-4 mr-1" /> Create
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Community</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Name *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Community name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is this community about?"
                  className="min-h-20 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Category *</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreate}
                disabled={createCommunity.isPending || !newName.trim() || !newCategory}
                className="w-full btn-glow"
              >
                {createCommunity.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : "Create Community"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {communitiesQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-xl p-4 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (communitiesQuery.data ?? []).length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center space-y-3">
          <Users className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">No communities yet. Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(communitiesQuery.data ?? []).map((community) => {
            const joined = isMember(community);
            return (
              <button
                type="button"
                key={community.id}
                className="glass-card rounded-xl p-4 space-y-3 hover:border-primary/30 transition-colors cursor-pointer text-left w-full"
                onClick={() => setSelectedCommunity(community)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{community.name}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {community.members.length} members
                    </div>
                  </div>
                  <Badge className={`text-xs border ${getCategoryColor(community.category)}`} variant="outline">
                    {community.category}
                  </Badge>
                </div>

                {community.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{community.description}</p>
                )}

                <Button
                  size="sm"
                  variant={joined ? "outline" : "default"}
                  className={`w-full ${!joined ? "btn-glow" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinLeave(community);
                  }}
                  disabled={joinCommunity.isPending || leaveCommunity.isPending}
                >
                  {joined ? "Leave" : "Join"}
                </Button>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
