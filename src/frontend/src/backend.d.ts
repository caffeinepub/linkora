import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CommunityView {
    id: string;
    members: Array<Principal>;
    name: string;
    description: string;
    category: string;
}
export interface CommunityPost {
    id: string;
    content: string;
    author: Principal;
    timestamp: Time;
}
export type Time = bigint;
export interface PostView {
    id: string;
    content: string;
    author: Principal;
    likes: Array<Principal>;
    imageUrl?: string;
    timestamp: Time;
}
export interface SocialLinks {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
    github?: string;
}
export interface ReputationReview {
    scores: ReputationScores;
    comment: string;
    timestamp: Time;
    reviewee: Principal;
    reviewer: Principal;
}
export interface Event {
    id: string;
    organizer: Principal;
    title: string;
    date: Time;
    tags: Array<string>;
    description: string;
    maxParticipants: bigint;
}
export interface ReputationScores {
    teamwork: bigint;
    skillRelevance: bigint;
    reliability: bigint;
    contribution: bigint;
}
export interface UserProfile {
    bio: string;
    socialLinks: SocialLinks;
    name: string;
    designation: string;
    year: bigint;
    avatarUrl: string;
    department: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addSkill(skill: string): Promise<void>;
    applyToEvent(id: string): Promise<void>;
    approveApplication(eventId: string, applicant: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    commentOnPost(postId: string, content: string): Promise<void>;
    createCommunity(id: string, name: string, description: string, category: string): Promise<void>;
    createEvent(id: string, title: string, description: string, date: Time, tags: Array<string>, maxParticipants: bigint): Promise<void>;
    createOrUpdateProfile(profile: UserProfile): Promise<void>;
    createPost(id: string, content: string, imageUrl: string | null): Promise<void>;
    followUser(userToFollow: Principal): Promise<void>;
    getAllCommunities(): Promise<Array<CommunityView>>;
    getAllEvents(): Promise<Array<Event>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommunityPosts(id: string): Promise<Array<CommunityPost>>;
    getEventApplications(eventId: string): Promise<Array<Principal>>;
    getFollowers(user: Principal): Promise<Array<Principal>>;
    getFollowing(user: Principal): Promise<Array<Principal>>;
    getGlobalFeed(): Promise<Array<PostView>>;
    getPersonalizedFeed(): Promise<Array<PostView>>;
    getReputation(user: Principal): Promise<Array<ReputationReview>>;
    getSkills(user: Principal): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinCommunity(id: string): Promise<void>;
    leaveCommunity(id: string): Promise<void>;
    likePost(postId: string): Promise<void>;
    postCommunityMessage(communityId: string, content: string): Promise<void>;
    rejectApplication(eventId: string, applicant: Principal): Promise<void>;
    removeSkill(skill: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchBySkill(skill: string): Promise<Array<[UserProfile, Array<string>, Array<ReputationReview>]>>;
    submitReputationReview(reviewee: Principal, scores: ReputationScores, comment: string): Promise<void>;
    unfollowUser(userToUnfollow: Principal): Promise<void>;
}
