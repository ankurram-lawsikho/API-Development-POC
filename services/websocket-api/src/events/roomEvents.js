const { AppDataSource } = require('../config/database');
const { 
  getRoomName, 
  getRoomMembers,
  createNotification,
  handleSocketError,
  getUserForSocket
} = require('../utils/helpers');

const roomEvents = (io, socket) => {
  // Create room
  socket.on('create_room', async (data) => {
    try {
      const { name, description, type = 'public', maxMembers = 100 } = data;
      
      if (!name) {
        return socket.emit('error', { message: 'Room name is required' });
      }

      const user = getUserForSocket(socket);

      // Create a simple room object for demo
      const room = {
        id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        type,
        createdById: user.id,
        maxMembers,
        createdAt: new Date().toISOString(),
      };

      // Join the room
      const roomName = getRoomName(room.id);
      socket.join(roomName);

      // Broadcast room creation to all users
      io.emit('room_created', {
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          type: room.type,
          createdBy: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          memberCount: 1,
          createdAt: room.createdAt,
        },
      });

      socket.emit('room_created_success', {
        room,
        message: 'Room created successfully',
      });

    } catch (error) {
      handleSocketError(socket, error, 'create_room');
    }
  });

  // Join room
  socket.on('join_room_request', async (data) => {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        return socket.emit('error', { message: 'Room ID is required' });
      }

      const user = getUserForSocket(socket);

      // Join the room
      const roomName = getRoomName(roomId);
      socket.join(roomName);

      // Notify room members
      socket.to(roomName).emit('user_joined_room', {
        userId: user.id,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
        },
        roomId,
        timestamp: new Date().toISOString(),
      });

      socket.emit('room_joined_success', {
        roomId,
        message: 'Successfully joined room',
      });

    } catch (error) {
      handleSocketError(socket, error, 'join_room_request');
    }
  });

  // Leave room
  socket.on('leave_room_request', async (data) => {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        return socket.emit('error', { message: 'Room ID is required' });
      }

      const user = getUserForSocket(socket);

      // Leave the room
      const roomName = getRoomName(roomId);
      socket.leave(roomName);

      // Notify room members
      socket.to(roomName).emit('user_left_room', {
        userId: user.id,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        roomId,
        timestamp: new Date().toISOString(),
      });

      socket.emit('room_left_success', {
        roomId,
        message: 'Successfully left room',
      });

    } catch (error) {
      handleSocketError(socket, error, 'leave_room_request');
    }
  });

  // Get room members
  socket.on('get_room_members', async (data) => {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        return socket.emit('error', { message: 'Room ID is required' });
      }

      // For demo purposes, return empty members list
      socket.emit('room_members', {
        roomId,
        members: [],
        count: 0,
      });

    } catch (error) {
      handleSocketError(socket, error, 'get_room_members');
    }
  });

  // Get room info
  socket.on('get_room_info', async (data) => {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        return socket.emit('error', { message: 'Room ID is required' });
      }

      // For demo purposes, return a simple room info
      socket.emit('room_info', {
        room: {
          id: roomId,
          name: `Room ${roomId}`,
          description: 'Demo room',
          type: 'public',
          maxMembers: 100,
          memberCount: 1,
          createdBy: {
            id: 'demo-user',
            firstName: 'Demo',
            lastName: 'User',
          },
          createdAt: new Date().toISOString(),
        },
      });

    } catch (error) {
      handleSocketError(socket, error, 'get_room_info');
    }
  });

  // Update room
  socket.on('update_room', async (data) => {
    try {
      const { roomId, name, description, maxMembers } = data;
      
      if (!roomId) {
        return socket.emit('error', { message: 'Room ID is required' });
      }

      const user = getUserForSocket(socket);

      // For demo purposes, just emit the update event
      const updatedRoom = {
        id: roomId,
        name: name || `Room ${roomId}`,
        description: description || 'Demo room',
        maxMembers: maxMembers || 100,
        updatedBy: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        timestamp: new Date().toISOString(),
      };

      // Broadcast room update to all room members
      const roomName = getRoomName(roomId);
      io.to(roomName).emit('room_updated', {
        room: updatedRoom,
      });

      socket.emit('room_updated_success', {
        room: updatedRoom,
        message: 'Room updated successfully',
      });

    } catch (error) {
      handleSocketError(socket, error, 'update_room');
    }
  });
};

module.exports = roomEvents;
