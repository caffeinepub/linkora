import { useState, useRef } from "react";
import {
  useCallerProfile,
  useSaveProfile,
  useSkills,
  useAddSkill,
  useRemoveSkill,
  useReputation,
  useFollowers,
  useFollowing,
  useGlobalFeed,
  useSubmitReputationReview,
  useFollowUser,
  useUnfollowUser,
} from "../hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "../components/PostCard";
import { ReputationBars, ReputationBadge } from "../components/ReputationBar";
import { PrincipalText } from "../components/PrincipalText";
import {
  Edit2, Plus, X, Star, Users, UserCheck, Loader2, UserPlus, UserMinus,
  Camera, Linkedin, Github, Twitter, Instagram, Globe, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { UserProfile, ReputationScores, SocialLinks } from "../backend.d.ts";
import type { Principal } from "@icp-sdk/core/principal";
import { ExternalBlob } from "../backend";

const DEPARTMENTS = [
  "Computer Science", "Electronics", "Mechanical", "Civil",
  "Chemical", "Biotech", "Design", "Management", "Mathematics",
  "Physics", "Chemistry", "Other"
];

const DESIGNATIONS = [
  "Student", "Club Lead", "Project Lead", "Researcher",
  "Intern", "Teaching Assistant", "Freelancer", "Entrepreneur"
];

interface ProfilePageProps {
  callerPrincipal?: Principal;
  viewingPrincipal?: Principal;
}

function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <Label className="text-muted-foreground">{label}</Label>
        <span className="font-medium text-foreground">{value}/100</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={0}
        max={100}
        step={5}
        className="w-full"
      />
    </div>
  );
}

interface SocialIconProps {
  url: string;
  platform: "linkedin" | "github" | "twitter" | "instagram" | "website";
}

