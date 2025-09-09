const { AppDataSource } = require('../config/database');
const { 
  getUserRoomName, 
  updateUserPresence, 
  getUserRooms,
  handleSocketError,
  getUserForSocket
} = require('../utils/helpers');

const userEvents = (io, socket) => {
  // User connects
  socket.on('connect', async () => {
    try {
      // Get or create user for this socket
      const user = getUserForSocket(socket);

      // Join user's personal room for notifications
      const userRoomName = getUserRoomName(user.id);
      socket.join(userRoomName);

      // Get user's rooms and join them
      const userRooms = await getUserRooms(user.id);
      for (const room of userRooms) {
        const roomName = `room:${room.id}`;
        socket.join(roomName);
      }

      // Notify all connected users about user coming online
      socket.broadcast.emit('user_online', {
        userId: user.id,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
        },
        timestamp: new Date().toISOString(),
      });

      // Send user's rooms list
      socket.emit('user_rooms', {
        rooms: userRooms.map(room => ({
          id: room.id,
          name: room.name,
          description: room.description,
          type: room.type,
          memberCount: 0, // This would need to be calculated
        })),
      });

    } catch (error) {
      handleSocketError(socket, error, 'connect');
    }
  });

  // User disconnects
  socket.on('disconnect', async () => {
    try {
      // Get user for this socket
      const user = getUserForSocket(socket);

      // Notify all connected users about user going offline
      socket.broadcast.emit('user_offline', {
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  // Get online users
  socket.on('get_online_users', async () => {
    try {
      // For demo purposes, return connected socket IDs as users
      const connectedSockets = Array.from(io.sockets.sockets.keys());
      const onlineUsers = connectedSockets.map(socketId => ({
        id: socketId,
        firstName: `User${socketId.slice(-4)}`,
        lastName: 'Demo',
        avatar: null,
        lastSeen: new Date().toISOString(),
      }));

      socket.emit('online_users', {
        users: onlineUsers,
        count: onlineUsers.length,
      });

    } catch (error) {
      handleSocketError(socket, error, 'get_online_users');
    }
  });

  // Update user status
  socket.on('update_status', async (data) => {
    try {
      const { status } = data;
      const user = getUserForSocket(socket);

      // Broadcast status update to all connected users
      socket.broadcast.emit('user_status_update', {
        userId: user.id,
        status,
        timestamp: new Date().toISOString(),
      });

      socket.emit('status_updated', {
        status,
        message: 'Status updated successfully',
      });

    } catch (error) {
      handleSocketError(socket, error, 'update_status');
    }
  });

  // Get user profile
  socket.on('get_profile', async () => {
    try {
      const user = getUserForSocket(socket);

      socket.emit('profile', {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          createdAt: new Date().toISOString(),
        },
      });

    } catch (error) {
      handleSocketError(socket, error, 'get_profile');
    }
  });

  // Update user profile
  socket.on('update_profile', async (data) => {
    try {
      const { firstName, lastName, avatar } = data;
      const user = getUserForSocket(socket);

      // Update user object
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (avatar) user.avatar = avatar;

      // Broadcast profile update to all connected users
      socket.broadcast.emit('user_profile_updated', {
        userId: user.id,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
        },
        timestamp: new Date().toISOString(),
      });

      socket.emit('profile_updated', {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
        },
        message: 'Profile updated successfully',
      });

    } catch (error) {
      handleSocketError(socket, error, 'update_profile');
    }
  });
};

module.exports = userEvents;
