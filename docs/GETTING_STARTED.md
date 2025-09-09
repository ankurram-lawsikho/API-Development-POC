# Getting Started with Advanced API Development POC

This guide will help you set up and test all the API services in this project.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Quick Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all service dependencies
npm run install:all
```

### 2. Database Setup

#### Option A: Local PostgreSQL
```bash
# Create database
createdb api_poc

# Or using psql
psql -U postgres
CREATE DATABASE api_poc;
```

#### Option B: Docker PostgreSQL
```bash
docker run --name postgres-api-poc \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=api_poc \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Environment Configuration

Copy environment files and configure:

```bash
# REST API
cp services/rest-api/env.example services/rest-api/.env

# GraphQL Code-First
cp services/graphql-code-first/env.example services/graphql-code-first/.env

# GraphQL Schema-First
cp services/graphql-schema-first/env.example services/graphql-schema-first/.env

# WebSocket API
cp services/websocket-api/env.example services/websocket-api/.env
```

### 4. Start All Services

```bash
# Start all services concurrently
npm run dev
```

This will start:
- REST API on port 3001
- GraphQL Code-First on port 3002
- GraphQL Schema-First on port 3003
- WebSocket API on port 3004

## Testing the APIs

### REST API Testing

#### Swagger Documentation
Visit: http://localhost:3001/api-docs

#### Sample Requests

**Register a user:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Create a post (with auth token):**
```bash
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my first post.",
    "status": "published"
  }'
```

### GraphQL Testing

#### GraphQL Code-First Playground
Visit: http://localhost:3002/graphql

#### GraphQL Schema-First Playground
Visit: http://localhost:3003/graphql

#### Sample Queries

**Register a user:**
```graphql
mutation {
  register(input: {
    email: "user@example.com"
    password: "password123"
    firstName: "John"
    lastName: "Doe"
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

**Get posts:**
```graphql
query {
  posts(first: 10) {
    edges {
      node {
        id
        title
        content
        author {
          firstName
          lastName
        }
        createdAt
      }
    }
    pageInfo {
      hasNextPage
      totalCount
    }
  }
}
```

**Create a post:**
```graphql
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
```

### WebSocket Testing

#### Using Browser Console

```javascript
// Connect to WebSocket
const socket = io('ws://localhost:3004', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Listen for events
socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('new_message', (message) => {
  console.log('New message:', message);
});

// Join a room
socket.emit('join_room', { roomId: 'room-uuid' });

// Send a message
socket.emit('send_message', {
  roomId: 'room-uuid',
  content: 'Hello from WebSocket!'
});
```

#### Using WebSocket Testing Tools

- **Postman**: Can test WebSocket connections
- **wscat**: Command-line WebSocket client
  ```bash
  npm install -g wscat
  wscat -c ws://localhost:3004/socket.io/?EIO=4&transport=websocket
  ```

## API Endpoints Summary

### REST API (Port 3001)
- **Base URL**: http://localhost:3001/api
- **Documentation**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/api/health

**Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/posts` - Get posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post by ID
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/comments` - Get comments
- `POST /api/comments` - Create comment
- `GET /api/tags` - Get tags
- `POST /api/tags` - Create tag

### GraphQL Code-First (Port 3002)
- **Playground**: http://localhost:3002/graphql
- **Health Check**: http://localhost:3002/graphql (query: `{ health }`)

### GraphQL Schema-First (Port 3003)
- **Playground**: http://localhost:3003/graphql
- **Health Check**: http://localhost:3003/graphql (query: `{ health }`)

### WebSocket API (Port 3004)
- **WebSocket URL**: ws://localhost:3004/socket.io/
- **Health Check**: http://localhost:3004/health
- **Stats**: http://localhost:3004/stats

## Authentication

All APIs use JWT authentication. After registering or logging in, you'll receive a JWT token that should be included in subsequent requests:

### REST API
```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### GraphQL
```javascript
// In GraphQL Playground, add to HTTP Headers:
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### WebSocket
```javascript
const socket = io('ws://localhost:3004', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

## Database Schema

The project uses a shared PostgreSQL database with the following main entities:

- **Users**: User accounts with authentication
- **Posts**: Blog posts with content and metadata
- **Comments**: Comments on posts with threading support
- **Tags**: Categorization system for posts
- **Rooms**: Chat rooms for real-time communication
- **Messages**: Chat messages within rooms
- **Notifications**: User notifications

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in .env files
   - Verify database exists

2. **Port Already in Use**
   - Check if services are already running
   - Kill existing processes or change ports in .env files

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set in all .env files
   - Check token expiration time

4. **CORS Issues**
   - Verify CORS_ORIGIN settings in .env files
   - Check if client is running on correct port

### Logs

Each service logs to the console. Look for:
- ✅ Database connection success
- 🚀 Server startup messages
- ❌ Error messages

### Health Checks

All services provide health check endpoints:
- REST API: http://localhost:3001/api/health
- GraphQL: Query `{ health }` in playground
- WebSocket: http://localhost:3004/health

## Next Steps

1. **Explore the APIs**: Use Swagger and GraphQL Playground to test all endpoints
2. **Read Documentation**: Check the docs/ folder for detailed guides
3. **Study the Code**: Examine the implementation in each service
4. **Extend Functionality**: Add new features or modify existing ones
5. **Deploy**: Follow deployment guides for production setup

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the service logs
3. Verify your environment configuration
4. Check the detailed documentation in the docs/ folder
