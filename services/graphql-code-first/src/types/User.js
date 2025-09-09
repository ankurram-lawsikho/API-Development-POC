const { buildSchema } = require('graphql');

const UserType = `
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    fullName: String!
    role: UserRole!
    isActive: Boolean!
    avatar: String
    bio: String
    posts: [Post!]!
    comments: [Comment!]!
    postCount: Int!
    commentCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum UserRole {
    USER
    ADMIN
    MODERATOR
  }

  input CreateUserInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    email: String
    bio: String
    avatar: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserEdge {
    node: User!
    cursor: String!
  }
`;

module.exports = UserType;