function SocialIcon({ url, platform }: SocialIconProps) {
  const icons = {
    linkedin: <Linkedin className="w-4 h-4" />,
    github: <Github className="w-4 h-4" />,
    twitter: <Twitter className="w-4 h-4" />,
    instagram: <Instagram className="w-4 h-4" />,
    website: <Globe className="w-4 h-4" />,
  };

  const labels = {
    linkedin: "LinkedIn",
    github: "GitHub",
    twitter: "Twitter/X",
    instagram: "Instagram",
    website: "Website",
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={labels[platform]}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted/70 hover:bg-primary/15 text-muted-foreground hover:text-primary border border-border/40 hover:border-primary/30 transition-all duration-200 group"
    >
      {icons[platform]}
      <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

export function ProfilePage({ callerPrincipal, viewingPrincipal }: ProfilePageProps) {
  const targetPrincipal = viewingPrincipal ?? callerPrincipal;
  const isOwnProfile = !viewingPrincipal || viewingPrincipal?.toString() === callerPrincipal?.toString();

  // Profile data
  const profileQuery = useCallerProfile();
  const skillsQuery = useSkills(targetPrincipal);
  const reputationQuery = useReputation(targetPrincipal);
  const followersQuery = useFollowers(targetPrincipal);
  const followingQuery = useFollowing(targetPrincipal);
  const globalFeedQuery = useGlobalFeed();

  // Mutations
  const saveProfile = useSaveProfile();
  const addSkill = useAddSkill();
  const removeSkill = useRemoveSkill();
  const submitReview = useSubmitReputationReview();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editDesig, setEditDesig] = useState("");
  const [editBio, setEditBio] = useState("");
  // Social links edit state
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editTwitter, setEditTwitter] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editWebsite, setEditWebsite] = useState("");

  // Skill state
  const [skillInput, setSkillInput] = useState("");

  // Reputation review state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [revContrib, setRevContrib] = useState(50);
  const [revTeamwork, setRevTeamwork] = useState(50);
  const [revSkillRel, setRevSkillRel] = useState(50);
  const [revReliability, setRevReliability] = useState(50);
  const [revComment, setRevComment] = useState("");

  const profile = profileQuery.data;
  const skills = skillsQuery.data ?? [];
  const reputation = reputationQuery.data ?? [];

  // Posts by this user
  const userPosts = (globalFeedQuery.data ?? []).filter(
    (post) => post.author.toString() === targetPrincipal?.toString()
  );

  const isFollowing = callerPrincipal && followersQuery.data
    ? followersQuery.data.some((f) => f.toString() === callerPrincipal.toString())
    : false;

  const openEdit = () => {
    if (!profile) return;
    setEditName(profile.name);
    setEditDept(profile.department);
    setEditYear(profile.year.toString());
    setEditDesig(profile.designation);
    setEditBio(profile.bio);
    setEditLinkedin(profile.socialLinks?.linkedin ?? "");
    setEditGithub(profile.socialLinks?.github ?? "");
    setEditTwitter(profile.socialLinks?.twitter ?? "");
    setEditInstagram(profile.socialLinks?.instagram ?? "");
    setEditWebsite(profile.socialLinks?.website ?? "");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editName || !editDept || !editYear || !editDesig) {
      toast.error("Fill all required fields");
      return;
    }
    const socialLinks: SocialLinks = {};
    if (editLinkedin.trim()) socialLinks.linkedin = editLinkedin.trim();
    if (editGithub.trim()) socialLinks.github = editGithub.trim();
    if (editTwitter.trim()) socialLinks.twitter = editTwitter.trim();
    if (editInstagram.trim()) socialLinks.instagram = editInstagram.trim();
    if (editWebsite.trim()) socialLinks.website = editWebsite.trim();

    const updated: UserProfile = {
      name: editName,
      department: editDept,
      year: BigInt(editYear),
      designation: editDesig,
      bio: editBio,
      avatarUrl: profile?.avatarUrl ?? "",
      socialLinks,
    };
    saveProfile.mutate(updated, {
      onSuccess: () => { setEditOpen(false); toast.success("Profile updated!"); },
      onError: () => toast.error("Failed to update profile"),
    });
  };

  const handleAvatarUpload = async (file: File) => {
    if (!profile) return;
    setIsUploadingAvatar(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      const url = blob.getDirectURL();
      const updated: UserProfile = {
        ...profile,
        avatarUrl: url,
      };
      await saveProfile.mutateAsync(updated);
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || skills.includes(trimmed) || skills.length >= 15) return;
    addSkill.mutate(trimmed, {
      onSuccess: () => { setSkillInput(""); toast.success(`Added "${trimmed}"`); },
      onError: () => toast.error("Failed to add skill"),
    });
  };

  const handleRemoveSkill = (s: string) => {
    removeSkill.mutate(s, {
      onError: () => toast.error("Failed to remove skill"),
    });
  };

  const handleSubmitReview = () => {
    if (!targetPrincipal) return;
    const scores: ReputationScores = {
      contribution: BigInt(revContrib),
      teamwork: BigInt(revTeamwork),
      skillRelevance: BigInt(revSkillRel),
      reliability: BigInt(revReliability),
    };
    submitReview.mutate(
      { reviewee: targetPrincipal, scores, comment: revComment.trim() },
      {
        onSuccess: () => {
          setReviewOpen(false);
          toast.success("Review submitted!");
          setRevComment("");
        },
        onError: () => toast.error("Failed to submit review"),
      }
    );
  };

  const handleFollowToggle = () => {
    if (!targetPrincipal) return;
    if (isFollowing) {
      unfollowUser.mutate(targetPrincipal, {
        onSuccess: () => toast.success("Unfollowed"),
        onError: () => toast.error("Failed to unfollow"),
      });
    } else {
      followUser.mutate(targetPrincipal, {
        onSuccess: () => toast.success("Following!"),
        onError: () => toast.error("Failed to follow"),
      });
    }
  };

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    );
  }

  const socialLinks = profile?.socialLinks;
  const hasSocialLinks = !!(
    socialLinks?.linkedin ||
    socialLinks?.github ||
    socialLinks?.twitter ||
    socialLinks?.instagram ||
    socialLinks?.website
  );

  return (
    <div className="space-y-5">
      {/* Profile Header */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {/* Avatar with upload */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-primary text-xl font-bold shrink-0">
                {isUploadingAvatar ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span>{profile?.name ? profile.name.slice(0, 2).toUpperCase() : "?"}</span>
                )}
              </div>

              {/* Upload overlay - only on own profile */}
              {isOwnProfile && !isUploadingAvatar && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  aria-label="Upload profile photo"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">{profile?.name ?? "—"}</h2>
              <p className="text-sm text-muted-foreground">
                {profile?.department ?? "—"} · Year {profile?.year?.toString() ?? "—"}
              </p>
              {profile?.designation && (
                <span className="inline-block mt-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/25">
                  {profile.designation}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <ReputationBadge reviews={reputation} />
            {isOwnProfile ? (
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={openEdit}>
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Name *</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Department *</Label>
                        <Select value={editDept} onValueChange={setEditDept}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Year *</Label>
                        <Select value={editYear} onValueChange={setEditYear}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["1", "2", "3", "4"].map((y) => <SelectItem key={y} value={y}>Year {y}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Designation *</Label>
                      <Select value={editDesig} onValueChange={setEditDesig}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Bio</Label>
                      <Textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="min-h-20 resize-none"
                        maxLength={300}
                      />
                    </div>

                    {/* Social Links Section */}
                    <div className="space-y-3 pt-2 border-t border-border/40">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-primary" />
                        Social Links
                      </p>
                      <div className="space-y-2.5">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Linkedin className="w-3 h-3" /> LinkedIn
                          </Label>
                          <Input
                            value={editLinkedin}
                            onChange={(e) => setEditLinkedin(e.target.value)}
                            placeholder="https://linkedin.com/in/yourprofile"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Github className="w-3 h-3" /> GitHub
                          </Label>
                          <Input
                            value={editGithub}
                            onChange={(e) => setEditGithub(e.target.value)}
                            placeholder="https://github.com/yourusername"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Twitter className="w-3 h-3" /> Twitter / X
                          </Label>
                          <Input
                            value={editTwitter}
                            onChange={(e) => setEditTwitter(e.target.value)}
                            placeholder="https://twitter.com/yourhandle"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Instagram className="w-3 h-3" /> Instagram
                          </Label>
                          <Input
                            value={editInstagram}
                            onChange={(e) => setEditInstagram(e.target.value)}
                            placeholder="https://instagram.com/yourhandle"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Website
                          </Label>
                          <Input
                            value={editWebsite}
                            onChange={(e) => setEditWebsite(e.target.value)}
                            placeholder="https://yourwebsite.com"
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveEdit}
                      disabled={saveProfile.isPending}
                      className="w-full btn-glow"
                    >
                      {saveProfile.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                      ) : "Save Changes"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollowToggle}
                  disabled={followUser.isPending || unfollowUser.isPending}
                  className={!isFollowing ? "btn-glow" : ""}
                >
                  {isFollowing ? (
                    <><UserMinus className="w-3.5 h-3.5 mr-1.5" /> Unfollow</>
                  ) : (
                    <><UserPlus className="w-3.5 h-3.5 mr-1.5" /> Follow</>
                  )}
                </Button>

                <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Star className="w-3.5 h-3.5 mr-1.5" /> Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Submit Reputation Review</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <p className="text-sm text-muted-foreground">Rate your collaboration experience with this person</p>
                      <ScoreSlider label="Contribution" value={revContrib} onChange={setRevContrib} />
                      <ScoreSlider label="Teamwork" value={revTeamwork} onChange={setRevTeamwork} />
                      <ScoreSlider label="Skill Relevance" value={revSkillRel} onChange={setRevSkillRel} />
                      <ScoreSlider label="Reliability" value={revReliability} onChange={setRevReliability} />
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Comment (optional)</Label>
                        <Textarea
                          value={revComment}
                          onChange={(e) => setRevComment(e.target.value)}
                          placeholder="Share your experience..."
                          className="min-h-16 resize-none"
                          maxLength={300}
                        />
                      </div>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={submitReview.isPending}
                        className="w-full btn-glow"
                      >
                        {submitReview.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                        ) : "Submit Review"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>

        {profile?.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
        )}

        {/* Social Media Links */}
        {hasSocialLinks && (
          <div className="flex flex-wrap gap-2">
            {socialLinks?.linkedin && (
              <SocialIcon url={socialLinks.linkedin} platform="linkedin" />
            )}
            {socialLinks?.github && (
              <SocialIcon url={socialLinks.github} platform="github" />
            )}
            {socialLinks?.twitter && (
              <SocialIcon url={socialLinks.twitter} platform="twitter" />
            )}
            {socialLinks?.instagram && (
              <SocialIcon url={socialLinks.instagram} platform="instagram" />
            )}
            {socialLinks?.website && (
              <SocialIcon url={socialLinks.website} platform="website" />
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-6 pt-1 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{followersQuery.data?.length ?? 0}</span>
            <span className="text-muted-foreground">followers</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <UserCheck className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{followingQuery.data?.length ?? 0}</span>
            <span className="text-muted-foreground">following</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{reputation.length}</span>
            <span className="text-muted-foreground">reviews</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Skills + Reputation */}
        <div className="lg:col-span-2 space-y-4">
          {/* Skills */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Skills</h3>
              <span className="text-xs text-muted-foreground">{skills.length}/15</span>
            </div>

            {skillsQuery.isLoading ? (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-6 w-20 rounded-full" />)}
              </div>
            ) : skills.length === 0 ? (
              <p className="text-xs text-muted-foreground">No skills added yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="skill-tag">
                    {s}
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="ml-1 hover:text-destructive transition-colors"
                        aria-label={`Remove skill ${s}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}

            {isOwnProfile && skills.length < 15 && (
              <div className="flex gap-2 pt-1">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add a skill..."
                  className="h-8 text-xs bg-muted/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleAddSkill(); }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={handleAddSkill}
                  disabled={!skillInput.trim() || addSkill.isPending}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Reputation */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Star className="w-4 h-4 text-primary" />
                Reputation
              </h3>
              <span className="text-xs text-muted-foreground">{reputation.length} reviews</span>
            </div>
            {reputationQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : reputation.length === 0 ? (
              <p className="text-xs text-muted-foreground">No reputation data yet</p>
            ) : (
              <ReputationBars reviews={reputation} />
            )}
          </div>
        </div>

        {/* Right: Posts */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Posts</h3>
          {globalFeedQuery.isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="glass-card rounded-xl p-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : userPosts.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} callerPrincipal={callerPrincipal} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
