# GraphQL API Testing with cURL

This guide provides comprehensive curl commands for testing both GraphQL services.

## 🚀 Services Overview

- **GraphQL Code-First**: `http://localhost:3002/graphql`
- **GraphQL Schema-First**: `http://localhost:3003/graphql`

## 📋 Prerequisites

1. **Start the Services**:
   ```bash
   # Terminal 1 - GraphQL Code-First
   cd services/graphql-code-first
   npm run dev

   # Terminal 2 - GraphQL Schema-First  
   cd services/graphql-schema-first
   npm run dev
   ```

2. **Verify Services are Running**:
   ```bash
   # Check GraphQL Code-First
   curl -X GET http://localhost:3002/health

   # Check GraphQL Schema-First
   curl -X GET http://localhost:3003/health
   ```

## 🧪 Basic GraphQL Testing

### 1. Health Check

**GraphQL Code-First:**
```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health }"}'
```

**GraphQL Schema-First:**
```bash
curl -X POST http://localhost:3003/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health }"}'
```

### 2. Get Users (with pagination)

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{
      users(first: 5) {
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
    }"
  }'
```

### 3. Get Posts

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{
      posts(first: 3) {
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
    }"
  }'
```

### 4. Get Tags

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{
      tags(first: 5) {
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
    }"
  }'
```

### 5. Get Comments

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{
      comments(first: 5) {
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
    }"
  }'
```

## 🔐 Authentication Testing

### 1. User Registration

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation {
      register(input: {
        email: \"test@example.com\"
        password: \"password123\"
        firstName: \"John\"
        lastName: \"Doe\"
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
    }"
  }'
```

### 2. User Login

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation {
      login(input: {
        email: \"test@example.com\"
        password: \"password123\"
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
    }"
  }'
```

### 3. Get Current User (Requires Authentication)

**First, get a token from login, then use it:**

```bash
# Replace YOUR_JWT_TOKEN with the actual token from login response
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "{
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
    }"
  }'
```

## 📊 Mutation Testing

### 1. Create Post (Requires Authentication)

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "mutation {
      createPost(input: {
        title: \"My First Post\"
        content: \"This is the content of my first post.\"
        excerpt: \"A brief excerpt\"
        status: DRAFT
        tagIds: []
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
    }"
  }'
```

### 2. Create Comment (Requires Authentication)

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "mutation {
      createComment(input: {
        content: \"This is a great post!\"
        postId: \"POST_ID_HERE\"
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
    }"
  }'
```

### 3. Create Tag (Requires Admin Authentication)

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "mutation {
      createTag(input: {
        name: \"Technology\"
        description: \"Posts about technology\"
        color: \"#007bff\"
      }) {
        id
        name
        slug
        description
        color
        createdAt
      }
    }"
  }'
```

### 4. Update Profile (Requires Authentication)

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "mutation {
      updateProfile(input: {
        firstName: \"John Updated\"
        lastName: \"Doe Updated\"
        bio: \"Updated bio\"
      }) {
        id
        email
        firstName
        lastName
        bio
        updatedAt
      }
    }"
  }'
```

## 🔍 Advanced Queries

### 1. Search Posts

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{
      posts(first: 10, filters: {
        search: \"technology\"
        status: PUBLISHED
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
    }"
  }'
```

### 2. Get Popular Tags

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{
      popularTags(limit: 10) {
        id
        name
        slug
        color
        postCount
      }
    }"
  }'
```

### 3. Get User Profile with Posts

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{
      user(id: \"USER_ID_HERE\") {
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
    }"
  }'
```

## 🚨 Error Testing

### 1. Invalid Query

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{
      invalidField
    }"
  }'
```

### 2. Missing Required Fields

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation {
      register(input: {
        email: \"test@example.com\"
      }) {
        token
        user {
          id
        }
      }
    }"
  }'
```

### 3. Authentication Required (without token)

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{
      me {
        id
        email
      }
    }"
  }'
```

## 🔧 Testing Scripts

### 1. Complete Test Sequence

Create a file `test-graphql.sh`:

```bash
#!/bin/bash

echo "🚀 Testing GraphQL APIs with cURL"
echo "=================================="

# Test Health Check
echo "1. Testing Health Check..."
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health }"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test User Registration
echo "2. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation {
      register(input: {
        email: \"test@example.com\"
        password: \"password123\"
        firstName: \"John\"
        lastName: \"Doe\"
      }) {
        token
        user {
          id
          email
          firstName
          lastName
        }
      }
    }"
  }')

echo "$REGISTER_RESPONSE"
echo ""

# Extract token (requires jq)
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.register.token')
echo "Token: $TOKEN"
echo ""

# Test Authenticated Query
echo "3. Testing Authenticated Query..."
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "{
      me {
        id
        email
        firstName
        lastName
      }
    }"
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo "✅ Testing Complete!"
```

### 2. PowerShell Script (Windows)

Create a file `test-graphql.ps1`:

```powershell
Write-Host "🚀 Testing GraphQL APIs with cURL" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Test Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
$healthResponse = Invoke-RestMethod -Uri "http://localhost:3002/graphql" -Method POST -ContentType "application/json" -Body '{"query": "{ health }"}'
Write-Host "Response: $($healthResponse | ConvertTo-Json)" -ForegroundColor Cyan

# Test User Registration
Write-Host "2. Testing User Registration..." -ForegroundColor Yellow
$registerBody = @{
    query = "mutation {
        register(input: {
            email: `"test@example.com`"
            password: `"password123`"
            firstName: `"John`"
            lastName: `"Doe`"
        }) {
            token
            user {
                id
                email
                firstName
                lastName
            }
        }
    }"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "http://localhost:3002/graphql" -Method POST -ContentType "application/json" -Body $registerBody
Write-Host "Response: $($registerResponse | ConvertTo-Json)" -ForegroundColor Cyan

# Extract token
$token = $registerResponse.data.register.token
Write-Host "Token: $token" -ForegroundColor Magenta

# Test Authenticated Query
Write-Host "3. Testing Authenticated Query..." -ForegroundColor Yellow
$meBody = @{
    query = "{
        me {
            id
            email
            firstName
            lastName
        }
    }"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

$meResponse = Invoke-RestMethod -Uri "http://localhost:3002/graphql" -Method POST -Headers $headers -Body $meBody
Write-Host "Response: $($meResponse | ConvertTo-Json)" -ForegroundColor Cyan

Write-Host "✅ Testing Complete!" -ForegroundColor Green
```

## 🎯 Testing Tips

1. **Pretty Print JSON**: Add `| jq .` to the end of curl commands for formatted output
2. **Save Responses**: Use `> response.json` to save responses to files
3. **Verbose Output**: Add `-v` flag to see detailed request/response headers
4. **Test Both Services**: Run the same queries against both Code-First and Schema-First
5. **Error Handling**: Always check HTTP status codes and error messages

## 🔧 Troubleshooting

### Common Issues:

1. **Connection Refused**: Make sure services are running on correct ports
2. **JSON Parse Error**: Check for proper escaping of quotes in JSON
3. **Authentication Errors**: Verify JWT token format and expiration
4. **Schema Errors**: Ensure queries match the GraphQL schema

### Debug Commands:

```bash
# Check if services are running
curl -X GET http://localhost:3002/health
curl -X GET http://localhost:3003/health

# Test with verbose output
curl -v -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health }"}'

# Check response headers
curl -I -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health }"}'
```

---

**Happy Testing with cURL! 🚀**
