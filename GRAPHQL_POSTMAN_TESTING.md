# GraphQL API Testing with Postman

This guide provides comprehensive instructions for testing both GraphQL services using Postman.

## 🚀 Services Overview

- **GraphQL Code-First**: `http://localhost:3002/graphql`
- **GraphQL Schema-First**: `http://localhost:3003/graphql`
- **REST API**: `http://localhost:3001/api/v1/`
- **WebSocket API**: `http://localhost:3004/`

## 📋 Prerequisites

1. **Start the Services**:
   ```bash
   # Terminal 1 - GraphQL Code-First
   cd services/graphql-code-first
   npm run dev

   # Terminal 2 - GraphQL Schema-First  
   cd services/graphql-schema-first
   npm run dev

   # Terminal 3 - REST API
   cd services/rest-api
   npm run dev

   # Terminal 4 - WebSocket API
   cd services/websocket-api
   npm run dev
   ```

2. **Install Postman** (if not already installed)

## 🔧 Postman Setup

### 1. Create New Collection
- Open Postman
- Click "New" → "Collection"
- Name: "GraphQL API Testing"
- Add description: "Testing GraphQL Code-First and Schema-First APIs"

### 2. Set Environment Variables
- Click "Environments" → "Create Environment"
- Name: "GraphQL Local"
- Add variables:
  - `code_first_url`: `http://localhost:3002/graphql`
  - `schema_first_url`: `http://localhost:3003/graphql`
  - `rest_api_url`: `http://localhost:3001/api/v1`
  - `websocket_url`: `http://localhost:3004`

## 🧪 GraphQL Testing with GraphQL Client

### Using GraphQL Client Interface (Insomnia/Similar)

1. **Create New Request**
   - Click "New" → "GraphQL Request"
   - Name your request (e.g., "Health Check - Code First")
   - URL: `{{code_first_url}}` or `{{schema_first_url}}`

2. **GraphQL Interface Features**
   - **Query Tab**: Main query editor with syntax highlighting
   - **Variables Tab**: For query variables (JSON format)
   - **Headers Tab**: For authentication and other headers
   - **Schema Tab**: Auto-generated schema documentation
   - **Authorization Tab**: Built-in authentication setup

3. **Authentication Setup**
   - Go to "Authorization" tab
   - Select "Bearer Token"
   - Enter: `{{jwt_token}}`
   - Or use "Headers" tab: `Authorization: Bearer {{jwt_token}}`

4. **Benefits of GraphQL Client**
   - ✅ Auto-completion and syntax highlighting
   - ✅ Schema validation and IntelliSense
   - ✅ Interactive documentation
   - ✅ Query variables support
   - ✅ No need to wrap queries in JSON
   - ✅ Built-in GraphQL error handling
   - ✅ Visual query builder with schema explorer

## 📝 Test Queries

### 1. Health Check
**Query Tab:**
```graphql
query Health {
  health
}
```
**Variables Tab:** (Leave empty)

### 2. Get Users (with pagination)
**Query Tab:**
```graphql
query GetUsers($limit: Int) {
  users(first: $limit) {
    edges {
      node {
        id
        email
        firstName
        lastName
        fullName
        role
        isActive
        createdAt
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```
**Variables Tab:**
```json
{
  "limit": 5
}
```

### 3. Get Posts
**Query Tab:**
```graphql
query GetPosts($limit: Int) {
  posts(first: $limit) {
    edges {
      node {
        id
        title
        content
        slug
        status
        publishedAt
        author {
          id
          firstName
          lastName
        }
        tags {
          id
          name
          color
        }
        commentCount
        viewCount
        likeCount
        createdAt
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
    totalCount
  }
}
```
**Variables Tab:**
```json
{
  "limit": 3
}
```

### 4. Get Tags
**Query Tab:**
```graphql
query GetTags($limit: Int) {
  tags(first: $limit) {
    edges {
      node {
        id
        name
        slug
        description
        color
        postCount
        createdAt
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
    totalCount
  }
}
```
**Variables Tab:**
```json
{
  "limit": 5
}
```

### 5. Get Comments
**Query Tab:**
```graphql
query GetComments($limit: Int) {
  comments(first: $limit) {
    edges {
      node {
        id
        content
        isApproved
        author {
          id
          firstName
          lastName
        }
        post {
          id
          title
        }
        replyCount
        createdAt
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
    totalCount
  }
}
```
**Variables Tab:**
```json
{
  "limit": 5
}
```

## 🔐 Demo User Testing

