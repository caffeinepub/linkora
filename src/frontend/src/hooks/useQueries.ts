import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type {
  UserProfile,
  ReputationScores,
  CommunityView,
  CommunityPost,
  Event,
  PostView,
  ReputationReview,
} from "../backend.d.ts";
import type { Principal } from "@icp-sdk/core/principal";

// ─── Profile Queries ────────────────────────────────────────────────────────

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile(user: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return null;
      return actor.getUserProfile(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

// ─── Skills ─────────────────────────────────────────────────────────────────

export function useSkills(user: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["skills", user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return actor.getSkills(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useAddSkill() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (skill: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.addSkill(skill);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}

export function useRemoveSkill() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (skill: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.removeSkill(skill);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}

// ─── Reputation ──────────────────────────────────────────────────────────────

export function useReputation(user: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<ReputationReview[]>({
    queryKey: ["reputation", user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return actor.getReputation(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useSubmitReputationReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reviewee,
      scores,
      comment,
    }: {
      reviewee: Principal;
      scores: ReputationScores;
      comment: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.submitReputationReview(reviewee, scores, comment);
    },
    onSuccess: (_data, { reviewee }) => {
      queryClient.invalidateQueries({ queryKey: ["reputation", reviewee.toString()] });
    },
  });
}

// ─── Feed ────────────────────────────────────────────────────────────────────

export function useGlobalFeed() {
  const { actor, isFetching } = useActor();
  return useQuery<PostView[]>({
    queryKey: ["globalFeed"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGlobalFeed();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePersonalizedFeed() {
  const { actor, isFetching } = useActor();
  return useQuery<PostView[]>({
    queryKey: ["personalizedFeed"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPersonalizedFeed();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      content,
      imageUrl,
    }: {
      content: string;
      imageUrl?: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      await actor.createPost(id, content, imageUrl ?? null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalFeed"] });
      queryClient.invalidateQueries({ queryKey: ["personalizedFeed"] });
    },
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.likePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalFeed"] });
      queryClient.invalidateQueries({ queryKey: ["personalizedFeed"] });
    },
  });
}

export function useCommentOnPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.commentOnPost(postId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalFeed"] });
      queryClient.invalidateQueries({ queryKey: ["personalizedFeed"] });
    },
  });
}

// ─── Communities ─────────────────────────────────────────────────────────────

export function useAllCommunities() {
  const { actor, isFetching } = useActor();
  return useQuery<CommunityView[]>({
    queryKey: ["communities"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCommunities();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCommunityPosts(communityId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<CommunityPost[]>({
    queryKey: ["communityPosts", communityId],
    queryFn: async () => {
      if (!actor || !communityId) return [];
      return actor.getCommunityPosts(communityId);
    },
    enabled: !!actor && !isFetching && !!communityId,
  });
}

export function useJoinCommunity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.joinCommunity(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
}

export function useLeaveCommunity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.leaveCommunity(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
}

export function useCreateCommunity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
      category,
    }: {
      name: string;
      description: string;
      category: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      await actor.createCommunity(id, name, description, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
}

export function usePostCommunityMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      communityId,
      content,
    }: {
      communityId: string;
      content: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.postCommunityMessage(communityId, content);
    },
    onSuccess: (_data, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts", communityId] });
    },
  });
}

// ─── Events ──────────────────────────────────────────────────────────────────

export function useAllEvents() {
  const { actor, isFetching } = useActor();
  return useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEvents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useEventApplications(eventId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ["eventApplications", eventId],
    queryFn: async () => {
      if (!actor || !eventId) return [];
      return actor.getEventApplications(eventId);
    },
    enabled: !!actor && !isFetching && !!eventId,
  });
}

export function useApplyToEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.applyToEvent(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useCreateEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      date,
      tags,
      maxParticipants,
    }: {
      title: string;
      description: string;
      date: bigint;
      tags: string[];
      maxParticipants: bigint;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      await actor.createEvent(id, title, description, date, tags, maxParticipants);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useApproveApplication() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      applicant,
    }: {
      eventId: string;
      applicant: Principal;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.approveApplication(eventId, applicant);
    },
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["eventApplications", eventId] });
    },
  });
}

export function useRejectApplication() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      applicant,
    }: {
      eventId: string;
      applicant: Principal;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.rejectApplication(eventId, applicant);
    },
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["eventApplications", eventId] });
    },
  });
}

// ─── Social Graph ────────────────────────────────────────────────────────────

export function useFollowers(user: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ["followers", user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return actor.getFollowers(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useFollowing(user: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ["following", user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return actor.getFollowing(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userToFollow: Principal) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.followUser(userToFollow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userToUnfollow: Principal) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.unfollowUser(userToUnfollow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });
}

// ─── Discover ────────────────────────────────────────────────────────────────

export function useSearchBySkill(skill: string) {
  const { actor, isFetching } = useActor();
  return useQuery<[UserProfile, string[], ReputationReview[]][]>({
    queryKey: ["searchBySkill", skill],
    queryFn: async () => {
      if (!actor || !skill) return [];
      return actor.searchBySkill(skill);
    },
    enabled: !!actor && !isFetching && skill.length > 0,
  });
}
