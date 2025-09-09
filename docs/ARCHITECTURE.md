# System Architecture

This document describes the overall architecture and design decisions of the Advanced API Development POC.

## Architecture Overview

The project implements a microservices architecture with four distinct API services, each demonstrating different approaches to API development:

```
┌─────────────────────────────────────────────────────────────┐
│                    API Development POC                      │
├─────────────────────────────────────────────────────────────┤
│  REST API          │  GraphQL Code-First  │  GraphQL Schema │
│  (Port 3001)       │  (Port 3002)         │  (Port 3003)    │
├─────────────────────────────────────────────────────────────┤
│  WebSocket API     │  Shared Database     │  Documentation  │
│  (Port 3004)       │  (PostgreSQL)        │  (docs/)        │
└─────────────────────────────────────────────────────────────┘
```

## Service Architecture

### 1. REST API Service

**Technology Stack:**
- Express.js - Web framework
- TypeORM - ORM for database operations
- PostgreSQL - Primary database
- JWT - Authentication
- Swagger/OpenAPI - Documentation
- Joi - Input validation
- Helmet - Security middleware

**Architecture Pattern:**
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Client    │───▶│  Express.js  │───▶│  TypeORM    │
└─────────────┘    └──────────────┘    └─────────────┘
                          │                     │
                          ▼                     ▼
                   ┌──────────────┐    ┌─────────────┐
                   │ Middleware   │    │ PostgreSQL  │
                   │ - Auth       │    │ Database    │
                   │ - Validation │    │             │
                   │ - Error      │    │             │
                   └──────────────┘    └─────────────┘
```

**Key Features:**
- RESTful resource-based URLs
- HTTP status codes and methods
- Pagination and filtering
- API versioning (v1, v2)
- Rate limiting
- CORS configuration
- Comprehensive error handling

### 2. GraphQL Code-First Service

**Technology Stack:**
- Apollo Server - GraphQL server
- TypeORM - Database ORM
- GraphQL Tools - Schema building
- GraphQL Scalars - Custom scalar types
- WebSocket support for subscriptions

**Architecture Pattern:**
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Client    │───▶│ Apollo Server│───▶│  Resolvers  │
└─────────────┘    └──────────────┘    └─────────────┘
                          │                     │
                          ▼                     ▼
                   ┌──────────────┐    ┌─────────────┐
                   │ Schema       │    │  TypeORM    │
                   │ (Generated)  │    │             │
                   └──────────────┘    └─────────────┘
```

**Key Features:**
- Schema generated from code
- Type-safe resolvers
- Real-time subscriptions
- Custom scalar types
- Introspection and playground
- Connection-based pagination

### 3. GraphQL Schema-First Service

**Technology Stack:**
- Apollo Server - GraphQL server
- GraphQL Tools - Schema loading
- SDL (Schema Definition Language)
- TypeORM - Database ORM

**Architecture Pattern:**
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Client    │───▶│ Apollo Server│───▶│  Resolvers  │
└─────────────┘    └──────────────┘    └─────────────┘
                          │                     │
                          ▼                     ▼
                   ┌──────────────┐    ┌─────────────┐
                   │ Schema       │    │  TypeORM    │
                   │ (SDL File)   │    │             │
                   └──────────────┘    └─────────────┘
```

**Key Features:**
- Schema-first design
- SDL schema definition
- Resolver implementation
- Schema validation
- Team collaboration friendly

### 4. WebSocket API Service

**Technology Stack:**
- Socket.IO - WebSocket library
- Express.js - HTTP server
- TypeORM - Database ORM
- JWT - Authentication
- Redis (optional) - Scaling support

**Architecture Pattern:**
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Client    │◄──▶│  Socket.IO   │◄──▶│ Event       │
│             │    │  Server      │    │ Handlers    │
└─────────────┘    └──────────────┘    └─────────────┘
                          │                     │
                          ▼                     ▼
                   ┌──────────────┐    ┌─────────────┐
                   │ Room         │    │  TypeORM    │
                   │ Management   │    │             │
                   └──────────────┘    └─────────────┘
```

**Key Features:**
- Real-time bidirectional communication
- Room-based messaging
- User presence tracking
- Message history
- Notification system
- Connection management

## Database Design

### Entity Relationship Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Users    │    │    Posts    │    │   Comments  │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ email       │◄───┤ authorId(FK)│◄───┤ authorId(FK)│
│ password    │    │ title       │    │ postId (FK) │
│ firstName   │    │ content     │    │ content     │
│ lastName    │    │ slug        │    │ parentId(FK)│
│ role        │    │ status      │    │ isApproved  │
│ isActive    │    │ createdAt   │    │ createdAt   │
│ createdAt   │    │ updatedAt   │    │ updatedAt   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Tags     │    │    Rooms    │    │  Messages   │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ name        │    │ name        │    │ content     │
│ slug        │    │ description │    │ type        │
│ color       │    │ type        │    │ senderId(FK)│
│ createdAt   │    │ createdById │    │ roomId (FK) │
└─────────────┘    └─────────────┘    │ replyToId   │
       │                   │          │ createdAt   │
       │                   │          └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ post_tags   │    │room_members │    │Notifications│
