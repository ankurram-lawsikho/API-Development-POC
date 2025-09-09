/**
 * WebSocket Client Example
 * 
 * This file demonstrates how to connect to and interact with the WebSocket API.
 * It shows all the available events and how to handle them.
 */

const { io } = require('socket.io-client');

// WebSocket connection configuration
const WEBSOCKET_URL = 'http://localhost:3004';
const AUTH_TOKEN = 'your-jwt-token-here'; // Replace with actual JWT token

// Create WebSocket connection
const socket = io(WEBSOCKET_URL, {
  auth: {
    token: AUTH_TOKEN
  },
  transports: ['websocket', 'polling']
});

// Connection Events
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from WebSocket server:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

// User Events
socket.on('user_online', (data) => {
  console.log('👤 User came online:', data.user.firstName, data.user.lastName);
});

socket.on('user_offline', (data) => {
  console.log('👤 User went offline:', data.user.firstName, data.user.lastName);
});

// Room Events
socket.on('room_joined', (data) => {
  console.log('🏠 Joined room:', data.roomId);
});

socket.on('room_left', (data) => {
  console.log('🏠 Left room:', data.roomId);
});

socket.on('room_created', (data) => {
  console.log('🏠 New room created:', data.room.name);
});

socket.on('room_updated', (data) => {
  console.log('🏠 Room updated:', data.room.name);
});

socket.on('room_deleted', (data) => {
  console.log('🏠 Room deleted:', data.roomId);
});

socket.on('user_joined', (data) => {
  console.log('👤 User joined room:', data.user.firstName, data.user.lastName);
});
socket.on('user_left', (data) => {
  console.log('👤 User left room:', data.user.firstName, data.user.lastName);
});

// Message Events
socket.on('message_sent', (data) => {
  console.log('💬 New message:', {
    from: data.message.author.firstName,
    content: data.message.content,
    room: data.message.roomId
  });
});

socket.on('message_edited', (data) => {
  console.log('✏️ Message edited:', {
    from: data.message.author.firstName,
    content: data.message.content,
    room: data.message.roomId
  });
});

socket.on('message_deleted', (data) => {
  console.log('🗑️ Message deleted:', data.messageId);
});

// Typing Events
socket.on('user_typing', (data) => {
  if (data.isTyping) {
    console.log('⌨️ User is typing...');
  } else {
    console.log('⌨️ User stopped typing');
  }
});

// Notification Events
socket.on('notification_received', (data) => {
  console.log('🔔 New notification:', {
    type: data.notification.type,
    title: data.notification.title,
    message: data.notification.message
  });
});

// Error Events
socket.on('error', (data) => {
  console.error('❌ WebSocket error:', data.message);
});

// Example functions to interact with the WebSocket API

/**
 * Join a chat room
 */
function joinRoom(roomId) {
  socket.emit('join_room', { roomId });
}

/**
 * Leave a chat room
 */
function leaveRoom(roomId) {
  socket.emit('leave_room', { roomId });
}

/**
 * Send a message to a room
 */
function sendMessage(roomId, content, type = 'text', replyToId = null) {
  socket.emit('send_message', {
    roomId,
    content,
    type,
    replyToId
  });
}

/**
 * Edit a message
 */
function editMessage(messageId, content) {
  socket.emit('edit_message', {
    messageId,
    content
  });
}

/**
 * Delete a message
 */
function deleteMessage(messageId) {
  socket.emit('delete_message', { messageId });
}

/**
 * Start typing indicator
 */
function startTyping(roomId) {
  socket.emit('typing_start', { roomId });
}

/**
 * Stop typing indicator
 */
function stopTyping(roomId) {
  socket.emit('typing_stop', { roomId });
}

/**
 * Create a new room
 */
function createRoom(name, description, type = 'public', maxMembers = 100) {
  socket.emit('create_room', {
    name,
    description,
    type,
    maxMembers
  });
}

/**
 * Update room information
 */
function updateRoom(roomId, updates) {
  socket.emit('update_room', {
    roomId,
    ...updates
  });
}

/**
 * Delete a room
 */
function deleteRoom(roomId) {
  socket.emit('delete_room', { roomId });
}

/**
 * Invite a user to a room
 */
function inviteUser(roomId, userId) {
  socket.emit('invite_user', {
    roomId,
    userId
  });
}

/**
 * Remove a user from a room
 */
function removeUser(roomId, userId) {
  socket.emit('remove_user', {
    roomId,
    userId
  });
}

/**
 * Update user presence
 */
function updatePresence(isOnline) {
  socket.emit('update_presence', { isOnline });
}

/**
 * Update user profile
 */
function updateProfile(updates) {
  socket.emit('update_profile', updates);
}

/**
 * Mark notification as read
 */
function markNotificationRead(notificationId) {
  socket.emit('mark_notification_read', { notificationId });
}

/**
 * Mark all notifications as read
 */
function markAllNotificationsRead() {
  socket.emit('mark_all_notifications_read', {});
}

// Example usage
function exampleUsage() {
  // Wait for connection
  socket.on('connect', () => {
    console.log('Starting example usage...');
    
    // Create a room
    createRoom('Test Room', 'A test room for demonstration', 'public', 50);
    
    // Join a room (replace with actual room ID)
    setTimeout(() => {
      joinRoom('room-id-here');
    }, 1000);
    
    // Send a message
    setTimeout(() => {
      sendMessage('room-id-here', 'Hello everyone!');
    }, 2000);
    
    // Start typing
    setTimeout(() => {
      startTyping('room-id-here');
    }, 3000);
    
    // Stop typing and send another message
    setTimeout(() => {
      stopTyping('room-id-here');
      sendMessage('room-id-here', 'This is a test message!');
    }, 4000);
  });
}

// Export functions for use in other modules
module.exports = {
  socket,
  joinRoom,
  leaveRoom,
  sendMessage,
  editMessage,
  deleteMessage,
  startTyping,
  stopTyping,
  createRoom,
  updateRoom,
  deleteRoom,
  inviteUser,
  removeUser,
  updatePresence,
  updateProfile,
  markNotificationRead,
  markAllNotificationsRead,
  exampleUsage
};

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage();
}
