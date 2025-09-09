# API Versioning Strategies

This document demonstrates different API versioning strategies implemented across our services.

## 1. URL Path Versioning

### REST API Example
```
GET /api/v1/posts
GET /api/v2/posts
```

**Implementation in REST API:**
```javascript
// services/rest-api/src/routes/index.js
const v1Routes = express.Router();
const v2Routes = express.Router();

// Mount versioned routes
router.use('/v1', v1Routes);
router.use('/v2', v2Routes);

// Default route (latest version)
router.use('/', v1Routes);
```

**Benefits:**
- Clear and explicit
- Easy to understand
- Cacheable URLs
- Can deprecate old versions easily

**Drawbacks:**
- URL pollution
- Breaking changes require new endpoints

## 2. Header Versioning

### Implementation Example
```javascript
// Middleware for header versioning
const versionMiddleware = (req, res, next) => {
  const version = req.headers['api-version'] || '1.0';
  req.apiVersion = version;
  next();
};

// Usage in routes
app.use('/api', versionMiddleware, (req, res, next) => {
  if (req.apiVersion === '2.0') {
    // Handle v2 logic
  } else {
    // Handle v1 logic
  }
});
```

**Benefits:**
- Clean URLs
- Easy to implement
- Can version by content type

**Drawbacks:**
- Not visible in URLs
- Harder to cache
- Requires client cooperation

## 3. Query Parameter Versioning

### Implementation Example
```javascript
// services/rest-api/src/middleware/versioning.js
const queryVersionMiddleware = (req, res, next) => {
  const version = req.query.version || '1.0';
  req.apiVersion = version;
  next();
};

// Usage
app.get('/api/posts', queryVersionMiddleware, (req, res) => {
  if (req.apiVersion === '2.0') {
    // Return v2 response format
    res.json({
      data: posts,
      meta: { version: '2.0', pagination: paginationInfo }
    });
  } else {
    // Return v1 response format
    res.json(posts);
  }
});
```

## 4. Content Negotiation Versioning

### Implementation Example
```javascript
const contentVersionMiddleware = (req, res, next) => {
  const acceptHeader = req.headers.accept;
  const version = acceptHeader.includes('version=2.0') ? '2.0' : '1.0';
  req.apiVersion = version;
  next();
};

// Usage
app.get('/api/posts', contentVersionMiddleware, (req, res) => {
  if (req.apiVersion === '2.0') {
    res.setHeader('Content-Type', 'application/json; version=2.0');
    // Return v2 format
  } else {
    res.setHeader('Content-Type', 'application/json; version=1.0');
    // Return v1 format
  }
});
```

## 5. GraphQL Versioning Strategies

### Schema Versioning
```graphql
# v1 Schema
type Post {
  id: ID!
  title: String!
  content: String!
}

# v2 Schema (additive changes)
type Post {
  id: ID!
  title: String!
  content: String!
  excerpt: String  # New field
  tags: [Tag!]     # New field
}
```

### Field Deprecation
```graphql
type Post {
  id: ID!
  title: String!
  content: String!
  oldField: String @deprecated(reason: "Use newField instead")
  newField: String
}
```

### Multiple Endpoints
```javascript
// Different GraphQL endpoints for different versions
app.use('/graphql/v1', apolloServerV1);
app.use('/graphql/v2', apolloServerV2);
```

## 6. WebSocket Versioning

### Connection Versioning
```javascript
// Client connects with version
const socket = io('ws://localhost:3004', {
  auth: {
    token: 'jwt-token',
    version: '2.0'
  }
});

// Server handles version
io.use((socket, next) => {
  const version = socket.handshake.auth.version || '1.0';
  socket.version = version;
  next();
});
```

### Event Versioning
```javascript
// Version-specific event handlers
socket.on('send_message_v2', (data) => {
  // Handle v2 message format
});

socket.on('send_message', (data) => {
  // Handle v1 message format
});
```

## 7. Database Schema Versioning

### Migration Strategy
```javascript
// services/rest-api/migrations/001_initial_schema.js
exports.up = async (queryRunner) => {
  await queryRunner.createTable('users', {
    id: { type: 'uuid', isPrimary: true },
    email: { type: 'varchar', isUnique: true },
    firstName: { type: 'varchar' },
    lastName: { type: 'varchar' },
  });
};

// services/rest-api/migrations/002_add_avatar.js
exports.up = async (queryRunner) => {
  await queryRunner.addColumn('users', {
    name: 'avatar',
    type: 'varchar',
    isNullable: true,
  });
};
```

## 8. Best Practices

### 1. Semantic Versioning
- **Major (v1, v2)**: Breaking changes
- **Minor (v1.1, v1.2)**: New features, backward compatible
- **Patch (v1.1.1, v1.1.2)**: Bug fixes

### 2. Deprecation Strategy
```javascript
// Mark endpoints as deprecated
app.get('/api/v1/posts', (req, res) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', '2024-12-31');
  // Handle request
});
```

### 3. Version Lifecycle
1. **Development**: New version in development
2. **Beta**: Limited testing with select clients
3. **Stable**: Full production release
4. **Deprecated**: Announcement of upcoming removal
5. **Sunset**: Version removed

### 4. Client Communication
```javascript
// Version negotiation
const negotiateVersion = async () => {
  const response = await fetch('/api/versions');
  const versions = await response.json();
  return versions.supported.find(v => v.stable);
};
```

## 9. Implementation Examples

### REST API Versioning
```javascript
// services/rest-api/src/middleware/versioning.js
const versioningMiddleware = (req, res, next) => {
  // Check multiple version sources
  const version = 
    req.params.version ||           // URL path
    req.query.version ||            // Query parameter
    req.headers['api-version'] ||   // Header
    '1.0';                         // Default

  req.apiVersion = version;
  next();
};
```

### GraphQL Versioning
```javascript
// services/graphql-code-first/src/middleware/versioning.js
const graphqlVersioning = (req, res, next) => {
  const version = req.headers['graphql-version'] || '1.0';
  req.graphqlVersion = version;
  next();
};
```

### WebSocket Versioning
```javascript
// services/websocket-api/src/middleware/versioning.js
const wsVersioning = (socket, next) => {
  const version = socket.handshake.auth.version || '1.0';
  socket.version = version;
  next();
};
```

## 10. Monitoring and Analytics

### Version Usage Tracking
```javascript
// Track version usage
const trackVersionUsage = (req, res, next) => {
  const version = req.apiVersion;
  // Log to analytics service
  analytics.track('api_version_usage', {
    version,
    endpoint: req.path,
    userAgent: req.headers['user-agent'],
    timestamp: new Date(),
  });
  next();
};
```

### Performance Monitoring
```javascript
// Monitor performance by version
const versionPerformanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.record('api_response_time', {
      version: req.apiVersion,
      endpoint: req.path,
      duration,
      statusCode: res.statusCode,
    });
  });
  
  next();
};
```

This comprehensive versioning strategy ensures backward compatibility while allowing for innovation and improvement of the API over time.
