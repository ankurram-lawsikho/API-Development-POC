const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /websocket/connect:
 *   post:
 *     summary: Establish WebSocket connection
 *     tags: [WebSocket Connection]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 description: JWT authentication token
 *     responses:
 *       200:
 *         description: WebSocket connection established
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Connected to WebSocket
 *                 events:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["user_online", "user_offline", "room_joined"]
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WebSocketError'
 */
router.post('/connect', (req, res) => {
  res.json({
    success: true,
    message: 'WebSocket connection endpoint - use WebSocket client to connect',
    connectionUrl: `ws://localhost:${process.env.PORT || 3004}`,
    events: [
      'user_online', 'user_offline', 'room_joined', 'room_left',
      'message_sent', 'message_edited', 'message_deleted',
      'room_created', 'room_updated', 'room_deleted',
      'notification_received', 'typing_start', 'typing_stop'
    ]
  });
});

/**
 * @swagger
 * /websocket/events/chat:
 *   get:
 *     summary: Get chat-related WebSocket events documentation
 *     tags: [Chat Events]
 *     responses:
 *       200:
 *         description: Chat events documentation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: object
 *                   properties:
 *                     join_room:
 *                       type: object
 *                       properties:
 *                         description:
 *                           type: string
 *                           example: Join a chat room
 *                         payload:
 *                           type: object
 *                           properties:
 *                             roomId:
 *                               type: string
 *                               format: uuid
 *                               example: "123e4567-e89b-12d3-a456-426614174000"
 *                         response:
 *                           type: object
 *                           properties:
 *                             event:
 *                               type: string
 *                               example: "room_joined"
 *                             data:
 *                               type: object
 *                               properties:
 *                                 roomId:
 *                                   type: string
 *                                   format: uuid
 *                                 message:
 *                                   type: string
 *                                   example: "Successfully joined room"
 */
router.get('/events/chat', (req, res) => {
  res.json({
    events: {
      join_room: {
        description: 'Join a chat room',
        payload: {
          roomId: { type: 'string (uuid)', required: true, example: '123e4567-e89b-12d3-a456-426614174000' }
        },
        response: {
          event: 'room_joined',
          data: {
            roomId: 'string (uuid)',
            message: 'Successfully joined room'
          }
        }
      },
      leave_room: {
        description: 'Leave a chat room',
        payload: {
          roomId: { type: 'string (uuid)', required: true, example: '123e4567-e89b-12d3-a456-426614174000' }
        },
        response: {
          event: 'room_left',
          data: {
            roomId: 'string (uuid)',
            message: 'Successfully left room'
          }
        }
      },
      send_message: {
        description: 'Send a message to a room',
        payload: {
          roomId: { type: 'string (uuid)', required: true, example: '123e4567-e89b-12d3-a456-426614174000' },
          content: { type: 'string', required: true, example: 'Hello everyone!' },
          type: { type: 'string', enum: ['text', 'image', 'file'], default: 'text' },
          replyToId: { type: 'string (uuid)', required: false, example: '123e4567-e89b-12d3-a456-426614174001' }
        },
        response: {
          event: 'message_sent',
          data: {
            message: { $ref: '#/components/schemas/Message' }
          }
        }
      },
      edit_message: {
        description: 'Edit a message',
        payload: {
          messageId: { type: 'string (uuid)', required: true, example: '123e4567-e89b-12d3-a456-426614174000' },
          content: { type: 'string', required: true, example: 'Updated message content' }
        },
        response: {
          event: 'message_edited',
          data: {
            message: { $ref: '#/components/schemas/Message' }
          }
        }
      },
      delete_message: {
        description: 'Delete a message',
        payload: {
          messageId: { type: 'string (uuid)', required: true, example: '123e4567-e89b-12d3-a456-426614174000' }
        },
        response: {
          event: 'message_deleted',
          data: {
            messageId: 'string (uuid)',
            roomId: 'string (uuid)'
          }
        }
      },
      typing_start: {
        description: 'Start typing indicator',
        payload: {
          roomId: { type: 'string (uuid)', required: true, example: '123e4567-e89b-12d3-a456-426614174000' }
        },
        response: {
          event: 'user_typing',
          data: {
            userId: 'string (uuid)',
            roomId: 'string (uuid)',
            isTyping: true
          }
        }
      },
      typing_stop: {
        description: 'Stop typing indicator',
        payload: {
          roomId: { type: 'string (uuid)', required: true, example: '123e4567-e89b-12d3-a456-426614174000' }
        },
        response: {
          event: 'user_typing',
          data: {
            userId: 'string (uuid)',
            roomId: 'string (uuid)',
            isTyping: false
          }
        }
      }
    }
  });
});

