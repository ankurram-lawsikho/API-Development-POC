const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { makeExecutableSchema } = require('@graphql-tools/schema');
require('dotenv').config();

const AppDataSource = require('./config/database');
const { getContext } = require('./middleware/auth');
const { DateTimeScalar } = require('./utils/helpers');

// Import type definitions
const CommonTypes = require('./types/Common');
const UserType = require('./types/User');
const PostType = require('./types/Post');
const CommentType = require('./types/Comment');
const TagType = require('./types/Tag');

// Import resolvers
const userResolvers = require('./resolvers/User');
const postResolvers = require('./resolvers/Post');
const commentResolvers = require('./resolvers/Comment');
const tagResolvers = require('./resolvers/Tag');

const PORT = process.env.PORT || 3002;

// Combine all type definitions
const typeDefs = [
  CommonTypes,
  UserType,
  PostType,
  CommentType,
  TagType,
];

// Combine all resolvers
const resolvers = {
  DateTime: DateTimeScalar,
  Query: {
    health: () => 'GraphQL API is running!',
    ...userResolvers.Query,
    ...postResolvers.Query,
    ...commentResolvers.Query,
    ...tagResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...postResolvers.Mutation,
    ...commentResolvers.Mutation,
    ...tagResolvers.Mutation,
  },
  User: userResolvers.User,
  Post: postResolvers.Post,
  Comment: commentResolvers.Comment,
  Tag: tagResolvers.Tag,
};

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5000',
  credentials: true,
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// GraphQL endpoint
app.use('/graphql', graphqlHTTP({
  schema,
  context: getContext,
  graphiql: process.env.NODE_ENV === 'development',
  customFormatErrorFn: (error) => {
    console.error('GraphQL Error:', error);
    return {
      message: error.message,
      code: error.extensions?.code,
      path: error.path,
    };
  },
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'GraphQL Code-First API'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the GraphQL Code-First API',
    version: '1.0.0',
    playground: '/graphql',
    health: '/health'
  });
});

// Start server function
const startServer = async () => {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 GraphQL Code-First server running on port ${PORT}`);
      console.log(`📚 GraphQL Playground: http://localhost:${PORT}/graphql`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

// Start the server
startServer();