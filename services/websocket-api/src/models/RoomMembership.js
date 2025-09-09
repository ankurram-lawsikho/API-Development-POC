const { EntitySchema } = require('typeorm');

const RoomMembership = new EntitySchema({
  name: 'RoomMembership',
  tableName: 'room_memberships',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    userId: {
      type: 'uuid',
      nullable: false,
    },
    roomId: {
      type: 'uuid',
      nullable: false,
    },
    role: {
      type: 'enum',
      enum: ['member', 'admin', 'moderator'],
      default: 'member',
    },
    joinedAt: {
      type: 'timestamp',
      createDate: true,
    },
    lastReadAt: {
      type: 'timestamp',
      nullable: true,
    },
    isActive: {
      type: 'boolean',
      default: true,
    },
  },
  relations: {
    user: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'userId' },
      inverseSide: 'roomMemberships',
    },
    room: {
      target: 'Room',
      type: 'many-to-one',
      joinColumn: { name: 'roomId' },
      inverseSide: 'members',
    },
  },
});

module.exports = RoomMembership;
