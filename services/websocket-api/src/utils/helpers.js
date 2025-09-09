const { AppDataSource } = require('../config/database');

// Simple user management for demo purposes
const createDemoUser = (socketId) => {
  return {
    id: socketId,
    firstName: `User${socketId.slice(-4)}`,
    lastName: 'Demo',
    email: `user${socketId.slice(-4)}@demo.com`,
    avatar: null,
    role: 'user',
    isOnline: true,
    lastSeen: new Date(),
  };
};

// Get or create user for socket
const getUserForSocket = (socket) => {
  if (!socket.user) {
    socket.user = createDemoUser(socket.id);
    socket.userId = socket.user.id;
  }
  return socket.user;
};

// Room utilities
const getRoomName = (roomId) => `room:${roomId}`;
const getUserRoomName = (userId) => `user:${userId}`;

// Message utilities
const sanitizeMessage = (message) => {
  const { sender, ...messageData } = message;
  return {
    ...messageData,
    sender: {
      id: sender.id,
      firstName: sender.firstName,
      lastName: sender.lastName,
      avatar: sender.avatar,
    }
  };
};

// Notification utilities
const createNotification = async (userId, title, message, type = 'message', relatedId = null, relatedType = null, metadata = null) => {
  const notificationRepository = AppDataSource.getRepository('Notification');
  
  const notification = notificationRepository.create({
    userId,
    title,
    message,
    type,
    relatedId,
    relatedType,
    metadata,
  });

  return await notificationRepository.save(notification);
};

// User presence utilities
const updateUserPresence = async (userId, isOnline = true) => {
  const userRepository = AppDataSource.getRepository('User');
  
  await userRepository.update(userId, {
    isOnline,
    lastSeen: new Date(),
  });
};

// Room membership utilities (simplified for demo)
const getUserRooms = async (userId) => {
  // For demo purposes, return all public rooms
  try {
    const roomRepository = AppDataSource.getRepository('Room');
    return await roomRepository.find({
      where: { type: 'public', isActive: true }
    });
  } catch (error) {
    console.error('Error getting user rooms:', error);
    return [];
  }
};

const getRoomMembers = async (roomId) => {
  // For demo purposes, return empty array
  // In a real app, you'd query the database
  return [];
};

const isUserInRoom = async (userId, roomId) => {
  // For demo purposes, allow all users to join any room
  return true;
};

// Error handling
const handleSocketError = (socket, error, event = 'error') => {
  console.error(`Socket error in ${event}:`, error);
  socket.emit('error', {
    message: error.message || 'An error occurred',
    code: error.code || 'UNKNOWN_ERROR',
  });
};

module.exports = {
  createDemoUser,
  getUserForSocket,
  getRoomName,
  getUserRoomName,
  sanitizeMessage,
  createNotification,
  updateUserPresence,
  getUserRooms,
  getRoomMembers,
  isUserInRoom,
  handleSocketError,
};
