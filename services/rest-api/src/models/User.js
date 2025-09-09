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
    posts: {
      target: 'Post',
      type: 'one-to-many',
      inverseSide: 'author',
    },
    comments: {
      target: 'Comment',
      type: 'one-to-many',
      inverseSide: 'author',
    },
  },
});

module.exports = User;