│ (Many-to-   │    │ (Many-to-   │    ├─────────────┤
│ Many)       │    │ Many)       │    │ id (PK)     │
└─────────────┘    └─────────────┘    │ userId (FK) │
                                      │ title       │
                                      │ message     │
                                      │ type        │
                                      │ isRead      │
                                      └─────────────┘
```

### Database Features

- **UUID Primary Keys**: All entities use UUID for better distribution
- **Audit Fields**: createdAt, updatedAt on all entities
- **Soft Deletes**: isActive flags for soft deletion
- **Relationships**: Proper foreign key relationships
- **Indexes**: Optimized for common queries
- **Migrations**: Version-controlled schema changes

## Security Architecture

### Authentication & Authorization

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Client    │───▶│   JWT Token  │───▶│  Middleware │
└─────────────┘    └──────────────┘    └─────────────┘
                          │                     │
                          ▼                     ▼
                   ┌──────────────┐    ┌─────────────┐
                   │ Token        │    │ Role-based  │
                   │ Validation   │    │ Access      │
                   │ & Decode     │    │ Control     │
                   └──────────────┘    └─────────────┘
```

**Security Features:**
- JWT-based authentication
- Role-based authorization (user, admin, moderator)
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Data Protection

- **Encryption**: Passwords hashed with bcrypt
- **Validation**: Input validation with Joi
- **Sanitization**: User data sanitization
- **CORS**: Cross-origin resource sharing control
- **Rate Limiting**: Request rate limiting
- **Error Handling**: Secure error messages

## Scalability Considerations

### Horizontal Scaling

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Load      │    │   Multiple   │    │  Database   │
│  Balancer   │───▶│   Instances  │───▶│  Cluster    │
└─────────────┘    └──────────────┘    └─────────────┘
```

**Scaling Strategies:**
- **Stateless Services**: REST and GraphQL APIs are stateless
- **Database Connection Pooling**: TypeORM connection pooling
- **Caching**: Redis for session storage and caching
- **Load Balancing**: Multiple service instances
- **Database Scaling**: Read replicas and sharding

### WebSocket Scaling

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Sticky    │    │   Redis      │    │  Multiple   │
│  Sessions   │───▶│   Adapter    │───▶│  Instances  │
└─────────────┘    └──────────────┘    └─────────────┘
```

**WebSocket Scaling:**
- **Redis Adapter**: For multi-instance WebSocket scaling
- **Sticky Sessions**: Session affinity for WebSocket connections
- **Room Management**: Efficient room-based message distribution
- **Connection Pooling**: Manage WebSocket connections efficiently

## Monitoring & Observability

### Logging Strategy

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Services  │───▶│   Centralized│───▶│   Log       │
│   Logs      │    │   Logging    │    │  Analysis   │
└─────────────┘    └──────────────┘    └─────────────┘
```

**Logging Features:**
- **Structured Logging**: JSON format logs
- **Request Tracking**: Request/response logging
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time tracking
- **Health Checks**: Service health monitoring

### Metrics & Monitoring

- **Health Endpoints**: `/health` for all services
- **Performance Metrics**: Response times and throughput
- **Error Rates**: Track error frequencies
- **Database Metrics**: Connection pool and query performance
- **WebSocket Metrics**: Connection counts and message rates

## Deployment Architecture

### Development Environment

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Local     │    │   PostgreSQL │    │   Services  │
│  Services   │───▶│   Database   │◄───│   Running   │
└─────────────┘    └──────────────┘    └─────────────┘
```

### Production Environment

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   CDN/      │    │   Load       │    │   Service   │
│  Frontend   │───▶│  Balancer    │───▶│  Instances  │
└─────────────┘    └──────────────┘    └─────────────┘
                          │                     │
                          ▼                     ▼
                   ┌──────────────┐    ┌─────────────┐
                   │   Redis      │    │ PostgreSQL  │
                   │   Cache      │    │  Cluster    │
                   └──────────────┘    └─────────────┘
```

## Technology Decisions

### Why These Technologies?

**Express.js:**
- Mature and stable
- Large ecosystem
- Good performance
- Easy to learn and use

**TypeORM:**
- TypeScript support
- Active query builder
- Migration support
- Multiple database support

**Apollo Server:**
- Industry standard for GraphQL
- Excellent tooling
- Real-time subscriptions
- Great documentation

**Socket.IO:**
- Reliable WebSocket implementation
- Fallback to polling
- Room management
- Event-based architecture

**PostgreSQL:**
- ACID compliance
- JSON support
- Excellent performance
- Rich feature set

## Future Enhancements

### Planned Features

1. **API Gateway**: Centralized routing and management
2. **Service Mesh**: Inter-service communication
3. **Event Sourcing**: Event-driven architecture
4. **CQRS**: Command Query Responsibility Segregation
5. **Microservices**: Further service decomposition
6. **Container Orchestration**: Kubernetes deployment
7. **CI/CD Pipeline**: Automated deployment
8. **Advanced Monitoring**: APM and distributed tracing

### Performance Optimizations

1. **Database Optimization**: Query optimization and indexing
2. **Caching Strategy**: Multi-level caching
3. **CDN Integration**: Static asset delivery
4. **Compression**: Response compression
5. **Connection Pooling**: Database connection optimization

This architecture provides a solid foundation for building scalable, maintainable, and performant API services while demonstrating different approaches to API development.
