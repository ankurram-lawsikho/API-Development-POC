const CommonTypes = `
  scalar DateTime
  scalar Upload

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  input PaginationInput {
    first: Int
    last: Int
    after: String
    before: String
  }

  # Filter inputs
  input UserFilters {
    search: String
    role: UserRole
    isActive: Boolean
  }

  input PostFilters {
    search: String
    status: PostStatus
    authorId: ID
    tagIds: [ID!]
    published: Boolean
  }

  input TagFilters {
    search: String
    popular: Boolean
  }

  # Response types
  type SuccessResponse {
    success: Boolean!
    message: String
  }

  type Query {
    # Health check
    health: String!
    
    # User queries
    user(id: ID!): User
    users(first: Int, after: String, filters: UserFilters): UserConnection
    me: User
    
    # Post queries
    posts(first: Int, after: String, filters: PostFilters): PostConnection
    post(id: ID!): Post
    postBySlug(slug: String!): Post
    
    # Comment queries
    comments(postId: ID!, first: Int, after: String): CommentConnection
    comment(id: ID!): Comment
    
    # Tag queries
    tags(first: Int, after: String, filters: TagFilters): TagConnection
    tag(id: ID!): Tag
    tagBySlug(slug: String!): Tag
    popularTags(limit: Int = 10): [Tag!]!
  }

  type Mutation {
    # User mutations
    register(input: CreateUserInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    updateProfile(input: UpdateUserInput!): User!
    changePassword(input: ChangePasswordInput!): SuccessResponse!
    deactivateAccount: SuccessResponse!
    
    # Post mutations
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, input: UpdatePostInput!): Post!
    deletePost(id: ID!): SuccessResponse!
    publishPost(id: ID!): Post!
    unpublishPost(id: ID!): Post!
    
    # Comment mutations
    createComment(input: CreateCommentInput!): Comment!
    updateComment(id: ID!, input: UpdateCommentInput!): Comment!
    deleteComment(id: ID!): SuccessResponse!
    approveComment(id: ID!): Comment!
    rejectComment(id: ID!): Comment!
    
    # Tag mutations
    createTag(input: CreateTagInput!): Tag!
    updateTag(id: ID!, input: UpdateTagInput!): Tag!
    deleteTag(id: ID!): SuccessResponse!
  }

  type Subscription {
    # Placeholder for subscriptions
    _empty: String
  }
`;

module.exports = CommonTypes;