/**
 * @swagger
 * /websocket/events/rooms:
 *   get:
 *     summary: Get room-related WebSocket events documentation
 *     tags: [Room Events]
 *     responses:
 *       200:
 *         description: Room events documentation
 */
router.get('/events/rooms', (req, res) => {
  res.json({
    events: {
      create_room: {
        description: 'Create a new chat room',
        payload: {
          name: { type: 'string', required: true, example: 'General Chat' },
          description: { type: 'string', required: false, example: 'General discussion room' },
          type: { type: 'string', enum: ['public', 'private', 'direct'], default: 'public' },
          maxMembers: { type: 'integer', required: false, default: 100, example: 50 }
        },
        response: {
          event: 'room_created',
          data: {
            room: { $ref: '#/components/schemas/Room' }
          }
        }
      },
      update_room: {
        description: 'Update room information',
        payload: {
          roomId: { type: 'string (uuid)', required: true, example: '123e4567-e89b-12d3-a456-426614174000' },
          name: { type: 'string', required: false, example: 'Updated Room Name' },
          description: { type: 'string', required: false, example: 'Updated description' },
          maxMembers: { type: 'integer', required: false, example: 75 }
        },
        response: {
          event: 'room_updated',
          data: {
            room: { $ref: '#/components/schemas/Room' }
          }
        }
      },
      delete_room: {
        description: 'Delete a room',
        payload: {
          roomId: { type: 'string (uuid)', required: true, example: '123e4567-e89b-12d3-a456-426614174000' }
        },
        response: {
          event: 'room_deleted',
          data: {
            roomId: 'string (uuid)'
          }
        }
      },
      invite_user: {
        description: 'Invite a user to a room',
        payload: {
          roomId: { type: 'string (uuid)', required: true, example: '123e4567-e89b-12d3-a456-426614174000' },
          userId: { type: 'string (uuid)', required: true, example: '123e4567-e89b-12d3-a456-426614174001' }
        },
        response: {
          event: 'user_invited',
          data: {
            roomId: 'string (uuid)',
            userId: 'string (uuid)',
            invitedBy: 'string (uuid)'
          }
        }
      },
      remove_user: {
        description: 'Remove a user from a room',
        payload: {
          roomId: { type: 'string (uuid)', required: true, example: '123e4567-e89b-12d3-a456-426614174000' },
          userId: { type: 'string (uuid)', required: true, example: '123e4567-e89b-12d3-a456-426614174001' }
        },
        response: {
          event: 'user_removed',
          data: {
            roomId: 'string (uuid)',
            userId: 'string (uuid)',
            removedBy: 'string (uuid)'
          }
        }
      }
    }
  });
});

/**
 * @swagger
 * /websocket/events/users:
 *   get:
 *     summary: Get user-related WebSocket events documentation
 *     tags: [User Events]
 *     responses:
 *       200:
 *         description: User events documentation
 */
router.get('/events/users', (req, res) => {
  res.json({
    events: {
      update_presence: {
        description: 'Update user presence status',
        payload: {
          isOnline: { type: 'boolean', required: true, example: true }
        },
        response: {
          event: 'presence_updated',
          data: {
            userId: 'string (uuid)',
            isOnline: 'boolean',
            lastSeen: 'string (ISO date)'
          }
        }
      },
      update_profile: {
        description: 'Update user profile information',
        payload: {
          firstName: { type: 'string', required: false, example: 'John' },
          lastName: { type: 'string', required: false, example: 'Doe' },
          avatar: { type: 'string', required: false, example: 'https://example.com/avatar.jpg' }
        },
        response: {
          event: 'profile_updated',
          data: {
            user: { $ref: '#/components/schemas/User' }
          }
        }
      }
    }
  });
});

