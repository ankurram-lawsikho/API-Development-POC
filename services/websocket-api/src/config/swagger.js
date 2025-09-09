const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WebSocket API Documentation',
      version: '1.0.0',
      description: 'Real-time WebSocket API for chat, notifications, and user presence tracking',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3004}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // WebSocket Connection
        WebSocketConnection: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              example: 'ws://localhost:3004',
              description: 'WebSocket connection URL',
            },
            auth: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  description: 'JWT authentication token',
                },
              },
            },
          },
        },
        
        // User Schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            avatar: {
              type: 'string',
              nullable: true,
              description: 'User avatar URL',
            },
            isOnline: {
              type: 'boolean',
              description: 'User online status',
            },
            lastSeen: {
              type: 'string',
              format: 'date-time',
              description: 'Last seen timestamp',
            },
          },
        },

        // Room Schemas
        Room: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Room ID',
            },
            name: {
              type: 'string',
              description: 'Room name',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Room description',
            },
            type: {
              type: 'string',
              enum: ['public', 'private', 'direct'],
              description: 'Room type',
            },
            maxMembers: {
              type: 'integer',
              description: 'Maximum number of members',
            },
            memberCount: {
              type: 'integer',
              description: 'Current number of members',
            },
            createdById: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user who created the room',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Room creation timestamp',
            },
          },
        },

        // Message Schemas
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Message ID',
            },
            content: {
              type: 'string',
              description: 'Message content',
            },
            type: {
              type: 'string',
              enum: ['text', 'image', 'file', 'system'],
              description: 'Message type',
            },
            roomId: {
              type: 'string',
              format: 'uuid',
              description: 'Room ID where message was sent',
            },
            authorId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the message author',
            },
            author: {
              $ref: '#/components/schemas/User',
            },
            replyToId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID of the message being replied to',
            },
            isEdited: {
              type: 'boolean',
              description: 'Whether the message has been edited',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Message creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Message last update timestamp',
            },
          },
        },

        // Notification Schemas
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Notification ID',
            },
            type: {
              type: 'string',
              enum: ['message', 'mention', 'room_invite', 'system'],
              description: 'Notification type',
            },
            title: {
              type: 'string',
              description: 'Notification title',
            },
            message: {
              type: 'string',
              description: 'Notification message',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user receiving the notification',
            },
            data: {
              type: 'object',
              description: 'Additional notification data',
            },
            isRead: {
              type: 'boolean',
              description: 'Whether the notification has been read',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Notification creation timestamp',
            },
          },
        },

        // Error Schemas
        WebSocketError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'AUTHENTICATION_FAILED',
            },
            message: {
              type: 'string',
              example: 'Invalid authentication token',
            },
            code: {
              type: 'string',
              example: 'AUTH_ERROR',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00.000Z',
            },
          },
        },

        // Success Response
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00.000Z',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // Path to the API files
};

const specs = swaggerJsdoc(options);

module.exports = specs;
