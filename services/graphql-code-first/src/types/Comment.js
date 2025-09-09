const CommentType = `
  type Comment {
    id: ID!
    content: String!
    author: User!
    authorId: ID!
    post: Post!
    postId: ID!
    parent: Comment
    parentId: ID
    replies: [Comment!]!
    isApproved: Boolean!
    likeCount: Int!
    replyCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateCommentInput {
    content: String!
    postId: ID!
    parentId: ID
  }

  input UpdateCommentInput {
    content: String!
  }

  input CommentFilters {
    postId: ID
    authorId: ID
    parentId: ID
    isApproved: Boolean
  }

  input CommentOrderBy {
    field: CommentOrderField!
    direction: OrderDirection!
  }

  enum CommentOrderField {
    CREATED_AT
    UPDATED_AT
    LIKE_COUNT
  }

  type CommentConnection {
    edges: [CommentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type CommentEdge {
    node: Comment!
    cursor: String!
  }
`;

module.exports = CommentType;