/**
 * @swagger
 * /websocket/events/notifications:
 *   get:
 *     summary: Get notification-related WebSocket events documentation
 *     tags: [Notification Events]
 *     responses:
 *       200:
 *         description: Notification events documentation
 */
router.get('/events/notifications', (req, res) => {
  res.json({
    events: {
      mark_notification_read: {
        description: 'Mark a notification as read',
        payload: {
          notificationId: { type: 'string (uuid)', required: true, example: '123e4567-e89b-12d3-a456-426614174000' }
        },
        response: {
          event: 'notification_read',
          data: {
            notificationId: 'string (uuid)',
            isRead: true
          }
        }
      },
      mark_all_notifications_read: {
        description: 'Mark all notifications as read',
        payload: {},
        response: {
          event: 'all_notifications_read',
          data: {
            userId: 'string (uuid)',
            count: 'integer'
          }
        }
      }
    }
  });
});

/**
 * @swagger
 * /websocket/events/received:
 *   get:
 *     summary: Get all events that clients can receive
 *     tags: [Received Events]
 *     responses:
 *       200:
 *         description: All events that clients can receive
 */
router.get('/events/received', (req, res) => {
  res.json({
    events: {
      // Connection Events
      connected: {
        description: 'Client successfully connected',
        data: {
          userId: 'string (uuid)',
          message: 'Connected successfully'
        }
      },
      disconnected: {
        description: 'Client disconnected',
        data: {
          userId: 'string (uuid)',
          reason: 'string'
        }
      },
      
      // User Events
      user_online: {
        description: 'User came online',
        data: {
          userId: 'string (uuid)',
          user: { $ref: '#/components/schemas/User' },
          timestamp: 'string (ISO date)'
        }
      },
      user_offline: {
        description: 'User went offline',
        data: {
          userId: 'string (uuid)',
          user: { $ref: '#/components/schemas/User' },
          timestamp: 'string (ISO date)'
        }
      },
      
      // Room Events
      room_joined: {
        description: 'User joined a room',
        data: {
          roomId: 'string (uuid)',
          userId: 'string (uuid)',
          user: { $ref: '#/components/schemas/User' },
          timestamp: 'string (ISO date)'
        }
      },
      room_left: {
        description: 'User left a room',
        data: {
          roomId: 'string (uuid)',
          userId: 'string (uuid)',
          user: { $ref: '#/components/schemas/User' },
          timestamp: 'string (ISO date)'
        }
      },
      room_created: {
        description: 'New room created',
        data: {
          room: { $ref: '#/components/schemas/Room' }
        }
      },
      room_updated: {
        description: 'Room information updated',
        data: {
          room: { $ref: '#/components/schemas/Room' }
        }
      },
      room_deleted: {
        description: 'Room deleted',
        data: {
          roomId: 'string (uuid)'
        }
      },
      
      // Message Events
      message_sent: {
        description: 'New message received',
        data: {
          message: { $ref: '#/components/schemas/Message' }
        }
      },
      message_edited: {
        description: 'Message was edited',
        data: {
          message: { $ref: '#/components/schemas/Message' }
        }
      },
      message_deleted: {
        description: 'Message was deleted',
        data: {
          messageId: 'string (uuid)',
          roomId: 'string (uuid)'
        }
      },
      
      // Typing Events
      user_typing: {
        description: 'User typing status changed',
        data: {
          userId: 'string (uuid)',
          roomId: 'string (uuid)',
          isTyping: 'boolean'
        }
      },
      
      // Notification Events
      notification_received: {
        description: 'New notification received',
        data: {
          notification: { $ref: '#/components/schemas/Notification' }
        }
      },
      
      // Error Events
      error: {
        description: 'Error occurred',
        data: {
          error: 'string',
          message: 'string',
          code: 'string',
          timestamp: 'string (ISO date)'
        }
      }
    }
  });
});

/**
 * @swagger
 * /websocket/health:
 *   get:
 *     summary: WebSocket service health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 service:
 *                   type: string
 *                   example: "WebSocket API"
 *                 connectedClients:
 *                   type: integer
 *                   example: 5
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'WebSocket API',
    connectedClients: req.app.get('io')?.engine?.clientsCount || 0
  });
});

module.exports = router;
