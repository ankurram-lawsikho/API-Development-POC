const { EntitySchema } = require('typeorm');

const User = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    email: {
      type: 'varchar',
      unique: true,
      nullable: false,
    },
    password: {
      type: 'varchar',
      nullable: false,
    },
    firstName: {
      type: 'varchar',
      nullable: false,
    },
    lastName: {
      type: 'varchar',
      nullable: false,
    },
    role: {
      type: 'enum',
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    isActive: {
      type: 'boolean',
      default: true,
    },
    avatar: {
      type: 'varchar',
      nullable: true,
    },
    isOnline: {
      type: 'boolean',
      default: false,
    },
    lastSeen: {
      type: 'timestamp',
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  relations: {
    messages: {
      target: 'Message',
      type: 'one-to-many',
      inverseSide: 'sender',
    },
    roomMemberships: {
      target: 'RoomMembership',
      type: 'one-to-many',
      inverseSide: 'user',
    },
    notifications: {
      target: 'Notification',
      type: 'one-to-many',
      inverseSide: 'user',
    },
  },
});

module.exports = User;
