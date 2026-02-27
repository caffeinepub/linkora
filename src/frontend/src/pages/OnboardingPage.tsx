import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Network, Plus, X, Loader2, ArrowRight } from "lucide-react";
import { useSaveProfile, useAddSkill } from "../hooks/useQueries";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d.ts";

const DEPARTMENTS = [
  "Computer Science", "Electronics", "Mechanical", "Civil",
  "Chemical", "Biotech", "Design", "Management", "Mathematics",
  "Physics", "Chemistry", "Other"
];

const YEARS = ["1", "2", "3", "4"];

const DESIGNATIONS = [
  "Student", "Club Lead", "Project Lead", "Researcher",
  "Intern", "Teaching Assistant", "Freelancer", "Entrepreneur"
];

export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [designation, setDesignation] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const saveProfile = useSaveProfile();
  const addSkill = useAddSkill();

  const addSkillTag = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || skills.includes(trimmed) || skills.length >= 15) return;
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (s: string) => setSkills((prev) => prev.filter((x) => x !== s));

  const handleSubmit = async () => {
    if (!name || !department || !year || !designation) {
      toast.error("Please fill all required fields");
      return;
    }

    const profile: UserProfile = {
      name,
      department,
      year: BigInt(year),
      designation,
      bio,
      avatarUrl: "",
      socialLinks: {},
    };

    try {
      await saveProfile.mutateAsync(profile);
      // Add skills in parallel
      if (skills.length > 0) {
        await Promise.all(skills.map((s) => addSkill.mutateAsync(s)));
      }
      toast.success("Profile created! Welcome to Linkora 🎉");
    } catch {
      toast.error("Failed to create profile. Please try again.");
    }
  };

  const isStep1Valid = name && department && year && designation;
  const isSubmitting = saveProfile.isPending || addSkill.isPending;

  return (
    <div className="min-h-screen bg-background mesh-bg flex items-center justify-center px-4">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 mb-4">
            <Network className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set up your profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Step {step} of 2 — {step === 1 ? "Basic Info" : "Skills"}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-5">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Full Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Department *</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Select dept." />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Year *</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y}>Year {y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Designation *</Label>
                  <Select value={designation} onValueChange={setDesignation}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {DESIGNATIONS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Bio (optional)</Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell your campus community about yourself..."
                    className="bg-muted/50 min-h-20 resize-none"
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
                className="w-full btn-glow"
              >
                Next: Add Skills <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Add your skills (up to 15)</Label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="e.g. React, Machine Learning, Design..."
                    className="bg-muted/50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addSkillTag(); }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSkillTag}
                    disabled={!skillInput.trim() || skills.length >= 15}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="skill-tag cursor-pointer"
                      onClick={() => removeSkill(s)}
                    >
                      {s} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}

              {skills.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No skills added yet. Add at least one to help others discover you.
                </p>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 btn-glow"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    "Launch Profile 🚀"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
