# API Testing Guide

This guide provides comprehensive testing instructions for all API services in this project.

## Table of Contents

1. [REST API Testing](#rest-api-testing)
2. [GraphQL Testing](#graphql-testing)
3. [WebSocket Testing](#websocket-testing)
4. [Integration Testing](#integration-testing)
5. [Performance Testing](#performance-testing)
6. [Security Testing](#security-testing)

## REST API Testing

### Using Swagger UI

1. **Access Swagger Documentation**
   - URL: http://localhost:3001/api-docs
   - Interactive API documentation
   - Try out endpoints directly

2. **Authentication Setup**
   ```bash
   # First, register a user
   POST /api/auth/register
   {
     "email": "test@example.com",
     "password": "password123",
     "firstName": "Test",
     "lastName": "User"
   }
   
   # Then login to get JWT token
   POST /api/auth/login
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

3. **Using JWT Token**
   - Copy the token from login response
   - Click "Authorize" button in Swagger UI
   - Enter: `Bearer YOUR_JWT_TOKEN`
   - Now you can test protected endpoints

### Using cURL

```bash
# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Create post (replace TOKEN with actual JWT)
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "title": "Test Post",
    "content": "This is a test post content.",
    "status": "published"
  }'

# Get posts
curl -X GET "http://localhost:3001/api/posts?page=1&limit=10" \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. **Import Collection**
   - Create new collection
   - Add requests for each endpoint
   - Set up environment variables for base URL and token

2. **Environment Variables**
   ```
   base_url: http://localhost:3001/api
   token: {{jwt_token}}
   ```

3. **Test Flow**
   - Register → Login → Get Token → Use Token in subsequent requests

## GraphQL Testing

### Using GraphQL Playground

#### Code-First API (Port 3002)
- URL: http://localhost:3002/graphql
- Interactive GraphQL IDE
- Schema documentation on the right panel

#### Schema-First API (Port 3003)
- URL: http://localhost:3003/graphql
- Same interface as code-first
- Compare schema differences

### Sample Queries and Mutations

#### Authentication
```graphql
# Register
mutation {
  register(input: {
    email: "test@example.com"
    password: "password123"
    firstName: "Test"
    lastName: "User"
  }) {
    token
    user {
      id
      email
      firstName
      lastName
    }
  }
}

# Login
mutation {
  login(input: {
    email: "test@example.com"
    password: "password123"
  }) {
    token
    user {
      id
      email
      firstName
      lastName
    }
  }
}
```

#### Posts Operations
```graphql
# Get posts with pagination
query {
  posts(first: 10, filters: { status: PUBLISHED }) {
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
        commentCount
        createdAt
      }
    }
    pageInfo {
      hasNextPage
      totalCount
    }
  }
}

# Create post
mutation {
  createPost(input: {
    title: "My GraphQL Post"
    content: "This post was created via GraphQL"
    status: PUBLISHED
  }) {
    id
    title
    content
    status
    author {
      firstName
      lastName
    }
  }
}

# Update post
mutation {
  updatePost(id: "POST_ID", input: {
    title: "Updated Title"
    content: "Updated content"
  }) {
    id
    title
    content
    updatedAt
  }
}
```

#### Comments Operations
```graphql
# Get comments for a post
query {
  comments(first: 10, filters: { postId: "POST_ID" }) {
    edges {
      node {
        id
        content
        author {
          firstName
          lastName
        }
        createdAt
        replyCount
      }
    }
  }
}

# Create comment
mutation {
  createComment(input: {
    content: "This is a great post!"
    postId: "POST_ID"
  }) {
    id
    content
    author {
      firstName
      lastName
    }
    createdAt
  }
}
```

#### Tags Operations
```graphql
# Get all tags
query {
  tags(first: 20) {
    edges {
      node {
        id
        name
        color
        postCount
      }
    }
  }
}

# Get popular tags
query {
  popularTags(limit: 10) {
    id
    name
    slug
    color
    postCount
  }
}
```

### Setting Authentication Headers

In GraphQL Playground:
1. Click on "HTTP Headers" tab
2. Add authentication header:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

## WebSocket Testing

### Using Browser Console

```javascript
// Load Socket.IO client
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
document.head.appendChild(script);

// Wait for script to load, then connect
setTimeout(() => {
  const socket = io('ws://localhost:3004', {
    auth: {
      token: 'YOUR_JWT_TOKEN'
    }
  });

  // Connection events
  socket.on('connect', () => {
    console.log('Connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected');
  });

  // Chat events
  socket.on('new_message', (message) => {
    console.log('New message:', message);
  });

  socket.on('user_joined', (data) => {
    console.log('User joined:', data);
  });

  // Test room operations
  socket.emit('create_room', {
    name: 'Test Room',
    description: 'A test room for WebSocket testing',
    type: 'public'
  });

  socket.on('room_created_success', (data) => {
    console.log('Room created:', data);
    
    // Join the room
    socket.emit('join_room', { roomId: data.room.id });
  });

  socket.on('room_joined', (data) => {
    console.log('Joined room:', data);
    
    // Send a test message
    socket.emit('send_message', {
      roomId: data.roomId,
      content: 'Hello from WebSocket test!'
    });
  });

  // Store socket for further testing
  window.testSocket = socket;
}, 1000);
```

### Using wscat (Command Line)

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c "ws://localhost:3004/socket.io/?EIO=4&transport=websocket"

# Send test message
42["send_message",{"roomId":"room-id","content":"Test message"}]
```

### Using Postman WebSocket

1. **Create WebSocket Request**
   - New → WebSocket Request
   - URL: `ws://localhost:3004/socket.io/?EIO=4&transport=websocket`

2. **Authentication**
   - Add auth token in connection parameters
   - Or send auth event after connection

3. **Test Events**
   ```json
   // Join room
   42["join_room",{"roomId":"room-uuid"}]
   
   // Send message
   42["send_message",{"roomId":"room-uuid","content":"Test message"}]
   
   // Create room
   42["create_room",{"name":"Test Room","type":"public"}]
   ```

## Integration Testing

### End-to-End Test Flow

1. **User Registration and Authentication**
   ```bash
   # Register user via REST
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
   
   # Login and get token
   TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}' | jq -r '.data.token')
   ```

2. **Create Content via REST**
   ```bash
   # Create post
   POST_ID=$(curl -s -X POST http://localhost:3001/api/posts \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"title":"Integration Test Post","content":"Testing integration","status":"published"}' | jq -r '.data.id')
   ```

3. **Query via GraphQL**
   ```graphql
   query {
     post(id: "POST_ID") {
       id
       title
       content
       author {
         firstName
         lastName
       }
     }
   }
   ```

4. **Real-time Updates via WebSocket**
   ```javascript
   const socket = io('ws://localhost:3004', {
     auth: { token: 'JWT_TOKEN' }
   });
   
   socket.emit('join_room', { roomId: 'room-id' });
   socket.emit('send_message', {
     roomId: 'room-id',
     content: 'Integration test message'
   });
   ```

## Performance Testing

### Using Artillery (Load Testing)

```bash
# Install Artillery
npm install -g artillery

# Create test configuration
cat > load-test.yml << EOF
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Load Test"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          capture:
            - json: "$.data.token"
              as: "token"
      - get:
          url: "/api/posts"
          headers:
            Authorization: "Bearer {{ token }}"
EOF

# Run load test
artillery run load-test.yml
```

### Using Apache Bench (Simple Load Testing)

```bash
# Test REST API endpoints
ab -n 1000 -c 10 http://localhost:3001/api/health

# Test with authentication
ab -n 100 -c 5 -H "Authorization: Bearer JWT_TOKEN" http://localhost:3001/api/posts
```

### GraphQL Performance Testing

```bash
# Install GraphQL load testing tool
npm install -g graphql-load-test

# Test GraphQL endpoint
graphql-load-test \
  --endpoint http://localhost:3002/graphql \
  --query "query { posts(first: 10) { edges { node { id title } } } }" \
  --concurrency 10 \
  --requests 100
```

## Security Testing

### Authentication Testing

1. **Invalid Token**
   ```bash
   curl -X GET http://localhost:3001/api/posts \
     -H "Authorization: Bearer invalid-token"
   # Should return 401 Unauthorized
   ```

2. **Missing Token**
   ```bash
   curl -X GET http://localhost:3001/api/posts
   # Should return 401 Unauthorized
   ```

3. **Expired Token**
   ```bash
   # Use an expired JWT token
   curl -X GET http://localhost:3001/api/posts \
     -H "Authorization: Bearer expired-token"
   # Should return 401 Unauthorized
   ```

### Input Validation Testing

1. **Invalid Email**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"invalid-email","password":"password123","firstName":"Test","lastName":"User"}'
   # Should return 400 Bad Request
   ```

2. **SQL Injection Attempt**
   ```bash
   curl -X GET "http://localhost:3001/api/posts?search='; DROP TABLE posts; --"
   # Should be sanitized and not cause issues
   ```

3. **XSS Attempt**
   ```bash
   curl -X POST http://localhost:3001/api/posts \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"title":"<script>alert(\"XSS\")</script>","content":"Test content"}'
   # Should sanitize the input
   ```

### Rate Limiting Testing

```bash
# Test rate limiting
for i in {1..150}; do
  curl -X GET http://localhost:3001/api/health
done
# Should start returning 429 Too Many Requests after limit
```

## Automated Testing

### Jest Test Examples

```javascript
// tests/api.test.js
const request = require('supertest');
const app = require('../services/rest-api/src/index');

describe('API Tests', () => {
  let token;
  
  beforeAll(async () => {
    // Register and login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    token = response.body.data.token;
  });

  test('GET /api/posts should return posts', async () => {
    const response = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/posts should create post', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Post',
        content: 'Test content',
        status: 'published'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe('Test Post');
  });
});
```

## Monitoring and Debugging

### Health Checks

```bash
# Check all services
curl http://localhost:3001/api/health  # REST API
curl http://localhost:3004/health      # WebSocket API

# GraphQL health check
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'
```

### Logs Monitoring

```bash
# Monitor logs for all services
npm run dev 2>&1 | tee api-logs.log

# Filter for errors
npm run dev 2>&1 | grep -i error
```

### Database Monitoring

```sql
-- Check database connections
SELECT * FROM pg_stat_activity WHERE datname = 'api_poc';

-- Check table sizes
SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size 
FROM pg_tables WHERE schemaname = 'public';
```

This comprehensive testing guide covers all aspects of testing the API services. Use the appropriate testing method based on your needs and requirements.
