const { EntitySchema } = require('typeorm');

const Room = new EntitySchema({
  name: 'Room',
  tableName: 'rooms',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    name: {
      type: 'varchar',
      nullable: false,
    },
    description: {
      type: 'text',
      nullable: true,
    },
    type: {
      type: 'enum',
      enum: ['public', 'private', 'direct'],
      default: 'public',
    },
    createdById: {
      type: 'uuid',
      nullable: false,
    },
    isActive: {
      type: 'boolean',
      default: true,
    },
    maxMembers: {
      type: 'integer',
      default: 100,
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
    createdBy: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'createdById' },
    },
    members: {
      target: 'RoomMembership',
      type: 'one-to-many',
      inverseSide: 'room',
    },
    messages: {
      target: 'Message',
      type: 'one-to-many',
      inverseSide: 'room',
    },
  },
});

module.exports = Room;
