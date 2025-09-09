const TagType = `
  type Tag {
    id: ID!
    name: String!
    slug: String!
    description: String
    color: String!
    posts: [Post!]!
    postCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateTagInput {
    name: String!
    description: String
    color: String = "#007bff"
  }

  input UpdateTagInput {
    name: String
    description: String
    color: String
  }

  input TagFilters {
    search: String
  }

  input TagOrderBy {
    field: TagOrderField!
    direction: OrderDirection!
  }

  enum TagOrderField {
    NAME
    CREATED_AT
    POST_COUNT
  }

  type TagConnection {
    edges: [TagEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TagEdge {
    node: Tag!
    cursor: String!
  }
`;

module.exports = TagType;
