import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";



actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Types
  public type SocialLinks = {
    linkedin : ?Text;
    github : ?Text;
    twitter : ?Text;
    instagram : ?Text;
    website : ?Text;
  };

  public type UserProfile = {
    name : Text;
    department : Text;
    year : Nat;
    designation : Text;
    bio : Text;
    avatarUrl : Text;
    socialLinks : SocialLinks;
  };

  public type ReputationScores = {
    contribution : Nat;
    teamwork : Nat;
    skillRelevance : Nat;
    reliability : Nat;
  };

  public type ReputationReview = {
    reviewer : Principal;
    reviewee : Principal;
    scores : ReputationScores;
    comment : Text;
    timestamp : Time.Time;
  };

  public type Community = {
    id : Text;
    name : Text;
    description : Text;
    category : Text;
    members : Set.Set<Principal>;
  };

  public type CommunityView = {
    id : Text;
    name : Text;
    description : Text;
    category : Text;
    members : [Principal];
  };

  public type CommunityPost = {
    id : Text;
    author : Principal;
    content : Text;
    timestamp : Time.Time;
  };

  public type Event = {
    id : Text;
    title : Text;
    description : Text;
    date : Time.Time;
    tags : [Text];
    maxParticipants : Nat;
    organizer : Principal;
  };

  public type Post = {
    id : Text;
    author : Principal;
    content : Text;
    imageUrl : ?Text;
    timestamp : Time.Time;
    likes : List.List<Principal>;
  };

  public type PostView = {
    id : Text;
    author : Principal;
    content : Text;
    imageUrl : ?Text;
    timestamp : Time.Time;
    likes : [Principal];
  };

  public type Comment = {
    id : Text;
    author : Principal;
    content : Text;
    timestamp : Time.Time;
  };

  public type FollowerData = {
    followers : List.List<Principal>;
    following : List.List<Principal>;
  };

  // Storage
  let userProfiles = Map.empty<Principal, UserProfile>();
  let userSkills = Map.empty<Principal, List.List<Text>>();
  let reputationReviews = Map.empty<Principal, List.List<ReputationReview>>();
  let communities = Map.empty<Text, Community>();
  let communityPosts = Map.empty<Text, List.List<CommunityPost>>();
  let events = Map.empty<Text, Event>();
  let eventApplications = Map.empty<Text, List.List<Principal>>();
  let posts = Map.empty<Text, Post>();
  let comments = Map.empty<Text, List.List<Comment>>();
  let followers = Map.empty<Principal, FollowerData>();

  // User Profiles
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access this endpoint");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access this endpoint");
    };
    userProfiles.add(caller, profile);
    if (not followers.containsKey(caller)) {
      let emptyList = List.empty<Principal>();
      followers.add(caller, { followers = emptyList; following = emptyList });
    };
  };

  public shared ({ caller }) func createOrUpdateProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access this endpoint");
    };
    userProfiles.add(caller, profile);
    if (not followers.containsKey(caller)) {
      let emptyList = List.empty<Principal>();
      followers.add(caller, { followers = emptyList; following = emptyList });
    };
  };

  // Skills
  public shared ({ caller }) func addSkill(skill : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access this endpoint");
    };
    let skills = switch (userSkills.get(caller)) {
      case (null) {
        let newList = List.empty<Text>();
        newList;
      };
      case (?existing) { existing };
    };
    if (skills.find(func(s) { s == skill }) == null) {
      skills.add(skill);
      userSkills.add(caller, skills);
    };
  };

  public shared ({ caller }) func removeSkill(skill : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access this endpoint");
    };
    switch (userSkills.get(caller)) {
      case (null) { () };
      case (?skills) {
        let filtered = skills.filter(func(s) { s != skill });
        userSkills.add(caller, filtered);
      };
    };
  };

  public query ({ caller }) func getSkills(user : Principal) : async [Text] {
    switch (userSkills.get(user)) {
      case (null) { [] };
      case (?skills) { skills.toArray() };
    };
  };

  // Reputation
  public shared ({ caller }) func submitReputationReview(reviewee : Principal, scores : ReputationScores, comment : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access this endpoint");
    };
    if (caller == reviewee) {
      Runtime.trap("Cannot review yourself");
    };
    let review : ReputationReview = {
      reviewer = caller;
      reviewee = reviewee;
      scores = scores;
      comment = comment;
      timestamp = Time.now();
    };
    let reviews = switch (reputationReviews.get(reviewee)) {
      case (null) {
        let newList = List.empty<ReputationReview>();
        newList;
      };
      case (?existing) { existing };
    };
    reviews.add(review);
    reputationReviews.add(reviewee, reviews);
  };

  public query ({ caller }) func getReputation(user : Principal) : async [ReputationReview] {
    switch (reputationReviews.get(user)) {
      case (null) { [] };
      case (?reviews) { reviews.toArray() };
    };
  };

  // Teammate Discovery
  public query ({ caller }) func searchBySkill(skill : Text) : async [(UserProfile, [Text], [ReputationReview])] {
    let results = List.empty<(UserProfile, [Text], [ReputationReview])>();
    for ((user, skills) in userSkills.entries()) {
      if (skills.any(func(s) { s == skill })) {
        switch (userProfiles.get(user)) {
          case (null) { () };
          case (?profile) {
            let userSkillsArray = skills.toArray();
            let userReviewsArray = switch (reputationReviews.get(user)) {
              case (null) { [] };
              case (?reviews) { reviews.toArray() };
            };
            results.add((profile, userSkillsArray, userReviewsArray));
          };
        };
      };
    };
    results.toArray();
  };

  // Communities
  public shared ({ caller }) func createCommunity(id : Text, name : Text, description : Text, category : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create communities");
    };
    if (communities.containsKey(id)) {
      Runtime.trap("Community already exists");
    };
    let community : Community = {
      id;
      name;
      description;
      category;
      members = Set.empty<Principal>();
    };
    communities.add(id, community);
    communityPosts.add(id, List.empty<CommunityPost>());
  };

  public shared ({ caller }) func joinCommunity(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join communities");
    };
    switch (communities.get(id)) {
      case (null) { Runtime.trap("Community not found") };
      case (?community) {
        let currentMembers = community.members;
        if (currentMembers.contains(caller)) {
          Runtime.trap("Already a member");
        };
        currentMembers.add(caller);
        communities.add(
          id,
          {
            community with
            members = currentMembers
          },
        );
      };
    };
  };

  public shared ({ caller }) func leaveCommunity(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can leave communities");
    };
    switch (communities.get(id)) {
      case (null) { Runtime.trap("Community not found") };
      case (?community) {
        let currentMembers = community.members;
        if (not currentMembers.contains(caller)) {
          Runtime.trap("Not a member");
        };
        currentMembers.remove(caller);
        communities.add(
          id,
          {
            community with
            members = currentMembers
          },
        );
      };
    };
  };

  public shared ({ caller }) func postCommunityMessage(communityId : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can post messages");
    };
    switch (communities.get(communityId)) {
      case (null) { Runtime.trap("Community not found") };
      case (?community) {
        // Verify caller is a member
        if (not community.members.contains(caller)) {
          Runtime.trap("Must be a member to post");
        };
        let post : CommunityPost = {
          id = Time.now().toText();
          author = caller;
          content;
          timestamp = Time.now();
        };
        let currentPosts = switch (communityPosts.get(communityId)) {
          case (null) { List.empty<CommunityPost>() };
          case (?posts) { posts };
        };
        currentPosts.add(post);
        communityPosts.add(communityId, currentPosts);
      };
    };
  };

  public query ({ caller }) func getAllCommunities() : async [CommunityView] {
    // Anyone can view communities (public information)
    communities.values().toArray().map(func(c) { communityToView(c) });
  };

  public query ({ caller }) func getCommunityPosts(id : Text) : async [CommunityPost] {
    // Anyone can view community posts (public information)
    switch (communityPosts.get(id)) {
      case (null) { [] };
      case (?posts) { posts.toArray() };
    };
  };

  // Events
  public shared ({ caller }) func createEvent(id : Text, title : Text, description : Text, date : Time.Time, tags : [Text], maxParticipants : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create events");
    };
    if (events.containsKey(id)) {
      Runtime.trap("Event already exists");
    };
    let event : Event = {
      id;
      title;
      description;
      date;
      tags;
      maxParticipants;
      organizer = caller;
    };
    events.add(id, event);
    eventApplications.add(id, List.empty<Principal>());
  };

  public shared ({ caller }) func applyToEvent(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can apply to events");
    };
    switch (events.get(id)) {
      case (null) { Runtime.trap("Event not found") };
      case (?event) {
        if (event.organizer == caller) {
          Runtime.trap("Organizer cannot apply to their own event");
        };
        let currentApplicants = switch (eventApplications.get(id)) {
          case (null) { List.empty<Principal>() };
          case (?apps) { apps };
        };
        for (applicant in currentApplicants.values()) {
          if (applicant == caller) {
            Runtime.trap("Already applied");
          };
        };
        currentApplicants.add(caller);
        eventApplications.add(id, currentApplicants);
      };
    };
  };

  public shared ({ caller }) func approveApplication(eventId : Text, applicant : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can approve applications");
    };
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?event) {
        if (event.organizer != caller) {
          Runtime.trap("Only organizer can approve applications");
        };
        let currentApplicants = switch (eventApplications.get(eventId)) {
          case (null) { List.empty<Principal>() };
          case (?apps) { apps };
        };
        let filtered = currentApplicants.filter(func(p : Principal) : Bool { p != applicant });
        eventApplications.add(eventId, filtered);
      };
    };
  };

  public shared ({ caller }) func rejectApplication(eventId : Text, applicant : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reject applications");
    };
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?event) {
        if (event.organizer != caller) {
          Runtime.trap("Only organizer can reject applications");
        };
        let currentApplicants = switch (eventApplications.get(eventId)) {
          case (null) { List.empty<Principal>() };
          case (?apps) { apps };
        };
        let filtered = currentApplicants.filter(func(p : Principal) : Bool { p != applicant });
        eventApplications.add(eventId, filtered);
      };
    };
  };

  public query ({ caller }) func getAllEvents() : async [Event] {
    // Anyone can view events (public information)
    events.values().toArray();
  };

  public query ({ caller }) func getEventApplications(eventId : Text) : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view applications");
    };
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?event) {
        // Only organizer can view applications
        if (event.organizer != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Only organizer can view applications");
        };
        switch (eventApplications.get(eventId)) {
          case (null) { [] };
          case (?apps) { apps.toArray() };
        };
      };
    };
  };

  // Social Posts and Feed
  public shared ({ caller }) func createPost(id : Text, content : Text, imageUrl : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };
    let post : Post = {
      id;
      author = caller;
      content;
      imageUrl;
      timestamp = Time.now();
      likes = List.empty<Principal>();
    };
    posts.add(id, post);
    comments.add(id, List.empty<Comment>());
  };

  public shared ({ caller }) func commentOnPost(postId : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can comment");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?_) {
        let comment : Comment = {
          id = Time.now().toText();
          author = caller;
          content;
          timestamp = Time.now();
        };
        let currentComments = switch (comments.get(postId)) {
          case (null) { List.empty<Comment>() };
          case (?c) { c };
        };
        currentComments.add(comment);
        comments.add(postId, currentComments);
      };
    };
  };

  public shared ({ caller }) func likePost(postId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like posts");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        for (liker in post.likes.values()) {
          if (liker == caller) {
            Runtime.trap("Already liked");
          };
        };
        post.likes.add(caller);
        posts.add(postId, post);
      };
    };
  };

  public query ({ caller }) func getGlobalFeed() : async [PostView] {
    // Anyone can view global feed (public information)
    posts.values().toArray().map(func(p) { postToPostView(p) });
  };

  public query ({ caller }) func getPersonalizedFeed() : async [PostView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view personalized feed");
    };
    let followingList = switch (followers.get(caller)) {
      case (null) { List.empty<Principal>() };
      case (?f) { f.following };
    };
    let results = List.empty<Post>();
    for ((_, post) in posts.entries()) {
      var isFollowing = false;
      for (followed in followingList.values()) {
        if (post.author == followed) {
          isFollowing := true;
        };
      };
      if (isFollowing or post.author == caller) {
        results.add(post);
      };
    };
    results.toArray().map(func(p) { postToPostView(p) });
  };

  public shared ({ caller }) func followUser(userToFollow : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };
    if (userToFollow == caller) {
      Runtime.trap("Cannot follow yourself");
    };
    let targetFollowers = switch (followers.get(userToFollow)) {
      case (null) {
        let newFollowers : FollowerData = {
          followers = List.empty<Principal>();
          following = List.empty<Principal>();
        };
        followers.add(userToFollow, newFollowers);
        newFollowers;
      };
      case (?f) { f };
    };
    for (follower in targetFollowers.followers.values()) {
      if (follower == caller) {
        Runtime.trap("Already following");
      };
    };
    targetFollowers.followers.add(caller);
    followers.add(userToFollow, targetFollowers);

    let callerFollowers = switch (followers.get(caller)) {
      case (null) {
        let newFollowers : FollowerData = {
          followers = List.empty<Principal>();
          following = List.empty<Principal>();
        };
        followers.add(caller, newFollowers);
        newFollowers;
      };
      case (?f) { f };
    };
    callerFollowers.following.add(userToFollow);
    followers.add(caller, callerFollowers);
  };

  public shared ({ caller }) func unfollowUser(userToUnfollow : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };
    switch (followers.get(userToUnfollow)) {
      case (null) { Runtime.trap("User not found") };
      case (?targetFollowers) {
        let filteredFollowers = targetFollowers.followers.filter(func(p : Principal) : Bool { p != caller });
        followers.add(
          userToUnfollow,
          {
            targetFollowers with
            followers = filteredFollowers
          },
        );
      };
    };
    switch (followers.get(caller)) {
      case (null) { Runtime.trap("Caller data not found") };
      case (?callerFollowers) {
        let filteredFollowing = callerFollowers.following.filter(func(p : Principal) : Bool { p != userToUnfollow });
        followers.add(
          caller,
          {
            callerFollowers with
            following = filteredFollowing
          },
        );
      };
    };
  };

  public query ({ caller }) func getFollowers(user : Principal) : async [Principal] {
    // Anyone can view followers (public information)
    switch (followers.get(user)) {
      case (null) { [] };
      case (?f) { f.followers.toArray() };
    };
  };

  public query ({ caller }) func getFollowing(user : Principal) : async [Principal] {
    // Anyone can view following (public information)
    switch (followers.get(user)) {
      case (null) { [] };
      case (?f) { f.following.toArray() };
    };
  };

  // Helper functions for type transformations
  func communityToView(community : Community) : CommunityView {
    {
      community with
      members = community.members.toArray();
    };
  };

  func postToPostView(post : Post) : PostView {
    {
      post with
      likes = post.likes.toArray();
    };
  };
};
