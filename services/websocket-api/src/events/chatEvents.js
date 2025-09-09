const { AppDataSource } = require('../config/database');
const { 
  getRoomName, 
  getUserRoomName, 
  sanitizeMessage, 
  createNotification, 
  getRoomMembers,
  isUserInRoom,
  handleSocketError,
  getUserForSocket
} = require('../utils/helpers');

const chatEvents = (io, socket) => {
  // Join room
  socket.on('join_room', async (data) => {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        return socket.emit('error', { message: 'Room ID is required' });
      }

      // Get or create user for this socket
      const user = getUserForSocket(socket);

      // Join the room
      const roomName = getRoomName(roomId);
      socket.join(roomName);

      // Notify others in the room
      socket.to(roomName).emit('user_joined', {
        userId: user.id,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
        },
        timestamp: new Date().toISOString(),
      });

      // Send room info to the user
      socket.emit('room_joined', {
        roomId,
        message: 'Successfully joined room',
      });

    } catch (error) {
      handleSocketError(socket, error, 'join_room');
    }
  });

  // Leave room
  socket.on('leave_room', async (data) => {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        return socket.emit('error', { message: 'Room ID is required' });
      }

      // Get user for this socket
      const user = getUserForSocket(socket);

      const roomName = getRoomName(roomId);
      socket.leave(roomName);

      // Notify others in the room
      socket.to(roomName).emit('user_left', {
        userId: user.id,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
        },
        timestamp: new Date().toISOString(),
      });

      socket.emit('room_left', {
        roomId,
        message: 'Successfully left room',
      });

    } catch (error) {
      handleSocketError(socket, error, 'leave_room');
    }
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { roomId, content, type = 'text', replyToId = null } = data;
      
      if (!roomId || !content) {
        return socket.emit('error', { message: 'Room ID and content are required' });
      }

      // Get user for this socket
      const user = getUserForSocket(socket);

      // Create a simple message object for demo
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        type,
        senderId: user.id,
        roomId,
        replyToId,
        createdAt: new Date().toISOString(),
        sender: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
        },
        room: {
          id: roomId,
          name: `Room ${roomId}`,
        }
      };

      // Send message to all users in the room (including sender)
      const roomName = getRoomName(roomId);
      io.to(roomName).emit('message_sent', { message });
      
      // Also emit new_message for compatibility
      io.to(roomName).emit('new_message', message);

    } catch (error) {
      handleSocketError(socket, error, 'send_message');
    }
  });

  // Edit message
  socket.on('edit_message', async (data) => {
    try {
      const { messageId, content } = data;
      
      if (!messageId || !content) {
        return socket.emit('error', { message: 'Message ID and content are required' });
      }

      // Get user for this socket
      const user = getUserForSocket(socket);

      // For demo purposes, just emit the edit event
      // In a real app, you'd update the database
      const editedMessage = {
        id: messageId,
        content,
        isEdited: true,
        editedAt: new Date().toISOString(),
        sender: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      };

      // Broadcast edited message to all rooms this user is in
      socket.rooms.forEach(roomName => {
        if (roomName.startsWith('room:')) {
          io.to(roomName).emit('message_edited', editedMessage);
        }
      });

    } catch (error) {
      handleSocketError(socket, error, 'edit_message');
    }
  });

  // Delete message
  socket.on('delete_message', async (data) => {
    try {
      const { messageId } = data;
      
      if (!messageId) {
        return socket.emit('error', { message: 'Message ID is required' });
      }

      // Get user for this socket
      const user = getUserForSocket(socket);

      // For demo purposes, just emit the delete event
      // In a real app, you'd update the database
      const deletedMessage = {
        messageId,
        deletedBy: user.id,
        timestamp: new Date().toISOString(),
      };

      // Broadcast deleted message to all rooms this user is in
      socket.rooms.forEach(roomName => {
        if (roomName.startsWith('room:')) {
          io.to(roomName).emit('message_deleted', deletedMessage);
        }
      });

    } catch (error) {
      handleSocketError(socket, error, 'delete_message');
    }
  });

  // Typing indicator
  socket.on('typing_start', (data) => {
    const { roomId } = data;
    if (roomId) {
      const user = getUserForSocket(socket);
      const roomName = getRoomName(roomId);
      socket.to(roomName).emit('user_typing', {
        userId: user.id,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on('typing_stop', (data) => {
    const { roomId } = data;
    if (roomId) {
      const user = getUserForSocket(socket);
      const roomName = getRoomName(roomId);
      socket.to(roomName).emit('user_stopped_typing', {
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
    }
  });
};

module.exports = chatEvents;
