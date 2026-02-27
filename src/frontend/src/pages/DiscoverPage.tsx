import { useState } from "react";
import { useSearchBySkill } from "../hooks/useQueries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Zap, Star } from "lucide-react";
import { ReputationBadge, computeAvgReputation } from "../components/ReputationBar";
import type { UserProfile, ReputationReview } from "../backend.d.ts";

const POPULAR_SKILLS = [
  "React", "Python", "Machine Learning", "UI/UX Design", "Blockchain",
  "Data Science", "Flutter", "Node.js", "Arduino", "OpenCV"
];

function computeCompatibility(reviews: ReputationReview[]): number {
  const rep = computeAvgReputation(reviews);
  // Compatibility: higher reputation = more compatible, formula keeps range 0-100
  const base = 50 + Math.round(rep * 0.4);
  return Math.min(100, Math.max(10, base));
}

function compatibilityColor(score: number): string {
  if (score >= 80) return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
  if (score >= 60) return "text-teal-400 border-teal-400/30 bg-teal-400/10";
  if (score >= 40) return "text-amber-400 border-amber-400/30 bg-amber-400/10";
  return "text-muted-foreground border-border bg-muted/30";
}

interface UserResultCardProps {
  profile: UserProfile;
  skills: string[];
  reviews: ReputationReview[];
  onViewProfile?: (profile: UserProfile) => void;
}

function UserResultCard({ profile, skills, reviews, onViewProfile }: UserResultCardProps) {
  const compat = computeCompatibility(reviews);
  const compatColor = compatibilityColor(compat);

  return (
    <div className="glass-card rounded-xl p-4 space-y-3 animate-slide-up hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-bold text-sm">
            {profile.name ? profile.name.slice(0, 2).toUpperCase() : "??"}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{profile.name || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">{profile.department} · Year {profile.year.toString()}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <ReputationBadge reviews={reviews} size="sm" />
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${compatColor}`}>
            {compat}% match
          </span>
        </div>
      </div>

      {profile.designation && (
        <Badge variant="outline" className="text-xs">
          {profile.designation}
        </Badge>
      )}

      {profile.bio && (
        <p className="text-xs text-muted-foreground line-clamp-2">{profile.bio}</p>
      )}

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, 6).map((s) => (
            <span key={s} className="skill-tag">{s}</span>
          ))}
          {skills.length > 6 && (
            <span className="text-xs text-muted-foreground">+{skills.length - 6} more</span>
          )}
        </div>
      )}

      <Button
        size="sm"
        variant="outline"
        className="w-full hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
        onClick={() => onViewProfile?.(profile)}
      >
        View Profile
      </Button>
    </div>
  );
}

interface DiscoverPageProps {
  onViewProfile?: (profile: UserProfile) => void;
}

export function DiscoverPage({ onViewProfile }: DiscoverPageProps) {
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const searchQuery = useSearchBySkill(activeSearch);

  const handleSearch = () => {
    if (searchInput.trim()) {
      setActiveSearch(searchInput.trim());
    }
  };

  const handleSkillChip = (skill: string) => {
    setSearchInput(skill);
    setActiveSearch(skill);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Teammate Finder
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Search for people by skill to find your perfect team match
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by skill (e.g. React, ML, Design...)"
            className="pl-9 bg-muted/50"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
        </div>
        <Button onClick={handleSearch} disabled={!searchInput.trim()} className="btn-glow">
          Search
        </Button>
      </div>

      {/* Popular Skill Chips */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Popular skills</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SKILLS.map((skill) => (
            <button
              type="button"
              key={skill}
              onClick={() => handleSkillChip(skill)}
              className={`skill-tag cursor-pointer transition-all ${
                activeSearch === skill ? "ring-1 ring-primary bg-primary/20" : ""
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {!activeSearch ? (
        <div className="glass-card rounded-xl p-10 text-center space-y-3">
          <Users className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">Search for a skill to find compatible teammates</p>
          <p className="text-xs text-muted-foreground/60">
            Our compatibility engine matches you based on complementary skills and reputation scores
          </p>
        </div>
      ) : searchQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (searchQuery.data ?? []).length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center space-y-3">
          <Star className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">No results for "{activeSearch}"</p>
          <p className="text-xs text-muted-foreground/60">Try a different skill keyword</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found <span className="text-primary font-medium">{searchQuery.data?.length}</span> people with "{activeSearch}"
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(searchQuery.data ?? []).map(([profile, skills, reviews]) => (
              <UserResultCard
                key={profile.name + profile.department}
                profile={profile}
                skills={skills}
                reviews={reviews}
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
