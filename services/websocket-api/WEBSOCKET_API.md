# WebSocket API Documentation

## Overview

The WebSocket API provides real-time communication capabilities including chat, notifications, user presence tracking, and room management. It uses Socket.IO for WebSocket connections and supports both WebSocket and HTTP long-polling transports.

## Connection

### WebSocket URL
```
ws://localhost:3004
```

### Authentication
**✅ No Authentication Required!**

This WebSocket API has been simplified for demo purposes and works without authentication. Each connection automatically gets a demo user with a unique ID based on the socket connection.

```javascript
const socket = io('http://localhost:3004');
```

## API Documentation

### Swagger UI
Interactive API documentation is available at:
- **URL**: `http://localhost:3004/api-docs`
- **Features**: Complete event documentation, schemas, and examples

### REST Endpoints for Documentation
- **Health Check**: `GET /websocket/health`
- **Chat Events**: `GET /websocket/events/chat`
- **Room Events**: `GET /websocket/events/rooms`
- **User Events**: `GET /websocket/events/users`
- **Notification Events**: `GET /websocket/events/notifications`
- **All Received Events**: `GET /websocket/events/received`

## Event Categories

### 1. Connection Events

#### `connect`
Emitted when client successfully connects to the server.

**Response:**
```json
{
  "userId": "uuid",
  "message": "Connected successfully"
}
```

#### `disconnect`
Emitted when client disconnects from the server.

**Response:**
```json
{
  "userId": "uuid",
  "reason": "client namespace disconnect"
}
```

### 2. User Events

#### `user_online`
Emitted when a user comes online.

**Response:**
```json
{
  "userId": "uuid",
  "user": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://example.com/avatar.jpg",
    "isOnline": true,
    "lastSeen": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### `user_offline`
Emitted when a user goes offline.

**Response:**
```json
{
  "userId": "uuid",
  "user": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://example.com/avatar.jpg",
    "isOnline": false,
    "lastSeen": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Room Events

#### `join_room`
Join a chat room.

**Payload:**
```json
{
  "roomId": "uuid"
}
```

**Response:**
```json
{
  "event": "room_joined",
  "data": {
    "roomId": "uuid",
    "message": "Successfully joined room"
  }
}
```

#### `leave_room`
Leave a chat room.

**Payload:**
```json
{
  "roomId": "uuid"
}
```

**Response:**
```json
{
  "event": "room_left",
  "data": {
    "roomId": "uuid",
    "message": "Successfully left room"
  }
}
```

#### `create_room`
Create a new chat room.

**Payload:**
```json
{
  "name": "Room Name",
  "description": "Room description",
  "type": "public",
  "maxMembers": 100
}
```

**Response:**
```json
{
  "event": "room_created",
  "data": {
    "room": {
      "id": "uuid",
      "name": "Room Name",
      "description": "Room description",
      "type": "public",
      "maxMembers": 100,
      "memberCount": 1,
      "createdById": "uuid",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 4. Message Events

#### `send_message`
Send a message to a room.

**Payload:**
```json
{
  "roomId": "uuid",
  "content": "Hello everyone!",
  "type": "text",
  "replyToId": "uuid"
}
```

**Response:**
```json
{
  "event": "message_sent",
  "data": {
    "message": {
      "id": "uuid",
      "content": "Hello everyone!",
      "type": "text",
      "roomId": "uuid",
      "authorId": "uuid",
      "author": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://example.com/avatar.jpg"
      },
      "replyToId": "uuid",
      "isEdited": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### `edit_message`
Edit an existing message.

**Payload:**
```json
{
  "messageId": "uuid",
  "content": "Updated message content"
}
```

**Response:**
```json
{
  "event": "message_edited",
  "data": {
    "message": {
      "id": "uuid",
      "content": "Updated message content",
      "type": "text",
      "roomId": "uuid",
      "authorId": "uuid",
      "author": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://example.com/avatar.jpg"
      },
      "isEdited": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:31:00.000Z"
    }
  }
}
```

#### `delete_message`
Delete a message.

**Payload:**
```json
{
  "messageId": "uuid"
}
```

**Response:**
```json
{
  "event": "message_deleted",
  "data": {
    "messageId": "uuid",
    "roomId": "uuid"
  }
}
```

### 5. Typing Events

#### `typing_start`
Start typing indicator.

**Payload:**
```json
{
  "roomId": "uuid"
}
```

**Response:**
```json
{
  "event": "user_typing",
  "data": {
    "userId": "uuid",
    "roomId": "uuid",
    "isTyping": true
  }
}
```

#### `typing_stop`
Stop typing indicator.

**Payload:**
```json
{
  "roomId": "uuid"
}
```

**Response:**
```json
{
  "event": "user_typing",
  "data": {
    "userId": "uuid",
    "roomId": "uuid",
    "isTyping": false
  }
}
```

### 6. Notification Events

#### `notification_received`
Emitted when a new notification is received.

**Response:**
```json
{
  "notification": {
    "id": "uuid",
    "type": "message",
    "title": "New Message",
    "message": "You have a new message in General Chat",
    "userId": "uuid",
    "data": {
      "roomId": "uuid",
      "messageId": "uuid"
    },
    "isRead": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### `mark_notification_read`
Mark a notification as read.

**Payload:**
```json
{
  "notificationId": "uuid"
}
```

**Response:**
```json
{
  "event": "notification_read",
  "data": {
    "notificationId": "uuid",
    "isRead": true
  }
}
```

## Error Handling

### Error Event
All errors are emitted through the `error` event:

```json
{
  "error": "AUTHENTICATION_FAILED",
  "message": "Invalid authentication token",
  "code": "AUTH_ERROR",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Common Error Codes
- `AUTH_ERROR`: Authentication failed
- `ROOM_NOT_FOUND`: Room does not exist
- `NOT_MEMBER`: User is not a member of the room
- `MESSAGE_NOT_FOUND`: Message does not exist
- `PERMISSION_DENIED`: User doesn't have permission for the action
- `VALIDATION_ERROR`: Invalid input data

## Client Implementation Example

```javascript
const { io } = require('socket.io-client');

const socket = io('http://localhost:3004');

// Connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Message events
socket.on('message_sent', (data) => {
  console.log('New message:', data.message.content);
});

// Join a room
socket.emit('join_room', { roomId: 'room-uuid' });

// Send a message
socket.emit('send_message', {
  roomId: 'room-uuid',
  content: 'Hello everyone!',
  type: 'text'
});
```

## Testing

### Health Check
```bash
curl http://localhost:3004/websocket/health
```

### Event Documentation
```bash
curl http://localhost:3004/websocket/events/chat
curl http://localhost:3004/websocket/events/rooms
curl http://localhost:3004/websocket/events/users
```

## Security

- **Demo Mode**: No authentication required for testing purposes
- Rate limiting is applied to prevent abuse
- CORS is configured for cross-origin requests
- Input validation is performed on all events
- Simplified user system for demo purposes

## Performance

- Supports both WebSocket and HTTP long-polling
- Automatic reconnection on connection loss
- Efficient room-based message broadcasting
- Redis support for scaling across multiple instances
- Connection pooling for database operations
