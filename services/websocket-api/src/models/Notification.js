const { EntitySchema } = require('typeorm');

const Notification = new EntitySchema({
  name: 'Notification',
  tableName: 'notifications',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    title: {
      type: 'varchar',
      nullable: false,
    },
    message: {
      type: 'text',
      nullable: false,
    },
    type: {
      type: 'enum',
      enum: ['message', 'mention', 'system', 'invitation'],
      default: 'message',
    },
    userId: {
      type: 'uuid',
      nullable: false,
    },
    relatedId: {
      type: 'uuid',
      nullable: true,
    },
    relatedType: {
      type: 'varchar',
      nullable: true,
    },
    isRead: {
      type: 'boolean',
      default: false,
    },
    readAt: {
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
  },
  relations: {
    user: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'userId' },
      inverseSide: 'notifications',
    },
  },
});

module.exports = Notification;