### 1. Get Current User (Demo User)
**Query Tab:**
```graphql
query GetCurrentUser {
  me {
    id
    email
    firstName
    lastName
    fullName
    role
    isActive
    bio
    avatar
    postCount
    commentCount
    createdAt
  }
}
```
**Variables Tab:** (Leave empty)

*Note: This returns a demo user without requiring authentication*

### 2. User Registration (Optional)
**Query Tab:**
```graphql
mutation RegisterUser($email: String!, $password: String!, $firstName: String!, $lastName: String!) {
  register(input: {
    email: $email
    password: $password
    firstName: $firstName
    lastName: $lastName
  }) {
    token
    user {
      id
      email
      firstName
      lastName
      role
    }
  }
}
```
**Variables Tab:**
```json
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 3. User Login (Optional)
**Query Tab:**
```graphql
mutation LoginUser($email: String!, $password: String!) {
  login(input: {
    email: $email
    password: $password
  }) {
    token
    user {
      id
      email
      firstName
      lastName
      role
    }
  }
}
```
**Variables Tab:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

*Note: JWT authentication has been removed for easier testing. All mutations now use a demo user automatically.*

## 📊 Mutation Testing

### 1. Create Post (No Authentication Required)
**Query Tab:**
```graphql
mutation CreatePost($title: String!, $content: String!, $excerpt: String, $status: PostStatus!, $tagIds: [String!]) {
  createPost(input: {
    title: $title
    content: $content
    excerpt: $excerpt
    status: $status
    tagIds: $tagIds
  }) {
    id
    title
    content
    slug
    status
    author {
      id
      firstName
      lastName
    }
    tags {
      id
      name
    }
    createdAt
  }
}
```
**Variables Tab:**
```json
{
  "title": "My First Post",
  "content": "This is the content of my first post.",
  "excerpt": "A brief excerpt",
  "status": "DRAFT",
  "tagIds": []
}
```
*Note: Post will be created with demo user as author automatically*

### 2. Create Comment (No Authentication Required)
**Query Tab:**
```graphql
mutation CreateComment($content: String!, $postId: String!) {
  createComment(input: {
    content: $content
    postId: $postId
  }) {
    id
    content
    isApproved
    author {
      id
      firstName
      lastName
    }
    post {
      id
      title
    }
    createdAt
  }
}
```
**Variables Tab:**
```json
{
  "content": "This is a great post!",
  "postId": "post-id-here"
}
```
*Note: Comment will be created with demo user as author and auto-approved*

### 3. Create Tag (No Authentication Required)
**Query Tab:**
```graphql
mutation CreateTag($name: String!, $description: String, $color: String) {
  createTag(input: {
    name: $name
    description: $description
    color: $color
  }) {
    id
    name
    slug
    description
    color
    createdAt
  }
}
```
**Variables Tab:**
```json
{
  "name": "Technology",
  "description": "Posts about technology",
  "color": "#007bff"
}
```
*Note: Tag creation is now open to all users for demo purposes*

## 🔍 Advanced Queries

### 1. Search Posts
**Query Tab:**
```graphql
query SearchPosts($limit: Int, $searchTerm: String, $status: PostStatus) {
  posts(first: $limit, filters: {
    search: $searchTerm
    status: $status
  }) {
    edges {
      node {
        id
        title
        content
        author {
          firstName
          lastName
        }
        tags {
          name
          color
        }
      }
    }
  }
}
```
**Variables Tab:**
```json
{
  "limit": 10,
  "searchTerm": "technology",
  "status": "PUBLISHED"
}
```

### 2. Get Popular Tags
**Query Tab:**
```graphql
query GetPopularTags($limit: Int) {
  popularTags(limit: $limit) {
    id
    name
    slug
    color
    postCount
  }
}
```
**Variables Tab:**
```json
{
  "limit": 10
}
```

### 3. Get User Profile with Posts
**Query Tab:**
```graphql
query GetUserProfile($userId: String!) {
  user(id: $userId) {
    id
    email
    firstName
    lastName
    fullName
    bio
    avatar
    posts {
      id
      title
      status
      publishedAt
    }
    comments {
      id
      content
      post {
        title
      }
    }
    postCount
    commentCount
  }
}
```
**Variables Tab:**
```json
{
  "userId": "user-id-here"
}
```

## 🚨 Error Testing

### 1. Invalid Query
**Query Tab:**
```graphql
query InvalidQuery {
  invalidField
}
```
**Variables Tab:** (Leave empty)
*Expected: GraphQL validation error*

### 2. Missing Required Fields
**Query Tab:**
```graphql
mutation RegisterUser($email: String!) {
  register(input: {
    email: $email
  }) {
    token
    user {
      id
    }
  }
}
```
**Variables Tab:**
```json
{
  "email": "test@example.com"
}
```
*Expected: Validation error for missing required fields*

### 3. Demo User Access
**Query Tab:**
```graphql
query GetCurrentUser {
  me {
    id
    email
  }
}
```
**Variables Tab:** (Leave empty)
*Expected: Returns demo user data without authentication*

## 🎯 GraphQL Client Features

### 1. Schema Tab
- **Auto-generated Documentation**: View all available queries, mutations, and types
- **Interactive Explorer**: Click on fields to see their structure
- **Type Information**: See field types, required fields, and descriptions

### 2. Query Builder (Left Panel)
- **Visual Field Selection**: Check/uncheck fields to build queries
- **Field Information**: See field types and descriptions
- **Nested Object Support**: Expand nested objects and arrays

### 3. Variables Tab Benefits
- **Reusability**: Use the same query with different values
- **Type Safety**: Client validates variable types
- **Easy Testing**: Change values without modifying the query

### 4. Auto-completion & Syntax Highlighting
- **Field Suggestions**: Client suggests available fields as you type
- **Argument Help**: Shows available arguments for each field
- **Type Validation**: Real-time validation of your queries
- **Syntax Highlighting**: GraphQL keywords and types are color-coded

## 📋 GraphQL Client Collection Structure

Create these folders in your GraphQL client:

1. **Health Checks**
   - Health Check (Code-First) - GraphQL request
   - Health Check (Schema-First) - GraphQL request

2. **Authentication**
   - Register User - GraphQL request with variables
   - Login User - GraphQL request with variables
   - Get Current User - GraphQL request with auth

3. **Queries**
   - Get Users - GraphQL request with pagination variables
   - Get Posts - GraphQL request with limit variables
   - Get Comments - GraphQL request with limit variables
   - Get Tags - GraphQL request with limit variables
   - Get Popular Tags - GraphQL request with limit variables

4. **Mutations**
   - Create Post - GraphQL request with variables and auth
   - Create Comment - GraphQL request with variables and auth
   - Create Tag - GraphQL request with variables and auth
   - Update Profile - GraphQL request with variables and auth

5. **Advanced**
   - Search Posts - GraphQL request with filter variables
   - Get User Profile - GraphQL request with user ID variable
   - Error Testing - GraphQL request for validation testing

## 🚀 Quick Start Workflow

1. **Create GraphQL Request**
   - New → GraphQL Request
   - Set URL to `{{code_first_url}}` or `{{schema_first_url}}`

2. **Test Health Check**
   - Query Tab: `query Health { health }`
   - Variables Tab: (empty)
   - Click Send

3. **Test Demo User**
   - Use the "GetCurrentUser" query to see demo user data
   - No authentication required

4. **Test Mutations**
   - Try creating posts, comments, and tags
   - All mutations use demo user automatically

5. **Test Both Services**
   - Compare responses between Code-First and Schema-First APIs
   - Both services now work without authentication

## 🎯 Testing Tips

1. **Save Responses**: Use your GraphQL client's save feature to store successful responses
2. **Use Variables**: Store IDs and other data in environment variables for reuse
3. **Schema Explorer**: Use the left panel to explore available fields and build queries visually
4. **Query Names**: Always name your queries and mutations for better debugging
5. **Variable Types**: Use proper GraphQL variable types for better validation
6. **Test Both Services**: Compare responses between Code-First and Schema-First
7. **Error Handling**: Test both success and error scenarios
8. **Performance**: Use your client's timing information to compare response times

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure the services are running on the correct ports
2. **Authentication Errors**: Verify JWT token is valid and properly formatted
3. **Schema Errors**: Check that the query matches the GraphQL schema
4. **Database Errors**: Ensure PostgreSQL is running and accessible

### Debug Steps:

1. Check service logs in terminal
2. Verify database connection
3. Test health endpoints first
4. Use simple queries before complex ones
5. Check Postman console for detailed error messages

## 📚 Additional Resources

- [GraphQL Documentation](https://graphql.org/learn/)
- [Postman GraphQL Testing](https://learning.postman.com/docs/sending-requests/graphql/graphql-overview/)
- [Express GraphQL](https://github.com/graphql/express-graphql)

---

**Happy Testing! 🚀**
