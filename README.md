# Advanced API Development POC

This project demonstrates advanced API development techniques including:

- **REST API Design** - Complete RESTful API with Express, TypeORM, and PostgreSQL
- **GraphQL Code-First** - GraphQL API built using code-first approach
- **GraphQL Schema-First** - GraphQL API built using schema-first approach  
- **WebSockets** - Real-time communication using Socket.IO
- **API Versioning** - Multiple versioning strategies implementation

## Project Structure

```
├── services/
│   ├── rest-api/              # REST API with Express + TypeORM + PostgreSQL
│   ├── graphql-code-first/    # GraphQL API (code-first approach)
│   ├── graphql-schema-first/  # GraphQL API (schema-first approach)
│   └── websocket-api/         # WebSocket real-time API
└── docs/                      # Comprehensive documentation
```

## Quick Start

1. **Prerequisites**
   - Node.js (v16 or higher)
   - PostgreSQL (v12 or higher)
   - npm or yarn

2. **Database Setup**
   ```bash
   # Using Docker (recommended)
   docker run --name postgres-api-poc \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=api_poc \
     -p 5432:5432 \
     -d postgres:15
   
   # Or create database manually
   createdb api_poc
   ```

3. **Install Dependencies**
   ```bash
   npm run install:all
   ```

4. **Configure Environment**
   ```bash
   # Copy environment files
   cp services/rest-api/env.example services/rest-api/.env
   cp services/graphql-code-first/env.example services/graphql-code-first/.env
   cp services/graphql-schema-first/env.example services/graphql-schema-first/.env
   cp services/websocket-api/env.example services/websocket-api/.env
   ```

5. **Start All Services**
   ```bash
   npm run dev
   ```

6. **Test the APIs**
   - REST API: http://localhost:3001/api-docs (Swagger UI)
   - GraphQL Code-First: http://localhost:3002/graphql (Playground)
   - GraphQL Schema-First: http://localhost:3003/graphql (Playground)
   - WebSocket API: http://localhost:3004/health (Health Check)

## Services Overview

### 1. REST API (Port 3001)
- Complete CRUD operations
- Authentication & Authorization
- Input validation
- Error handling
- API versioning (v1, v2)
- Rate limiting
- CORS configuration

### 2. GraphQL Code-First (Port 3002)
- TypeORM integration
- Resolvers with business logic
- Authentication middleware
- Real-time subscriptions
- File uploads
- Custom scalars

### 3. GraphQL Schema-First (Port 3003)
- SDL schema definition
- Resolver implementation
- Schema stitching
- Federation ready
- Advanced directives

### 4. WebSocket API (Port 3004)
- Real-time chat
- Live notifications
- Room management
- User presence
- Message history

## Database Setup

All services use PostgreSQL. Make sure you have PostgreSQL running locally or use Docker:

```bash
docker run --name postgres-api-poc -e POSTGRES_PASSWORD=password -e POSTGRES_DB=api_poc -p 5432:5432 -d postgres:15
```

## API Documentation

- **REST API**: http://localhost:3001/api-docs (Swagger UI)
- **GraphQL Code-First**: http://localhost:3002/graphql (Playground)
- **GraphQL Schema-First**: http://localhost:3003/graphql (Playground)
- **WebSocket API**: ws://localhost:3004/socket.io/

## Documentation

- **[Getting Started](docs/GETTING_STARTED.md)** - Complete setup and testing guide
- **[API Comparison](docs/API_COMPARISON.md)** - Detailed comparison of all API approaches
- **[Testing Guide](docs/TESTING_GUIDE.md)** - Comprehensive testing instructions
- **[API Versioning](docs/API_VERSIONING.md)** - Versioning strategies and implementation
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and design decisions

## Learning Objectives

This POC covers:

1. **REST API Best Practices**
   - Resource-based URLs
   - HTTP methods and status codes
   - Request/response formats
   - Error handling patterns

2. **GraphQL Fundamentals**
   - Schema design
   - Resolvers and data fetching
   - Mutations and subscriptions
   - Code-first vs Schema-first approaches

3. **Real-time Communication**
   - WebSocket implementation
   - Event-driven architecture
   - Connection management
   - Broadcasting strategies

4. **API Versioning**
   - URL versioning
   - Header versioning
   - Backward compatibility
   - Migration strategies

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL, TypeORM
- **GraphQL**: Apollo Server, GraphQL Tools
- **WebSockets**: Socket.IO
- **Authentication**: JWT, bcrypt
- **Validation**: Joi, class-validator
- **Documentation**: Swagger/OpenAPI
