const { EntitySchema } = require('typeorm');

const Message = new EntitySchema({
  name: 'Message',
  tableName: 'messages',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    content: {
      type: 'text',
      nullable: false,
    },
    type: {
      type: 'enum',
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
    },
    senderId: {
      type: 'uuid',
      nullable: false,
    },
    roomId: {
      type: 'uuid',
      nullable: false,
    },
    replyToId: {
      type: 'uuid',
      nullable: true,
    },
    isEdited: {
      type: 'boolean',
      default: false,
    },
    editedAt: {
      type: 'timestamp',
      nullable: true,
    },
    isDeleted: {
      type: 'boolean',
      default: false,
    },
    deletedAt: {
      type: 'timestamp',
      nullable: true,
    },
    metadata: {
      type: 'jsonb',
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
    sender: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'senderId' },
      inverseSide: 'messages',
    },
    room: {
      target: 'Room',
      type: 'many-to-one',
      joinColumn: { name: 'roomId' },
      inverseSide: 'messages',
    },
    replyTo: {
      target: 'Message',
      type: 'many-to-one',
      joinColumn: { name: 'replyToId' },
    },
    replies: {
      target: 'Message',
      type: 'one-to-many',
      inverseSide: 'replyTo',
    },
  },
});

module.exports = Message;
