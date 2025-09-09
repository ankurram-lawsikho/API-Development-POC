const PostType = `
  type Post {
    id: ID!
    title: String!
    content: String!
    slug: String!
    excerpt: String
    featuredImage: String
    status: PostStatus!
    publishedAt: DateTime
    author: User!
    authorId: ID!
    tags: [Tag!]!
    comments: [Comment!]!
    viewCount: Int!
    likeCount: Int!
    commentCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  input CreatePostInput {
    title: String!
    content: String!
    excerpt: String
    featuredImage: String
    status: PostStatus = DRAFT
    tagIds: [ID!]
  }

  input UpdatePostInput {
    title: String
    content: String
    excerpt: String
    featuredImage: String
    status: PostStatus
    tagIds: [ID!]
  }

  input PostFilters {
    status: PostStatus
    authorId: ID
    tagId: ID
    search: String
  }

  input PostOrderBy {
    field: PostOrderField!
    direction: OrderDirection!
  }

  enum PostOrderField {
    CREATED_AT
    UPDATED_AT
    PUBLISHED_AT
    TITLE
    VIEW_COUNT
    LIKE_COUNT
  }

  enum OrderDirection {
    ASC
    DESC
  }

  type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PostEdge {
    node: Post!
    cursor: String!
  }
`;

module.exports = PostType;
