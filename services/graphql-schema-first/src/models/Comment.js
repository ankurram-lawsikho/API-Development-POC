const { EntitySchema } = require('typeorm');

const Comment = new EntitySchema({
  name: 'Comment',
  tableName: 'comments',
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
    authorId: {
      type: 'uuid',
      nullable: false,
    },
    postId: {
      type: 'uuid',
      nullable: false,
    },
    parentId: {
      type: 'uuid',
      nullable: true,
    },
    isApproved: {
      type: 'boolean',
      default: false,
    },
    likeCount: {
      type: 'integer',
      default: 0,
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
    author: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'authorId' },
      inverseSide: 'comments',
    },
    post: {
      target: 'Post',
      type: 'many-to-one',
      joinColumn: { name: 'postId' },
      inverseSide: 'comments',
    },
    parent: {
      target: 'Comment',
      type: 'many-to-one',
      joinColumn: { name: 'parentId' },
    },
    replies: {
      target: 'Comment',
      type: 'one-to-many',
      inverseSide: 'parent',
    },
  },
});

module.exports = Comment;
