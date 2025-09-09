const { EntitySchema } = require('typeorm');

const Post = new EntitySchema({
  name: 'Post',
  tableName: 'posts',
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
    content: {
      type: 'text',
      nullable: false,
    },
    slug: {
      type: 'varchar',
      unique: true,
      nullable: false,
    },
    status: {
      type: 'enum',
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: {
      type: 'timestamp',
      nullable: true,
    },
    authorId: {
      type: 'uuid',
      nullable: false,
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
      inverseSide: 'posts',
    },
    comments: {
      target: 'Comment',
      type: 'one-to-many',
      inverseSide: 'post',
    },
    tags: {
      target: 'Tag',
      type: 'many-to-many',
      joinTable: {
        name: 'post_tags',
        joinColumn: { name: 'postId' },
        inverseJoinColumn: { name: 'tagId' },
      },
    },
  },
});

module.exports = Post;
